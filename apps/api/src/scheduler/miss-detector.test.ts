import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────

// Mock db module before importing miss-detector
const mockExecute = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

vi.mock('../db/index.js', () => ({
  db: {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        execute: mockExecute,
        update: () => ({ set: mockSet }),
      });
    }),
  },
  monitors: { id: 'id' },
}));

// Chain: tx.update(monitors).set({...}).where(eq(...))
mockSet.mockReturnValue({ where: mockWhere });
mockWhere.mockResolvedValue(undefined);

vi.mock('../lib/cron.js', () => ({
  computeNextExpected: vi.fn(() => new Date('2026-05-08T13:00:00Z')),
}));

import { advanceStaleDownMonitors, processOverdueMonitors } from './miss-detector.js';

// ─── Helpers ────────────────────────────────────────────────────────

function makeOverdueRow(
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
    schedule: '*/5 * * * *',
    timezone: 'UTC',
    status: 'up' as const,
    gracePeriod: 300,
    nextExpectedPingAt: '2026-05-08T12:00:00Z',
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('processOverdueMonitors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('transitions up→grace when within grace period', async () => {
    const expectedAt = new Date('2026-05-08T12:00:00Z');
    // now is 2 minutes after expected, but grace is 5 minutes → still in grace
    const now = new Date(expectedAt.getTime() + 2 * 60_000);

    mockExecute.mockResolvedValueOnce({
      rows: [makeOverdueRow({ status: 'up' })],
    });

    const count = await processOverdueMonitors(now);

    expect(count).toBe(1);
    // Should set status to 'grace'
    expect(mockSet).toHaveBeenCalledWith({ status: 'grace' });
    // Should NOT insert an alert (only 1 execute call — the SELECT)
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('transitions grace→down when grace period expired', async () => {
    const expectedAt = new Date('2026-05-08T12:00:00Z');
    // now is 10 minutes after expected, grace is 5 minutes → expired
    const now = new Date(expectedAt.getTime() + 10 * 60_000);

    mockExecute
      .mockResolvedValueOnce({
        rows: [makeOverdueRow({ status: 'grace' })],
      })
      .mockResolvedValueOnce({ rows: [] }); // alert INSERT

    const count = await processOverdueMonitors(now);

    expect(count).toBe(1);
    // Should set status to 'down' and alertSentAt
    expect(mockSet).toHaveBeenCalledWith({ status: 'down', alertSentAt: now });
    // Should insert an alert (SELECT + INSERT = 2 execute calls)
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it('transitions up→down directly when grace already expired', async () => {
    const expectedAt = new Date('2026-05-08T12:00:00Z');
    const now = new Date(expectedAt.getTime() + 10 * 60_000);

    mockExecute
      .mockResolvedValueOnce({
        rows: [makeOverdueRow({ status: 'up' })],
      })
      .mockResolvedValueOnce({ rows: [] });

    const count = await processOverdueMonitors(now);

    expect(count).toBe(1);
    expect(mockSet).toHaveBeenCalledWith({ status: 'down', alertSentAt: now });
  });

  it('skips grace monitors still within grace window', async () => {
    const expectedAt = new Date('2026-05-08T12:00:00Z');
    // Within grace period, already in grace state → no transition
    const now = new Date(expectedAt.getTime() + 2 * 60_000);

    mockExecute.mockResolvedValueOnce({
      rows: [makeOverdueRow({ status: 'grace' })],
    });

    const count = await processOverdueMonitors(now);

    expect(count).toBe(0);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('handles empty result set', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] });

    const count = await processOverdueMonitors(new Date());

    expect(count).toBe(0);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('processes multiple monitors in one cycle', async () => {
    const expectedAt = new Date('2026-05-08T12:00:00Z');
    const now = new Date(expectedAt.getTime() + 10 * 60_000);

    mockExecute
      .mockResolvedValueOnce({
        rows: [
          makeOverdueRow({ id: 'mon-001', status: 'up' }),
          makeOverdueRow({ id: 'mon-002', status: 'grace' }),
        ],
      })
      .mockResolvedValue({ rows: [] }); // alert INSERTs

    const count = await processOverdueMonitors(now);

    expect(count).toBe(2);
  });
});

describe('advanceStaleDownMonitors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('advances nextExpectedPingAt for stale down monitors', async () => {
    const now = new Date('2026-05-08T12:30:00Z');

    mockExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'mon-001',
          schedule: '*/5 * * * *',
          timezone: 'UTC',
          nextExpectedPingAt: '2026-05-08T12:00:00Z',
        },
      ],
    });

    const count = await advanceStaleDownMonitors(now);

    expect(count).toBe(1);
    expect(mockSet).toHaveBeenCalledWith({
      nextExpectedPingAt: new Date('2026-05-08T13:00:00Z'),
    });
  });

  it('handles empty result set', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] });

    const count = await advanceStaleDownMonitors(new Date());

    expect(count).toBe(0);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('continues processing after cron parse failure', async () => {
    const { computeNextExpected } = await import('../lib/cron.js');
    const mockedCompute = vi.mocked(computeNextExpected);

    mockedCompute
      .mockImplementationOnce(() => {
        throw new Error('Invalid cron');
      })
      .mockReturnValueOnce(new Date('2026-05-08T13:00:00Z'));

    mockExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'mon-bad',
          schedule: 'invalid',
          timezone: 'UTC',
          nextExpectedPingAt: '2026-05-08T12:00:00Z',
        },
        {
          id: 'mon-ok',
          schedule: '*/5 * * * *',
          timezone: 'UTC',
          nextExpectedPingAt: '2026-05-08T12:00:00Z',
        },
      ],
    });

    const count = await advanceStaleDownMonitors(new Date('2026-05-08T12:30:00Z'));

    // Only the second one succeeds
    expect(count).toBe(1);
    expect(mockSet).toHaveBeenCalledTimes(1);
  });
});
