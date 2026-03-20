# Klavier — Claude Code Context

## Commands

```bash
npm run dev      # Vite dev server (default http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Tech Stack

- **Svelte 5** (runes syntax — not Svelte 4)
- **Vite 6**
- **@sveltejs/vite-plugin-svelte 5**
- **Tailwind CSS v4** (`@tailwindcss/vite` plugin — no `tailwind.config.js`, CSS-based config via `@theme`)
- **TypeScript** (strict mode, bundler module resolution)
- No SvelteKit, no testing framework, no external UI library

## Project Structure

```
klavier/
├── index.html              # Vite HTML entry (Google Fonts: Inter, Space Grotesk, Noto Music)
├── vite.config.ts          # Registers svelte() + tailwindcss() plugins
├── tsconfig.json           # strict, bundler moduleResolution, skipLibCheck
├── package.json
└── src/
    ├── main.ts             # mount() entry point — Svelte 5 style
    ├── app.css             # @import "tailwindcss" + @theme tokens + @layer base
    ├── App.svelte          # Root: sticky header, Sidebar, main content, footer; hash-router switch
    ├── router.svelte.ts    # Class-based hash router ($state) — routes: /, /lesson-N, /practice, /songs
    ├── pages/
    │   ├── Home.svelte     # Dashboard: progress stats, continue/practice CTAs, module cards
    │   ├── Practice.svelte # Free practice (virtual keyboard)
    │   └── Songs.svelte    # Song library page
    ├── lessons/
    │   └── Lesson1.svelte … Lesson18.svelte  # One file per lesson
    ├── components/
    │   ├── LessonLayout.svelte    # Shared lesson shell: breadcrumb, title, objectives, nav buttons
    │   ├── Sidebar.svelte         # Sticky desktop sidebar + mobile slide-in drawer
    │   ├── VirtualKeyboard.svelte # Interactive piano keyboard (% width, highlight/active)
    │   ├── Staff.svelte           # SVG treble clef staff — single note display
    │   ├── SongStaff.svelte       # SVG staff for multi-note song playback
    │   ├── QuizEngine.svelte      # Reusable quiz runner (questions[], snippet for prompt area)
    │   ├── ChordDiagram.svelte    # Chord shape display
    │   ├── Metronome.svelte       # BPM metronome (uses playClick)
    │   ├── RhythmTrainer.svelte   # Tap-along rhythm exercise
    │   ├── SightReadingExercise.svelte  # Sight-reading drill
    │   ├── IntervalTrainer.svelte # Interval identification exercise
    │   └── EarTraining.svelte     # Ear training component
    ├── stores/
    │   ├── progress.svelte.ts  # Class-based $state store — persists to localStorage
    │   ├── sidebar.svelte.ts   # Sidebar open/close state
    │   └── audio.ts            # Web Audio API piano synth
    └── data/
        ├── lessons.ts   # LessonMeta interface, MODULES (6), LESSONS (18), lookup helpers
        ├── notes.ts     # Note interface, TREBLE_NOTES, SHARP_NOTES, ALL_NOTES, generatePianoKeys
        └── songs.ts     # Song interface, SONGS array (10 pieces), lookup helpers
```

## Svelte 5 Runes Conventions

Always use runes — never Svelte 4 patterns:

| Pattern | Correct | Wrong |
|---|---|---|
| Reactive state | `let x = $state(value)` | `let x = value` |
| Derived value | `const x = $derived(expr)` | `$: x = expr` |
| Component props | `let { prop }: { prop: T } = $props()` | `export let prop` |
| Event handler | `onclick={fn}` | `on:click={fn}` |
| Snippet (render prop) | `{#snippet foo(args)}…{/snippet}` + `{@render foo(args)}` | slots |
| Mount in main.ts | `mount(App, { target })` | `new App({ target })` |

All `$state` variables use `let`, not `const`.
Cross-file reactive stores use class-based `$state` (see `router.svelte.ts`, `progress.svelte.ts`).

## CSS Patterns

- **All global styles** in `src/app.css` — no `<style>` blocks inside `.svelte` files
- Tailwind v4: config is CSS-only via `@theme { … }` in `app.css`, no config file
- Colour palette (custom tokens in `@theme`):
  - `--color-navy: #3d3929` → `text-navy`, `bg-navy`
  - `--color-purple: #ce7e4f` (terracotta) → `text-purple`, `border-purple`
  - `#28a745` / `#d4edda` — correct green
  - `#dc3545` / `#f8d7da` — wrong red
  - `#faf9f5` — page background
  - `#dad9d4` — border
  - `#6b6455` — secondary text
  - `#b4b2a7` — muted text
- Layout: sticky header + flex row (Sidebar + `<main overflow-y-auto>`). `--header-height` CSS var used for sidebar `top` offset.
- Mobile: sidebar is a slide-in drawer (translate-x), with a backdrop overlay (z-[200]).

## Course Structure

**6 modules, 18 lessons** with per-lesson progress tracked in localStorage:

| Module | Lessons | Topic |
|--------|---------|-------|
| 1 | 1–3 | The Keyboard & First Notes |
| 2 | 4–6 | Both Hands & Scales |
| 3 | 7–9 | Rhythm & Dynamics |
| 4 | 10–12 | Chords & Harmony |
| 5 | 13–15 | Sight-Reading & Fluency |
| 6 | 16–18 | Expression & Performance |

Each `LessonMeta` has: `id`, `slug`, `title`, `subtitle`, `module`, `moduleName`, `objectives[]`, `hasQuiz`, `hasPractice`, `hasSong`.

## Lesson Pattern

Every lesson file:
1. `import LessonLayout` + needed components + `getLessonById` + `progress` + `playNote`
2. `const lesson = getLessonById(N)!`
3. Local `$state` for interactive UI
4. `<LessonLayout {lesson}>` wraps all sections
5. Sections flow: explanation → interactive demo → quiz
6. `QuizEngine` takes `questions: QuizQuestion[]` + `onComplete` callback + `{#snippet children({ currentQuestion, questionIndex })}` for the custom prompt area

## Data

### Notes (`src/data/notes.ts`)
- `TREBLE_NOTES`: C4–A5 plus B3–G3 natural notes; `SHARP_NOTES`: accidentals
- `ALL_NOTES = [...TREBLE_NOTES, ...SHARP_NOTES]`
- Staff y-positions (20px spacing): A5=20, G5=30, F5=40, E5=50, D5=60, C5=70, B4=80, A4=90, G4=100, F4=110, E4=120, D4=130, C4=140, B3=150, A3=160, G3=170
- `generatePianoKeys(startOctave, endOctave)` → `PianoKey[]` for VirtualKeyboard
- `ALL_LETTERS = ['A','B','C','D','E','F','G']`

### Songs (`src/data/songs.ts`)
- 10 pieces: Ode to Joy, Kushi Theme, Simple Waltz, Yankee Doodle, Minuet in G, When the Saints, Scarborough Fair, Amazing Grace, Clair de Lune (simplified), Für Elise (simplified), Canon in D (simplified)
- `Song`: `id`, `title`, `composer?`, `lessonId?`, `difficulty?`, `timeSignature`, `keySignature`, `bpm`, `lines: string[][]` (note ID arrays)

### Progress (`src/stores/progress.svelte.ts`)
- localStorage key: `klavier-progress`
- Tracks: `completedLessons[]`, `quizScores{}`, `currentStreak`, `longestStreak`, `lastActiveDate`, `totalPracticeMinutes`
- Key methods: `completeLesson(id)`, `uncompleteLesson(id)`, `saveQuizScore(id, score, total, timeMs)`, `isLessonCompleted(id)`, `addPracticeTime(minutes)`
- `completionPercent` = completedLessons.length / 18 × 100

## SVG Staff Layout (`Staff.svelte`)

- `viewBox="0 -15 500 200"`, `width="100%"`, `max-width: 500px`
- Staff lines at y = **40, 60, 80, 100, 120** (20px spacing)
- Note head centred at **x = 280**
- Treble clef: Unicode `𝄞` (U+1D11E) via **Noto Music** web font
- Note head: `<ellipse rx="10" ry="7" transform="rotate(-20, cx, cy)">` (slight tilt)
- Stem: `stroke-width="1.5"`, 35px long
  - `yPos >= 80` → stem **up**, from right side `(x+9)`
  - `yPos < 80` → stem **down**, from left side `(x-9)`
- Ledger lines rendered for notes outside the staff

## Audio (`src/stores/audio.ts`)

Web Audio API piano synth — no external audio library:
- `playNote(midiNote, duration?, velocity?)` — multi-harmonic oscillators + noise hammer attack + reverb
- `playSequence(notes[], bpm, onNoteStart?)` → `{ stop() }` — timed sequence with per-note callback
- `playChord(midiNotes[], duration?, velocity?)` — slight stagger between notes
- `playClick(accent?)` — metronome click (1000 Hz accent / 800 Hz beat)
- `setReverb(amount)` — 0.0–1.0

## Router (`src/router.svelte.ts`)

Hash-based class with `$state`:
- `router.isHome` → `#/`
- `router.isPractice` → `#/practice`
- `router.isSongs` → `#/songs`
- `router.lessonId` → `number | null` (from `#/lesson-N`)
- `router.navigate(path)` — sets `window.location.hash`
