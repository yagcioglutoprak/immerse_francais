import { useState } from 'react';
import { useProfile, useDarkMode, useWords } from '../../lib/hooks';
import { db } from '../../lib/db';
import { clsx } from 'clsx';

export default function App() {
  const { profile, update } = useProfile();
  const { words } = useWords();
  const { isDark, toggle } = useDarkMode();
  const [apiKey, setApiKey] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const testApiKey = async () => {
    setApiStatus('testing');
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "bonjour" in one word.' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      if (res.ok) {
        await update({ apiKey });
        setApiStatus('success');
      } else {
        setApiStatus('error');
      }
    } catch {
      setApiStatus('error');
    }
  };

  const exportVocab = () => {
    const data = JSON.stringify(words, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `immerse-francais-vocab-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = async () => {
    await db.words.clear();
    await db.stats.clear();
    await db.profile.clear();
    setShowClearConfirm(false);
    window.location.reload();
  };

  return (
    <div className={clsx('min-h-screen bg-cream-bg dark:bg-warm-bg text-ink dark:text-warm-text py-xl', isDark && 'dark')}>
      <div className="max-w-[640px] mx-auto px-lg">
        <div className="flex items-center justify-between mb-xl">
          <h1 className="font-display text-2xl text-primary dark:text-primary-dark">Settings</h1>
          <button onClick={toggle} className="btn-ghost px-3 py-1.5 text-sm">
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* API Configuration */}
        <section className="card p-lg mb-md">
          <h2 className="font-display text-lg text-primary dark:text-primary-dark mb-md">API Configuration</h2>
          <label className="block text-sm font-semibold text-ink-muted dark:text-warm-muted mb-xs">
            Gemini API Key
          </label>
          <div className="flex gap-sm">
            <input
              type="password"
              className="input-field flex-1"
              placeholder="Enter your Gemini API key..."
              value={apiKey || profile?.apiKey || ''}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button className="btn-primary text-sm whitespace-nowrap" onClick={testApiKey} disabled={!apiKey}>
              {apiStatus === 'testing' ? 'Testing...' : 'Test & Save'}
            </button>
          </div>
          {apiStatus === 'success' && (
            <p className="text-sm text-success dark:text-success-dark mt-xs font-medium">API key verified and saved.</p>
          )}
          {apiStatus === 'error' && (
            <p className="text-sm text-error dark:text-error-dark mt-xs font-medium">Invalid API key. Please check and try again.</p>
          )}
          <p className="text-xs text-ink-light dark:text-warm-light mt-sm">
            Get a free API key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary dark:text-primary-dark underline">
              Google AI Studio
            </a>
          </p>
        </section>

        {/* Display */}
        <section className="card p-lg mb-md">
          <h2 className="font-display text-lg text-primary dark:text-primary-dark mb-md">Display</h2>
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Theme</p>
                <p className="text-xs text-ink-light dark:text-warm-light">Choose your preferred color scheme</p>
              </div>
              <select
                className="input-field w-auto text-sm"
                value={profile?.darkMode ?? 'system'}
                onChange={(e) => update({ darkMode: e.target.value as any })}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Word Highlighting</p>
                <p className="text-xs text-ink-light dark:text-warm-light">Which words to highlight on web pages</p>
              </div>
              <select
                className="input-field w-auto text-sm"
                value={profile?.highlightMode ?? 'all'}
                onChange={(e) => update({ highlightMode: e.target.value as any })}
              >
                <option value="all">All words</option>
                <option value="saved">Saved only</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="card p-lg mb-md">
          <h2 className="font-display text-lg text-primary dark:text-primary-dark mb-md">Data</h2>
          <div className="flex flex-col gap-sm">
            <button className="btn-ghost text-sm text-left" onClick={exportVocab}>
              📥 Export vocabulary ({words.length} words)
            </button>
            {!showClearConfirm ? (
              <button className="btn-ghost text-sm text-left text-error dark:text-error-dark border-error/30" onClick={() => setShowClearConfirm(true)}>
                🗑️ Clear all data
              </button>
            ) : (
              <div className="bg-error-light dark:bg-error-dark/10 rounded-md p-sm">
                <p className="text-sm text-error dark:text-error-dark font-semibold mb-sm">
                  This will delete all your vocabulary and progress. This cannot be undone.
                </p>
                <div className="flex gap-sm">
                  <button className="btn-ghost text-sm flex-1" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                  <button
                    className="flex-1 bg-error text-white text-sm font-semibold py-2 rounded-md hover:bg-error/90 transition-colors"
                    onClick={clearAllData}
                  >
                    Delete Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* About */}
        <section className="card p-lg">
          <h2 className="font-display text-lg text-primary dark:text-primary-dark mb-md">About</h2>
          <div className="text-sm text-ink-muted dark:text-warm-muted space-y-xs">
            <p><strong>ImmerseFrançais</strong> v2.0.0</p>
            <p>Learn French vocabulary while browsing the web.</p>
            <p className="text-xs text-ink-light dark:text-warm-light mt-sm">
              Built with WXT, React, Tailwind CSS, and Google Gemini AI.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
