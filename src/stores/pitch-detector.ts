// Pitch detection engine using YIN autocorrelation algorithm
// Runs entirely client-side via Web Audio API AnalyserNode
// No external dependencies, no ML model, no backend

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PitchResult {
  frequency: number;    // detected frequency in Hz
  midiNote: number;     // nearest MIDI note number (0–127)
  noteName: string;     // e.g. "C4", "F#5"
  centsOff: number;     // deviation from perfect pitch (−50 to +50)
  confidence: number;   // 0–1, higher = more certain
}

export type PitchCallback = (result: PitchResult) => void;

// ── Constants ──────────────────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// YIN algorithm threshold — lower = stricter pitch detection, fewer false positives
// 0.15 is a good balance for piano; increase to 0.2 for noisier environments
const DEFAULT_YIN_THRESHOLD = 0.15;

// Minimum RMS amplitude to consider as a real signal (not silence)
const DEFAULT_SILENCE_THRESHOLD = 0.01;

// AnalyserNode FFT size — 2048 samples at 44.1kHz = ~46ms buffer
// Good balance between latency and frequency resolution
const FFT_SIZE = 2048;

// Polling interval for pitch detection loop (ms)
const POLL_INTERVAL_MS = 50;

// ── Pure functions (exported for testing) ──────────────────────────────────────

/**
 * YIN pitch detection algorithm.
 * Returns detected frequency in Hz, or null if no clear pitch found.
 *
 * Reference: de Cheveigné & Kawahara (2002)
 * "YIN, a fundamental frequency estimator for speech and music"
 *
 * @param buffer - time-domain audio samples (Float32Array from AnalyserNode)
 * @param sampleRate - audio sample rate (e.g. 44100)
 * @param threshold - YIN clarity threshold (0–1, lower = stricter)
 * @returns frequency in Hz, or null if no pitch detected
 */
export function yinPitchDetect(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = DEFAULT_YIN_THRESHOLD,
): number | null {
  const halfLen = Math.floor(buffer.length / 2);

  // Step 1: Difference function
  // d(τ) = Σ (x[j] - x[j+τ])² for j = 0..W-1
  const diff = new Float32Array(halfLen);
  for (let tau = 0; tau < halfLen; tau++) {
    let sum = 0;
    for (let j = 0; j < halfLen; j++) {
      const delta = buffer[j] - buffer[j + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // Step 2: Cumulative mean normalized difference function
  // d'(τ) = d(τ) / ((1/τ) * Σ d(j) for j=1..τ), with d'(0) = 1
  const cmndf = new Float32Array(halfLen);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfLen; tau++) {
    runningSum += diff[tau];
    cmndf[tau] = diff[tau] / (runningSum / tau);
  }

  // Step 3: Absolute threshold
  // Find the first tau where cmndf dips below the threshold, then find the local minimum
  let tauEstimate = -1;

  // Start at tau=2 to avoid detecting at lag 0/1 (which would be impossibly high frequencies)
  for (let tau = 2; tau < halfLen; tau++) {
    if (cmndf[tau] < threshold) {
      // Walk forward to find the local minimum in this dip
      while (tau + 1 < halfLen && cmndf[tau + 1] < cmndf[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    return null; // No pitch found
  }

  // Step 4: Parabolic interpolation for sub-sample accuracy
  // Fit a parabola through (tau-1, tau, tau+1) and find the minimum
  const tauInterp = parabolicInterpolation(cmndf, tauEstimate);

  // Convert lag (in samples) to frequency
  if (tauInterp <= 0) return null;
  const frequency = sampleRate / tauInterp;

  // Sanity check: piano range is roughly 27.5 Hz (A0) to 4186 Hz (C8)
  if (frequency < 20 || frequency > 5000) return null;

  return frequency;
}

/**
 * Parabolic interpolation around index i to find a more precise minimum.
 * Returns the interpolated index (fractional).
 */
function parabolicInterpolation(data: Float32Array, i: number): number {
  if (i <= 0 || i >= data.length - 1) return i;

  const s0 = data[i - 1];
  const s1 = data[i];
  const s2 = data[i + 1];

  // Denominator of parabolic fit
  const denom = 2 * (2 * s1 - s2 - s0);
  if (Math.abs(denom) < 1e-10) return i;

  const adjustment = (s2 - s0) / denom;
  return i + adjustment;
}

/**
 * Convert frequency in Hz to the nearest MIDI note number and cents offset.
 * A4 = 440 Hz = MIDI 69
 */
export function freqToMidi(frequency: number): { midiNote: number; centsOff: number } {
  // MIDI note = 69 + 12 * log2(freq / 440)
  const exactMidi = 69 + 12 * Math.log2(frequency / 440);
  const midiNote = Math.round(exactMidi);
  const centsOff = Math.round((exactMidi - midiNote) * 100);

  return { midiNote, centsOff };
}

/**
 * Convert a MIDI note number to a human-readable note name with octave.
 * e.g. 60 → "C4", 69 → "A4", 61 → "C#4"
 */
export function midiToNoteName(midiNote: number): string {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Compute RMS amplitude of an audio buffer.
 * Used to detect silence and estimate velocity.
 */
export function computeRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

// ── Pitch Detector class ───────────────────────────────────────────────────────

export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<PitchCallback> = new Set();

  private _isListening = false;
  private _lastResult: PitchResult | null = null;

  // Configurable
  yinThreshold = DEFAULT_YIN_THRESHOLD;
  silenceThreshold = DEFAULT_SILENCE_THRESHOLD;

  get isListening(): boolean {
    return this._isListening;
  }

  get lastResult(): PitchResult | null {
    return this._lastResult;
  }

  /**
   * Request microphone access and start listening for pitch.
   * Throws if microphone permission is denied or unavailable.
   */
  async startListening(): Promise<void> {
    if (this._isListening) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser');
    }

    // Request mic access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,  // We want raw audio for pitch detection
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    // Create audio pipeline
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.buffer = new Float32Array(this.analyser.fftSize);

    this.source = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.source.connect(this.analyser);
    // Note: we do NOT connect analyser to destination — no feedback loop

    this._isListening = true;

    // Start polling loop
    this.pollTimer = setInterval(() => this.detectPitch(), POLL_INTERVAL_MS);
  }

  /**
   * Stop listening and release all audio resources.
   */
  stopListening(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.analyser = null;
    this.buffer = null;
    this._isListening = false;
    this._lastResult = null;
  }

  /**
   * Subscribe to pitch detection events.
   * Returns an unsubscribe function.
   */
  onPitch(callback: PitchCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get the current pitch (single sample). Returns null if no pitch detected.
   * Does not require listeners — can be called independently.
   */
  getCurrentPitch(): PitchResult | null {
    if (!this.analyser || !this.buffer) return null;

    this.analyser.getFloatTimeDomainData(this.buffer);

    // Check for silence
    const rms = computeRMS(this.buffer);
    if (rms < this.silenceThreshold) return null;

    // Run YIN
    const frequency = yinPitchDetect(this.buffer, this.audioCtx!.sampleRate, this.yinThreshold);
    if (frequency === null) return null;

    // Convert to musical note
    const { midiNote, centsOff } = freqToMidi(frequency);
    const noteName = midiToNoteName(midiNote);

    // Confidence: inverse of YIN clarity (lower CMNDF = higher confidence)
    // Also factor in signal amplitude
    const confidence = Math.min(1, rms * 10); // simple amplitude-based confidence

    return { frequency, midiNote, noteName, centsOff, confidence };
  }

  /**
   * Internal: called by the polling loop to detect pitch and notify listeners.
   */
  private detectPitch(): void {
    const result = this.getCurrentPitch();
    if (result) {
      this._lastResult = result;
      for (const listener of this.listeners) {
        listener(result);
      }
    }
  }

  /**
   * Clean up on garbage collection. Ensures resources are released.
   */
  destroy(): void {
    this.stopListening();
    this.listeners.clear();
  }
}

// ── Microphone permission helpers ──────────────────────────────────────────────

/**
 * Check the current microphone permission state without triggering a prompt.
 * Returns 'granted', 'denied', or 'prompt' (user hasn't decided yet).
 * Returns 'unsupported' if the Permissions API is not available.
 */
export async function getMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (!navigator.permissions?.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'unsupported';
  }
}

/**
 * Check if getUserMedia is available in this browser.
 */
export function isMicrophoneSupported(): boolean {
  return !!(navigator.mediaDevices?.getUserMedia);
}

// ── Singleton instance ─────────────────────────────────────────────────────────

export const pitchDetector = new PitchDetector();
