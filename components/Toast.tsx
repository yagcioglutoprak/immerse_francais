import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface ToastProps {
  message: string;
  type: 'success' | 'milestone' | 'error' | 'info';
  xp?: number;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, type, xp, onDismiss, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10010]">
      <div
        className={clsx(
          'max-w-[400px] rounded-lg shadow-lg px-md py-sm flex items-center gap-sm',
          'transition-all duration-300',
          isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          type === 'milestone' && 'bg-accent text-white',
          type === 'success' && 'bg-success text-white',
          type === 'error' && 'bg-error text-white',
          type === 'info' && 'bg-primary text-white dark:bg-primary-dark'
        )}
      >
        <span className="text-lg">
          {type === 'milestone' && '🎉'}
          {type === 'success' && '✓'}
          {type === 'error' && '✗'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="font-semibold text-sm flex-1">{message}</span>
        {xp && (
          <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs font-bold">
            +{xp} XP
          </span>
        )}
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onDismiss, 300);
          }}
          className="ml-sm opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
