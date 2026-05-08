import { useParams } from '@tanstack/react-router';

export function MonitorDetailPage() {
  const { id } = useParams({ strict: false });
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-50">
        Monitor Detail
      </h1>
      <p className="mt-1 text-sm text-zinc-400">ID: {id}</p>
      <p className="mt-4 text-sm text-zinc-500">Implementation coming in T03.</p>
    </div>
  );
}
