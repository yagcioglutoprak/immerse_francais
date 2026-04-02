import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0-1
  color?: 'accent' | 'reward' | 'success' | 'primary';
  className?: string;
}

export function ProgressBar({ value, color = 'accent', className }: ProgressBarProps) {
  const colorMap = {
    accent: 'bg-accent dark:bg-accent-dark',
    reward: 'bg-reward',
    success: 'bg-success dark:bg-success-dark',
    primary: 'bg-primary dark:bg-primary-dark',
  };

  return (
    <div className={clsx('progress-bar', className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-[800ms] ease-out', colorMap[color])}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}
