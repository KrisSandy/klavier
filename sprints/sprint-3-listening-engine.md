# Sprint 3 — Listening Engine & Unified Practice View

**Project:** Klavier
**Created:** 2026-03-24
**Status:** Not Started
**Goal:** Transform Klavier from a music theory course into a real-time practice partner that listens, scores, and guides.

---

## What's Already Done (Sprint 1 & 2)

- [x] 19 lessons with quizzes, interactives, song demos
- [x] Web Audio API piano synth (playNote, playSequence, playChord, playClick)
- [x] Virtual keyboard with keyboard shortcuts (A–J naturals, W E T Y U sharps)
- [x] Ear training, rhythm trainer, sight-reading drill, interval trainer
- [x] Song library with sheet music playback + note highlighting
- [x] GDPR consent + localStorage progress + schema versioning
- [x] Lazy-loaded lessons, full accessibility, security headers
- [x] 91 Vitest tests across 7 files

---

## Pre-Sprint Cleanup (Prerequisite)

These are known issues from Sprint 2 that must be resolved before starting Sprint 3 work.

### 0a — Fix Lesson Count Mismatch ✅

**Why:** Lesson 19 was added but tests, router bounds, and some data references still assume 18 lessons. This causes 9 test failures.

- [x] Update `src/__tests__/lessons.test.ts` — change all assertions expecting 18 to 19
- [x] Update `src/__tests__/router.test.ts` — allow lessonId 19 as valid
- [x] Update `src/__tests__/progress.test.ts` — fix completionPercent assertion (n/19)
- [x] Update `src/__tests__/songs.test.ts` — fix lesson mapping expectations
- [x] Verify `src/stores/progress.svelte.ts` divides by 19 (already updated)
- [x] Verify `src/router.svelte.ts` accepts lessonId 1–19 (already updated)
- [x] Run `npm run test` — all 91 tests green

**Estimated effort:** 1 hour
**Risk:** Low — test-only changes, no production code modifications needed.

### 0b — Fix ChordDiagram Accessibility ✅

- [x] Convert interactive `<div tabindex>` to `<button>` in `src/components/ChordDiagram.svelte`
  - Used Svelte 5 `{#snippet}` + `{@render}` to share keyboard markup between `<button>` (interactive) and `<div role="img">` (static) without duplication

**Estimated effort:** 15 minutes

### 0c — Fix Metronome Duplicate Audio ✅

- [x] Replace standalone Web Audio implementation in `src/components/Metronome.svelte` with import of `playClick` from `src/stores/audio.ts`
- [x] Remove the duplicate AudioContext creation

**Estimated effort:** 30 minutes

---

## Task 1 — Pitch Detection Engine (Core)

**Why:** This is the foundation of the entire sprint. Without pitch detection, none of the practice features can provide real-time feedback on what the user is actually playing. The engine must detect single notes from microphone input and convert them to MIDI note numbers with low enough latency (<100ms) to feel responsive.

**Technical approach:** YIN autocorrelation algorithm via Web Audio API `AnalyserNode`. Runs entirely client-side — no backend, no ML model, no external dependency. YIN is the standard for monophonic pitch detection: reliable, fast, well-documented, and handles piano timbre well.

### Architecture

```
Microphone → MediaStream → AudioContext → AnalyserNode
                                              ↓
                                    Float32Array (time-domain)
                                              ↓
                                    YIN autocorrelation
                                              ↓
                                    frequency (Hz) → nearest MIDI note
                                              ↓
                                    { midiNote, confidence, centsOff }
```

### Subtasks

- [ ] Create `src/stores/pitch-detector.ts` — new module, isolated from `audio.ts`
  - `startListening(): Promise<void>` — request mic permission, create AnalyserNode
  - `stopListening(): void` — stop MediaStream tracks, release resources
  - `getCurrentPitch(): PitchResult | null` — returns `{ frequency, midiNote, noteName, centsOff, confidence }`
  - `onPitch(callback: (result: PitchResult) => void): () => void` — subscribe to pitch events
  - `isListening: boolean` — reactive state
- [ ] Implement YIN algorithm as a pure function: `yinPitchDetect(buffer: Float32Array, sampleRate: number): number | null`
  - Difference function + cumulative mean normalized difference
  - Parabolic interpolation for sub-sample accuracy
  - Threshold: 0.15 (configurable) — balance between sensitivity and false positives
  - Return frequency in Hz, or null if no clear pitch detected
- [ ] Implement frequency-to-MIDI mapping: `freqToMidi(hz: number): { midiNote: number; centsOff: number }`
  - Standard formula: `69 + 12 * log2(freq / 440)`
  - Round to nearest integer for midiNote, remainder as centsOff (±50 cents)
- [ ] Implement MIDI-to-note-name mapping: reuse existing `ALL_NOTES` data from `src/data/notes.ts`
- [ ] Add confidence scoring: amplitude threshold (ignore silence) + YIN clarity metric
- [ ] Add `requestMicrophonePermission(): Promise<PermissionState>` — check/request mic access
- [ ] Handle permission denied gracefully — show fallback UI (virtual keyboard input)
- [ ] Handle browser compatibility — `navigator.mediaDevices.getUserMedia` is required; show unsupported message if unavailable
- [ ] Add audio worklet consideration: use `requestAnimationFrame` polling initially (simpler, ~60fps is sufficient for practice); document path to AudioWorklet if latency becomes an issue

**Files created:**
- `src/stores/pitch-detector.ts`
- `src/stores/pitch-detector.svelte.ts` (reactive wrapper with `$state` for Svelte components)

**Estimated effort:** 2–3 days
**Risk:** Medium — YIN algorithm implementation is well-documented but needs tuning for piano timbre. Browser mic permissions can be flaky. Latency target of <100ms is achievable with `AnalyserNode` (fftSize=2048 at 44.1kHz = ~46ms buffer).

---

## Task 2 — MIDI Input Support

**Why:** USB MIDI keyboards ($30+) provide perfect pitch data with zero detection latency. Many Klavier users will have one. Supporting MIDI alongside microphone creates two input paths to the same practice experience — MIDI is precise, mic is accessible.

**Technical approach:** Web MIDI API (`navigator.requestMIDIAccess()`). Supported in Chrome, Edge, Opera. Fallback to mic-only in Firefox/Safari.

### Subtasks

- [ ] Create `src/stores/midi-input.ts` — new module
  - `requestMIDIAccess(): Promise<boolean>` — check API availability + request access
  - `onNoteOn(callback: (midiNote: number, velocity: number) => void): () => void`
  - `onNoteOff(callback: (midiNote: number) => void): () => void`
  - `getConnectedDevices(): MIDIDevice[]` — list input devices
  - `isSupported: boolean` — static check
  - `isConnected: boolean` — reactive state
- [ ] Create `src/stores/midi-input.svelte.ts` — reactive wrapper
- [ ] Handle device hot-plug: listen for `statechange` events on `MIDIAccess`
- [ ] Handle multiple MIDI devices — use first available input, allow switching in settings
- [ ] Show device name in UI when connected

**Files created:**
- `src/stores/midi-input.ts`
- `src/stores/midi-input.svelte.ts`

**Estimated effort:** 1 day
**Risk:** Low — Web MIDI API is straightforward. Limited browser support (no Firefox/Safari) is handled by feature detection.

---

## Task 3 — Unified Input Adapter

**Why:** The practice view, lesson exercises, and song play-along all need to receive note input — but the input source (microphone pitch detection, MIDI keyboard, or virtual keyboard clicks) shouldn't matter to the consumer. A single adapter normalizes all three into one event stream.

### Interface

```typescript
interface NoteEvent {
  midiNote: number;
  noteName: string;     // e.g. "C4"
  velocity: number;     // 0–127 (mic estimates from amplitude, virtual always 100)
  source: 'mic' | 'midi' | 'virtual';
  timestamp: number;    // performance.now()
  confidence?: number;  // mic only, 0–1
  centsOff?: number;    // mic only, deviation from perfect pitch
}

interface InputAdapter {
  onNote(callback: (event: NoteEvent) => void): () => void;
  activeSource: 'mic' | 'midi' | 'virtual';
  setSource(source: 'mic' | 'midi' | 'virtual'): void;
  isListening: boolean;
  start(): Promise<void>;
  stop(): void;
}
```

### Subtasks

- [ ] Create `src/stores/input-adapter.svelte.ts`
- [ ] Wire VirtualKeyboard `onNotePlay` callback through the adapter
- [ ] Wire pitch detector output through the adapter (debounce rapid changes, emit on stable pitch)
- [ ] Wire MIDI noteOn events through the adapter
- [ ] Auto-detect source: if MIDI device connected, prefer MIDI; else default to virtual; mic is opt-in
- [ ] Add source switcher UI component: `src/components/InputSourceSelector.svelte`
  - Three toggle buttons: 🎹 Virtual | 🎤 Microphone | 🎵 MIDI
  - MIDI option only shown when Web MIDI API available
  - Mic option shows permission state (granted/denied/prompt)
  - Visual indicator of active input (pulsing dot when receiving notes)

**Files created:**
- `src/stores/input-adapter.svelte.ts`
- `src/components/InputSourceSelector.svelte`

**Estimated effort:** 1 day
**Risk:** Low — adapter pattern, well-defined interface.

---

## Task 4 — Unified Practice Canvas (Design)

**Why:** Currently the keyboard, staff, metronome, and feedback are separate widgets scattered across the page. When the listening engine ships, real-time feedback needs a visual home — a single vertical flow that mirrors how you'd sit at a real piano: sheet music on top, feedback in the middle, keyboard at the bottom.

### Layout

```
┌──────────────────────────────────────────────┐
│  ♩ = 120   ┊  ● ● ● ●   ┊  🎤 ▸ Listening  │  ← Control bar
├──────────────────────────────────────────────┤
│                                              │
│   𝄞 ──●─────●─────●─────●─────●────────▶   │  ← Scrolling staff
│          ✓       ✓      NOW     ○     ○      │    (played notes colored)
│                                              │
├──────────────────────────────────────────────┤
│              ♪ C4 — Perfect!                 │  ← Feedback strip
│              ████████░░  82% accuracy        │    (current note + running score)
├──────────────────────────────────────────────┤
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐   │
│  │ │█│ │█│ │ │█│ │█│ │█│ │ │█│ │█│ │█│ │   │  ← Keyboard (target key
│  │ │█│ │█│ │ │█│ │█│ │█│ │ │█│ │█│ │█│ │   │     highlighted, next key
│  │C│ │D│ │E│F│ │G│ │A│ │B│C│ │D│ │E│F│ │   │     shown softly)
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘   │
└──────────────────────────────────────────────┘
```

### Subtasks

- [ ] Create `src/components/PracticeCanvas.svelte` — master layout component
  - Props: `song: Song | null`, `mode: 'free' | 'guided' | 'song'`, `inputSource`
  - Slots: control bar (top), scrolling staff (middle), feedback strip, keyboard (bottom)
- [ ] Create `src/components/ScrollingStaff.svelte` — new component replacing static SongStaff for practice
  - Horizontal scroll: notes flow left-to-right, current position centered
  - Color coding: green (correct), red (wrong), white (upcoming), gray (skipped)
  - Smooth scroll animation synced to playback or user input
  - Shows time signature, key signature, bar lines
  - Responsive: adapts note density to viewport width
- [ ] Create `src/components/FeedbackStrip.svelte`
  - Shows: current detected note name, accuracy (centsOff visualized as a tuning meter), correct/wrong flash
  - Running score: `14/16 notes correct — 87%`
  - Streak indicator: fires animation on 5+, 10+, 20+ consecutive correct notes
  - `aria-live="polite"` for screen reader announcements
- [ ] Refactor `Practice.svelte` to use PracticeCanvas as the default view
  - Keep existing tab structure but replace "Piano" tab with the unified canvas
  - Ear training, rhythm, sight-reading, intervals remain as separate tabs
- [ ] Add `InputSourceSelector` to the control bar

**Files created:**
- `src/components/PracticeCanvas.svelte`
- `src/components/ScrollingStaff.svelte`
- `src/components/FeedbackStrip.svelte`

**Files modified:**
- `src/pages/Practice.svelte`

**Estimated effort:** 3–4 days
**Risk:** Medium — ScrollingStaff is the most complex new component (SVG animation + scroll sync). Start with a static version, add scrolling second.

---

## Task 5 — Guided Practice Mode

**Why:** This is where it all comes together. The user picks a song (or a lesson exercise), sees the notes on the scrolling staff, plays them on their real piano (or virtual keyboard), and gets instant note-by-note feedback. This is the core loop that makes Klavier a practice partner.

### Flow

```
User selects song → PracticeCanvas loads with song notes
                  → First note highlighted on staff + keyboard
                  → User plays note (mic/MIDI/virtual)
                  → InputAdapter fires NoteEvent
                  → Compare: expected vs actual MIDI note
                    → Match: green flash, advance to next note
                    → Wrong: red flash, show expected note, wait for retry
                    → Timeout: skip after 3 seconds, mark as missed
                  → After last note: show results screen
```

### Scoring Model

```typescript
interface PracticeResult {
  songId: string;
  totalNotes: number;
  correctNotes: number;
  missedNotes: number;
  wrongNotes: number;
  accuracy: number;           // correctNotes / totalNotes
  averageCentsOff: number;    // mic only — pitch accuracy
  longestStreak: number;
  totalTimeMs: number;
  noteResults: NoteResult[];  // per-note detail
}

interface NoteResult {
  expectedMidi: number;
  actualMidi: number | null;  // null = missed
  correct: boolean;
  centsOff?: number;
  reactionTimeMs: number;
}
```

### Subtasks

- [ ] Create `src/stores/practice-session.svelte.ts` — state machine for a guided practice session
  - States: `idle` → `countdown` → `playing` → `paused` → `complete`
  - Tracks current note index, score, streaks, timing
  - Exposes: `start(song)`, `pause()`, `resume()`, `stop()`, `retry()`
  - Emits events via callbacks: `onNoteResult`, `onComplete`
- [ ] Implement note comparison logic
  - Exact match: expected MIDI === actual MIDI → correct
  - Octave tolerance (optional setting): if note letter matches but octave differs, show "right note, wrong octave" feedback
  - Timing tolerance: accept notes within ±200ms of expected beat position (configurable)
- [ ] Wire InputAdapter → PracticeSession → ScrollingStaff + FeedbackStrip
- [ ] Add countdown (3-2-1) before practice starts (with metronome clicks)
- [ ] Add results screen: `src/components/PracticeResults.svelte`
  - Accuracy percentage (large, centered)
  - Note-by-note breakdown (scrollable, color-coded)
  - "Try Again" / "Next Song" buttons
  - Save best score to progress store
- [ ] Integrate with Songs page: add "Practice" button next to each song's "Play" button
- [ ] Integrate with lessons: add "Try it yourself" sections that launch guided practice for lesson exercises

**Files created:**
- `src/stores/practice-session.svelte.ts`
- `src/components/PracticeResults.svelte`

**Files modified:**
- `src/pages/Songs.svelte` — add Practice button
- `src/pages/Practice.svelte` — integrate guided mode
- Lesson files (selected) — add guided practice sections

**Estimated effort:** 3–4 days
**Risk:** Medium — timing tolerance and note comparison need careful tuning. Start with lenient settings, tighten in user testing.

---

## Task 6 — Progress Model v2

**Why:** The current progress model tracks lesson completion and quiz scores. Sprint 3 adds practice session results — per-song accuracy, practice frequency, improvement over time. This data feeds the future gamification layer (badges, daily goals).

### Schema Migration: v1 → v2

```typescript
// New fields in ProgressData
interface ProgressDataV2 extends ProgressData {
  practiceResults: Record<string, PracticeScore[]>;  // keyed by songId
  dailyPracticeGoalMinutes: number;                   // default: 15
  totalSessions: number;
  inputPreference: 'virtual' | 'mic' | 'midi';       // remembered choice
}

interface PracticeScore {
  songId: string;
  accuracy: number;
  longestStreak: number;
  date: string;
  inputSource: 'mic' | 'midi' | 'virtual';
}
```

### Subtasks

- [ ] Bump `SCHEMA_VERSION` to 2 in `progress.svelte.ts`
- [ ] Implement `migrate()` case for v1 → v2: add new fields with defaults
- [ ] Add methods: `savePracticeResult(result)`, `getBestScore(songId)`, `getRecentSessions(limit)`
- [ ] Add `improvementTrend(songId): number` — compare last 3 scores to previous 3, return % change
- [ ] Update Home.svelte dashboard to show practice stats (sessions this week, best accuracy)
- [ ] Write tests for migration + new methods

**Files modified:**
- `src/stores/progress.svelte.ts`
- `src/pages/Home.svelte`
- `src/__tests__/progress.test.ts`

**Estimated effort:** 1 day
**Risk:** Low — additive schema change with migration support already in place.

---

## Task 7 — Settings & Permissions UX

**Why:** Microphone access and MIDI device selection need a dedicated section in Settings. Users must be able to test their setup before jumping into practice.

### Subtasks

- [ ] Add "Audio Input" section to `src/pages/Settings.svelte`
  - Microphone permission status (granted / denied / not requested)
  - "Test Microphone" button — plays detected pitch on the virtual keyboard in real-time for 10 seconds
  - MIDI device list (if Web MIDI supported) with connection status
  - Input source preference (saved to progress store)
- [ ] Add microphone permission request flow
  - First time: explain why mic is needed, "Enable Microphone" button
  - If denied: show instructions to re-enable in browser settings
  - If granted: show green checkmark, test button
- [ ] Add mic sensitivity calibration
  - "Play a note on your piano" → show amplitude meter → auto-set noise floor threshold
  - Saves threshold to localStorage (separate from progress, not consent-gated)

**Files modified:**
- `src/pages/Settings.svelte`

**Estimated effort:** 1 day
**Risk:** Low — mostly UI work. Mic permission flow is the trickiest part (browser-specific).

---

## Task 8 — Tests for New Modules

**Why:** The pitch detector, MIDI input, input adapter, and practice session are all critical paths. Every one needs tests before the sprint is considered done.

### Subtasks

- [ ] `src/__tests__/pitch-detector.test.ts`
  - YIN algorithm: test with known sine wave buffers at 440Hz, 261.6Hz (C4), 880Hz
  - Frequency-to-MIDI conversion: edge cases, octave boundaries
  - Confidence scoring: silence returns null, loud clear tone returns high confidence
- [ ] `src/__tests__/midi-input.test.ts`
  - Mock `navigator.requestMIDIAccess`
  - Test noteOn/noteOff event handling
  - Test device disconnection handling
- [ ] `src/__tests__/input-adapter.test.ts`
  - Source switching
  - Event normalization from all three sources
  - Auto-detection priority (MIDI > mic > virtual)
- [ ] `src/__tests__/practice-session.test.ts`
  - State machine transitions: idle → countdown → playing → complete
  - Note comparison: exact match, wrong note, missed note, octave tolerance
  - Scoring math: accuracy calculation, streak tracking
  - Timing tolerance: notes within/outside acceptance window
- [ ] Run full suite: target 120+ tests, all green

**Files created:**
- `src/__tests__/pitch-detector.test.ts`
- `src/__tests__/midi-input.test.ts`
- `src/__tests__/input-adapter.test.ts`
- `src/__tests__/practice-session.test.ts`

**Estimated effort:** 2 days
**Risk:** Medium — mocking MediaStream and Web MIDI API requires careful setup. YIN algorithm tests need pre-computed buffers.

---

## Sprint Summary

| Task | Item | Effort | Priority |
|------|------|--------|----------|
| 0a | Fix lesson count mismatch | 1h | BLOCKING — test suite must be green |
| 0b | Fix ChordDiagram a11y | 15m | High — accessibility correctness |
| 0c | Fix Metronome duplicate audio | 30m | Medium — eliminate duplicate AudioContext |
| 1 | Pitch Detection Engine | 2–3d | Critical — foundation for everything |
| 2 | MIDI Input Support | 1d | High — zero-latency input path |
| 3 | Unified Input Adapter | 1d | High — normalizes all input sources |
| 4 | Unified Practice Canvas | 3–4d | Critical — visual home for the listening engine |
| 5 | Guided Practice Mode | 3–4d | Critical — the core practice loop |
| 6 | Progress Model v2 | 1d | High — persist practice results |
| 7 | Settings & Permissions UX | 1d | High — mic/MIDI setup flow |
| 8 | Tests for new modules | 2d | High — safety net for new code |

**Total estimated effort:** 15–18 days (3–4 weeks at sustainable pace)

---

## Execution Order

```
0a → 0b → 0c → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
 ╰─ prerequisite ─╯   ╰─ can parallel ─╯   ╰──────────╯
                       (1+2 are independent) (6+7 are independent)
```

**Rationale:**
- **0a/0b/0c first** — clean slate, green test suite before new work begins
- **Task 1 before everything** — pitch detection is the core dependency; all other tasks consume its output
- **Tasks 1 + 2 in parallel** — pitch detector and MIDI input are independent modules; two different input mechanisms
- **Task 3 after 1 + 2** — the adapter consumes both, so both must exist first
- **Task 4 can start during Task 1** — the visual canvas doesn't depend on the detector being done; mock the input for layout work
- **Task 5 after 3 + 4** — guided practice wires the adapter (3) into the canvas (4)
- **Tasks 6 + 7 in parallel** — progress schema and settings UX are independent
- **Task 8 last** — write tests for all new modules once the interfaces are stable (unit tests for pure functions like YIN can be written alongside Task 1)

---

## Definition of Done

Each task is done when:

- [ ] All listed files are created or modified as specified
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run check` passes (TypeScript strict mode)
- [ ] `npm run test` passes — all tests green
- [ ] No regressions in existing functionality
- [ ] Accessibility: all new interactive elements are keyboard-navigable with proper ARIA
- [ ] Changes are committed with a descriptive message

Sprint 3 is complete when:

- [ ] A user can pick any song, press "Practice," and play it on a real piano (mic or MIDI) with real-time visual feedback and a final accuracy score
- [ ] The virtual keyboard remains a fully supported input method for users without external instruments
- [ ] Practice results are persisted and shown on the dashboard
- [ ] 120+ tests, all green

---

## Future Considerations (Sprint 4+)

These are explicitly **out of scope** for Sprint 3 but informed by the architecture decisions made here:

- **Gamification layer** — badges, XP, daily goals, achievement unlocks (consumes practice results from Task 6)
- **Chord detection** — extend pitch detector to identify multiple simultaneous pitches (requires different algorithm, e.g. harmonic product spectrum)
- **Rhythm accuracy scoring** — the current listening engine scores pitch only; rhythm scoring requires beat tracking from audio input
- **Recording & playback** — record a practice session, play it back with the score overlay
- **User accounts & cloud sync** — server-side progress storage, cross-device sync
- **Video lessons** — embed Bill Hilton videos alongside lesson content
- **Song import** — user-uploaded MIDI files or MusicXML for custom practice material
- **Adaptive difficulty** — adjust tempo, skip easy notes, repeat trouble spots based on practice history
