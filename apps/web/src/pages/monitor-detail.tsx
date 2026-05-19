import { useParams } from '@tanstack/react-router';
import { Suspense } from 'react';

import { MonitorDetail } from '../components/monitors/monitor-detail';

export function MonitorDetailPage() {
  const { id } = useParams({ strict: false });

  if (!id) return null;

  return (
    <Suspense
      fallback={
        <div className="animate-fade-in space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-1" />
          <div className="h-40 animate-pulse rounded-xl bg-surface-1 border border-zinc-800/50" />
          <div className="h-64 animate-pulse rounded-xl bg-surface-1 border border-zinc-800/50" />
        </div>
      }
    >
      <MonitorDetail id={id} />
    </Suspense>
  );
}
