// Web Audio API piano engine
// Improved piano synthesis with percussive attack, rich harmonics, and natural decay

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let reverbAmount: number = 0.15;
let audioAvailable: boolean = true;

function getContext(): AudioContext | null {
  if (!audioAvailable) return null;

  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.6;

      // Compressor to prevent clipping
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 10;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;

      masterGain.connect(compressor);
      compressor.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // AudioContext.resume() requires a user gesture — silently ignore
      });
    }
    return audioCtx;
  } catch (e) {
    console.warn('[Klavier] Web Audio API not available:', e);
    audioAvailable = false;
    return null;
  }
}

function getMaster(): GainNode | null {
  getContext();
  return masterGain;
}

// Convert MIDI note number to frequency
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Piano harmonic amplitudes (relative to fundamental)
// Based on measured piano spectra — higher harmonics decay faster
const HARMONIC_AMPS = [
  1.0,    // fundamental
  0.5,    // 2nd harmonic
  0.25,   // 3rd
  0.12,   // 4th
  0.08,   // 5th
  0.04,   // 6th
  0.02,   // 7th
  0.01,   // 8th
];

// Play a piano-like tone
export function playNote(midiNote: number, duration: number = 0.8, velocity: number = 0.7): void {
  const ctx = getContext();
  const master = getMaster();
  if (!ctx || !master) return;
  const freq = midiToFreq(midiNote);
  const now = ctx.currentTime;

  // Higher notes decay faster (like a real piano)
  const pitchFactor = Math.max(0.3, 1 - (midiNote - 48) / 80);
  const effectiveDuration = duration * pitchFactor + duration * (1 - pitchFactor) * 0.5;
  const totalDuration = Math.max(0.3, effectiveDuration);

  // Slight random detune for natural feel (±3 cents)
  const detuneCents = (Math.random() - 0.5) * 6;

  // Output gain for this note
  const noteGain = ctx.createGain();
  noteGain.connect(master);

  // -- Harmonic oscillators --
  const numHarmonics = freq < 500 ? 8 : freq < 1000 ? 6 : 4;

  for (let h = 0; h < numHarmonics; h++) {
    const harmonicNum = h + 1;
    const harmonicFreq = freq * harmonicNum;

    // Skip harmonics above Nyquist
    if (harmonicFreq > ctx.sampleRate / 2) break;

    // Slight inharmonicity (piano strings are slightly stiff)
    const inharmonicity = 1 + 0.0002 * harmonicNum * harmonicNum * (midiNote > 60 ? 1.5 : 1);
    const actualFreq = harmonicFreq * inharmonicity;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(actualFreq, now);
    osc.detune.setValueAtTime(detuneCents * (1 / harmonicNum), now);

    const amp = (HARMONIC_AMPS[h] ?? 0.005) * velocity;

    // Sharper attack for lower harmonics, softer for upper
    const attackTime = 0.003 + h * 0.001;
    // Higher harmonics decay much faster
    const harmonicDecay = totalDuration * (1 / (1 + h * 0.4));

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(amp, now + attackTime);
    oscGain.gain.setTargetAtTime(amp * 0.3, now + attackTime, harmonicDecay * 0.3);
    oscGain.gain.setTargetAtTime(0.0001, now + harmonicDecay * 0.6, harmonicDecay * 0.4);

    osc.connect(oscGain);
    oscGain.connect(noteGain);
    osc.start(now);
    osc.stop(now + totalDuration + 0.1);
  }

  // -- Percussive hammer attack (noise burst) --
  const noiseLen = 0.02;
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  // Bandpass filter the noise around the note frequency for a "woody" hammer sound
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(Math.min(freq * 2, 4000), now);
  noiseFilter.Q.setValueAtTime(1.5, now);

  const noiseGain = ctx.createGain();
  const noiseAmp = velocity * 0.25 * (freq > 500 ? 1.2 : 0.8);
  noiseGain.gain.setValueAtTime(noiseAmp, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(noteGain);
  noiseSource.start(now);
  noiseSource.stop(now + noiseLen + 0.01);

  // -- Overall envelope --
  noteGain.gain.setValueAtTime(1, now);
  noteGain.gain.setTargetAtTime(0.0001, now + totalDuration * 0.7, totalDuration * 0.3);

  // -- Simple reverb via a single delay feedback --
  if (reverbAmount > 0.01) {
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = reverbAmount * 0.4;

    const delay = ctx.createDelay();
    delay.delayTime.value = 0.06;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 3000;

    noteGain.connect(delay);
    delay.connect(lpf);
    lpf.connect(feedback);
    feedback.connect(delay);
    lpf.connect(reverbGain);
    reverbGain.connect(master);
  }
}

// Play a sequence of notes with timing
export function playSequence(
  notes: { midiNote: number; duration?: number }[],
  bpm: number = 120,
  onNoteStart?: (index: number) => void,
): { stop: () => void } {
  const beatDuration = 60 / bpm;
  let currentTime = 0;
  let stopped = false;
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const dur = (note.duration ?? 1) * beatDuration;
    const delay = currentTime * 1000;

    const timeout = setTimeout(() => {
      if (stopped) return;
      onNoteStart?.(i);
      playNote(note.midiNote, dur);
    }, delay);

    timeouts.push(timeout);
    currentTime += dur;
  }

  return {
    stop() {
      stopped = true;
      timeouts.forEach(clearTimeout);
    },
  };
}

// Metronome click
export function playClick(accent: boolean = false): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(accent ? 1000 : 800, now);

  gain.gain.setValueAtTime(accent ? 0.3 : 0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

// Play multiple notes simultaneously with slight stagger
export function playChord(midiNotes: number[], duration?: number, velocity?: number): void {
  const staggerMs = 8;
  for (let i = 0; i < midiNotes.length; i++) {
    setTimeout(() => {
      playNote(midiNotes[i], duration, velocity);
    }, i * staggerMs);
  }
}

// Set reverb amount (0.0 = dry, 1.0 = max reverb)
export function setReverb(amount: number): void {
  reverbAmount = Math.max(0, Math.min(1, amount));
}
