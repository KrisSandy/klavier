<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(17)!;
  const songs = getSongsByLesson(17);
  const song = songs[0]; // Für Elise simplified

  let showQuiz = $state(false);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateQuestions(): QuizQuestion[] {
    return [
      {
        id: 'q1',
        prompt: 'What is musical "form"?',
        correctAnswer: 'The overall structure and organisation of a piece',
        choices: shuffle(['The overall structure and organisation of a piece', 'How loud or soft to play', 'The speed of the music', 'The key signature']),
      },
      {
        id: 'q2',
        prompt: 'In ABA form, what happens in the third section?',
        correctAnswer: 'The A section returns (often with variation)',
        choices: shuffle(['The A section returns (often with variation)', 'A completely new section', 'The piece ends quietly', 'The tempo doubles']),
      },
      {
        id: 'q3',
        prompt: 'What is "binary form" (AB)?',
        correctAnswer: 'Two contrasting sections',
        choices: shuffle(['Two contrasting sections', 'Three sections with a return', 'A single repeated section', 'Four different sections']),
      },
      {
        id: 'q4',
        prompt: 'What is "ternary form" (ABA)?',
        correctAnswer: 'Three sections where the first returns after a contrasting middle',
        choices: shuffle(['Three sections where the first returns after a contrasting middle', 'Three completely different sections', 'Two sections repeated', 'A long introduction']),
      },
      {
        id: 'q5',
        prompt: 'Für Elise by Beethoven is primarily in which form?',
        correctAnswer: 'Rondo (ABACA)',
        choices: shuffle(['Rondo (ABACA)', 'Binary (AB)', 'Sonata form', 'Through-composed']),
      },
      {
        id: 'q6',
        prompt: 'What does "through-composed" mean?',
        correctAnswer: 'New music throughout with no repeated sections',
        choices: shuffle(['New music throughout with no repeated sections', 'A piece with many repeats', 'Music written very quickly', 'A piece with only one section']),
      },
      {
        id: 'q7',
        prompt: 'A "verse-chorus" structure is most common in...',
        correctAnswer: 'Pop and rock music',
        choices: shuffle(['Pop and rock music', 'Classical sonatas', 'Jazz improvisation', 'Gregorian chant']),
      },
      {
        id: 'q8',
        prompt: 'What is a "coda" in music?',
        correctAnswer: 'A concluding section that brings the piece to an end',
        choices: shuffle(['A concluding section that brings the piece to an end', 'The fastest part of the piece', 'The opening theme', 'A repeated section']),
      },
      {
        id: 'q9',
        prompt: 'Repeat signs (||: :||) in sheet music mean...',
        correctAnswer: 'Go back and play the section again',
        choices: shuffle(['Go back and play the section again', 'Play louder', 'Skip this section', 'End the piece']),
      },
      {
        id: 'q10',
        prompt: 'Why is understanding form useful for performers?',
        correctAnswer: 'It helps with memorisation, interpretation, and musical narrative',
        choices: shuffle(['It helps with memorisation, interpretation, and musical narrative', 'It makes the music louder', 'It changes the key', 'It is only useful for composers']),
      },
    ];
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(17, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: What is Musical Form -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">What is Musical Form?</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      <strong>Form</strong> is the structure of a piece of music — how sections are arranged to create a complete musical experience. Just as a story has a beginning, middle, and end, music has sections that create tension, contrast, and resolution.
    </p>
    <p class="text-[#444] leading-[1.7]">
      Understanding form helps you memorise music faster (you see the big picture), perform with more expression (you know where the climax is), and listen more deeply to any piece of music.
    </p>
  </section>

  <!-- Section 2: Common Forms -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Common Musical Forms</h2>

    <div class="space-y-4 mb-4">
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-2">Binary Form (AB)</p>
        <div class="flex gap-2 mb-2">
          <span class="px-3 py-1 rounded bg-[#ce7e4f] text-white text-sm font-semibold">A</span>
          <span class="px-3 py-1 rounded bg-navy text-white text-sm font-semibold">B</span>
        </div>
        <p class="text-sm text-[#444]">Two contrasting sections. The first section establishes an idea, the second provides contrast. Many folk songs and dances use this form.</p>
      </div>

      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-2">Ternary Form (ABA)</p>
        <div class="flex gap-2 mb-2">
          <span class="px-3 py-1 rounded bg-[#ce7e4f] text-white text-sm font-semibold">A</span>
          <span class="px-3 py-1 rounded bg-navy text-white text-sm font-semibold">B</span>
          <span class="px-3 py-1 rounded bg-[#ce7e4f] text-white text-sm font-semibold">A</span>
        </div>
        <p class="text-sm text-[#444]">Three sections where the opening section returns after a contrasting middle. This creates a satisfying sense of return. Minuets and many classical pieces use ABA form.</p>
      </div>

      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-2">Rondo Form (ABACA...)</p>
        <div class="flex gap-2 mb-2">
          <span class="px-3 py-1 rounded bg-[#ce7e4f] text-white text-sm font-semibold">A</span>
          <span class="px-3 py-1 rounded bg-navy text-white text-sm font-semibold">B</span>
          <span class="px-3 py-1 rounded bg-[#ce7e4f] text-white text-sm font-semibold">A</span>
          <span class="px-3 py-1 rounded bg-[#28a745] text-white text-sm font-semibold">C</span>
          <span class="px-3 py-1 rounded bg-[#ce7e4f] text-white text-sm font-semibold">A</span>
        </div>
        <p class="text-sm text-[#444]">A recurring theme (A) alternates with contrasting episodes (B, C, etc.). Für Elise is a famous example — the iconic opening theme keeps returning between different episodes.</p>
      </div>

      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-2">Verse-Chorus Form</p>
        <div class="flex gap-2 mb-2">
          <span class="px-3 py-1 rounded bg-navy text-white text-sm font-semibold">Verse</span>
          <span class="px-3 py-1 rounded bg-[#ce7e4f] text-white text-sm font-semibold">Chorus</span>
          <span class="px-3 py-1 rounded bg-navy text-white text-sm font-semibold">Verse</span>
          <span class="px-3 py-1 rounded bg-[#ce7e4f] text-white text-sm font-semibold">Chorus</span>
        </div>
        <p class="text-sm text-[#444]">The most common form in popular music. Verses tell the story with different lyrics; the chorus is the catchy, memorable hook that repeats.</p>
      </div>
    </div>
  </section>

  <!-- Section 3: Recognising Sections -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">How to Recognise Sections</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      When you listen to or read a piece, look for these clues that a new section is starting:
    </p>
    <div class="space-y-2 mb-4">
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold shrink-0">•</span>
        <p class="text-[#444]"><strong>Melody change:</strong> A new theme or significant variation of the original</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold shrink-0">•</span>
        <p class="text-[#444]"><strong>Key change:</strong> The music shifts to a new key (modulation)</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold shrink-0">•</span>
        <p class="text-[#444]"><strong>Dynamic change:</strong> A sudden shift in volume (loud to soft, or vice versa)</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold shrink-0">•</span>
        <p class="text-[#444]"><strong>Texture change:</strong> More or fewer notes, different accompaniment pattern</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold shrink-0">•</span>
        <p class="text-[#444]"><strong>Repeat signs:</strong> Double bar lines with dots (||: :||) mark section boundaries</p>
      </div>
    </div>
  </section>

  <!-- Section 4: Für Elise -->
  {#if song}
    <section class="mb-10">
      <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Für Elise — A Rondo in Action</h2>
      <p class="text-[#444] leading-[1.7] mb-3">
        This simplified version of Beethoven's beloved piece shows the opening "A" theme. In the full piece, this theme returns multiple times between contrasting episodes — classic rondo form (ABACA).
      </p>
      <p class="text-[#444] leading-[1.7] mb-4">
        Notice the iconic E-D#-E-D#-E pattern — this is what makes the theme instantly recognisable every time it returns:
      </p>
      <div class="mb-4 bg-white rounded-lg p-4">
        {#each song.lines as line}
          <div class="mb-2">
            <SongStaff notes={line} />
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Section 5: Notation Symbols -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Form-Related Notation</h2>
    <div class="space-y-3">
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-2xl font-mono text-navy">||: :||</span>
          <div>
            <p class="font-semibold text-navy">Repeat signs</p>
            <p class="text-sm text-[#444]">Go back to the start of the repeated section and play it again.</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-2xl font-mono text-navy">D.C.</span>
          <div>
            <p class="font-semibold text-navy">Da Capo</p>
            <p class="text-sm text-[#444]">Go back to the very beginning and play again.</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-2xl font-mono text-navy">D.S.</span>
          <div>
            <p class="font-semibold text-navy">Dal Segno</p>
            <p class="text-sm text-[#444]">Go back to the segno (𝄋) sign and play from there.</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-2xl font-mono text-navy">𝄌</span>
          <div>
            <p class="font-semibold text-navy">Coda</p>
            <p class="text-sm text-[#444]">Jump to the coda section (the ending passage).</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of musical form?
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >Start Quiz</button>
    {:else}
      <QuizEngine questions={quizData} onComplete={onQuizComplete} />
    {/if}
  </section>
</LessonLayout>
