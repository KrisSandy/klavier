# Sprint 2 — Production Hardening

**Project:** Klavier
**Created:** 2026-03-24
**Status:** Not Started
**Goal:** Take Klavier from functional prototype to production-ready public launch.

---

## What's Already Done (Sprint 1)

- [x] Privacy Policy + Terms of Service pages
- [x] GDPR consent banner + consent store
- [x] Consent-aware progress persistence
- [x] Data export (JSON) + deletion from Settings
- [x] Security headers (`_headers`, `vercel.json`)
- [x] CSP policy (server-side only)
- [x] localStorage schema versioning + migration
- [x] Global error handler + toast notifications
- [x] Improved 404 page with navigation links
- [x] Audio engine defensive guards (null-safe)
- [x] Meta description + Open Graph tags
- [x] Settings page with consent management

---

## Task 1 — Lazy-Load Lessons (Performance)

**Why:** All 18 lesson components are statically imported in `App.svelte`, meaning the entire app ships in a single 318 KB JS bundle. Lazy-loading splits lessons into on-demand chunks, cutting initial load to ~80–100 KB.

- [x] Replace 18 static imports in `App.svelte` with dynamic `import()` calls
- [x] Create `src/components/AsyncLesson.svelte` — async wrapper with loading spinner and error state
- [x] Verify each lesson route loads its chunk on navigation, not on app boot
- [x] Verify the build output produces per-lesson chunks (or grouped module chunks)
- [x] Test that direct-link navigation (e.g. `/#/lesson-12`) works without flash of 404

**Files touched:**
- `src/App.svelte` — remove static lesson imports, switch to dynamic loading
- `src/components/AsyncLesson.svelte` — new component

**Estimated effort:** 1–2 hours
**Risk:** Low — Vite handles dynamic imports natively; Svelte 5 `{#await}` makes the wrapper trivial.

---

## Task 2 — Accessibility Fixes

**Why:** A piano learning app must be keyboard-navigable and screen-reader friendly. Current gaps: no skip-to-content link, no focus trap in mobile sidebar drawer, no ARIA live regions for quiz feedback, no focus management on route change.

- [x] Add skip-to-content link (hidden visually, visible on focus, targets `<main id="main-content">`)
- [x] Add skip-link styles to `src/app.css`
- [x] Implement focus trap in mobile sidebar drawer (Tab/Shift+Tab contained, Escape to close, return focus to hamburger)
- [x] Add `aria-live="polite"` regions around quiz result messages in `QuizEngine.svelte`
- [x] Implement route-change focus management (move focus to h1 on hash change)
- [x] Add keyboard support to `VirtualKeyboard.svelte` (A–J keys, W E T Y U for sharps, show key hints)
- [x] Semantic HTML audit — verify all interactive elements are `<button>` or `<a>`, not `<div onclick>`
- [x] Verify heading hierarchy (h1 → h2 → h3, no skips) across all pages
- [x] Add `aria-hidden="true"` to decorative SVGs, `role="img"` + labels to meaningful ones

**Files touched:**
- `src/App.svelte`
- `src/components/Sidebar.svelte`
- `src/components/QuizEngine.svelte`
- `src/components/VirtualKeyboard.svelte`
- `src/router.svelte.ts` (optional)
- `src/app.css`

**Estimated effort:** 3–4 hours
**Risk:** Low — additive changes, no breaking refactors.

---

## Task 3 — Testing Setup (Vitest + Core Logic)

**Why:** Zero test coverage. The consent store, progress store, audio engine, router, and data modules all have pure-logic functions that should be tested before launch.

- [x] Install `vitest` + `jsdom` as devDependencies
- [x] Extend `vite.config.ts` with vitest configuration
- [x] Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`
- [x] Write tests for `src/data/lessons.ts` — `getLessonById`, `getLessonsByModule`, module count
- [x] Write tests for `src/data/notes.ts` — `generatePianoKeys` output, `ALL_NOTES` structure, staff y-positions
- [x] Write tests for `src/data/songs.ts` — `getSongById`, song structure validation
- [x] Write tests for `src/stores/consent.svelte.ts` — accept/decline/revoke state transitions, policy version re-prompt
- [x] Write tests for `src/stores/progress.svelte.ts` — schema migration, consent gating, idempotency, `completionPercent` math
- [x] Write tests for `src/stores/audio.ts` — graceful null returns when AudioContext unavailable
- [x] Write tests for `src/router.svelte.ts` — hash parsing, route getters
- [x] All tests passing with `npm run test` — **91 tests, 7 files, all green**

**Files created:**
- `vitest.config.ts`
- `src/__tests__/lessons.test.ts`
- `src/__tests__/notes.test.ts`
- `src/__tests__/songs.test.ts`
- `src/__tests__/consent.test.ts`
- `src/__tests__/progress.test.ts`
- `src/__tests__/audio.test.ts`
- `src/__tests__/router.test.ts`

**Estimated effort:** 3–4 hours
**Risk:** Medium — Svelte 5 runes in test environments may need `svelte/compiler` configuration. Audio tests need `AudioContext` mocking.

---

## Task 4 — CI/CD Pipeline — SKIPPED

**Reason:** Vercel deploy hook already handles deployment. Quality gate can be added to the Vercel build command (`npm run check && npm run test && npm run build`) instead of a separate GitHub Actions workflow.

---

## Task 5 — Analytics (Privacy-Respecting) — DEFERRED

**Reason:** Will be added post-launch once Plausible account is set up and domain is live.

---

## Task 6 — Meta Tags + OG Image + Favicon

**Why:** Sharing links on social media, messaging apps, and search results currently shows no image and generic text. A proper OG image and favicon make the app look legitimate.

- [x] Design and create OG image (1200x630, piano keys + "Klavier" branding + tagline) → `public/og-image.png`
- [x] Add `<meta property="og:image">` and Twitter card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) to `index.html`
- [x] Create SVG favicon (piano key icon in brand colors) → `public/favicon.svg`
- [x] Generate `favicon.ico` (32x32), `apple-touch-icon.png` (180x180), `favicon-192.png`, `favicon-512.png`
- [x] Add `<link rel="icon">` and `<link rel="apple-touch-icon">` to `index.html`
- [x] Create `public/site.webmanifest` for PWA metadata
- [x] Add `<meta name="theme-color" content="#3d3929" />` to `index.html`
- [x] Add `<link rel="canonical">` to `index.html` (placeholder domain — update when live)
- [x] Add structured data (JSON-LD) for `WebApplication` schema to `index.html`

**Files created:**
- `public/og-image.png`
- `public/favicon.svg`
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/site.webmanifest`

**Files modified:**
- `index.html`

**Estimated effort:** 2–3 hours (mostly design time for the OG image and favicon)
**Risk:** Low — static assets, no logic changes.
**Note:** OG image needs a real domain URL to work on social platforms. Use the production URL once deployed.

---

## Sprint Summary

| Task | Item | Effort | Priority |
|------|------|--------|----------|
| 1 | Lazy-load lessons | 1–2h | High — cuts bundle 60%+ |
| 2 | Accessibility fixes | 3–4h | High — required for public launch |
| 3 | Vitest + core tests | 3–4h | High — safety net before more changes |
| 4 | CI/CD pipeline | 1h | Medium — automates quality gate |
| 5 | Analytics (Plausible) | 2h | Medium — needed post-launch |
| 6 | Meta + OG image + favicon | 2–3h | Medium — needed for social sharing |

**Total estimated effort:** 12–18 hours

---

## Execution Order

Tasks 1 → 3 → 4 → 2 → 6 → 5

**Rationale:**
- **Task 1 first** — lazy loading changes the import structure of `App.svelte` significantly. Do this before writing tests that depend on module structure.
- **Task 3 before Task 2** — get the test harness up so accessibility changes can be validated with tests.
- **Task 4 after Task 3** — CI is only useful once there are tests to run.
- **Task 2 after Task 4** — accessibility work can then be validated in CI on every push.
- **Task 6 before Task 5** — favicons and OG image make the site look complete; analytics can wait until traffic arrives.
- **Task 5 last** — analytics requires a live domain and Plausible account. Can be added post-launch.

---

## Definition of Done

Each task is done when:

- [ ] All listed files are created or modified as specified
- [ ] `npm run build` succeeds with zero errors
- [ ] No regressions in existing functionality (manual smoke test or Vitest)
- [ ] Changes are committed with a descriptive message

Sprint 2 is complete when all 6 tasks are done and the app is deployed to a live URL with CI passing.
