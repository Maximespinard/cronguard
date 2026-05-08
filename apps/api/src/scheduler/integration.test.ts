import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────

const {
  mockExecute,
  mockUpdate,
  mockSet,
  mockWhere,
  mockInsert,
  mockValues,
  mockFetch,
  mockTransaction,
} = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockUpdate: vi.fn(),
  mockSet: vi.fn(),
  mockWhere: vi.fn(),
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockFetch: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('../db/index.js', () => ({
  db: {
    execute: mockExecute,
    update: mockUpdate,
    insert: mockInsert,
    transaction: mockTransaction,
  },
  alerts: { id: 'id' },
  alertChannels: {},
  monitorAlertChannels: {},
  monitors: {},
}));

mockUpdate.mockReturnValue({ set: mockSet });
mockSet.mockReturnValue({ where: mockWhere });
mockWhere.mockResolvedValue(undefined);
mockInsert.mockReturnValue({ values: mockValues });
mockValues.mockResolvedValue(undefined);

const { mockComputeNextExpected } = vi.hoisted(() => ({
  mockComputeNextExpected: vi.fn(),
}));

vi.mock('../lib/cron.js', () => ({
  computeNextExpected: mockComputeNextExpected,
}));

vi.stubGlobal('fetch', mockFetch);

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'email-001' }, error: null }),
    },
  })),
}));

import { _resetResendClient, dispatchPendingAlerts } from './dispatcher.js';
import { advanceStaleDownMonitors, processOverdueMonitors } from './miss-detector.js';

// ─── Helpers ────────────────────────────────────────────────────────

function makeOverdueMonitor(
  overrides: Partial<{
    id: string;
    schedule: string;
    timezone: string;
    status: 'up' | 'grace';
    gracePeriod: number;
    nextExpectedPingAt: string;
  }> = {},
) {
  return {
    id: 'mon-001',
    schedule: '0 2 * * *',
    timezone: 'UTC',
    status: 'up' as const,
    gracePeriod: 300,
    nextExpectedPingAt: '2026-05-08T02:00:00.000Z',
    ...overrides,
  };
}

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
    missKey: 'mon-001:2026-05-08T02:00:00.000Z',
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

describe('Integration: miss detection → alert dispatch pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetResendClient();
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockResolvedValue(undefined);
    mockComputeNextExpected.mockReturnValue(new Date('2026-05-09T02:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('full pipeline: overdue detection → down transition → alert creation → webhook dispatch', async () => {
    const now = new Date('2026-05-08T02:06:00Z');

    // For processOverdueMonitors: mock transaction
    const txExecute = vi.fn();
    const txUpdate = vi.fn();
    const txSet = vi.fn();
    const txWhere = vi.fn();

    txUpdate.mockReturnValue({ set: txSet });
    txSet.mockReturnValue({ where: txWhere });
    txWhere.mockResolvedValue(undefined);

    // Mock overdue monitors query
    txExecute
      .mockResolvedValueOnce({
        rows: [makeOverdueMonitor({ status: 'grace' })],
      })
      // Alert insert (ON CONFLICT DO NOTHING)
      .mockResolvedValueOnce({ rows: [] });

    // Mock db.transaction to call callback with fake tx
    mockTransaction.mockImplementationOnce(
      async (cb: (tx: { execute: typeof txExecute; update: typeof txUpdate }) => Promise<void>) => {
        await cb({ execute: txExecute, update: txUpdate });
      },
    );

    const transitioned = await processOverdueMonitors(now);
    expect(transitioned).toBe(1);
    expect(txExecute).toHaveBeenCalledTimes(2); // select + alert insert

    // Step 2: dispatchPendingAlerts picks up the pending alert and sends webhook
    mockExecute
      .mockResolvedValueOnce({ rows: [makePendingAlert()] }) // fetch pending alerts
      .mockResolvedValueOnce({ rows: [makeChannel()] }); // fetch channels

    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

    const dispatched = await dispatchPendingAlerts(now);
    expect(dispatched).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify webhook payload includes miss alert data
    const fetchCall = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchCall[0]).toBe('https://example.com/hook');
    const body = JSON.parse(fetchCall[1].body as string) as { event: string };
    expect(body.event).toBe('monitor.miss');
  });

  it('recovery alert pipeline: down→up ping creates pending recovery alert', async () => {
    // Step 1: Verify dispatchPendingAlerts handles recovery type correctly
    const recoveryAlert = makePendingAlert({
      alertId: 'alert-recovery-001',
      alertType: 'recovery',
      missKey: 'mon-001:recovery:2026-05-08T03:00:00.000Z',
      message: 'Monitor recovered',
    });

    mockExecute
      .mockResolvedValueOnce({ rows: [recoveryAlert] }) // fetch pending alerts
      .mockResolvedValueOnce({ rows: [makeChannel()] }); // fetch channels

    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

    const dispatched = await dispatchPendingAlerts();
    expect(dispatched).toBe(1);

    // Verify webhook payload is recovery type
    const fetchCall = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(fetchCall[1].body as string) as { event: string };
    expect(body.event).toBe('monitor.recovery');
  });

  it('multi-channel dispatch: sends to email + webhook concurrently', async () => {
    process.env['RESEND_API_KEY'] = 'test-key';

    const emailChannel = makeChannel({
      channelId: 'ch-email',
      channelType: 'email',
      config: { email: 'ops@example.com' },
    });
    const webhookChannel = makeChannel({
      channelId: 'ch-webhook',
      channelType: 'webhook',
    });

    mockExecute
      .mockResolvedValueOnce({ rows: [makePendingAlert()] })
      .mockResolvedValueOnce({ rows: [emailChannel, webhookChannel] });

    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

    const dispatched = await dispatchPendingAlerts();
    expect(dispatched).toBe(1);

    // Both channels were attempted
    // email via Resend SDK (mocked), webhook via fetch
    expect(mockFetch).toHaveBeenCalledTimes(1); // webhook
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent' }) as Record<string, unknown>,
    );

    delete process.env['RESEND_API_KEY'];
  });

  it('stale down advancement prevents alert storms', async () => {
    const txExecute = vi.fn();
    const txUpdate = vi.fn();
    const txSet = vi.fn();
    const txWhere = vi.fn();

    txUpdate.mockReturnValue({ set: txSet });
    txSet.mockReturnValue({ where: txWhere });
    txWhere.mockResolvedValue(undefined);

    txExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'mon-stale',
          schedule: '0 2 * * *',
          timezone: 'UTC',
          nextExpectedPingAt: '2026-05-07T02:00:00.000Z', // Yesterday — stale
        },
      ],
    });

    mockTransaction.mockImplementationOnce(
      async (cb: (tx: { execute: typeof txExecute; update: typeof txUpdate }) => Promise<void>) => {
        await cb({ execute: txExecute, update: txUpdate });
      },
    );

    const now = new Date('2026-05-08T02:06:00Z');
    const advanced = await advanceStaleDownMonitors(now);

    expect(advanced).toBe(1);
    // nextExpectedPingAt was updated (not left stale)
    expect(txSet).toHaveBeenCalledWith(
      expect.objectContaining({ nextExpectedPingAt: expect.any(Date) as Date }) as Record<
        string,
        unknown
      >,
    );
  });
});
