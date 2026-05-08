import { Link } from '@tanstack/react-router';
import { Clock, ExternalLink, Plus, Radio } from 'lucide-react';

import { useMonitors } from '../../hooks/use-monitors';
import type { ApiMonitor } from '../../lib/api-types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { StatusBadge } from '../ui/status-badge';

import { CreateMonitorDialog } from './create-monitor-dialog';

// ─── Helpers ──────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const ms = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${String(seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${String(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `${String(days)}d ago`;
}

function MonitorCard({ monitor }: { monitor: ApiMonitor }) {
  return (
    <Link
      to="/monitors/$id"
      params={{ id: monitor.id }}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-zinc-800/50 bg-surface-1 p-4 transition-all duration-200',
        'hover:border-zinc-700/70 hover:bg-surface-1/80 hover:shadow-lg hover:shadow-black/20',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-semibold text-zinc-100 group-hover:text-brand-300 transition-colors">
            {monitor.name}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">{monitor.schedule}</p>
        </div>
        <StatusBadge status={monitor.status} />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Radio className="h-3 w-3" />
          {timeAgo(monitor.lastPingAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {monitor.timezone}
        </span>
      </div>

      {/* Ping URL hint */}
      <div className="flex items-center gap-1.5 rounded-md bg-surface-0 px-2.5 py-1.5 font-mono text-xs text-zinc-500">
        <ExternalLink className="h-3 w-3 shrink-0" />
        <span className="truncate">/api/ping/{monitor.slug}</span>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-surface-1/30 px-6 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
        <Radio className="h-6 w-6 text-brand-400" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-zinc-200">No monitors yet</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-zinc-500">
        Create your first monitor to start tracking a cron job. You&apos;ll get a unique ping URL to
        call from your scheduled task.
      </p>
      <CreateMonitorDialog>
        <Button className="mt-5" size="sm">
          <Plus className="h-4 w-4" />
          Create Monitor
        </Button>
      </CreateMonitorDialog>
    </div>
  );
}

// ─── Monitor List ─────────────────────────────────────────────────

export function MonitorList() {
  const { data } = useMonitors();
  const monitors = data.monitors;

  if (monitors.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <CreateMonitorDialog>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Create Monitor
          </Button>
        </CreateMonitorDialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {monitors.map((monitor) => (
          <MonitorCard key={monitor.id} monitor={monitor} />
        ))}
      </div>
    </div>
  );
}
