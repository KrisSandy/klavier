<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import ChordDiagram from '../components/ChordDiagram.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import EarTraining from '../components/EarTraining.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { playChord } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(13)!;
  const songs = getSongsByLesson(12);
  const song = songs[0]; // Scarborough Fair

  let showQuiz = $state(false);
  let highlightedScale = $state<string[]>([]);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Highlight A natural minor scale on keyboard
  function showAMinorScale() {
    highlightedScale = ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
  }

  function playChordDemo(root: string, quality: 'major' | 'minor') {
    const offsets: Record<string, number> = {
      C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
    };
    const rootOff = offsets[root] ?? 0;
    const thirdInterval = quality === 'minor' ? 3 : 4;
    const thirdOff = (rootOff + thirdInterval) % 12;
    const fifthOff = (rootOff + 7) % 12;

    const rootMidi = 60 + rootOff;
    const thirdMidi = 60 + thirdOff;
    const fifthMidi = 60 + fifthOff;

    playChord([rootMidi, thirdMidi, fifthMidi], 1, 0.7);
  }

  function generateQuestions(): QuizQuestion[] {
    const questions: QuizQuestion[] = [];

    // Q1: Semitones in minor third
    questions.push({
      id: 'q1',
      prompt: 'How many semitones from root to third in a minor chord?',
      correctAnswer: '3',
      choices: shuffle(['3', '4', '5', '6']),
    });

    // Q2: What does minor sound like
    questions.push({
      id: 'q2',
      prompt: 'What emotional quality does a minor chord typically convey?',
      correctAnswer: 'sad, dark, introspective',
      choices: shuffle(['sad, dark, introspective', 'happy, bright, cheerful', 'energetic, powerful, dominant', 'soft, gentle, delicate']),
    });

    // Q3: Difference between major and minor
    questions.push({
      id: 'q3',
      prompt: 'What is the main difference between a major and minor triad?',
      correctAnswer: 'the third interval (3 vs 4 semitones)',
      choices: shuffle(['the third interval (3 vs 4 semitones)', 'the fifth interval', 'the root note', 'the number of notes']),
    });

    // Q4: What notes make up Am
    questions.push({
      id: 'q4',
      prompt: 'What three notes make up an A minor chord?',
      correctAnswer: 'A, C, E',
      choices: shuffle(['A, C, E', 'A, C#, E', 'A, D, E', 'A, C, F']),
    });

    // Q5: What notes make up Dm
    questions.push({
      id: 'q5',
      prompt: 'What three notes make up a D minor chord?',
      correctAnswer: 'D, F, A',
      choices: shuffle(['D, F, A', 'D, F#, A', 'D, G, A', 'D, E, A']),
    });

    // Q6: What notes make up Em
    questions.push({
      id: 'q6',
      prompt: 'What three notes make up an E minor chord?',
      correctAnswer: 'E, G, B',
      choices: shuffle(['E, G, B', 'E, G#, B', 'E, F#, B', 'E, G, C']),
    });

    // Q7: Relative minor of C major
    questions.push({
      id: 'q7',
      prompt: 'What is the relative minor of C major?',
      correctAnswer: 'A minor',
      choices: shuffle(['A minor', 'G minor', 'B minor', 'D minor']),
    });

    // Q8: What is A natural minor scale
    questions.push({
      id: 'q8',
      prompt: 'What are the notes of the A natural minor scale?',
      correctAnswer: 'A B C D E F G',
      choices: shuffle(['A B C D E F G', 'A B C# D E F# G#', 'A B C D E F# G#', 'A B C D E F# G']),
    });

    // Q9: Identify chord by sound or description
    questions.push({
      id: 'q9',
      prompt: 'Which chord sounds more "dark" or "sad"?',
      correctAnswer: 'A minor',
      choices: shuffle(['A minor', 'A major', 'C major', 'G major']),
    });

    // Q10: Major vs minor in same key
    questions.push({
      id: 'q10',
      prompt: 'How many shared notes does C major (C E G) have with its relative minor (A C E)?',
      correctAnswer: '2 notes (C and E)',
      choices: shuffle(['2 notes (C and E)', '1 note (C)', '3 notes (all)', '0 notes (none)']),
    });

    return questions;
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(12, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: Major vs Minor -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Major vs Minor</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Listen to the difference between a major chord and a minor chord. They use the same root and fifth, but the <strong>third</strong> is different:
    </p>
    <div class="flex gap-8 mb-6 items-start">
      <div class="flex-1">
        <p class="font-semibold text-navy mb-2">C Major (C E G)</p>
        <p class="text-sm text-[#666] mb-3">Bright, happy, complete</p>
        <button
          class="text-sm bg-white border-2 border-navy text-navy px-4 py-2 rounded-lg cursor-pointer hover:bg-navy hover:text-white transition-all"
          onclick={() => playChordDemo('C', 'major')}
        >Play C Major</button>
      </div>
      <div class="flex-1">
        <p class="font-semibold text-navy mb-2">C Minor (C Eb G)</p>
        <p class="text-sm text-[#666] mb-3">Dark, sad, introspective</p>
        <button
          class="text-sm bg-white border-2 border-navy text-navy px-4 py-2 rounded-lg cursor-pointer hover:bg-navy hover:text-white transition-all"
          onclick={() => playChordDemo('C', 'minor')}
        >Play C Minor</button>
      </div>
    </div>
    <p class="text-[#444] leading-[1.7] mb-3">
      The only difference is <strong>one semitone</strong> — the third interval:
    </p>
    <ul class="text-[#444] text-sm space-y-1 pl-5 list-disc mb-4">
      <li><strong>Major chord:</strong> 4 semitones from root to third (major third)</li>
      <li><strong>Minor chord:</strong> 3 semitones from root to third (minor third)</li>
      <li><strong>Both:</strong> 7 semitones from root to fifth (perfect fifth)</li>
    </ul>
    <p class="text-[#444] leading-[1.7]">
      This single change creates a completely different emotional color. That's the power of understanding intervals!
    </p>
  </section>

  <!-- Section 2: Minor Triads -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Minor Triads</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      The pattern for minor chords is always: <strong>root + 3 semitones (minor third) + 7 semitones (perfect fifth)</strong>. Here are three of the most common minor chords:
    </p>
    <div class="flex gap-6 mb-6 flex-wrap justify-center">
      {#each ['A', 'D', 'E'] as root}
        <button onclick={() => playChordDemo(root, 'minor')} style="cursor: pointer; background: none; border: none; padding: 0;" aria-label="Play {root} minor chord">
          <ChordDiagram {root} octave={4} quality="minor" showLabels={true} interactive={true} />
        </button>
      {/each}
    </div>
    <p class="text-[#444] leading-[1.7] text-sm mb-3">
      <strong>Notice:</strong> The chord diagram shows only the white keys (natural notes) that make up each minor triad. These are the three notes you play together.
    </p>
    <div class="space-y-2 bg-white rounded-lg p-4 border-l-4 border-purple">
      <p class="text-[#444]"><strong>A minor:</strong> A + C + E</p>
      <p class="text-[#444]"><strong>D minor:</strong> D + F + A</p>
      <p class="text-[#444]"><strong>E minor:</strong> E + G + B</p>
    </div>
  </section>

  <!-- Section 3: Minor Chord Fingering -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Minor Chord Fingering</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      The great news: minor triads use exactly the same 1-3-5 fingering as major triads. The hand shape is identical — only the middle note changes.
    </p>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-4">
      <p class="text-[#444] mb-3"><strong>Minor triad fingering: 1-3-5 (same pattern as major)</strong></p>
      <p class="text-[#444] text-sm leading-[1.7]">
        Use <strong>fingers 1 (thumb), 3 (middle), and 5 (pinky)</strong> for minor chords just like major chords:
      </p>
      <ul class="text-[#444] text-sm space-y-2 mt-3 pl-5 list-disc">
        <li><strong>Right hand:</strong> Fingers 1-3-5 play root, third, fifth (ascending)</li>
        <li><strong>Left hand:</strong> Fingers 5-3-1 play root, third, fifth (descending)</li>
      </ul>
    </div>
    <div class="space-y-3 mb-4">
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
        <p class="font-semibold text-navy mb-2">A Minor Chord</p>
        <p class="text-sm text-[#666] mb-2"><strong>Right hand:</strong> 1(A) - 3(C) - 5(E)</p>
        <p class="text-sm text-[#666]"><strong>Left hand:</strong> 5(A) - 3(C) - 1(E)</p>
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
        <p class="font-semibold text-navy mb-2">D Minor Chord</p>
        <p class="text-sm text-[#666] mb-2"><strong>Right hand:</strong> 1(D) - 3(F) - 5(A)</p>
        <p class="text-sm text-[#666]"><strong>Left hand:</strong> 5(D) - 3(F) - 1(A)</p>
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
        <p class="font-semibold text-navy mb-2">E Minor Chord</p>
        <p class="text-sm text-[#666] mb-2"><strong>Right hand:</strong> 1(E) - 3(G) - 5(B)</p>
        <p class="text-sm text-[#666]"><strong>Left hand:</strong> 5(E) - 3(G) - 1(B)</p>
      </div>
    </div>
    <div class="bg-blue-50 rounded-lg border-l-4 border-blue-400 p-4">
      <p class="text-sm text-[#444]">
        <strong>Key insight:</strong> The hand shape is always the same — your fingers form a 1-3-5 pattern. The only difference between a major and minor chord is that the middle note is lowered by a half step. Your fingers already know how to play it!
      </p>
    </div>
  </section>

  <!-- Section 4: The A Minor Scale -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The A Natural Minor Scale</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Just as we learned the C major scale, we can learn scales in minor keys. The <strong>A natural minor scale</strong> consists of the notes:
    </p>
    <div class="bg-white rounded-lg p-4 border-l-4 border-purple mb-4 text-center">
      <p class="text-[1.1rem] font-mono font-semibold text-navy">A B C D E F G A</p>
    </div>
    <p class="text-[#444] leading-[1.7] mb-4">
      Interestingly, these are the <strong>same notes as C major scale</strong>, just starting from a different point! Try playing the scale on the keyboard below:
    </p>
    <div class="mb-4 bg-white rounded-lg p-4">
      <button
        class="text-sm bg-navy text-white px-4 py-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-3"
        onclick={showAMinorScale}
      >Highlight A Minor Scale</button>
      <VirtualKeyboard startOctave={3} endOctave={5} showLabels={true} highlightKeys={highlightedScale} />
    </div>
  </section>

  <!-- Section 5: Relative Major and Minor -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Relative Major and Minor</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Every major key has a <strong>relative minor</strong> — they share the same notes but start from a different point:
    </p>
    <div class="bg-white rounded-lg p-4 border-l-4 border-purple mb-4">
      <p class="text-[#444] mb-2"><strong>C Major scale:</strong> C D E F G A B (starts on C)</p>
      <p class="text-[#444]"><strong>A Minor scale:</strong> A B C D E F G (same notes, starts on A)</p>
    </div>
    <p class="text-[#444] leading-[1.7] mb-4">
      The relationship is always: <strong>the relative minor is 3 semitones (a minor third) below the major key</strong>. So:
    </p>
    <ul class="text-[#444] text-sm space-y-1 pl-5 list-disc mb-4">
      <li>C major → A minor (relative minor)</li>
      <li>G major → E minor</li>
      <li>F major → D minor</li>
      <li>D major → B minor</li>
    </ul>
    <p class="text-[#444] leading-[1.7]">
      This relationship is one of the most important structural patterns in Western music. You'll see it everywhere.
    </p>
  </section>

  <!-- Section 6: Play Scarborough Fair -->
  {#if song}
    <section class="mb-10">
      <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Scarborough Fair (A Minor)</h2>
      <p class="text-[#444] leading-[1.7] mb-4">
        This traditional ballad is written in A minor. Notice how the melody is built from the A minor scale, and the overall sound is introspective and melancholic:
      </p>
      <div class="mb-4 bg-white rounded-lg p-4">
        {#each song.lines as line}
          <div class="mb-2">
            <SongStaff notes={line} />
          </div>
        {/each}
      </div>
      <p class="text-[#444] leading-[1.7] text-sm">
        Try playing this melody while thinking about the A minor scale and the A minor chord (A C E). The song "comes home" to these anchor points.
      </p>
    </section>
  {/if}

  <!-- Section 7: Ear Training -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Ear Training: Major vs Minor Chords</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Train your ear to distinguish major from minor chords instantly. Listen to each chord and identify whether it's major or minor:
    </p>
    <EarTraining mode="chord" />
  </section>

  <!-- Section 8: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of minor chords, minor scales, and the relationship between major and minor?
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
