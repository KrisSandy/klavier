<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { playNote, setReverb } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(17)!;
  const songs = getSongsByLesson(16);
  const song = songs[0]; // Clair de Lune simplified

  let showQuiz = $state(false);
  let reverbAmount = $state(0.3);
  let activeKey = $state<string | null>(null);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function handleReverbChange(amount: number) {
    reverbAmount = amount;
    setReverb(amount);
  }

  function handleNotePlay(note: string, midiNote: number) {
    playNote(midiNote, 1.5, 0.6);
    activeKey = note;
    setTimeout(() => { activeKey = null; }, 300);
  }

  // Demo: play a chord with and without sustain
  function playWithSustain() {
    setReverb(0.8);
    const notes = [60, 64, 67]; // C major chord
    notes.forEach((n, i) => {
      setTimeout(() => playNote(n, 2, 0.5), i * 300);
    });
    setTimeout(() => setReverb(reverbAmount), 3000);
  }

  function playWithoutSustain() {
    setReverb(0);
    const notes = [60, 64, 67];
    notes.forEach((n, i) => {
      setTimeout(() => playNote(n, 0.3, 0.5), i * 300);
    });
    setTimeout(() => setReverb(reverbAmount), 2000);
  }

  function generateQuestions(): QuizQuestion[] {
    return [
      {
        id: 'q1',
        prompt: 'What does the sustain (damper) pedal do?',
        correctAnswer: 'Lifts all dampers, allowing strings to vibrate freely',
        choices: shuffle(['Lifts all dampers, allowing strings to vibrate freely', 'Makes the sound louder', 'Changes the pitch of notes', 'Plays notes automatically']),
      },
      {
        id: 'q2',
        prompt: 'Which foot typically operates the sustain pedal?',
        correctAnswer: 'Right foot',
        choices: shuffle(['Right foot', 'Left foot', 'Either foot', 'It depends on the piece']),
      },
      {
        id: 'q3',
        prompt: 'What is "legato pedaling"?',
        correctAnswer: 'Pressing the pedal as you play the next note, creating seamless transitions',
        choices: shuffle(['Pressing the pedal as you play the next note, creating seamless transitions', 'Holding the pedal throughout the entire piece', 'Using the pedal only on the first beat', 'Not using the pedal at all']),
      },
      {
        id: 'q4',
        prompt: 'What happens if you hold the sustain pedal too long?',
        correctAnswer: 'Notes blur together and the sound becomes muddy',
        choices: shuffle(['Notes blur together and the sound becomes muddy', 'The piano breaks', 'Notes get louder', 'Nothing changes']),
      },
      {
        id: 'q5',
        prompt: 'The symbol "Ped." in sheet music means...',
        correctAnswer: 'Press the sustain pedal down',
        choices: shuffle(['Press the sustain pedal down', 'Play louder', 'Use the left pedal', 'Slow down']),
      },
      {
        id: 'q6',
        prompt: 'The asterisk (*) symbol after "Ped." means...',
        correctAnswer: 'Release the sustain pedal',
        choices: shuffle(['Release the sustain pedal', 'Play staccato', 'Speed up', 'Repeat the section']),
      },
      {
        id: 'q7',
        prompt: 'What is the una corda (left) pedal used for?',
        correctAnswer: 'Creating a softer, more muted tone',
        choices: shuffle(['Creating a softer, more muted tone', 'Sustaining notes', 'Playing louder', 'Changing the key']),
      },
      {
        id: 'q8',
        prompt: 'When should you change the sustain pedal?',
        correctAnswer: 'When the harmony changes',
        choices: shuffle(['When the harmony changes', 'Every measure', 'Every beat', 'Only at the beginning']),
      },
    ];
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(16, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: The Sustain Pedal -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The Sustain Pedal</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      The <strong>sustain pedal</strong> (also called the damper pedal) is the rightmost pedal on a piano. When you press it, all the dampers lift off the strings, allowing notes to ring out even after you release the keys. This creates a rich, resonant, connected sound.
    </p>
    <p class="text-[#444] leading-[1.7] mb-3">
      It's one of the most expressive tools a pianist has. Almost every piece of piano music uses it — from classical sonatas to jazz ballads to pop songs.
    </p>
  </section>

  <!-- Section 2: Hear the Difference -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Hear the Difference</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Listen to the same C major chord played with and without sustain. The difference is dramatic:
    </p>
    <div class="flex gap-4 mb-6">
      <button
        class="flex-1 p-4 rounded-lg border-2 border-[#e8e6e0] bg-white hover:border-purple transition-all text-center cursor-pointer"
        onclick={playWithoutSustain}
      >
        <p class="font-semibold text-navy mb-1">Without Sustain</p>
        <p class="text-xs text-[#666]">Short, detached notes</p>
      </button>
      <button
        class="flex-1 p-4 rounded-lg border-2 border-[#e8e6e0] bg-white hover:border-purple transition-all text-center cursor-pointer"
        onclick={playWithSustain}
      >
        <p class="font-semibold text-navy mb-1">With Sustain</p>
        <p class="text-xs text-[#666]">Rich, connected sound</p>
      </button>
    </div>
  </section>

  <!-- Section 3: Pedaling Technique -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Pedaling Technique</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      The most common technique is <strong>legato pedaling</strong> (also called syncopated pedaling). The sequence is:
    </p>
    <div class="space-y-3 mb-4">
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">1</span>
        <p class="text-[#444]"><strong>Play a note or chord</strong> while the pedal is up.</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">2</span>
        <p class="text-[#444]"><strong>Press the pedal down</strong> immediately after playing.</p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">3</span>
        <p class="text-[#444]"><strong>Play the next note/chord.</strong></p>
      </div>
      <div class="flex gap-3 items-start">
        <span class="text-purple font-bold text-lg shrink-0">4</span>
        <p class="text-[#444]"><strong>Quickly lift and re-press the pedal</strong> — this clears the old notes and catches the new ones.</p>
      </div>
    </div>
    <div class="bg-white rounded-lg p-4 border-l-4 border-purple">
      <p class="text-[#444] text-sm"><strong>Key insight:</strong> The pedal change happens <em>after</em> you play the new note, not before. This ensures there's no gap in sound between notes.</p>
    </div>
  </section>

  <!-- Section 4: Reverb Slider (simulates sustain) -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Try It: Adjustable Sustain</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Use the slider below to adjust the sustain (reverb) amount, then play notes on the keyboard to hear the effect:
    </p>
    <div class="mb-4 flex items-center gap-4">
      <span class="text-sm text-[#666] shrink-0">Dry</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={reverbAmount}
        oninput={(e) => handleReverbChange(parseFloat((e.target as HTMLInputElement).value))}
        style="flex: 1; accent-color: #ce7e4f;"
      />
      <span class="text-sm text-[#666] shrink-0">Wet</span>
      <span class="text-sm font-mono text-navy w-10 text-right">{(reverbAmount * 100).toFixed(0)}%</span>
    </div>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
      <VirtualKeyboard startOctave={3} endOctave={5} onNotePlay={handleNotePlay} {activeKey} showLabels={true} />
    </div>
  </section>

  <!-- Section 5: Clair de Lune -->
  {#if song}
    <section class="mb-10">
      <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">{song.title}</h2>
      <p class="text-[#444] leading-[1.7] mb-4">
        This simplified excerpt showcases how sustain creates a flowing, dreamlike quality. Try playing it with high reverb to hear how the arpeggiated notes blend together:
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

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of pedaling and sustain?
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
