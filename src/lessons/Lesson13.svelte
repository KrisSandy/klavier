<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import SightReadingExercise from '../components/SightReadingExercise.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { TREBLE_NOTES } from '../data/notes';
  import { getLessonById } from '../data/lessons';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(13)!;

  let showQuiz = $state(false);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Easy pool: notes on the staff lines and spaces
  const easyNotes = TREBLE_NOTES.filter(n => n.yPos >= 40 && n.yPos <= 120);
  // Hard pool: includes ledger line notes
  const allNotes = TREBLE_NOTES.filter(n => n.yPos >= 20 && n.yPos <= 150);

  let difficulty = $state<'easy' | 'hard'>('easy');
  let speed = $state(4);

  const activePool = $derived(difficulty === 'easy' ? easyNotes : allNotes);

  function generateQuestions(): QuizQuestion[] {
    return [
      {
        id: 'q1',
        prompt: 'What is sight-reading?',
        correctAnswer: 'Playing music you haven\'t seen before',
        choices: shuffle(['Playing music you haven\'t seen before', 'Memorising a piece before playing', 'Reading lyrics while singing', 'Playing by ear']),
      },
      {
        id: 'q2',
        prompt: 'What is the most important habit for improving sight-reading?',
        correctAnswer: 'Looking ahead while playing',
        choices: shuffle(['Looking ahead while playing', 'Playing as fast as possible', 'Memorising every note', 'Practising scales only']),
      },
      {
        id: 'q3',
        prompt: 'When sight-reading, what should you do if you make a mistake?',
        correctAnswer: 'Keep going and stay in time',
        choices: shuffle(['Keep going and stay in time', 'Stop and start over', 'Go back and fix the mistake', 'Slow down dramatically']),
      },
      {
        id: 'q4',
        prompt: 'Before sight-reading a piece, what should you check first?',
        correctAnswer: 'Time signature and key signature',
        choices: shuffle(['Time signature and key signature', 'The title and composer', 'The last measure', 'The fingering numbers']),
      },
      {
        id: 'q5',
        prompt: 'Which strategy helps you read notes faster?',
        correctAnswer: 'Recognising patterns like steps and skips',
        choices: shuffle(['Recognising patterns like steps and skips', 'Naming each note individually', 'Playing very slowly', 'Closing your eyes']),
      },
      {
        id: 'q6',
        prompt: 'A "step" on the staff means the note moves to the...',
        correctAnswer: 'next line or space (adjacent position)',
        choices: shuffle(['next line or space (adjacent position)', 'same position', 'opposite end of the staff', 'nearest black key']),
      },
      {
        id: 'q7',
        prompt: 'A "skip" on the staff means the note moves...',
        correctAnswer: 'over one line or space',
        choices: shuffle(['over one line or space', 'to the same position', 'down an octave', 'to a black key']),
      },
      {
        id: 'q8',
        prompt: 'What does "reading ahead" mean in sight-reading?',
        correctAnswer: 'Your eyes are on the next notes while your hands play the current ones',
        choices: shuffle(['Your eyes are on the next notes while your hands play the current ones', 'Skipping difficult passages', 'Turning the page early', 'Playing the notes before you see them']),
      },
    ];
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(13, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: What is Sight-Reading -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">What is Sight-Reading?</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Sight-reading is the ability to play a piece of music <strong>the first time you see it</strong>, without having practised it before. It's one of the most valuable skills a pianist can develop — it lets you learn new music quickly, play with other musicians, and enjoy a much wider range of music.
    </p>
    <p class="text-[#444] leading-[1.7] mb-3">
      The key to good sight-reading is <strong>reading ahead</strong>. Your eyes should always be a beat or two ahead of your hands. Think of it like reading a book aloud — you don't look at each word as you say it, you glance ahead to keep the flow smooth.
    </p>
  </section>

  <!-- Section 2: Steps and Skips -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Recognising Steps and Skips</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Instead of reading every single note name, trained sight-readers see <strong>patterns</strong>. The two most fundamental patterns are:
    </p>
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-1">Step</p>
        <p class="text-sm text-[#444]">The note moves to the <strong>next adjacent position</strong> on the staff — from a line to the next space, or a space to the next line. On the keyboard, this is the next white key (or next note in the scale).</p>
      </div>
      <div class="bg-white rounded-lg p-4 border-l-4 border-navy">
        <p class="font-semibold text-navy mb-1">Skip</p>
        <p class="text-sm text-[#444]">The note <strong>jumps over</strong> one position — from line to line, or space to space. On the keyboard, this skips one white key.</p>
      </div>
    </div>
    <p class="text-[#444] leading-[1.7]">
      Once you can instantly see "step up, step up, skip down, step up" you barely need to read individual note names. This is how experienced musicians read so quickly.
    </p>
  </section>

  <!-- Section 3: Tips -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Sight-Reading Tips</h2>
    <div class="space-y-3">
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">1</span>
        <p class="text-[#444]"><strong>Scan before you play.</strong> Look at the key signature, time signature, and scan the whole piece for tricky spots.</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">2</span>
        <p class="text-[#444]"><strong>Keep a steady tempo.</strong> It's better to play slowly and steadily than to rush and stumble.</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">3</span>
        <p class="text-[#444]"><strong>Don't stop for mistakes.</strong> In sight-reading, keeping the rhythm going is more important than hitting every note.</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">4</span>
        <p class="text-[#444]"><strong>Look for patterns.</strong> Steps, skips, repeated notes, scale fragments, chord shapes — they're everywhere.</p>
      </div>
    </div>
  </section>

  <!-- Section 4: Practice Drill -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Sight-Reading Drill</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Notes will appear on the staff one at a time. Identify each note as fast as you can before the timer runs out. The faster you go, the better your sight-reading becomes.
    </p>

    <div class="flex gap-4 mb-4 items-center">
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 rounded text-sm font-medium transition-all {difficulty === 'easy' ? 'bg-navy text-white' : 'bg-white text-navy border border-[#dad9d4] hover:border-purple'}"
          onclick={() => difficulty = 'easy'}
        >Staff Notes</button>
        <button
          class="px-3 py-1.5 rounded text-sm font-medium transition-all {difficulty === 'hard' ? 'bg-navy text-white' : 'bg-white text-navy border border-[#dad9d4] hover:border-purple'}"
          onclick={() => difficulty = 'hard'}
        >+ Ledger Lines</button>
      </div>
      <div class="flex gap-2 items-center">
        <span class="text-sm text-[#666]">Speed:</span>
        <button
          class="px-3 py-1.5 rounded text-sm font-medium transition-all {speed === 5 ? 'bg-purple text-white' : 'bg-white text-navy border border-[#dad9d4]'}"
          onclick={() => speed = 5}
        >Slow</button>
        <button
          class="px-3 py-1.5 rounded text-sm font-medium transition-all {speed === 4 ? 'bg-purple text-white' : 'bg-white text-navy border border-[#dad9d4]'}"
          onclick={() => speed = 4}
        >Medium</button>
        <button
          class="px-3 py-1.5 rounded text-sm font-medium transition-all {speed === 2.5 ? 'bg-purple text-white' : 'bg-white text-navy border border-[#dad9d4]'}"
          onclick={() => speed = 2.5}
        >Fast</button>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
      <SightReadingExercise notePool={activePool} timePerNote={speed} />
    </div>
  </section>

  <!-- Section 5: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of sight-reading techniques?
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
