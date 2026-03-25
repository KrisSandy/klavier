<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import Staff from '../components/Staff.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import Metronome from '../components/Metronome.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { TREBLE_NOTES, ALL_LETTERS } from '../data/notes';
  import { playNote, playSequence } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(5)!;

  let showQuiz = $state(false);
  let includeTreble = $state(false);
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

  // Bass clef notes with y positions on the staff
  // Staff lines at y=40(top/A3), 60(F3), 80(D3), 100(B2), 120(bottom/G2)
  // Spaces: G3=50, E3=70, C3=90, A2=110
  // Ledger line notes above: C4=20 (ledger at 20), B3=30 (space above staff)
  // Ledger line notes below: F2=130 (space below staff), E2=140 (ledger at 140)
  const BASS_NOTES = [
    { id: 'C4', name: 'C', yPos: 20, ledgerLines: [20] },
    { id: 'B3', name: 'B', yPos: 30, ledgerLines: [] as number[] },
    { id: 'A3', name: 'A', yPos: 40, ledgerLines: [] as number[] },
    { id: 'G3', name: 'G', yPos: 50, ledgerLines: [] as number[] },
    { id: 'F3', name: 'F', yPos: 60, ledgerLines: [] as number[] },
    { id: 'E3', name: 'E', yPos: 70, ledgerLines: [] as number[] },
    { id: 'D3', name: 'D', yPos: 80, ledgerLines: [] as number[] },
    { id: 'C3', name: 'C', yPos: 90, ledgerLines: [] as number[] },
    { id: 'B2', name: 'B', yPos: 100, ledgerLines: [] as number[] },
    { id: 'A2', name: 'A', yPos: 110, ledgerLines: [] as number[] },
    { id: 'G2', name: 'G', yPos: 120, ledgerLines: [] as number[] },
    { id: 'F2', name: 'F', yPos: 130, ledgerLines: [] as number[] },
    { id: 'E2', name: 'E', yPos: 140, ledgerLines: [140] },
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

  interface QuizMeta {
    questions: QuizQuestion[];
    noteMap: Record<string, number>;
    ledgerMap: Record<string, number[]>;
    clefMap: Record<string, 'bass' | 'treble'>;
  }

  function generateQuizQuestions(withTreble: boolean): QuizMeta {
    const questions: QuizQuestion[] = [];
    const noteMap: Record<string, number> = {};
    const ledgerMap: Record<string, number[]> = {};
    const clefMap: Record<string, 'bass' | 'treble'> = {};

    // Build the pool: always bass, optionally treble
    type PoolNote = { id: string; name: string; yPos: number; ledgerLines: number[]; clef: 'bass' | 'treble' };
    const pool: PoolNote[] = BASS_NOTES.map(n => ({ ...n, clef: 'bass' as const }));

    if (withTreble) {
      for (const n of TREBLE_NOTES) {
        pool.push({ id: `treble-${n.id}`, name: n.name, yPos: n.yPos, ledgerLines: [], clef: 'treble' });
      }
    }

    const picked = shuffle(pool).slice(0, 10);

    for (let i = 0; i < picked.length; i++) {
      const note = picked[i];
      const distractors = shuffle(ALL_LETTERS.filter(l => l !== note.name)).slice(0, 3);
      const qId = `q${i}-${note.id}`;
      noteMap[qId] = note.yPos;
      ledgerMap[qId] = note.ledgerLines;
      clefMap[qId] = note.clef;
      questions.push({
        id: qId,
        prompt: 'What note is this?',
        correctAnswer: note.name,
        choices: shuffle([note.name, ...distractors]),
      });
    }
    return { questions, noteMap, ledgerMap, clefMap };
  }

  let quizData = $state(generateQuizQuestions(false));

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(4, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuizQuestions(includeTreble);
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
      <svg viewBox="0 0 510 200" width="100%" style="max-width: 510px;" xmlns="http://www.w3.org/2000/svg">
        <!-- Staff lines -->
        <line x1="30" y1="40" x2="475" y2="40" stroke="black" stroke-width="1.5" />
        <line x1="30" y1="60" x2="475" y2="60" stroke="black" stroke-width="1.5" />
        <line x1="30" y1="80" x2="475" y2="80" stroke="black" stroke-width="1.5" />
        <line x1="30" y1="100" x2="475" y2="100" stroke="black" stroke-width="1.5" />
        <line x1="30" y1="120" x2="475" y2="120" stroke="black" stroke-width="1.5" />

        <!-- Bass clef symbol (F clef) -->
        <text
          x="50"
          y="120"
          font-size="90"
          font-family="'Noto Music', serif"
          fill="black"
        >𝄢</text>

        <!-- Note labels at the end of the staff -->
        <!-- Lines (bottom to top): G2=120, B2=100, D3=80, F3=60, A3=40 -->
        <text x="488" y="124" font-size="12" fill="#ce7e4f" font-weight="bold">G</text>
        <text x="488" y="104" font-size="12" fill="#ce7e4f" font-weight="bold">B</text>
        <text x="488" y="84" font-size="12" fill="#ce7e4f" font-weight="bold">D</text>
        <text x="488" y="64" font-size="12" fill="#ce7e4f" font-weight="bold">F</text>
        <text x="488" y="44" font-size="12" fill="#ce7e4f" font-weight="bold">A</text>
        <!-- Spaces (bottom to top): A2=110, C3=90, E3=70, G3=50 -->
        <text x="488" y="114" font-size="11" fill="#6b6455">A</text>
        <text x="488" y="94" font-size="11" fill="#6b6455">C</text>
        <text x="488" y="74" font-size="11" fill="#6b6455">E</text>
        <text x="488" y="54" font-size="11" fill="#6b6455">G</text>
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

  <!-- Section 4.5: C Major Scale Fingering -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">C Major Scale Fingering</h2>
    <p class="text-[0.95rem] text-[#444] leading-relaxed mb-4">
      Proper fingering is crucial for playing scales smoothly and building muscle memory. Use consistent finger numbers every time you play — they guide your hands and prevent tangled fingers.
    </p>

    <!-- Right hand fingering -->
    <div class="bg-white rounded-lg p-5 border border-[#e8e6e0] mb-6">
      <p class="font-semibold text-navy mb-3">Right Hand (Ascending)</p>
      <div class="space-y-2 mb-4">
        <p class="text-[0.95rem] text-[#444] leading-relaxed font-mono">
          <strong>C–D–E–F–G–A–B–C</strong><br />
          <strong>1–2–3–1–2–3–4–5</strong>
        </p>
      </div>
      <p class="text-[0.95rem] text-[#444] leading-relaxed">
        Notice that after you play E with finger 3, your thumb (1) moves under to F. This is called <strong>"thumb under"</strong> — a fundamental technique that keeps your hand in position and allows you to play smoothly without lifting or twisting your wrist.
      </p>
    </div>

    <!-- Left hand fingering -->
    <div class="bg-white rounded-lg p-5 border border-[#e8e6e0] mb-6">
      <p class="font-semibold text-navy mb-3">Left Hand (Ascending)</p>
      <div class="space-y-2 mb-4">
        <p class="text-[0.95rem] text-[#444] leading-relaxed font-mono">
          <strong>C–D–E–F–G–A–B–C</strong><br />
          <strong>5–4–3–2–1–3–2–1</strong>
        </p>
      </div>
      <p class="text-[0.95rem] text-[#444] leading-relaxed">
        After you play G with your thumb (1), finger 3 crosses over to reach A. This is called <strong>"finger over"</strong> — the mirror of thumb under. Together, these two techniques let your fingers flow across the keyboard without awkward repositioning.
      </p>
    </div>

    <!-- Key insight box -->
    <p class="text-[0.95rem] text-[#444] leading-relaxed text-sm bg-[#fef3ee] border-l-4 border-purple px-4 py-3 rounded">
      💡 <strong>The foundation of hand technique:</strong> Thumb under and finger over are the building blocks of all scale playing. Master these now, and you'll transfer this skill to every scale and piece you learn.
    </p>
  </section>

  <!-- Section 5: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    <label class="flex items-center gap-2 mb-4 cursor-pointer text-[#444] text-[0.95rem]">
      <input
        type="checkbox"
        bind:checked={includeTreble}
        class="w-4 h-4 accent-[#ce7e4f] cursor-pointer"
        onchange={() => { if (!showQuiz) return; quizData = generateQuizQuestions(includeTreble); }}
      />
      Include treble clef notes too
    </label>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to identify notes on the bass clef? Each question shows a note on the staff — pick the correct letter name.
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >Start Quiz</button>
    {:else}
      <QuizEngine questions={quizData.questions} onComplete={onQuizComplete}>
        {#snippet children({ currentQuestion, questionIndex })}
          {@const qId = quizData.questions[questionIndex]?.id}
          {@const noteYPos = qId ? quizData.noteMap[qId] ?? 80 : 80}
          {@const clef = qId ? quizData.clefMap[qId] ?? 'bass' : 'bass'}

          <div class="mb-4 flex justify-center">
            {#if clef === 'treble'}
              <div style="max-width: 500px; width: 100%;">
                <Staff yPos={noteYPos} />
              </div>
            {:else}
              {@const ledgerLines = qId ? (quizData.ledgerMap[qId] || []) : []}
              {@const stemUp = noteYPos >= 80}
              <svg
                viewBox="0 -15 500 220"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                style="max-width: 500px; display: block; margin: 0 auto;"
                role="img"
                aria-label="Bass clef staff with a note to identify"
              >
                <!-- 5 staff lines -->
                <line x1="30" y1="40" x2="480" y2="40" stroke="black" stroke-width="1.5" />
                <line x1="30" y1="60" x2="480" y2="60" stroke="black" stroke-width="1.5" />
                <line x1="30" y1="80" x2="480" y2="80" stroke="black" stroke-width="1.5" />
                <line x1="30" y1="100" x2="480" y2="100" stroke="black" stroke-width="1.5" />
                <line x1="30" y1="120" x2="480" y2="120" stroke="black" stroke-width="1.5" />

                <!-- Bass clef -->
                <text
                  x="42"
                  y="115"
                  font-size="70"
                  font-family="'Noto Music', serif"
                  fill="black"
                >&#x1D122;</text>

                <!-- Ledger lines -->
                {#each ledgerLines as ly}
                  <line
                    x1={280 - 16}
                    y1={ly}
                    x2={280 + 16}
                    y2={ly}
                    stroke="black"
                    stroke-width="1.5"
                  />
                {/each}

                <!-- Note head -->
                <ellipse
                  cx="280"
                  cy={noteYPos}
                  rx="10"
                  ry="7"
                  fill="black"
                  transform="rotate(-20, 280, {noteYPos})"
                />

                <!-- Stem -->
                {#if stemUp}
                  <line
                    x1={280 + 9}
                    y1={noteYPos}
                    x2={280 + 9}
                    y2={noteYPos - 35}
                    stroke="black"
                    stroke-width="1.5"
                  />
                {:else}
                  <line
                    x1={280 - 9}
                    y1={noteYPos}
                    x2={280 - 9}
                    y2={noteYPos + 35}
                    stroke="black"
                    stroke-width="1.5"
                  />
                {/if}
              </svg>
            {/if}
          </div>
        {/snippet}
      </QuizEngine>
    {/if}
  </section>
</LessonLayout>
