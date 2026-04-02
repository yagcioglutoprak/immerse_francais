import { useState } from 'react';
import { useProfile } from '../../lib/hooks';
import { clsx } from 'clsx';

export default function App() {
  const { update } = useProfile();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const testAndSave = async () => {
    setApiStatus('testing');
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "bonjour"' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      if (res.ok) {
        await update({ apiKey });
        setApiStatus('success');
        setTimeout(() => goTo(2), 800);
      } else {
        setApiStatus('error');
      }
    } catch {
      setApiStatus('error');
    }
  };

  const finish = async () => {
    await update({ onboardingComplete: true });
    chrome.tabs.create({ url: 'https://www.lemonde.fr/' });
  };

  const goTo = (s: number) => {
    setDirection(s > step ? 'forward' : 'back');
    setStep(s);
  };

  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center px-lg">
      <div className="w-full max-w-md">
        {/* Step content */}
        <div
          key={step}
          className={clsx(
            'transition-all duration-300',
            direction === 'forward' ? 'animate-[slideIn_300ms_ease-out]' : 'animate-[slideBack_300ms_ease-out]'
          )}
        >
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center mx-auto mb-lg">
                <span className="text-white font-display text-3xl">F</span>
              </div>
              <h1 className="font-display text-3xl text-primary mb-sm">
                Immerse<em className="text-accent">Français</em>
              </h1>
              <p className="text-md text-ink-muted mb-2xl leading-relaxed">
                Learn French vocabulary while you browse the web.
                Click any word to see its definition, etymology, and examples.
                Words are saved and reviewed using spaced repetition.
              </p>
              <div className="grid grid-cols-3 gap-sm mb-2xl">
                {[
                  { icon: '📖', label: 'Click words to learn' },
                  { icon: '🧠', label: 'Spaced repetition' },
                  { icon: '🔥', label: 'Streaks & XP' },
                ].map((f) => (
                  <div key={f.label} className="card p-sm text-center">
                    <div className="text-xl mb-xs">{f.icon}</div>
                    <div className="text-xs text-ink-muted font-medium">{f.label}</div>
                  </div>
                ))}
              </div>
              <button className="btn-accent w-full py-3 text-base" onClick={() => goTo(1)}>
                Get Started
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl text-primary mb-xs text-center">API Setup</h2>
              <p className="text-sm text-ink-muted text-center mb-lg">
                ImmerseFrançais uses Google Gemini AI to analyze French words.
                You need a free API key to get started.
              </p>
              <div className="card p-lg mb-md">
                <label className="block text-sm font-semibold text-ink-muted mb-xs">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  className="input-field mb-sm"
                  placeholder="Paste your API key here..."
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setApiStatus('idle'); }}
                />
                <button
                  className="btn-accent w-full py-2.5 text-sm"
                  onClick={testAndSave}
                  disabled={!apiKey || apiStatus === 'testing'}
                >
                  {apiStatus === 'testing' ? 'Verifying...' : apiStatus === 'success' ? '✓ Verified!' : 'Verify & Continue'}
                </button>
                {apiStatus === 'error' && (
                  <p className="text-sm text-error mt-sm font-medium text-center">
                    Invalid key. Please check and try again.
                  </p>
                )}
              </div>
              <p className="text-xs text-ink-light text-center">
                Get a free key at{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary underline">
                  Google AI Studio
                </a>
              </p>
              <button className="btn-ghost w-full mt-md text-sm" onClick={() => goTo(2)}>
                Skip for now
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="text-5xl mb-lg">🎉</div>
              <h2 className="font-display text-2xl text-primary mb-sm">You're ready!</h2>
              <p className="text-md text-ink-muted mb-lg leading-relaxed">
                Browse any French webpage. Click on words you don't know.
                We'll open Le Monde for you to start exploring.
              </p>
              <div className="card p-md mb-lg text-left">
                <h3 className="text-sm font-semibold mb-sm">Quick tips:</h3>
                <ul className="text-sm text-ink-muted space-y-xs">
                  <li>• <span className="text-primary font-medium">Click</span> any highlighted word to see its meaning</li>
                  <li>• <span className="text-accent font-medium">Save</span> words to build your vocabulary</li>
                  <li>• <span className="text-reward font-medium">Review</span> daily to earn XP and keep your streak</li>
                </ul>
              </div>
              <button className="btn-accent w-full py-3 text-base" onClick={finish}>
                Start Learning →
              </button>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-xl">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={clsx(
                'w-2 h-2 rounded-full transition-all duration-300',
                i === step ? 'bg-accent w-6' : 'bg-cream-border'
              )}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideBack {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
