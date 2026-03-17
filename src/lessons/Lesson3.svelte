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

  const lesson = getLessonById(3)!;
  const songs = getSongsByLesson(3);
  const odeToJoy = songs[0]; // Ode to Joy

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

    // Get all notes from all lines
    const allNotes = odeToJoy.lines.flat();
    const noteSequence = allNotes.map(id => {
      const note = getNoteById(id);
      return { midiNote: note?.midiNote ?? 60, duration: 1 };
    });

    isPlaying = true;
    playbackStop = playSequence(noteSequence, odeToJoy.bpm, (index) => {
      highlightIndex = index;
    });

    // Auto-stop after sequence finishes
    const totalDuration = noteSequence.length * (60 / odeToJoy.bpm) * 1000;
    setTimeout(() => {
      isPlaying = false;
      highlightIndex = -1;
    }, totalDuration + 200);
  }

  // Quiz: note duration identification
  const durationTypes = [
    { name: 'Whole note', beats: '4', shape: 'whole' },
    { name: 'Half note', beats: '2', shape: 'half' },
    { name: 'Quarter note', beats: '1', shape: 'quarter' },
  ];

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateDurationQuestions(): QuizQuestion[] {
    const qs: QuizQuestion[] = [];
    for (let i = 0; i < 8; i++) {
      const dt = durationTypes[Math.floor(Math.random() * 3)];
      qs.push({
        id: `q${i}-${dt.shape}`,
        prompt: `How many beats does a ${dt.name.toLowerCase()} get in 4/4 time?`,
        correctAnswer: dt.beats,
        choices: shuffle(['1', '2', '3', '4']),
      });
    }
    return qs;
  }

  let quizQuestions = $state(generateDurationQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(3, score, total, 0);
  }

  function startQuiz() {
    quizQuestions = generateDurationQuestions();
    showQuiz = true;
  }

  // Render note shape based on question id
  function renderNoteShape(shapeType: string, size: number = 60) {
    if (shapeType === 'whole') {
      // Whole note: open oval, no stem
      return `
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display: inline-block; margin: 0 auto;">
          <ellipse cx="${size / 2}" cy="${size / 2}" rx="${size * 0.3}" ry="${size * 0.25}" fill="none" stroke="#3d3929" stroke-width="2"/>
        </svg>
      `;
    } else if (shapeType === 'half') {
      // Half note: open oval + stem
      return `
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display: inline-block; margin: 0 auto;">
          <ellipse cx="${size * 0.35}" cy="${size * 0.65}" rx="${size * 0.25}" ry="${size * 0.2}" fill="none" stroke="#3d3929" stroke-width="2"/>
          <line x1="${size * 0.55}" y1="${size * 0.65}" x2="${size * 0.55}" y2="${size * 0.15}" stroke="#3d3929" stroke-width="1.5"/>
        </svg>
      `;
    } else {
      // Quarter note: filled oval + stem
      return `
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display: inline-block; margin: 0 auto;">
          <ellipse cx="${size * 0.35}" cy="${size * 0.65}" rx="${size * 0.25}" ry="${size * 0.2}" fill="#3d3929"/>
          <line x1="${size * 0.55}" y1="${size * 0.65}" x2="${size * 0.55}" y2="${size * 0.15}" stroke="#3d3929" stroke-width="1.5"/>
        </svg>
      `;
    }
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: Note Durations -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Note Durations</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Musical notes don't all sound for the same length of time. Each note has a duration that tells you how long to hold it. The shape of the note tells you how many beats it lasts.
    </p>

    <div class="grid grid-cols-3 gap-6 mb-6">
      <!-- Whole note -->
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] text-center">
        <div class="mb-4 flex justify-center">
          <svg viewBox="0 0 80 60" width="80" height="60">
            <ellipse cx="40" cy="30" rx="20" ry="15" fill="none" stroke="#3d3929" stroke-width="2" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-2">Whole Note</p>
        <p class="text-sm text-[#666]"><strong>4 beats</strong></p>
        <p class="text-xs text-[#999] mt-2">An open oval, no stem</p>
      </div>

      <!-- Half note -->
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] text-center">
        <div class="mb-4 flex justify-center">
          <svg viewBox="0 0 80 60" width="80" height="60">
            <ellipse cx="30" cy="38" rx="18" ry="14" fill="none" stroke="#3d3929" stroke-width="2" />
            <line x1="48" y1="38" x2="48" y2="10" stroke="#3d3929" stroke-width="1.5" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-2">Half Note</p>
        <p class="text-sm text-[#666]"><strong>2 beats</strong></p>
        <p class="text-xs text-[#999] mt-2">Open oval with a stem</p>
      </div>

      <!-- Quarter note -->
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0] text-center">
        <div class="mb-4 flex justify-center">
          <svg viewBox="0 0 80 60" width="80" height="60">
            <ellipse cx="30" cy="38" rx="18" ry="14" fill="#3d3929" />
            <line x1="48" y1="38" x2="48" y2="10" stroke="#3d3929" stroke-width="1.5" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-2">Quarter Note</p>
        <p class="text-sm text-[#666]"><strong>1 beat</strong></p>
        <p class="text-xs text-[#999] mt-2">Filled oval with a stem</p>
      </div>
    </div>

    <p class="text-[#444] leading-[1.7] text-sm bg-[#fef3ee] border-l-4 border-purple px-4 py-3 rounded">
      💡 <strong>Memory tip:</strong> The more filled in the note looks, the shorter it lasts. A whole note is empty (4 beats), a half note is empty (2 beats), and a quarter note is filled (1 beat).
    </p>
  </section>

  <!-- Section 2: Counting Beats -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Counting Beats in 4/4 Time</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      In <strong>4/4 time</strong> (also called "common time"), there are <strong>4 beats per measure</strong>. Let's see how different notes fit:
    </p>

    <div class="space-y-6">
      <!-- Measure 1: 4 quarter notes -->
      <div class="bg-white rounded-lg p-5 border border-[#e8e6e0]">
        <p class="text-sm font-semibold text-navy mb-3">Measure 1: Four Quarter Notes = 4 Beats</p>
        <div class="mb-3 flex items-center justify-center gap-8">
          <div class="text-center">
            <svg viewBox="0 0 60 60" width="50" height="50">
              <ellipse cx="30" cy="35" rx="12" ry="9" fill="#3d3929" />
              <line x1="42" y1="35" x2="42" y2="12" stroke="#3d3929" stroke-width="1.5" />
            </svg>
            <p class="text-[0.85rem] text-[#666] mt-1">1</p>
          </div>
          <div class="text-center">
            <svg viewBox="0 0 60 60" width="50" height="50">
              <ellipse cx="30" cy="35" rx="12" ry="9" fill="#3d3929" />
              <line x1="42" y1="35" x2="42" y2="12" stroke="#3d3929" stroke-width="1.5" />
            </svg>
            <p class="text-[0.85rem] text-[#666] mt-1">2</p>
          </div>
          <div class="text-center">
            <svg viewBox="0 0 60 60" width="50" height="50">
              <ellipse cx="30" cy="35" rx="12" ry="9" fill="#3d3929" />
              <line x1="42" y1="35" x2="42" y2="12" stroke="#3d3929" stroke-width="1.5" />
            </svg>
            <p class="text-[0.85rem] text-[#666] mt-1">3</p>
          </div>
          <div class="text-center">
            <svg viewBox="0 0 60 60" width="50" height="50">
              <ellipse cx="30" cy="35" rx="12" ry="9" fill="#3d3929" />
              <line x1="42" y1="35" x2="42" y2="12" stroke="#3d3929" stroke-width="1.5" />
            </svg>
            <p class="text-[0.85rem] text-[#666] mt-1">4</p>
          </div>
        </div>
      </div>

      <!-- Measure 2: 2 half notes -->
      <div class="bg-white rounded-lg p-5 border border-[#e8e6e0]">
        <p class="text-sm font-semibold text-navy mb-3">Measure 2: Two Half Notes = 4 Beats</p>
        <div class="mb-3 flex items-center justify-center gap-12">
          <div class="text-center">
            <svg viewBox="0 0 60 60" width="50" height="50">
              <ellipse cx="25" cy="35" rx="14" ry="11" fill="none" stroke="#3d3929" stroke-width="1.5" />
              <line x1="39" y1="35" x2="39" y2="10" stroke="#3d3929" stroke-width="1.5" />
            </svg>
            <p class="text-[0.85rem] text-[#666] mt-1">1 & 2</p>
          </div>
          <div class="text-center">
            <svg viewBox="0 0 60 60" width="50" height="50">
              <ellipse cx="25" cy="35" rx="14" ry="11" fill="none" stroke="#3d3929" stroke-width="1.5" />
              <line x1="39" y1="35" x2="39" y2="10" stroke="#3d3929" stroke-width="1.5" />
            </svg>
            <p class="text-[0.85rem] text-[#666] mt-1">3 & 4</p>
          </div>
        </div>
      </div>

      <!-- Measure 3: 1 whole note -->
      <div class="bg-white rounded-lg p-5 border border-[#e8e6e0]">
        <p class="text-sm font-semibold text-navy mb-3">Measure 3: One Whole Note = 4 Beats</p>
        <div class="mb-3 flex items-center justify-center">
          <div class="text-center">
            <svg viewBox="0 0 60 60" width="50" height="50">
              <ellipse cx="30" cy="30" rx="16" ry="12" fill="none" stroke="#3d3929" stroke-width="1.5" />
            </svg>
            <p class="text-[0.85rem] text-[#666] mt-1">1, 2, 3, 4</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 3: Your First Melody - Ode to Joy -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Your First Melody: Ode to Joy</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Now you're ready to read and play your first melody! "Ode to Joy" by Beethoven is one of the most famous melodies in the world. Watch as the notes light up when you press play, and listen to how they sound together.
    </p>

    <!-- Melody display -->
    {#if odeToJoy}
      {#each odeToJoy.lines as line, lineIdx}
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
        {isPlaying ? 'Stop Playback' : 'Play Melody'}
      </button>
    {/if}

    <!-- Metronome -->
    <div class="mt-6">
      <p class="text-sm font-semibold text-navy mb-3">Practice with a steady beat:</p>
      <Metronome initialBpm={odeToJoy?.bpm || 100} />
    </div>
  </section>

  <!-- Section 4: Try It Yourself -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Try It Yourself</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Now it's your turn! The keyboard below shows all the notes used in Ode to Joy. Try to play the melody yourself, starting with the first line (E E F G). The virtual keyboard will highlight the keys you need.
    </p>

    {#if odeToJoy}
      <div class="mb-4">
        <p class="text-sm font-semibold text-navy mb-2">Note sequence for Line 1:</p>
        <p class="text-[#666] text-sm font-mono bg-white px-4 py-2 rounded border border-[#e8e6e0]">
          {odeToJoy.lines[0].join(' → ')}
        </p>
      </div>

      <VirtualKeyboard startOctave={3} endOctave={4} showLabels={true} />
    {/if}
  </section>

  <!-- Section 5: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test what you've learned? Identify how many beats each note gets in 4/4 time.
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >Start Quiz</button>
    {:else}
      <QuizEngine questions={quizQuestions} onComplete={onQuizComplete}>
        {#snippet children({ currentQuestion, questionIndex })}
          <div class="mb-6 bg-white rounded-lg p-8 border border-[#e8e6e0] flex justify-center">
            {@html renderNoteShape(currentQuestion.id.split('-')[1], 100)}
          </div>
        {/snippet}
      </QuizEngine>
    {/if}
  </section>
</LessonLayout>
