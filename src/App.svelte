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
    history = [...history, {
      note: currentNote,
      selected: letter,
      correct: isCorrect,
      timeMs,
    }];
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
  class="sticky top-0 z-[100] bg-[#faf9f5] border-b border-[#dad9d4] px-8 py-[0.85rem] flex items-center shrink-0"
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
              viewBox="0 -55 500 210"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              style="max-width:500px;display:block;"
            >
              <line x1="30" y1="40" x2="480" y2="40" stroke="#333" stroke-width="1.5" />
              <line x1="30" y1="60" x2="480" y2="60" stroke="#333" stroke-width="1.5" />
              <line x1="30" y1="80" x2="480" y2="80" stroke="#333" stroke-width="1.5" />
              <line x1="30" y1="100" x2="480" y2="100" stroke="#333" stroke-width="1.5" />
              <line x1="30" y1="120" x2="480" y2="120" stroke="#333" stroke-width="1.5" />
              <path
                d="M57.9375 421.875 Q50.3438 421.875 44.7188 418.2188 Q39.0938 414.5625 36.2812 407.6719 Q33.4688 400.7812 33.4688 393.75 Q33.4688 387.2812 35.7188 381.7969 Q37.9688 376.3125 42.75 373.2188 Q47.5312 370.125 53.7188 370.125 Q59.625 370.4062 63.8438 372.5156 Q68.0625 374.625 70.7344 378.7031 Q73.4062 382.7812 73.4062 389.8125 Q73.4062 397.125 70.7344 401.2031 Q68.0625 405.2812 64.2656 407.3906 Q60.4688 409.5 54.8438 409.5 Q52.0312 409.5 50.0625 408.6562 Q48.0938 407.8125 45.8438 405.5625 Q46.9688 409.7812 50.2031 412.1719 Q53.4375 414.5625 57.9375 414.5625 Q65.3906 414.5625 71.0859 409.6406 Q76.7812 404.7188 80.3672 391.5 Q83.9531 378.2812 84.7969 360 L81 360 Q60.1875 360 46.4062 355.7812 Q32.625 351.5625 24.1875 339.4688 Q15.75 327.375 15.75 309.9375 Q15.75 296.4375 20.8125 279 Q27 264.375 36.2812 252 Q45.5625 239.625 59.625 226.6875 L67.9219 217.9688 L64.125 204.1875 Q57.9375 182.25 55.9688 172.9688 Q54 163.6875 54 157.5 Q54 149.625 56.5312 139.2188 Q59.0625 128.8125 66.9375 124.0312 Q74.8125 119.25 80.4375 119.25 Q87.1875 119.25 93.6562 125.1562 Q100.125 131.0625 103.2188 142.5938 Q106.3125 154.125 106.3125 165.375 Q106.3125 174.375 104.625 184.7812 Q102.9375 195.1875 98.0156 205.0312 Q93.0938 214.875 85.7812 223.3125 L83.5312 225.9844 Q86.0625 241.1719 88.875 258.75 L90.8438 272.9531 L95.0625 272.8125 Q105.1875 272.8125 113.3438 277.6641 Q121.5 282.5156 125.4375 292.0078 Q129.375 301.5 129.375 314.4375 Q129.375 327.9375 126.2812 336.5156 Q123.1875 345.0938 115.6641 351 Q108.1406 356.9062 96.0469 358.875 Q94.9219 378.8438 90.2812 394.1719 Q85.6406 409.5 77.4141 415.6875 Q69.1875 421.875 57.9375 421.875 ZM80.4375 344.8125 L84.9375 344.6719 L84.9375 336.0938 Q84.9375 327.2344 84.0234 316.3359 Q83.1094 305.4375 80.8594 288.8438 Q77.3438 290.25 74.25 293.4141 Q71.1562 296.5781 69.3281 300.5859 Q67.5 304.5938 67.5 307.9688 Q67.5 317.5312 69.6094 323.5781 Q71.7188 329.625 77.625 335.25 L73.125 336.9375 Q67.2188 333.8438 63.7031 330.0469 Q60.1875 326.25 58.5 320.7656 Q56.8125 315.2812 56.8125 306.5625 Q56.8125 300.0938 59.5547 293.625 Q62.2969 287.1562 66.9375 282.375 Q71.5781 277.5938 78.8906 275.2031 L77.0625 264.375 Q74.5312 249.0469 72.7031 239.4844 Q63.2812 251.0156 56.8125 260.1562 Q52.3125 267.1875 48.6562 275.625 Q45 284.0625 43.875 292.2188 Q42.75 300.375 42.75 308.8125 Q42.75 318.9375 46.9688 328.5 Q51.1875 338.0625 60.1875 341.4375 Q69.1875 344.8125 80.4375 344.8125 ZM96.1875 343.125 Q103.5 340.5938 106.875 336.2344 Q110.25 331.875 111.6562 326.4609 Q113.0625 321.0469 113.0625 314.4375 Q113.0625 307.125 111.0938 300.375 Q109.125 293.625 104.7656 290.25 Q100.4062 286.875 92.8125 286.875 L92.5312 286.875 Q94.5 302.4844 95.3438 313.9453 Q96.1875 325.4062 96.1875 334.6875 L96.1875 343.125 ZM79.4531 206.4375 Q86.9062 198.9844 90.7031 192.9375 Q94.5 186.8906 96.75 179.3672 Q99 171.8438 99 165.375 Q99 157.5 97.5938 152.4375 Q96.1875 147.375 92.8125 143.1562 Q89.4375 138.9375 84.9375 138.9375 Q81.5625 139.2188 78.1875 141.6094 Q74.8125 144 73.2656 147.7969 Q71.7188 151.5938 71.7188 154.9688 Q71.7188 159.4688 72.5625 169.7344 Q73.4062 180 77.625 198.5625 L79.4531 206.4375 Z"
                fill="#333"
                fill-rule="evenodd"
                transform="translate(10, -114) scale(0.55)"
              />
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
              viewBox="0 -55 500 210"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              style="max-width:500px;display:block;"
            >
              <line x1="30" y1="40" x2="408" y2="40" stroke="#333" stroke-width="1.5" />
              <line x1="30" y1="60" x2="408" y2="60" stroke="#333" stroke-width="1.5" />
              <line x1="30" y1="80" x2="408" y2="80" stroke="#333" stroke-width="1.5" />
              <line x1="30" y1="100" x2="408" y2="100" stroke="#333" stroke-width="1.5" />
              <line x1="30" y1="120" x2="408" y2="120" stroke="#333" stroke-width="1.5" />
              <path
                d="M57.9375 421.875 Q50.3438 421.875 44.7188 418.2188 Q39.0938 414.5625 36.2812 407.6719 Q33.4688 400.7812 33.4688 393.75 Q33.4688 387.2812 35.7188 381.7969 Q37.9688 376.3125 42.75 373.2188 Q47.5312 370.125 53.7188 370.125 Q59.625 370.4062 63.8438 372.5156 Q68.0625 374.625 70.7344 378.7031 Q73.4062 382.7812 73.4062 389.8125 Q73.4062 397.125 70.7344 401.2031 Q68.0625 405.2812 64.2656 407.3906 Q60.4688 409.5 54.8438 409.5 Q52.0312 409.5 50.0625 408.6562 Q48.0938 407.8125 45.8438 405.5625 Q46.9688 409.7812 50.2031 412.1719 Q53.4375 414.5625 57.9375 414.5625 Q65.3906 414.5625 71.0859 409.6406 Q76.7812 404.7188 80.3672 391.5 Q83.9531 378.2812 84.7969 360 L81 360 Q60.1875 360 46.4062 355.7812 Q32.625 351.5625 24.1875 339.4688 Q15.75 327.375 15.75 309.9375 Q15.75 296.4375 20.8125 279 Q27 264.375 36.2812 252 Q45.5625 239.625 59.625 226.6875 L67.9219 217.9688 L64.125 204.1875 Q57.9375 182.25 55.9688 172.9688 Q54 163.6875 54 157.5 Q54 149.625 56.5312 139.2188 Q59.0625 128.8125 66.9375 124.0312 Q74.8125 119.25 80.4375 119.25 Q87.1875 119.25 93.6562 125.1562 Q100.125 131.0625 103.2188 142.5938 Q106.3125 154.125 106.3125 165.375 Q106.3125 174.375 104.625 184.7812 Q102.9375 195.1875 98.0156 205.0312 Q93.0938 214.875 85.7812 223.3125 L83.5312 225.9844 Q86.0625 241.1719 88.875 258.75 L90.8438 272.9531 L95.0625 272.8125 Q105.1875 272.8125 113.3438 277.6641 Q121.5 282.5156 125.4375 292.0078 Q129.375 301.5 129.375 314.4375 Q129.375 327.9375 126.2812 336.5156 Q123.1875 345.0938 115.6641 351 Q108.1406 356.9062 96.0469 358.875 Q94.9219 378.8438 90.2812 394.1719 Q85.6406 409.5 77.4141 415.6875 Q69.1875 421.875 57.9375 421.875 ZM80.4375 344.8125 L84.9375 344.6719 L84.9375 336.0938 Q84.9375 327.2344 84.0234 316.3359 Q83.1094 305.4375 80.8594 288.8438 Q77.3438 290.25 74.25 293.4141 Q71.1562 296.5781 69.3281 300.5859 Q67.5 304.5938 67.5 307.9688 Q67.5 317.5312 69.6094 323.5781 Q71.7188 329.625 77.625 335.25 L73.125 336.9375 Q67.2188 333.8438 63.7031 330.0469 Q60.1875 326.25 58.5 320.7656 Q56.8125 315.2812 56.8125 306.5625 Q56.8125 300.0938 59.5547 293.625 Q62.2969 287.1562 66.9375 282.375 Q71.5781 277.5938 78.8906 275.2031 L77.0625 264.375 Q74.5312 249.0469 72.7031 239.4844 Q63.2812 251.0156 56.8125 260.1562 Q52.3125 267.1875 48.6562 275.625 Q45 284.0625 43.875 292.2188 Q42.75 300.375 42.75 308.8125 Q42.75 318.9375 46.9688 328.5 Q51.1875 338.0625 60.1875 341.4375 Q69.1875 344.8125 80.4375 344.8125 ZM96.1875 343.125 Q103.5 340.5938 106.875 336.2344 Q110.25 331.875 111.6562 326.4609 Q113.0625 321.0469 113.0625 314.4375 Q113.0625 307.125 111.0938 300.375 Q109.125 293.625 104.7656 290.25 Q100.4062 286.875 92.8125 286.875 L92.5312 286.875 Q94.5 302.4844 95.3438 313.9453 Q96.1875 325.4062 96.1875 334.6875 L96.1875 343.125 ZM79.4531 206.4375 Q86.9062 198.9844 90.7031 192.9375 Q94.5 186.8906 96.75 179.3672 Q99 171.8438 99 165.375 Q99 157.5 97.5938 152.4375 Q96.1875 147.375 92.8125 143.1562 Q89.4375 138.9375 84.9375 138.9375 Q81.5625 139.2188 78.1875 141.6094 Q74.8125 144 73.2656 147.7969 Q71.7188 151.5938 71.7188 154.9688 Q71.7188 159.4688 72.5625 169.7344 Q73.4062 180 77.625 198.5625 L79.4531 206.4375 Z"
                fill="#333"
                fill-rule="evenodd"
                transform="translate(10, -114) scale(0.55)"
              />
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
                    aria-label="Elapsed time: {(elapsedMs / 1000).toFixed(1)} seconds"
                    >{(elapsedMs / 1000).toFixed(1)}s</span
                  >
                </div>

                <div class="grid grid-cols-2 gap-3" role="group" aria-label="Answer choices">
                  {#each choices as letter}
                    <button
                      class={buttonClass(letter)}
                      onclick={() => handleAnswer(letter)}
                      disabled={selected !== null}
                      aria-label="Note {letter}"
                    >
                      {letter}
                    </button>
                  {/each}
                </div>

                <!-- Reserve space to prevent layout shift on answer reveal -->
                <div class="flex flex-col items-center gap-3 min-h-[4.5rem]" aria-live="polite">
                  {#if selected !== null}
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
                  {/if}
                </div>
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
  class="mt-auto bg-[#faf9f5] border-t border-[#dad9d4] px-8 py-[0.85rem] text-center text-[0.85rem] text-[#9a9287] shrink-0"
>
  <p>Klavier.life &mdash; Practice reading music notes</p>
</footer>
