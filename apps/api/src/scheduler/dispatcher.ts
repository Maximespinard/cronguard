import { eq, sql } from 'drizzle-orm';
import { Resend } from 'resend';

import { alerts, db } from '../db/index.js';

import type { AlertContext } from './formatters.js';
import { formatDiscord, formatEmail, formatSlack, formatWebhook } from './formatters.js';

// ─── Constants ──────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;
const BATCH_SIZE = 50;

// ─── Types ──────────────────────────────────────────────────────────

interface PendingAlertRow {
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
}

interface ChannelRow {
  channelId: string;
  channelType: 'email' | 'slack' | 'discord' | 'webhook';
  config: Record<string, unknown>;
  isEnabled: boolean;
}

interface SendResult {
  channelId: string;
  success: boolean;
  error?: string;
}

// ─── Resend Client (lazy init) ─────────────────────────────────────

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env['RESEND_API_KEY'];
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/** Exposed for testing — reset the singleton. */
export function _resetResendClient(): void {
  resendClient = null;
}

// ─── Retry Helper ──────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(
          `[dispatcher] ${label} attempt ${String(attempt)}/${String(MAX_RETRIES)} failed: ${lastError.message}. Retrying in ${String(delay)}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error(`${label} failed after ${String(MAX_RETRIES)} attempts`);
}

// ─── Channel Senders ───────────────────────────────────────────────

async function sendEmail(config: Record<string, unknown>, ctx: AlertContext): Promise<void> {
  const email = config['email'] as string | undefined;
  if (!email) throw new Error('Email channel missing email address');

  const payload = formatEmail(ctx);
  const fromAddress = process.env['RESEND_FROM_EMAIL'] ?? 'alerts@cronguard.dev';

  const resend = getResendClient();
  const result = await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (result.error) {
    throw new Error(`Resend API error: ${result.error.message}`);
  }
}

async function sendSlack(config: Record<string, unknown>, ctx: AlertContext): Promise<void> {
  const webhookUrl = config['webhookUrl'] as string | undefined;
  if (!webhookUrl) throw new Error('Slack channel missing webhookUrl');

  const payload = formatSlack(ctx);
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack webhook failed (${String(response.status)}): ${body}`);
  }
}

async function sendDiscord(config: Record<string, unknown>, ctx: AlertContext): Promise<void> {
  const webhookUrl = config['webhookUrl'] as string | undefined;
  if (!webhookUrl) throw new Error('Discord channel missing webhookUrl');

  const payload = formatDiscord(ctx);
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord webhook failed (${String(response.status)}): ${body}`);
  }
}

async function sendWebhook(config: Record<string, unknown>, ctx: AlertContext): Promise<void> {
  const webhookUrl = config['webhookUrl'] as string | undefined;
  if (!webhookUrl) throw new Error('Webhook channel missing webhookUrl');

  const payload = formatWebhook(ctx);
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Webhook failed (${String(response.status)}): ${body}`);
  }
}

// ─── Dispatch to Single Channel ────────────────────────────────────

async function dispatchToChannel(
  channel: ChannelRow,
  ctx: AlertContext,
  alertId: string,
): Promise<SendResult> {
  const label = `alert=${alertId} channel=${channel.channelId} type=${channel.channelType}`;

  try {
    await withRetry(async () => {
      switch (channel.channelType) {
        case 'email':
          await sendEmail(channel.config, ctx);
          break;
        case 'slack':
          await sendSlack(channel.config, ctx);
          break;
        case 'discord':
          await sendDiscord(channel.config, ctx);
          break;
        case 'webhook':
          await sendWebhook(channel.config, ctx);
          break;
      }
    }, label);

    return { channelId: channel.channelId, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[dispatcher] Failed after ${String(MAX_RETRIES)} attempts: ${label} — ${message}`,
    );
    return { channelId: channel.channelId, success: false, error: message };
  }
}

// ─── Fetch Pending Alerts ──────────────────────────────────────────

async function fetchPendingAlerts(): Promise<PendingAlertRow[]> {
  const result = await db.execute(sql`
    SELECT
      a.id            AS "alertId",
      a.monitor_id    AS "monitorId",
      m.name          AS "monitorName",
      a.miss_key      AS "missKey",
      a.type          AS "alertType",
      a.message,
      m.schedule,
      m.timezone,
      m.next_expected_ping_at AS "expectedAt",
      a.created_at    AS "createdAt"
    FROM alerts a
    JOIN monitors m ON m.id = a.monitor_id
    WHERE a.status = 'pending'
    ORDER BY a.created_at ASC
    LIMIT ${BATCH_SIZE}
  `);

  return result.rows as unknown as PendingAlertRow[];
}

// ─── Fetch Channels for Monitor ────────────────────────────────────

async function fetchChannelsForMonitor(monitorId: string): Promise<ChannelRow[]> {
  const result = await db.execute(sql`
    SELECT
      ac.id         AS "channelId",
      ac.type       AS "channelType",
      ac.config,
      ac.is_enabled AS "isEnabled"
    FROM alert_channels ac
    JOIN monitor_alert_channels mac ON mac.alert_channel_id = ac.id
    WHERE mac.monitor_id = ${monitorId}
      AND ac.is_enabled = true
  `);

  return result.rows as unknown as ChannelRow[];
}

// ─── Mark Alert Status ─────────────────────────────────────────────

async function markAlertSent(alertId: string, channelId: string, now: Date): Promise<void> {
  await db
    .update(alerts)
    .set({
      status: 'sent',
      alertChannelId: channelId,
      sentAt: now,
    })
    .where(eq(alerts.id, alertId));
}

async function markAlertFailed(alertId: string, reason: string, now: Date): Promise<void> {
  await db
    .update(alerts)
    .set({
      status: 'failed',
      failedAt: now,
      failureReason: reason,
    })
    .where(eq(alerts.id, alertId));
}

// ─── Main Dispatch Cycle ───────────────────────────────────────────

/**
 * Process all pending alerts: fetch channels, format, send, mark status.
 * Returns the number of alerts processed.
 */
export async function dispatchPendingAlerts(now: Date = new Date()): Promise<number> {
  const pendingAlerts = await fetchPendingAlerts();

  if (pendingAlerts.length === 0) return 0;

  let dispatched = 0;

  for (const alert of pendingAlerts) {
    const channels = await fetchChannelsForMonitor(alert.monitorId);

    if (channels.length === 0) {
      // No channels configured — mark alert as failed with explanation
      await markAlertFailed(alert.alertId, 'No enabled alert channels configured for monitor', now);
      console.warn(
        `[dispatcher] No channels for monitor=${alert.monitorId} alert=${alert.alertId}`,
      );
      dispatched++;
      continue;
    }

    const ctx: AlertContext = {
      monitorName: alert.monitorName,
      monitorId: alert.monitorId,
      alertType: alert.alertType,
      expectedAt: alert.expectedAt,
      detectedAt: alert.createdAt,
      schedule: alert.schedule,
      timezone: alert.timezone,
    };

    // Dispatch to all channels concurrently
    const results = await Promise.allSettled(
      channels.map((ch) => dispatchToChannel(ch, ctx, alert.alertId)),
    );

    // Evaluate results — alert is "sent" if at least one channel succeeded
    const settled = results
      .filter((r): r is PromiseFulfilledResult<SendResult> => r.status === 'fulfilled')
      .map((r) => r.value);

    const firstSuccess = settled.find((r) => r.success);
    const failures = settled.filter((r) => !r.success);

    if (firstSuccess) {
      await markAlertSent(alert.alertId, firstSuccess.channelId, now);
      console.log(
        `[dispatcher] Sent alert=${alert.alertId} via channel=${firstSuccess.channelId} (${String(settled.length - failures.length)}/${String(channels.length)} channels succeeded)`,
      );
    } else {
      const reasons = failures.map((f) => `${f.channelId}: ${f.error ?? 'unknown'}`).join('; ');
      await markAlertFailed(alert.alertId, `All channels failed: ${reasons}`, now);
      console.error(`[dispatcher] All channels failed for alert=${alert.alertId}: ${reasons}`);
    }

    dispatched++;
  }

  return dispatched;
}

// ─── Exported for testing ──────────────────────────────────────────

export const _internals = {
  fetchPendingAlerts,
  fetchChannelsForMonitor,
  markAlertSent,
  markAlertFailed,
  dispatchToChannel,
  sendEmail,
  sendSlack,
  sendDiscord,
  sendWebhook,
  withRetry,
  BATCH_SIZE,
  MAX_RETRIES,
};
