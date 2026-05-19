import { Suspense } from 'react';

import { MonitorList } from '../components/monitors/monitor-list';

export function MonitorsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-50">
            Monitors
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track your cron jobs and get alerted when they miss a beat.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array<undefined>(6)].map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-xl bg-surface-1 border border-zinc-800/50"
              />
            ))}
          </div>
        }
      >
        <MonitorList />
      </Suspense>
    </div>
  );
}
