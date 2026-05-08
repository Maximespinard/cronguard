export interface Ping {
  id: string;
  monitorId: string;
  receivedAt: Date;
  sourceIp: string;
  duration: number | null;
  metadata: Record<string, unknown>;
}
