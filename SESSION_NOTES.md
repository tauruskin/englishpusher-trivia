# Session Notes — 2026-03-28

## Done — Session 1 (2026-03-27)
- Created `CLAUDE.md` and auto-memory files
- Animated rotating gradient border on all 3 card components (CSS Houdini, no packages)
  - Orange → green (correct) → red (wrong), speed changes too
- Back / Next / Skip navigation with dual-index pattern (`viewIndex` vs `currentIndex`)
  - Review mode: read-only cards, no-op submit, streak hidden
- Fixed `canGoNext` condition (was always true before answering)
- Fixed nav bar layout jump (transparent placeholders keep space)
- Added `← Reviewing` badge (replaces streak badge in review mode)

## Done — Session 2 (2026-03-28)
- Added new vocabulary topics:
  - **Jobs** topic: 10 new words from Lesson 6 Work (career, wages, full-time, etc.)
  - **Personality & Relationships**: merged personality-adjectives + personality-adjectives-opposites into one 48-word topic
  - Added 10 People & Relationships words (colleagues, teammates, get on well with, take after, etc.)
  - Fixed ambiguous example sentences for "get on well with" / "be friendly with"
  - Deleted deprecated `personality-adjectives-opposites.ts`
- Increased matching card ratio `0.15 → 0.25` (48-word topics now get 2 matching cards)
- Animated landing screen with topic selection menu
  - `motion` package installed; `MenuVertical` component with staggered slide-in animation
  - URL param logic: `?topic=id` skips landing, no param shows landing
  - App title click returns to landing during game
  - Old dropdown removed
- Teacher character + speech bubble on landing page (desktop only, hidden mobile)
  - Two-column layout: teacher left, menu right (`max-w-4xl`)
  - Speech bubble with double CSS triangle tail, spring pop-in animation
- Web Audio API sound feedback (no sound files)
  - Correct: C5 → E5 ascending sine tones ("ding ding")
  - Wrong: descending sawtooth tones (soft buzz)
  - Controlled by existing mute button; respects browser autoplay policy
- Favicon downloaded from englishpusher.in.ua and added to `public/`
- Custom domain `trivia.englishpusher.in.ua` fixed (CNAME moved to `public/` so it ships in deploy build)
- Pulled DNS/deploy changes from GitHub (CNAME file + deploy.yml)

## What's next (ideas / not started)
- Keyboard shortcuts (1–4 for multiple choice, Enter to submit, Space to advance)
- Estimated completion time on landing topic cards ("~10 min · 48 words")
- Dynamic encouragement line below progress bar ("Halfway there!", "Last few!", etc.)
- Dark mode toggle (CSS vars already set up, minimal work)
- localStorage progress — remember weak words across sessions, show badge on landing
- End screen improvements (breakdown by question type)
- Fix CSS warning: move `@import` fonts line above `@tailwind` directives in `index.css`
