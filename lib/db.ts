import Dexie, { type EntityTable } from 'dexie';

export interface Word {
  id?: number;
  word: string;
  definition: string;
  example: string;
  exampleTranslation: string;
  partOfSpeech: string;
  etymology: string;
  conjugation: string;
  related: string[];
  cefrLevel: string;
  tags: string[];
  note: string;
  sourceUrl: string;
  sourceTitle: string;
  priority: number;
  createdAt: Date;
  // SRS fields (SM-2)
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  lastReview: Date | null;
}

export interface Stats {
  id?: number;
  date: string; // YYYY-MM-DD
  wordsSaved: number;
  wordsReviewed: number;
  correctReviews: number;
  xpEarned: number;
}

export interface UserProfile {
  id?: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  level: number;
  apiKey: string;
  darkMode: 'system' | 'light' | 'dark';
  highlightMode: 'all' | 'saved' | 'off';
  onboardingComplete: boolean;
}

const db = new Dexie('ImmerseFrancaisDB') as Dexie & {
  words: EntityTable<Word, 'id'>;
  stats: EntityTable<Stats, 'id'>;
  profile: EntityTable<UserProfile, 'id'>;
};

db.version(1).stores({
  words: '++id, word, nextReview, cefrLevel, createdAt',
  stats: '++id, date',
  profile: '++id',
});

export { db };

// SM-2 algorithm
export function sm2(quality: number, word: Word): Partial<Word> {
  let { easeFactor, interval, repetitions } = word;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview, lastReview: new Date() };
}

export function getLevel(wordCount: number): number {
  return Math.floor(wordCount / 50);
}

export function getLevelProgress(wordCount: number): number {
  return (wordCount % 50) / 50;
}
