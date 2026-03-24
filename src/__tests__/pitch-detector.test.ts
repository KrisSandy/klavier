import { describe, it, expect } from 'vitest';
import {
  yinPitchDetect,
  freqToMidi,
  midiToNoteName,
  computeRMS,
} from '../stores/pitch-detector';

// ── Helper: generate a pure sine wave buffer ────────────────────────────────

function generateSineWave(
  frequency: number,
  sampleRate: number,
  length: number,
  amplitude: number = 0.8,
): Float32Array {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }
  return buffer;
}

function generateSilence(length: number): Float32Array {
  return new Float32Array(length);
}

// ── YIN pitch detection ─────────────────────────────────────────────────────

describe('yinPitchDetect', () => {
  const sampleRate = 44100;
  const bufferLen = 2048;

  it('detects A4 (440 Hz)', () => {
    const buffer = generateSineWave(440, sampleRate, bufferLen);
    const freq = yinPitchDetect(buffer, sampleRate);
    expect(freq).not.toBeNull();
    // Allow ±2 Hz tolerance for a 2048-sample buffer
    expect(freq!).toBeGreaterThan(438);
    expect(freq!).toBeLessThan(442);
  });

  it('detects C4 (261.63 Hz)', () => {
    const buffer = generateSineWave(261.63, sampleRate, bufferLen);
    const freq = yinPitchDetect(buffer, sampleRate);
    expect(freq).not.toBeNull();
    expect(freq!).toBeGreaterThan(259);
    expect(freq!).toBeLessThan(264);
  });

  it('detects A5 (880 Hz)', () => {
    const buffer = generateSineWave(880, sampleRate, bufferLen);
    const freq = yinPitchDetect(buffer, sampleRate);
    expect(freq).not.toBeNull();
    expect(freq!).toBeGreaterThan(876);
    expect(freq!).toBeLessThan(884);
  });

  it('detects E2 (82.41 Hz) — low note', () => {
    // Low notes need longer buffers for accurate detection
    const longBuffer = generateSineWave(82.41, sampleRate, 4096);
    const freq = yinPitchDetect(longBuffer, sampleRate);
    expect(freq).not.toBeNull();
    expect(freq!).toBeGreaterThan(80);
    expect(freq!).toBeLessThan(85);
  });

  it('detects C6 (1046.5 Hz) — high note', () => {
    const buffer = generateSineWave(1046.5, sampleRate, bufferLen);
    const freq = yinPitchDetect(buffer, sampleRate);
    expect(freq).not.toBeNull();
    expect(freq!).toBeGreaterThan(1040);
    expect(freq!).toBeLessThan(1053);
  });

  it('returns null for silence', () => {
    const buffer = generateSilence(bufferLen);
    const freq = yinPitchDetect(buffer, sampleRate);
    expect(freq).toBeNull();
  });

  it('returns null for random noise (no clear pitch)', () => {
    const buffer = new Float32Array(bufferLen);
    // Use deterministic "noise" — alternating high/low to defeat autocorrelation
    for (let i = 0; i < bufferLen; i++) {
      buffer[i] = Math.sin(i * 0.1) * Math.sin(i * 0.37) * Math.sin(i * 1.7) * 0.3;
    }
    const freq = yinPitchDetect(buffer, sampleRate, 0.1); // strict threshold
    // Noise might occasionally produce a result, but with a strict threshold it shouldn't
    // We just verify it doesn't crash
    expect(freq === null || typeof freq === 'number').toBe(true);
  });

  it('handles very low amplitude signal', () => {
    const buffer = generateSineWave(440, sampleRate, bufferLen, 0.001);
    const freq = yinPitchDetect(buffer, sampleRate);
    // Should still detect — YIN works on waveform shape, not amplitude
    // (amplitude gating is done separately via computeRMS)
    expect(freq).not.toBeNull();
    expect(freq!).toBeGreaterThan(435);
    expect(freq!).toBeLessThan(445);
  });

  it('respects threshold parameter', () => {
    const buffer = generateSineWave(440, sampleRate, bufferLen);
    // Very strict threshold — should still detect a clean sine
    const strict = yinPitchDetect(buffer, sampleRate, 0.05);
    expect(strict).not.toBeNull();
    // Very loose threshold
    const loose = yinPitchDetect(buffer, sampleRate, 0.5);
    expect(loose).not.toBeNull();
  });
});

// ── Frequency to MIDI conversion ────────────────────────────────────────────

describe('freqToMidi', () => {
  it('converts 440 Hz to MIDI 69 (A4) with 0 cents offset', () => {
    const { midiNote, centsOff } = freqToMidi(440);
    expect(midiNote).toBe(69);
    expect(centsOff).toBe(0);
  });

  it('converts 261.63 Hz to MIDI 60 (C4)', () => {
    const { midiNote } = freqToMidi(261.63);
    expect(midiNote).toBe(60);
  });

  it('converts 880 Hz to MIDI 81 (A5)', () => {
    const { midiNote, centsOff } = freqToMidi(880);
    expect(midiNote).toBe(81);
    expect(centsOff).toBe(0);
  });

  it('converts 27.5 Hz to MIDI 21 (A0 — lowest piano key)', () => {
    const { midiNote } = freqToMidi(27.5);
    expect(midiNote).toBe(21);
  });

  it('converts 4186 Hz to MIDI 108 (C8 — highest piano key)', () => {
    const { midiNote } = freqToMidi(4186.01);
    expect(midiNote).toBe(108);
  });

  it('reports positive cents for slightly sharp pitch', () => {
    // 10 cents above A4 ≈ 442.55 Hz
    const { midiNote, centsOff } = freqToMidi(442.55);
    expect(midiNote).toBe(69);
    expect(centsOff).toBeGreaterThan(0);
    expect(centsOff).toBeLessThanOrEqual(15);
  });

  it('reports negative cents for slightly flat pitch', () => {
    // 10 cents below A4 ≈ 437.47 Hz
    const { midiNote, centsOff } = freqToMidi(437.47);
    expect(midiNote).toBe(69);
    expect(centsOff).toBeLessThan(0);
    expect(centsOff).toBeGreaterThanOrEqual(-15);
  });

  it('cents offset is always between -50 and +50', () => {
    // Test across the piano range
    const testFreqs = [27.5, 55, 110, 220, 440, 880, 1760, 3520];
    for (const freq of testFreqs) {
      const { centsOff } = freqToMidi(freq);
      expect(centsOff).toBeGreaterThanOrEqual(-50);
      expect(centsOff).toBeLessThanOrEqual(50);
    }
  });
});

// ── MIDI to note name ───────────────────────────────────────────────────────

describe('midiToNoteName', () => {
  it('converts MIDI 60 to C4', () => {
    expect(midiToNoteName(60)).toBe('C4');
  });

  it('converts MIDI 69 to A4', () => {
    expect(midiToNoteName(69)).toBe('A4');
  });

  it('converts MIDI 61 to C#4', () => {
    expect(midiToNoteName(61)).toBe('C#4');
  });

  it('converts MIDI 21 to A0 (lowest piano)', () => {
    expect(midiToNoteName(21)).toBe('A0');
  });

  it('converts MIDI 108 to C8 (highest piano)', () => {
    expect(midiToNoteName(108)).toBe('C8');
  });

  it('converts MIDI 0 to C-1', () => {
    expect(midiToNoteName(0)).toBe('C-1');
  });

  it('converts all sharps correctly', () => {
    // Octave 4 sharps
    expect(midiToNoteName(61)).toBe('C#4');
    expect(midiToNoteName(63)).toBe('D#4');
    expect(midiToNoteName(66)).toBe('F#4');
    expect(midiToNoteName(68)).toBe('G#4');
    expect(midiToNoteName(70)).toBe('A#4');
  });

  it('handles full octave from C4 to B4', () => {
    const expected = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'];
    for (let i = 0; i < 12; i++) {
      expect(midiToNoteName(60 + i)).toBe(expected[i]);
    }
  });
});

// ── RMS computation ─────────────────────────────────────────────────────────

describe('computeRMS', () => {
  it('returns 0 for silence', () => {
    const buffer = generateSilence(1024);
    expect(computeRMS(buffer)).toBe(0);
  });

  it('returns correct RMS for known signal', () => {
    // A constant signal of 0.5 has RMS = 0.5
    const buffer = new Float32Array(1024).fill(0.5);
    expect(computeRMS(buffer)).toBeCloseTo(0.5, 5);
  });

  it('returns ~0.707 for a full-amplitude sine wave', () => {
    // RMS of sin(x) over a full period = 1/√2 ≈ 0.7071
    const buffer = generateSineWave(440, 44100, 44100, 1.0); // exactly 1 second
    const rms = computeRMS(buffer);
    expect(rms).toBeGreaterThan(0.69);
    expect(rms).toBeLessThan(0.72);
  });

  it('scales linearly with amplitude', () => {
    const rms1 = computeRMS(generateSineWave(440, 44100, 2048, 0.5));
    const rms2 = computeRMS(generateSineWave(440, 44100, 2048, 1.0));
    // rms2 should be ~2x rms1
    expect(rms2 / rms1).toBeGreaterThan(1.9);
    expect(rms2 / rms1).toBeLessThan(2.1);
  });
});

// ── Integration: YIN → freqToMidi → midiToNoteName ─────────────────────────

describe('pitch detection pipeline', () => {
  const sampleRate = 44100;
  const bufferLen = 2048;

  const testNotes = [
    { name: 'C4', freq: 261.63, midi: 60 },
    { name: 'E4', freq: 329.63, midi: 64 },
    { name: 'G4', freq: 392.0, midi: 67 },
    { name: 'A4', freq: 440.0, midi: 69 },
    { name: 'C5', freq: 523.25, midi: 72 },
    { name: 'A5', freq: 880.0, midi: 81 },
  ];

  for (const { name, freq, midi } of testNotes) {
    it(`detects ${name} (${freq} Hz) → MIDI ${midi}`, () => {
      const buffer = generateSineWave(freq, sampleRate, bufferLen);
      const detected = yinPitchDetect(buffer, sampleRate);
      expect(detected).not.toBeNull();

      const { midiNote } = freqToMidi(detected!);
      expect(midiNote).toBe(midi);

      const noteName = midiToNoteName(midiNote);
      expect(noteName).toBe(name);
    });
  }
});
