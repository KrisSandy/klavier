<script lang="ts">
  import { playClick } from '../stores/audio';

  let { initialBpm = 120 }: { initialBpm?: number } = $props();

  // eslint-disable-next-line -- intentionally capturing initial value only
  let bpm = $state(+initialBpm);
  let isRunning = $state(false);
  let beat = $state(0);
  let beatInterval: ReturnType<typeof setInterval> | undefined;

  const msPerBeat = $derived((60000 / bpm) | 0);
  const isAccent = $derived(beat === 0);

  function toggleMetronome() {
    if (isRunning) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }

  function startMetronome() {
    isRunning = true;
    beat = 0;
    playClick(true);

    beatInterval = setInterval(() => {
      beat = (beat + 1) % 4;
      playClick(isAccent);
    }, msPerBeat);
  }

  function stopMetronome() {
    isRunning = false;
    beat = 0;
    clearInterval(beatInterval);
  }

  function incrementBpm() {
    bpm = Math.min(220, bpm + 1);
    if (isRunning) {
      stopMetronome();
      startMetronome();
    }
  }

  function decrementBpm() {
    bpm = Math.max(40, bpm - 1);
    if (isRunning) {
      stopMetronome();
      startMetronome();
    }
  }

  $effect(() => {
    return () => clearInterval(beatInterval);
  });
</script>

<div style="width: 100%; max-width: 400px; margin: 0 auto; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  <!-- Title -->
  <h3 style="font-size: 1.25rem; font-weight: 600; color: #3d3929; margin-bottom: 20px; text-align: center;">
    Metronome
  </h3>

  <!-- BPM Display and Control -->
  <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px;">
    <button
      onclick={decrementBpm}
      disabled={bpm === 40}
      style="background: #f0f0f0; border: none; width: 40px; height: 40px; border-radius: 6px; font-size: 1.25rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; {bpm === 40 ? 'opacity: 0.5; cursor: not-allowed;' : 'hover:background: #e0e0e0;'}"
    >
      −
    </button>

    <div style="text-align: center; min-width: 80px;">
      <div style="font-size: 2.5rem; font-weight: 700; color: #3d3929;">
        {bpm}
      </div>
      <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">
        BPM
      </div>
    </div>

    <button
      onclick={incrementBpm}
      disabled={bpm === 220}
      style="background: #f0f0f0; border: none; width: 40px; height: 40px; border-radius: 6px; font-size: 1.25rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; {bpm === 220 ? 'opacity: 0.5; cursor: not-allowed;' : 'hover:background: #e0e0e0;'}"
    >
      +
    </button>
  </div>

  <!-- BPM Slider -->
  <div style="margin-bottom: 24px;">
    <input
      type="range"
      min="40"
      max="220"
      bind:value={bpm}
      onchange={() => {
        if (isRunning) {
          stopMetronome();
          startMetronome();
        }
      }}
      style="width: 100%; cursor: pointer; accent-color: #ce7e4f;"
    />
    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #999; margin-top: 6px;">
      <span>40</span>
      <span>220</span>
    </div>
  </div>

  <!-- Beat Indicator -->
  <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 24px;">
    {#each [0, 1, 2, 3] as beatNum}
      <div
        style="width: 12px; height: 12px; border-radius: 50%; background: {beat === beatNum
          ? beatNum === 0
            ? '#ce7e4f'
            : '#28a745'
          : '#e5e7eb'}; transition: all 0.1s ease;"
      ></div>
    {/each}
  </div>

  <!-- Start/Stop Button -->
  <button
    onclick={toggleMetronome}
    style="width: 100%; padding: 14px 24px; border-radius: 8px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.15s; {isRunning
      ? 'background: #dc3545; color: white;'
      : 'background: #28a745; color: white;'}"
  >
    {isRunning ? 'Stop' : 'Start'}
  </button>

  <!-- Time Signature Display -->
  <div style="text-align: center; font-size: 0.875rem; color: #999; margin-top: 16px;">
    4/4 Time
  </div>
</div>
