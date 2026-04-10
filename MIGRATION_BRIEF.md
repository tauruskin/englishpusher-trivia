# B1 Trivia — Migration Brief

> This document contains everything needed to rebuild the EnglishPusher Trivia app
> from scratch in a different React 18 + Vite + Tailwind + motion/react project
> (no shadcn, no react-router). All code snippets, class names, frequencies, and
> animation values are exact.

---

## 1. QUESTION TYPES

There are **6 question type strings** used in code (the `QuestionType` union):

```ts
type QuestionType =
  | "en-to-native"
  | "native-to-en"
  | "type-word"
  | "true-false"
  | "matching"
  | "sentence-completion";
```

### 1.1 `en-to-native` — Multiple Choice (EN → UK)

- **Shown:** English word as a large heading (`text-2xl md:text-3xl font-bold`). A speaker button next to it auto-fires TTS on load (500 ms delay). Prompt text: *"What does this word mean?"*. Type label: *"Multiple Choice"*.
- **Input:** 4 option buttons (Ukrainian translations). One correct, three random wrong from the pool.
- **Correctness:** `answer.trim().toLowerCase() === correctAnswer.toLowerCase()` — correctAnswer is `word.translation`.
- **Special UI:** Speaker button fires TTS on every mount (auto via `useEffect` with 500 ms delay, only after first user interaction).

### 1.2 `native-to-en` — Reverse Multiple Choice (UK → EN)

- **Shown:** Ukrainian translation as a large heading. Prompt: *"Which English word matches?"*. Type label: *"Multiple Choice"*. A speaker button is shown but speaks the **correct English answer** (not the shown word), triggered only on manual click.
- **Input:** 4 option buttons (English words).
- **Correctness:** `correctAnswer` is `word.word`.
- **Special UI:** No auto-TTS on load. Speaker fires on click beside the heading (shows `correctAnswer` word for pronunciation).

### 1.3 `type-word` — Type the Word

- **Shown:** Ukrainian translation as a large heading. Prompt: *"Type the English word:"*. Type label: *"Type the Word"*.
- **Input:** Text `<input>` (autofocus), plus a "Submit" button. Also submits on Enter key.
- **Correctness:** `answer.trim().toLowerCase() === word.word.toLowerCase()`.
- **After answer:**
  - Correct: Input replaced by `✅ {correctAnswer}` in `text-success` with `animate-bounce-once`.
  - Wrong: Shows `❌ {selectedAnswer}` in `text-destructive animate-shake`, then `Correct: {correctAnswer}` in `text-success` below.
- **Auto-advance delay:** Correct → 2000 ms; Wrong → 3000 ms (longer so user reads).
- **Special UI:** Speaker button appears beside heading (speaks correctAnswer on click).

### 1.4 `true-false` — True or False

- **Shown:** English word as heading (`text-2xl md:text-3xl`). Below it: Ukrainian translation shown as *"= {shownTranslation}"* (`text-lg text-muted-foreground`). Prompt: *"Does this translation match the word?"*. Type label: *"True or False"*.
- **`shownTranslation`** is built at question-generation time: 50% chance it's the real translation (answer = "true"), 50% chance it's a random other word's translation (answer = "false").
- **Input:** Two buttons side by side: `✅ True` and `❌ False`. Values submitted: the strings `"true"` or `"false"`.
- **Correctness:** `correctAnswer` is the string `"true"` or `"false"`.
- **Special UI:** Auto-TTS on mount (500 ms delay, English word). Speaker button next to the heading for manual replay.

### 1.5 `matching` — Match the Pairs

- **Shown:** Two columns: left = English words, right = shuffled Ukrainian translations (shuffled once on mount via `useMemo`). Prompt: *"Click an English word, then click its Ukrainian translation"*. Type label: *"Match the Pairs"*.
- **Input:** Click to select an English word (highlights orange), then click a Ukrainian word to attempt a match.
- **Correctness per pair:** `entry.translation === selectedTranslation` (exact string).
- **Correct pair:** Both cells turn green (`bg-success/20 border-success text-success`), added to `correctPairs` Set.
- **Wrong pair:** Both cells shake (`animate-shake`) for 500 ms, then reset.
- **Completion:** When all pairs matched, `allDone = true`. After 2000 ms auto-advances, submitting the string `"matched"`. A `🎉` emoji overlay appears centered on the card (`text-7xl animate-emoji-correct`). Character switches to `celebrate` pose.
- **On review (navigating back):** Initialise `correctPairs` with all words and `allDone = true` so card shows completed state, not a fresh interactive one.
- **Card contains 5 words** per matching group.
- **Special UI:** Each English word tile has a small inline `SpeakerButton` (manual click TTS) unless already matched.

### 1.6 `sentence-completion` — Complete the Sentence

- **Shown:** Full example sentence with `___` replaced by an underlined blank (`border-b-2 border-primary min-w-[80px]`). After answering, the blank fills with the correct answer. Prompt: *"Fill in the missing word:"*. Type label: *"Complete the Sentence"*.
- **Input:** 4 option buttons (English words). Correct answer is the missing word.
- **Correctness:** `correctAnswer` is `word.word`.
- **Special UI:** No auto-TTS on load (explicitly suppressed). The sentence comes from `word.example` with `___` as the blank marker.
- **Auto-advance delay:** Correct → 2000 ms; Wrong → 4000 ms.

---

## 2. GAME FLOW

### Screens

1. **Landing / Topic Select** — shown on initial load if no `?topic=` URL param present.
2. **Game Screen** — active while `!gameOver`.
3. **End Screen** — shown when `gameOver === true`.

### State Machine

```
showLanding = true   →  user picks topic  →  showLanding = false, game.restart(words)
game playing         →  currentIndex reaches questions.length  →  gameOver = true
gameOver             →  "Play Again" or "Practice Weak Words"  →  game.restart(pool)
```

### URL param

`?topic=<topicId>` — on load, if the param is present and matches a known topic ID, the landing is skipped and the game starts immediately with that topic.

### Question Queue Generation (`generateQuestions(pool)`)

1. Pool is **shuffled** (Fisher-Yates).
2. **Matching cards first:** Take `max(5, round(pool.length * 0.25 / 5) * 5)` words. Split into groups of 5; each group becomes one matching question. All matching questions go at the **front** of the queue.
3. **Remaining words** split into 4 equal zones by index:
   - Zone 0 → `en-to-native`
   - Zone 1 → `true-false`
   - Zone 2 → `type-word`
   - Zone 3 → `sentence-completion` if `word.example` exists, else `en-to-native`
4. Wrong options for MC/true-false/sentence-completion are drawn randomly from the full pool (not the zone), excluding the target word.

### Review Navigation

The game supports going **back** to review past questions without breaking state:

- `currentIndex` — the furthest question reached (always advances forward).
- `viewIndex` — what's currently displayed. Can be < `currentIndex` when reviewing.
- `isReviewing = viewIndex < currentIndex`.
- When `isReviewing`, `onSubmit` is a no-op and the card shows a `← Reviewing` badge instead of the streak badge.
- `displayedAnswered`, `displayedSelectedAnswer`, `displayedIsCorrect` — derived from `resultsMap[viewIndex]` when reviewing.
- Back/Next nav buttons appear when `canGoPrev` or `canGoNext`.

### Auto-Advance Delays

| Question type | Correct delay | Wrong delay |
|---|---|---|
| matching | 300 ms (immediate) | n/a (no auto-advance, user completes all pairs) |
| type-word | 2000 ms | 3000 ms |
| sentence-completion | 2000 ms | 4000 ms |
| all others (MC, T/F) | 1000 ms | 1000 ms |

---

## 3. HEADER CONTROLS

### Layout

`<header>` with `border-b border-border px-6 py-4 bg-card shadow-sm`. Inner container: `max-w-3xl mx-auto flex items-center justify-between`.

### Left side

- **Logo image** (`public/logo.png`, `h-10 w-auto`) wrapped in `<a>` linking to `https://www.englishpusher.in.ua/` (opens in new tab).
- **Title** `<h1>` `font-display text-xl font-bold text-foreground tracking-tight`. Text: `Englishpusher` + `<span className="text-primary"> Trivia</span>`. Clickable when not on landing — calls `handleGoToLanding()`. Below title: `<p className="text-xs text-muted-foreground">` showing `selectedTopic.name` (hidden on landing).

### Right side

All buttons: `w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground`

**Mute/Unmute button** (always visible):
- Muted state icon (SVG, 18×18):
```html
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
  <line x1="23" y1="9" x2="17" y2="15"/>
  <line x1="17" y1="9" x2="23" y2="15"/>
</svg>
```
- Unmuted state icon (SVG, 18×18):
```html
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
</svg>
```
- Toggles `muted` state. When muting, calls `window.speechSynthesis.cancel()`. Does **not** mute the Web Audio API tones separately — the `muted` flag gates both.

**Restart button** (visible when `!showLanding && !game.gameOver`):
- Icon (SVG, 17×17):
```html
<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <polyline points="1 4 1 10 7 10"/>
  <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
</svg>
```
- Calls `handlePlayAgain()` → `game.restart(selectedTopic.wordList)`. Resets score, index, results, streak, question queue (reshuffled). Does **not** change the selected topic.

**Score badge** (visible when `!showLanding && !game.gameOver`):
- `<div className="flex items-center gap-1.5 bg-secondary px-2.5 py-1.5 rounded-lg font-display whitespace-nowrap">`
- Content: `<span className="text-primary font-bold text-sm">{score}/{total}</span>` where `total = currentIndex + (answered ? 1 : 0)`.

**Streak counter:** Was removed from the header. It lives only on the question cards as a badge.

---

## 4. SOUND EFFECTS

All audio uses the **Web Audio API** (`AudioContext`), synthesised — no audio files.

### Guard conditions

Both `playCorrect` and `playWrong` check:
1. `muted === false`
2. `hasInteracted.current === true` (set on first click or touchstart — browser autoplay policy)

### Correct answer sound

Two sine tones played sequentially:

```ts
playTone(523.25, 0,    0.12, "sine", 0.25); // C5, starts immediately, 120ms
playTone(659.25, 0.13, 0.22, "sine", 0.25); // E5, starts 130ms later, 220ms
```

Each tone: oscillator → gain node → destination. Volume ramps from `0.25` exponentially to `0.001` over the duration.

### Wrong answer sound

Two sawtooth tones, lower volume:

```ts
playTone(220, 0,    0.15, "sawtooth", 0.15); // A3, starts immediately, 150ms
playTone(180, 0.12, 0.25, "sawtooth", 0.12); // ~F#3, starts 120ms later, 250ms
```

### `playTone` implementation

```ts
function playTone(freq, startOffset, duration, type = "sine", volume = 0.25) {
  const ctx = getAudioCtx(); // lazily created / reused AudioContext
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration);
}
```

### Triggering in Index.tsx

```ts
useEffect(() => {
  if (game.answered && !prevAnsweredRef.current && game.isCorrect !== null) {
    if (game.isCorrect) tts.playCorrect();
    else tts.playWrong();
  }
  prevAnsweredRef.current = game.answered;
}, [game.answered, game.isCorrect]);
```

### Word pronunciation (TTS)

Uses `window.speechSynthesis` (Web Speech API).

**Voice preference order:** `["Daniel", "Karen", "Samantha"]` (checks `voice.name.includes(name) && voice.lang.startsWith("en")`). Falls back to first `en-US` voice, then first `en-*` voice.

**Speech settings:** `utterance.lang = "en-US"`, `utterance.rate = 0.85`.

**When it fires:**
- `en-to-native`: auto-fires 500 ms after mount via `useEffect`, but only if `hasInteracted.current` (i.e. user has clicked anything first).
- `true-false`: same — auto-fires on mount with 500 ms delay.
- `native-to-en`, `type-word`, `sentence-completion`: **no auto-fire**. Speaker button triggers manual-only TTS.
- `matching`: each English word tile has a `SpeakerButton` (manual only); no auto-fire.

**`speak` vs `speakIfInteracted`:**
- `speak(word)` — always fires (if not muted).
- `speakIfInteracted(word)` — only fires if `hasInteracted.current === true`. Used for auto-fire on card mount.

**Muting TTS:** `toggleMute()` → if now muted, calls `window.speechSynthesis.cancel()` immediately. Future calls to `speak` are no-ops while `muted`.

---

## 5. TEACHER CHARACTER REACTIONS

### Assets

Four PNG files in `src/assets/`:
- `teacher-thinking.png` — used for `idle` and `thinking` poses
- `teacher-correct.png` — used for `happy` pose
- `teacher-celebrate.png` — used for `celebrate` pose
- `teacher-sad.png` — used for `sad` pose

### Pose map

```ts
const poseMap = {
  idle:      { src: teacher-thinking.png, animClass: "animate-character-idle" },
  thinking:  { src: teacher-thinking.png, animClass: "animate-character-think" },
  happy:     { src: teacher-correct.png,  animClass: "animate-character-jump" },
  sad:       { src: teacher-sad.png,      animClass: "animate-shake" },
  celebrate: { src: teacher-celebrate.png, animClass: "animate-character-celebrate" },
};
```

### Render

```tsx
<div className={`hidden md:flex items-center justify-center ${className} ${animClass}`}>
  <img src={src} alt="Teacher character" width={270} height={405} className="object-contain max-w-full" />
</div>
```

**Hidden on mobile** (`hidden md:flex`). Width 270px, height 405px.

### Pose triggers per card

**QuestionCard / TrueFalseCard:**
```ts
const characterPose = !answered ? "thinking" : isCorrect ? "happy" : "sad";
```

**MatchingCard:**
```ts
const characterPose = allDone ? "celebrate" : "thinking";
```

**EndScreen:**
```ts
const characterPose = isPerfect ? "celebrate" : hasWeakWords ? "thinking" : "happy";
```

**Landing screen:** `pose="idle"` (permanent gentle bob).

---

## 6. VISUAL FEEDBACK ON ANSWER

### Gradient border (`BorderRotate` component)

The card wrapper is a `div` using CSS Houdini `@property --gradient-angle` + `conic-gradient` for an animated spinning border.

**Requires in CSS:**
```css
@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes gradient-rotate {
  from { --gradient-angle: 0deg; }
  to   { --gradient-angle: 360deg; }
}

.gradient-border-auto {
  animation: gradient-rotate var(--animation-duration, 5s) linear infinite;
}
```

**The `style` object on the card div:**
```ts
{
  '--animation-duration': `${animationSpeed}s`,
  border: `2px solid transparent`,
  borderRadius: `16px`,
  backgroundImage: `
    linear-gradient(#ffffff, #ffffff),
    conic-gradient(
      from var(--gradient-angle, 0deg),
      ${primary} 0%, ${secondary} 37%,
      ${accent} 30%, ${secondary} 33%,
      ${primary} 40%, ${primary} 50%,
      ${secondary} 77%, ${accent} 80%,
      ${secondary} 83%, ${primary} 90%
    )
  `,
  backgroundClip: 'padding-box, border-box',
  backgroundOrigin: 'padding-box, border-box',
}
```

**Color states:**

| State | primary | secondary | accent | animationSpeed |
|---|---|---|---|---|
| Unanswered | `#c06010` | `#f07c1a` | `#fcc870` | 6s |
| Correct | `#1a7040` | `#34b268` | `#7dd4a0` | 1.5s |
| Wrong | `#8b1a1a` | `#d54242` | `#e88888` | 4s |
| Matching (complete) | `#1a7040` | `#34b268` | `#7dd4a0` | 1.5s |

### Reaction emoji overlay

```tsx
{answered && isCorrect !== null && (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
    <span className={`text-7xl ${isCorrect ? 'animate-emoji-correct' : 'animate-emoji-wrong'}`}>
      {isCorrect ? '🎉' : '😬'}
    </span>
  </div>
)}
```

### Option button states (MC / sentence-completion)

```ts
// Unanswered
"bg-secondary hover:bg-muted border-border hover:border-primary/50 text-foreground hover:scale-[1.02] active:scale-[0.98]"

// Correct answer (after answering)
"bg-success/20 border-success text-success animate-bounce-once"

// Selected wrong answer
"bg-destructive/20 border-destructive text-destructive animate-shake"

// Other unselected options (after answering)
"bg-secondary border-border text-muted-foreground opacity-50"
```

### True/False button states — identical pattern to above using `getBtnStyle(value)`.

### Card transition (entering)

When `transitioning === false`: `opacity-100 translate-y-0 animate-slide-up`
When `transitioning === true`: `opacity-0 translate-y-4`

### Streak / Review badge (absolute positioned, top-right corner of card)

```tsx
// Review mode
<div className="absolute -top-1 -right-1 !mt-0 bg-muted text-muted-foreground px-3 py-1 rounded-bl-xl rounded-tr-2xl text-xs font-bold">
  ← Reviewing
</div>

// Streak >= 2 (not reviewing)
<div className={`absolute -top-1 -right-1 !mt-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl rounded-tr-2xl font-display text-sm font-bold ${streak >= 3 ? 'animate-pulse' : ''}`}>
  🔥 {streak} in a row!
</div>
```

The `!mt-0` (`!important margin-top: 0`) is critical — it overrides Tailwind `space-y-*` margin applied to sibling children that would otherwise shift the badge when the emoji overlay div renders above it in the DOM.

---

## 7. END SCREEN

### Layout

`<div className="flex items-start gap-8 justify-center">` — character on the left (desktop only), content on the right.

### Score calculation

```ts
const pct = Math.round((score / total) * 100);
const isPerfect = score === total;
const isGreat = score >= Math.ceil(total * 0.7); // ≥ 70%
```

### Message / emoji by score

| Condition | Emoji | Message |
|---|---|---|
| Perfect (100%) | 🏆 (animate-bounce) | "PERFECT!" |
| Great (≥70%) | 🎉 (animate-emoji-correct) | "Excellent work!" |
| ≥50% | 👍 | "Good effort!" |
| <50% | 💪 | "Keep practicing! You've got this! 💪" |

### Score display

```tsx
<div className="text-4xl font-display font-bold text-primary">{pct}%</div>
<p className="text-muted-foreground text-sm">
  <span className="text-foreground font-semibold">{score}</span> out of{" "}
  <span className="text-foreground font-semibold">{total}</span> correct
</p>
```

### Word lists

Results are deduplicated by `word.word` (first occurrence wins):
- **"✅ Words you know"** — correct answers, scrollable list (`max-h-48 overflow-y-auto`), `bg-card border-border`.
- **"❌ Words to practice"** — incorrect answers, `border-destructive/30`. Each row: `{word.word} — {word.translation}` + question type label on the right.

### Buttons

```tsx
// Visible only if incorrectWords.length > 0
<button onClick={() => onPracticeWeak(incorrectWords.map(r => r.word))}
  className="flex-1 px-6 py-3 rounded-lg bg-destructive text-destructive-foreground font-display font-semibold text-base hover:opacity-90 hover:scale-105 active:scale-95 transition-all">
  Practice weak words 🎯
</button>

// Always visible
<button onClick={onRestart}
  className="flex-1 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-base hover:opacity-90 hover:scale-105 active:scale-95 transition-all">
  Play Again 🔄
</button>
```

`onPracticeWeak(words)` calls `game.restart(words)` — restarts the game with only the wrong words as the pool. `onRestart` calls `game.restart(selectedTopic.wordList)` — full topic restart.

### Confetti (canvas-confetti)

Fires when `isGreat` (≥70%):

```ts
const duration = isPerfect ? 3000 : 1500;
const end = Date.now() + duration;
const frame = () => {
  confetti({ particleCount: isPerfect ? 8 : 4, angle: 60, spread: 55,
    origin: { x: 0, y: 0.6 }, colors: ["#f59e0b","#ef4444","#10b981","#3b82f6","#8b5cf6"] });
  confetti({ particleCount: isPerfect ? 8 : 4, angle: 120, spread: 55,
    origin: { x: 1, y: 0.6 }, colors: ["#f59e0b","#ef4444","#10b981","#3b82f6","#8b5cf6"] });
  if (Date.now() < end) requestAnimationFrame(frame);
};
frame();
```

Two bursts per frame — from left (`x:0`) and right (`x:1`).

---

## 8. STREAK / SCORE MECHANICS

### Score

- Integer count of correct answers.
- Incremented by 1 on each correct `submitAnswer`.
- Displayed as `{score}/{currentIndex + (answered ? 1 : 0)}` — denominator is questions **attempted so far**, not total.
- Resets to 0 on `restart()`.

### Streak

- Incremented by 1 on each correct answer.
- **Reset to 0 on any wrong answer**.
- `streak` is passed to card components but **never shown in the header** — only on the card badge.
- Badge shows when `streak >= 2` — text: `🔥 {streak} in a row!`
- Badge **pulses** (`animate-pulse`) when `streak >= 3`.
- When `isReviewing`, streak is passed as `0` to suppress the badge on reviewed cards.

### Results recording

For `matching`: all 5 words in the group are recorded as `correct: true` or `correct: false` (the match outcome applies to all).

For all others: one `AnswerResult` per question.

```ts
interface AnswerResult {
  word: WordEntry;
  questionType: QuestionType;
  correct: boolean;
}
```

`resultsMap` stores `{ [questionIndex]: { userAnswer: string; isCorrect: boolean } }` for the review navigation system.

---

## 9. ANIMATIONS & CSS

### Design Tokens (CSS custom properties in `:root`)

```css
--background:        30 100% 97%;   /* warm cream */
--foreground:        20 20% 20%;
--card:              0 0% 100%;
--primary:           30 95% 55%;    /* warm orange */
--primary-foreground: 0 0% 100%;
--secondary:         30 30% 93%;
--muted:             30 20% 92%;
--muted-foreground:  20 10% 50%;
--accent:            30 80% 48%;    /* deeper orange */
--destructive:       0 65% 55%;
--success:           145 55% 45%;
--border:            30 20% 88%;
--radius:            0.75rem;
```

### Fonts

```
Space Grotesk (400,500,600,700) → font-display
Inter (400,500,600)              → font-body
```

Import from Google Fonts:
```
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap
```

### Custom Keyframe Animations

```css
/* Card entrance — 0.4s ease-out */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-slide-up { animation: slide-up 0.4s ease-out; }

/* Correct emoji pop-and-float — 1.2s ease-out forwards */
@keyframes emoji-correct {
  0%   { opacity: 0; transform: scale(0.3); }
  40%  { opacity: 1; transform: scale(1.3); }
  60%  { transform: scale(1); }
  100% { opacity: 0; transform: scale(1.1) translateY(-20px); }
}
.animate-emoji-correct { animation: emoji-correct 1.2s ease-out forwards; }

/* Wrong emoji fade — 1s ease-out forwards */
@keyframes emoji-wrong {
  0%   { opacity: 0; transform: scale(0.3); }
  30%  { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(0.9); }
}
.animate-emoji-wrong { animation: emoji-wrong 1s ease-out forwards; }

/* Shake (wrong answer button / sad character) — 0.5s ease-in-out */
@keyframes shake {
  0%,100% { transform: translateX(0); }
  15%     { transform: translateX(-6px); }
  30%     { transform: translateX(6px); }
  45%     { transform: translateX(-4px); }
  60%     { transform: translateX(4px); }
  75%     { transform: translateX(-2px); }
  90%     { transform: translateX(2px); }
}
.animate-shake { animation: shake 0.5s ease-in-out; }

/* Correct answer bounce — 0.4s ease-out */
@keyframes bounce-once {
  0%,100% { transform: translateY(0); }
  40%     { transform: translateY(-6px); }
  60%     { transform: translateY(-3px); }
}
.animate-bounce-once { animation: bounce-once 0.4s ease-out; }

/* Character jump (correct answer) — 0.6s ease-out */
@keyframes character-jump {
  0%,100% { transform: translateY(0); }
  30%     { transform: translateY(-14px) scale(1.05); }
  50%     { transform: translateY(-8px); }
  70%     { transform: translateY(-4px); }
}
.animate-character-jump { animation: character-jump 0.6s ease-out; }

/* Character droop (not currently used for sad, sad uses animate-shake) */
@keyframes character-droop {
  0%   { transform: translateY(0) rotate(0deg); }
  40%  { transform: translateY(4px) rotate(-3deg); }
  100% { transform: translateY(2px) rotate(-2deg); }
}
.animate-character-droop { animation: character-droop 0.5s ease-out forwards; }

/* Character celebrate (end screen perfect / matching done) — 1s ease-in-out infinite */
@keyframes character-celebrate {
  0%,100% { transform: translateY(0) rotate(0deg); }
  20%     { transform: translateY(-12px) rotate(4deg); }
  40%     { transform: translateY(-6px) rotate(-4deg); }
  60%     { transform: translateY(-10px) rotate(3deg); }
  80%     { transform: translateY(-4px) rotate(-2deg); }
}
.animate-character-celebrate { animation: character-celebrate 1s ease-in-out infinite; }

/* Character think (unanswered state) — 2s ease-in-out infinite */
@keyframes character-think {
  0%,100% { transform: translateX(0); }
  50%     { transform: translateX(3px); }
}
.animate-character-think { animation: character-think 2s ease-in-out infinite; }

/* Character idle (landing screen) — 3s ease-in-out infinite */
@keyframes character-idle {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-3px); }
}
.animate-character-idle { animation: character-idle 3s ease-in-out infinite; }

/* Rotating gradient border — speed set via --animation-duration CSS var */
@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes gradient-rotate {
  from { --gradient-angle: 0deg; }
  to   { --gradient-angle: 360deg; }
}
.gradient-border-auto {
  animation: gradient-rotate var(--animation-duration, 5s) linear infinite;
}
```

### motion/react transitions used

**Landing page entrance:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35 }}
>
```

**Speech bubble on landing:**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
>
```

**MenuVertical container (topic list stagger):**
```ts
containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}
```

**MenuVertical header:**
```ts
headerVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}
```

**MenuVertical each item:**
```ts
itemVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
}
// plus: whileHover={{ scale: 1.02 }}
```

**Arrow inside menu item:**
```tsx
<motion.span
  initial={false}
  whileHover={{ x: 5 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>
```

**ProgressBar fill:**
```tsx
// Not motion — plain Tailwind transition
className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
style={{ width: `${pct}%` }}
```

---

## 10. DATA FORMAT

### WordEntry interface

```ts
interface WordEntry {
  word: string;        // English word or phrase
  translation: string; // Ukrainian translation
  example?: string;    // Full sentence with ___ as the blank for the target word
}
```

### Topic interface

```ts
interface Topic {
  id: string;       // URL-safe slug, used in ?topic= param
  name: string;     // Display name shown in topic selector and header subtitle
  wordList: WordEntry[];
}
```

### Topic registry (`src/data/topics/index.ts`)

```ts
const topics: Topic[] = [
  { id: "adjectives",             name: "Adjectives for Feelings",   wordList: adjectives },
  { id: "stative-verbs",          name: "Stative Verbs",             wordList: stativeVerbs },
  { id: "personality-adjectives", name: "Personality & Relationships", wordList: personalityAdjectives },
  { id: "adverbs-of-frequency",   name: "Adverbs of Frequency",      wordList: adverbsOfFrequency },
  { id: "jobs",                   name: "Jobs",                      wordList: jobs },
  { id: "story-words",            name: "Story Words",               wordList: storyWords },
];
```

### Example entries

```ts
// Standard (multiple choice + true-false + type-word)
{ word: "exhausted", translation: "виснажений",
  example: "After running a full marathon, she felt completely ___." }

// Multi-word phrase
{ word: "horror film", translation: "фільм жахів",
  example: "She refuses to watch any ___ because they give her nightmares for weeks." }

// No example (sentence-completion falls back to en-to-native for this word)
{ word: "hero", translation: "герой",
  example: "The ___ of the story saves the town from disaster in the final chapter." }
```

### `example` field rules

- The target word is replaced by `___` (three underscores, no spaces around them inside the dash).
- Sentence-completion question type is **only generated** for words that have an `example` field. If missing, zone 3 falls back to `en-to-native`.
- The blank in the rendered UI is: `<span className="inline-block mx-1 border-b-2 border-primary min-w-[80px] text-center font-bold text-primary">`.

---

## 11. PROGRESS BAR

```tsx
<div className="w-full space-y-2">
  <div className="flex justify-between items-center font-display text-sm">
    <span className="text-muted-foreground">
      Question <span className="text-foreground font-semibold">{current + 1}</span> of {total}
    </span>
    <span className="text-primary font-semibold">{Math.round(pct)}%</span>
  </div>
  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
    <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
         style={{ width: `${pct}%` }} />
  </div>
</div>
```

`pct = (currentIndex / totalQuestions) * 100` — note: uses `currentIndex` not `currentIndex + 1`, so bar fills as questions complete (not as they start).

---

## 12. FOOTER

```tsx
<footer className="border-t border-border px-6 py-4 bg-card">
  <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-muted-foreground">
    <p className="text-xs">Copyright © 2026 — Developed by Tetiana Pushkar</p>
    <div className="flex items-center gap-2">
      <a href="https://app.englishpusher.in.ua/"
         className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors font-medium text-xs">
        {/* Left chevron SVG 13×13, strokeWidth 2.5 */}
        Home
      </a>
      <a href="https://www.englishpusher.in.ua/" target="_blank" rel="noopener noreferrer"
         className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors font-medium text-xs">
        Visit Englishpusher.in.ua
        {/* Right chevron SVG 13×13, strokeWidth 2.5 */}
      </a>
    </div>
  </div>
</footer>
```

---

## 13. BACK / NEXT NAVIGATION BUTTONS

```tsx
<div className="flex justify-between items-center px-1">
  <button
    onClick={game.goPrev}
    disabled={!game.canGoPrev}
    className={game.canGoPrev
      ? "px-4 py-2 rounded-xl border-2 border-border text-sm font-semibold hover:border-primary hover:text-primary transition-all"
      : "px-4 py-2 rounded-xl border-2 border-transparent text-transparent cursor-default text-sm"
    }
  >
    ← Back
  </button>
  <button
    onClick={game.goNext}
    disabled={!game.canGoNext}
    className={game.canGoNext
      ? "px-4 py-2 rounded-xl border-2 border-primary bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all"
      : "px-4 py-2 rounded-xl border-2 border-transparent text-transparent cursor-default text-sm"
    }
  >
    {game.isReviewing ? "Next →" : "Skip →"}
  </button>
</div>
```

Disabled buttons are rendered **invisible** (`text-transparent border-transparent`) rather than removed, to preserve layout width.

`canGoPrev = viewIndex > 0`
`canGoNext = isReviewing || (answered && !gameOver)`

---

## 14. TOPIC SELECTOR (LANDING SCREEN)

The topic selector is a scrollable vertical list. On desktop, a teacher character + speech bubble appears on the left.

**Speech bubble text:** `"What shall we practise today? 😊"`

**Each topic item:**
```tsx
<button className="relative w-[98%] mx-auto flex items-center justify-between p-5 rounded-2xl bg-card border-2 border-border hover:border-primary/60 text-left transition-colors group shadow-sm">
  {/* Left colour bar */}
  <span className="absolute left-0 inset-y-2 w-1 rounded-full" style={{ backgroundColor: "#f07c1a" }} />
  <div className="min-w-0 ml-3">
    <span className="font-display font-semibold text-foreground text-lg group-hover:text-primary transition-colors block">
      {topic.name}
    </span>
    <span className="font-body text-sm text-muted-foreground mt-0.5 block">
      {topic.wordList.length} words
    </span>
  </div>
  {/* ArrowRight icon (lucide-react, size 20) slides right on hover */}
</button>
```

The list scrollbar is hidden via:
```css
.topic-scroll { scrollbar-width: none; -ms-overflow-style: none; }
.topic-scroll::-webkit-scrollbar { display: none; }
```
