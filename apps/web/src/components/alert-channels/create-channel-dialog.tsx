import type { ChannelType } from '@cronguard/shared';
import { Loader2 } from 'lucide-react';
import type { ReactNode, SyntheticEvent } from 'react';
import { useState } from 'react';

import { useCreateAlertChannel } from '../../hooks/use-alert-channels';
import { ApiRequestError } from '../../lib/api';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

// ─── Channel type selector ───────────────────────────────────────

const CHANNEL_OPTIONS: { value: ChannelType; label: string; description: string }[] = [
  { value: 'email', label: 'Email', description: 'Send alerts to an email address' },
  { value: 'slack', label: 'Slack', description: 'Post to a Slack channel via webhook' },
  { value: 'discord', label: 'Discord', description: 'Post to a Discord channel via webhook' },
  { value: 'webhook', label: 'Webhook', description: 'Send a POST to a custom URL' },
];

// ─── Config fields per type ───────────────────────────────────────

function ConfigFields({ type }: { type: ChannelType }) {
  switch (type) {
    case 'email':
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="config-email">Email Address</Label>
          <Input
            id="config-email"
            name="config-email"
            type="email"
            placeholder="alerts@example.com"
            required
          />
        </div>
      );
    case 'slack':
      return (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="config-webhookUrl">Slack Webhook URL</Label>
            <Input
              id="config-webhookUrl"
              name="config-webhookUrl"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              className="font-mono text-xs"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="config-channel">
              Channel <span className="text-zinc-500">(optional)</span>
            </Label>
            <Input id="config-channel" name="config-channel" placeholder="#alerts" />
          </div>
        </>
      );
    case 'discord':
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="config-webhookUrl">Discord Webhook URL</Label>
          <Input
            id="config-webhookUrl"
            name="config-webhookUrl"
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            className="font-mono text-xs"
            required
          />
        </div>
      );
    case 'webhook':
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="config-webhookUrl">Webhook URL</Label>
          <Input
            id="config-webhookUrl"
            name="config-webhookUrl"
            type="url"
            placeholder="https://api.example.com/webhooks/cronguard"
            className="font-mono text-xs"
            required
          />
        </div>
      );
  }
}

// ─── Create Channel Dialog ────────────────────────────────────────

export function CreateChannelDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [channelType, setChannelType] = useState<ChannelType>('email');
  const [error, setError] = useState<string | null>(null);
  const createChannel = useCreateAlertChannel();

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = (form.get('name') as string).trim();

    if (!name) {
      setError('Name is required.');
      return;
    }

    // Build config based on type
    let config: Record<string, string>;
    if (channelType === 'email') {
      const email = (form.get('config-email') as string).trim();
      if (!email) {
        setError('Email is required.');
        return;
      }
      config = { email };
    } else if (channelType === 'slack') {
      const webhookUrl = (form.get('config-webhookUrl') as string).trim();
      const channel = (form.get('config-channel') as string | null)?.trim();
      if (!webhookUrl) {
        setError('Webhook URL is required.');
        return;
      }
      config = { webhookUrl };
      if (channel) config['channel'] = channel;
    } else {
      const webhookUrl = (form.get('config-webhookUrl') as string).trim();
      if (!webhookUrl) {
        setError('Webhook URL is required.');
        return;
      }
      config = { webhookUrl };
    }

    createChannel.mutate(
      { type: channelType, name, config },
      {
        onSuccess: () => {
          setOpen(false);
          setError(null);
          setChannelType('email');
        },
        onError: (err) => {
          if (err instanceof ApiRequestError) {
            setError(err.body.error);
          } else {
            setError('Something went wrong. Please try again.');
          }
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Alert Channel</DialogTitle>
          <DialogDescription>
            Configure a new channel to receive notifications when monitors go down or recover.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {/* Channel type selector */}
          <div className="flex flex-col gap-2">
            <Label>Channel Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                    channelType === opt.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-zinc-700 bg-surface-0 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                  onClick={() => {
                    setChannelType(opt.value);
                  }}
                >
                  <span className="font-medium">{opt.label}</span>
                  <p className="mt-0.5 text-xs opacity-70">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="channel-name">Name</Label>
            <Input id="channel-name" name="name" placeholder="Production Alerts" required />
          </div>

          {/* Dynamic config fields */}
          <ConfigFields type={channelType} />

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
              }}
              disabled={createChannel.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createChannel.isPending}>
              {createChannel.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
