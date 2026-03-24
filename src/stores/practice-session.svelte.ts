// Practice Session State Machine
//
// Manages a guided practice session where the user plays notes from a song
// and receives real-time feedback. Tracks per-note results, accuracy, streaks,
// timing, and produces a final PracticeResult when the session completes.
//
// States: idle → countdown → playing → paused → complete
//
// Usage:
//   practiceSession.start(song)    // begin a session
//   practiceSession.submitNote(event)  // process a played note
//   practiceSession.pause() / resume() / stop() / retry()

import { getNoteById } from '../data/notes';
import { playClick } from '../stores/audio';
import type { Song } from '../data/songs';
import type { NoteEvent } from './input-adapter.svelte';

// ── Types ──────────────────────────────────────────────────────────────────────

export type SessionState = 'idle' | 'countdown' | 'playing' | 'paused' | 'complete';

export interface NoteResult {
  index: number;
  expectedMidi: number;
  expectedName: string;
  actualMidi: number | null;   // null = missed/skipped
  correct: boolean;
  centsOff?: number;
  reactionTimeMs: number;
}

export interface PracticeResult {
  songId: string;
  songTitle: string;
  totalNotes: number;
  correctNotes: number;
  missedNotes: number;
  wrongNotes: number;
  accuracy: number;             // 0–100
  averageCentsOff: number;      // mic only
  longestStreak: number;
  totalTimeMs: number;
  noteResults: NoteResult[];
  inputSource: string;
  date: string;
}

export type NoteResultCallback = (result: NoteResult, index: number) => void;
export type SessionCompleteCallback = (result: PracticeResult) => void;

// ── Constants ──────────────────────────────────────────────────────────────────

const COUNTDOWN_BEATS = 4;          // 4 beats before start
const NOTE_TIMEOUT_MS = 5000;       // skip note after 5 seconds of no input
const WRONG_NOTE_RETRY_DELAY = 600; // ms before allowing retry after wrong note

// ── PracticeSession class ──────────────────────────────────────────────────────

class PracticeSession {
  // ── Reactive state ─────────────────────────────────────────────────────────

  state = $state<SessionState>('idle');
  currentIndex = $state(-1);
  countdownBeat = $state(-1);

  // Tracking
  correctCount = $state(0);
  wrongCount = $state(0);
  missedCount = $state(0);
  currentStreak = $state(0);
  longestStreak = $state(0);
  totalAttempts = $state(0);

  // Per-note results
  noteResults = $state<NoteResult[]>([]);

  // Timing
  sessionStartTime = $state(0);
  noteStartTime = $state(0);

  // Song data
  song = $state<Song | null>(null);
  flatNotes = $state<string[]>([]);

  // Cents tracking (mic only)
  private centsAccumulator: number[] = [];

  // Timeout for missed notes
  private noteTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private wrongNoteLockedUntil = 0;

  // Callbacks
  private noteResultListeners: Set<NoteResultCallback> = new Set();
  private completeListeners: Set<SessionCompleteCallback> = new Set();

  // ── Derived ────────────────────────────────────────────────────────────────

  readonly isActive = $derived(this.state === 'playing' || this.state === 'countdown');
  readonly isPlaying = $derived(this.state === 'playing');
  readonly isPaused = $derived(this.state === 'paused');
  readonly isComplete = $derived(this.state === 'complete');

  readonly accuracy = $derived(
    this.totalAttempts > 0
      ? Math.round((this.correctCount / this.totalAttempts) * 100)
      : 0
  );

  readonly expectedNote = $derived(
    this.currentIndex >= 0 && this.currentIndex < this.flatNotes.length
      ? this.flatNotes[this.currentIndex]
      : null
  );

  readonly expectedMidi = $derived.by(() => {
    if (!this.expectedNote) return null;
    const note = getNoteById(this.expectedNote);
    return note?.midiNote ?? null;
  });

  readonly progress = $derived(
    this.flatNotes.length > 0
      ? Math.round((this.currentIndex / this.flatNotes.length) * 100)
      : 0
  );

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start a new practice session with a countdown.
   */
  start(song: Song): void {
    this.song = song;
    this.flatNotes = song.lines.flat();
    this.resetTracking();
    this.state = 'countdown';
    this.runCountdown(song.bpm);
  }

  /**
   * Submit a note played by the user. Called by PracticeCanvas when a NoteEvent
   * arrives from the InputAdapter.
   */
  submitNote(event: NoteEvent): void {
    if (this.state !== 'playing') return;
    if (this.currentIndex < 0 || this.currentIndex >= this.flatNotes.length) return;

    // Check wrong-note lock (prevent rapid re-fire after wrong note)
    if (performance.now() < this.wrongNoteLockedUntil) return;

    const expected = this.flatNotes[this.currentIndex];
    const expectedNoteData = getNoteById(expected);
    if (!expectedNoteData) return;

    this.clearNoteTimeout();

    const reactionTimeMs = performance.now() - this.noteStartTime;
    const isCorrect = event.midiNote === expectedNoteData.midiNote;

    const result: NoteResult = {
      index: this.currentIndex,
      expectedMidi: expectedNoteData.midiNote,
      expectedName: expected,
      actualMidi: event.midiNote,
      correct: isCorrect,
      centsOff: event.centsOff ?? undefined,
      reactionTimeMs,
    };

    if (isCorrect) {
      this.correctCount++;
      this.currentStreak++;
      if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
      }
      if (event.centsOff !== undefined && event.centsOff !== null) {
        this.centsAccumulator.push(Math.abs(event.centsOff));
      }
      this.noteResults = [...this.noteResults, result];
      this.totalAttempts++;
      this.notifyNoteResult(result, this.currentIndex);
      this.advanceNote();
    } else {
      this.wrongCount++;
      this.currentStreak = 0;
      this.totalAttempts++;
      this.noteResults = [...this.noteResults, result];
      this.notifyNoteResult(result, this.currentIndex);
      // Lock briefly to prevent rapid wrong-note spam
      this.wrongNoteLockedUntil = performance.now() + WRONG_NOTE_RETRY_DELAY;
      // Re-arm timeout for this note (user can retry)
      this.startNoteTimeout();
    }
  }

  /**
   * Pause the session (stops timeout, preserves position).
   */
  pause(): void {
    if (this.state !== 'playing') return;
    this.clearNoteTimeout();
    this.state = 'paused';
  }

  /**
   * Resume from pause.
   */
  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.noteStartTime = performance.now();
    this.startNoteTimeout();
  }

  /**
   * Stop the session entirely (returns to idle).
   */
  stop(): void {
    this.clearNoteTimeout();
    this.clearCountdown();
    this.state = 'idle';
    this.currentIndex = -1;
  }

  /**
   * Retry the same song from the beginning.
   */
  retry(): void {
    if (!this.song) return;
    this.start(this.song);
  }

  /**
   * Subscribe to per-note results.
   */
  onNoteResult(callback: NoteResultCallback): () => void {
    this.noteResultListeners.add(callback);
    return () => { this.noteResultListeners.delete(callback); };
  }

  /**
   * Subscribe to session completion.
   */
  onComplete(callback: SessionCompleteCallback): () => void {
    this.completeListeners.add(callback);
    return () => { this.completeListeners.delete(callback); };
  }

  /**
   * Build the final PracticeResult (available after state=complete).
   */
  getResult(): PracticeResult | null {
    if (this.state !== 'complete' || !this.song) return null;

    const totalTimeMs = performance.now() - this.sessionStartTime;
    const avgCents = this.centsAccumulator.length > 0
      ? this.centsAccumulator.reduce((a, b) => a + b, 0) / this.centsAccumulator.length
      : 0;

    return {
      songId: this.song.id,
      songTitle: this.song.title,
      totalNotes: this.flatNotes.length,
      correctNotes: this.correctCount,
      missedNotes: this.missedCount,
      wrongNotes: this.wrongCount,
      accuracy: this.flatNotes.length > 0
        ? Math.round((this.correctCount / this.flatNotes.length) * 100)
        : 0,
      averageCentsOff: Math.round(avgCents * 10) / 10,
      longestStreak: this.longestStreak,
      totalTimeMs,
      noteResults: [...this.noteResults],
      inputSource: 'virtual', // overridden by caller
      date: new Date().toISOString(),
    };
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private resetTracking(): void {
    this.currentIndex = -1;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.missedCount = 0;
    this.currentStreak = 0;
    this.longestStreak = 0;
    this.totalAttempts = 0;
    this.noteResults = [];
    this.centsAccumulator = [];
    this.sessionStartTime = 0;
    this.noteStartTime = 0;
    this.wrongNoteLockedUntil = 0;
    this.clearNoteTimeout();
    this.clearCountdown();
  }

  private runCountdown(bpm: number): void {
    const beatInterval = 60000 / bpm;
    let beat = 0;
    this.countdownBeat = COUNTDOWN_BEATS;

    // Play first click immediately
    playClick(true);

    this.countdownIntervalId = setInterval(() => {
      beat++;
      this.countdownBeat = COUNTDOWN_BEATS - beat;

      if (beat >= COUNTDOWN_BEATS) {
        this.clearCountdown();
        this.beginPlaying();
      } else {
        playClick(beat === 0);
      }
    }, beatInterval);
  }

  private clearCountdown(): void {
    if (this.countdownIntervalId !== null) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.countdownBeat = -1;
  }

  private beginPlaying(): void {
    this.state = 'playing';
    this.currentIndex = 0;
    this.sessionStartTime = performance.now();
    this.noteStartTime = performance.now();
    this.startNoteTimeout();
  }

  private advanceNote(): void {
    if (this.currentIndex >= this.flatNotes.length - 1) {
      // Session complete
      this.clearNoteTimeout();
      this.state = 'complete';
      const result = this.getResult();
      if (result) {
        this.notifyComplete(result);
      }
    } else {
      this.currentIndex++;
      this.noteStartTime = performance.now();
      this.startNoteTimeout();
    }
  }

  private startNoteTimeout(): void {
    this.clearNoteTimeout();
    this.noteTimeoutId = setTimeout(() => {
      if (this.state !== 'playing') return;

      // Mark current note as missed
      const expected = this.flatNotes[this.currentIndex];
      const expectedNoteData = getNoteById(expected);
      const result: NoteResult = {
        index: this.currentIndex,
        expectedMidi: expectedNoteData?.midiNote ?? 0,
        expectedName: expected,
        actualMidi: null,
        correct: false,
        reactionTimeMs: NOTE_TIMEOUT_MS,
      };

      this.missedCount++;
      this.currentStreak = 0;
      this.noteResults = [...this.noteResults, result];
      this.notifyNoteResult(result, this.currentIndex);
      this.advanceNote();
    }, NOTE_TIMEOUT_MS);
  }

  private clearNoteTimeout(): void {
    if (this.noteTimeoutId !== null) {
      clearTimeout(this.noteTimeoutId);
      this.noteTimeoutId = null;
    }
  }

  private notifyNoteResult(result: NoteResult, index: number): void {
    for (const listener of this.noteResultListeners) {
      listener(result, index);
    }
  }

  private notifyComplete(result: PracticeResult): void {
    for (const listener of this.completeListeners) {
      listener(result);
    }
  }
}

export const practiceSession = new PracticeSession();
