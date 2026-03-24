<script lang="ts">
  // ── Types ──────────────────────────────────────────────────────────────────
  interface Props {
    /** The note name currently being detected/played, e.g. "C4" */
    currentNote?: string | null;
    /** Expected note name, e.g. "E4" */
    expectedNote?: string | null;
    /** Cents deviation from perfect pitch (-50 to +50), mic only */
    centsOff?: number | null;
    /** Whether the last note was correct */
    lastResult?: 'correct' | 'wrong' | 'missed' | null;
    /** Number of correct notes so far */
    correctCount?: number;
    /** Total notes attempted so far */
    totalCount?: number;
    /** Current consecutive correct streak */
    streak?: number;
    /** Input source for showing relevant info */
    inputSource?: 'virtual' | 'mic' | 'midi';
  }

  let {
    currentNote = null,
    expectedNote = null,
    centsOff = null,
    lastResult = null,
    correctCount = 0,
    totalCount = 0,
    streak = 0,
    inputSource = 'virtual',
  }: Props = $props();

  // ── Derived values ──────────────────────────────────────────────────────────

  const accuracy = $derived(totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0);

  const tuningLabel = $derived.by(() => {
    if (centsOff === null || centsOff === undefined) return null;
    const abs = Math.abs(centsOff);
    if (abs <= 5) return 'Perfect!';
    if (abs <= 15) return centsOff > 0 ? 'Slightly sharp' : 'Slightly flat';
    if (abs <= 30) return centsOff > 0 ? 'Sharp' : 'Flat';
    return centsOff > 0 ? 'Very sharp' : 'Very flat';
  });

  // Tuning meter: map centsOff to a 0–100 scale where 50 = center/perfect
  const tuningPosition = $derived.by(() => {
    if (centsOff === null || centsOff === undefined) return 50;
    return Math.max(0, Math.min(100, 50 + centsOff));
  });

  // Flash class for result feedback
  const resultFlashClass = $derived.by(() => {
    if (!lastResult) return '';
    if (lastResult === 'correct') return 'feedback-flash-correct';
    if (lastResult === 'wrong') return 'feedback-flash-wrong';
    return '';
  });

  // Streak milestone
  const streakMilestone = $derived.by(() => {
    if (streak >= 20) return 'fire';
    if (streak >= 10) return 'hot';
    if (streak >= 5) return 'warm';
    return null;
  });
</script>

<div
  class="feedback-strip {resultFlashClass}"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <!-- Left: Current note display -->
  <div class="feedback-note-display">
    {#if currentNote}
      <span class="feedback-note-name">{currentNote}</span>
      {#if expectedNote && currentNote !== expectedNote}
        <span class="feedback-expected">Expected: {expectedNote}</span>
      {/if}
    {:else if expectedNote}
      <span class="feedback-note-waiting">Play: {expectedNote}</span>
    {:else}
      <span class="feedback-note-idle">Ready</span>
    {/if}
  </div>

  <!-- Center: Tuning meter (mic only) -->
  {#if inputSource === 'mic' && centsOff !== null}
    <div class="feedback-tuning">
      <div class="tuning-meter">
        <div class="tuning-meter-track">
          <div class="tuning-meter-center"></div>
          <div
            class="tuning-meter-needle"
            style="left: {tuningPosition}%;"
          ></div>
        </div>
        <div class="tuning-labels">
          <span>Flat</span>
          <span>{tuningLabel}</span>
          <span>Sharp</span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Right: Score + streak -->
  <div class="feedback-score">
    {#if totalCount > 0}
      <div class="feedback-accuracy">
        <span class="feedback-accuracy-number">{accuracy}%</span>
        <span class="feedback-accuracy-detail">{correctCount}/{totalCount}</span>
      </div>
    {:else}
      <div class="feedback-accuracy">
        <span class="feedback-accuracy-detail">No notes yet</span>
      </div>
    {/if}

    {#if streak >= 5}
      <div class="feedback-streak {streakMilestone ? 'streak-' + streakMilestone : ''}">
        <span class="streak-count">{streak}</span>
        <span class="streak-label">streak</span>
        {#if streakMilestone === 'fire'}
          <span class="streak-icon" aria-hidden="true">&#x1F525;</span>
        {:else if streakMilestone === 'hot'}
          <span class="streak-icon" aria-hidden="true">&#x2B50;</span>
        {:else}
          <span class="streak-icon" aria-hidden="true">&#x26A1;</span>
        {/if}
      </div>
    {/if}
  </div>
</div>
