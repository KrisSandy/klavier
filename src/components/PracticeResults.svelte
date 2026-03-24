<script lang="ts">
  import type { PracticeResult, NoteResult } from '../stores/practice-session.svelte';

  interface Props {
    result: PracticeResult;
    onRetry?: () => void;
    onClose?: () => void;
  }

  let {
    result,
    onRetry = undefined,
    onClose = undefined,
  }: Props = $props();

  // ── Derived values ──────────────────────────────────────────────────────────

  const grade = $derived.by(() => {
    if (result.accuracy >= 95) return { letter: 'S', label: 'Perfect!', color: '#ffd700' };
    if (result.accuracy >= 85) return { letter: 'A', label: 'Excellent', color: '#28a745' };
    if (result.accuracy >= 70) return { letter: 'B', label: 'Great', color: '#28a745' };
    if (result.accuracy >= 50) return { letter: 'C', label: 'Good', color: '#ce7e4f' };
    return { letter: 'D', label: 'Keep Practicing', color: '#dc3545' };
  });

  const totalTimeFormatted = $derived.by(() => {
    const seconds = Math.round(result.totalTimeMs / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  });

  // Group note results for the breakdown display
  const noteBreakdown = $derived(
    result.noteResults.map((nr: NoteResult) => ({
      ...nr,
      status: nr.correct ? 'correct' as const
        : nr.actualMidi === null ? 'missed' as const
        : 'wrong' as const,
    }))
  );

  // Deduplicate: only show the last result per note index (in case of retries)
  const uniqueNoteResults = $derived.by(() => {
    const map = new Map<number, typeof noteBreakdown[0]>();
    for (const nr of noteBreakdown) {
      map.set(nr.index, nr);
    }
    return Array.from(map.values()).sort((a, b) => a.index - b.index);
  });
</script>

<div class="practice-results-overlay" role="dialog" aria-label="Practice Results">
  <div class="practice-results-card">
    <!-- Header -->
    <div class="practice-results-header">
      <h2 class="practice-results-title">{result.songTitle}</h2>
      <p class="practice-results-subtitle">Practice Complete</p>
    </div>

    <!-- Grade + accuracy hero -->
    <div class="practice-results-hero">
      <div class="practice-results-grade" style="color: {grade.color};">
        {grade.letter}
      </div>
      <div class="practice-results-accuracy-big">
        {result.accuracy}%
      </div>
      <p class="practice-results-grade-label" style="color: {grade.color};">
        {grade.label}
      </p>
    </div>

    <!-- Stats row -->
    <div class="practice-results-stats">
      <div class="practice-results-stat">
        <span class="stat-value stat-correct">{result.correctNotes}</span>
        <span class="stat-label">Correct</span>
      </div>
      <div class="practice-results-stat">
        <span class="stat-value stat-wrong">{result.wrongNotes}</span>
        <span class="stat-label">Wrong</span>
      </div>
      <div class="practice-results-stat">
        <span class="stat-value stat-missed">{result.missedNotes}</span>
        <span class="stat-label">Missed</span>
      </div>
      <div class="practice-results-stat">
        <span class="stat-value">{result.longestStreak}</span>
        <span class="stat-label">Best Streak</span>
      </div>
      <div class="practice-results-stat">
        <span class="stat-value">{totalTimeFormatted}</span>
        <span class="stat-label">Time</span>
      </div>
      {#if result.averageCentsOff > 0}
        <div class="practice-results-stat">
          <span class="stat-value">{result.averageCentsOff}&#162;</span>
          <span class="stat-label">Avg. Deviation</span>
        </div>
      {/if}
    </div>

    <!-- Note-by-note breakdown -->
    <div class="practice-results-breakdown">
      <h3 class="breakdown-title">Note Breakdown</h3>
      <div class="breakdown-grid">
        {#each uniqueNoteResults as nr, i}
          <div class="breakdown-note breakdown-{nr.status}" title="{nr.expectedName}: {nr.status}">
            <span class="breakdown-index">{i + 1}</span>
            <span class="breakdown-name">{nr.expectedName}</span>
            {#if nr.status === 'correct'}
              <span class="breakdown-icon">&#x2713;</span>
            {:else if nr.status === 'wrong'}
              <span class="breakdown-icon">&#x2717;</span>
            {:else}
              <span class="breakdown-icon">&#x2014;</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Actions -->
    <div class="practice-results-actions">
      {#if onRetry}
        <button class="practice-btn practice-btn-start practice-btn-lg" onclick={onRetry}>
          &#x21BA; Try Again
        </button>
      {/if}
      {#if onClose}
        <button class="practice-btn practice-btn-reset practice-btn-lg" onclick={onClose}>
          Done
        </button>
      {/if}
    </div>
  </div>
</div>
