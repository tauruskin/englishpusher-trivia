# Session Notes — 2026-03-27

## Done today
- Created `CLAUDE.md` (project docs for AI assistants)
- Created memory files in auto-memory directory
- Added animated rotating gradient border to all 3 card components (CSS Houdini + conic-gradient, no packages)
  - Orange while answering → green on correct → red on wrong
- Added Back / Next / Skip navigation to question flow
  - `viewIndex` (viewed slide) is independent from `currentIndex` (game progress)
  - Skip cancels pending auto-advance and jumps immediately
  - Review mode: cards are read-only, streak hidden, no-op submit
- Fixed Skip showing before answering (`canGoNext` condition)
- Fixed nav bar layout jump (invisible placeholder buttons instead of hidden)
- Added `← Reviewing` badge on all 3 cards when in review mode (replaces streak badge)

## What's next (ideas / not started)
- Add more vocabulary topics (only 2 topics now: Adjectives, Stative Verbs)
- Consider Merriam-Webster API for higher-quality word audio (falls back to Web Speech API)
- End screen improvements (breakdown by question type, not just word list)
- Mobile layout polish (nav buttons, card sizing on small screens)
- Deploy pipeline check (currently manual `bun run deploy` to gh-pages)
