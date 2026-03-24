<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import Staff from '../components/Staff.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { TREBLE_NOTES, ALL_LETTERS, STAFF_LINES, CLEF_FONT_SIZE } from '../data/notes';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(3)!;

  let showQuiz = $state(false);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateQuestions(): { questions: QuizQuestion[]; noteMap: Record<string, number> } {
    const questions: QuizQuestion[] = [];
    const noteMap: Record<string, number> = {};
    const pool = [...TREBLE_NOTES];
    const picked = shuffle(pool).slice(0, 10);

    for (let i = 0; i < picked.length; i++) {
      const note = picked[i];
      const distractors = shuffle(ALL_LETTERS.filter(l => l !== note.name)).slice(0, 3);
      const qId = `q${i}-${note.id}`;
      noteMap[qId] = note.yPos;
      questions.push({
        id: qId,
        prompt: 'What note is this?',
        correctAnswer: note.name,
        choices: shuffle([note.name, ...distractors]),
      });
    }
    return { questions, noteMap };
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(2, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: The Staff -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The Five-Line Staff</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Music is written on a five-line staff. The lines are numbered from bottom to top as 1, 2, 3, 4, 5. Between the lines are four spaces, also numbered from bottom to top as 1, 2, 3, 4. Together, the five lines and four spaces give us nine different positions for notes.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      Look at an empty staff below — just five horizontal lines:
    </p>
    <div class="flex justify-center mb-4">
      <svg viewBox="0 -15 500 200" width="100%" style="max-width: 500px;">
        <!-- Staff lines only -->
        <line x1="40" y1="40" x2="460" y2="40" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="60" x2="460" y2="60" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="80" x2="460" y2="80" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="100" x2="460" y2="100" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="120" x2="460" y2="120" stroke="#3d3929" stroke-width="1" />
      </svg>
    </div>
  </section>

  <!-- Section 2: The Treble Clef -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The Treble Clef</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      At the beginning of every staff you'll see a symbol called the <strong>treble clef</strong> (also called the G clef). The curl of this symbol wraps around the second line from the bottom, which is the note <strong>G</strong>. This is how the treble clef got its name — it marks where G is on the staff.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here's a staff with the treble clef and a G note highlighted:
    </p>
    <div class="flex justify-center mb-4">
      <div style="max-width: 500px;">
        <Staff yPos={100} />
      </div>
    </div>
    <p class="text-[#444] leading-[1.7]">
      The note shown above is <strong>G4</strong> — it sits right on the line that the treble clef's curl marks.
    </p>
  </section>

  <!-- Section 3: Notes on Lines -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Notes on the Lines</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      In the treble clef, the notes that sit on the five lines are: <strong>E, G, B, D, F</strong> (from bottom to top). A classic memory aid is: <strong>"Every Good Boy Does Fine"</strong>.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here are all five line notes shown together:
    </p>
    <div class="flex justify-center mb-4">
      <svg viewBox="0 -15 500 200" width="100%" style="max-width: 500px;">
        <!-- Staff lines -->
        <line x1="40" y1="40" x2="460" y2="40" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="60" x2="460" y2="60" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="80" x2="460" y2="80" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="100" x2="460" y2="100" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="120" x2="460" y2="120" stroke="#3d3929" stroke-width="1" />
        <!-- Treble clef -->
        <text x="42" y="128" font-size="105" font-family="Noto Music" fill="#3d3929">𝄞</text>
        <!-- Note heads on lines with labels -->
        <!-- E4 (y=120) -->
        <ellipse cx="280" cy="120" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="280" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">E</text>
        <!-- G4 (y=100) -->
        <ellipse cx="320" cy="100" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="320" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">G</text>
        <!-- B4 (y=80) -->
        <ellipse cx="360" cy="80" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="360" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">B</text>
        <!-- D5 (y=60) -->
        <ellipse cx="400" cy="60" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="400" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">D</text>
        <!-- F5 (y=40) -->
        <ellipse cx="440" cy="40" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="440" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">F</text>
      </svg>
    </div>
  </section>

  <!-- Section 4: Notes on Spaces -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Notes in the Spaces</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      The four spaces between the lines contain the notes: <strong>F, A, C, E</strong> (from bottom to top). These spell the word <strong>"FACE"</strong> — easy to remember!
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here are all four space notes:
    </p>
    <div class="flex justify-center mb-4">
      <svg viewBox="0 -15 500 200" width="100%" style="max-width: 500px;">
        <!-- Staff lines -->
        <line x1="40" y1="40" x2="460" y2="40" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="60" x2="460" y2="60" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="80" x2="460" y2="80" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="100" x2="460" y2="100" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="120" x2="460" y2="120" stroke="#3d3929" stroke-width="1" />
        <!-- Treble clef -->
        <text x="42" y="128" font-size="105" font-family="Noto Music" fill="#3d3929">𝄞</text>
        <!-- Note heads in spaces with labels -->
        <!-- F4 (y=110, space below) -->
        <ellipse cx="280" cy="110" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="280" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">F</text>
        <!-- A4 (y=90, space) -->
        <ellipse cx="320" cy="90" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="320" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">A</text>
        <!-- C5 (y=70, space) -->
        <ellipse cx="360" cy="70" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="360" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">C</text>
        <!-- E5 (y=50, space above) -->
        <ellipse cx="400" cy="50" rx="10" ry="7" fill="none" stroke="#3d3929" stroke-width="1.5" />
        <text x="400" y="145" font-size="14" text-anchor="middle" fill="#3d3929" font-weight="bold">E</text>
      </svg>
    </div>
  </section>

  <!-- Section 5: Ledger Lines -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Ledger Lines</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      What about notes that go higher or lower than the staff? We use short extra lines called <strong>ledger lines</strong>. Each ledger line works the same way — a note sits on it or in a space between ledger lines.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here's an example with a high note (F5) and a low note (C4):
    </p>
    <div class="flex justify-center mb-4">
      <svg viewBox="0 -15 500 200" width="100%" style="max-width: 500px;">
        <!-- Ledger line above staff (F5) -->
        <line x1="40" y1="30" x2="460" y2="30" stroke="#3d3929" stroke-width="1" opacity="0.5" />
        <!-- Staff lines -->
        <line x1="40" y1="40" x2="460" y2="40" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="60" x2="460" y2="60" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="80" x2="460" y2="80" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="100" x2="460" y2="100" stroke="#3d3929" stroke-width="1" />
        <line x1="40" y1="120" x2="460" y2="120" stroke="#3d3929" stroke-width="1" />
        <!-- Ledger line below staff (C4) -->
        <line x1="40" y1="130" x2="460" y2="130" stroke="#3d3929" stroke-width="1" opacity="0.5" />
        <!-- Treble clef -->
        <text x="42" y="128" font-size="105" font-family="Noto Music" fill="#3d3929">𝄞</text>
        <!-- High note F5 on ledger line -->
        <ellipse cx="280" cy="30" rx="10" ry="7" fill="none" stroke="#ce7e4f" stroke-width="2" />
        <text x="280" y="155" font-size="14" text-anchor="middle" fill="#ce7e4f" font-weight="bold">F5</text>
        <!-- Low note C4 on ledger line -->
        <ellipse cx="400" cy="130" rx="10" ry="7" fill="none" stroke="#ce7e4f" stroke-width="2" />
        <text x="400" y="155" font-size="14" text-anchor="middle" fill="#ce7e4f" font-weight="bold">C4</text>
      </svg>
    </div>
  </section>

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to identify notes on the staff? Each question will show a note on the treble clef — pick the correct letter name.
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >Start Quiz</button>
    {:else}
      <QuizEngine questions={quizData.questions} onComplete={onQuizComplete}>
        {#snippet children({ currentQuestion, questionIndex })}
          <div class="mb-4 flex justify-center">
            <div style="max-width: 500px;">
              <Staff yPos={quizData.noteMap[quizData.questions[questionIndex]?.id] || 100} />
            </div>
          </div>
        {/snippet}
      </QuizEngine>
    {/if}
  </section>
</LessonLayout>
