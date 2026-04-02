import { clsx } from 'clsx';

interface StreakBadgeProps {
  count: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function StreakBadge({ count, size = 'md', className }: StreakBadgeProps) {
  const tier = count >= 30 ? 'gold' : count >= 7 ? 'silver' : count >= 3 ? 'bronze' : 'none';

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1 font-bold rounded-full',
        size === 'sm' ? 'text-sm px-2 py-0.5' : 'text-sm px-3 py-1',
        'bg-streak/10 text-streak dark:bg-streak-dark/10 dark:text-streak-dark',
        className
      )}
    >
      <span className={clsx('animate-streak-pulse', tier === 'gold' && 'text-reward')}>
        🔥
      </span>
      <span className="tabular-nums">{count}</span>
      {tier !== 'none' && (
        <span className="text-xs opacity-70">
          {tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉'}
        </span>
      )}
    </div>
  );
}
