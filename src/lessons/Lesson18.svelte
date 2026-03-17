<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import ChordDiagram from '../components/ChordDiagram.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { playNote, playChord } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(18)!;
  const songs = getSongsByLesson(18);
  const song = songs[0]; // Canon in D simplified

  let showQuiz = $state(false);
  let activeKey = $state<string | null>(null);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function handleNotePlay(note: string, midiNote: number) {
    playNote(midiNote, 1, 0.6);
    activeKey = note;
    setTimeout(() => { activeKey = null; }, 200);
  }

  // Canon in D chord progression
  const canonChords = [
    { root: 'D', quality: 'major' as const, label: 'D' },
    { root: 'A', quality: 'major' as const, label: 'A' },
    { root: 'B', quality: 'minor' as const, label: 'Bm' },
    { root: 'F', quality: 'major' as const, label: 'F#m' },
    { root: 'G', quality: 'major' as const, label: 'G' },
    { root: 'D', quality: 'major' as const, label: 'D' },
    { root: 'G', quality: 'major' as const, label: 'G' },
    { root: 'A', quality: 'major' as const, label: 'A' },
  ];

  function generateQuestions(): QuizQuestion[] {
    return [
      {
        id: 'q1',
        prompt: 'When performing a piece, what should you consider first?',
        correctAnswer: 'Key signature, time signature, and tempo',
        choices: shuffle(['Key signature, time signature, and tempo', 'The title only', 'The last note', 'The dynamics only']),
      },
      {
        id: 'q2',
        prompt: 'What does "musical expression" mean?',
        correctAnswer: 'Using dynamics, tempo, and articulation to convey emotion',
        choices: shuffle(['Using dynamics, tempo, and articulation to convey emotion', 'Playing as fast as possible', 'Playing every note at the same volume', 'Following the score exactly with no interpretation']),
      },
      {
        id: 'q3',
        prompt: 'Rubato means...',
        correctAnswer: 'Flexible tempo — speeding up and slowing down for expression',
        choices: shuffle(['Flexible tempo — speeding up and slowing down for expression', 'Playing very fast', 'Playing very quietly', 'Stopping between phrases']),
      },
      {
        id: 'q4',
        prompt: 'What is the best way to prepare a new piece?',
        correctAnswer: 'Scan the whole piece first, then learn section by section',
        choices: shuffle(['Scan the whole piece first, then learn section by section', 'Start at the beginning and play through without stopping', 'Memorise it immediately', 'Only practise the difficult parts']),
      },
      {
        id: 'q5',
        prompt: 'What is a good daily practice routine?',
        correctAnswer: 'Warm-up scales, technique work, piece practice, and review',
        choices: shuffle(['Warm-up scales, technique work, piece practice, and review', 'Play through your favourite pieces only', 'Only practice for 5 minutes', 'Skip warm-ups and jump to the hardest piece']),
      },
      {
        id: 'q6',
        prompt: 'Pachelbel\'s Canon in D uses which chord progression?',
        correctAnswer: 'D - A - Bm - F#m - G - D - G - A',
        choices: shuffle(['D - A - Bm - F#m - G - D - G - A', 'C - G - Am - F', 'G - D - Em - C', 'A - E - F#m - D']),
      },
      {
        id: 'q7',
        prompt: 'How many lessons have you completed in this course so far?',
        correctAnswer: '18 (this is the final lesson!)',
        choices: shuffle(['18 (this is the final lesson!)', '12', '6', '24']),
      },
      {
        id: 'q8',
        prompt: 'What should you do after completing this course?',
        correctAnswer: 'Continue practising daily and learn new pieces',
        choices: shuffle(['Continue practising daily and learn new pieces', 'Stop practising', 'Start a different instrument', 'Only review these lessons']),
      },
      {
        id: 'q9',
        prompt: 'Which of these combines reading, rhythm, dynamics, and chords?',
        correctAnswer: 'Performing a complete piece with expression',
        choices: shuffle(['Performing a complete piece with expression', 'Playing a scale', 'Clapping a rhythm', 'Playing a single chord']),
      },
      {
        id: 'q10',
        prompt: 'Phrasing in music is similar to...',
        correctAnswer: 'Sentences in speech — natural groupings with breaths between them',
        choices: shuffle(['Sentences in speech — natural groupings with breaths between them', 'Playing every note at the same volume', 'Adding accidentals to notes', 'Changing the key signature']),
      },
    ];
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(18, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: The Journey So Far -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Your Musical Journey</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Congratulations — you've made it to the final lesson! Let's take a moment to appreciate everything you've learned:
    </p>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-white rounded-lg p-3 border-l-4 border-purple">
        <p class="font-semibold text-navy text-sm">Module 1-2</p>
        <p class="text-xs text-[#444]">Keyboard layout, note reading, both hands, scales</p>
      </div>
      <div class="bg-white rounded-lg p-3 border-l-4 border-purple">
        <p class="font-semibold text-navy text-sm">Module 3-4</p>
        <p class="text-xs text-[#444]">Rhythm, dynamics, chords, progressions, major & minor</p>
      </div>
      <div class="bg-white rounded-lg p-3 border-l-4 border-purple">
        <p class="font-semibold text-navy text-sm">Module 5</p>
        <p class="text-xs text-[#444]">Sight-reading, key signatures, intervals</p>
      </div>
      <div class="bg-white rounded-lg p-3 border-l-4 border-purple">
        <p class="font-semibold text-navy text-sm">Module 6</p>
        <p class="text-xs text-[#444]">Pedaling, musical form, and now — performance!</p>
      </div>
    </div>
    <p class="text-[#444] leading-[1.7]">
      Now it's time to bring everything together in a complete performance piece.
    </p>
  </section>

  <!-- Section 2: Performance Preparation -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Preparing a Performance</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Before you play a piece, go through this checklist:
    </p>
    <div class="space-y-3 mb-4">
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">1</span>
        <div>
          <p class="text-[#444]"><strong>Analyse the score.</strong> Check key signature, time signature, tempo marking, and dynamic markings.</p>
        </div>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">2</span>
        <div>
          <p class="text-[#444]"><strong>Identify the form.</strong> Where are the sections? Are there repeats? Where is the climax?</p>
        </div>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">3</span>
        <div>
          <p class="text-[#444]"><strong>Find the tricky spots.</strong> Identify passages that need extra practice before you play through.</p>
        </div>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">4</span>
        <div>
          <p class="text-[#444]"><strong>Set the mood.</strong> Think about what emotion the piece conveys and how you'll express it.</p>
        </div>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">5</span>
        <div>
          <p class="text-[#444]"><strong>Play through slowly first.</strong> Get the notes right, then gradually increase tempo.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 3: Canon in D -->
  {#if song}
    <section class="mb-10">
      <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">{song.title} ({song.composer})</h2>
      <p class="text-[#444] leading-[1.7] mb-3">
        Pachelbel's Canon is one of the most recognizable pieces in Western music. Its famous chord progression (D – A – Bm – F#m – G – D – G – A) has been borrowed by hundreds of pop songs. This simplified melody captures the descending sequence that makes it so beautiful.
      </p>
      <p class="text-[#444] leading-[1.7] mb-4">
        <strong>Key:</strong> {song.keySignature} | <strong>Time:</strong> {song.timeSignature[0]}/{song.timeSignature[1]} | <strong>Tempo:</strong> {song.bpm} BPM
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

  <!-- Section 4: Interactive Keyboard -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Play Along</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Use the keyboard below to play through the Canon melody. Take it slowly — accuracy first, speed later:
    </p>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
      <VirtualKeyboard startOctave={3} endOctave={5} onNotePlay={handleNotePlay} {activeKey} showLabels={true} />
    </div>
  </section>

  <!-- Section 5: Your Practice Routine -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Building Your Practice Routine</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Now that you've completed the course, here's a suggested daily practice routine to keep improving:
    </p>
    <div class="space-y-3">
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-purple font-bold text-xl">5 min</span>
          <div>
            <p class="font-semibold text-navy">Warm-up</p>
            <p class="text-sm text-[#444]">Play scales (C, G, D, F major + A minor). Use the metronome.</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-purple font-bold text-xl">5 min</span>
          <div>
            <p class="font-semibold text-navy">Sight-Reading</p>
            <p class="text-sm text-[#444]">Use the sight-reading drill (Lesson 13) or find new sheet music to read.</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-purple font-bold text-xl">10 min</span>
          <div>
            <p class="font-semibold text-navy">Piece Practice</p>
            <p class="text-sm text-[#444]">Work on a piece you're learning. Focus on the difficult sections.</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-purple font-bold text-xl">5 min</span>
          <div>
            <p class="font-semibold text-navy">Ear Training</p>
            <p class="text-sm text-[#444]">Use the interval trainer (Lesson 15) or ear training (Practice page).</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0]">
        <div class="flex items-center gap-3">
          <span class="text-purple font-bold text-xl">5 min</span>
          <div>
            <p class="font-semibold text-navy">Free Play</p>
            <p class="text-sm text-[#444]">Play something you enjoy. Experiment. Have fun!</p>
          </div>
        </div>
      </div>
    </div>
    <p class="text-[#444] leading-[1.7] mt-4">
      <strong>Consistency beats intensity.</strong> 30 minutes every day is far more effective than 3 hours once a week. Make it a habit, and you'll be amazed how quickly you progress.
    </p>
  </section>

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Final Quiz</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        One last quiz to wrap up the course. This one covers everything — performance, expression, practice habits, and the Canon in D:
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >Start Final Quiz</button>
    {:else}
      <QuizEngine questions={quizData} onComplete={onQuizComplete} />
    {/if}
  </section>

  <!-- Congratulations -->
  <section class="mb-10">
    <div class="bg-[#fdf6f0] rounded-lg p-6 border-2 border-purple text-center">
      <h2 class="text-[1.3rem] font-bold text-navy mb-3">Congratulations!</h2>
      <p class="text-[#444] leading-[1.7] mb-3">
        You've completed all 18 lessons of Klavier. You now have a solid foundation in piano — from reading notes to playing chords, from understanding rhythm to performing with expression.
      </p>
      <p class="text-[#444] leading-[1.7]">
        Keep practising, keep exploring, and most importantly — keep enjoying the music. The piano is an instrument you can enjoy for a lifetime.
      </p>
    </div>
  </section>
</LessonLayout>
