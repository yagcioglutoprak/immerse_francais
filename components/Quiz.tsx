import { useState, useCallback } from 'react';
import { db, sm2, type Word } from '../lib/db';
import { clsx } from 'clsx';

interface QuizProps {
  words: Word[];
  onComplete: (results: { correct: number; total: number; xpEarned: number }) => void;
}

type CardState = 'question' | 'flipping' | 'answer' | 'graded';

export function Quiz({ words, onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>('question');
  const [results, setResults] = useState<boolean[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentWord = words[currentIndex];
  const isLastCard = currentIndex === words.length - 1;

  const flipCard = useCallback(() => {
    if (cardState !== 'question') return;
    setCardState('flipping');
    setIsFlipped(true);
    setTimeout(() => setCardState('answer'), 300);
  }, [cardState]);

  const grade = useCallback(
    async (quality: number) => {
      if (!currentWord?.id) return;
      const correct = quality >= 3;
      setResults((prev) => [...prev, correct]);

      // Update word with SM-2
      const updates = sm2(quality, currentWord);
      await db.words.update(currentWord.id, updates);

      // Update XP
      if (correct) {
        const profile = await db.profile.toCollection().first();
        if (profile?.id) {
          await db.profile.update(profile.id, { totalXp: (profile.totalXp ?? 0) + 10 });
        }
        const today = new Date().toISOString().split('T')[0];
        const todayStats = await db.stats.where('date').equals(today).first();
        if (todayStats?.id) {
          await db.stats.update(todayStats.id, {
            wordsReviewed: todayStats.wordsReviewed + 1,
            correctReviews: todayStats.correctReviews + (correct ? 1 : 0),
            xpEarned: todayStats.xpEarned + 10,
          });
        } else {
          await db.stats.add({
            date: today,
            wordsSaved: 0,
            wordsReviewed: 1,
            correctReviews: correct ? 1 : 0,
            xpEarned: 10,
          });
        }
      }

      setCardState('graded');

      setTimeout(() => {
        if (isLastCard) {
          const allResults = [...results, correct];
          const correctCount = allResults.filter(Boolean).length;
          onComplete({
            correct: correctCount,
            total: allResults.length,
            xpEarned: correctCount * 10,
          });
        } else {
          setCurrentIndex((i) => i + 1);
          setCardState('question');
          setIsFlipped(false);
        }
      }, 600);
    },
    [currentWord, currentIndex, isLastCard, results, onComplete]
  );

  if (!currentWord) return null;

  return (
    <div className="flex flex-col items-center gap-lg">
      {/* Progress */}
      <div className="w-full max-w-md flex items-center gap-sm">
        <span className="text-sm text-ink-muted dark:text-warm-muted font-semibold tabular-nums">
          {currentIndex + 1}/{words.length}
        </span>
        <div className="progress-bar flex-1">
          <div
            className="h-full rounded-full bg-accent transition-all duration-[800ms] ease-out"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-2xs">
          {results.map((r, i) => (
            <div
              key={i}
              className={clsx(
                'w-2 h-2 rounded-full',
                r ? 'bg-success' : 'bg-error'
              )}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="perspective-[1000px] w-full max-w-md">
        <div
          className={clsx(
            'relative w-full min-h-[280px] transition-transform duration-300 [transform-style:preserve-3d]',
            isFlipped && '[transform:rotateY(180deg)]'
          )}
        >
          {/* Front - Question */}
          <div className="absolute inset-0 [backface-visibility:hidden] card p-lg flex flex-col items-center justify-center gap-md">
            <span className="text-sm text-ink-light dark:text-warm-light uppercase tracking-widest font-semibold">
              What does this mean?
            </span>
            <h2 className="font-display text-3xl text-primary dark:text-primary-dark text-center">
              {currentWord.word}
            </h2>
            {currentWord.partOfSpeech && (
              <span className="tag bg-primary/10 text-primary dark:bg-primary-dark/10 dark:text-primary-dark">
                {currentWord.partOfSpeech}
              </span>
            )}
            <button
              onClick={flipCard}
              className="btn-ghost mt-md text-sm"
            >
              Show Answer
            </button>
          </div>

          {/* Back - Answer */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] card p-lg flex flex-col gap-md">
            <div className="text-center">
              <h2 className="font-display text-xl text-primary dark:text-primary-dark">
                {currentWord.word}
              </h2>
              <p className="text-md text-ink dark:text-warm-text mt-xs">
                {currentWord.definition}
              </p>
            </div>

            {currentWord.example && (
              <div className="bg-cream-alt dark:bg-warm-alt rounded-md p-sm">
                <p className="text-sm italic text-ink-muted dark:text-warm-muted">
                  "{currentWord.example}"
                </p>
                {currentWord.exampleTranslation && (
                  <p className="text-xs text-ink-light dark:text-warm-light mt-2xs">
                    {currentWord.exampleTranslation}
                  </p>
                )}
              </div>
            )}

            {currentWord.etymology && (
              <p className="font-mono text-xs text-primary dark:text-primary-dark">
                {currentWord.etymology}
              </p>
            )}

            {/* Grading buttons */}
            {cardState === 'answer' && (
              <div className="flex gap-sm mt-auto">
                <button
                  onClick={() => grade(1)}
                  className="flex-1 py-2.5 rounded-md text-sm font-semibold
                             bg-error-light text-red-600 dark:bg-error-dark/20 dark:text-error-dark
                             hover:opacity-80 transition-opacity active:scale-[0.97]"
                >
                  Again
                </button>
                <button
                  onClick={() => grade(3)}
                  className="flex-1 py-2.5 rounded-md text-sm font-semibold
                             bg-warning-light text-amber-700 dark:bg-warning-dark/20 dark:text-warning-dark
                             hover:opacity-80 transition-opacity active:scale-[0.97]"
                >
                  Hard
                </button>
                <button
                  onClick={() => grade(4)}
                  className="flex-1 py-2.5 rounded-md text-sm font-semibold
                             bg-success-light text-green-600 dark:bg-success-dark/20 dark:text-success-dark
                             hover:opacity-80 transition-opacity active:scale-[0.97]"
                >
                  Good
                </button>
                <button
                  onClick={() => grade(5)}
                  className="flex-1 py-2.5 rounded-md text-sm font-semibold
                             bg-info-light text-blue-600 dark:bg-info-dark/20 dark:text-info-dark
                             hover:opacity-80 transition-opacity active:scale-[0.97]"
                >
                  Easy
                </button>
              </div>
            )}

            {cardState === 'graded' && (
              <div className="flex items-center justify-center gap-sm mt-auto">
                {results[results.length - 1] ? (
                  <>
                    <span className="text-success dark:text-success-dark font-semibold animate-success-pulse">
                      Correct!
                    </span>
                    <span className="xp-badge">+10 XP</span>
                  </>
                ) : (
                  <span className="text-error dark:text-error-dark font-semibold">
                    Review again soon
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-ink-light dark:text-warm-light">
        Press <kbd className="px-1.5 py-0.5 rounded border border-cream-border dark:border-warm-border text-xs font-mono">Space</kbd> to flip
      </p>
    </div>
  );
}
