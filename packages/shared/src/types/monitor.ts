export const MonitorStatus = {
  up: 'up',
  down: 'down',
  paused: 'paused',
  new: 'new',
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

export interface CreateMonitorInput {
  name: string;
  schedule: string;
  gracePeriod?: number;
  timezone?: string;
}

export interface UpdateMonitorInput {
  name?: string;
  schedule?: string;
  gracePeriod?: number;
  timezone?: string;
  status?: MonitorStatus;
}
