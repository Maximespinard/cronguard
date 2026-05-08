import { describe, expect, it } from 'vitest';

import type { AlertContext } from './formatters.js';
import { formatDiscord, formatEmail, formatSlack, formatWebhook } from './formatters.js';

const missCtx: AlertContext = {
  monitorName: 'Nightly Backup',
  monitorId: 'mon-001',
  alertType: 'miss',
  expectedAt: '2026-05-08T02:00:00Z',
  detectedAt: '2026-05-08T02:06:00Z',
  schedule: '0 2 * * *',
  timezone: 'UTC',
};

const recoveryCtx: AlertContext = {
  ...missCtx,
  alertType: 'recovery',
};

describe('formatEmail', () => {
  it('formats miss alert with warning emoji in subject', () => {
    const result = formatEmail(missCtx);

    expect(result.subject).toContain('Nightly Backup');
    expect(result.subject).toContain('missed');
    expect(result.subject).toContain('\u26a0\ufe0f');
    expect(result.html).toContain('missed its expected ping');
    expect(result.text).toContain('0 2 * * *');
  });

  it('formats recovery alert with check emoji in subject', () => {
    const result = formatEmail(recoveryCtx);

    expect(result.subject).toContain('recovered');
    expect(result.subject).toContain('\u2705');
    expect(result.html).toContain('back online');
  });
});

describe('formatSlack', () => {
  it('returns blocks with monitor name and schedule', () => {
    const result = formatSlack(missCtx);

    expect(result.text).toContain('Nightly Backup');
    expect(result.text).toContain('missed');
    expect(result.blocks).toHaveLength(3);
  });

  it('formats recovery with check mark', () => {
    const result = formatSlack(recoveryCtx);

    expect(result.text).toContain(':white_check_mark:');
    expect(result.text).toContain('recovered');
  });
});

describe('formatDiscord', () => {
  it('returns embed with red color for miss', () => {
    const result = formatDiscord(missCtx);

    expect(result.embeds).toHaveLength(1);
    const embed = result.embeds[0] as Record<string, unknown>;
    expect(embed['color']).toBe(0xe74c3c);
    expect(embed['title']).toContain('missed');
  });

  it('returns embed with green color for recovery', () => {
    const result = formatDiscord(recoveryCtx);

    const embed = result.embeds[0] as Record<string, unknown>;
    expect(embed['color']).toBe(0x2ecc71);
  });
});

describe('formatWebhook', () => {
  it('returns structured payload with monitor.miss event', () => {
    const result = formatWebhook(missCtx);

    expect(result.event).toBe('monitor.miss');
    expect(result.monitor.id).toBe('mon-001');
    expect(result.monitor.name).toBe('Nightly Backup');
    expect(result.alert.type).toBe('miss');
    expect(result.alert.expectedAt).toBe('2026-05-08T02:00:00Z');
  });

  it('returns monitor.recovery event for recovery', () => {
    const result = formatWebhook(recoveryCtx);

    expect(result.event).toBe('monitor.recovery');
    expect(result.alert.type).toBe('recovery');
  });
});
