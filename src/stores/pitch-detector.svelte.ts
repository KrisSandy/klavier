// Reactive Svelte 5 wrapper around the PitchDetector class
// Exposes $state-based properties for use in Svelte components

import {
  PitchDetector,
  getMicrophonePermission,
  isMicrophoneSupported,
  type PitchResult,
} from './pitch-detector';

class ReactivePitchDetector {
  private detector = new PitchDetector();
  private unsubscribe: (() => void) | null = null;
  private externalListeners: Set<(result: PitchResult) => void> = new Set();

  // ── Reactive state ─────────────────────────────────────────────────────────

  /** Whether the detector is currently listening to the microphone */
  isListening = $state(false);

  /** The most recent pitch detection result, or null if silent/no pitch */
  currentPitch = $state<PitchResult | null>(null);

  /** Microphone permission state */
  permissionState = $state<'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown'>('unknown');

  /** Whether the browser supports microphone input */
  isSupported = $state(isMicrophoneSupported());

  /** Error message if something went wrong */
  error = $state<string | null>(null);

  // ── Derived state ──────────────────────────────────────────────────────────

  /** Whether a pitch is currently being detected (not silence) */
  readonly isDetecting = $derived(this.currentPitch !== null);

  /** Current note name, or empty string if no pitch */
  readonly noteName = $derived(this.currentPitch?.noteName ?? '');

  /** Current MIDI note, or -1 if no pitch */
  readonly midiNote = $derived(this.currentPitch?.midiNote ?? -1);

  /** Cents offset from perfect pitch, or 0 if no pitch */
  readonly centsOff = $derived(this.currentPitch?.centsOff ?? 0);

  /** Detection confidence 0–1, or 0 if no pitch */
  readonly confidence = $derived(this.currentPitch?.confidence ?? 0);

  // ── Methods ────────────────────────────────────────────────────────────────

  /** Check microphone permission without triggering a prompt */
  async checkPermission(): Promise<void> {
    this.permissionState = await getMicrophonePermission();
  }

  /** Start listening to the microphone for pitch detection */
  async start(): Promise<void> {
    if (this.isListening) return;
    this.error = null;

    try {
      // Subscribe to pitch events before starting (so we don't miss the first one)
      this.unsubscribe = this.detector.onPitch((result) => {
        this.currentPitch = result;
      });

      await this.detector.startListening();
      this.isListening = true;
      this.permissionState = 'granted';

      // Set up a silence detector — clear currentPitch if no pitch for 200ms
      this.startSilenceDetector();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to start microphone';
      this.isListening = false;
      this.unsubscribe?.();
      this.unsubscribe = null;

      // Update permission state on failure
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        this.permissionState = 'denied';
      }
    }
  }

  /** Stop listening and release microphone */
  stop(): void {
    this.stopSilenceDetector();
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.detector.stopListening();
    this.isListening = false;
    this.currentPitch = null;
  }

  /** Toggle listening on/off */
  async toggle(): Promise<void> {
    if (this.isListening) {
      this.stop();
    } else {
      await this.start();
    }
  }

  /** Set YIN detection threshold (0–1, lower = stricter) */
  setThreshold(value: number): void {
    this.detector.yinThreshold = Math.max(0.05, Math.min(0.5, value));
  }

  /** Set silence threshold (minimum RMS to detect pitch) */
  setSilenceThreshold(value: number): void {
    this.detector.silenceThreshold = Math.max(0.001, Math.min(0.1, value));
  }

  /**
   * Subscribe to raw pitch events (for InputAdapter and other non-component consumers).
   * Returns an unsubscribe function.
   */
  onPitchEvent(callback: (result: PitchResult) => void): () => void {
    this.externalListeners.add(callback);
    return () => { this.externalListeners.delete(callback); };
  }

  /** Notify external listeners */
  private notifyExternal(result: PitchResult): void {
    for (const listener of this.externalListeners) {
      listener(result);
    }
  }

  /** Clean up all resources */
  destroy(): void {
    this.stop();
    this.detector.destroy();
  }

  // ── Silence detection ──────────────────────────────────────────────────────
  // If the pitch detector stops firing callbacks (silence), we need to clear
  // the currentPitch state so the UI knows there's no active note.

  private silenceTimer: ReturnType<typeof setInterval> | null = null;
  private lastPitchTime = 0;

  private startSilenceDetector(): void {
    this.silenceTimer = setInterval(() => {
      if (this.currentPitch && Date.now() - this.lastPitchTime > 200) {
        this.currentPitch = null;
      }
    }, 100);

    // Update lastPitchTime whenever a pitch is detected and notify externals
    const originalUnsubscribe = this.unsubscribe;
    this.unsubscribe = this.detector.onPitch((result) => {
      this.currentPitch = result;
      this.lastPitchTime = Date.now();
      this.notifyExternal(result);
    });
    // Clean up the old subscription
    originalUnsubscribe?.();
  }

  private stopSilenceDetector(): void {
    if (this.silenceTimer) {
      clearInterval(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

export const reactivePitchDetector = new ReactivePitchDetector();
