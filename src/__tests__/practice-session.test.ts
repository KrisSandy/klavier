import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// We need to test the PracticeSession class. Since it's a singleton with $state,
// we import the module and test through the exported singleton.
// The practice-session module uses:
//   - getNoteById from data/notes (pure function, works in jsdom)
//   - playClick from stores/audio (needs mocking — uses Web Audio API)

// Mock the audio module to avoid Web Audio API errors
vi.mock('../stores/audio', () => ({
  playClick: vi.fn(),
  playNote: vi.fn(),
}));

import { practiceSession } from '../stores/practice-session.svelte';
import type { NoteResult, PracticeResult } from '../stores/practice-session.svelte';
import type { NoteEvent } from '../stores/input-adapter.svelte';
import { getNoteById } from '../data/notes';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a minimal Song object for testing */
function makeSong(noteIds: string[], bpm = 120) {
  return {
    id: 'test-song',
    title: 'Test Song',
    timeSignature: [4, 4] as [number, number],
    keySignature: 'C major',
    bpm,
    lines: [noteIds],
  };
}

/** Create a NoteEvent for a given note ID (e.g. "C4") */
function noteEvent(noteId: string, source: 'virtual' | 'mic' | 'midi' = 'virtual'): NoteEvent {
  const note = getNoteById(noteId);
  return {
    midiNote: note?.midiNote ?? 60,
    noteName: noteId,
    velocity: 100,
    source,
    timestamp: performance.now(),
  };
}

/** Create a NoteEvent with a specific MIDI number */
function midiEvent(midiNote: number, source: 'virtual' | 'mic' | 'midi' = 'virtual'): NoteEvent {
  return {
    midiNote,
    noteName: `M${midiNote}`,
    velocity: 100,
    source,
    timestamp: performance.now(),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PracticeSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    practiceSession.stop();
  });

  afterEach(() => {
    practiceSession.stop();
    vi.useRealTimers();
  });

  // ── Initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts in idle state', () => {
      expect(practiceSession.state).toBe('idle');
    });

    it('has no active song', () => {
      expect(practiceSession.song).toBeNull();
    });

    it('has currentIndex at -1', () => {
      expect(practiceSession.currentIndex).toBe(-1);
    });

    it('isActive is false', () => {
      expect(practiceSession.isActive).toBe(false);
    });

    it('accuracy is 0', () => {
      expect(practiceSession.accuracy).toBe(0);
    });
  });

  // ── State machine transitions ────────────────────────────────────────────

  describe('state machine transitions', () => {
    it('idle → countdown on start()', () => {
      const song = makeSong(['C4', 'D4', 'E4']);
      practiceSession.start(song);
      expect(practiceSession.state).toBe('countdown');
    });

    it('countdown → playing after 4 beats', () => {
      const song = makeSong(['C4', 'D4'], 120); // 120 BPM = 500ms per beat
      practiceSession.start(song);
      expect(practiceSession.state).toBe('countdown');

      // Advance through 4 beats (4 x 500ms)
      vi.advanceTimersByTime(2000);
      expect(practiceSession.state).toBe('playing');
    });

    it('playing → paused on pause()', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000); // finish countdown
      expect(practiceSession.state).toBe('playing');

      practiceSession.pause();
      expect(practiceSession.state).toBe('paused');
    });

    it('paused → playing on resume()', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);
      practiceSession.pause();

      practiceSession.resume();
      expect(practiceSession.state).toBe('playing');
    });

    it('stop() returns to idle from any state', () => {
      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      expect(practiceSession.state).toBe('countdown');

      practiceSession.stop();
      expect(practiceSession.state).toBe('idle');
      expect(practiceSession.currentIndex).toBe(-1);
    });

    it('playing → complete after all notes played correctly', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000); // countdown done

      practiceSession.submitNote(noteEvent('C4'));
      practiceSession.submitNote(noteEvent('D4'));
      expect(practiceSession.state).toBe('complete');
    });
  });

  // ── Countdown ────────────────────────────────────────────────────────────

  describe('countdown', () => {
    it('countdownBeat starts at 4', () => {
      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      expect(practiceSession.countdownBeat).toBe(4);
    });

    it('countdownBeat decrements each beat', () => {
      const song = makeSong(['C4'], 120); // 500ms beats
      practiceSession.start(song);

      vi.advanceTimersByTime(500);
      expect(practiceSession.countdownBeat).toBe(3);

      vi.advanceTimersByTime(500);
      expect(practiceSession.countdownBeat).toBe(2);
    });

    it('sets currentIndex to 0 after countdown', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);
      expect(practiceSession.currentIndex).toBe(0);
    });
  });

  // ── Note comparison: correct notes ───────────────────────────────────────

  describe('correct note handling', () => {
    it('advances to next note on correct match', () => {
      const song = makeSong(['C4', 'D4', 'E4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      expect(practiceSession.currentIndex).toBe(1);
    });

    it('increments correctCount', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      expect(practiceSession.correctCount).toBe(1);
    });

    it('increments streak on consecutive correct notes', () => {
      const song = makeSong(['C4', 'D4', 'E4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      practiceSession.submitNote(noteEvent('D4'));
      expect(practiceSession.currentStreak).toBe(2);
    });

    it('tracks longestStreak', () => {
      const song = makeSong(['C4', 'D4', 'E4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      practiceSession.submitNote(noteEvent('D4'));
      practiceSession.submitNote(noteEvent('E4'));
      expect(practiceSession.longestStreak).toBe(3);
    });
  });

  // ── Note comparison: wrong notes ─────────────────────────────────────────

  describe('wrong note handling', () => {
    it('increments wrongCount on wrong note', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      // Play wrong note (E4 instead of C4)
      practiceSession.submitNote(noteEvent('E4'));
      expect(practiceSession.wrongCount).toBe(1);
    });

    it('does NOT advance on wrong note (stays on same index)', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('E4'));
      expect(practiceSession.currentIndex).toBe(0); // still on first note
    });

    it('resets streak on wrong note', () => {
      const song = makeSong(['C4', 'D4', 'E4', 'F4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      practiceSession.submitNote(noteEvent('D4'));
      expect(practiceSession.currentStreak).toBe(2);

      // Wrong note
      practiceSession.submitNote(noteEvent('C4')); // E4 expected, C4 played
      expect(practiceSession.currentStreak).toBe(0);
    });

    it('locks input briefly after wrong note (retry delay)', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      // Wrong note
      practiceSession.submitNote(noteEvent('E4'));
      expect(practiceSession.wrongCount).toBe(1);

      // Immediately try correct note — should be locked
      practiceSession.submitNote(noteEvent('C4'));
      // correctCount should still be 0 because we're within the 600ms lock
      expect(practiceSession.correctCount).toBe(0);

      // After lock period, retry succeeds
      vi.advanceTimersByTime(650);
      practiceSession.submitNote(noteEvent('C4'));
      expect(practiceSession.correctCount).toBe(1);
    });
  });

  // ── Note comparison: missed notes (timeout) ──────────────────────────────

  describe('missed note handling', () => {
    it('auto-skips after 5 seconds of no input', () => {
      const song = makeSong(['C4', 'D4', 'E4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000); // countdown done

      // Wait 5 seconds without playing
      vi.advanceTimersByTime(5000);
      expect(practiceSession.missedCount).toBe(1);
      expect(practiceSession.currentIndex).toBe(1);
    });

    it('records missed note in noteResults', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      // Let first note time out
      vi.advanceTimersByTime(5000);

      const results = practiceSession.noteResults;
      expect(results.length).toBe(1);
      expect(results[0].correct).toBe(false);
      expect(results[0].actualMidi).toBeNull();
    });

    it('resets streak on missed note', () => {
      const song = makeSong(['C4', 'D4', 'E4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      expect(practiceSession.currentStreak).toBe(1);

      // Miss second note
      vi.advanceTimersByTime(5000);
      expect(practiceSession.currentStreak).toBe(0);
    });
  });

  // ── Scoring math ─────────────────────────────────────────────────────────

  describe('scoring', () => {
    it('calculates accuracy correctly', () => {
      const song = makeSong(['C4', 'D4', 'E4', 'F4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      // 2 correct, 1 wrong (then correct retry after lock), 1 correct
      practiceSession.submitNote(noteEvent('C4'));
      practiceSession.submitNote(noteEvent('D4'));
      practiceSession.submitNote(noteEvent('D4')); // wrong — expected E4
      vi.advanceTimersByTime(650);
      practiceSession.submitNote(noteEvent('E4')); // retry correct
      practiceSession.submitNote(noteEvent('F4'));

      // totalAttempts = 5 (2 correct + 1 wrong + 1 correct retry + 1 correct)
      // correctCount = 4
      expect(practiceSession.correctCount).toBe(4);
      expect(practiceSession.wrongCount).toBe(1);
      expect(practiceSession.accuracy).toBe(80); // 4/5 = 80%
    });

    it('getResult() returns null when not complete', () => {
      expect(practiceSession.getResult()).toBeNull();
    });

    it('getResult() returns full result when complete', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      practiceSession.submitNote(noteEvent('D4'));

      const result = practiceSession.getResult();
      expect(result).not.toBeNull();
      expect(result!.songId).toBe('test-song');
      expect(result!.songTitle).toBe('Test Song');
      expect(result!.totalNotes).toBe(2);
      expect(result!.correctNotes).toBe(2);
      expect(result!.missedNotes).toBe(0);
      expect(result!.wrongNotes).toBe(0);
      expect(result!.accuracy).toBe(100);
      expect(result!.longestStreak).toBe(2);
      expect(result!.noteResults).toHaveLength(2);
    });

    it('getResult() accuracy reflects correct/total notes', () => {
      const song = makeSong(['C4', 'D4', 'E4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      // Miss D4
      vi.advanceTimersByTime(5000);
      practiceSession.submitNote(noteEvent('E4'));

      const result = practiceSession.getResult();
      expect(result).not.toBeNull();
      // accuracy = correctNotes / totalNotes = 2/3 ≈ 67%
      expect(result!.accuracy).toBe(67);
    });
  });

  // ── Callbacks ────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('fires onNoteResult for correct notes', () => {
      const results: NoteResult[] = [];
      const unsub = practiceSession.onNoteResult((result) => {
        results.push(result);
      });

      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      expect(results).toHaveLength(1);
      expect(results[0].correct).toBe(true);

      unsub();
    });

    it('fires onNoteResult for wrong notes', () => {
      const results: NoteResult[] = [];
      const unsub = practiceSession.onNoteResult((result) => {
        results.push(result);
      });

      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('E4'));
      expect(results).toHaveLength(1);
      expect(results[0].correct).toBe(false);

      unsub();
    });

    it('fires onComplete when session finishes', () => {
      const completions: PracticeResult[] = [];
      const unsub = practiceSession.onComplete((result) => {
        completions.push(result);
      });

      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      expect(completions).toHaveLength(1);
      expect(completions[0].songId).toBe('test-song');

      unsub();
    });

    it('unsubscribe stops callbacks', () => {
      const results: NoteResult[] = [];
      const unsub = practiceSession.onNoteResult((result) => {
        results.push(result);
      });

      unsub(); // unsubscribe immediately

      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);
      practiceSession.submitNote(noteEvent('C4'));

      expect(results).toHaveLength(0);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('submitNote is ignored when not in playing state', () => {
      const before = practiceSession.correctCount;
      practiceSession.submitNote(noteEvent('C4'));
      // correctCount should not change when idle
      expect(practiceSession.correctCount).toBe(before);
    });

    it('pause is ignored when not playing', () => {
      practiceSession.pause();
      expect(practiceSession.state).toBe('idle');
    });

    it('resume is ignored when not paused', () => {
      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.resume(); // already playing, not paused
      expect(practiceSession.state).toBe('playing');
    });

    it('retry restarts the same song', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      practiceSession.submitNote(noteEvent('D4'));
      expect(practiceSession.state).toBe('complete');

      practiceSession.retry();
      expect(practiceSession.state).toBe('countdown');
      expect(practiceSession.correctCount).toBe(0);
    });

    it('handles single-note song', () => {
      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      practiceSession.submitNote(noteEvent('C4'));
      expect(practiceSession.state).toBe('complete');
    });

    it('stop clears timeouts (no missed note after stop)', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      // Stop mid-session
      practiceSession.stop();

      // Advance past timeout — should not affect anything
      vi.advanceTimersByTime(6000);
      expect(practiceSession.missedCount).toBe(0);
      expect(practiceSession.state).toBe('idle');
    });

    it('flattens multi-line songs', () => {
      const song = {
        id: 'multi-line',
        title: 'Multi Line',
        timeSignature: [4, 4] as [number, number],
        keySignature: 'C major',
        bpm: 120,
        lines: [['C4', 'D4'], ['E4', 'F4']],
      };
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      // Should have 4 notes total
      expect(practiceSession.flatNotes).toEqual(['C4', 'D4', 'E4', 'F4']);
    });

    it('tracks centsOff from mic input', () => {
      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      const event = noteEvent('C4', 'mic');
      event.centsOff = 12;
      practiceSession.submitNote(event);

      const result = practiceSession.getResult();
      expect(result).not.toBeNull();
      expect(result!.averageCentsOff).toBe(12);
    });
  });

  // ── Derived state ────────────────────────────────────────────────────────

  describe('derived state', () => {
    it('expectedNote reflects current note', () => {
      const song = makeSong(['C4', 'D4', 'E4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      expect(practiceSession.expectedNote).toBe('C4');
      practiceSession.submitNote(noteEvent('C4'));
      expect(practiceSession.expectedNote).toBe('D4');
    });

    it('expectedMidi matches note MIDI value', () => {
      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      const c4 = getNoteById('C4');
      expect(practiceSession.expectedMidi).toBe(c4?.midiNote);
    });

    it('progress reflects position in song', () => {
      const song = makeSong(['C4', 'D4', 'E4', 'F4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      expect(practiceSession.progress).toBe(0);
      practiceSession.submitNote(noteEvent('C4'));
      expect(practiceSession.progress).toBe(25);
      practiceSession.submitNote(noteEvent('D4'));
      expect(practiceSession.progress).toBe(50);
    });

    it('isActive is true during countdown and playing', () => {
      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      expect(practiceSession.isActive).toBe(true); // countdown

      vi.advanceTimersByTime(2000);
      expect(practiceSession.isActive).toBe(true); // playing
    });

    it('isPaused reflects paused state', () => {
      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      expect(practiceSession.isPaused).toBe(false);
      practiceSession.pause();
      expect(practiceSession.isPaused).toBe(true);
    });
  });

  // ── NoteResult structure ──────────────────────────────────────────────────

  describe('NoteResult structure', () => {
    it('correct result has expected fields', () => {
      const results: NoteResult[] = [];
      const unsub = practiceSession.onNoteResult((r) => results.push(r));

      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);
      practiceSession.submitNote(noteEvent('C4'));

      const r = results[0];
      expect(r.index).toBe(0);
      expect(r.expectedName).toBe('C4');
      expect(r.correct).toBe(true);
      expect(r.actualMidi).toBe(getNoteById('C4')!.midiNote);
      expect(typeof r.reactionTimeMs).toBe('number');
      expect(r.reactionTimeMs).toBeGreaterThanOrEqual(0);

      unsub();
    });

    it('wrong result includes actual MIDI note', () => {
      const results: NoteResult[] = [];
      const unsub = practiceSession.onNoteResult((r) => results.push(r));

      const song = makeSong(['C4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);
      practiceSession.submitNote(noteEvent('E4'));

      const r = results[0];
      expect(r.correct).toBe(false);
      expect(r.actualMidi).toBe(getNoteById('E4')!.midiNote);

      unsub();
    });

    it('missed result has null actualMidi', () => {
      const results: NoteResult[] = [];
      const unsub = practiceSession.onNoteResult((r) => results.push(r));

      const song = makeSong(['C4', 'D4'], 120);
      practiceSession.start(song);
      vi.advanceTimersByTime(2000);

      // Let note time out
      vi.advanceTimersByTime(5000);

      const r = results[0];
      expect(r.correct).toBe(false);
      expect(r.actualMidi).toBeNull();
      expect(r.reactionTimeMs).toBe(5000);

      unsub();
    });
  });
});
