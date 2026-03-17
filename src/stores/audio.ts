// Web Audio API piano engine
// Generates piano-like tones using oscillators + envelope

let audioCtx: AudioContext | null = null;
let reverbDryGain: GainNode | null = null;
let reverbWetGain: GainNode | null = null;
let reverbAmount: number = 0.2; // 80/20 mix default

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    initReverb();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Initialize reverb network (feedback delay network)
function initReverb(): void {
  if (!audioCtx) return;

  // Create reverb processing chain
  const dryGain = audioCtx.createGain();
  const wetGain = audioCtx.createGain();

  // Feedback delay network for reverb
  const delay1 = audioCtx.createDelay();
  const delay2 = audioCtx.createDelay();
  const delay3 = audioCtx.createDelay();
  const feedback1 = audioCtx.createGain();
  const feedback2 = audioCtx.createGain();
  const feedback3 = audioCtx.createGain();

  // Set delay times (in seconds) - slightly different for density
  delay1.delayTime.value = 0.05;
  delay2.delayTime.value = 0.07;
  delay3.delayTime.value = 0.09;

  // Feedback amounts (decay)
  feedback1.gain.value = 0.4;
  feedback2.gain.value = 0.35;
  feedback3.gain.value = 0.3;

  // Connect feedback loops
  delay1.connect(feedback1);
  feedback1.connect(delay1);
  feedback1.connect(wetGain);

  delay2.connect(feedback2);
  feedback2.connect(delay2);
  feedback2.connect(wetGain);

  delay3.connect(feedback3);
  feedback3.connect(delay3);
  feedback3.connect(wetGain);

  // Dry path
  dryGain.connect(audioCtx.destination);

  // Wet path through reverb and compressor
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -30;
  compressor.knee.value = 40;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  wetGain.connect(compressor);
  compressor.connect(audioCtx.destination);

  // Route audio: split to dry and wet, wet goes through delays
  const mainGain = audioCtx.createGain();
  mainGain.connect(dryGain);
  mainGain.connect(delay1);
  mainGain.connect(delay2);
  mainGain.connect(delay3);

  reverbDryGain = dryGain;
  reverbWetGain = wetGain;

  // Set initial 80/20 mix
  updateReverbMix();
}

// Convert MIDI note number to frequency
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Update reverb dry/wet mix based on reverbAmount (0.0 to 1.0)
function updateReverbMix(): void {
  if (!reverbDryGain || !reverbWetGain) return;
  const dryLevel = 1 - reverbAmount;
  const wetLevel = reverbAmount;
  reverbDryGain.gain.value = dryLevel;
  reverbWetGain.gain.value = wetLevel;
}

// Play a piano-like tone
export function playNote(midiNote: number, duration: number = 0.5, velocity: number = 0.7): void {
  const ctx = getContext();
  const freq = midiToFreq(midiNote);
  const now = ctx.currentTime;

  // Random detune (±5 cents) for less synthetic sound
  const detuneAmount = (Math.random() - 0.5) * 10; // ±5 cents

  // Main oscillator (slightly detuned pair for richness)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator(); // 3rd harmonic for body
  const gainNode = ctx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, now);
  osc1.detune.setValueAtTime(detuneAmount, now);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now); // octave harmonic
  osc2.detune.setValueAtTime(3 + detuneAmount * 0.5, now); // slight detune

  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(freq * 3, now); // 3rd harmonic
  osc3.detune.setValueAtTime(detuneAmount * 0.3, now);

  // ADSR envelope with softer attack curve using setTargetAtTime
  const attack = 0.015;
  const decay = 0.1;
  const sustain = velocity * 0.4;
  const release = duration * 0.5;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.setTargetAtTime(velocity, now, attack / 3); // softer attack curve
  gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
  gainNode.gain.linearRampToValueAtTime(sustain, now + duration - release);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Second oscillator at lower volume
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(velocity * 0.15, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Third oscillator (3rd harmonic) very quiet
  const gain3 = ctx.createGain();
  gain3.gain.setValueAtTime(velocity * 0.05, now);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc1.connect(gainNode);
  osc2.connect(gain2);
  osc3.connect(gain3);
  gainNode.connect(ctx.destination);
  gain2.connect(ctx.destination);
  gain3.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  osc1.stop(now + duration + 0.05);
  osc2.stop(now + duration + 0.05);
  osc3.stop(now + duration + 0.05);
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
  const staggerMs = 5;
  for (let i = 0; i < midiNotes.length; i++) {
    setTimeout(() => {
      playNote(midiNotes[i], duration, velocity);
    }, i * staggerMs);
  }
}

// Set reverb amount (0.0 = all dry, 1.0 = all wet, default 0.2 = 80/20 dry/wet)
export function setReverb(amount: number): void {
  reverbAmount = Math.max(0, Math.min(1, amount)); // clamp to [0, 1]
  updateReverbMix();
}
