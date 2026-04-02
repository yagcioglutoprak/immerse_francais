import { useProfile, useWords, useDueWords, useDarkMode } from '../../lib/hooks';
import { StreakBadge } from '../../components/StreakBadge';
import { ProgressBar } from '../../components/ProgressBar';
import { clsx } from 'clsx';

export default function App() {
  const { profile } = useProfile();
  const { count, level, progress } = useWords();
  const dueWords = useDueWords();
  const { isDark, toggle } = useDarkMode();

  const accuracy = profile?.totalXp ? Math.min(100, Math.round((profile.totalXp / Math.max(1, count * 10)) * 100)) : 0;

  return (
    <div className={clsx('min-h-[280px] bg-cream-bg dark:bg-warm-bg text-ink dark:text-warm-text', isDark && 'dark')}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-primary dark:bg-primary-dark rounded-md flex items-center justify-center">
            <span className="text-white font-display text-base">F</span>
          </div>
          <span className="font-display text-xl text-primary dark:text-primary-dark">
            ImmerseFrançais
          </span>
          <div className="ml-auto">
            <StreakBadge count={profile?.currentStreak ?? 0} size="sm" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card p-3 text-center animate-glow-pulse">
            <div className="text-[22px] font-bold tabular-nums text-accent dark:text-accent-dark leading-none mb-1">
              {count}
            </div>
            <div className="text-[10px] text-ink-light dark:text-warm-light uppercase tracking-wider font-semibold">
              Words
            </div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-[22px] font-bold tabular-nums text-primary dark:text-primary-dark leading-none mb-1">
              {accuracy}%
            </div>
            <div className="text-[10px] text-ink-light dark:text-warm-light uppercase tracking-wider font-semibold">
              Accuracy
            </div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-[22px] font-bold tabular-nums text-reward leading-none mb-1">
              {(profile?.totalXp ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-ink-light dark:text-warm-light uppercase tracking-wider font-semibold">
              XP
            </div>
          </div>
        </div>

        {/* Review CTA */}
        <button
          className="btn-accent w-full flex items-center justify-center gap-2 py-3 text-base shadow-[0_2px_8px_rgba(232,115,74,0.25)]"
          onClick={() => {
            chrome.tabs.create({ url: chrome.runtime.getURL('/newtab.html') });
          }}
        >
          Review Now
          {dueWords.length > 0 && (
            <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs font-bold">
              {dueWords.length} due
            </span>
          )}
        </button>
      </div>

      {/* Level Progress */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-cream-border dark:border-warm-border">
        <span className="text-xs font-semibold text-ink dark:text-warm-text">
          Level {level}
        </span>
        <div className="flex-1">
          <ProgressBar value={progress} />
        </div>
        <span className="text-xs tabular-nums text-ink-muted dark:text-warm-muted">
          {count % 50}/50
        </span>
      </div>

      {/* Footer */}
      <div className="flex border-t border-cream-border dark:border-warm-border">
        <button
          className="flex-1 py-2.5 text-xs font-medium text-ink-muted dark:text-warm-muted
                     hover:text-primary dark:hover:text-primary-dark hover:bg-cream-alt dark:hover:bg-warm-alt
                     transition-all duration-150 flex items-center justify-center gap-1"
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('/newtab.html') })}
        >
          📊 Dashboard
        </button>
        <button
          className="flex-1 py-2.5 text-xs font-medium text-ink-muted dark:text-warm-muted
                     hover:text-primary dark:hover:text-primary-dark hover:bg-cream-alt dark:hover:bg-warm-alt
                     transition-all duration-150 flex items-center justify-center gap-1
                     border-l border-cream-border dark:border-warm-border"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          ⚙️ Settings
        </button>
        <button
          className="flex-1 py-2.5 text-xs font-medium text-ink-muted dark:text-warm-muted
                     hover:text-primary dark:hover:text-primary-dark hover:bg-cream-alt dark:hover:bg-warm-alt
                     transition-all duration-150 flex items-center justify-center gap-1
                     border-l border-cream-border dark:border-warm-border"
          onClick={toggle}
        >
          {isDark ? '☀️' : '🌙'} Theme
        </button>
      </div>
    </div>
  );
}
