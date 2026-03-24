# Sprint 3 — Listening Engine & Unified Practice View

**Project:** Klavier
**Created:** 2026-03-24
**Status:** Complete
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

## Task 1 — Pitch Detection Engine (Core) ✅

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

- [x] Create `src/stores/pitch-detector.ts` — new module, isolated from `audio.ts`
  - `startListening(): Promise<void>` — request mic permission, create AnalyserNode
  - `stopListening(): void` — stop MediaStream tracks, release resources
  - `getCurrentPitch(): PitchResult | null` — returns `{ frequency, midiNote, noteName, centsOff, confidence }`
  - `onPitch(callback: (result: PitchResult) => void): () => void` — subscribe to pitch events
  - `isListening: boolean` — reactive state
- [x] Implement YIN algorithm as a pure function: `yinPitchDetect(buffer: Float32Array, sampleRate: number): number | null`
  - Difference function + cumulative mean normalized difference
  - Parabolic interpolation for sub-sample accuracy
  - Threshold: 0.15 (configurable) — balance between sensitivity and false positives
  - Return frequency in Hz, or null if no clear pitch detected
- [x] Implement frequency-to-MIDI mapping: `freqToMidi(hz: number): { midiNote: number; centsOff: number }`
  - Standard formula: `69 + 12 * log2(freq / 440)`
  - Round to nearest integer for midiNote, remainder as centsOff (±50 cents)
- [x] Implement MIDI-to-note-name mapping: `midiToNoteName(midi)` using NOTE_NAMES array
- [x] Add confidence scoring: amplitude threshold (ignore silence) + RMS-based confidence
- [x] Add `getMicrophonePermission(): Promise<PermissionState>` — check mic access without prompting
- [x] Handle permission denied gracefully — error state exposed via reactive wrapper
- [x] Handle browser compatibility — `isMicrophoneSupported()` helper, guards in PitchDetector class
- [x] Polling-based detection via `setInterval` at 50ms intervals (simpler than AudioWorklet, sufficient for practice)
- [x] Create `src/stores/pitch-detector.svelte.ts` — reactive Svelte 5 wrapper with `$state`/`$derived`
- [x] Write 35 tests: YIN detection (8), freqToMidi (8), midiToNoteName (8), computeRMS (4), integration pipeline (6), noise/edge cases (1)

**Files created:**
- `src/stores/pitch-detector.ts`
- `src/stores/pitch-detector.svelte.ts`
- `src/__tests__/pitch-detector.test.ts` (35 tests, all passing)

**Estimated effort:** 2–3 days
**Risk:** Medium — YIN algorithm implementation is well-documented but needs tuning for piano timbre. Browser mic permissions can be flaky. Latency target of <100ms is achievable with `AnalyserNode` (fftSize=2048 at 44.1kHz = ~46ms buffer).

---

## Task 2 — MIDI Input Support ✅

**Why:** USB MIDI keyboards ($30+) provide perfect pitch data with zero detection latency. Many Klavier users will have one. Supporting MIDI alongside microphone creates two input paths to the same practice experience — MIDI is precise, mic is accessible.

**Technical approach:** Web MIDI API (`navigator.requestMIDIAccess()`). Supported in Chrome, Edge, Opera. Fallback to mic-only in Firefox/Safari.

### Subtasks

- [x] Create `src/stores/midi-input.ts` — new module
  - `requestAccess(): Promise<boolean>` — check API availability + request access
  - `onNoteOn(callback: (midiNote: number, velocity: number) => void): () => void`
  - `onNoteOff(callback: (midiNote: number) => void): () => void`
  - `getConnectedDevices(): MIDIDevice[]` — list input devices
  - `selectDevice(deviceId): boolean` — switch between devices
  - `isSupported: boolean` — static check
  - `isConnected: boolean` — reactive state
  - `parseMIDIStatus()` — exported pure function for status byte parsing
- [x] Create `src/stores/midi-input.svelte.ts` — reactive wrapper with `$state`/`$derived`
- [x] Handle device hot-plug: `statechange` listener on `MIDIAccess`, auto-reconnect on disconnect
- [x] Handle multiple MIDI devices — auto-connect to first available, `selectDevice()` to switch
- [x] Handle Note On with velocity 0 as Note Off (common keyboard behavior)
- [x] Write 19 tests: parseMIDIStatus (3), isMIDISupported (1), MIDIInput class (15) — mocked Web MIDI API

**Files created:**
- `src/stores/midi-input.ts`
- `src/stores/midi-input.svelte.ts`
- `src/__tests__/midi-input.test.ts` (19 tests, all passing)

**Estimated effort:** 1 day
**Risk:** Low — Web MIDI API is straightforward. Limited browser support (no Firefox/Safari) is handled by feature detection.

---

## Task 3 — Unified Input Adapter ✅

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

- [x] Create `src/stores/input-adapter.svelte.ts`
  - `emitVirtualNote(midiNote, velocity?)` for VirtualKeyboard integration
  - Mic source: subscribes to `reactivePitchDetector.onPitchEvent()` with 80ms debounce
  - MIDI source: subscribes to `reactiveMIDIInput.onNoteOn()`
  - `autoDetectSource()`: MIDI if connected, else virtual. Mic is opt-in only.
- [x] Wire VirtualKeyboard `onNotePlay` callback through the adapter via `emitVirtualNote()`
- [x] Wire pitch detector output through the adapter (debounced — same note within 80ms is suppressed)
- [x] Wire MIDI noteOn events through the adapter
- [x] Auto-detect source: `autoDetectSource()` checks MIDI connection status
- [x] Add source switcher UI component: `src/components/InputSourceSelector.svelte`
  - Three toggle buttons: 🎹 Virtual | 🎤 Microphone | 🎵 MIDI
  - MIDI/mic options only shown when browser API is available
  - Mic shows status: Listening / Blocked / Ready / Tap to enable
  - MIDI shows device name when connected
  - Green pulsing dot when source is actively receiving notes
- [x] Added `onPitchEvent()` to `reactivePitchDetector` for non-component subscribers
- [x] Write 14 tests: virtual note emission, note name mapping, subscribe/unsubscribe, multi-listener, source switching, graceful degradation for mic/MIDI in jsdom, timestamp ordering

**Files created:**
- `src/stores/input-adapter.svelte.ts`
- `src/components/InputSourceSelector.svelte`
- `src/__tests__/input-adapter.test.ts` (14 tests, all passing)

**Files modified:**
- `src/stores/pitch-detector.svelte.ts` — added `onPitchEvent()` + `notifyExternal()`

**Estimated effort:** 1 day
**Risk:** Low — adapter pattern, well-defined interface.

---

## Task 4 — Unified Practice Canvas (Design) ✅

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

- [x] Create `src/components/PracticeCanvas.svelte` — master layout component
  - Props: `song: Song | null`, `mode: 'free' | 'guided'`
  - Composes: control bar (metronome + start/stop/reset + InputSourceSelector), scrolling staff, feedback strip, keyboard
  - Handles note event routing: virtual keyboard → playNote + InputAdapter + guided logic
  - Non-virtual sources (mic/MIDI) subscribe via InputAdapter.onNote()
  - Practice complete overlay with accuracy and "Try Again" button
- [x] Create `src/components/ScrollingStaff.svelte` — new component replacing static SongStaff for practice
  - Horizontal scroll via CSS `translateX` with smooth 300ms transition, auto-centers on current note
  - Color coding: green (correct), red (wrong), gray (missed), terracotta (current), dark (upcoming with distance-based opacity fade)
  - Shows time signature, bar lines at time-signature intervals, double end barline
  - Pulsing ring animation on current note, checkmark/cross/skip badges on played notes
  - Full ledger line and sharp accidental support (reuses Y_MAP from notes.ts)
  - `aria-label` with note count and current position
- [x] Create `src/components/FeedbackStrip.svelte`
  - Shows: current detected note name, expected note, accuracy (centsOff visualized as tuning meter with gradient track + needle)
  - Running score: `{accuracy}% — {correct}/{total}`
  - Streak indicator with milestone tiers: warm (5+), hot (10+), fire (20+) with distinct styling and icons
  - `aria-live="polite"` for screen reader announcements
  - Flash animations on correct (green) and wrong (red) feedback
- [x] Refactor `Practice.svelte` to use PracticeCanvas as the default view
  - Added Free Play vs Guided mode toggle with song picker (up to 6 songs)
  - PracticeCanvas replaces the old standalone VirtualKeyboard + Metronome layout
  - Ear training, rhythm, sight-reading, intervals remain as separate tabs unchanged
- [x] Add `InputSourceSelector` to the control bar (via PracticeCanvas composition)
- [x] Added all component CSS to `src/app.css` (per project convention, no `<style>` blocks)

**Files created:**
- `src/components/PracticeCanvas.svelte`
- `src/components/ScrollingStaff.svelte`
- `src/components/FeedbackStrip.svelte`

**Files modified:**
- `src/pages/Practice.svelte` — replaced Piano tab with PracticeCanvas, added song picker
- `src/app.css` — added practice-canvas, scrolling-staff, feedback-strip, and streak component styles

**Estimated effort:** 3–4 days
**Risk:** Medium — ScrollingStaff is the most complex new component (SVG animation + scroll sync). Start with a static version, add scrolling second.

---

## Task 5 — Guided Practice Mode ✅

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
                    → Timeout: skip after 5 seconds, mark as missed
                  → After last note: show results screen
```

### Scoring Model

```typescript
interface PracticeResult {
  songId: string;
  songTitle: string;
  totalNotes: number;
  correctNotes: number;
  missedNotes: number;
  wrongNotes: number;
  accuracy: number;           // correctNotes / totalNotes (0-100)
  averageCentsOff: number;    // mic only — pitch accuracy
  longestStreak: number;
  totalTimeMs: number;
  noteResults: NoteResult[];  // per-note detail
  inputSource: string;
  date: string;               // ISO timestamp
}

interface NoteResult {
  index: number;
  expectedMidi: number;
  expectedName: string;
  actualMidi: number | null;  // null = missed
  correct: boolean;
  centsOff?: number;
  reactionTimeMs: number;
}
```

### Subtasks

- [x] Create `src/stores/practice-session.svelte.ts` — state machine for a guided practice session
  - States: `idle` → `countdown` → `playing` → `paused` → `complete`
  - Tracks current note index, score, streaks, timing, per-note results
  - Exposes: `start(song)`, `submitNote(event)`, `pause()`, `resume()`, `stop()`, `retry()`
  - Emits events via callbacks: `onNoteResult()`, `onComplete()`
  - 4-beat countdown with metronome clicks before play begins
  - 5-second note timeout → auto-skip as missed
  - Wrong-note retry lock (600ms) prevents rapid spam
  - `getResult()` builds final PracticeResult with all stats
- [x] Implement note comparison logic
  - Exact match: expected MIDI === actual MIDI → correct
  - Wrong note: increment wrongCount, reset streak, lock briefly, user retries
  - Missed: 5s timeout → skip, increment missedCount
  - Cents tracking for mic input (accumulated for averageCentsOff)
- [x] Wire InputAdapter → PracticeSession → ScrollingStaff + FeedbackStrip
  - PracticeCanvas subscribes to `onNoteResult` and `onComplete`
  - Updates `noteStatuses` map for ScrollingStaff color coding
  - Wrong notes briefly flash red then clear for retry
  - Completed result includes actual `inputSource` from adapter
- [x] Add countdown (4-3-2-1) before practice starts (with metronome clicks)
  - Countdown display: pulsing terracotta circle with beat number
  - Uses `playClick()` from audio store on each beat
- [x] Add results screen: `src/components/PracticeResults.svelte`
  - Letter grade (S/A/B/C/D) with color coding based on accuracy thresholds
  - Accuracy percentage (hero display)
  - Stats row: correct, wrong, missed, best streak, time, avg deviation
  - Note-by-note breakdown: scrollable grid with color-coded pills (green/red/gray)
  - Deduplicates retries — shows only final result per note index
  - "Try Again" and "Done" buttons
- [x] Integrate with Songs page: "Practice" button navigates to `/practice?song={id}`
  - Practice.svelte reads `?song=` query param from hash and auto-selects song in guided mode
- [x] Refactored PracticeCanvas to delegate all logic to PracticeSession store
  - Removed inline state machine (correctCount, totalAttempts, etc.)
  - Canvas is now a thin view layer: session store owns all state
  - Pause/Resume support added to control bar
  - Progress indicator shows `{current}/{total}` during play

**Files created:**
- `src/stores/practice-session.svelte.ts` — 290+ line state machine
- `src/components/PracticeResults.svelte` — results overlay with grade, stats, breakdown

**Files modified:**
- `src/components/PracticeCanvas.svelte` — rewired to use practiceSession store
- `src/pages/Songs.svelte` — added green "Practice" button next to "Play"
- `src/pages/Practice.svelte` — added `?song=` query param support via `$effect`
- `src/app.css` — added countdown, progress, results, and breakdown styles

**Estimated effort:** 3–4 days
**Risk:** Medium — timing tolerance and note comparison need careful tuning. Start with lenient settings, tighten in user testing.

---

## Task 6 — Progress Model v2 ✅

**Why:** The current progress model tracks lesson completion and quiz scores. Sprint 3 adds practice session results — per-song accuracy, practice frequency, improvement over time. This data feeds the future gamification layer (badges, daily goals).

### Implementation

- [x] Bumped `SCHEMA_VERSION` to 2 in `progress.svelte.ts`
- [x] Implemented `migrate()` with while-loop + switch/case for sequential v1 → v2 migration
  - v1 → v2: adds `practiceResults`, `dailyPracticeGoalMinutes` (15), `totalSessions` (0), `inputPreference` ('virtual') with nullish coalescing
  - Legacy (pre-schema) data wrapped as v1 first, then migrated through to v2
- [x] Added `PracticeScore` interface: `{ songId, accuracy, longestStreak, date, inputSource }`
- [x] New `ProgressData` fields: `practiceResults: Record<string, PracticeScore[]>`, `dailyPracticeGoalMinutes`, `totalSessions`, `inputPreference`
- [x] New methods:
  - `savePracticeResult(result)` — appends to per-song array, caps at 50 entries, increments totalSessions
  - `getBestScore(songId): PracticeScore | null` — returns highest accuracy entry
  - `getRecentSessions(limit = 10): PracticeScore[]` — across all songs, sorted by date desc
  - `improvementTrend(songId): number` — compares avg of last 3 vs previous 3, returns % change (0 if <4 sessions)
  - `setInputPreference(source)` — persists preferred input
  - `setDailyGoal(minutes)` — clamps to 1–120
- [x] New getters: `practiceSessionsThisWeek`, `overallBestAccuracy`
- [x] Updated Home.svelte dashboard: practice stats row (sessions this week, best accuracy, total sessions) shown conditionally when totalSessions > 0
- [x] Comprehensive test suite: schema migration, savePracticeResult (save, accumulate, consent-gate, cap at 50), getBestScore, getRecentSessions, improvementTrend (positive/negative/insufficient data), setInputPreference, setDailyGoal (clamp), overallBestAccuracy
- [x] 179 tests across 10 files, all passing
- [x] Build verified: 168 modules, zero errors

**Files modified:**
- `src/stores/progress.svelte.ts` — full rewrite with v2 schema, migration, new methods/getters
- `src/pages/Home.svelte` — added conditional practice stats row
- `src/__tests__/progress.test.ts` — expanded to cover all v2 functionality

**Estimated effort:** 1 day
**Risk:** Low — additive schema change with migration support already in place.

---

## Task 7 — Settings & Permissions UX ✅

**Why:** Microphone access and MIDI device selection need a dedicated section in Settings. Users must be able to test their setup before jumping into practice.

### Implementation

- [x] Added "Audio Input" section to `src/pages/Settings.svelte` — positioned before consent/privacy sections
  - **Preferred Input Source**: toggle buttons (Virtual / Microphone / MIDI) saved to progress store via `setInputPreference()`
  - **Microphone**: permission status badge (granted/denied/pending), "Test Microphone" button (10-second live pitch detection with note name, cents offset, confidence display; plays detected notes on synth), "Calibrate Sensitivity" button (3-second ambient noise sampling, auto-sets silence threshold, saves to `klavier-mic-threshold` in localStorage)
  - **MIDI Devices**: "Connect MIDI" button (requests Web MIDI API access), device list with name/manufacturer/state, "Use" button to switch between multiple devices, active device indicator
  - **Daily Practice Goal**: range slider (5–120 minutes, step 5) saved via `setDailyGoal()`
  - Microphone and MIDI sections conditionally shown based on browser API support
- [x] Permission denied flow: shows instructions to re-enable in browser settings (address bar lock icon)
- [x] Mic calibration: samples noise floor for 3 seconds with amplitude meter, sets silence threshold to max observed RMS × 1.2 + 0.005, persists to localStorage (not consent-gated)
- [x] Updated "Currently Stored Data" section to show practice sessions count and best accuracy
- [x] Fixed lesson count in data summary (18 → 19)
- [x] All CSS in `src/app.css` `@layer components` block — input buttons, permission badges, mic test/calibration, MIDI device list, range slider
- [x] 179 tests, all passing; 168 modules build clean

**Files modified:**
- `src/pages/Settings.svelte` — full Audio Input section with mic test, calibration, MIDI list, preference + goal controls
- `src/app.css` — settings-input-btn, settings-permission-badge, settings-mic-test, settings-calibration, settings-midi-device, settings-range styles

**Estimated effort:** 1 day
**Risk:** Low — mostly UI work. Mic permission flow is the trickiest part (browser-specific).

---

## Task 8 — Tests for New Modules ✅

**Why:** The pitch detector, MIDI input, input adapter, and practice session are all critical paths. Every one needs tests before the sprint is considered done.

### Implementation

- [x] `src/__tests__/pitch-detector.test.ts` — 35 tests (created in Task 1)
  - YIN algorithm: synthetic sine wave buffers at 440Hz, 261.6Hz, 880Hz, silence, noise
  - freqToMidi: standard A4=440, edge cases, octave boundaries, sub-octave
  - midiToNoteName: all 12 note names, accidentals, octave numbering
  - computeRMS: silence, uniform signal, known values
  - Integration pipeline: frequency → MIDI → noteName
- [x] `src/__tests__/midi-input.test.ts` — 19 tests (created in Task 2)
  - parseMIDIStatus: noteOn, noteOff, control change
  - isMIDISupported: feature detection
  - MIDIInput class: request access, noteOn/noteOff callbacks, velocity-0-as-noteOff, device enumeration, device selection, hot-plug/disconnect handling, error states
- [x] `src/__tests__/input-adapter.test.ts` — 14 tests (created in Task 3)
  - Virtual note emission, noteName mapping, subscribe/unsubscribe, multi-listener
  - Source switching, graceful degradation for mic/MIDI in jsdom, timestamp ordering
- [x] `src/__tests__/practice-session.test.ts` — 49 tests (created in Task 8)
  - Initial state: idle, no song, currentIndex -1, isActive false, accuracy 0
  - State machine: idle→countdown→playing, playing→paused→playing, stop→idle, playing→complete
  - Countdown: 4 beats, decrementing countdownBeat, currentIndex 0 after countdown
  - Correct notes: advance, correctCount, streak, longestStreak
  - Wrong notes: wrongCount, no advance, streak reset, retry lock (600ms)
  - Missed notes: 5s timeout auto-skip, missedCount, null actualMidi, streak reset
  - Scoring: accuracy calculation with mixed correct/wrong, getResult null before complete, full PracticeResult structure, accuracy with missed notes
  - Callbacks: onNoteResult for correct/wrong/missed, onComplete, unsubscribe
  - Edge cases: submitNote ignored in idle, pause/resume guards, retry, single-note song, stop clears timeouts, multi-line song flattening, centsOff tracking
  - Derived state: expectedNote, expectedMidi, progress, isActive, isPaused
  - NoteResult structure: correct/wrong/missed field validation
- [x] **228 tests across 11 files, all passing** (target was 120+)
- [x] Build verified: 168 modules, zero errors

**Files created:**
- `src/__tests__/practice-session.test.ts` (49 tests)

**Pre-existing test files (created in Tasks 1–3, 6):**
- `src/__tests__/pitch-detector.test.ts` (35 tests)
- `src/__tests__/midi-input.test.ts` (19 tests)
- `src/__tests__/input-adapter.test.ts` (14 tests)
- `src/__tests__/progress.test.ts` (expanded in Task 6)

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

- [x] A user can pick any song, press "Practice," and play it on a real piano (mic or MIDI) with real-time visual feedback and a final accuracy score
- [x] The virtual keyboard remains a fully supported input method for users without external instruments
- [x] Practice results are persisted and shown on the dashboard
- [x] 120+ tests, all green (228 tests across 11 files)

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
