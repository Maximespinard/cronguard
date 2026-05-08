export const PingKind = {
  success: 'success',
  start: 'start',
  fail: 'fail',
} as const;

export type PingKind = (typeof PingKind)[keyof typeof PingKind];

export interface Ping {
  id: string;
  monitorId: string;
  kind: PingKind;
  receivedAt: Date;
  sourceIp: string | null;
  duration: number | null;
  metadata: Record<string, unknown> | null;
}
