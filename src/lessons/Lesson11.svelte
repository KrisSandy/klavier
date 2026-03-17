<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import ChordDiagram from '../components/ChordDiagram.svelte';
  import EarTraining from '../components/EarTraining.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { playChord, playSequence } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';
  import { getNoteById } from '../data/notes';

  const lesson = getLessonById(11)!;
  const songs = getSongsByLesson(11);
  const song = songs[0]; // When the Saints

  let showQuiz = $state(false);
  let isPlayingProgression = $state(false);
  let highlightedChord = $state<number | null>(null);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Play the I-IV-V-I progression
  function playProgression(chords: Array<[string, number]>) {
    if (isPlayingProgression) return;
    isPlayingProgression = true;

    const offsets: Record<string, number> = {
      C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
    };

    let delay = 0;
    chords.forEach((chord, idx) => {
      const [root] = chord;
      const rootOff = offsets[root] ?? 0;
      const thirdOff = (rootOff + 4) % 12;
      const fifthOff = (rootOff + 7) % 12;

      const rootMidi = 60 + rootOff;
      const thirdMidi = 60 + thirdOff;
      const fifthMidi = 60 + fifthOff;

      setTimeout(() => {
        highlightedChord = idx;
        playChord([rootMidi, thirdMidi, fifthMidi], 1, 0.7);
      }, delay);

      delay += 1000;
    });

    setTimeout(() => {
      isPlayingProgression = false;
      highlightedChord = null;
    }, delay);
  }

  function generateQuestions(): QuizQuestion[] {
    const questions: QuizQuestion[] = [];

    // Q1: What chord is IV in C major?
    questions.push({
      id: 'q1',
      prompt: 'In C major, what chord is the IV (subdominant)?',
      correctAnswer: 'F major',
      choices: shuffle(['F major', 'G major', 'A minor', 'E minor']),
    });

    // Q2: What chord is V in C major?
    questions.push({
      id: 'q2',
      prompt: 'In C major, what chord is the V (dominant)?',
      correctAnswer: 'G major',
      choices: shuffle(['G major', 'F major', 'B diminished', 'E minor']),
    });

    // Q3: What chord is I in C major?
    questions.push({
      id: 'q3',
      prompt: 'In C major, what chord is the I (tonic)?',
      correctAnswer: 'C major',
      choices: shuffle(['C major', 'G major', 'F major', 'D minor']),
    });

    // Q4: What does Roman numeral V represent?
    questions.push({
      id: 'q4',
      prompt: 'What does the Roman numeral V represent in chord progressions?',
      correctAnswer: 'dominant',
      choices: shuffle(['dominant', 'tonic', 'subdominant', 'mediant']),
    });

    // Q5: What does Roman numeral I represent?
    questions.push({
      id: 'q5',
      prompt: 'What does the Roman numeral I represent?',
      correctAnswer: 'tonic',
      choices: shuffle(['tonic', 'dominant', 'subdominant', 'relative minor']),
    });

    // Q6: Most common Western progression
    questions.push({
      id: 'q6',
      prompt: 'What is the most common chord progression in Western music?',
      correctAnswer: 'I-IV-V-I',
      choices: shuffle(['I-IV-V-I', 'I-V-I', 'I-ii-IV-V', 'vi-IV-I-V']),
    });

    // Q7: Pop progression (I-V-vi-IV)
    questions.push({
      id: 'q7',
      prompt: 'What is the modern pop progression that uses vi-IV-I-V?',
      correctAnswer: 'vi-IV-I-V',
      choices: shuffle(['vi-IV-I-V', 'I-IV-V-I', 'I-V-vi-IV', 'ii-V-I']),
    });

    // Q8: Blues progression
    questions.push({
      id: 'q8',
      prompt: 'What is the classic 12-bar blues progression?',
      correctAnswer: 'I-IV-V',
      choices: shuffle(['I-IV-V', 'I-V-I', 'vi-IV-I-V', 'I-vi-IV-V']),
    });

    return questions;
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(11, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: What is a Chord Progression -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">What is a Chord Progression?</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      A <strong>chord progression</strong> is a <strong>sequence of chords played one after another</strong>. Instead of thinking about individual notes moving, think about the movement of harmony — how the chords change and flow.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      To name chord progressions clearly and universally, musicians use <strong>Roman numeral notation</strong>:
    </p>
    <div class="space-y-2 bg-white rounded-lg p-4 border-l-4 border-purple mb-4">
      <p class="text-[#444]"><strong>I (tonic)</strong> — the home chord, built on the first scale degree</p>
      <p class="text-[#444]"><strong>IV (subdominant)</strong> — built on the fourth scale degree</p>
      <p class="text-[#444]"><strong>V (dominant)</strong> — built on the fifth scale degree</p>
      <p class="text-[#444]"><strong>vi (relative minor)</strong> — built on the sixth scale degree</p>
    </div>
    <p class="text-[#444] leading-[1.7]">
      In <strong>C major</strong>, these Roman numerals correspond to specific chords:
      <strong>I = C major, IV = F major, V = G major, vi = A minor</strong>.
    </p>
  </section>

  <!-- Section 2: The I-IV-V-I Progression -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The I-IV-V-I Progression</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      The <strong>I-IV-V-I progression</strong> is the most fundamental and recognizable chord progression in Western music. You've heard it thousands of times. It creates a journey:
    </p>
    <ul class="text-[#444] text-sm space-y-2 mb-6 pl-5 list-disc">
      <li><strong>I (C)</strong> — home (tonic), stable and grounded</li>
      <li><strong>IV (F)</strong> — movement away (subdominant), opens a new color</li>
      <li><strong>V (G)</strong> — tension (dominant), wants to resolve back home</li>
      <li><strong>I (C)</strong> — resolution, returns to home and closure</li>
    </ul>
    <p class="text-[#444] leading-[1.7] mb-6">
      Click the button below to hear this progression:
    </p>
    <div class="flex gap-3 items-center mb-6">
      <button
        class="bg-navy text-white px-6 py-2 rounded-lg text-[0.95rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-50"
        onclick={() => playProgression([['C', 1], ['F', 1], ['G', 1], ['C', 1]])}
        disabled={isPlayingProgression}
      >
        {isPlayingProgression ? 'Playing...' : 'Play Progression'}
      </button>
    </div>

    <div class="flex gap-4 mb-6 flex-wrap justify-center">
      {#each ['C', 'F', 'G', 'C'] as root, idx}
        <div
          style="opacity: {highlightedChord === idx ? 1 : 0.6}; transition: opacity 0.2s;"
        >
          <ChordDiagram {root} octave={4} showLabels={true} interactive={false} />
        </div>
      {/each}
    </div>

    <p class="text-[#444] leading-[1.7] text-sm mb-3">
      <strong>Musicians call this progression the "pop progression" because it works everywhere:</strong>
    </p>
    <ul class="text-[#444] text-sm space-y-1 pl-5 list-disc">
      <li>Blues & rock music</li>
      <li>Country songs</li>
      <li>Pop ballads</li>
      <li>Gospel hymns</li>
    </ul>
  </section>

  <!-- Section 3: Common Progressions -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Common Progressions in Music</h2>
    <div class="space-y-4">
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-2">I-V-vi-IV (Modern Pop)</p>
        <p class="text-sm text-[#666] mb-3">
          Extremely popular in contemporary pop, hip-hop, and R&B. Creates an accessible, relatable emotional arc.
        </p>
        <div class="flex gap-3 flex-wrap">
          {#each ['C', 'G', 'A', 'F'] as root}
            <div>
              <ChordDiagram {root} octave={4} showLabels={true} interactive={false} quality={root === 'A' ? 'minor' : 'major'} />
            </div>
          {/each}
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-2">I-IV-V (Blues Progression)</p>
        <p class="text-sm text-[#666] mb-3">
          The foundation of blues, rock, and country music. Simple but powerful.
        </p>
        <div class="flex gap-3 flex-wrap">
          {#each ['C', 'F', 'G'] as root}
            <div>
              <ChordDiagram {root} octave={4} showLabels={true} interactive={false} />
            </div>
          {/each}
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-2">vi-IV-I-V (Emotional Progression)</p>
        <p class="text-sm text-[#666] mb-3">
          Starts in relative minor, creating a melancholic or introspective feel before resolving to major.
        </p>
        <div class="flex gap-3 flex-wrap">
          {#each [{ root: 'A', q: 'minor' }, { root: 'F', q: 'major' }, { root: 'C', q: 'major' }, { root: 'G', q: 'major' }] as item}
            <div>
              <ChordDiagram root={item.root} octave={4} showLabels={true} interactive={false} quality={item.q} />
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- Section 4: Play a Song with Chords -->
  {#if song}
    <section class="mb-10">
      <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">When the Saints Go Marching In</h2>
      <p class="text-[#444] leading-[1.7] mb-4">
        Here's a real piece that uses I-IV-V chord progressions. Listen to the song, then try playing the chords along with the melody:
      </p>
      <div class="mb-4 bg-white rounded-lg p-4">
        {#each song.lines as line, i}
          <div class="mb-2">
            <SongStaff notes={line} />
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Section 5: Ear Training -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Ear Training: Recognize Chord Progressions</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Train your ear to recognize these progressions by sound. Listen to each sequence and identify which progression it is:
    </p>
    <EarTraining mode="chord" />
  </section>

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of chord progressions and Roman numeral notation?
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
