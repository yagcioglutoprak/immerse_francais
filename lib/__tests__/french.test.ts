import { describe, it, expect } from 'vitest';
import { isLikelyFrench } from '../french';

describe('French word detection', () => {
  it('accepts words with French-specific characters', () => {
    expect(isLikelyFrench('épanouir')).toBe(true);
    expect(isLikelyFrench('français')).toBe(true);
    expect(isLikelyFrench('être')).toBe(true);
    expect(isLikelyFrench('naïf')).toBe(true);
    expect(isLikelyFrench('cœur')).toBe(true);
  });

  it('rejects common English words', () => {
    expect(isLikelyFrench('the')).toBe(false);
    expect(isLikelyFrench('and')).toBe(false);
    expect(isLikelyFrench('with')).toBe(false);
    expect(isLikelyFrench('have')).toBe(false);
    expect(isLikelyFrench('would')).toBe(false);
  });

  it('rejects words shorter than 3 characters', () => {
    expect(isLikelyFrench('le')).toBe(false);
    expect(isLikelyFrench('un')).toBe(false);
    expect(isLikelyFrench('de')).toBe(false);
  });

  it('accepts non-English words without accents on French pages', () => {
    expect(isLikelyFrench('quotidien')).toBe(true);
    expect(isLikelyFrench('bouleverser')).toBe(true);
    expect(isLikelyFrench('enjeu')).toBe(true);
  });
});
