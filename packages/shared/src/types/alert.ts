export const AlertChannel = {
  email: 'email',
  slack: 'slack',
  discord: 'discord',
  webhook: 'webhook',
} as const;

export type AlertChannel = (typeof AlertChannel)[keyof typeof AlertChannel];

export const AlertStatus = {
  pending: 'pending',
  sent: 'sent',
  failed: 'failed',
} as const;

export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];

export interface Alert {
  id: string;
  monitorId: string;
  channel: AlertChannel;
  status: AlertStatus;
  recipient: string;
  message: string;
  sentAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
}
