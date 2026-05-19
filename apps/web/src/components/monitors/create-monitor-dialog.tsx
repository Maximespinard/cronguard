import { Loader2 } from 'lucide-react';
import type { ReactNode, SyntheticEvent } from 'react';
import { useState } from 'react';

import { useCreateMonitor } from '../../hooks/use-monitors';
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

interface CreateMonitorDialogProps {
  children: ReactNode;
}

export function CreateMonitorDialog({ children }: CreateMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createMonitor = useCreateMonitor();

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = (form.get('name') as string).trim();
    const schedule = (form.get('schedule') as string).trim();
    const gracePeriod = parseInt(form.get('gracePeriod') as string, 10) || 5;
    const timezone = (form.get('timezone') as string).trim() || 'UTC';

    if (!name || !schedule) {
      setError('Name and schedule are required.');
      return;
    }

    createMonitor.mutate(
      { name, schedule, gracePeriod, timezone },
      {
        onSuccess: () => {
          setOpen(false);
          setError(null);
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
          <DialogTitle>Create Monitor</DialogTitle>
          <DialogDescription>
            Set up a new cron job monitor. You&apos;ll get a unique ping URL to call from your
            scheduled task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Daily database backup" autoFocus required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="schedule">Cron Schedule</Label>
            <Input
              id="schedule"
              name="schedule"
              placeholder="0 2 * * *"
              className="font-mono"
              required
            />
            <p className="text-xs text-zinc-500">
              Standard 5-field cron expression (minute hour day month weekday)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gracePeriod">Grace Period (min)</Label>
              <Input
                id="gracePeriod"
                name="gracePeriod"
                type="number"
                min={1}
                max={60}
                defaultValue={5}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" name="timezone" placeholder="UTC" defaultValue="UTC" />
            </div>
          </div>

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
              disabled={createMonitor.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMonitor.isPending}>
              {createMonitor.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Monitor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
