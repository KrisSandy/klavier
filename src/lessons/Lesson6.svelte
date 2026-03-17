<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import Metronome from '../components/Metronome.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { getNoteById } from '../data/notes';
  import { playNote, playSequence } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(6)!;
  const songs = getSongsByLesson(6);
  const waltz = songs[0]; // Simple Waltz

  let isPlaying = $state(false);
  let highlightIndex = $state(-1);
  let playbackStop: { stop: () => void } | null = null;
  let showQuiz = $state(false);

  function playMelody() {
    if (isPlaying && playbackStop) {
      playbackStop.stop();
      isPlaying = false;
      highlightIndex = -1;
      return;
    }

    // Get all notes from all lines
    const allNotes = waltz.lines.flat();
    const noteSequence = allNotes.map(id => {
      const note = getNoteById(id);
      return { midiNote: note?.midiNote ?? 60, duration: 1 };
    });

    isPlaying = true;
    playbackStop = playSequence(noteSequence, waltz.bpm, (index) => {
      highlightIndex = index;
    });

    // Auto-stop after sequence finishes
    const totalDuration = noteSequence.length * (60 / waltz.bpm) * 1000;
    setTimeout(() => {
      isPlaying = false;
      highlightIndex = -1;
    }, totalDuration + 200);
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Generate G major scale quiz questions
  function generateQuestions(): QuizQuestion[] {
    const qs: QuizQuestion[] = [];

    // Rest identification questions
    const restQuestions = [
      {
        id: 'rest-whole',
        prompt: 'How many beats of silence does a whole rest get?',
        answer: '4',
      },
      {
        id: 'rest-half',
        prompt: 'How many beats of silence does a half rest get?',
        answer: '2',
      },
      {
        id: 'rest-quarter',
        prompt: 'How many beats of silence does a quarter rest get?',
        answer: '1',
      },
    ];

    // G major scale and key signature questions
    const scaleQuestions = [
      {
        id: 'gmaj-sharp',
        prompt: 'What is the only sharp in the key of G major?',
        answer: 'F#',
      },
      {
        id: 'gmaj-start',
        prompt: 'What note does the G major scale start on?',
        answer: 'G',
      },
      {
        id: 'gmaj-3rd',
        prompt: 'What is the 3rd note of the G major scale?',
        answer: 'B',
      },
      {
        id: 'gmaj-5th',
        prompt: 'What is the 5th note of the G major scale?',
        answer: 'D',
      },
      {
        id: 'gmaj-7th',
        prompt: 'What is the 7th note of the G major scale?',
        answer: 'F#',
      },
      {
        id: 'gmaj-sharps',
        prompt: 'How many sharps are in the key of G major?',
        answer: '1',
      },
      {
        id: 'time-sig',
        prompt: 'In 3/4 time, how many beats are in each measure?',
        answer: '3',
      },
    ];

    // Combine and shuffle
    const allQuestions = shuffle([...restQuestions, ...scaleQuestions]);

    // Take first 10 for the quiz
    for (let i = 0; i < Math.min(10, allQuestions.length); i++) {
      const q = allQuestions[i];
      let choices: string[];

      // Generate appropriate choices based on answer type
      if (q.answer === '4' || q.answer === '2' || q.answer === '1' || q.answer === '3') {
        // Beat-count questions
        choices = shuffle(['1', '2', '3', '4']);
      } else if (q.answer === 'F#') {
        // Sharp questions
        choices = shuffle(['F#', 'C#', 'Bb', 'G#']);
      } else if (q.answer === 'G' || q.answer === 'B' || q.answer === 'D') {
        // Note name questions
        choices = shuffle([q.answer, ...['A', 'C', 'E', 'F'].slice(0, 3)]);
      } else {
        // Fallback
        choices = shuffle([q.answer, '2', '3', '4']);
      }

      qs.push({
        id: q.id,
        prompt: q.prompt,
        correctAnswer: q.answer,
        choices,
      });
    }

    return qs;
  }

  let quizQuestions = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(6, score, total, 0);
  }

  function startQuiz() {
    quizQuestions = generateQuestions();
    showQuiz = true;
  }

  // G major scale notes
  const gMajorNotes = ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'];
</script>

<LessonLayout {lesson}>
  <!-- Section 1: Rest Symbols -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Rest Symbols</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Just like notes tell you what to <em>play</em>, rests tell you to be <em>silent</em> for a certain number of beats. Rests come in different shapes, just like notes, and each shape means a different duration.
    </p>

    <div class="grid grid-cols-3 gap-6 mb-6">
      <!-- Whole rest -->
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] text-center">
        <div class="mb-4 flex justify-center h-16">
          <svg viewBox="0 0 100 80" width="80" height="80">
            <line x1="20" y1="40" x2="80" y2="40" stroke="black" stroke-width="1.5" />
            <line x1="20" y1="60" x2="80" y2="60" stroke="black" stroke-width="1.5" />
            <line x1="20" y1="80" x2="80" y2="80" stroke="black" stroke-width="1.5" />
            <!-- Whole rest hanging below line 2 -->
            <rect x="40" y="45" width="20" height="10" fill="black" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-2">Whole Rest</p>
        <p class="text-sm text-[#666]"><strong>4 beats</strong> of silence</p>
        <p class="text-xs text-[#999] mt-2">Hangs below a line</p>
      </div>

      <!-- Half rest -->
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] text-center">
        <div class="mb-4 flex justify-center h-16">
          <svg viewBox="0 0 100 80" width="80" height="80">
            <line x1="20" y1="40" x2="80" y2="40" stroke="black" stroke-width="1.5" />
            <line x1="20" y1="60" x2="80" y2="60" stroke="black" stroke-width="1.5" />
            <line x1="20" y1="80" x2="80" y2="80" stroke="black" stroke-width="1.5" />
            <!-- Half rest sitting on line 3 -->
            <rect x="40" y="35" width="20" height="10" fill="black" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-2">Half Rest</p>
        <p class="text-sm text-[#666]"><strong>2 beats</strong> of silence</p>
        <p class="text-xs text-[#999] mt-2">Sits on a line</p>
      </div>

      <!-- Quarter rest -->
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] text-center">
        <div class="mb-4 flex justify-center h-16">
          <svg viewBox="0 0 100 80" width="80" height="80">
            <line x1="20" y1="40" x2="80" y2="40" stroke="black" stroke-width="1.5" />
            <line x1="20" y1="60" x2="80" y2="60" stroke="black" stroke-width="1.5" />
            <line x1="20" y1="80" x2="80" y2="80" stroke="black" stroke-width="1.5" />
            <!-- Quarter rest - simplified zigzag -->
            <polyline
              points="50,30 55,40 45,50 55,60 50,70"
              stroke="black"
              stroke-width="2"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <p class="font-bold text-navy mb-2">Quarter Rest</p>
        <p class="text-sm text-[#666]"><strong>1 beat</strong> of silence</p>
        <p class="text-xs text-[#999] mt-2">A squiggly line</p>
      </div>
    </div>

    <p class="text-[#444] leading-[1.7] text-sm bg-[#fef3ee] border-l-4 border-purple px-4 py-3 rounded">
      💡 <strong>Memory tip:</strong> Rests work just like notes — the same duration rules apply. A whole rest = 4 beats, a half rest = 2 beats, a quarter rest = 1 beat. Use silence like you use notes!
    </p>
  </section>

  <!-- Section 2: The G Major Scale -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The G Major Scale</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Now that you've mastered the C major scale, let's learn a new one: <strong>G major</strong>. It has the same interval pattern as C major (whole, whole, half, whole, whole, whole, half), but it starts on a different note: <strong>G</strong>.
    </p>

    <p class="text-[#444] leading-[1.7] mb-4">
      <strong>G A B C D E F# G</strong> — Notice something new? The 7th note is <strong>F#</strong> (F sharp), not F natural. This is the <strong>key signature of G major</strong>.
    </p>

    <!-- G Major notes on keyboard -->
    <div class="bg-[#faf9f5] rounded-lg p-6 border border-[#dad9d4] mb-6">
      <p class="text-sm font-semibold text-navy mb-4">G Major Scale — Press play or click the keys:</p>
      <VirtualKeyboard startOctave={3} endOctave={5} highlightKeys={gMajorNotes} showLabels={true} />
    </div>

    <div class="space-y-3">
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-1">The One Sharp: F#</p>
        <p class="text-sm text-[#666]">In G major, <strong>every F you see is played as F#</strong>. This sharp appears in the key signature (at the beginning of each staff), so you know to play all F's as sharps automatically.</p>
      </div>
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-1">Why G Major?</p>
        <p class="text-sm text-[#666]">G major is the first scale with a sharp. Many famous pieces are written in G major because it sounds bright and warm on the piano.</p>
      </div>
    </div>
  </section>

  <!-- Section 3: F Sharp in Context -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">F Sharp — Your First Accidental</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      An <strong>accidental</strong> is a symbol that modifies a natural note. We've seen the sharp symbol (♯) before, but now you're encountering it in an actual musical context. In the key of G major, F# appears in the key signature, so it's "built in" — you don't need to learn to read an accidental symbol separately.
    </p>

    <div class="bg-white rounded-lg p-5 border border-[#e8e6e0]">
      <p class="font-semibold text-navy mb-3">F Natural vs. F#</p>
      <div class="flex gap-8 justify-center mb-4">
        <div class="text-center">
          <p class="text-sm text-[#999] mb-2">F Natural (white key)</p>
          <VirtualKeyboard startOctave={3} endOctave={4} highlightKeys={['F4']} showLabels={true} />
        </div>
        <div class="text-center">
          <p class="text-sm text-[#999] mb-2">F# (black key)</p>
          <VirtualKeyboard startOctave={3} endOctave={4} highlightKeys={['F#4']} showLabels={true} />
        </div>
      </div>
      <p class="text-sm text-[#666] text-center">F# is the black key between F and G. In G major, you'll play this black key every time you see an F.</p>
    </div>
  </section>

  <!-- Section 4: Simple Waltz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Simple Waltz in 3/4 Time</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here's a beautiful short piece in 3/4 time (waltz time: 1-2-3, 1-2-3) using the G major scale and F#. This piece is shorter and simpler than Kushi, so it's a great next step in your journey.
    </p>

    {#if waltz}
      {#each waltz.lines as line, lineIdx}
        <div class="mb-6">
          <p class="text-sm text-[#999] mb-2">Line {lineIdx + 1}</p>
          <SongStaff notes={line} {highlightIndex} />
        </div>
      {/each}

      <!-- Play button -->
      <button
        class="bg-purple text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity mb-6"
        onclick={playMelody}
      >
        {isPlaying ? 'Stop Playback' : 'Play Waltz'}
      </button>

      <!-- Note sequence -->
      <div class="mb-6">
        <p class="text-sm font-semibold text-navy mb-2">Note sequence:</p>
        <p class="text-[#666] text-sm font-mono bg-white px-4 py-2 rounded border border-[#e8e6e0]">
          {waltz.lines.flat().join(' → ')}
        </p>
      </div>
    {/if}

    <!-- Metronome for 3/4 time -->
    <div class="mt-8">
      <p class="text-sm font-semibold text-navy mb-3">Practice with a waltz tempo (3/4 time):</p>
      <Metronome initialBpm={waltz?.bpm || 108} />
    </div>
  </section>

  <!-- Section 5: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test what you've learned? Answer questions about rests, the G major scale, and sharps. You've got this!
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >Start Quiz</button>
    {:else}
      <QuizEngine questions={quizQuestions} onComplete={onQuizComplete} />
    {/if}
  </section>
</LessonLayout>
