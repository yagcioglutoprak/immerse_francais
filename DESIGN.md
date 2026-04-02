# Design System — ImmerseFrançais

## Product Context
- **What this is:** Chrome extension for immersive French vocabulary learning while browsing
- **Who it's for:** Adult language learners who read real content (news, articles, Wikipedia), not gamers
- **Space/industry:** Language learning, browser extensions, EdTech
- **Project type:** Chrome extension (content overlay + popup + new tab dashboard + options)

## Aesthetic Direction
- **Direction:** Editorial/Refined with dopaminergic reward loops
- **Decoration level:** Intentional — subtle grain, frosted glass overlays, thin rule lines
- **Mood:** French editorial sophistication meets addictive learning. Elegant addiction. Think: a premium dictionary that gives you XP. Not childish like Duolingo, not generic like every other extension. The design channels the refinement of the language itself.
- **Reference sites:** Duolingo (reward mechanics only), Le Monde (editorial elegance), Stripe (UI craft)
- **Anti-patterns:** No purple gradients, no 3-column icon grids, no generic SaaS card layouts, no centered-everything, no decorative blobs

## Typography
- **Display/Hero:** Instrument Serif — editorial, elegant, distinctive. No competitor in language learning uses a serif. Instant differentiation. Free on Google Fonts.
- **Body:** DM Sans — clean, modern, excellent readability at 14px in content scripts and 16px in dashboard. Pairs beautifully with Instrument Serif's warmth.
- **UI/Labels:** DM Sans (semi-bold 600)
- **Data/Tables:** DM Sans with `font-variant-numeric: tabular-nums` for aligned numbers
- **Code/Mono:** JetBrains Mono — used in dashboard and word modal for etymology, word metadata, linguistic annotations. NOT loaded in initial content script bundle (dashboard-only on first load, lazy-loaded into Shadow DOM overlays).
- **Loading:** Google Fonts CDN for dashboard/popup: `https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap`
- **Content script font strategy:** Bundle DM Sans (400, 600) as woff2 in the extension. Instrument Serif loaded via `@import` inside Shadow DOM on first word click. Fallback stack: `'Instrument Serif', Georgia, 'Times New Roman', serif` for the word modal heading. JetBrains Mono deferred, fallback: `'Courier New', monospace`.
- **Scale:** 11px (micro labels) / 12px (tags, metadata) / 13px (secondary UI) / 14px (body in extension) / 16px (body in dashboard) / 20px (section titles) / 24px (card headers) / 32px (page titles) / 48px (hero display)

## Color

### Light Mode
- **Approach:** Restrained with punchy accent. Color is earned through action.
- **Primary:** `#1B4965` — deep teal-navy. French ink. Used for headers, word display, primary CTAs.
- **Primary Light:** `#2A6A8E` — hover state for primary.
- **Accent:** `#E8734A` — warm coral/orange. Dopaminergic. Used for reward CTAs, streaks, "save word" buttons, interactive highlights. NOT blue, NOT purple, NOT green. This is the addictive color.
- **Accent Light:** `#F0906E` — hover state.
- **Accent Glow:** `rgba(232, 115, 74, 0.15)` — pulse glow effect on due-today cards and CTAs.
- **Reward:** `#FFB020` — gold. XP badges, milestone celebrations, level-up indicators.
- **Reward Light:** `#FFF4D6` — reward badge backgrounds.
- **Success:** `#22C55E` — word saved confirmation, correct review answers. Brighter than typical success green for dopamine.
- **Success Light:** `#ECFDF5`
- **Error:** `#EF4444` — API failures, wrong answers.
- **Error Light:** `#FEF2F2`
- **Warning:** `#F59E0B` — words due for review, nearing streak loss.
- **Warning Light:** `#FFFBEB`
- **Info:** `#3B82F6` — informational states, adaptive mode notifications.
- **Info Light:** `#EFF6FF`
- **Streak:** `#FF6B35` — dedicated streak color. Fire emoji context.
- **Neutrals:**
  - Background: `#FAFAF8` (cream paper, not pure white)
  - Surface: `#FFFFFF`
  - Surface Alt: `#F3F2EE`
  - Border: `#E5E3DD`
  - Text: `#1A1A1A`
  - Text Muted: `#6B6860`
  - Text Light: `#9B978E`

### Dark Mode
- **Strategy:** Warm dark, like reading by lamplight. NOT cold blue/gray terminal dark. Do not desaturate accent colors on dark backgrounds, keep them fully saturated for dopamine impact.
- **Background:** `#0C0A09` — deep warm black
- **Surface:** `#1C1917` — warm dark brown
- **Surface Alt:** `#292524` — slightly lighter warm brown
- **Border:** `#3D3835` — warm brown border
- **Text:** `#F5F0EA` — warm cream text
- **Text Muted:** `#A8A29E`
- **Text Light:** `#78716C`
- **Primary:** `#5CB8E8` — lightened teal for dark backgrounds
- **Accent:** `#F0906E` — lightened coral
- **Accent Glow:** `rgba(240, 144, 110, 0.2)` — stronger glow on dark
- **Reward:** `#FFB020` — gold stays gold
- **Success:** `#4ADE80` — brighter green for dark
- **Error:** `#F87171`
- **Warning:** `#FBBF24`
- **Info:** `#60A5FA`
- **Streak:** `#FF8555`

### Word Highlighting Colors (on any page)
- **Unsaved words:** `background: rgba(27, 73, 101, 0.06)` + `border-bottom: 1px solid rgba(27, 73, 101, 0.15)` (subtle teal underline)
- **Saved words:** `background: rgba(34, 197, 94, 0.08)` + `border-bottom: 1px solid rgba(34, 197, 94, 0.2)` (subtle green underline)
- **Dark page adaptation:** Unsaved: `background: rgba(92, 184, 232, 0.08)` + `border-bottom: 1px solid rgba(92, 184, 232, 0.2)`. Saved: `background: rgba(74, 222, 128, 0.1)` + `border-bottom: 1px solid rgba(74, 222, 128, 0.25)`

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — language content needs breathing room
- **Scale:**
  - 2xs: 2px
  - xs: 4px
  - sm: 8px
  - md: 16px
  - lg: 24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px
- **Content padding:** 16px (extension overlays), 24px (dashboard cards), 32px (page sections)
- **Modal padding:** 12px (compact for on-page overlay)
- **Card gap:** 16px

## Layout
- **Approach:** Grid-disciplined for dashboard, creative-editorial for word modal
- **Grid:** Dashboard: 4-column stat row, 2-column below (vocab table + frequency chart)
- **Max content width:** 1120px (dashboard), 480px (word modal), 320px (popup)
- **Border radius:**
  - sm: 4px (tags, small elements)
  - md: 8px (buttons, inputs, cards)
  - lg: 12px (modal, major containers)
  - full: 9999px (pills, XP badges, progress bars)

## Motion
- **Approach:** Intentional with dopaminergic micro-celebrations
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:**
  - micro: 50-100ms (button press feedback)
  - short: 150-200ms (highlight appear, tooltip, hover states)
  - medium: 250-300ms (modal entrance, card flip in quiz)
  - long: 400-600ms (number count-up, progress bar fill)
  - celebration: 600-800ms (milestone toast entrance, confetti)
- **Specific animations:**
  - Modal entrance: 250ms scale(0.95 -> 1) + fade, ease-out
  - Word highlight: 150ms background-color transition
  - Save button success: button turns green + 200ms scale pulse (1 -> 1.05 -> 1)
  - Streak fire emoji: 1s infinite pulse (scale 1 -> 1.15 -> 1), ease-in-out
  - XP badge appearance: 300ms slide-up + fade, ease-out
  - Due-today card: 2s infinite subtle glow pulse (box-shadow 0 -> 20px -> 0), ease-in-out
  - Quiz card flip: 300ms rotateY(0 -> 180deg), dashboard only (quiz UI lives in new tab dashboard, not popup)
  - Progress bar fill: 800ms width transition, ease-out
  - Accent button hover: shimmer sweep via `::after` pseudo-element, `background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)`, `transform: translateX(-100%) -> translateX(200%)`, 600ms, button has `overflow: hidden`
- **Reduced motion:** Respect `prefers-reduced-motion`. Disable all animations, use instant transitions. Keep state changes (color, opacity) but remove movement.

## Dopaminergic System
- **XP points:** +5 per word saved, +10 per correct review, +25 per milestone
- **Streaks:** Daily use tracked, fire emoji + progress to next badge (3 days -> bronze, 7 -> silver, 30 -> gold)
- **Levels:** Level = floor(words_saved / 50). Progress bar shows (words_saved % 50) / 50. Level displayed as number in stat card.
- **Milestones:** Toast notifications for: 10th word, 50th word, 100th word, first 7-day streak, first 100% review session
- **Progress bars:** Under every stat card showing progress to next threshold
- **Color token mapping:** Streak counter uses `Streak` token (#FF6B35 light / #FF8555 dark). XP badge uses `Reward` (#FFB020) text on `Reward Light` (#FFF4D6) background. Save button success flash uses `Success` (#22C55E).
- **Visual reward hierarchy:** Save word (small: green flash + XP badge) < Complete review session (medium: stat count-up + progress fill) < Milestone (large: toast + celebration)
- **Milestone toasts:** Position bottom-center, 400px max-width, border-radius lg (12px), shadow lg, auto-dismiss after 4s with 300ms fade-out. Uses accent background for celebratory toasts.

## Shadows
- **sm:** `0 1px 3px rgba(26,26,26,0.06)` — subtle lift for inputs
- **md:** `0 4px 12px rgba(26,26,26,0.08)` — cards, word modal
- **lg:** `0 8px 32px rgba(26,26,26,0.12)` — floating button, milestone toasts
- **Dark mode shadows:**
  - sm: `0 1px 3px rgba(0,0,0,0.2)`
  - md: `0 4px 12px rgba(0,0,0,0.3)`
  - lg: `0 8px 32px rgba(0,0,0,0.4)`

## Component States
- **Focus:** 2px solid ring using `Accent` color with 2px offset. On dark: use `Accent` dark variant (#F0906E).
- **Active/Pressed:** scale(0.97) + 50ms transition.
- **Disabled:** opacity 0.4, cursor not-allowed, no hover effects.

## Surface-Specific Notes
- **Options page:** Max width 640px, centered. Uses same card/grid patterns as dashboard. Single column layout with section headers in Instrument Serif.
- **Popup (320px):** Compact density. Body text at 14px. No Instrument Serif in body, only brand name.
- **Dashboard (new tab):** Full density. Body text at 16px. Full typography stack including JetBrains Mono.
- **Content overlay (Shadow DOM):** Minimal footprint. DM Sans bundled, Instrument Serif lazy-loaded for word modal heading only. No JetBrains Mono on first load.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-30 | Instrument Serif for display | No competitor uses serif. Channels French editorial design. Instant differentiation. |
| 2026-03-30 | Coral accent (#E8734A) | Warm, energetic, dopaminergic. Every other language app uses blue/green/purple. Unclaimed color space. |
| 2026-03-30 | Cream paper backgrounds (#FAFAF8) | Warmer than pure white. Pages feel like paper, not screens. Better for long reading sessions. |
| 2026-03-30 | Warm dark mode (#0C0A09) | Like reading by lamplight, not staring at a terminal. Warm browns instead of cold grays. |
| 2026-03-30 | XP + streaks + progress bars | Dopaminergic reward system. Every action feels satisfying. Sophisticated addiction, not gamified childishness. |
| 2026-03-30 | Pulsing glow on due-today | Draws attention to daily review without being obnoxious. Subtle urgency. |
