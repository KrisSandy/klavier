<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import Metronome from '../components/Metronome.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { getNoteById } from '../data/notes';
  import { playNote, playSequence } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(6)!;
  const songs = getSongsByLesson(6);
  const kushi = songs[0]; // Kushi Theme

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
    const allNotes = kushi.lines.flat();
    const noteSequence = allNotes.map(id => {
      const note = getNoteById(id);
      return { midiNote: note?.midiNote ?? 60, duration: 1 };
    });

    isPlaying = true;
    playbackStop = playSequence(noteSequence, kushi.bpm, (index) => {
      highlightIndex = index;
    });

    // Auto-stop after sequence finishes
    const totalDuration = noteSequence.length * (60 / kushi.bpm) * 1000;
    setTimeout(() => {
      isPlaying = false;
      highlightIndex = -1;
    }, totalDuration + 200);
  }

  // Get first 2 lines for practice section
  const practiceLines = kushi.lines.slice(0, 2);
  const practiceNotes = practiceLines.flat();
</script>

<LessonLayout {lesson}>
  <!-- Section 1: Putting It Together -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Putting It Together</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Now comes the exciting part: <strong>playing with both hands at the same time</strong>! Real piano music uses the treble clef (right hand, melody) and the bass clef (left hand, accompaniment) together on a "grand staff."
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      For now, we'll focus on learning the melody thoroughly with the right hand before adding the left hand. This is the standard practice method that professionals use: <strong>learn and perfect one hand, then add the other</strong>.
    </p>
    <p class="text-[#444] leading-[1.7]">
      You're about to play your first real piece: the <strong>Kushi Theme</strong>. Take your time, follow the learning strategy below, and remember — slow and steady wins the race!
    </p>
  </section>

  <!-- Section 2: Learning Strategy -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Learning Strategy</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Follow these steps to learn any new piece efficiently:
    </p>
    <div class="space-y-3">
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-1"><strong>1. Listen First</strong></p>
        <p class="text-sm text-[#666]">Play through the entire piece (or listen to a recording) without worrying about playing it yourself. Your brain learns the shape of the melody.</p>
      </div>
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-1"><strong>2. Break It Into Sections</strong></p>
        <p class="text-sm text-[#666]">Divide the piece into small chunks: 2–4 measures each. Don't try to learn the whole thing at once.</p>
      </div>
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-1"><strong>3. Practice Hands Separately</strong></p>
        <p class="text-sm text-[#666]">Master the right hand melody alone first. Get it smooth and confident. Only then do you add the left hand. As you practice each hand alone, <strong>pay attention to your finger numbers</strong> — the right hand stays in C position (fingers 1–2–3–4–5 on C–D–E–F–G), and the left hand stays in C position (fingers 5–4–3–2–1 on C–D–E–F–G). Learning the same fingering from the start means combining hands later will be seamless.</p>
      </div>
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-1"><strong>4. Speed Up Gradually</strong></p>
        <p class="text-sm text-[#666]">Start at half-speed or slower. Once a section is perfect, increase the tempo by 5–10 BPM. Use the metronome!</p>
      </div>
      <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
        <p class="font-semibold text-navy mb-1"><strong>5. Connect the Dots</strong></p>
        <p class="text-sm text-[#666]">Play one section, then add the next. Gradually build the whole piece from small, confident pieces.</p>
      </div>
    </div>
  </section>

  <!-- Section 3: Kushi Theme -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Kushi Theme</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here is the full melody you're about to learn. Press Play to hear how it should sound, then we'll practice the first few lines together.
    </p>

    {#if kushi}
      {#each kushi.lines as line, lineIdx}
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
        {isPlaying ? 'Stop Playback' : 'Play Full Melody'}
      </button>
    {/if}

    <!-- Metronome -->
    <div class="mt-8">
      <p class="text-sm font-semibold text-navy mb-3">Practice with a steady beat (recommended: start at 40 BPM):</p>
      <Metronome initialBpm={kushi?.bpm || 80} />
    </div>
  </section>

  <!-- Section 4: Practice Section by Section -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Practice Section by Section</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Let's start small. Here are the first 2 lines of Kushi. Get comfortable with these before moving on. Use the virtual keyboard below to practice.
    </p>

    <!-- Practice lines display -->
    {#if kushi}
      {#each practiceLines as line, lineIdx}
        <div class="mb-6">
          <p class="text-sm text-[#999] mb-2">Line {lineIdx + 1}</p>
          <SongStaff notes={line} />
        </div>
      {/each}

      <div class="mb-6">
        <p class="text-sm font-semibold text-navy mb-2">Note sequence for Lines 1–2:</p>
        <p class="text-[#666] text-sm font-mono bg-white px-4 py-2 rounded border border-[#e8e6e0]">
          {practiceNotes.join(' → ')}
        </p>
      </div>

      <!-- Virtual keyboard for practice -->
      <div class="bg-[#faf9f5] rounded-lg p-6 border border-[#dad9d4]">
        <p class="text-sm font-semibold text-navy mb-4">Practice keyboard (highlighted notes = lines 1–2):</p>
        <VirtualKeyboard startOctave={3} endOctave={5} highlightKeys={practiceNotes} showLabels={true} />
      </div>
    {/if}
  </section>

  <!-- Section 5: Practice Tips -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Practice Tips</h2>
    <div class="bg-[#fef3ee] border-l-4 border-purple rounded-lg p-6">
      <ul class="space-y-3 text-[#444]">
        <li class="flex items-start gap-3">
          <span class="text-purple font-bold">•</span>
          <span><strong>Start at half speed:</strong> Use the metronome at 40 BPM. Speed comes with confidence, not pressure.</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-purple font-bold">•</span>
          <span><strong>Don't look at your hands:</strong> Force yourself to read the notes on the staff, not your fingers.</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-purple font-bold">•</span>
          <span><strong>Count out loud:</strong> Say "1-2-3-4" as you play. This keeps you locked in with the beat.</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-purple font-bold">•</span>
          <span><strong>Finger consistency:</strong> Use the exact same fingering every time you play — never improvise. Consistent fingering builds automaticity, so your fingers remember the path without thinking.</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-purple font-bold">•</span>
          <span><strong>Take breaks:</strong> Practice 15–20 minutes, then rest. Your brain learns during the rest, not just during playing.</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-purple font-bold">•</span>
          <span><strong>Be patient with yourself:</strong> You've learned a lot! This is just putting it all together. Mistakes are part of learning.</span>
        </li>
      </ul>
    </div>
  </section>
</LessonLayout>
