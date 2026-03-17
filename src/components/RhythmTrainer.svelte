<script lang="ts">
  import { playClick } from '../stores/audio';

  let {
    pattern,
    bpm = 100,
    timeSignature = [4, 4],
    onComplete,
  }: {
    pattern: number[];
    bpm?: number;
    timeSignature?: [number, number];
    onComplete?: (accuracy: number) => void;
  } = $props();

  // State
  let state = $state<'idle' | 'countIn' | 'playing' | 'complete'>('idle');
  let countInBeat = $state(0);
  let activeMetronomeBeat = $state(0);
  let taps = $state<number[]>([]);
  let accuracy = $state<number | null>(null);
  let patternStartTime = $state<number | null>(null);

  // Derived values
  const beatDuration = $derived((60 / bpm) * 1000); // ms per beat
  const patternDuration = $derived(
    pattern.reduce((sum, dur) => sum + dur, 0) * beatDuration,
  );

  // Expected tap times based on pattern
  const expectedTaps = $derived.by(() => {
    const times: number[] = [];
    let currentBeat = 0;
    for (const dur of pattern) {
      times.push(currentBeat * beatDuration);
      currentBeat += dur;
    }
    return times;
  });

  // Get note symbol for a duration
  function getNoteSymbol(duration: number): string {
    if (duration === 4) return '○'; // whole
    if (duration === 2) return '𝅗𝅥'; // half
    if (duration === 1) return '♩'; // quarter
    if (duration === 0.5) return '♪'; // eighth
    return '♩';
  }

  // Start the countdown
  function startCountIn() {
    state = 'countIn';
    countInBeat = 0;
    taps = [];
    accuracy = null;
    patternStartTime = null;

    playClick(true); // Accent on 1

    let beat = 1;
    const countInInterval = setInterval(() => {
      if (beat === 4) {
        // After 4 beats, start pattern
        clearInterval(countInInterval);
        startPattern();
      } else {
        beat++;
        activeMetronomeBeat = beat % 4;
        playClick(beat % 4 === 0);
      }
    }, beatDuration);
  }

  // Start the pattern playback
  function startPattern() {
    state = 'playing';
    activeMetronomeBeat = 0;
    patternStartTime = Date.now();
    taps = [];

    let beatIndex = 0;

    // Play clicks for each beat in the pattern
    const playBeat = (index: number) => {
      if (index < pattern.length) {
        playClick(index === 0); // Accent first beat
        activeMetronomeBeat = index % 4;

        setTimeout(() => {
          playBeat(index + 1);
        }, pattern[index] * beatDuration);
      }
    };

    playBeat(0);

    // After pattern finishes, show results
    setTimeout(() => {
      calculateAccuracy();
    }, patternDuration);
  }

  // Handle tap
  function handleTap() {
    if (state !== 'playing' || patternStartTime === null) return;

    const tapTime = Date.now() - patternStartTime;
    taps.push(tapTime);
  }

  // Spacebar support
  function handleKeydown(e: KeyboardEvent) {
    if (e.code === 'Space') {
      e.preventDefault();
      handleTap();
    }
  }

  // Calculate accuracy
  function calculateAccuracy() {
    state = 'complete';

    if (taps.length === 0) {
      accuracy = 0;
      return;
    }

    // For each expected tap, find closest actual tap
    let correctTaps = 0;
    const tolerance = 100; // ms

    for (const expected of expectedTaps) {
      const closest = taps.reduce((prev, curr) => {
        return Math.abs(curr - expected) < Math.abs(prev - expected) ? curr : prev;
      });

      if (Math.abs(closest - expected) <= tolerance) {
        correctTaps++;
      }
    }

    accuracy = Math.round((correctTaps / expectedTaps.length) * 100);
  }

  // Color for accuracy badge
  const accuracyColor = $derived.by(() => {
    if (accuracy === null) return 'bg-purple text-white';
    if (accuracy >= 80) return 'bg-correct text-correct-text';
    if (accuracy >= 60) return 'bg-purple text-white';
    return 'bg-wrong text-white';
  });

  // Reset
  function reset() {
    state = 'idle';
    countInBeat = 0;
    activeMetronomeBeat = 0;
    taps = [];
    accuracy = null;
    patternStartTime = null;
  }

  function nextPattern() {
    reset();
    onComplete?.(accuracy ?? 0);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="max-w-lg mx-auto px-6 py-8">
  <!-- Title -->
  <h2 class="text-[1.3rem] font-bold text-navy text-center mb-8">Rhythm Trainer</h2>

  <!-- Pattern Display -->
  <div class="bg-white rounded-lg p-6 mb-8 border border-[#e8e6e0]">
    <p class="text-[0.9rem] text-[#6b6455] text-center mb-4">Pattern</p>
    <div class="flex justify-center items-baseline gap-6">
      {#each pattern as duration, i}
        <div class="flex flex-col items-center">
          <div class="text-[2.5rem] leading-none text-navy mb-2">
            {getNoteSymbol(duration)}
          </div>
          <div class="text-[0.75rem] text-[#999]">
            {duration === 4 ? 'Whole' : duration === 2 ? 'Half' : duration === 1 ? 'Quarter' : 'Eighth'}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Metronome Visualization -->
  {#if state !== 'complete'}
    <div class="bg-white rounded-lg p-8 mb-8 flex flex-col items-center border border-[#e8e6e0]">
      <p class="text-[0.9rem] text-[#6b6455] mb-4">
        {state === 'idle' ? 'Ready' : state === 'countIn' ? 'Count In' : 'Listen & Tap'}
      </p>

      <!-- Metronome circle -->
      <div
        class="w-20 h-20 rounded-full transition-all duration-100"
        style="background-color: {state === 'idle'
          ? '#e8e6e0'
          : activeMetronomeBeat === 0
            ? '#ce7e4f'
            : '#28a745'}; box-shadow: {state === 'idle' ? 'none' : '0 0 20px rgba(206, 126, 79, 0.3)'}"
      ></div>

      <p class="text-[0.8rem] text-[#999] mt-4">
        {#if state === 'idle'}
          BPM: {bpm}
        {:else if state === 'countIn'}
          Count In: {4 - countInBeat}
        {:else}
          TAP WITH THE BEAT
        {/if}
      </p>
    </div>
  {/if}

  <!-- TAP Button (only show during playing state) -->
  {#if state === 'playing'}
    <div class="flex justify-center mb-8">
      <button
        class="w-32 h-32 rounded-full transition-all duration-75 font-bold text-white text-xl flex items-center justify-center shadow-lg"
        style="background-color: {taps.length > 0 ? '#28a745' : '#ce7e4f'}; transform: {taps.length >
        0
          ? 'scale(0.95)'
          : 'scale(1)'};"
        onclick={handleTap}
      >
        TAP
      </button>
    </div>
  {/if}

  <!-- Start Button (idle state) -->
  {#if state === 'idle'}
    <div class="flex justify-center mb-8">
      <button
        class="px-8 py-3 bg-navy text-white rounded-lg font-semibold text-[1rem] hover:opacity-90 transition-opacity"
        onclick={startCountIn}
      >
        Start
      </button>
    </div>
  {/if}

  <!-- Results Section -->
  {#if state === 'complete' && accuracy !== null}
    <div class="bg-white rounded-lg p-8 mb-8 border border-[#e8e6e0] text-center">
      <p class="text-[0.9rem] text-[#6b6455] mb-4">Your Accuracy</p>
      <div class="flex justify-center items-center gap-4 mb-6">
        <div class={`px-6 py-3 rounded-lg font-bold text-xl ${accuracyColor}`}>
          {accuracy}%
        </div>
      </div>

      {#if accuracy >= 80}
        <p class="text-correct font-semibold">Excellent! Perfect rhythm.</p>
      {:else if accuracy >= 60}
        <p class="text-purple font-semibold">Good effort! Keep practicing.</p>
      {:else}
        <p class="text-wrong font-semibold">Keep trying! You'll get it.</p>
      {/if}

      <p class="text-[0.85rem] text-[#6b6455] mt-3">
        You tapped {taps.length} time{taps.length !== 1 ? 's' : ''} out of {expectedTaps.length}
        expected beats.
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-4 justify-center">
      <button
        class="px-6 py-2.5 bg-purple text-white rounded-lg font-semibold text-[0.95rem] hover:opacity-90 transition-opacity"
        onclick={reset}
      >
        Try Again
      </button>
      <button
        class="px-6 py-2.5 bg-navy text-white rounded-lg font-semibold text-[0.95rem] hover:opacity-90 transition-opacity"
        onclick={nextPattern}
      >
        Next Pattern
      </button>
    </div>
  {/if}

  <!-- Info -->
  <div class="text-center text-[0.8rem] text-[#999] mt-8">
    <p>BPM: {bpm} • Time: {timeSignature[0]}/{timeSignature[1]}</p>
    <p class="mt-2">Press SPACEBAR or tap the button to record your taps</p>
  </div>
</div>
