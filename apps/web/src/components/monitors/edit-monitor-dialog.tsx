import { Loader2 } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { useUpdateMonitor } from '../../hooks/use-monitors';
import { ApiRequestError } from '../../lib/api';
import type { ApiMonitor } from '../../lib/api-types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface EditMonitorDialogProps {
  monitor: ApiMonitor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMonitorDialog({ monitor, open, onOpenChange }: EditMonitorDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const updateMonitor = useUpdateMonitor(monitor.id);

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = (form.get('name') as string).trim();
    const schedule = (form.get('schedule') as string).trim();
    const gracePeriod = parseInt(form.get('gracePeriod') as string, 10);
    const timezone = (form.get('timezone') as string).trim();

    const updates: Record<string, unknown> = {};
    if (name && name !== monitor.name) updates['name'] = name;
    if (schedule && schedule !== monitor.schedule) updates['schedule'] = schedule;
    if (!isNaN(gracePeriod) && gracePeriod !== Math.floor(monitor.gracePeriod / 60)) {
      updates['gracePeriod'] = gracePeriod;
    }
    if (timezone && timezone !== monitor.timezone) updates['timezone'] = timezone;

    if (Object.keys(updates).length === 0) {
      onOpenChange(false);
      return;
    }

    updateMonitor.mutate(updates, {
      onSuccess: () => {
        onOpenChange(false);
        setError(null);
      },
      onError: (err) => {
        if (err instanceof ApiRequestError) {
          setError(err.body.error);
        } else {
          setError('Something went wrong. Please try again.');
        }
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Monitor</DialogTitle>
          <DialogDescription>
            Update the monitor configuration. Changes to schedule or timezone will recompute the
            next expected ping.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" defaultValue={monitor.name} autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-schedule">Cron Schedule</Label>
            <Input
              id="edit-schedule"
              name="schedule"
              defaultValue={monitor.schedule}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-gracePeriod">Grace Period (min)</Label>
              <Input
                id="edit-gracePeriod"
                name="gracePeriod"
                type="number"
                min={1}
                max={60}
                defaultValue={Math.floor(monitor.gracePeriod / 60)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-timezone">Timezone</Label>
              <Input id="edit-timezone" name="timezone" defaultValue={monitor.timezone} />
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
                onOpenChange(false);
              }}
              disabled={updateMonitor.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMonitor.isPending}>
              {updateMonitor.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
