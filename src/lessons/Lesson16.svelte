<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import IntervalTrainer from '../components/IntervalTrainer.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { playNote } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(16)!;
  const songs = getSongsByLesson(15);
  const song = songs[0]; // Amazing Grace

  let showQuiz = $state(false);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Play an interval demo
  function playIntervalDemo(root: number, semitones: number) {
    playNote(root, 0.8, 0.5);
    setTimeout(() => playNote(root + semitones, 0.8, 0.5), 500);
  }

  const intervalExamples = [
    { name: 'Major 2nd', semitones: 2, example: 'C → D', hint: '"Happy Birthday" starts with a M2' },
    { name: 'Major 3rd', semitones: 4, example: 'C → E', hint: '"Oh When the Saints" starts with ascending 3rds' },
    { name: 'Perfect 4th', semitones: 5, example: 'C → F', hint: '"Here Comes the Bride"' },
    { name: 'Perfect 5th', semitones: 7, example: 'C → G', hint: '"Star Wars" theme' },
    { name: 'Octave', semitones: 12, example: 'C → C (higher)', hint: '"Somewhere Over the Rainbow"' },
  ];

  function generateQuestions(): QuizQuestion[] {
    return [
      {
        id: 'q1',
        prompt: 'What is an interval in music?',
        correctAnswer: 'The distance between two notes',
        choices: shuffle(['The distance between two notes', 'A type of chord', 'A rest between phrases', 'A dynamic marking']),
      },
      {
        id: 'q2',
        prompt: 'How many semitones in a Major 2nd?',
        correctAnswer: '2',
        choices: shuffle(['2', '1', '3', '4']),
      },
      {
        id: 'q3',
        prompt: 'How many semitones in a Perfect 5th?',
        correctAnswer: '7',
        choices: shuffle(['7', '5', '6', '8']),
      },
      {
        id: 'q4',
        prompt: 'How many semitones in a Perfect 4th?',
        correctAnswer: '5',
        choices: shuffle(['5', '4', '6', '7']),
      },
      {
        id: 'q5',
        prompt: 'A Major 3rd has how many semitones?',
        correctAnswer: '4',
        choices: shuffle(['4', '3', '5', '2']),
      },
      {
        id: 'q6',
        prompt: 'What is the interval from C to G?',
        correctAnswer: 'Perfect 5th',
        choices: shuffle(['Perfect 5th', 'Perfect 4th', 'Major 6th', 'Major 3rd']),
      },
      {
        id: 'q7',
        prompt: 'What is the interval from C to F?',
        correctAnswer: 'Perfect 4th',
        choices: shuffle(['Perfect 4th', 'Perfect 5th', 'Major 3rd', 'Minor 3rd']),
      },
      {
        id: 'q8',
        prompt: 'An octave spans how many semitones?',
        correctAnswer: '12',
        choices: shuffle(['12', '8', '10', '7']),
      },
      {
        id: 'q9',
        prompt: 'What is the difference between a Major 3rd and a Minor 3rd?',
        correctAnswer: '1 semitone (Major 3rd = 4, Minor 3rd = 3)',
        choices: shuffle(['1 semitone (Major 3rd = 4, Minor 3rd = 3)', '2 semitones', '3 semitones', 'They are the same']),
      },
      {
        id: 'q10',
        prompt: 'A tritone (augmented 4th / diminished 5th) has how many semitones?',
        correctAnswer: '6',
        choices: shuffle(['6', '5', '7', '8']),
      },
    ];
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(15, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: What are Intervals -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">What is an Interval?</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      An <strong>interval</strong> is the distance between two notes, measured in semitones (half steps). Intervals are the building blocks of melody and harmony — every chord is a stack of intervals, and every melody is a sequence of intervals.
    </p>
    <p class="text-[#444] leading-[1.7]">
      Learning to hear and name intervals transforms how you understand music. You'll be able to figure out melodies by ear, understand chord structure, and sight-read much faster.
    </p>
  </section>

  <!-- Section 2: Common Intervals -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Common Intervals</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here are the intervals you'll encounter most often. Click each one to hear it:
    </p>
    <div class="space-y-3">
      {#each intervalExamples as interval}
        <button
          class="w-full text-left p-4 rounded-lg border-2 border-[#e8e6e0] bg-white hover:border-purple transition-all"
          onclick={() => playIntervalDemo(60, interval.semitones)}
        >
          <div class="flex items-center justify-between">
            <div>
              <span class="font-semibold text-navy">{interval.name}</span>
              <span class="text-sm text-[#666] ml-2">({interval.semitones} semitones)</span>
              <span class="text-sm text-purple ml-2">{interval.example}</span>
            </div>
            <span class="text-purple text-lg">🔊</span>
          </div>
          <p class="text-xs text-[#999] mt-1">Song reference: {interval.hint}</p>
        </button>
      {/each}
    </div>

    <!-- Fingering Tip -->
    <div class="mt-6 bg-[#fdf6f0] rounded-lg p-4 border-l-4 border-purple">
      <p class="font-semibold text-navy mb-2">Fingering Tip: Playing Intervals Comfortably</p>
      <p class="text-[#444] text-sm leading-[1.6] mb-3">
        When playing intervals as harmony (two notes at once), use fingers that match the interval span. This helps your hand relax and play more accurately:
      </p>
      <ul class="text-sm text-[#444] leading-[1.6] space-y-1 ml-4">
        <li>• <strong>2nd</strong> (e.g., C–D): fingers 1–2 (adjacent fingers for adjacent notes)</li>
        <li>• <strong>3rd</strong> (e.g., C–E): fingers 1–3 (skip a finger, like skipping a note)</li>
        <li>• <strong>5th</strong> (e.g., C–G): fingers 1–5 (thumb and pinky span five notes)</li>
        <li>• <strong>Octave</strong> (e.g., C–C): fingers 1–5 with a hand stretch (requires relaxed hand)</li>
      </ul>
    </div>
  </section>

  <!-- Section 3: Interval Table -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Complete Interval Reference</h2>
    <div class="bg-white rounded-lg border border-[#e8e6e0] overflow-hidden">
      <div class="grid grid-cols-3 text-sm font-semibold text-navy bg-[#faf9f5] p-3 border-b border-[#e8e6e0]">
        <span>Interval</span>
        <span>Semitones</span>
        <span>Example (from C)</span>
      </div>
      {#each [
        ['Minor 2nd', '1', 'C → C#/Db'],
        ['Major 2nd', '2', 'C → D'],
        ['Minor 3rd', '3', 'C → Eb'],
        ['Major 3rd', '4', 'C → E'],
        ['Perfect 4th', '5', 'C → F'],
        ['Tritone', '6', 'C → F#/Gb'],
        ['Perfect 5th', '7', 'C → G'],
        ['Minor 6th', '8', 'C → Ab'],
        ['Major 6th', '9', 'C → A'],
        ['Minor 7th', '10', 'C → Bb'],
        ['Major 7th', '11', 'C → B'],
        ['Octave', '12', 'C → C'],
      ] as [name, semi, ex], i}
        <div class="grid grid-cols-3 text-sm p-3 {i % 2 === 0 ? 'bg-white' : 'bg-[#faf9f5]'} border-b border-[#f0ebe5]">
          <span class="text-[#444]">{name}</span>
          <span class="font-mono text-navy">{semi}</span>
          <span class="text-[#666]">{ex}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Section 4: Interval Trainer -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Interval Ear Training</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Train your ear to recognise intervals. You'll hear two notes played — identify the interval between them. Start with ascending mode and try the others once you're comfortable:
    </p>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
      <IntervalTrainer />
    </div>
  </section>

  <!-- Section 5: Amazing Grace -->
  {#if song}
    <section class="mb-10">
      <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Amazing Grace</h2>
      <p class="text-[#444] leading-[1.7] mb-4">
        This beloved melody is built from simple intervals — lots of 3rds, 4ths, and 5ths. As you play through it, try to name each interval between consecutive notes:
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

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of intervals?
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
