<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import Metronome from '../components/Metronome.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { playNote, playSequence } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(4)!;

  let showQuiz = $state(false);
  let isPlayingScale = $state(false);
  let scalePlaybackStop: { stop: () => void } | null = null;

  // C Major scale: C4 D4 E4 F4 G4 A4 B4 C5
  const cMajorScale = [
    { note: 'C4', midiNote: 60, degree: 1, roman: 'I' },
    { note: 'D4', midiNote: 62, degree: 2, roman: 'II' },
    { note: 'E4', midiNote: 64, degree: 3, roman: 'III' },
    { note: 'F4', midiNote: 65, degree: 4, roman: 'IV' },
    { note: 'G4', midiNote: 67, degree: 5, roman: 'V' },
    { note: 'A4', midiNote: 69, degree: 6, roman: 'VI' },
    { note: 'B4', midiNote: 71, degree: 7, roman: 'VII' },
    { note: 'C5', midiNote: 72, degree: 8, roman: 'I' },
  ];

  function playScale() {
    if (isPlayingScale && scalePlaybackStop) {
      scalePlaybackStop.stop();
      isPlayingScale = false;
      return;
    }

    const noteSequence = cMajorScale.map(n => ({
      midiNote: n.midiNote,
      duration: 1,
    }));

    isPlayingScale = true;
    scalePlaybackStop = playSequence(noteSequence, 80, () => {
      // Optional: can add highlight index here
    });

    const totalDuration = noteSequence.length * (60 / 80) * 1000;
    setTimeout(() => {
      isPlayingScale = false;
    }, totalDuration + 200);
  }

  // Bass clef notes data (G2 to A3)
  const bassClefNotes = [
    { id: 'G2', yPos: 20, line: false },
    { id: 'A2', yPos: 30, line: false },
    { id: 'B2', yPos: 40, line: true },
    { id: 'C3', yPos: 50, line: false },
    { id: 'D3', yPos: 60, line: true },
    { id: 'E3', yPos: 70, line: false },
    { id: 'F3', yPos: 80, line: true },
    { id: 'G3', yPos: 90, line: false },
    { id: 'A3', yPos: 100, line: true },
  ];

  // Quiz generation
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateScaleQuestions(): QuizQuestion[] {
    const questions: QuizQuestion[] = [];

    // Questions about scale degrees
    const degrees = [1, 2, 3, 4, 5, 6, 7];
    for (let i = 0; i < 5; i++) {
      const degree = degrees[Math.floor(Math.random() * degrees.length)];
      const correctNote = cMajorScale[degree - 1].note;
      const choices = shuffle(
        cMajorScale
          .slice(0, 7)
          .map(n => n.note)
          .filter(n => n !== correctNote)
      )
        .slice(0, 3)
        .concat(correctNote);

      questions.push({
        id: `q-scale-${i}`,
        prompt: `What is the ${degree === 1 ? '1st' : degree === 2 ? '2nd' : degree === 3 ? '3rd' : degree + 'th'} note of the C major scale?`,
        correctAnswer: correctNote,
        choices: shuffle(choices),
      });
    }

    // Questions about bass clef notes
    const bassNotes = ['B2', 'D3', 'F3', 'A3'];
    for (let i = 0; i < 3; i++) {
      const note = bassNotes[Math.floor(Math.random() * bassNotes.length)];
      const isLine = note === 'B2' || note === 'D3' || note === 'F3' || note === 'A3';
      const allBassNotes = ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3'];
      const choices = shuffle(
        allBassNotes.filter(n => n !== note)
      )
        .slice(0, 3)
        .concat(note);

      const position =
        note === 'B2'
          ? 'bottom line'
          : note === 'D3'
            ? 'middle line'
            : note === 'F3'
              ? 'middle line (F clef)'
              : 'top line';

      questions.push({
        id: `q-bass-${i}`,
        prompt: `What note sits on the ${position} of the bass clef?`,
        correctAnswer: note,
        choices: shuffle(choices),
      });
    }

    return shuffle(questions);
  }

  let quizQuestions = $state(generateScaleQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(4, score, total, 0);
  }

  function startQuiz() {
    quizQuestions = generateScaleQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: The Bass Clef -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The Bass Clef</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      While the treble clef is for high notes (right hand), the <strong>bass clef</strong> is for low notes (left hand). The bass clef is also called the <strong>F clef</strong> because the two dots in the symbol surround the <strong>F line</strong>.
    </p>

    <!-- Bass clef visual -->
    <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] mb-6">
      <p class="text-sm font-semibold text-navy mb-4">Bass Clef Staff (F Clef)</p>
      <svg viewBox="0 0 500 200" width="100%" style="max-width: 500px;" xmlns="http://www.w3.org/2000/svg">
        <!-- Staff lines -->
        <line x1="30" y1="40" x2="480" y2="40" stroke="black" stroke-width="1.5" />
        <line x1="30" y1="60" x2="480" y2="60" stroke="black" stroke-width="1.5" />
        <line x1="30" y1="80" x2="480" y2="80" stroke="black" stroke-width="1.5" />
        <line x1="30" y1="100" x2="480" y2="100" stroke="black" stroke-width="1.5" />
        <line x1="30" y1="120" x2="480" y2="120" stroke="black" stroke-width="1.5" />

        <!-- Bass clef symbol (F clef) -->
        <text
          x="50"
          y="120"
          font-size="90"
          font-family="'Noto Music', serif"
          fill="black"
        >𝄢</text>

        <!-- Label: F line -->
        <text x="340" y="105" font-size="12" fill="#ce7e4f" font-weight="bold">F</text>
        <line x1="320" y1="100" x2="330" y2="100" stroke="#ce7e4f" stroke-width="1.5" />
      </svg>
    </div>

    <!-- Mnemonics -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-[#fef3ee] rounded-lg p-5 border border-[#f5d9cc]">
        <p class="font-bold text-navy mb-2">Bass Clef Lines</p>
        <p class="text-[#444] text-sm leading-relaxed font-mono">
          G<br />
          B<br />
          D<br />
          F<br />
          A
        </p>
        <p class="text-xs text-[#999] mt-3">Mnemonic: <strong>Good Boys Do Fine Always</strong></p>
      </div>

      <div class="bg-[#fef3ee] rounded-lg p-5 border border-[#f5d9cc]">
        <p class="font-bold text-navy mb-2">Bass Clef Spaces</p>
        <p class="text-[#444] text-sm leading-relaxed font-mono">
          A<br />
          C<br />
          E<br />
          G
        </p>
        <p class="text-xs text-[#999] mt-3">Mnemonic: <strong>All Cows Eat Grass</strong></p>
      </div>
    </div>

    <p class="text-[#444] leading-[1.7] text-sm bg-[#fef3ee] border-l-4 border-purple px-4 py-3 rounded">
      💡 <strong>Key insight:</strong> Notice that in bass clef, the F line is in the middle. In treble clef, the G line is in the middle. They overlap at notes like C4 and E4 on the grand staff.
    </p>
  </section>

  <!-- Section 2: The Grand Staff -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The Grand Staff</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      When you play with both hands, you read from the <strong>grand staff</strong> — treble clef on top (right hand) and bass clef on bottom (left hand), connected by a brace. The two clefs share a special note: <strong>Middle C (C4)</strong>, which sits on a ledger line between them.
    </p>

    <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
      <p class="text-sm font-semibold text-navy mb-4">Treble and Bass Clef (Grand Staff)</p>
      <svg viewBox="0 0 500 300" width="100%" style="max-width: 500px;" xmlns="http://www.w3.org/2000/svg">
        <!-- Treble staff lines -->
        <line x1="40" y1="40" x2="480" y2="40" stroke="black" stroke-width="1.5" />
        <line x1="40" y1="60" x2="480" y2="60" stroke="black" stroke-width="1.5" />
        <line x1="40" y1="80" x2="480" y2="80" stroke="black" stroke-width="1.5" />
        <line x1="40" y1="100" x2="480" y2="100" stroke="black" stroke-width="1.5" />
        <line x1="40" y1="120" x2="480" y2="120" stroke="black" stroke-width="1.5" />

        <!-- Bass staff lines -->
        <line x1="40" y1="180" x2="480" y2="180" stroke="black" stroke-width="1.5" />
        <line x1="40" y1="200" x2="480" y2="200" stroke="black" stroke-width="1.5" />
        <line x1="40" y1="220" x2="480" y2="220" stroke="black" stroke-width="1.5" />
        <line x1="40" y1="240" x2="480" y2="240" stroke="black" stroke-width="1.5" />
        <line x1="40" y1="260" x2="480" y2="260" stroke="black" stroke-width="1.5" />

        <!-- Brace -->
        <path d="M 30 40 Q 20 150 30 260" stroke="black" stroke-width="2" fill="none" />
        <path d="M 30 40 Q 25 150 30 260" stroke="black" stroke-width="1" fill="none" />

        <!-- Treble clef -->
        <text x="45" y="115" font-size="70" font-family="'Noto Music', serif" fill="black">𝄞</text>

        <!-- Bass clef -->
        <text x="45" y="255" font-size="70" font-family="'Noto Music', serif" fill="black">𝄢</text>

        <!-- Middle C ledger line -->
        <line x1="40" y1="150" x2="480" y2="150" stroke="black" stroke-width="1.5" stroke-dasharray="5,5" />

        <!-- Middle C note head -->
        <ellipse cx="280" cy="150" rx="10" ry="7" fill="#ce7e4f" transform="rotate(-20, 280, 150)" />

        <!-- Middle C label -->
        <text x="290" y="165" font-size="14" fill="#ce7e4f" font-weight="bold">Middle C (C4)</text>
      </svg>
    </div>

    <p class="text-[#444] leading-[1.7] mt-6">
      When you first start playing pieces, you'll use simplified versions of this. Many pieces for beginners use just treble clef or just bass clef. As you advance, you'll learn to read both at once.
    </p>
  </section>

  <!-- Section 3: The C Major Scale -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The C Major Scale</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      The <strong>C major scale</strong> is the simplest scale to learn because it uses only the white keys on the piano. There are no sharps or flats. The scale has a specific pattern of whole steps (W) and half steps (H) that you'll hear in music all the time.
    </p>

    <!-- Scale pattern -->
    <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] mb-6">
      <p class="font-semibold text-navy mb-4">C Major: C - D - E - F - G - A - B - C</p>
      <div class="grid grid-cols-7 gap-2 text-center text-sm mb-4">
        {#each cMajorScale.slice(0, 7) as note, i}
          <div>
            <p class="font-bold text-navy">{note.note}</p>
            <p class="text-[0.8rem] text-[#666]">
              {i < 6 && i !== 2 && i !== 6 ? 'W' : 'H'}
            </p>
          </div>
        {/each}
      </div>
      <p class="text-sm text-[#666] font-mono text-center">W - W - H - W - W - W - H</p>
    </div>

    <!-- Explanation -->
    <div class="bg-[#fef3ee] rounded-lg p-5 border border-[#f5d9cc] mb-6">
      <p class="font-bold text-navy mb-2">Whole Steps vs Half Steps</p>
      <ul class="text-sm text-[#444] space-y-2">
        <li><strong>Whole step (W):</strong> Skip one white key (jump over a black key if there is one)</li>
        <li><strong>Half step (H):</strong> Move to the very next white key with no black key between</li>
      </ul>
    </div>

    <!-- Keyboard highlight -->
    <p class="text-[#444] leading-[1.7] mb-3">Below, the keyboard shows all the notes of the C major scale highlighted:</p>
    <VirtualKeyboard
      startOctave={3}
      endOctave={4}
      highlightKeys={cMajorScale.slice(0, 7).map(n => n.note)}
      showLabels={true}
    />
  </section>

  <!-- Section 4: Play the Scale -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Play the C Major Scale</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Press play to hear the C major scale ascending and then descending. This is one of the most fundamental sounds in music — spend time learning it because you'll hear this pattern in countless songs.
    </p>

    <!-- Play button -->
    <button
      class="bg-purple text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity mb-6"
      onclick={playScale}
    >
      {isPlayingScale ? 'Stop Scale' : 'Play Scale'}
    </button>

    <!-- Scale degrees -->
    <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
      <p class="font-semibold text-navy mb-4">Scale Degrees (Roman Numerals)</p>
      <div class="grid grid-cols-4 gap-3 text-center text-sm">
        {#each cMajorScale.slice(0, 7) as note}
          <div class="bg-[#f5f0e8] p-3 rounded">
            <p class="font-bold text-navy">{note.note}</p>
            <p class="text-[0.8rem] text-[#666]">{note.roman}</p>
            <p class="text-[0.75rem] text-[#999]">degree {note.degree}</p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Metronome for practice -->
    <div class="mt-6">
      <p class="text-sm font-semibold text-navy mb-3">Practice with a steady beat:</p>
      <Metronome initialBpm={80} />
    </div>
  </section>

  <!-- Section 5: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test what you've learned? Answer questions about the C major scale and the bass clef.
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >Start Quiz</button>
    {:else}
      <QuizEngine questions={quizQuestions} onComplete={onQuizComplete}>
        {#snippet children({ currentQuestion })}
          <!-- Visual hint for scale degree questions -->
          {#if currentQuestion.id.includes('scale')}
            <div class="mb-6 bg-white rounded-lg p-6 border border-[#e8e6e0]">
              <p class="text-sm font-semibold text-navy mb-3">C Major Scale Degrees:</p>
              <div class="grid grid-cols-7 gap-2 text-center text-sm">
                {#each cMajorScale.slice(0, 7) as note}
                  <div>
                    <p class="font-bold text-navy text-lg">{note.roman}</p>
                    <p class="text-[0.85rem] text-[#666]">{note.note}</p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Visual hint for bass clef questions -->
          {#if currentQuestion.id.includes('bass')}
            <div class="mb-6 bg-white rounded-lg p-6 border border-[#e8e6e0]">
              <p class="text-sm font-semibold text-navy mb-3">Bass Clef Reference:</p>
              <svg viewBox="0 0 400 200" width="100%" style="max-width: 400px;" xmlns="http://www.w3.org/2000/svg">
                <!-- Staff lines -->
                <line x1="30" y1="40" x2="380" y2="40" stroke="black" stroke-width="1.5" />
                <line x1="30" y1="60" x2="380" y2="60" stroke="black" stroke-width="1.5" />
                <line x1="30" y1="80" x2="380" y2="80" stroke="black" stroke-width="1.5" />
                <line x1="30" y1="100" x2="380" y2="100" stroke="black" stroke-width="1.5" />
                <line x1="30" y1="120" x2="380" y2="120" stroke="black" stroke-width="1.5" />

                <!-- Bass clef -->
                <text x="42" y="115" font-size="70" font-family="'Noto Music', serif" fill="black">𝄢</text>

                <!-- Note labels -->
                <text x="340" y="45" font-size="12" fill="#666" font-weight="bold">G</text>
                <text x="340" y="65" font-size="12" fill="#666" font-weight="bold">B</text>
                <text x="340" y="85" font-size="12" fill="#666" font-weight="bold">D</text>
                <text x="340" y="105" font-size="12" fill="#666" font-weight="bold">F</text>
                <text x="340" y="125" font-size="12" fill="#666" font-weight="bold">A</text>

                <!-- Spaces -->
                <text x="360" y="55" font-size="12" fill="#999" font-weight="bold">A</text>
                <text x="360" y="75" font-size="12" fill="#999" font-weight="bold">C</text>
                <text x="360" y="95" font-size="12" fill="#999" font-weight="bold">E</text>
                <text x="360" y="115" font-size="12" fill="#999" font-weight="bold">G</text>
              </svg>
            </div>
          {/if}
        {/snippet}
      </QuizEngine>
    {/if}
  </section>
</LessonLayout>
