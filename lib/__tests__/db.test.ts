import { describe, it, expect } from 'vitest';
import { sm2, getLevel, getLevelProgress } from '../db';

describe('SM-2 Algorithm', () => {
  const baseWord = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  };

  it('resets on quality < 3 (wrong answer)', () => {
    const word = { ...baseWord, repetitions: 3, interval: 10, easeFactor: 2.5 };
    const result = sm2(1, word as any);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it('sets interval to 1 day on first correct answer', () => {
    const result = sm2(4, { ...baseWord } as any);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it('sets interval to 6 days on second correct answer', () => {
    const word = { ...baseWord, repetitions: 1, interval: 1 };
    const result = sm2(4, word as any);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it('multiplies interval by ease factor after 2nd rep', () => {
    const word = { ...baseWord, repetitions: 2, interval: 6, easeFactor: 2.5 };
    const result = sm2(4, word as any);
    expect(result.interval).toBe(15); // 6 * 2.5 = 15
    expect(result.repetitions).toBe(3);
  });

  it('never drops ease factor below 1.3', () => {
    const word = { ...baseWord, easeFactor: 1.4 };
    const result = sm2(1, word as any);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('increases ease factor on quality 5 (easy)', () => {
    const result = sm2(5, { ...baseWord } as any);
    expect(result.easeFactor!).toBeGreaterThan(2.5);
  });

  it('sets nextReview to a future date', () => {
    const result = sm2(4, { ...baseWord } as any);
    expect(result.nextReview!.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('Level calculations', () => {
  it('returns 0 for < 50 words', () => {
    expect(getLevel(0)).toBe(0);
    expect(getLevel(49)).toBe(0);
  });

  it('returns 1 for 50-99 words', () => {
    expect(getLevel(50)).toBe(1);
    expect(getLevel(99)).toBe(1);
  });

  it('returns correct level for large counts', () => {
    expect(getLevel(250)).toBe(5);
    expect(getLevel(1000)).toBe(20);
  });

  it('returns progress as 0-1 fraction', () => {
    expect(getLevelProgress(0)).toBe(0);
    expect(getLevelProgress(25)).toBe(0.5);
    expect(getLevelProgress(49)).toBeCloseTo(0.98);
    expect(getLevelProgress(50)).toBe(0);
  });
});
