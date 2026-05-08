import { Bell, Mail, MessageSquare, Plus, Webhook } from 'lucide-react';
import { useState } from 'react';

import { useAlertChannels, useDeleteAlertChannel } from '../../hooks/use-alert-channels';
import type { ApiAlertChannel } from '../../lib/api-types';
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

import { CreateChannelDialog } from './create-channel-dialog';

// ─── Channel type config ──────────────────────────────────────────

const CHANNEL_TYPE_CONFIG = {
  email: {
    icon: Mail,
    label: 'Email',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
  },
  slack: {
    icon: MessageSquare,
    label: 'Slack',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  discord: {
    icon: MessageSquare,
    label: 'Discord',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
  },
  webhook: {
    icon: Webhook,
    label: 'Webhook',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
} as const;

// ─── Channel card ─────────────────────────────────────────────────

function ChannelCard({
  channel,
  onDelete,
}: {
  channel: ApiAlertChannel;
  onDelete: (id: string) => void;
}) {
  const config = CHANNEL_TYPE_CONFIG[channel.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-800/50 bg-surface-1 px-5 py-4 transition-all hover:border-zinc-700/70">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', config.bg)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-zinc-100">{channel.name}</h3>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              channel.isEnabled
                ? 'bg-emerald-400/10 text-emerald-400'
                : 'bg-zinc-500/10 text-zinc-500',
            )}
          >
            {channel.isEnabled ? 'Active' : 'Disabled'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {config.label} &middot; Created{' '}
          {new Date(channel.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-zinc-500 hover:text-rose-400"
        onClick={() => {
          onDelete(channel.id);
        }}
      >
        Delete
      </Button>
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────

function DeleteChannelDialog({
  channelId,
  open,
  onOpenChange,
}: {
  channelId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteChannel = useDeleteAlertChannel();

  function handleDelete() {
    if (!channelId) return;
    deleteChannel.mutate(channelId, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Alert Channel</DialogTitle>
          <DialogDescription>
            Are you sure? Monitors using this channel will no longer receive alerts through it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteChannel.isPending}>
            {deleteChannel.isPending ? 'Deleting...' : 'Delete Channel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty state ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-surface-1/30 px-6 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
        <Bell className="h-6 w-6 text-brand-400" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-zinc-200">No alert channels</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-zinc-500">
        Set up your first alert channel to receive notifications when a cron job misses its
        schedule.
      </p>
      <CreateChannelDialog>
        <Button className="mt-5" size="sm">
          <Plus className="h-4 w-4" />
          Add Channel
        </Button>
      </CreateChannelDialog>
    </div>
  );
}

// ─── Alert Channel List ───────────────────────────────────────────

export function AlertChannelList() {
  const { data } = useAlertChannels();
  const channels = data.channels;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (channels.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <CreateChannelDialog>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Channel
          </Button>
        </CreateChannelDialog>
      </div>

      <div className="space-y-3">
        {channels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} onDelete={setDeleteId} />
        ))}
      </div>

      <DeleteChannelDialog
        channelId={deleteId}
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      />
    </div>
  );
}
