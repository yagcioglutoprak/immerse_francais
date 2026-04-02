# ImmerseFrançais

Chrome extension for immersive French vocabulary learning while browsing.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Tech Stack (v2 rewrite)
- Framework: WXT (wxt.dev) — Vite-powered Chrome extension framework
- Language: TypeScript (strict mode)
- UI: React 18+ (popup, dashboard, options, Shadow DOM overlays in content script)
- Styling: Tailwind CSS + Floating UI (content script) / Radix UI (popup/dashboard)
- Database: Dexie.js (IndexedDB wrapper, local-first)
- AI: Google Gemini API (2.5 Flash)
- SRS: SM-2 algorithm
- Charts: Recharts
- Testing: Vitest + Testing Library
- CI: GitHub Actions

## Key Constraints
- Content script DOM manipulation is vanilla TypeScript (no React). Only Shadow DOM overlays use React.
- Service worker timers must use chrome.alarms, not setInterval (MV3 limitation).
- API key stored in chrome.storage.local only, never sync.
- Lazy-load Shadow DOM UI on first word click to keep initial bundle <20KB.
