<script lang="ts">
  import Staff from './Staff.svelte';
  import { TREBLE_NOTES, type Note } from '../data/notes';
  import { playNote } from '../stores/audio';

  interface Props {
    /** Subset of notes to drill (defaults to all treble notes) */
    notePool?: Note[];
    /** Seconds per note before it advances */
    timePerNote?: number;
  }

  let {
    notePool = TREBLE_NOTES.filter(n => n.yPos >= 40 && n.yPos <= 120),
    timePerNote = 4,
  }: Props = $props();

  let running = $state(false);
  let currentNote = $state<Note | null>(null);
  let score = $state(0);
  let total = $state(0);
  let streak = $state(0);
  let bestStreak = $state(0);
  let feedback = $state<'correct' | 'wrong' | null>(null);
  let timerWidth = $state(100);
  let timerInterval: ReturnType<typeof setInterval> | undefined;
  let noteTimeout: ReturnType<typeof setTimeout> | undefined;

  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  function pickRandom(): Note {
    let next: Note;
    do {
      next = notePool[Math.floor(Math.random() * notePool.length)];
    } while (next === currentNote && notePool.length > 1);
    return next;
  }

  function start() {
    running = true;
    score = 0;
    total = 0;
    streak = 0;
    bestStreak = 0;
    nextNote();
  }

  function stop() {
    running = false;
    currentNote = null;
    feedback = null;
    clearInterval(timerInterval);
    clearTimeout(noteTimeout);
  }

  function nextNote() {
    feedback = null;
    currentNote = pickRandom();
    timerWidth = 100;

    clearInterval(timerInterval);
    clearTimeout(noteTimeout);

    const startTime = Date.now();
    const duration = timePerNote * 1000;

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      timerWidth = Math.max(0, 100 - (elapsed / duration) * 100);
    }, 50);

    noteTimeout = setTimeout(() => {
      // Time's up — count as wrong
      clearInterval(timerInterval);
      feedback = 'wrong';
      streak = 0;
      total += 1;
      setTimeout(nextNote, 800);
    }, duration);
  }

  function handleGuess(letter: string) {
    if (!currentNote || feedback !== null) return;

    clearInterval(timerInterval);
    clearTimeout(noteTimeout);
    total += 1;

    if (letter === currentNote.name) {
      feedback = 'correct';
      score += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      playNote(currentNote.midiNote, 0.5, 0.5);
    } else {
      feedback = 'wrong';
      streak = 0;
    }

    setTimeout(nextNote, 600);
  }
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
  {#if !running}
    <div style="text-align: center;">
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-base font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={start}
      >Start Sight-Reading Drill</button>
      {#if total > 0}
        <p style="margin-top: 12px; color: #666; font-size: 0.9rem;">
          Last round: {score}/{total} correct — Best streak: {bestStreak}
        </p>
      {/if}
    </div>
  {:else}
    <!-- Timer bar -->
    <div style="height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
      <div
        style="height: 100%; background: {timerWidth > 30 ? '#ce7e4f' : '#dc3545'}; width: {timerWidth}%; transition: width 0.05s linear;"
      ></div>
    </div>

    <!-- Stats -->
    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666;">
      <span>Score: <strong style="color: #3d3929;">{score}/{total}</strong></span>
      <span>Streak: <strong style="color: {streak >= 5 ? '#28a745' : '#3d3929'};">{streak}</strong></span>
      <button
        style="background: none; border: none; color: #999; cursor: pointer; font-size: 0.85rem; text-decoration: underline;"
        onclick={stop}
      >Stop</button>
    </div>

    <!-- Staff display -->
    {#if currentNote}
      <div style="background: white; border-radius: 8px; padding: 16px; border: 2px solid {feedback === 'correct' ? '#28a745' : feedback === 'wrong' ? '#dc3545' : '#e8e6e0'}; transition: border-color 0.2s;">
        <Staff yPos={currentNote.yPos} />
      </div>
    {/if}

    <!-- Feedback -->
    {#if feedback}
      <div style="text-align: center; font-size: 0.95rem; font-weight: 600; color: {feedback === 'correct' ? '#28a745' : '#dc3545'};">
        {feedback === 'correct' ? '✓ Correct!' : `✗ It was ${currentNote?.name}`}
      </div>
    {/if}

    <!-- Answer buttons -->
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
      {#each letters as letter}
        <button
          style="
            padding: 12px 0;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
            border: 2px solid {feedback !== null && currentNote && letter === currentNote.name ? '#28a745' : '#dad9d4'};
            background: {feedback !== null && currentNote && letter === currentNote.name ? '#d4edda' : 'white'};
            color: #3d3929;
          "
          onclick={() => handleGuess(letter)}
          disabled={feedback !== null}
        >
          {letter}
        </button>
      {/each}
    </div>
  {/if}
</div>
