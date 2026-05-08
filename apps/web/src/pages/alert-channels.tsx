import { Suspense } from 'react';

import { AlertChannelList } from '../components/alert-channels/alert-channel-list';

export function AlertChannelsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-50">
            Alert Channels
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Configure where your alerts get delivered.</p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {[...Array<undefined>(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-surface-1 border border-zinc-800/50"
              />
            ))}
          </div>
        }
      >
        <AlertChannelList />
      </Suspense>
    </div>
  );
}
