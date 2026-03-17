<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(14)!;

  let showQuiz = $state(false);
  let highlightKeys = $state<string[]>([]);
  let activeKeySignature = $state<string | null>(null);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Key signature data
  const keySignatures: Record<string, { sharps?: string[]; flats?: string[]; scale: string[]; description: string }> = {
    'C major': { scale: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], description: 'No sharps or flats' },
    'G major': { sharps: ['F#'], scale: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], description: '1 sharp: F#' },
    'D major': { sharps: ['F#', 'C#'], scale: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'], description: '2 sharps: F#, C#' },
    'A major': { sharps: ['F#', 'C#', 'G#'], scale: ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G#5', 'A5'], description: '3 sharps: F#, C#, G#' },
    'F major': { flats: ['Bb'], scale: ['F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'], description: '1 flat: Bb' },
    'Bb major': { flats: ['Bb', 'Eb'], scale: ['B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'], description: '2 flats: Bb, Eb' },
  };

  function showScale(key: string) {
    activeKeySignature = key;
    const sig = keySignatures[key];
    highlightKeys = sig.scale;
  }

  function generateQuestions(): QuizQuestion[] {
    return [
      {
        id: 'q1',
        prompt: 'What does a key signature tell you?',
        correctAnswer: 'Which notes are sharp or flat throughout the piece',
        choices: shuffle(['Which notes are sharp or flat throughout the piece', 'How fast to play', 'How loud to play', 'Which hand to use']),
      },
      {
        id: 'q2',
        prompt: 'How many sharps does G major have?',
        correctAnswer: '1 (F#)',
        choices: shuffle(['1 (F#)', '2 (F#, C#)', '0', '3 (F#, C#, G#)']),
      },
      {
        id: 'q3',
        prompt: 'How many sharps does D major have?',
        correctAnswer: '2 (F#, C#)',
        choices: shuffle(['2 (F#, C#)', '1 (F#)', '3 (F#, C#, G#)', '0']),
      },
      {
        id: 'q4',
        prompt: 'What is the order of sharps in key signatures?',
        correctAnswer: 'F C G D A E B',
        choices: shuffle(['F C G D A E B', 'B E A D G C F', 'C D E F G A B', 'G A B C D E F']),
      },
      {
        id: 'q5',
        prompt: 'What is the order of flats in key signatures?',
        correctAnswer: 'B E A D G C F',
        choices: shuffle(['B E A D G C F', 'F C G D A E B', 'C D E F G A B', 'A B C D E F G']),
      },
      {
        id: 'q6',
        prompt: 'F major has which flat?',
        correctAnswer: 'Bb',
        choices: shuffle(['Bb', 'Eb', 'Ab', 'Db']),
      },
      {
        id: 'q7',
        prompt: 'If a key signature has 3 sharps, the key is most likely...',
        correctAnswer: 'A major',
        choices: shuffle(['A major', 'E major', 'D major', 'B major']),
      },
      {
        id: 'q8',
        prompt: 'The circle of fifths shows keys moving by...',
        correctAnswer: 'ascending fifths (adding one sharp each time)',
        choices: shuffle(['ascending fifths (adding one sharp each time)', 'ascending octaves', 'descending thirds', 'random intervals']),
      },
      {
        id: 'q9',
        prompt: 'Where is the key signature placed on sheet music?',
        correctAnswer: 'Between the clef and the time signature',
        choices: shuffle(['Between the clef and the time signature', 'After the time signature', 'At the end of the piece', 'Above the staff']),
      },
      {
        id: 'q10',
        prompt: 'A natural sign (♮) in the music means...',
        correctAnswer: 'Cancel a sharp or flat from the key signature',
        choices: shuffle(['Cancel a sharp or flat from the key signature', 'Play the note louder', 'Hold the note longer', 'Play the note staccato']),
      },
    ];
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(14, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: What is a Key Signature -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">What is a Key Signature?</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      A <strong>key signature</strong> appears at the beginning of each line of music, right after the clef. It tells you which notes are <strong>sharp (#) or flat (b) throughout the entire piece</strong> — so you don't have to write accidentals on every single note.
    </p>
    <p class="text-[#444] leading-[1.7] mb-3">
      For example, if you see one sharp (F#) in the key signature, <strong>every F in the piece is played as F#</strong> unless a natural sign (♮) cancels it.
    </p>
  </section>

  <!-- Section 2: Sharp Keys -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Sharp Key Signatures</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Sharps are added in a specific order: <strong>F C G D A E B</strong> (remember: "Father Charles Goes Down And Ends Battle"). Each new sharp adds one more to the collection:
    </p>
    <div class="space-y-3 mb-4">
      {#each [['C major', '0 sharps'], ['G major', '1 sharp: F#'], ['D major', '2 sharps: F#, C#'], ['A major', '3 sharps: F#, C#, G#']] as [key, desc]}
        <button
          class="w-full text-left p-3 rounded-lg border-2 transition-all {activeKeySignature === key ? 'border-purple bg-[#fdf6f0]' : 'border-[#e8e6e0] bg-white hover:border-purple'}"
          onclick={() => showScale(key)}
        >
          <span class="font-semibold text-navy">{key}</span>
          <span class="text-sm text-[#666] ml-2">— {desc}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- Section 3: Flat Keys -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Flat Key Signatures</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Flats are added in the <strong>reverse order</strong>: <strong>B E A D G C F</strong> ("Battle Ends And Down Goes Charles's Father"). Moving in the opposite direction around the circle of fifths:
    </p>
    <div class="space-y-3 mb-4">
      {#each [['F major', '1 flat: Bb'], ['Bb major', '2 flats: Bb, Eb']] as [key, desc]}
        <button
          class="w-full text-left p-3 rounded-lg border-2 transition-all {activeKeySignature === key ? 'border-purple bg-[#fdf6f0]' : 'border-[#e8e6e0] bg-white hover:border-purple'}"
          onclick={() => showScale(key)}
        >
          <span class="font-semibold text-navy">{key}</span>
          <span class="text-sm text-[#666] ml-2">— {desc}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- Section 4: Interactive Keyboard -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Explore Scales</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Click a key above to highlight its scale on the keyboard. Notice how each key uses different combinations of white and black keys:
    </p>
    {#if activeKeySignature}
      <p class="text-sm text-[#666] mb-2">
        Showing: <strong class="text-navy">{activeKeySignature}</strong> — {keySignatures[activeKeySignature].description}
      </p>
    {/if}
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
      <VirtualKeyboard startOctave={4} endOctave={5} showLabels={true} {highlightKeys} />
    </div>
  </section>

  <!-- Section 5: Circle of Fifths -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The Circle of Fifths</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      The <strong>circle of fifths</strong> is a visual representation of how all keys relate to each other. Going clockwise, each key is a fifth above the previous one and adds one sharp. Going anticlockwise, each key is a fourth above (or a fifth below) and adds one flat.
    </p>
    <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
      <p class="text-[#444] text-sm mb-2"><strong>Clockwise (sharps):</strong> C → G → D → A → E → B → F# → ...</p>
      <p class="text-[#444] text-sm"><strong>Anticlockwise (flats):</strong> C → F → Bb → Eb → Ab → Db → Gb → ...</p>
    </div>
    <p class="text-[#444] leading-[1.7] mt-3">
      You don't need to memorise the entire circle right now. Focus on keys with up to 3 sharps or flats — these cover the vast majority of beginner and intermediate repertoire.
    </p>
  </section>

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of key signatures?
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
