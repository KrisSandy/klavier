// Unified Input Adapter — normalizes mic, MIDI, and virtual keyboard
// into a single NoteEvent stream for practice components
//
// Consumers subscribe to onNote() and don't care about the source.
// The adapter handles source switching, debouncing, and event normalization.

import { reactivePitchDetector } from './pitch-detector.svelte';
import { reactiveMIDIInput } from './midi-input.svelte';
import { midiToNoteName } from './pitch-detector';

// ── Types ──────────────────────────────────────────────────────────────────────

export type InputSource = 'virtual' | 'mic' | 'midi';

export interface NoteEvent {
  midiNote: number;
  noteName: string;       // e.g. "C4", "F#5"
  velocity: number;       // 0–127 (mic estimates from amplitude, virtual always 100)
  source: InputSource;
  timestamp: number;      // performance.now()
  confidence?: number;    // mic only, 0–1
  centsOff?: number;      // mic only, deviation from perfect pitch
}

export type NoteEventCallback = (event: NoteEvent) => void;

// ── Mic debounce ───────────────────────────────────────────────────────────────
// The pitch detector fires every ~50ms. We don't want to emit a new NoteEvent
// every tick if the detected note hasn't changed. Only emit when:
// 1. A new note is detected (different MIDI note than last)
// 2. The same note returns after a silence gap

const MIC_DEBOUNCE_MS = 80; // ignore same-note re-detections within this window

// ── InputAdapter class ─────────────────────────────────────────────────────────

class InputAdapter {
  private listeners: Set<NoteEventCallback> = new Set();
  private unsubMic: (() => void) | null = null;
  private unsubMIDI: (() => void) | null = null;
  private lastMicNote: number = -1;
  private lastMicTime: number = 0;

  // ── Reactive state ─────────────────────────────────────────────────────────

  /** Currently active input source */
  activeSource = $state<InputSource>('virtual');

  /** Whether the adapter is actively listening (mic or MIDI connected) */
  isListening = $state(false);

  /** The most recent NoteEvent from any source */
  lastEvent = $state<NoteEvent | null>(null);

  /** Error from the active source */
  error = $state<string | null>(null);

  // ── Derived state ──────────────────────────────────────────────────────────

  /** Whether mic is available as a source */
  readonly micAvailable = $derived(reactivePitchDetector.isSupported);

  /** Whether MIDI is available as a source */
  readonly midiAvailable = $derived(reactiveMIDIInput.isSupported);

  /** Whether MIDI is currently connected to a device */
  readonly midiConnected = $derived(reactiveMIDIInput.isConnected);

  /** Active MIDI device name */
  readonly midiDeviceName = $derived(reactiveMIDIInput.activeDeviceName);

  /** Mic permission state */
  readonly micPermission = $derived(reactivePitchDetector.permissionState);

  /** Whether mic is currently listening */
  readonly micListening = $derived(reactivePitchDetector.isListening);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Subscribe to note events from the active source.
   * Returns an unsubscribe function.
   */
  onNote(callback: NoteEventCallback): () => void {
    this.listeners.add(callback);
    return () => { this.listeners.delete(callback); };
  }

  /**
   * Switch the active input source.
   * Stops the previous source and starts the new one.
   */
  async setSource(source: InputSource): Promise<void> {
    if (source === this.activeSource && this.isListening) return;

    // Stop current source
    await this.stopCurrentSource();

    this.activeSource = source;
    this.error = null;

    // Start new source
    if (source === 'mic') {
      await this.startMic();
    } else if (source === 'midi') {
      await this.startMIDI();
    } else {
      // Virtual keyboard — no background listener needed
      // Notes come in via emitVirtualNote()
      this.isListening = true;
    }
  }

  /**
   * Emit a note from the virtual keyboard.
   * Call this from VirtualKeyboard's onNotePlay callback.
   */
  emitVirtualNote(midiNote: number, velocity: number = 100): void {
    const event: NoteEvent = {
      midiNote,
      noteName: midiToNoteName(midiNote),
      velocity,
      source: 'virtual',
      timestamp: performance.now(),
    };
    this.emit(event);
  }

  /**
   * Start listening with the current source.
   */
  async start(): Promise<void> {
    await this.setSource(this.activeSource);
  }

  /**
   * Stop all listening.
   */
  async stop(): Promise<void> {
    await this.stopCurrentSource();
    this.isListening = false;
  }

  /**
   * Auto-detect the best available source.
   * Priority: MIDI (if connected) > virtual (always available)
   * Mic is opt-in only — never auto-selected.
   */
  autoDetectSource(): InputSource {
    if (reactiveMIDIInput.isConnected) return 'midi';
    return 'virtual';
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.stopCurrentSource();
    this.listeners.clear();
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private emit(event: NoteEvent): void {
    this.lastEvent = event;
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private async startMic(): Promise<void> {
    try {
      // Subscribe to pitch events before starting the detector
      this.unsubMic = reactivePitchDetector.onPitchEvent((result) => {
        const now = performance.now();
        const samePitch = result.midiNote === this.lastMicNote;
        const recentEnough = now - this.lastMicTime < MIC_DEBOUNCE_MS;

        // Debounce: skip if same note within debounce window
        if (samePitch && recentEnough) return;

        this.lastMicNote = result.midiNote;
        this.lastMicTime = now;

        const event: NoteEvent = {
          midiNote: result.midiNote,
          noteName: result.noteName,
          velocity: Math.min(127, Math.round(result.confidence * 127)),
          source: 'mic',
          timestamp: now,
          confidence: result.confidence,
          centsOff: result.centsOff,
        };
        this.emit(event);
      });

      await reactivePitchDetector.start();
      this.isListening = true;
      this.lastMicNote = -1;
      this.lastMicTime = 0;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to start microphone';
      this.isListening = false;
      this.unsubMic?.();
      this.unsubMic = null;
    }
  }

  private async startMIDI(): Promise<void> {
    try {
      if (!reactiveMIDIInput.hasAccess) {
        const success = await reactiveMIDIInput.connect();
        if (!success) {
          this.error = reactiveMIDIInput.error ?? 'Failed to connect MIDI';
          return;
        }
      }

      this.unsubMIDI = reactiveMIDIInput.onNoteOn((midiNote, velocity) => {
        const event: NoteEvent = {
          midiNote,
          noteName: midiToNoteName(midiNote),
          velocity,
          source: 'midi',
          timestamp: performance.now(),
        };
        this.emit(event);
      });

      this.isListening = true;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to connect MIDI';
      this.isListening = false;
    }
  }

  private async stopCurrentSource(): Promise<void> {
    if (this.unsubMic) {
      this.unsubMic();
      this.unsubMic = null;
    }
    if (this.unsubMIDI) {
      this.unsubMIDI();
      this.unsubMIDI = null;
    }

    if (this.activeSource === 'mic' && reactivePitchDetector.isListening) {
      reactivePitchDetector.stop();
    }

    this.isListening = false;
    this.lastMicNote = -1;
    this.lastMicTime = 0;
  }
}

export const inputAdapter = new InputAdapter();
