import { clsx } from 'clsx';

interface XpBadgeProps {
  amount: number;
  animated?: boolean;
  className?: string;
}

export function XpBadge({ amount, animated = false, className }: XpBadgeProps) {
  return (
    <span
      className={clsx(
        'xp-badge',
        animated && 'animate-xp-appear',
        className
      )}
    >
      ★ {amount.toLocaleString()} XP
    </span>
  );
}

interface XpGainProps {
  amount: number;
  className?: string;
}

export function XpGain({ amount, className }: XpGainProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 bg-reward-light text-amber-700',
        'px-2 py-0.5 rounded-full text-xs font-bold animate-xp-appear',
        className
      )}
    >
      +{amount} XP
    </span>
  );
}
