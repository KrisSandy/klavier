<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface QuizQuestion {
    id: string;
    prompt: string;
    correctAnswer: string;
    choices: string[];
  }

  export interface HistoryEntry {
    question: QuizQuestion;
    selected: string;
    correct: boolean;
    timeMs: number;
  }

  let {
    questions,
    onComplete,
    children,
  }: {
    questions: QuizQuestion[];
    onComplete?: (score: number, total: number, history: HistoryEntry[]) => void;
    children?: Snippet<[{ currentQuestion: QuizQuestion; questionIndex: number }]>;
  } = $props();

  let questionIndex = $state(0);
  let selected = $state<string | null>(null);
  let history = $state<HistoryEntry[]>([]);
  let finished = $state(false);
  let questionStart = $state(Date.now());
  let now = $state(Date.now());
  let frozenMs = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | undefined;

  const currentQuestion = $derived(questions[questionIndex]);
  const score = $derived(history.filter(h => h.correct).length);
  const elapsedMs = $derived(selected === null ? now - questionStart : frozenMs);
  const elapsedSec = $derived((elapsedMs / 1000).toFixed(1));
  const avgTimeMs = $derived(history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.timeMs, 0) / history.length) : 0);
  const bestTimeMs = $derived(history.length > 0 ? Math.min(...history.map(h => h.timeMs)) : 0);
  const worstTimeMs = $derived(history.length > 0 ? Math.max(...history.map(h => h.timeMs)) : 0);

  function startTimer() {
    clearInterval(timerInterval);
    questionStart = Date.now();
    now = Date.now();
    timerInterval = setInterval(() => {
      now = Date.now();
    }, 50);
  }

  function handleAnswer(letter: string) {
    if (selected !== null) return;
    const timeMs = Date.now() - questionStart;
    clearInterval(timerInterval);
    frozenMs = timeMs;
    selected = letter;
    history = [
      ...history,
      {
        question: currentQuestion,
        selected: letter,
        correct: letter === currentQuestion.correctAnswer,
        timeMs,
      },
    ];
  }

  function nextQuestion() {
    if (questionIndex + 1 >= questions.length) {
      finished = true;
      clearInterval(timerInterval);
      onComplete?.(score, questions.length, history);
      return;
    }
    questionIndex += 1;
    selected = null;
    startTimer();
  }

  function restart() {
    questionIndex = 0;
    selected = null;
    history = [];
    finished = false;
    clearInterval(timerInterval);
    startTimer();
  }

  function buttonClass(choice: string): string {
    if (selected === null) return 'default';
    if (choice === currentQuestion.correctAnswer) return 'correct';
    if (choice === selected) return 'wrong';
    return 'dimmed';
  }

  function getButtonStyle(state: string): string {
    const base = 'border-2 rounded-lg p-3 text-base font-medium cursor-pointer transition-all duration-150 flex-1 min-h-16';
    if (state === 'default') {
      return `${base} bg-white border-gray-300 text-gray-800 hover:border-purple hover:shadow-sm`;
    }
    if (state === 'correct') {
      return `${base} bg-correct-bg border-correct text-green-800`;
    }
    if (state === 'wrong') {
      return `${base} bg-wrong-bg border-wrong text-red-800`;
    }
    // dimmed
    return `${base} bg-white border-gray-300 text-gray-800 opacity-40`;
  }

  $effect(() => {
    return () => clearInterval(timerInterval);
  });
</script>

{#if !finished}
  <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Progress indicator -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <span style="font-size: 0.875rem; color: #666;">
        Question {questionIndex + 1} of {questions.length}
      </span>
      <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; margin: 0 16px; overflow: hidden;">
        <div
          style="height: 100%; background: #ce7e4f; width: {((questionIndex + 1) / questions.length) * 100}%; transition: width 0.3s ease;"
        ></div>
      </div>
    </div>

    <!-- Timer -->
    <div style="text-align: right; font-family: monospace; font-size: 1rem; color: #ce7e4f; margin-bottom: 16px; font-weight: 600;">
      {elapsedSec}s
    </div>

    <!-- Question prompt (custom content) -->
    {#if children}
      {@render children({ currentQuestion, questionIndex })}
    {:else}
      <div style="text-align: center; font-size: 1.125rem; margin-bottom: 32px; color: #333;">
        {currentQuestion.prompt}
      </div>
    {/if}

    <!-- Answer buttons (2x2 grid) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      {#each currentQuestion.choices as choice}
        <button
          class={getButtonStyle(buttonClass(choice))}
          onclick={() => handleAnswer(choice)}
        >
          {choice}
        </button>
      {/each}
    </div>

    <!-- Next button -->
    {#if selected !== null}
      <div style="display: flex; justify-content: center;">
        <button
          onclick={nextQuestion}
          class="bg-navy text-white px-6 py-3 rounded-lg border-none text-base font-semibold cursor-pointer transition-all hover:opacity-90"
        >
          Next
        </button>
      </div>
    {/if}
  </div>
{:else}
  <!-- Summary card -->
  <div style="width: 100%; max-width: 500px; margin: 0 auto; padding: 40px 24px;">
    <div
      style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 32px; text-align: center;"
    >
      <h2 style="font-size: 1.875rem; font-weight: 700; color: #3d3929; margin-bottom: 24px;">
        Quiz Complete!
      </h2>

      <div style="margin-bottom: 32px;">
        <div style="font-size: 3rem; font-weight: 700; color: #28a745; margin-bottom: 8px;">
          {score}/{questions.length}
        </div>
        <div style="font-size: 1rem; color: #666;">
          {Math.round((score / questions.length) * 100)}% Correct
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 32px; padding: 16px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
        <div>
          <div style="font-size: 0.75rem; color: #999; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
            Avg Time
          </div>
          <div style="font-size: 1.25rem; font-weight: 600; color: #3d3929;">
            {(avgTimeMs / 1000).toFixed(1)}s
          </div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: #999; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
            Best
          </div>
          <div style="font-size: 1.25rem; font-weight: 600; color: #28a745;">
            {(bestTimeMs / 1000).toFixed(1)}s
          </div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: #999; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
            Worst
          </div>
          <div style="font-size: 1.25rem; font-weight: 600; color: #dc3545;">
            {(worstTimeMs / 1000).toFixed(1)}s
          </div>
        </div>
      </div>

      <button
        onclick={restart}
        style="background: #ce7e4f; color: white; padding: 14px 32px; border-radius: 8px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.15s; width: 100%;"
      >
        Try Again
      </button>
    </div>
  </div>
{/if}
