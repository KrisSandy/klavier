<script lang="ts">
  import { playNote } from '../stores/audio';

  interface Props {
    /** Which intervals to test */
    intervals?: IntervalDef[];
  }

  interface IntervalDef {
    name: string;
    semitones: number;
    shortName: string;
  }

  const ALL_INTERVALS: IntervalDef[] = [
    { name: 'Unison', semitones: 0, shortName: 'P1' },
    { name: 'Minor 2nd', semitones: 1, shortName: 'm2' },
    { name: 'Major 2nd', semitones: 2, shortName: 'M2' },
    { name: 'Minor 3rd', semitones: 3, shortName: 'm3' },
    { name: 'Major 3rd', semitones: 4, shortName: 'M3' },
    { name: 'Perfect 4th', semitones: 5, shortName: 'P4' },
    { name: 'Tritone', semitones: 6, shortName: 'TT' },
    { name: 'Perfect 5th', semitones: 7, shortName: 'P5' },
    { name: 'Minor 6th', semitones: 8, shortName: 'm6' },
    { name: 'Major 6th', semitones: 9, shortName: 'M6' },
    { name: 'Minor 7th', semitones: 10, shortName: 'm7' },
    { name: 'Major 7th', semitones: 11, shortName: 'M7' },
    { name: 'Octave', semitones: 12, shortName: 'P8' },
  ];

  let {
    intervals = ALL_INTERVALS.filter(i => [2, 3, 4, 5, 7, 12].includes(i.semitones)),
  }: Props = $props();

  let currentInterval = $state<IntervalDef | null>(null);
  let rootMidi = $state(60);
  let selected = $state<string | null>(null);
  let score = $state(0);
  let total = $state(0);
  let mode = $state<'ascending' | 'descending' | 'harmonic'>('ascending');

  function pickRandom() {
    let next: IntervalDef;
    do {
      next = intervals[Math.floor(Math.random() * intervals.length)];
    } while (next === currentInterval && intervals.length > 1);

    // Random root between C3 (48) and C5 (72)
    rootMidi = 48 + Math.floor(Math.random() * 25);
    currentInterval = next;
    selected = null;
  }

  function playInterval() {
    if (!currentInterval) return;
    const secondMidi = rootMidi + currentInterval.semitones;

    if (mode === 'harmonic') {
      playNote(rootMidi, 1.2, 0.5);
      playNote(secondMidi, 1.2, 0.5);
    } else if (mode === 'ascending') {
      playNote(rootMidi, 0.8, 0.5);
      setTimeout(() => playNote(secondMidi, 0.8, 0.5), 600);
    } else {
      playNote(secondMidi, 0.8, 0.5);
      setTimeout(() => playNote(rootMidi, 0.8, 0.5), 600);
    }
  }

  function newRound() {
    pickRandom();
    setTimeout(playInterval, 300);
  }

  function handleGuess(interval: IntervalDef) {
    if (selected !== null || !currentInterval) return;
    selected = interval.name;
    total += 1;
    if (interval.name === currentInterval.name) {
      score += 1;
    }
  }

  function start() {
    score = 0;
    total = 0;
    newRound();
  }
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
  {#if currentInterval === null}
    <!-- Mode selection -->
    <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 8px;">
      {#each (['ascending', 'descending', 'harmonic'] as const) as m}
        <button
          style="
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            border: 2px solid {mode === m ? '#3d3929' : '#dad9d4'};
            background: {mode === m ? '#3d3929' : 'white'};
            color: {mode === m ? 'white' : '#3d3929'};
            transition: all 0.15s;
            text-transform: capitalize;
          "
          onclick={() => { mode = m; }}
        >{m}</button>
      {/each}
    </div>
    <div style="text-align: center;">
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-base font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={start}
      >Start Interval Training</button>
    </div>
  {:else}
    <!-- Stats -->
    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666;">
      <span>Score: <strong style="color: #3d3929;">{score}/{total}</strong></span>
      <span style="text-transform: capitalize;">Mode: {mode}</span>
    </div>

    <!-- Play button -->
    <div style="text-align: center;">
      <button
        style="background: #ce7e4f; color: white; padding: 12px 28px; border-radius: 8px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s;"
        onclick={playInterval}
      >🔊 Play Again</button>
    </div>

    <!-- Feedback -->
    {#if selected !== null}
      <div style="text-align: center; padding: 12px; border-radius: 8px; background: {selected === currentInterval.name ? '#d4edda' : '#f8d7da'}; color: {selected === currentInterval.name ? '#28a745' : '#dc3545'}; font-weight: 600;">
        {#if selected === currentInterval.name}
          ✓ Correct! It was a {currentInterval.name}
        {:else}
          ✗ It was a {currentInterval.name} ({currentInterval.semitones} semitones)
        {/if}
      </div>
    {/if}

    <!-- Answer grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
      {#each intervals as interval}
        {@const isCorrect = selected !== null && interval.name === currentInterval.name}
        {@const isWrong = selected === interval.name && interval.name !== currentInterval.name}
        <button
          style="
            padding: 10px 8px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: {selected !== null ? 'default' : 'pointer'};
            transition: all 0.15s;
            border: 2px solid {isCorrect ? '#28a745' : isWrong ? '#dc3545' : '#dad9d4'};
            background: {isCorrect ? '#d4edda' : isWrong ? '#f8d7da' : 'white'};
            color: #3d3929;
            opacity: {selected !== null && !isCorrect && !isWrong ? '0.4' : '1'};
          "
          onclick={() => handleGuess(interval)}
          disabled={selected !== null}
        >
          <span style="font-weight: 700; font-size: 0.8rem; color: #ce7e4f;">{interval.shortName}</span><br>
          {interval.name}
        </button>
      {/each}
    </div>

    <!-- Next -->
    {#if selected !== null}
      <div style="text-align: center;">
        <button
          class="bg-navy text-white px-6 py-3 rounded-lg text-base font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
          onclick={newRound}
        >Next Interval</button>
      </div>
    {/if}
  {/if}
</div>
