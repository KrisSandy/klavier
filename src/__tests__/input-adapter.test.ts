import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the pure logic aspects of the input adapter
// The adapter itself uses Svelte $state (needs compiler transform),
// so we test it through Vite's transform pipeline via dynamic import.

describe('InputAdapter', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('can be imported', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    expect(inputAdapter).toBeDefined();
  });

  it('defaults to virtual source', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    expect(inputAdapter.activeSource).toBe('virtual');
  });

  it('emitVirtualNote creates a NoteEvent with correct fields', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    const events: any[] = [];
    const unsub = inputAdapter.onNote((e) => events.push(e));

    inputAdapter.emitVirtualNote(60, 100);

    expect(events).toHaveLength(1);
    expect(events[0].midiNote).toBe(60);
    expect(events[0].noteName).toBe('C4');
    expect(events[0].velocity).toBe(100);
    expect(events[0].source).toBe('virtual');
    expect(events[0].timestamp).toBeGreaterThan(0);
    expect(events[0].confidence).toBeUndefined();
    expect(events[0].centsOff).toBeUndefined();

    unsub();
  });

  it('emitVirtualNote defaults velocity to 100', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    const events: any[] = [];
    const unsub = inputAdapter.onNote((e) => events.push(e));

    inputAdapter.emitVirtualNote(69); // no velocity arg

    expect(events[0].velocity).toBe(100);

    unsub();
  });

  it('emitVirtualNote maps note names correctly', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    const events: any[] = [];
    const unsub = inputAdapter.onNote((e) => events.push(e));

    inputAdapter.emitVirtualNote(69);  // A4
    inputAdapter.emitVirtualNote(61);  // C#4
    inputAdapter.emitVirtualNote(72);  // C5

    expect(events[0].noteName).toBe('A4');
    expect(events[1].noteName).toBe('C#4');
    expect(events[2].noteName).toBe('C5');

    unsub();
  });

  it('updates lastEvent on emitVirtualNote', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');

    expect(inputAdapter.lastEvent).toBeNull();

    inputAdapter.emitVirtualNote(60);

    expect(inputAdapter.lastEvent).not.toBeNull();
    expect(inputAdapter.lastEvent!.midiNote).toBe(60);
  });

  it('onNote unsubscribe stops receiving events', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    const events: any[] = [];
    const unsub = inputAdapter.onNote((e) => events.push(e));

    inputAdapter.emitVirtualNote(60);
    expect(events).toHaveLength(1);

    unsub();

    inputAdapter.emitVirtualNote(64);
    expect(events).toHaveLength(1); // should not have received second event
  });

  it('multiple listeners all receive events', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    const events1: any[] = [];
    const events2: any[] = [];

    const unsub1 = inputAdapter.onNote((e) => events1.push(e));
    const unsub2 = inputAdapter.onNote((e) => events2.push(e));

    inputAdapter.emitVirtualNote(60);

    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(1);

    unsub1();
    unsub2();
  });

  it('autoDetectSource returns virtual when no MIDI connected', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    // In jsdom, MIDI is never available
    expect(inputAdapter.autoDetectSource()).toBe('virtual');
  });

  it('setSource changes activeSource', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    expect(inputAdapter.activeSource).toBe('virtual');

    // Setting to virtual again should work without error
    await inputAdapter.setSource('virtual');
    expect(inputAdapter.activeSource).toBe('virtual');
  });

  it('setSource to mic handles jsdom gracefully (no crash)', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');

    // In jsdom, mic may or may not work — the important thing is no crash
    await inputAdapter.setSource('mic');

    expect(inputAdapter.activeSource).toBe('mic');
    // Either it errored out or started (environment-dependent)
    // Just verify it didn't throw and state is consistent
    expect(typeof inputAdapter.isListening).toBe('boolean');
  });

  it('setSource to midi fails gracefully in jsdom (no Web MIDI)', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');

    await inputAdapter.setSource('midi');

    expect(inputAdapter.activeSource).toBe('midi');
    expect(inputAdapter.error).toBeTruthy();
  });

  it('stop sets isListening to false', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');

    await inputAdapter.setSource('virtual');
    expect(inputAdapter.isListening).toBe(true);

    await inputAdapter.stop();
    expect(inputAdapter.isListening).toBe(false);
  });

  it('NoteEvent timestamps are monotonically increasing', async () => {
    const { inputAdapter } = await import('../stores/input-adapter.svelte');
    const timestamps: number[] = [];
    const unsub = inputAdapter.onNote((e) => timestamps.push(e.timestamp));

    inputAdapter.emitVirtualNote(60);
    inputAdapter.emitVirtualNote(64);
    inputAdapter.emitVirtualNote(67);

    expect(timestamps).toHaveLength(3);
    expect(timestamps[1]).toBeGreaterThanOrEqual(timestamps[0]);
    expect(timestamps[2]).toBeGreaterThanOrEqual(timestamps[1]);

    unsub();
  });
});
