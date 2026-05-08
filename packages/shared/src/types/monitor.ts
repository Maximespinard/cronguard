export const MonitorStatus = {
  new: 'new',
  up: 'up',
  grace: 'grace',
  down: 'down',
  paused: 'paused',
} as const;

export type MonitorStatus = (typeof MonitorStatus)[keyof typeof MonitorStatus];

export interface Monitor {
  id: string;
  userId: string;
  name: string;
  slug: string;
  schedule: string;
  gracePeriod: number;
  timezone: string;
  status: MonitorStatus;
  lastPing: Date | null;
  nextExpectedPing: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
