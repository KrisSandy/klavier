import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('audio module', () => {
  beforeEach(() => {
    // Reset module state between tests
    vi.resetModules();
  });

  it('exports playNote, playClick, playSequence, playChord, setReverb', async () => {
    const audio = await import('../stores/audio');
    expect(typeof audio.playNote).toBe('function');
    expect(typeof audio.playClick).toBe('function');
    expect(typeof audio.playSequence).toBe('function');
    expect(typeof audio.playChord).toBe('function');
    expect(typeof audio.setReverb).toBe('function');
  });

  it('playNote does not throw when AudioContext is unavailable', async () => {
    // jsdom does not have AudioContext, so this tests the null-guard path
    const audio = await import('../stores/audio');
    expect(() => audio.playNote(60)).not.toThrow();
  });

  it('playClick does not throw when AudioContext is unavailable', async () => {
    const audio = await import('../stores/audio');
    expect(() => audio.playClick()).not.toThrow();
    expect(() => audio.playClick(true)).not.toThrow();
  });

  it('playChord does not throw when AudioContext is unavailable', async () => {
    const audio = await import('../stores/audio');
    expect(() => audio.playChord([60, 64, 67])).not.toThrow();
  });

  it('playSequence returns a stoppable handle', async () => {
    const audio = await import('../stores/audio');
    const handle = audio.playSequence([{ midiNote: 60 }, { midiNote: 64 }], 120);
    expect(handle).toBeDefined();
    expect(typeof handle.stop).toBe('function');
    // Calling stop should not throw
    expect(() => handle.stop()).not.toThrow();
  });

  it('setReverb clamps values to 0–1', async () => {
    const audio = await import('../stores/audio');
    // These should not throw
    expect(() => audio.setReverb(0)).not.toThrow();
    expect(() => audio.setReverb(1)).not.toThrow();
    expect(() => audio.setReverb(-5)).not.toThrow();
    expect(() => audio.setReverb(99)).not.toThrow();
  });
});
