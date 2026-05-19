import type { ApiAlertChannel, ApiMonitor } from '../lib/api-types';

export function makeMonitor(overrides: Partial<ApiMonitor> = {}): ApiMonitor {
  return {
    id: 'mon_1',
    userId: 'user_1',
    name: 'Daily backup',
    slug: 'daily-backup',
    schedule: '0 2 * * *',
    timezone: 'UTC',
    gracePeriod: 300,
    status: 'up',
    lastPingAt: new Date(Date.now() - 60_000).toISOString(),
    nextExpectedPingAt: new Date(Date.now() + 3_600_000).toISOString(),
    alertSentAt: null,
    isPaused: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function makeAlertChannel(overrides: Partial<ApiAlertChannel> = {}): ApiAlertChannel {
  return {
    id: 'ch_1',
    userId: 'user_1',
    type: 'email',
    name: 'Ops email',
    config: { to: 'ops@example.com' },
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    ...overrides,
  };
}
