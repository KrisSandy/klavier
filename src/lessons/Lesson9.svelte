<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import Metronome from '../components/Metronome.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { getNoteById } from '../data/notes';
  import { playNote, playSequence } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(9)!;
  const songs = getSongsByLesson(8);
  const yankeeDoodle = songs[0]; // Yankee Doodle

  let showQuiz = $state(false);
  let isPlaying = $state(false);
  let highlightIndex = $state(-1);
  let playbackStop: { stop: () => void } | null = null;

  function playMelody() {
    if (isPlaying && playbackStop) {
      playbackStop.stop();
      isPlaying = false;
      highlightIndex = -1;
      return;
    }

    if (yankeeDoodle) {
      const allNotes = yankeeDoodle.lines.flat();
      const noteSequence = allNotes.map(id => {
        const note = getNoteById(id);
        return { midiNote: note?.midiNote ?? 60, duration: 1 };
      });

      isPlaying = true;
      playbackStop = playSequence(noteSequence, yankeeDoodle.bpm, (index) => {
        highlightIndex = index;
      });

      const totalDuration = noteSequence.length * (60 / yankeeDoodle.bpm) * 1000;
      setTimeout(() => {
        isPlaying = false;
        highlightIndex = -1;
      }, totalDuration + 200);
    }
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateQuestions(): QuizQuestion[] {
    const questions: QuizQuestion[] = [];

    // Question 1: 4/4 beats per measure
    questions.push({
      id: 'q1',
      prompt: 'How many beats per measure in 4/4 time?',
      correctAnswer: '4',
      choices: shuffle(['2', '3', '4', '6']),
    });

    // Question 2: 3/4 beats per measure
    questions.push({
      id: 'q2',
      prompt: 'How many beats per measure in 3/4 time?',
      correctAnswer: '3',
      choices: shuffle(['2', '3', '4', '6']),
    });

    // Question 3: Which note gets one beat in 6/8
    questions.push({
      id: 'q3',
      prompt: 'In 6/8 time, which note gets one beat?',
      correctAnswer: 'Eighth note',
      choices: shuffle(['Whole note', 'Half note', 'Quarter note', 'Eighth note']),
    });

    // Question 4: Which note gets one beat in 4/4
    questions.push({
      id: 'q4',
      prompt: 'In 4/4 time, which note gets one beat?',
      correctAnswer: 'Quarter note',
      choices: shuffle(['Whole note', 'Half note', 'Quarter note', 'Eighth note']),
    });

    // Question 5: Waltz time signature
    questions.push({
      id: 'q5',
      prompt: 'What time signature is typically used for a waltz?',
      correctAnswer: '3/4',
      choices: shuffle(['2/4', '3/4', '4/4', '6/8']),
    });

    // Question 6: Bottom number meaning
    questions.push({
      id: 'q6',
      prompt: 'In a time signature, what does the bottom number represent?',
      correctAnswer: 'Which note gets one beat',
      choices: shuffle([
        'Total beats in a measure',
        'How many measures in a piece',
        'Which note gets one beat',
        'The tempo of the piece',
      ]),
    });

    // Question 7: 6/8 vs 3/4 difference
    questions.push({
      id: 'q7',
      prompt: 'What is the key difference between 6/8 and 3/4 time?',
      correctAnswer: 'The accent pattern and grouping of beats',
      choices: shuffle([
        'The tempo',
        'The accent pattern and grouping of beats',
        '6/8 uses eighth notes and 3/4 uses quarter notes',
        'There is no difference',
      ]),
    });

    // Question 8: Common time symbol
    questions.push({
      id: 'q8',
      prompt: 'What is another name for 4/4 time?',
      correctAnswer: 'Common time',
      choices: shuffle(['Simple time', 'Common time', 'Perfect time', 'Waltz time']),
    });

    return questions;
  }

  let quizQuestions = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(8, score, total, 0);
  }

  function startQuiz() {
    quizQuestions = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: What is a Time Signature? -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">What is a Time Signature?</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      A <strong>time signature</strong> (also called a "meter") is a pair of numbers at the beginning of a piece of music that tells you how the beats are organized. It looks like a fraction:
    </p>

    <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] mb-6">
      <div class="text-center mb-4">
        <svg viewBox="0 0 120 100" width="120" height="100">
          <text x="60" y="40" font-size="32" font-weight="bold" text-anchor="middle" fill="#3d3929">4</text>
          <line x1="20" y1="50" x2="100" y2="50" stroke="#3d3929" stroke-width="2" />
          <text x="60" y="85" font-size="32" font-weight="bold" text-anchor="middle" fill="#3d3929">4</text>
        </svg>
      </div>
      <p class="text-center text-[#666] text-sm">
        <strong>Top number (numerator):</strong> How many beats per measure<br />
        <strong>Bottom number (denominator):</strong> Which note gets one beat
      </p>
    </div>

    <p class="text-[#444] leading-[1.7] mb-4">
      For example, in <strong>4/4 time</strong>:
    </p>
    <ul class="text-[#444] leading-[1.7] space-y-2 ml-6 mb-6">
      <li>• <strong>Top 4:</strong> There are 4 beats in each measure</li>
      <li>• <strong>Bottom 4:</strong> A quarter note gets 1 beat</li>
    </ul>

    <p class="text-[#444] leading-[1.7]">
      Time signatures help you understand the rhythmic structure of a piece. They tell your hands and body how to group the beats together.
    </p>
  </section>

  <!-- Section 2: 4/4 Time (Common Time) -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">4/4 Time (Common Time)</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      <strong>4/4 time</strong> is the most common time signature in Western music. You've probably been playing in 4/4 this whole time! It's so common that it's also called <strong>"common time,"</strong> and you might see it written as a simple <strong>C</strong> symbol instead of 4/4.
    </p>

    <div class="bg-white rounded-lg p-5 border border-[#e8e6e0] mb-6">
      <p class="text-sm font-semibold text-navy mb-4">The beat pattern:</p>
      <div class="flex items-center justify-between">
        <div class="text-center">
          <p class="text-2xl font-bold text-navy mb-2">1</p>
          <p class="text-xs text-[#666]">Strong</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-[#999] mb-2">2</p>
          <p class="text-xs text-[#666]">Weak</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-[#bbb] mb-2">3</p>
          <p class="text-xs text-[#666]">Medium</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-[#999] mb-2">4</p>
          <p class="text-xs text-[#666]">Weak</p>
        </div>
      </div>
      <p class="text-[#666] text-sm mt-4 text-center">
        The first beat (1) is always the strongest. The third beat (3) has a secondary accent. Beats 2 and 4 are weaker.
      </p>
    </div>

    <div class="bg-[#fef3ee] border-l-4 border-purple rounded-lg p-4">
      <p class="text-[#444] text-sm">
        <strong>💡 Example:</strong> Pop songs, classical symphonies, rock songs — most music you hear uses 4/4 time. It feels natural and balanced.
      </p>
    </div>
  </section>

  <!-- Section 3: 3/4 Time (Waltz) -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">3/4 Time (Waltz)</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      <strong>3/4 time</strong> has 3 beats per measure. It's the natural time signature for waltzes, lullabies, and many classical pieces. It has a flowing, graceful feeling compared to the balanced feel of 4/4.
    </p>

    <div class="bg-white rounded-lg p-5 border border-[#e8e6e0] mb-6">
      <p class="text-sm font-semibold text-navy mb-4">The beat pattern:</p>
      <div class="flex items-center justify-between">
        <div class="text-center">
          <p class="text-2xl font-bold text-navy mb-2">1</p>
          <p class="text-xs text-[#666]">Strong</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-[#999] mb-2">2</p>
          <p class="text-xs text-[#666]">Weak</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-[#999] mb-2">3</p>
          <p class="text-xs text-[#666]">Weak</p>
        </div>
      </div>
      <p class="text-[#666] text-sm mt-4 text-center">
        Only the first beat is accented. The pattern repeats: 1-weak-weak, 1-weak-weak. This creates the classic waltz rhythm.
      </p>
    </div>

    <p class="text-[#444] leading-[1.7] mb-4">
      Let's listen to how 3/4 time feels. Practice counting along with a metronome:
    </p>
    <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
      <p class="text-sm font-semibold text-navy mb-4">Practice counting 3/4 time (waltz tempo):</p>
      <Metronome initialBpm={100} />
    </div>
  </section>

  <!-- Section 4: 6/8 Time -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">6/8 Time</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      <strong>6/8 time</strong> is more complex. It has 6 beats per measure, but in 6/8, the eighth note gets one beat (not the quarter note). This means there are 6 eighth notes per measure.
    </p>

    <p class="text-[#444] leading-[1.7] mb-4">
      What makes 6/8 special is that it's <strong>compound meter</strong>. Even though there are 6 beats, they're grouped in twos (2 groups of 3), so it feels like there are 2 main beats per measure, not 6. This gives it a rolling, lilting feeling.
    </p>

    <div class="bg-white rounded-lg p-5 border border-[#e8e6e0] mb-6">
      <p class="text-sm font-semibold text-navy mb-4">6/8 vs 3/4 comparison:</p>
      <div class="space-y-4">
        <div>
          <p class="text-sm font-semibold text-navy mb-2">3/4 Time:</p>
          <p class="text-[#666] text-sm">
            <strong>3 quarter notes per measure.</strong> Each quarter note gets 1 beat. It feels like 1-2-3, 1-2-3.
          </p>
        </div>
        <div>
          <p class="text-sm font-semibold text-navy mb-2">6/8 Time:</p>
          <p class="text-[#666] text-sm">
            <strong>6 eighth notes per measure.</strong> Each eighth note gets 1 beat, but they group into 2 strong beats. It feels like 1-2-3, 4-5-6 (or "one-and-a, two-and-a").
          </p>
        </div>
      </div>
    </div>

    <p class="text-[#444] leading-[1.7] mb-4">
      Examples of 6/8 time: "Twinkle Twinkle Little Star," sea shanties, and many folk melodies have that characteristic bouncy, swaying feel.
    </p>
  </section>

  <!-- Section 5: Listen to Yankee Doodle -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Listen to Yankee Doodle</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Let's listen to a piece written in 4/4 time: "Yankee Doodle." This famous American melody uses the standard 4/4 meter. Press play and count along with the beats!
    </p>

    <div class="bg-[#fdf6ee] border border-[#f0dcc8] rounded-lg p-4 mb-6">
      <p class="text-[#444] leading-[1.7] text-sm">
        <strong>Fingering Tip:</strong> Yankee Doodle mostly stays in C position. When the melody dips below C (to B3 or G3), the left hand takes over with fingers 1 (B) and 4 (G). Practice time signature changes without changing hand position first — this builds solid rhythmic awareness!
      </p>
    </div>

    {#if yankeeDoodle}
      {#each yankeeDoodle.lines as line, lineIdx}
        <div class="mb-6">
          <p class="text-sm text-[#999] mb-2">Line {lineIdx + 1}</p>
          <SongStaff notes={line} {highlightIndex} />
        </div>
      {/each}

      <button
        class="bg-purple text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity mb-6"
        onclick={playMelody}
      >
        {isPlaying ? 'Stop Playback' : 'Play Yankee Doodle'}
      </button>
    {/if}

    <div class="bg-[#fef3ee] border-l-4 border-purple rounded-lg p-4 mt-6">
      <p class="text-sm text-[#444]">
        <strong>💡 Try this:</strong> As you listen, clap on beats 1 and 3 (the strong and medium-strong beats in 4/4). You'll feel the natural pulse of the music!
      </p>
    </div>
  </section>

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test what you've learned about time signatures? Take the quiz below!
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >
        Start Quiz
      </button>
    {:else}
      <QuizEngine questions={quizQuestions} onComplete={onQuizComplete} />
    {/if}
  </section>
</LessonLayout>
