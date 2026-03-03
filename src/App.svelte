<script lang="ts">
  import { NOTES, ALL_LETTERS, type Note } from "./lib/notes";
  import Staff from "./lib/Staff.svelte";

  // ── Lesson navigation ───────────────────────────────────────────────────────
  let activeLesson = $state(1);
  let lesson2View = $state<"lesson" | "quiz">("lesson");
  let lesson1Expanded = $state(true);
  let lesson2Expanded = $state(true);

  // ── Quiz state ──────────────────────────────────────────────────────────────
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

  const elapsedMs = $derived(
    selected === null ? now - questionStart : frozenMs,
  );

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
    timerInterval = setInterval(() => {
      now = Date.now();
    }, 100);
  }

  function nextQuestion(): void {
    const pool = currentNote
      ? NOTES.filter((n) => n.id !== currentNote!.id)
      : NOTES;
    currentNote = pool[Math.floor(Math.random() * pool.length)];

    const correct = currentNote.name;
    const distractors = shuffle(ALL_LETTERS.filter((l) => l !== correct)).slice(
      0,
      3,
    );
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
    history.push({
      note: currentNote,
      selected: letter,
      correct: isCorrect,
      timeMs,
    });
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

  function startQuiz(): void {
    score = 0;
    total = 0;
    history = [];
    finished = false;
    lesson2View = "quiz";
    nextQuestion();
  }

  function buttonClass(letter: string): string {
    if (selected === null) return "btn-choice";
    if (!currentNote) return "btn-choice";
    if (letter === currentNote.name) return "btn-choice correct";
    if (letter === selected) return "btn-choice wrong";
    return "btn-choice dimmed";
  }

  // Summary derived values
  const bestEntry = $derived(
    history.length
      ? history.reduce((b, h) => (h.timeMs < b.timeMs ? h : b))
      : null,
  );
  const worstEntry = $derived(
    history.length
      ? history.reduce((w, h) => (h.timeMs > w.timeMs ? h : w))
      : null,
  );
</script>

<header>
  <a class="site-brand" href="/">Klavier.life</a>
</header>

<div class="page-body">
  <aside class="sidebar">
    <nav class="lesson-nav">
      <p class="nav-heading">Lessons</p>

      <button
        class="nav-lesson"
        onclick={() => (lesson1Expanded = !lesson1Expanded)}
      >
        <span class="nav-num">1</span>
        <span class="nav-label">Notes &amp; Hand Numbers</span>
        <span class="nav-chevron">{lesson1Expanded ? "▾" : "▸"}</span>
      </button>
      {#if lesson1Expanded}
        <button
          class="nav-sublesson {activeLesson === 1 ? 'active' : ''}"
          onclick={() => (activeLesson = 1)}
        >
          Lesson
        </button>
      {/if}

      <button
        class="nav-lesson"
        onclick={() => (lesson2Expanded = !lesson2Expanded)}
      >
        <span class="nav-num">2</span>
        <span class="nav-label">The Stave</span>
        <span class="nav-chevron">{lesson2Expanded ? "▾" : "▸"}</span>
      </button>
      {#if lesson2Expanded}
        <button
          class="nav-sublesson {activeLesson === 2 && lesson2View === 'lesson'
            ? 'active'
            : ''}"
          onclick={() => {
            activeLesson = 2;
            lesson2View = "lesson";
          }}
        >
          Lesson
        </button>
        <button
          class="nav-sublesson {activeLesson === 2 && lesson2View === 'quiz'
            ? 'active'
            : ''}"
          onclick={() => {
            if (lesson2View !== "quiz") startQuiz();
            activeLesson = 2;
          }}
        >
          Quiz
        </button>
      {/if}
    </nav>
  </aside>

  <main>
    {#if activeLesson === 1}
      <!-- ── LESSON 1: Notes & Hand Numbers ──────────────────────────────── -->
      <div class="lesson">
        <h1 class="lesson-title">Lesson 1: Notes &amp; Hand Numbers</h1>

        <section class="lesson-section">
          <h2 class="section-title">The Musical Alphabet</h2>
          <p class="section-text">
            Music uses just 7 letter names to describe every note:
            <strong>A, B, C, D, E, F, G</strong>. After G the sequence repeats
            from A — going higher in pitch each time.
          </p>
          <div class="note-pills">
            {#each ["A", "B", "C", "D", "E", "F", "G"] as n}
              <span class="note-pill">{n}</span>
            {/each}
            <span class="note-pill pill-repeat">A…</span>
          </div>
          <p class="section-text">
            On the piano these 7 notes span one <em>octave</em>. The white keys
            repeat this pattern from left (low pitch) to right (high pitch)
            across the entire keyboard.
          </p>
        </section>

        <section class="lesson-section">
          <h2 class="section-title">Finger Numbers</h2>
          <p class="section-text">
            Each finger is given a number from <strong>1</strong> (thumb) to
            <strong>5</strong> (pinky). Both hands use the same numbering. Sheet
            music uses these numbers as <em>fingering</em> hints to show which finger
            to use on each note.
          </p>
          <div class="hand-diagram">
            <div class="hand-card">
              <div class="hand-label">Left Hand</div>
              <div class="fingers">
                <div class="finger">
                  <span class="f-num">5</span><span class="f-name">Pinky</span>
                </div>
                <div class="finger">
                  <span class="f-num">4</span><span class="f-name">Ring</span>
                </div>
                <div class="finger">
                  <span class="f-num">3</span><span class="f-name">Middle</span>
                </div>
                <div class="finger">
                  <span class="f-num">2</span><span class="f-name">Index</span>
                </div>
                <div class="finger f-thumb">
                  <span class="f-num">1</span><span class="f-name">Thumb</span>
                </div>
              </div>
            </div>
            <div class="hand-card">
              <div class="hand-label">Right Hand</div>
              <div class="fingers">
                <div class="finger f-thumb">
                  <span class="f-num">1</span><span class="f-name">Thumb</span>
                </div>
                <div class="finger">
                  <span class="f-num">2</span><span class="f-name">Index</span>
                </div>
                <div class="finger">
                  <span class="f-num">3</span><span class="f-name">Middle</span>
                </div>
                <div class="finger">
                  <span class="f-num">4</span><span class="f-name">Ring</span>
                </div>
                <div class="finger">
                  <span class="f-num">5</span><span class="f-name">Pinky</span>
                </div>
              </div>
            </div>
          </div>
          <p class="section-text">
            The thumbs meet in the middle when both hands rest on the keys. Left
            hand: pinky on the left, thumb on the right. Right hand: thumb on
            the left, pinky on the right.
          </p>
        </section>

        <div class="lesson-next">
          <button
            class="btn-lesson-next"
            onclick={() => {
              activeLesson = 2;
              lesson2View = "lesson";
              lesson2Expanded = true;
            }}
          >
            Continue to Lesson 2 &rarr;
          </button>
        </div>
      </div>
    {:else}
      <!-- ── LESSON 2: The Stave with Treble Clef ────────────────────────── -->
      <div class="lesson">
        {#if lesson2View === "lesson"}
          <h1 class="lesson-title">Lesson 2: The Stave</h1>

          <section class="lesson-section">
            <h2 class="section-title">The Five-Line Stave</h2>
            <p class="section-text">
              Music is written on a <strong>stave</strong> (also called a staff)
              — five horizontal lines running left to right. Notes are placed
              <em>on</em>
              a line or in the <em>spaces</em> between lines. The higher a note appears
              on the stave, the higher its pitch.
            </p>
            <svg
              class="stave-svg"
              viewBox="0 0 500 145"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              style="max-width:500px;display:block;overflow:visible;"
            >
              <line
                x1="30"
                y1="40"
                x2="480"
                y2="40"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="60"
                x2="480"
                y2="60"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="80"
                x2="480"
                y2="80"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="100"
                x2="480"
                y2="100"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="120"
                x2="480"
                y2="120"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="40"
                x2="30"
                y2="120"
                stroke="#333"
                stroke-width="2"
              />
              <line
                x1="480"
                y1="40"
                x2="480"
                y2="120"
                stroke="#333"
                stroke-width="2"
              />
              <text
                x="20"
                y="44"
                font-size="11"
                font-family="sans-serif"
                fill="#aaa"
                text-anchor="end">5</text
              >
              <text
                x="20"
                y="64"
                font-size="11"
                font-family="sans-serif"
                fill="#aaa"
                text-anchor="end">4</text
              >
              <text
                x="20"
                y="84"
                font-size="11"
                font-family="sans-serif"
                fill="#aaa"
                text-anchor="end">3</text
              >
              <text
                x="20"
                y="104"
                font-size="11"
                font-family="sans-serif"
                fill="#aaa"
                text-anchor="end">2</text
              >
              <text
                x="20"
                y="124"
                font-size="11"
                font-family="sans-serif"
                fill="#aaa"
                text-anchor="end">1</text
              >
              <text
                x="255"
                y="135"
                font-size="11"
                font-family="sans-serif"
                fill="#999"
                text-anchor="middle"
                font-style="italic">5 lines, 4 spaces</text
              >
            </svg>
          </section>

          <section class="lesson-section">
            <h2 class="section-title">The Treble Clef</h2>
            <p class="section-text">
              The <strong>treble clef</strong> (𝄞) sits at the start of the
              stave and tells us which notes belong to which lines and spaces.
              The treble clef is used for higher-pitched notes — on the piano
              this is usually played by the
              <strong>right hand</strong>.
            </p>
            <p class="section-text">
              The curl of the treble clef wraps around <strong
                >line 2 from the bottom</strong
              >, marking it as <strong>G4</strong>. All other note positions
              follow from there.
            </p>
            <svg
              class="stave-svg"
              viewBox="0 0 500 180"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              style="max-width:500px;display:block;overflow:visible;"
            >
              <line
                x1="30"
                y1="40"
                x2="480"
                y2="40"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="60"
                x2="480"
                y2="60"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="80"
                x2="480"
                y2="80"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="100"
                x2="480"
                y2="100"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="120"
                x2="480"
                y2="120"
                stroke="#333"
                stroke-width="1.5"
              />
              <text
                x="18"
                y="155"
                font-size="170"
                font-family="serif"
                fill="#333"
                style="user-select:none">𝄞</text
              >
              <!-- G4 marker on line 2 (y=100) -->
              <ellipse
                cx="320"
                cy="100"
                rx="10"
                ry="7"
                fill="#7c6fcd"
                opacity="0.85"
                transform="rotate(-20,320,100)"
              />
              <line
                x1="329"
                y1="100"
                x2="329"
                y2="65"
                stroke="#7c6fcd"
                stroke-width="1.5"
              />
              <text
                x="345"
                y="104"
                font-size="14"
                font-family="sans-serif"
                fill="#7c6fcd"
                font-weight="bold">G4 — line 2</text
              >
            </svg>
          </section>

          <section class="lesson-section">
            <h2 class="section-title">Notes on the Stave</h2>
            <p class="section-text">
              In the treble clef, lines and spaces each represent a specific
              note. Two mnemonics help you remember them:
            </p>
            <svg
              class="stave-svg stave-labeled"
              viewBox="0 0 500 180"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              style="max-width:500px;display:block;overflow:visible;"
            >
              <!-- Staff lines (shorter to leave room for labels) -->
              <line
                x1="30"
                y1="40"
                x2="408"
                y2="40"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="60"
                x2="408"
                y2="60"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="80"
                x2="408"
                y2="80"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="100"
                x2="408"
                y2="100"
                stroke="#333"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="120"
                x2="408"
                y2="120"
                stroke="#333"
                stroke-width="1.5"
              />
              <!-- Treble clef -->
              <text
                x="18"
                y="155"
                font-size="170"
                font-family="serif"
                fill="#333"
                style="user-select:none">𝄞</text
              >
              <!-- Line note labels (bold) — F D B G E top to bottom -->
              <text
                x="430"
                y="44"
                font-size="14"
                font-family="sans-serif"
                fill="#1a1a2e"
                font-weight="bold">F</text
              >
              <text
                x="430"
                y="64"
                font-size="14"
                font-family="sans-serif"
                fill="#1a1a2e"
                font-weight="bold">D</text
              >
              <text
                x="430"
                y="84"
                font-size="14"
                font-family="sans-serif"
                fill="#1a1a2e"
                font-weight="bold">B</text
              >
              <text
                x="430"
                y="104"
                font-size="14"
                font-family="sans-serif"
                fill="#1a1a2e"
                font-weight="bold">G</text
              >
              <text
                x="430"
                y="124"
                font-size="14"
                font-family="sans-serif"
                fill="#1a1a2e"
                font-weight="bold">E</text
              >
              <!-- Space note labels (normal) — E C A F top to bottom -->
              <text
                x="416"
                y="54"
                font-size="13"
                font-family="sans-serif"
                fill="#555">E</text
              >
              <text
                x="416"
                y="74"
                font-size="13"
                font-family="sans-serif"
                fill="#555">C</text
              >
              <text
                x="416"
                y="94"
                font-size="13"
                font-family="sans-serif"
                fill="#555">A</text
              >
              <text
                x="416"
                y="114"
                font-size="13"
                font-family="sans-serif"
                fill="#555">F</text
              >
            </svg>
            <div class="mnemonic-row">
              <span class="mnemonic-item"
                ><strong>Lines</strong> (bottom→top):
                <em>Every Good Boy Does Fine</em> — E G B D F</span
              >
              <span class="mnemonic-item"
                ><strong>Spaces</strong> (bottom→top): <em>FACE</em> — F A C E</span
              >
            </div>
            <br />
            <p class="section-text">
              Notes can also appear on short <em>ledger lines</em> above or
              below the stave — for example <strong>Middle C (C4)</strong> sits on
              a ledger line just below line 1, and the quiz includes some of these.
            </p>
          </section>

          <div class="lesson-next">
            <button class="btn-lesson-next" onclick={startQuiz}>
              Start Quiz &rarr;
            </button>
          </div>
        {:else}
          <!-- ── LESSON 2 QUIZ SUBPAGE ──────────────────────────────────────── -->
          <nav class="quiz-breadcrumb">
            <button class="btn-back" onclick={() => (lesson2View = "lesson")}>
              &larr; Lesson 2
            </button>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">Note Reading Quiz</span>
          </nav>

          <h1 class="lesson-title">Note Reading Quiz</h1>
          <p class="section-text">
            A note will appear on the stave — choose its correct letter name.
            Try to answer as quickly as you can!
          </p>

          <div class="quiz-container">
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
                      <p class="feedback-correct">
                        Correct! &mdash; {(elapsedMs / 1000).toFixed(1)}s
                      </p>
                    {:else}
                      <p class="feedback-wrong">
                        Wrong — it was {currentNote.name} &mdash; {(
                          elapsedMs / 1000
                        ).toFixed(1)}s
                      </p>
                    {/if}
                    <button class="btn-next" onclick={nextQuestion}>Next</button
                    >
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
                  <p class="summary-score">
                    {score} / {total} correct &mdash; {Math.round(
                      (score / total) * 100,
                    )}%
                  </p>

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
                        <span class="time-val time-best"
                          >{(bestEntry.timeMs / 1000).toFixed(1)}s</span
                        >
                        <span class="time-ctx"
                          >{bestEntry.note.id} &mdash; {bestEntry.correct
                            ? "correct"
                            : "wrong"}</span
                        >
                      </div>
                      <div class="time-row">
                        <span class="time-label">Worst time</span>
                        <span class="time-val time-worst"
                          >{(worstEntry.timeMs / 1000).toFixed(1)}s</span
                        >
                        <span class="time-ctx"
                          >{worstEntry.note.id} &mdash; {worstEntry.correct
                            ? "correct"
                            : "wrong"}</span
                        >
                      </div>
                    </div>
                  {/if}

                  <div class="history-list">
                    {#each history as entry, i}
                      <div
                        class="history-row {entry.correct
                          ? 'hist-correct'
                          : 'hist-wrong'}"
                      >
                        <span class="hist-num">#{i + 1}</span>
                        <span class="hist-note">{entry.note.id}</span>
                        <span class="hist-sep">→</span>
                        <span class="hist-answer">{entry.selected}</span>
                        <span class="hist-mark"
                          >{entry.correct ? "✓" : "✗"}</span
                        >
                        <span class="hist-time"
                          >{(entry.timeMs / 1000).toFixed(1)}s</span
                        >
                      </div>
                    {/each}
                  </div>
                {/if}

                <button class="btn-next" onclick={playAgain}>Play Again</button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

<footer>
  <p>Klavier.life &mdash; Practice reading music notes</p>
</footer>
