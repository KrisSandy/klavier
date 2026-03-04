<script lang="ts">
  import { NOTES, ALL_LETTERS, type Note } from "./lib/notes";
  import Staff from "./lib/Staff.svelte";
  import SongStaff from "./lib/SongStaff.svelte";

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

  // ── Songs ────────────────────────────────────────────────────────────────────
  let activeSong = $state<string | null>(null);

  const kushiTune: string[][] = [
    ["F#4", "C#5", "B4", "C#5", "B4", "C#5", "E5", "C#5"],
    ["F#4", "C#5", "B4", "C#5", "E5", "C#5"],
    ["B4", "A#4", "G#4", "A#4", "G#4", "A#4", "C#5", "B4", "A#4", "G#4"],
    ["A#4", "G#4", "A#4", "C#5", "B4"],
    ["E4", "F#4", "A4", "E4", "F#4", "A4", "F#4"],
    ["E4", "C#4"],
    ["E4", "F#4", "A4", "E4", "F#4", "A4", "F#4"],
    ["C#5", "D5", "C#5", "A4", "F#4", "F4"],
    ["C#5", "D5", "C#5", "A4", "F4", "F#4"],
    ["A#4", "G#4", "A#4", "C#5", "B4", "A#4", "G#4"],
    ["A#4", "G#4", "A#4", "C#5", "B4"],
    ["E4", "F#4", "A4", "E4", "F#4", "A4", "F#4"],
    ["E4", "C#4", "E4", "F#4", "A4", "E4", "F#4", "A4", "F#4"],
  ];
</script>

<header
  class="sticky top-0 z-100 bg-[#faf9f5] border-b border-[#dad9d4] px-8 py-[0.85rem] flex items-center shrink-0"
>
  <a
    class="text-[1.2rem] font-extrabold text-navy no-underline tracking-[-.02em] hover:text-purple transition-colors"
    href="/">Klavier.life</a
  >
</header>

<div class="flex-1 flex min-h-0 max-sm:flex-col">
  <aside
    class="sticky top-(--header-height) w-60 h-[calc(100vh-var(--header-height))] overflow-y-auto bg-[#faf9f5] border-r border-[#dad9d4] shrink-0 flex flex-col max-sm:static max-sm:w-full max-sm:h-auto max-sm:border-r-0 max-sm:border-b"
  >
    <nav
      class="py-6 flex flex-col max-sm:flex-row max-sm:p-0 max-sm:overflow-x-auto"
    >
      <p
        class="text-[0.7rem] font-bold uppercase tracking-widest text-[#b4b2a7] px-5 mb-2 max-sm:hidden"
      >
        Lessons
      </p>

      <button
        class="nav-lesson"
        onclick={() => (lesson1Expanded = !lesson1Expanded)}
      >
        <span
          class="inline-flex items-center justify-center w-[1.4rem] h-[1.4rem] bg-[#e9e6dc] text-[#9a9287] rounded-full text-[0.75rem] font-bold shrink-0"
          >1</span
        >
        <span class="flex-1">Notes & Hand Numbers</span>
        <span class="text-[0.75rem] text-[#b4b2a7] shrink-0 leading-none"
          >{lesson1Expanded ? "▾" : "▸"}</span
        >
      </button>
      {#if lesson1Expanded}
        <button
          class="nav-sublesson {activeLesson === 1 ? 'active' : ''}"
          onclick={() => {
            activeLesson = 1;
            activeSong = null;
          }}
        >
          Lesson
        </button>
      {/if}

      <button
        class="nav-lesson"
        onclick={() => (lesson2Expanded = !lesson2Expanded)}
      >
        <span
          class="inline-flex items-center justify-center w-[1.4rem] h-[1.4rem] bg-[#e9e6dc] text-[#9a9287] rounded-full text-[0.75rem] font-bold shrink-0"
          >2</span
        >
        <span class="flex-1">The Stave</span>
        <span class="text-[0.75rem] text-[#b4b2a7] shrink-0 leading-none"
          >{lesson2Expanded ? "▾" : "▸"}</span
        >
      </button>
      {#if lesson2Expanded}
        <button
          class="nav-sublesson {activeLesson === 2 && lesson2View === 'lesson'
            ? 'active'
            : ''}"
          onclick={() => {
            activeLesson = 2;
            lesson2View = "lesson";
            activeSong = null;
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
            activeSong = null;
          }}
        >
          Quiz
        </button>
      {/if}

      <div class="border-t border-[#dad9d4] my-4 max-sm:hidden"></div>
      <p
        class="text-[0.7rem] font-bold uppercase tracking-widest text-[#b4b2a7] px-5 mb-2 max-sm:hidden"
      >
        Songs
      </p>

      <button
        class="nav-lesson {activeSong === 'kushi' ? 'active' : ''}"
        onclick={() => {
          activeSong = "kushi";
        }}
      >
        <span
          class="inline-flex items-center justify-center w-[1.4rem] h-[1.4rem] bg-[#e9e6dc] text-[#9a9287] rounded-full text-[0.75rem] font-bold shrink-0"
          >♪</span
        >
        <span class="flex-1">Kushi</span>
      </button>
    </nav>
  </aside>

  <main
    class="flex-1 py-8 px-6 overflow-y-auto min-w-0 max-sm:py-5 max-sm:px-4"
  >
    {#if activeSong === "kushi"}
      <!-- ── SONG: Kushi ───────────────────────────────────────────────────── -->
      <div class="max-w-175">
        <h1 class="text-[1.75rem] font-bold text-navy mb-1">Kushi</h1>
        <p class="text-[#888] text-[0.9rem] mb-8">Treble clef · Key of F♯ minor</p>

        <section class="mb-10">
          <h2
            class="text-[1.1rem] font-bold text-navy mb-4 pb-2 border-b-2 border-[#dad9d4]"
          >
            Tune
          </h2>
          <div class="flex flex-col gap-6">
            {#each kushiTune as line, i}
              <div>
                <p class="text-[0.65rem] text-[#b4b2a7] mb-1">Line {i + 1}</p>
                <SongStaff notes={line} />
              </div>
            {/each}
          </div>
        </section>
      </div>
    {:else if activeLesson === 1}
      <!-- ── LESSON 1: Notes & Hand Numbers ──────────────────────────────── -->
      <div class="max-w-175">
        <h1 class="text-[1.75rem] font-bold text-navy mb-8">
          Lesson 1: Notes & Hand Numbers
        </h1>

        <section class="mb-10">
          <h2
            class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]"
          >
            The Musical Alphabet
          </h2>
          <p class="text-[#444] leading-[1.7] mb-3 text-[1.075rem]">
            Music uses just 7 letter names to describe every note:
            <strong>A, B, C, D, E, F, G</strong>. After G the sequence repeats
            from A — going higher in pitch each time.
          </p>
          <div class="flex gap-2 flex-wrap my-4 items-center">
            {#each ["A", "B", "C", "D", "E", "F", "G"] as n}
              <span
                class="flex items-center justify-center w-10 h-10 bg-navy text-white rounded-full text-[1.1rem] font-bold"
                >{n}</span
              >
            {/each}
            <span
              class="flex items-center justify-center w-10 h-10 bg-purple text-white rounded-full text-[0.85rem] font-bold italic"
              >A…</span
            >
          </div>
          <p class="text-[#444] leading-[1.7] text-[1.075rem]">
            On the piano these 7 notes span one <em>octave</em>. The white keys
            repeat this pattern from left (low pitch) to right (high pitch)
            across the entire keyboard.
          </p>
        </section>

        <section class="mb-10">
          <h2
            class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]"
          >
            Finger Numbers
          </h2>
          <p class="text-[#444] leading-[1.7] mb-3 text-[1.075rem]">
            Each finger is given a number from <strong>1</strong> (thumb) to
            <strong>5</strong> (pinky). Both hands use the same numbering. Sheet
            music uses these numbers as <em>fingering</em> hints to show which finger
            to use on each note.
          </p>
          <div class="flex gap-5 flex-wrap my-4">
            <div
              class="bg-white border border-[#dad9d4] rounded-xl p-5 flex-1 min-w-45"
            >
              <div
                class="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-purple mb-[0.85rem] text-center"
              >
                Left Hand
              </div>
              <div class="flex gap-[0.35rem] justify-center">
                {#each [["5", "Pinky"], ["4", "Ring"], ["3", "Middle"], ["2", "Index"]] as [num, name]}
                  <div
                    class="flex flex-col items-center gap-[0.2rem] py-2 px-[0.3rem] bg-[#f0ece4] rounded-lg min-w-10"
                  >
                    <span class="text-[1.2rem] font-extrabold text-navy"
                      >{num}</span
                    >
                    <span
                      class="text-[0.6rem] text-[#888] uppercase tracking-[0.03em] text-center"
                      >{name}</span
                    >
                  </div>
                {/each}
                <div
                  class="flex flex-col items-center gap-[0.2rem] py-2 px-[0.3rem] bg-[#f5e9de] border-2 border-purple rounded-lg min-w-10"
                >
                  <span class="text-[1.2rem] font-extrabold text-navy">1</span>
                  <span
                    class="text-[0.6rem] text-[#888] uppercase tracking-[0.03em] text-center"
                    >Thumb</span
                  >
                </div>
              </div>
            </div>
            <div
              class="bg-white border border-[#dad9d4] rounded-xl p-5 flex-1 min-w-45"
            >
              <div
                class="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-purple mb-[0.85rem] text-center"
              >
                Right Hand
              </div>
              <div class="flex gap-[0.35rem] justify-center">
                <div
                  class="flex flex-col items-center gap-[0.2rem] py-2 px-[0.3rem] bg-[#f5e9de] border-2 border-purple rounded-lg min-w-10"
                >
                  <span class="text-[1.2rem] font-extrabold text-navy">1</span>
                  <span
                    class="text-[0.6rem] text-[#888] uppercase tracking-[0.03em] text-center"
                    >Thumb</span
                  >
                </div>
                {#each [["2", "Index"], ["3", "Middle"], ["4", "Ring"], ["5", "Pinky"]] as [num, name]}
                  <div
                    class="flex flex-col items-center gap-[0.2rem] py-2 px-[0.3rem] bg-[#f0ece4] rounded-lg min-w-10"
                  >
                    <span class="text-[1.2rem] font-extrabold text-navy"
                      >{num}</span
                    >
                    <span
                      class="text-[0.6rem] text-[#888] uppercase tracking-[0.03em] text-center"
                      >{name}</span
                    >
                  </div>
                {/each}
              </div>
            </div>
          </div>
          <p class="text-[#444] leading-[1.7] text-[1.075rem]">
            The thumbs meet in the middle when both hands rest on the keys. Left
            hand: pinky on the left, thumb on the right. Right hand: thumb on
            the left, pinky on the right.
          </p>
        </section>

        <div class="mt-8 pt-6 border-t border-[#dad9d4]">
          <button
            class="py-[0.65rem] px-8 text-base font-semibold bg-navy text-white border-none rounded-lg cursor-pointer transition-colors hover:bg-purple"
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
      <div class="max-w-175">
        {#if lesson2View === "lesson"}
          <h1 class="text-[1.75rem] font-bold text-navy mb-8">
            Lesson 2: The Stave
          </h1>

          <section class="mb-10">
            <h2
              class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]"
            >
              The Five-Line Stave
            </h2>
            <p class="text-[#444] leading-[1.7] mb-3 text-[1.075rem]">
              Music is written on a <strong>stave</strong> (also called a staff)
              — five horizontal lines running left to right. Notes are placed
              <em>on</em>
              a line or in the <em>spaces</em> between lines. The higher a note appears
              on the stave, the higher its pitch.
            </p>
            <svg
              class="my-4"
              viewBox="0 0 500 145"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              style="max-width:500px;display:block;"
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

          <section class="mb-10">
            <h2
              class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]"
            >
              The Treble Clef
            </h2>
            <p class="text-[#444] leading-[1.7] mb-3 text-[1.075rem]">
              The <strong>treble clef</strong> (𝄞) sits at the start of the
              stave and tells us which notes belong to which lines and spaces.
              The treble clef is used for higher-pitched notes — on the piano
              this is usually played by the
              <strong>right hand</strong>.
            </p>
            <p class="text-[#444] leading-[1.7] mb-3 text-[1.075rem]">
              The curl of the treble clef wraps around <strong
                >line 2 from the bottom</strong
              >, marking it as <strong>G4</strong>. All other note positions
              follow from there.
            </p>
            <svg
              class="my-4"
              viewBox="0 -50 500 230"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              style="max-width:500px;display:block;"
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
                fill="#ce7e4f"
                opacity="0.85"
                transform="rotate(-20,320,100)"
              />
              <line
                x1="329"
                y1="100"
                x2="329"
                y2="65"
                stroke="#ce7e4f"
                stroke-width="1.5"
              />
              <text
                x="345"
                y="104"
                font-size="14"
                font-family="sans-serif"
                fill="#ce7e4f"
                font-weight="bold">G4 — line 2</text
              >
            </svg>
          </section>

          <section class="mb-10">
            <h2
              class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]"
            >
              Notes on the Stave
            </h2>
            <p class="text-[#444] leading-[1.7] mb-3 text-[1.075rem]">
              In the treble clef, lines and spaces each represent a specific
              note. Two mnemonics help you remember them:
            </p>
            <svg
              class="my-4"
              viewBox="0 -50 500 230"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              style="max-width:500px;display:block;"
            >
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
              <text
                x="18"
                y="155"
                font-size="170"
                font-family="serif"
                fill="#333"
                style="user-select:none">𝄞</text
              >
              <text
                x="430"
                y="44"
                font-size="14"
                font-family="sans-serif"
                fill="#3d3929"
                font-weight="bold">F</text
              >
              <text
                x="430"
                y="64"
                font-size="14"
                font-family="sans-serif"
                fill="#3d3929"
                font-weight="bold">D</text
              >
              <text
                x="430"
                y="84"
                font-size="14"
                font-family="sans-serif"
                fill="#3d3929"
                font-weight="bold">B</text
              >
              <text
                x="430"
                y="104"
                font-size="14"
                font-family="sans-serif"
                fill="#3d3929"
                font-weight="bold">G</text
              >
              <text
                x="430"
                y="124"
                font-size="14"
                font-family="sans-serif"
                fill="#3d3929"
                font-weight="bold">E</text
              >
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
            <div class="flex flex-col gap-[0.3rem] mt-2">
              <span class="text-[0.9rem] text-[#555]"
                ><strong>Lines</strong> (bottom→top):
                <em>Every Good Boy Does Fine</em> — E G B D F</span
              >
              <span class="text-[0.9rem] text-[#555]"
                ><strong>Spaces</strong> (bottom→top): <em>FACE</em> — F A C E</span
              >
            </div>
            <br />
            <p class="text-[#444] leading-[1.7] text-[1.075rem]">
              Notes can also appear on short <em>ledger lines</em> above or
              below the stave — for example <strong>Middle C (C4)</strong> sits on
              a ledger line just below line 1, and the quiz includes some of these.
            </p>
          </section>

          <div class="mt-8 pt-6 border-t border-[#dad9d4]">
            <button
              class="py-[0.65rem] px-8 text-base font-semibold bg-navy text-white border-none rounded-lg cursor-pointer transition-colors hover:bg-purple"
              onclick={startQuiz}
            >
              Start Quiz &rarr;
            </button>
          </div>
        {:else}
          <!-- ── LESSON 2 QUIZ SUBPAGE ──────────────────────────────────────── -->
          <nav class="flex items-center gap-2 mb-6">
            <button
              class="bg-transparent border-none p-0 text-[0.9rem] text-purple cursor-pointer font-semibold transition-colors hover:text-[#b86d42]"
              onclick={() => (lesson2View = "lesson")}
            >
              &larr; Lesson 2
            </button>
            <span class="text-[#ccc] text-[0.9rem]">/</span>
            <span class="text-[0.9rem] text-[#888]">Note Reading Quiz</span>
          </nav>

          <h1 class="text-[1.75rem] font-bold text-navy mb-8">
            Note Reading Quiz
          </h1>
          <p class="text-[#444] leading-[1.7] mb-6 text-[1.075rem]">
            A note will appear on the stave — choose its correct letter name.
            Try to answer as quickly as you can!
          </p>

          <div class="max-w-140">
            {#if currentNote && !finished}
              <p
                class="text-center text-[1.1rem] text-[#555] mb-6 font-semibold"
              >
                Score: {score} / {total}
              </p>

              <div
                class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-4 sm:p-8 flex flex-col gap-5"
              >
                <div class="py-2">
                  <Staff yPos={currentNote.yPos} />
                </div>

                <div class="flex items-center justify-between">
                  <p class="text-base text-[#666]">What note is this?</p>
                  <span
                    class="text-base font-bold tabular-nums text-purple min-w-14 text-right"
                    >{(elapsedMs / 1000).toFixed(1)}s</span
                  >
                </div>

                <div class="grid grid-cols-2 gap-3">
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
                  <div class="flex flex-col items-center gap-3">
                    {#if selected === currentNote.name}
                      <p class="text-[1.1rem] font-bold text-correct">
                        Correct! &mdash; {(elapsedMs / 1000).toFixed(1)}s
                      </p>
                    {:else}
                      <p class="text-[1.1rem] font-bold text-wrong">
                        Wrong — it was {currentNote.name} &mdash; {(
                          elapsedMs / 1000
                        ).toFixed(1)}s
                      </p>
                    {/if}
                    <button
                      class="py-[0.65rem] px-10 text-base font-semibold bg-navy text-white border-none rounded-lg cursor-pointer transition-colors hover:bg-purple"
                      onclick={nextQuestion}>Next</button
                    >
                  </div>
                {/if}
              </div>

              <div class="flex justify-center mt-4">
                <button
                  class="py-2 px-8 text-[0.9rem] font-semibold bg-transparent text-wrong border-2 border-wrong rounded-lg cursor-pointer transition-[background,color] hover:bg-wrong hover:text-white"
                  onclick={finishQuiz}>Finish</button
                >
              </div>
            {:else if finished}
              <div
                class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-4 sm:p-8 flex flex-col items-center gap-6"
              >
                <h2 class="text-2xl font-bold text-navy">Quiz Complete</h2>

                {#if total === 0}
                  <p class="text-[#888] text-base">No questions answered.</p>
                {:else}
                  <p class="text-[1.2rem] font-semibold text-navy">
                    {score} / {total} correct &mdash; {Math.round(
                      (score / total) * 100,
                    )}%
                  </p>

                  <div class="flex gap-6">
                    <div
                      class="flex flex-col items-center gap-1 py-4 px-5 sm:px-8 rounded-xl border-2 bg-correct-bg border-correct text-correct-text"
                    >
                      <span class="text-[2.5rem] font-extrabold leading-none"
                        >{score}</span
                      >
                      <span
                        class="text-[0.85rem] font-semibold uppercase tracking-[0.05em]"
                        >Correct</span
                      >
                    </div>
                    <div
                      class="flex flex-col items-center gap-1 py-4 px-5 sm:px-8 rounded-xl border-2 bg-wrong-bg border-wrong text-wrong-text"
                    >
                      <span class="text-[2.5rem] font-extrabold leading-none"
                        >{total - score}</span
                      >
                      <span
                        class="text-[0.85rem] font-semibold uppercase tracking-[0.05em]"
                        >Wrong</span
                      >
                    </div>
                  </div>

                  {#if bestEntry && worstEntry}
                    <div
                      class="w-full flex flex-col gap-2 bg-[#f0ece4] rounded-xl p-4"
                    >
                      <div class="flex items-center gap-3">
                        <span class="text-[0.85rem] text-[#666] w-24 shrink-0"
                          >Best time</span
                        >
                        <span
                          class="text-base font-bold tabular-nums min-w-12 text-correct"
                          >{(bestEntry.timeMs / 1000).toFixed(1)}s</span
                        >
                        <span class="text-[0.85rem] text-[#555]"
                          >{bestEntry.note.id} &mdash; {bestEntry.correct
                            ? "correct"
                            : "wrong"}</span
                        >
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-[0.85rem] text-[#666] w-24 shrink-0"
                          >Worst time</span
                        >
                        <span
                          class="text-base font-bold tabular-nums min-w-12 text-wrong"
                          >{(worstEntry.timeMs / 1000).toFixed(1)}s</span
                        >
                        <span class="text-[0.85rem] text-[#555]"
                          >{worstEntry.note.id} &mdash; {worstEntry.correct
                            ? "correct"
                            : "wrong"}</span
                        >
                      </div>
                    </div>
                  {/if}

                  <div
                    class="w-full flex flex-col gap-[0.3rem] max-h-64 overflow-y-auto"
                  >
                    {#each history as entry, i}
                      <div
                        class="grid grid-cols-[2.5rem_3rem_1.2rem_2rem_1.5rem_auto] items-center gap-[0.4rem] py-[0.4rem] px-3 rounded-md text-[0.9rem] {entry.correct
                          ? 'bg-correct-bg text-correct-text'
                          : 'bg-wrong-bg text-wrong-text'}"
                      >
                        <span class="text-[0.75rem] opacity-70">#{i + 1}</span>
                        <span class="font-bold">{entry.note.id}</span>
                        <span class="opacity-50">→</span>
                        <span class="font-bold">{entry.selected}</span>
                        <span class="font-bold"
                          >{entry.correct ? "✓" : "✗"}</span
                        >
                        <span
                          class="text-right tabular-nums text-[0.85rem] ml-auto"
                          >{(entry.timeMs / 1000).toFixed(1)}s</span
                        >
                      </div>
                    {/each}
                  </div>
                {/if}

                <button
                  class="py-[0.65rem] px-10 text-base font-semibold bg-navy text-white border-none rounded-lg cursor-pointer transition-colors hover:bg-purple"
                  onclick={playAgain}>Play Again</button
                >
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

<footer
  class="bg-[#faf9f5] border-t border-[#dad9d4] px-8 py-[0.85rem] text-center text-[0.85rem] text-[#9a9287] shrink-0"
>
  <p>Klavier.life &mdash; Practice reading music notes</p>
</footer>
