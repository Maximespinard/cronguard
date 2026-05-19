/**
 * API response types — match the actual JSON shapes returned by Express routes.
 * Dates come back as ISO strings from JSON serialization.
 */

export interface ApiMonitor {
  id: string;
  userId: string;
  name: string;
  slug: string;
  schedule: string;
  timezone: string;
  gracePeriod: number; // seconds
  status: 'new' | 'up' | 'down' | 'paused' | 'grace';
  lastPingAt: string | null;
  nextExpectedPingAt: string | null;
  alertSentAt: string | null;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPing {
  id: string;
  monitorId: string;
  kind: 'success' | 'start' | 'fail';
  sourceIp: string | null;
  duration: number | null;
  metadata: Record<string, unknown> | null;
  receivedAt: string;
}

export interface ApiAlertChannel {
  id: string;
  userId: string;
  type: 'email' | 'slack' | 'discord' | 'webhook';
  name: string;
  config: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Response envelopes ──────────────────────────────────────────

export interface MonitorListResponse {
  monitors: ApiMonitor[];
}

export interface MonitorDetailResponse {
  monitor: ApiMonitor;
  pings: ApiPing[];
}

export interface MonitorMutationResponse {
  monitor: ApiMonitor;
}

export interface ChannelListResponse {
  channels: ApiAlertChannel[];
}

export interface ChannelMutationResponse {
  channel: ApiAlertChannel;
}

export interface DeleteResponse {
  deleted: true;
  id: string;
}

export interface AssociateChannelsResponse {
  associated: string[];
}
