// Web Audio API piano engine
// Generates piano-like tones using oscillators + envelope

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Convert MIDI note number to frequency
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Play a piano-like tone
export function playNote(midiNote: number, duration: number = 0.5, velocity: number = 0.7): void {
  const ctx = getContext();
  const freq = midiToFreq(midiNote);
  const now = ctx.currentTime;

  // Main oscillator (slightly detuned pair for richness)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, now);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now); // octave harmonic
  osc2.detune.setValueAtTime(3, now); // slight detune

  // ADSR envelope
  const attack = 0.01;
  const decay = 0.1;
  const sustain = velocity * 0.4;
  const release = duration * 0.5;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(velocity, now + attack);
  gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
  gainNode.gain.linearRampToValueAtTime(sustain, now + duration - release);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Second oscillator at lower volume
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(velocity * 0.15, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc1.connect(gainNode);
  osc2.connect(gain2);
  gainNode.connect(ctx.destination);
  gain2.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration + 0.05);
  osc2.stop(now + duration + 0.05);
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
