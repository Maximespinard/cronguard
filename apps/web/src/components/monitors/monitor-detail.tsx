import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { useDeleteMonitor, useMonitor } from '../../hooks/use-monitors';
import type { ApiMonitor, ApiPing } from '../../lib/api-types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { StatusBadge } from '../ui/status-badge';

import { EditMonitorDialog } from './edit-monitor-dialog';

// ─── Helpers ──────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

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

function gracePeriodLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes)} min`;
}

// ─── Status Card ──────────────────────────────────────────────────

function StatusCard({ monitor }: { monitor: ApiMonitor }) {
  const [copied, setCopied] = useState(false);
  const pingUrl = `${window.location.origin}/api/ping/${monitor.slug}`;

  function copyUrl() {
    void navigator.clipboard.writeText(pingUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-surface-1 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="truncate font-display text-xl font-semibold text-zinc-50">
              {monitor.name}
            </h1>
            <StatusBadge status={monitor.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-zinc-400">{monitor.schedule}</p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Clock className="h-3 w-3" />
            Last Ping
          </span>
          <span className="text-sm text-zinc-200">{timeAgo(monitor.lastPingAt)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Calendar className="h-3 w-3" />
            Next Expected
          </span>
          <span className="text-sm text-zinc-200">{formatDate(monitor.nextExpectedPingAt)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Globe className="h-3 w-3" />
            Timezone
          </span>
          <span className="text-sm text-zinc-200">{monitor.timezone}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Clock className="h-3 w-3" />
            Grace Period
          </span>
          <span className="text-sm text-zinc-200">{gracePeriodLabel(monitor.gracePeriod)}</span>
        </div>
      </div>

      {/* Ping URL */}
      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">Ping URL</label>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-surface-0 px-3 py-2 font-mono text-xs text-zinc-300">
            <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500" />
            <span className="truncate">{pingUrl}</span>
          </div>
          <Button variant="outline" size="icon" onClick={copyUrl} aria-label="Copy ping URL">
            <Copy className={cn('h-3.5 w-3.5', copied && 'text-emerald-400')} />
          </Button>
        </div>
        {copied && <p className="mt-1 text-xs text-emerald-400">Copied to clipboard</p>}
      </div>
    </div>
  );
}

// ─── Ping Timeline ────────────────────────────────────────────────

const PING_KIND_STYLES = {
  success: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Success' },
  start: { dot: 'bg-sky-400', text: 'text-sky-400', label: 'Start' },
  fail: { dot: 'bg-rose-400', text: 'text-rose-400', label: 'Fail' },
} as const;

function PingTimeline({ pings }: { pings: ApiPing[] }) {
  if (pings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-surface-1/30 px-6 py-12">
        <p className="text-sm text-zinc-500">No pings received yet.</p>
        <p className="mt-1 text-xs text-zinc-600">
          Send a request to the ping URL to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-surface-1 overflow-hidden">
      <div className="border-b border-zinc-800/50 px-5 py-3">
        <h2 className="font-display text-sm font-semibold text-zinc-200">
          Recent Pings
          <span className="ml-2 text-xs font-normal text-zinc-500">
            Last {String(pings.length)}
          </span>
        </h2>
      </div>

      <div className="divide-y divide-zinc-800/30">
        {pings.map((ping) => {
          const style = PING_KIND_STYLES[ping.kind];
          return (
            <div
              key={ping.id}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-0/50"
            >
              <span className={cn('h-2 w-2 rounded-full shrink-0', style.dot)} />
              <span className={cn('w-16 text-xs font-medium', style.text)}>{style.label}</span>
              <span className="flex-1 font-mono text-xs text-zinc-400">
                {formatDate(ping.receivedAt)}
              </span>
              {ping.sourceIp && (
                <span className="font-mono text-xs text-zinc-600">{ping.sourceIp}</span>
              )}
              {ping.duration !== null && (
                <span className="font-mono text-xs text-zinc-500">{String(ping.duration)}ms</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────

function DeleteMonitorDialog({ monitor }: { monitor: ApiMonitor }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const deleteMonitor = useDeleteMonitor();

  function handleDelete() {
    deleteMonitor.mutate(monitor.id, {
      onSuccess: () => {
        void navigate({ to: '/monitors' });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Monitor</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{monitor.name}</strong>? This will remove all
            ping history and alert data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteMonitor.isPending}>
            {deleteMonitor.isPending ? 'Deleting...' : 'Delete Monitor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Monitor Detail ───────────────────────────────────────────────

export function MonitorDetail({ id }: { id: string }) {
  const { data } = useMonitor(id);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="animate-fade-in space-y-5">
      {/* Back + actions bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/monitors"
          className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Monitors
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <DeleteMonitorDialog monitor={data.monitor} />
        </div>
      </div>

      <StatusCard monitor={data.monitor} />
      <PingTimeline pings={data.pings} />

      <EditMonitorDialog monitor={data.monitor} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
