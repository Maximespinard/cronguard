// ─── Alert Formatters ──────────────────────────────────────────────
// Channel-specific message formatters for miss and recovery alerts.

export interface AlertContext {
  monitorName: string;
  monitorId: string;
  alertType: 'miss' | 'recovery';
  expectedAt: string; // ISO timestamp
  detectedAt: string; // ISO timestamp
  schedule: string;
  timezone: string;
}

// ─── Email ─────────────────────────────────────────────────────────

export interface EmailPayload {
  subject: string;
  html: string;
  text: string;
}

export function formatEmail(ctx: AlertContext): EmailPayload {
  const isMiss = ctx.alertType === 'miss';
  const emoji = isMiss ? '\u26a0\ufe0f' : '\u2705';
  const verb = isMiss ? 'missed' : 'recovered';

  return {
    subject: `${emoji} [CronGuard] ${ctx.monitorName} ${verb}`,
    html: [
      `<h2>${emoji} Monitor ${verb}</h2>`,
      `<p><strong>${ctx.monitorName}</strong> ${isMiss ? 'missed its expected ping' : 'is back online'}.</p>`,
      '<table style="border-collapse:collapse;margin:16px 0">',
      `<tr><td style="padding:4px 12px 4px 0;color:#666">Schedule</td><td>${ctx.schedule} (${ctx.timezone})</td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;color:#666">Expected at</td><td>${ctx.expectedAt}</td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;color:#666">Detected at</td><td>${ctx.detectedAt}</td></tr>`,
      '</table>',
      '<p style="color:#999;font-size:12px">CronGuard — Cron Job Monitoring</p>',
    ].join('\n'),
    text: [
      `${emoji} Monitor ${verb}: ${ctx.monitorName}`,
      '',
      `Schedule: ${ctx.schedule} (${ctx.timezone})`,
      `Expected at: ${ctx.expectedAt}`,
      `Detected at: ${ctx.detectedAt}`,
    ].join('\n'),
  };
}

// ─── Slack ─────────────────────────────────────────────────────────

export interface SlackPayload {
  text: string;
  blocks: unknown[];
}

export function formatSlack(ctx: AlertContext): SlackPayload {
  const isMiss = ctx.alertType === 'miss';
  const emoji = isMiss ? ':warning:' : ':white_check_mark:';
  const verb = isMiss ? 'missed' : 'recovered';
  const color = isMiss ? '#e74c3c' : '#2ecc71';

  return {
    text: `${emoji} ${ctx.monitorName} ${verb}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${ctx.monitorName}* ${isMiss ? 'missed its expected ping' : 'is back online'}`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Schedule:*\n${ctx.schedule} (${ctx.timezone})` },
          { type: 'mrkdwn', text: `*Expected:*\n${ctx.expectedAt}` },
          { type: 'mrkdwn', text: `*Detected:*\n${ctx.detectedAt}` },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_CronGuard_ | Alert type: \`${ctx.alertType}\` | Color: ${color}`,
          },
        ],
      },
    ],
  };
}

// ─── Discord ───────────────────────────────────────────────────────

export interface DiscordPayload {
  content: string;
  embeds: unknown[];
}

export function formatDiscord(ctx: AlertContext): DiscordPayload {
  const isMiss = ctx.alertType === 'miss';
  const verb = isMiss ? 'missed' : 'recovered';
  const color = isMiss ? 0xe74c3c : 0x2ecc71;

  return {
    content: '',
    embeds: [
      {
        title: `${isMiss ? '\u26a0\ufe0f' : '\u2705'} ${ctx.monitorName} ${verb}`,
        description: isMiss ? 'Monitor missed its expected ping.' : 'Monitor is back online.',
        color,
        fields: [
          { name: 'Schedule', value: `${ctx.schedule} (${ctx.timezone})`, inline: true },
          { name: 'Expected at', value: ctx.expectedAt, inline: true },
          { name: 'Detected at', value: ctx.detectedAt, inline: true },
        ],
        footer: { text: 'CronGuard' },
        timestamp: ctx.detectedAt,
      },
    ],
  };
}

// ─── Generic Webhook ───────────────────────────────────────────────

export interface WebhookPayload {
  event: 'monitor.miss' | 'monitor.recovery';
  monitor: {
    id: string;
    name: string;
    schedule: string;
    timezone: string;
  };
  alert: {
    type: 'miss' | 'recovery';
    expectedAt: string;
    detectedAt: string;
  };
}

export function formatWebhook(ctx: AlertContext): WebhookPayload {
  return {
    event: ctx.alertType === 'miss' ? 'monitor.miss' : 'monitor.recovery',
    monitor: {
      id: ctx.monitorId,
      name: ctx.monitorName,
      schedule: ctx.schedule,
      timezone: ctx.timezone,
    },
    alert: {
      type: ctx.alertType,
      expectedAt: ctx.expectedAt,
      detectedAt: ctx.detectedAt,
    },
  };
}
