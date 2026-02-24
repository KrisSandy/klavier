<script lang="ts">
  import { NOTES, ALL_LETTERS, type Note } from './lib/notes.ts';
  import Staff from './lib/Staff.svelte';

  interface HistoryEntry {
    note: Note;
    selected: string;
    correct: boolean;
    timeMs: number;
  }

  let score = $state(0);
  let total = $state(0);
  let currentNote = $state<Note | null>(null);
  let choices = $state<string[]>([]);
  let selected = $state<string | null>(null);

  let history = $state<HistoryEntry[]>([]);
  let finished = $state(false);

  // Timer
  let questionStart = $state(Date.now());
  let now = $state(Date.now());
  let frozenMs = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | undefined = undefined;

  const elapsedMs = $derived(selected === null ? now - questionStart : frozenMs);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startTimer(): void {
    clearInterval(timerInterval);
    questionStart = Date.now();
    now = Date.now();
    timerInterval = setInterval(() => { now = Date.now(); }, 100);
  }

  function nextQuestion(): void {
    const pool = currentNote ? NOTES.filter(n => n.id !== currentNote!.id) : NOTES;
    currentNote = pool[Math.floor(Math.random() * pool.length)];

    const correct = currentNote.name;
    const distractors = shuffle(ALL_LETTERS.filter(l => l !== correct)).slice(0, 3);
    choices = shuffle([correct, ...distractors]);

    selected = null;
    startTimer();
  }

  function handleAnswer(letter: string): void {
    if (selected !== null) return;
    if (!currentNote) return;
    const timeMs = Date.now() - questionStart;
    clearInterval(timerInterval);
    frozenMs = timeMs;
    selected = letter;
    total += 1;
    const isCorrect = letter === currentNote.name;
    if (isCorrect) score += 1;
    history.push({ note: currentNote, selected: letter, correct: isCorrect, timeMs });
  }

  function finishQuiz(): void {
    clearInterval(timerInterval);
    finished = true;
  }

  function playAgain(): void {
    score = 0;
    total = 0;
    history = [];
    finished = false;
    nextQuestion();
  }

  function buttonClass(letter: string): string {
    if (selected === null) return 'btn-choice';
    if (!currentNote) return 'btn-choice';
    if (letter === currentNote.name) return 'btn-choice correct';
    if (letter === selected) return 'btn-choice wrong';
    return 'btn-choice dimmed';
  }

  // Summary derived values
  const bestEntry = $derived(
    history.length ? history.reduce((b, h) => h.timeMs < b.timeMs ? h : b) : null
  );
  const worstEntry = $derived(
    history.length ? history.reduce((w, h) => h.timeMs > w.timeMs ? h : w) : null
  );

  // Start the first question on load
  nextQuestion();
</script>

<header>
  <a class="site-brand" href="/">Klavier.life</a>
</header>

<main>
  <h1>Note Reading Quiz</h1>

  {#if currentNote && !finished}
    <p class="score">Score: {score} / {total}</p>

    <div class="card">
      <div class="staff-container">
        <Staff yPos={currentNote.yPos} />
      </div>

      <div class="prompt-row">
        <p class="prompt">What note is this?</p>
        <span class="timer">{(elapsedMs / 1000).toFixed(1)}s</span>
      </div>

      <div class="choices">
        {#each choices as letter}
          <button
            class={buttonClass(letter)}
            onclick={() => handleAnswer(letter)}
            disabled={selected !== null}
          >
            {letter}
          </button>
        {/each}
      </div>

      {#if selected !== null}
        <div class="feedback">
          {#if selected === currentNote.name}
            <p class="feedback-correct">Correct! &mdash; {(elapsedMs / 1000).toFixed(1)}s</p>
          {:else}
            <p class="feedback-wrong">Wrong — it was {currentNote.name} &mdash; {(elapsedMs / 1000).toFixed(1)}s</p>
          {/if}
          <button class="btn-next" onclick={nextQuestion}>Next</button>
        </div>
      {/if}
    </div>

    <div class="finish-row">
      <button class="btn-finish" onclick={finishQuiz}>Finish</button>
    </div>

  {:else if finished}
    <div class="summary">
      <h2 class="summary-title">Quiz Complete</h2>

      {#if total === 0}
        <p class="summary-empty">No questions answered.</p>
      {:else}
        <p class="summary-score">{score} / {total} correct &mdash; {Math.round(score / total * 100)}%</p>

        <div class="summary-stats">
          <div class="stat-box stat-correct">
            <span class="stat-num">{score}</span>
            <span class="stat-label">Correct</span>
          </div>
          <div class="stat-box stat-wrong">
            <span class="stat-num">{total - score}</span>
            <span class="stat-label">Wrong</span>
          </div>
        </div>

        {#if bestEntry && worstEntry}
          <div class="time-summary">
            <div class="time-row">
              <span class="time-label">Best time</span>
              <span class="time-val time-best">{(bestEntry.timeMs / 1000).toFixed(1)}s</span>
              <span class="time-ctx">{bestEntry.note.id} &mdash; {bestEntry.correct ? 'correct' : 'wrong'}</span>
            </div>
            <div class="time-row">
              <span class="time-label">Worst time</span>
              <span class="time-val time-worst">{(worstEntry.timeMs / 1000).toFixed(1)}s</span>
              <span class="time-ctx">{worstEntry.note.id} &mdash; {worstEntry.correct ? 'correct' : 'wrong'}</span>
            </div>
          </div>
        {/if}

        <div class="history-list">
          {#each history as entry, i}
            <div class="history-row {entry.correct ? 'hist-correct' : 'hist-wrong'}">
              <span class="hist-num">#{i + 1}</span>
              <span class="hist-note">{entry.note.id}</span>
              <span class="hist-sep">→</span>
              <span class="hist-answer">{entry.selected}</span>
              <span class="hist-mark">{entry.correct ? '✓' : '✗'}</span>
              <span class="hist-time">{(entry.timeMs / 1000).toFixed(1)}s</span>
            </div>
          {/each}
        </div>
      {/if}

      <button class="btn-next" onclick={playAgain}>Play Again</button>
    </div>
  {/if}
</main>

<footer>
  <p>Klavier.life &mdash; Practice reading music notes</p>
</footer>
