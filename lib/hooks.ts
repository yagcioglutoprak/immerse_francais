import { useState, useEffect } from 'react';
import { db, type Word, type UserProfile, getLevel, getLevelProgress } from './db';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      let p = await db.profile.toCollection().first();
      if (!p) {
        const id = await db.profile.add({
          totalXp: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: '',
          level: 0,
          apiKey: '',
          darkMode: 'system',
          highlightMode: 'all',
          onboardingComplete: false,
        });
        p = await db.profile.get(id);
      }
      setProfile(p ?? null);
    };
    load();
  }, []);

  const update = async (changes: Partial<UserProfile>) => {
    if (!profile?.id) return;
    await db.profile.update(profile.id, changes);
    setProfile((prev) => (prev ? { ...prev, ...changes } : prev));
  };

  return { profile, update };
}

export function useWords() {
  const [words, setWords] = useState<Word[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const all = await db.words.orderBy('createdAt').reverse().toArray();
      setWords(all);
      setCount(all.length);
    };
    load();
  }, []);

  return { words, count, level: getLevel(count), progress: getLevelProgress(count) };
}

export function useDueWords() {
  const [dueWords, setDueWords] = useState<Word[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const due = await db.words.where('nextReview').belowOrEqual(now).toArray();
      setDueWords(due);
    };
    load();
  }, []);

  return dueWords;
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem('immerse-dark-mode');
      if (stored === 'dark') return setIsDark(true);
      if (stored === 'light') return setIsDark(false);
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    check();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('immerse-dark-mode', next ? 'dark' : 'light');
  };

  return { isDark, toggle };
}

export function useTodayStats() {
  const [stats, setStats] = useState({ wordsSaved: 0, wordsReviewed: 0, correctReviews: 0, xpEarned: 0 });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    db.stats.where('date').equals(today).first().then((s) => {
      if (s) setStats(s);
    });
  }, []);

  return stats;
}
