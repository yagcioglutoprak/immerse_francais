import { useState } from 'react';
import { useProfile, useWords, useDueWords, useDarkMode } from '../../lib/hooks';
import { StreakBadge } from '../../components/StreakBadge';
import { XpBadge } from '../../components/XpBadge';
import { ProgressBar } from '../../components/ProgressBar';
import { LevelPill, getSrsLevel } from '../../components/LevelPill';
import { Quiz } from '../../components/Quiz';
import { Toast } from '../../components/Toast';
import { clsx } from 'clsx';

export default function App() {
  const { profile } = useProfile();
  const { words, count, level, progress } = useWords();
  const dueWords = useDueWords();
  const { isDark, toggle } = useDarkMode();
  const [showQuiz, setShowQuiz] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'milestone'; xp?: number } | null>(null);

  const accuracy = count > 0 ? Math.round((words.filter((w) => w.repetitions >= 3).length / count) * 100) : 0;

  // Weekly chart data
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekData = weekDays.map((day, i) => {
    const diff = i - ((dayOfWeek + 6) % 7);
    const date = new Date(today);
    date.setDate(date.getDate() + diff);
    const dateStr = date.toISOString().split('T')[0];
    const dayWords = words.filter((w) => w.createdAt.toISOString().split('T')[0] === dateStr);
    return { day, count: dayWords.length };
  });
  const maxCount = Math.max(1, ...weekData.map((d) => d.count));

  const formatDue = (date: Date) => {
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  if (showQuiz && dueWords.length > 0) {
    return (
      <div className={clsx('min-h-screen bg-cream-bg dark:bg-warm-bg text-ink dark:text-warm-text p-xl', isDark && 'dark')}>
        <div className="max-w-lg mx-auto pt-3xl">
          <h1 className="font-display text-2xl text-primary dark:text-primary-dark text-center mb-xl">Review Session</h1>
          <Quiz
            words={dueWords}
            onComplete={(results) => {
              setShowQuiz(false);
              setToast({
                message: `${results.correct}/${results.total} correct!`,
                type: results.correct === results.total ? 'milestone' : 'success',
                xp: results.xpEarned,
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('min-h-screen bg-cream-bg dark:bg-warm-bg text-ink dark:text-warm-text', isDark && 'dark')}>
      <div className="max-w-[1120px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-lg pt-lg">
          <h1 className="font-display text-[28px] text-primary dark:text-primary-dark">
            ImmerseFrançais
          </h1>
          <div className="flex items-center gap-3">
            <XpBadge amount={profile?.totalXp ?? 0} />
            <StreakBadge count={profile?.currentStreak ?? 0} />
            <button onClick={toggle} className="btn-ghost px-3 py-1.5 text-sm">
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 px-lg py-5">
          {[
            { icon: '📚', iconBg: 'bg-primary/10 dark:bg-primary-dark/10', value: count, label: 'Words Saved', sub: `${50 - (count % 50)} to Level ${level + 1}`, color: '', progress: progress, progressColor: 'accent' as const },
            { icon: '🔄', iconBg: 'bg-accent/10 dark:bg-accent-dark/10', value: dueWords.length, label: 'Due Today', sub: dueWords.length > 0 ? 'Start review →' : 'All caught up!', color: 'text-accent dark:text-accent-dark', glow: dueWords.length > 0, progress: 0, progressColor: 'accent' as const, onClick: () => dueWords.length > 0 && setShowQuiz(true) },
            { icon: '✓', iconBg: 'bg-success/10 dark:bg-success-dark/10', value: `${accuracy}%`, label: 'Accuracy', sub: 'Last 7 days', color: '', progress: accuracy / 100, progressColor: 'success' as const },
            { icon: '★', iconBg: 'bg-reward/10', value: (profile?.totalXp ?? 0).toLocaleString(), label: 'Total XP', sub: `${Math.max(0, 500 - ((profile?.totalXp ?? 0) % 500))} to next milestone`, color: 'text-reward', progress: ((profile?.totalXp ?? 0) % 500) / 500, progressColor: 'reward' as const },
          ].map((stat) => (
            <div
              key={stat.label}
              className={clsx('card p-4', stat.glow && 'animate-glow-pulse cursor-pointer')}
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={clsx('w-7 h-7 rounded-sm flex items-center justify-center text-sm', stat.iconBg)}>
                  {stat.icon}
                </div>
              </div>
              <div className={clsx('text-[28px] font-bold tabular-nums leading-none', stat.color)}>
                {stat.value}
              </div>
              <div className="text-[11px] text-ink-light dark:text-warm-light uppercase tracking-wider font-semibold mt-1">
                {stat.label}
              </div>
              <ProgressBar value={stat.progress} color={stat.progressColor} className="mt-2" />
              <div className={clsx('text-[10px] mt-1', stat.glow ? 'text-accent dark:text-accent-dark font-semibold' : 'text-ink-light dark:text-warm-light')}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Body: Table + Chart */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-4 px-lg pb-lg">
          {/* Vocab Table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-border dark:border-warm-border">
              <span className="text-sm font-semibold">Vocabulary</span>
              <span className="text-xs text-ink-light dark:text-warm-light font-medium bg-cream-alt dark:bg-warm-alt px-2.5 py-1 rounded-full border border-cream-border dark:border-warm-border">
                All words
              </span>
            </div>
            {words.length === 0 ? (
              <div className="p-8 text-center text-ink-light dark:text-warm-light">
                <p className="font-display text-lg text-primary dark:text-primary-dark mb-2">No words yet</p>
                <p className="text-sm">Browse any French webpage and click on words to start learning.</p>
              </div>
            ) : (
              words.slice(0, 10).map((word) => (
                <div
                  key={word.id}
                  className="grid grid-cols-[1fr_1fr_80px_60px] px-4 py-2.5 border-b border-cream-border dark:border-warm-border
                             text-sm items-center hover:bg-cream-alt dark:hover:bg-warm-alt transition-colors"
                >
                  <span className="font-semibold text-primary dark:text-primary-dark">{word.word}</span>
                  <span className="text-xs text-ink-muted dark:text-warm-muted truncate">{word.definition}</span>
                  <LevelPill level={getSrsLevel(word.repetitions)} />
                  <span className={clsx(
                    'text-xs tabular-nums',
                    word.nextReview <= new Date() ? 'text-accent dark:text-accent-dark font-semibold' : 'text-ink-light dark:text-warm-light'
                  )}>
                    {formatDue(word.nextReview)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Weekly Chart */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-4">Words learned this week</h3>
            <div className="flex items-end gap-1.5 h-[120px]">
              {weekData.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className={clsx(
                      'w-full rounded-t-sm transition-all duration-500',
                      i >= 5 ? 'bg-accent/80 dark:bg-accent-dark/80' : 'bg-primary/70 dark:bg-primary-dark/70'
                    )}
                    style={{ height: `${Math.max(4, (d.count / maxCount) * 100)}%` }}
                  />
                  <span className="text-[10px] text-ink-light dark:text-warm-light font-medium">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          xp={toast.xp}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
