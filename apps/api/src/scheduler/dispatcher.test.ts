import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────

const { mockExecute, mockUpdate, mockSet, mockWhere, mockFetch } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockUpdate: vi.fn(),
  mockSet: vi.fn(),
  mockWhere: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('../db/index.js', () => ({
  db: {
    execute: mockExecute,
    update: mockUpdate,
  },
  alerts: { id: 'id' },
  alertChannels: {},
  monitorAlertChannels: {},
  monitors: {},
}));

mockUpdate.mockReturnValue({ set: mockSet });
mockSet.mockReturnValue({ where: mockWhere });
mockWhere.mockResolvedValue(undefined);

vi.stubGlobal('fetch', mockFetch);

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'email-001' }, error: null }),
    },
  })),
}));

import { _internals, _resetResendClient, dispatchPendingAlerts } from './dispatcher.js';

// ─── Helpers ────────────────────────────────────────────────────────

function makePendingAlert(
  overrides: Partial<{
    alertId: string;
    monitorId: string;
    monitorName: string;
    missKey: string;
    alertType: 'miss' | 'recovery';
    message: string;
    schedule: string;
    timezone: string;
    expectedAt: string;
    createdAt: string;
  }> = {},
) {
  return {
    alertId: 'alert-001',
    monitorId: 'mon-001',
    monitorName: 'Nightly Backup',
    missKey: 'mon-001:2026-05-08T02:00:00Z',
    alertType: 'miss' as const,
    message: 'Monitor missed expected ping',
    schedule: '0 2 * * *',
    timezone: 'UTC',
    expectedAt: '2026-05-08T02:00:00Z',
    createdAt: '2026-05-08T02:06:00Z',
    ...overrides,
  };
}

function makeChannel(
  overrides: Partial<{
    channelId: string;
    channelType: 'email' | 'slack' | 'discord' | 'webhook';
    config: Record<string, unknown>;
    isEnabled: boolean;
  }> = {},
) {
  return {
    channelId: 'ch-001',
    channelType: 'webhook' as const,
    config: { webhookUrl: 'https://example.com/hook' },
    isEnabled: true,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('dispatchPendingAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetResendClient();
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 0 when no pending alerts', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] });

    const count = await dispatchPendingAlerts();

    expect(count).toBe(0);
  });

  it('marks alert as failed when no channels configured', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [makePendingAlert()] }) // pending alerts
      .mockResolvedValueOnce({ rows: [] }); // channels query

    const now = new Date('2026-05-08T02:07:00Z');
    const count = await dispatchPendingAlerts(now);

    expect(count).toBe(1);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        failureReason: 'No enabled alert channels configured for monitor',
      }),
    );
  });

  it('dispatches webhook alert and marks as sent', async () => {
    const channel = makeChannel({ channelType: 'webhook' });

    mockExecute
      .mockResolvedValueOnce({ rows: [makePendingAlert()] })
      .mockResolvedValueOnce({ rows: [channel] });

    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

    const now = new Date('2026-05-08T02:07:00Z');
    const count = await dispatchPendingAlerts(now);

    expect(count).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        alertChannelId: 'ch-001',
      }),
    );
  });

  it('dispatches to slack channel via fetch', async () => {
    const channel = makeChannel({
      channelType: 'slack',
      config: { webhookUrl: 'https://hooks.slack.com/xxx' },
    });

    mockExecute
      .mockResolvedValueOnce({ rows: [makePendingAlert()] })
      .mockResolvedValueOnce({ rows: [channel] });

    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('ok') });

    const count = await dispatchPendingAlerts();

    expect(count).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/xxx',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('dispatches to discord channel via fetch', async () => {
    const channel = makeChannel({
      channelType: 'discord',
      config: { webhookUrl: 'https://discord.com/api/webhooks/xxx' },
    });

    mockExecute
      .mockResolvedValueOnce({ rows: [makePendingAlert()] })
      .mockResolvedValueOnce({ rows: [channel] });

    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

    const count = await dispatchPendingAlerts();

    expect(count).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/xxx',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('marks alert failed when all channels fail', async () => {
    const channel = makeChannel({ channelType: 'webhook' });

    mockExecute
      .mockResolvedValueOnce({ rows: [makePendingAlert()] })
      .mockResolvedValueOnce({ rows: [channel] });

    // Webhook fails all 3 retry attempts
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const now = new Date('2026-05-08T02:07:00Z');
    const count = await dispatchPendingAlerts(now);

    expect(count).toBe(1);
    // fetch called 3 times (3 retries)
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        failureReason: expect.stringContaining('All channels failed') as unknown as string,
      }),
    );
  });

  it('handles multiple pending alerts in one batch', async () => {
    mockExecute
      .mockResolvedValueOnce({
        rows: [
          makePendingAlert({ alertId: 'alert-001', monitorId: 'mon-001' }),
          makePendingAlert({ alertId: 'alert-002', monitorId: 'mon-002' }),
        ],
      })
      .mockResolvedValueOnce({ rows: [makeChannel()] }) // channels for mon-001
      .mockResolvedValueOnce({ rows: [makeChannel({ channelId: 'ch-002' })] }); // channels for mon-002

    mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('') });

    const count = await dispatchPendingAlerts();

    expect(count).toBe(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('succeeds if at least one channel works when multiple configured', async () => {
    const webhookChannel = makeChannel({ channelId: 'ch-001', channelType: 'webhook' });
    const slackChannel = makeChannel({
      channelId: 'ch-002',
      channelType: 'slack',
      config: { webhookUrl: 'https://hooks.slack.com/xxx' },
    });

    mockExecute
      .mockResolvedValueOnce({ rows: [makePendingAlert()] })
      .mockResolvedValueOnce({ rows: [webhookChannel, slackChannel] });

    // Webhook fails, Slack succeeds
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('fail') }) // webhook attempt 1
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('fail') }) // webhook attempt 2
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('fail') }) // webhook attempt 3
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('ok') }); // slack

    const count = await dispatchPendingAlerts();

    expect(count).toBe(1);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        alertChannelId: 'ch-002', // slack succeeded
      }),
    );
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns on first success without retry', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const promise = _internals.withRetry(fn, 'test');
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure up to MAX_RETRIES', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('fail 3'));

    const promise = _internals.withRetry(fn, 'test');
    // Prevent unhandled rejection before fake timers resolve
    promise.catch(() => {});

    // Advance through retry delays
    await vi.advanceTimersByTimeAsync(1_000); // 1s delay
    await vi.advanceTimersByTimeAsync(2_000); // 2s delay

    await expect(promise).rejects.toThrow('fail 3');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
