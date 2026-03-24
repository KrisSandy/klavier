<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import ChordDiagram from '../components/ChordDiagram.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { playChord } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(11)!;

  let showQuiz = $state(false);
  let activeChord = $state<string | null>(null);

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
    const chordRoots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const semitones = [3, 4, 7];

    // Q1-3: "What notes make up X major chord?"
    ['C', 'F', 'G'].forEach((root, i) => {
      const offsets: Record<string, number> = {
        C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
      };
      const rootOff = offsets[root] ?? 0;
      const thirdNote = Object.entries(offsets).find(([_, v]) => v === (rootOff + 4) % 12)?.[0] || 'E';
      const fifthNote = Object.entries(offsets).find(([_, v]) => v === (rootOff + 7) % 12)?.[0] || 'G';
      const correct = `${root}, ${thirdNote}, ${fifthNote}`;
      const distractors = [
        `${root}, ${thirdNote}, ${Object.entries(offsets).find(([_, v]) => v === (rootOff + 6) % 12)?.[0] || 'F#'}`,
        `${root}, ${Object.entries(offsets).find(([_, v]) => v === (rootOff + 3) % 12)?.[0] || 'D#'}, ${fifthNote}`,
        `${thirdNote}, ${fifthNote}, ${root}`,
      ];
      questions.push({
        id: `q${i + 1}`,
        prompt: `What three notes make up a ${root} major chord?`,
        correctAnswer: correct,
        choices: shuffle([correct, ...distractors]),
      });
    });

    // Q4: Semitones in major third
    questions.push({
      id: 'q4',
      prompt: 'How many semitones is a major third?',
      correctAnswer: '4',
      choices: shuffle(['4', '3', '5', '6']),
    });

    // Q5: Semitones in perfect fifth
    questions.push({
      id: 'q5',
      prompt: 'How many semitones is a perfect fifth?',
      correctAnswer: '7',
      choices: shuffle(['7', '6', '8', '5']),
    });

    // Q6-8: What is the fifth/third of X?
    questions.push({
      id: 'q6',
      prompt: 'What is the fifth of C?',
      correctAnswer: 'G',
      choices: shuffle(['G', 'E', 'B', 'F']),
    });

    questions.push({
      id: 'q7',
      prompt: 'What is the major third of F?',
      correctAnswer: 'A',
      choices: shuffle(['A', 'G', 'B', 'C']),
    });

    questions.push({
      id: 'q8',
      prompt: 'What is the fifth of G?',
      correctAnswer: 'D',
      choices: shuffle(['D', 'B', 'E', 'C']),
    });

    // Q9: Identify chord from note list
    questions.push({
      id: 'q9',
      prompt: 'Which chord is made from C, E, and G?',
      correctAnswer: 'C major',
      choices: shuffle(['C major', 'E major', 'G major', 'F major']),
    });

    // Q10: Pattern of major triad
    questions.push({
      id: 'q10',
      prompt: 'What is the interval pattern for a major triad (root, third, fifth)?',
      correctAnswer: '0, 4, 7 semitones',
      choices: shuffle(['0, 4, 7 semitones', '0, 3, 7 semitones', '0, 4, 8 semitones', '0, 3, 6 semitones']),
    });

    return questions;
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(10, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }

  function playChordDemo(root: string) {
    const offsets: Record<string, number> = {
      C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
    };
    const rootOff = offsets[root] ?? 0;
    const thirdOff = (rootOff + 4) % 12;
    const fifthOff = (rootOff + 7) % 12;

    // MIDI notes for octave 4
    const rootMidi = 60 + rootOff;
    const thirdMidi = 60 + thirdOff;
    const fifthMidi = 60 + fifthOff;

    playChord([rootMidi, thirdMidi, fifthMidi], 1, 0.7);
    activeChord = root;
    setTimeout(() => { activeChord = null; }, 500);
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: What is a Chord -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">What is a Chord?</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      A <strong>chord</strong> is what you get when you play <strong>3 or more notes at the same time</strong>. When you hear chords, you hear harmony — the vertical sound of multiple notes blending together.
    </p>
    <p class="text-[#444] leading-[1.7] mb-3">
      The simplest and most important chord type is the <strong>triad</strong> — exactly 3 notes: the <strong>root</strong> (the starting note), the <strong>third</strong> (4 or 3 semitones up), and the <strong>fifth</strong> (7 semitones up from the root).
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      Understanding the intervals between these notes is the key to building chords in any key:
    </p>
    <div class="space-y-2 bg-white rounded-lg p-4 border-l-4 border-purple">
      <p class="text-[#444]"><strong>Major third:</strong> 4 semitones (sounds bright)</p>
      <p class="text-[#444]"><strong>Minor third:</strong> 3 semitones (sounds softer)</p>
      <p class="text-[#444]"><strong>Perfect fifth:</strong> 7 semitones (sounds complete)</p>
    </div>
  </section>

  <!-- Section 2: Major Triads -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Major Triads</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      A <strong>major triad</strong> = root + 4 semitones (major third) + 7 semitones (perfect fifth). The pattern is the same for every major chord. Click or hover over any chord to hear it:
    </p>
    <div class="flex gap-6 mb-6 flex-wrap justify-center">
      {#each ['C', 'F', 'G'] as root}
        <button
          style="cursor: pointer; transition: transform 0.2s; background: none; border: none; padding: 0;"
          onclick={() => playChordDemo(root)}
          onfocus={() => { activeChord = root; }}
          onblur={() => { activeChord = null; }}
          onmouseover={() => { activeChord = root; }}
          onmouseout={() => { activeChord = null; }}
          aria-label="Play {root} major chord"
        >
          <ChordDiagram {root} octave={4} showLabels={true} interactive={true} />
        </button>
      {/each}
    </div>
    <p class="text-[#444] leading-[1.7]">
      Notice how the <strong>root note is at the bottom</strong> (the fundamental), and the chord expands upward with the third and fifth. This is the foundation of harmonic thinking in music.
    </p>
  </section>

  <!-- Section 3: Building from Any Root -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Building from Any Root</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Because the interval pattern (4 + 3 semitones) is the same, you can build a major chord from <strong>any starting note</strong>. The skill is learning to count up the right number of semitones:
    </p>
    <div class="flex gap-6 mb-6 flex-wrap justify-center">
      {#each ['D', 'E', 'A'] as root}
        <button
          style="cursor: pointer; transition: transform 0.2s; background: none; border: none; padding: 0;"
          onclick={() => playChordDemo(root)}
          onfocus={() => { activeChord = root; }}
          onblur={() => { activeChord = null; }}
          onmouseover={() => { activeChord = root; }}
          onmouseout={() => { activeChord = null; }}
          aria-label="Play {root} major chord"
        >
          <ChordDiagram {root} octave={4} showLabels={true} interactive={true} />
        </button>
      {/each}
    </div>
    <p class="text-[#444] leading-[1.7] text-sm mb-3">
      <strong>How to build any major chord:</strong>
    </p>
    <ol class="text-[#444] text-sm space-y-1 mb-4 pl-5">
      <li>1. Start with your root note</li>
      <li>2. Count up 4 semitones to find the third</li>
      <li>3. Count up 3 more semitones to find the fifth</li>
      <li>4. Play all three notes together</li>
    </ol>
  </section>

  <!-- Section 4: Try Playing Chords -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Try Playing Chords</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Use this virtual keyboard to play the C, F, and G major chords with your mouse. Try playing them separately, then try playing them in sequence to hear how they flow together:
    </p>
    <div class="mb-4 bg-white rounded-lg p-4">
      <VirtualKeyboard startOctave={3} endOctave={5} showLabels={true} />
    </div>
    <div class="space-y-2 text-sm text-[#666] bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
      <p><strong>C major chord:</strong> C (middle) + E + G</p>
      <p><strong>F major chord:</strong> F + A + C</p>
      <p><strong>G major chord:</strong> G + B + D</p>
    </div>
  </section>

  <!-- Section 5: Chord Fingering -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Standard Chord Fingering</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Now that you know which notes make up a chord, you need to know which fingers to use. The good news: there's a simple, universal pattern for playing triads in root position.
    </p>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-4">
      <p class="text-[#444] mb-3"><strong>Standard triad fingering: 1-3-5</strong></p>
      <p class="text-[#444] text-sm leading-[1.7]">
        For triads in root position, use <strong>fingers 1 (thumb), 3 (middle), and 5 (pinky)</strong> — one finger per note. This works in both hands:
      </p>
      <ul class="text-[#444] text-sm space-y-2 mt-3 pl-5 list-disc">
        <li><strong>Right hand:</strong> Fingers 1-3-5 play root, third, fifth (ascending)</li>
        <li><strong>Left hand:</strong> Fingers 5-3-1 play root, third, fifth (descending — mirror image)</li>
      </ul>
    </div>
    <div class="space-y-3 mb-4">
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
        <p class="font-semibold text-navy mb-2">C Major Chord</p>
        <p class="text-sm text-[#666] mb-2"><strong>Right hand:</strong> 1(C) - 3(E) - 5(G)</p>
        <p class="text-sm text-[#666]"><strong>Left hand:</strong> 5(C) - 3(E) - 1(G)</p>
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
        <p class="font-semibold text-navy mb-2">F Major Chord</p>
        <p class="text-sm text-[#666] mb-2"><strong>Right hand:</strong> 1(F) - 3(A) - 5(C)</p>
        <p class="text-sm text-[#666]"><strong>Left hand:</strong> 5(F) - 3(A) - 1(C)</p>
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
        <p class="font-semibold text-navy mb-2">G Major Chord</p>
        <p class="text-sm text-[#666] mb-2"><strong>Right hand:</strong> 1(G) - 3(B) - 5(D)</p>
        <p class="text-sm text-[#666]"><strong>Left hand:</strong> 5(G) - 3(B) - 1(D)</p>
      </div>
    </div>
    <div class="bg-blue-50 rounded-lg border-l-4 border-blue-400 p-4">
      <p class="text-sm text-[#444]">
        <strong>Tip:</strong> The 1-3-5 fingering works for almost every root-position triad you'll encounter. Once you learn this pattern, your fingers will find the right notes automatically.
      </p>
    </div>
  </section>

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of chords and intervals? This quiz covers chord building, interval counting, and chord identification.
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
