import { cn } from '../../lib/utils';

type Status = 'new' | 'up' | 'down' | 'grace' | 'paused';

const STATUS_CONFIG: Record<
  Status,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  up: {
    label: 'Healthy',
    dotClass: 'bg-emerald-400 animate-pulse-dot',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-400/10',
  },
  down: {
    label: 'Down',
    dotClass: 'bg-rose-400',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-400/10',
  },
  grace: {
    label: 'Grace',
    dotClass: 'bg-amber-400 animate-pulse-dot',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-400/10',
  },
  new: {
    label: 'New',
    dotClass: 'bg-zinc-400',
    textClass: 'text-zinc-400',
    bgClass: 'bg-zinc-400/10',
  },
  paused: {
    label: 'Paused',
    dotClass: 'bg-zinc-500',
    textClass: 'text-zinc-500',
    bgClass: 'bg-zinc-500/10',
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bgClass,
        config.textClass,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}
