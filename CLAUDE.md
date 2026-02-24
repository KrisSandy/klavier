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
- **TypeScript** (strict mode, bundler module resolution)
- No SvelteKit, no testing framework, no external UI library

## Project Structure

```
klavier/
├── index.html           # Vite HTML entry point
├── vite.config.ts       # Registers svelte() plugin only
├── tsconfig.json        # strict, bundler moduleResolution, skipLibCheck
├── package.json
└── src/
    ├── main.ts          # mount() entry point — Svelte 5 style
    ├── app.css          # Global reset + layout + all component styles (no scoped styles)
    ├── App.svelte       # Root component: all quiz state and logic
    └── lib/
        ├── notes.ts     # Note interface + NOTES array (9 notes with yPos) + ALL_LETTERS
        └── Staff.svelte # Pure SVG component: staff lines, treble clef, note head, stem
```

## Svelte 5 Runes Conventions

Always use runes — never Svelte 4 patterns:

| Pattern | Correct | Wrong |
|---|---|---|
| Reactive state | `let x = $state(value)` | `let x = value` |
| Derived value | `const x = $derived(expr)` | `$: x = expr` |
| Component props | `let { prop }: { prop: T } = $props()` | `export let prop` |
| Event handler | `onclick={fn}` | `on:click={fn}` |
| Mount in main.ts | `mount(App, { target })` | `new App({ target })` |

All `$state` variables use `let`, not `const`.

## CSS Patterns

- All styles live in `src/app.css` — no `<style>` blocks inside `.svelte` files
- BEM-adjacent class naming: `.btn-choice`, `.btn-choice.correct`, `.btn-choice.wrong`, `.btn-choice.dimmed`
- Layout: CSS Grid for the 2×2 answer button grid; flexbox for the card and feedback sections
- Colour palette:
  - `#1a1a2e` — dark navy (text, next button)
  - `#7c6fcd` — purple (hover accent)
  - `#28a745` / `#d4edda` — correct (green)
  - `#dc3545` / `#f8d7da` — wrong (red)
  - `#f0f2f5` — page background

## SVG Staff Layout (Staff.svelte)

- `viewBox="0 0 500 180"`, `width="100%"`, `max-width: 500px`
- Staff lines at y = **40, 60, 80, 100, 120** (20px spacing)
- Note head centred at **x = 280**
- Treble clef: `<text x="18" y="155" font-size="170" font-family="serif">𝄞</text>`
  — baseline at y=155 places the glyph body across the full staff height
- Note head: `<ellipse rx="10" ry="7" transform="rotate(-20, cx, cy)">` (slight tilt)
- Stem: `stroke-width="1.5"`, 35px long, direction from `yPos`:
  - `yPos >= 80` → stem **up**, from right side of head `(x+9)`
  - `yPos < 80` → stem **down**, from left side of head `(x-9)`
- No ledger lines needed — all 9 notes sit within the 5-line staff

## Note Data (notes.ts)

```
F5=40  E5=50  D5=60  C5=70  B4=80  A4=90  G4=100  F4=110  E4=120
```

- **E and F appear twice** (E4/E5, F4/F5) — letter names are not unique in `NOTES`
- `ALL_LETTERS = ['A','B','C','D','E','F','G']` — 7 unique letters, used for distractor generation

## Quiz Logic Patterns (App.svelte)

- **No-repeat**: next question pools `NOTES.filter(n => n.id !== currentNote.id)` to avoid immediate repeats
- **Distractor generation**: filter `ALL_LETTERS` by `l !== correct`, shuffle, take 3 — avoids the duplicate-letter problem from `NOTES`
- **Button state**: `buttonClass(letter)` computes class from `(selected, currentNote.name, letter)` inline — no separate derived state
- **Guard clause** in `handleAnswer`: early return if `selected !== null` prevents double-submission
- **Score state**: `score` (correct count) and `total` (questions answered) — session only, resets on refresh
