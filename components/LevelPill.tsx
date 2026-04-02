import { clsx } from 'clsx';

type Level = 'new' | 'learning' | 'known';

interface LevelPillProps {
  level: Level;
  className?: string;
}

const styles: Record<Level, string> = {
  new: 'bg-info-light text-blue-600 dark:bg-info-dark/20 dark:text-info-dark',
  learning: 'bg-warning-light text-amber-700 dark:bg-warning-dark/20 dark:text-warning-dark',
  known: 'bg-success-light text-green-600 dark:bg-success-dark/20 dark:text-success-dark',
};

const labels: Record<Level, string> = {
  new: 'New',
  learning: 'Learning',
  known: 'Known',
};

export function LevelPill({ level, className }: LevelPillProps) {
  return (
    <span
      className={clsx(
        'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold',
        styles[level],
        className
      )}
    >
      {labels[level]}
    </span>
  );
}

export function getSrsLevel(repetitions: number): Level {
  if (repetitions === 0) return 'new';
  if (repetitions < 3) return 'learning';
  return 'known';
}
