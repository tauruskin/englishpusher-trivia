# CLAUDE.md — EnglishPusher Trivia

## Project Overview

**EnglishPusher Trivia** is a vocabulary quiz game for adult English learners. Users practice English-to-Ukrainian vocabulary through 6 interactive question formats with no login required.

**Live**: GitHub Pages via `gh-pages` branch.
**Repo**: https://github.com/tauruskin/englishpusher-trivia

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 (SWC) |
| Styling | Tailwind CSS 3 + CSS custom properties |
| UI Primitives | shadcn/ui (Radix UI) |
| Routing | React Router v6 |
| State | React Hooks + TanStack Query 5 |
| TTS | Web Speech API (browser native) |
| Testing | Vitest + Testing Library |
| Deploy | gh-pages npm package |

### Dev / Deploy Commands

```bash
bun run dev          # Start dev server on localhost:8080
bun run build        # Production build → dist/
bun run preview      # Preview dist/ locally
bun run test         # Run Vitest once
bun run test:watch   # Vitest watch mode
bun run lint         # ESLint check
bun run deploy       # Build + push to gh-pages branch
```

---

## Project Structure

```
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Root: routing + providers
├── index.css                   # Tailwind imports + custom animations & CSS vars
│
├── pages/
│   ├── Index.tsx               # Main game page (layout, header, footer)
│   └── NotFound.tsx            # 404 page
│
├── components/
│   ├── QuestionCard.tsx        # Multiple choice & fill-in-the-blank
│   ├── TrueFalseCard.tsx       # True/False question format
│   ├── MatchingCard.tsx        # 5-word matching pairs
│   ├── EndScreen.tsx           # Score summary + weak word practice
│   ├── ProgressBar.tsx         # Visual progress indicator
│   ├── ScoreBadge.tsx          # Live score display
│   ├── GameCharacter.tsx       # Animated teacher character (4 poses)
│   ├── SpeakerButton.tsx       # TTS trigger button
│   └── ui/                     # shadcn/ui primitives (do not edit manually)
│
├── hooks/
│   ├── useGame.ts              # Core game logic: question gen, scoring, streaks
│   ├── useTTS.ts               # Text-to-speech + mute toggle
│   ├── use-mobile.tsx          # Mobile breakpoint detection
│   └── use-toast.ts            # Toast notifications
│
├── data/
│   ├── wordList.ts             # Re-exports all topic word lists
│   └── topics/
│       ├── index.ts            # Topic registry (add new topics here)
│       ├── adjectives.ts       # 31 -ed/-ing adjective pairs (EN → UK)
│       └── stative-verbs.ts    # Stative verbs topic
│
└── assets/
    └── teacher-*.png           # Character illustrations (idle, correct, wrong, think)

public/
└── logo.png                    # EnglishPusher branding

Configuration:
  vite.config.ts                # base path, port 8080, @/ alias
  tailwind.config.ts            # custom color tokens, fonts, animations
  tsconfig.json / tsconfig.app.json
  components.json               # shadcn/ui CLI config
  vitest.config.ts
```

---

## Styling & Architecture Conventions

### Styling
- **Tailwind CSS** utility classes everywhere — no CSS modules
- **CSS custom properties** (HSL) defined in `src/index.css` `:root` for the design system (primary warm orange, cream background, green success, red error)
- **Custom animations** in `index.css`: `slide-up`, `shake`, `emoji-correct`, `emoji-wrong`, `character-jump`, `character-celebrate`, `character-think`, `character-idle`
- shadcn/ui components live in `src/components/ui/` — regenerate with `bunx shadcn add <component>`, don't edit manually

### Architecture
- **Word data shape**: `{ word: string, translation: string, example?: string }` — English word, Ukrainian translation, optional sentence with `_` blank
- **Question types**: `en-to-native`, `native-to-en`, `true-false`, `type-word`, `sentence-completion`, `matching`
- **Adding a topic**: create `src/data/topics/<name>.ts`, export `WordEntry[]`, register in `src/data/topics/index.ts`
- **Path alias**: `@/` maps to `src/` — always use this for imports
- **TypeScript**: loose config (allowJs, no strict null checks) — intentional for rapid dev
- **No login, no backend** — purely client-side, all state in React hooks

---

## AI Assistant Rules

1. **Always read a file before editing it.**
2. **Use `bun` as the package manager** (bun.lock is present; fall back to npm only if bun unavailable).
3. **Push directly to `main`** — this is a solo pet project, no PRs needed.
4. **Update the Changelog section below** after completing any significant work in a session.
5. **Update MEMORY.md** in the auto-memory directory (`C:\Users\Oleksandr\.claude\projects\d--VIBE-CODING-englishpusher-trivia\memory\MEMORY.md`) after each session.
6. **Don't touch `src/components/ui/`** — those are shadcn/ui generated files; use the CLI to add/update them.
7. Keep the word data structure consistent — always `{ word, translation, example? }`.

---

## Changelog

<!-- Add entries here after each session. Format: ### YYYY-MM-DD — brief description -->

### 2026-03-27 — Initial setup
- Created CLAUDE.md with project overview, structure, conventions, and AI rules
- Created MEMORY.md in auto-memory directory
