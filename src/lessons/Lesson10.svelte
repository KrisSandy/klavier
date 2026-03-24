<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import SongStaff from '../components/SongStaff.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { getSongsByLesson } from '../data/songs';
  import { getNoteById } from '../data/notes';
  import { playNote, playSequence } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(10)!;
  const songs = getSongsByLesson(9);
  const minuet = songs[0]; // Minuet in G

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

    if (minuet) {
      const allNotes = minuet.lines.flat();
      const noteSequence = allNotes.map(id => {
        const note = getNoteById(id);
        return { midiNote: note?.midiNote ?? 60, duration: 1 };
      });

      isPlaying = true;
      playbackStop = playSequence(noteSequence, minuet.bpm, (index) => {
        highlightIndex = index;
      });

      const totalDuration = noteSequence.length * (60 / minuet.bpm) * 1000;
      setTimeout(() => {
        isPlaying = false;
        highlightIndex = -1;
      }, totalDuration + 200);
    }
  }

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

    // Question 1: What does forte mean?
    questions.push({
      id: 'q1',
      prompt: 'What does the Italian word "forte" mean in music?',
      correctAnswer: 'Loud',
      choices: shuffle(['Soft', 'Loud', 'Medium', 'Very fast']),
    });

    // Question 2: What does piano mean (soft)?
    questions.push({
      id: 'q2',
      prompt: 'In music, what does "piano" mean?',
      correctAnswer: 'Soft',
      choices: shuffle(['The instrument', 'Soft', 'Medium', 'Loud']),
    });

    // Question 3: Crescendo symbol
    questions.push({
      id: 'q3',
      prompt: 'What does this symbol < indicate in music?',
      correctAnswer: 'Gradually getting louder (crescendo)',
      choices: shuffle([
        'Gradually getting softer (diminuendo)',
        'Gradually getting louder (crescendo)',
        'Play softly',
        'Play loudly',
      ]),
    });

    // Question 4: Diminuendo symbol
    questions.push({
      id: 'q4',
      prompt: 'What does this symbol > indicate in music?',
      correctAnswer: 'Gradually getting softer (diminuendo)',
      choices: shuffle([
        'Gradually getting louder (crescendo)',
        'Gradually getting softer (diminuendo)',
        'Play loudly',
        'Play softly',
      ]),
    });

    // Question 5: Mezzo-piano meaning
    questions.push({
      id: 'q5',
      prompt: 'What does "mezzo-piano" (mp) mean?',
      correctAnswer: 'Moderately soft',
      choices: shuffle(['Very soft', 'Moderately soft', 'Medium', 'Loud']),
    });

    // Question 6: Mezzo-forte meaning
    questions.push({
      id: 'q6',
      prompt: 'What does "mezzo-forte" (mf) mean?',
      correctAnswer: 'Moderately loud',
      choices: shuffle(['Soft', 'Moderately soft', 'Moderately loud', 'Very loud']),
    });

    // Question 7: Loudness comparison
    questions.push({
      id: 'q7',
      prompt: 'Which is louder: mezzo-forte (mf) or forte (f)?',
      correctAnswer: 'Forte (f)',
      choices: shuffle(['Mezzo-forte (mf)', 'Forte (f)', 'They are equal', 'It depends']),
    });

    // Question 8: Dynamic markings purpose
    questions.push({
      id: 'q8',
      prompt: 'What is the main purpose of dynamic markings in sheet music?',
      correctAnswer: 'To tell the performer how loud or soft to play',
      choices: shuffle([
        'To indicate the tempo',
        'To show which notes to emphasize',
        'To tell the performer how loud or soft to play',
        'To mark the end of a piece',
      ]),
    });

    return questions;
  }

  let quizQuestions = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(9, score, total, 0);
  }

  function startQuiz() {
    quizQuestions = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: What Are Dynamics? -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">What Are Dynamics?</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      So far, you've learned to read the <strong>pitch</strong> (which note to play) and the <strong>duration</strong> (how long to hold it). But music needs one more element to truly come alive: <strong>dynamics</strong>.
    </p>

    <p class="text-[#444] leading-[1.7] mb-4">
      <strong>Dynamics</strong> refer to how loud or soft to play. Music isn't just one volume level — it's constantly changing to create emotion and interest. A crescendo (getting louder) can build tension, while a diminuendo (getting softer) can bring peace.
    </p>

    <p class="text-[#444] leading-[1.7] mb-6">
      Musicians use Italian terms and symbols to indicate dynamics. Here's the scale from softest to loudest:
    </p>

    <div class="space-y-2">
      <div class="flex items-center gap-4 p-3 bg-white rounded border border-[#e8e6e0]">
        <span class="font-bold text-navy w-12">pp</span>
        <span class="font-semibold text-[#444]">Pianissimo</span>
        <span class="text-[#666] text-sm flex-grow">Very soft</span>
      </div>
      <div class="flex items-center gap-4 p-3 bg-white rounded border border-[#e8e6e0]">
        <span class="font-bold text-navy w-12">p</span>
        <span class="font-semibold text-[#444]">Piano</span>
        <span class="text-[#666] text-sm flex-grow">Soft</span>
      </div>
      <div class="flex items-center gap-4 p-3 bg-white rounded border border-[#e8e6e0]">
        <span class="font-bold text-navy w-12">mp</span>
        <span class="font-semibold text-[#444]">Mezzo-piano</span>
        <span class="text-[#666] text-sm flex-grow">Moderately soft</span>
      </div>
      <div class="flex items-center gap-4 p-3 bg-white rounded border border-[#e8e6e0]">
        <span class="font-bold text-navy w-12">mf</span>
        <span class="font-semibold text-[#444]">Mezzo-forte</span>
        <span class="text-[#666] text-sm flex-grow">Moderately loud</span>
      </div>
      <div class="flex items-center gap-4 p-3 bg-white rounded border border-[#e8e6e0]">
        <span class="font-bold text-navy w-12">f</span>
        <span class="font-semibold text-[#444]">Forte</span>
        <span class="text-[#666] text-sm flex-grow">Loud</span>
      </div>
      <div class="flex items-center gap-4 p-3 bg-white rounded border border-[#e8e6e0]">
        <span class="font-bold text-navy w-12">ff</span>
        <span class="font-semibold text-[#444]">Fortissimo</span>
        <span class="text-[#666] text-sm flex-grow">Very loud</span>
      </div>
    </div>
  </section>

  <!-- Section 2: Dynamic Markings Table -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Dynamic Markings Reference</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here's a complete reference for common dynamic markings:
    </p>

    <div class="overflow-x-auto bg-white rounded-lg border border-[#e8e6e0]">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[#e8e6e0] bg-[#faf9f5]">
            <th class="px-4 py-3 text-left text-sm font-bold text-navy">Symbol</th>
            <th class="px-4 py-3 text-left text-sm font-bold text-navy">Italian Term</th>
            <th class="px-4 py-3 text-left text-sm font-bold text-navy">English Translation</th>
            <th class="px-4 py-3 text-left text-sm font-bold text-navy">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-[#e8e6e0]">
            <td class="px-4 py-3 text-[1.2rem] text-navy font-bold">pp</td>
            <td class="px-4 py-3 text-[#444]">Pianissimo</td>
            <td class="px-4 py-3 text-[#444]">Very soft</td>
            <td class="px-4 py-3 text-[#666] text-sm">As quiet as possible</td>
          </tr>
          <tr class="border-b border-[#e8e6e0] bg-[#faf9f5]">
            <td class="px-4 py-3 text-[1.2rem] text-navy font-bold">p</td>
            <td class="px-4 py-3 text-[#444]">Piano</td>
            <td class="px-4 py-3 text-[#444]">Soft</td>
            <td class="px-4 py-3 text-[#666] text-sm">Quieter than normal</td>
          </tr>
          <tr class="border-b border-[#e8e6e0]">
            <td class="px-4 py-3 text-[1.2rem] text-navy font-bold">mp</td>
            <td class="px-4 py-3 text-[#444]">Mezzo-piano</td>
            <td class="px-4 py-3 text-[#444]">Moderately soft</td>
            <td class="px-4 py-3 text-[#666] text-sm">Between soft and normal</td>
          </tr>
          <tr class="border-b border-[#e8e6e0] bg-[#faf9f5]">
            <td class="px-4 py-3 text-[1.2rem] text-navy font-bold">mf</td>
            <td class="px-4 py-3 text-[#444]">Mezzo-forte</td>
            <td class="px-4 py-3 text-[#444]">Moderately loud</td>
            <td class="px-4 py-3 text-[#666] text-sm">Between normal and loud</td>
          </tr>
          <tr class="border-b border-[#e8e6e0]">
            <td class="px-4 py-3 text-[1.2rem] text-navy font-bold">f</td>
            <td class="px-4 py-3 text-[#444]">Forte</td>
            <td class="px-4 py-3 text-[#444]">Loud</td>
            <td class="px-4 py-3 text-[#666] text-sm">Louder than normal</td>
          </tr>
          <tr class="bg-[#faf9f5]">
            <td class="px-4 py-3 text-[1.2rem] text-navy font-bold">ff</td>
            <td class="px-4 py-3 text-[#444]">Fortissimo</td>
            <td class="px-4 py-3 text-[#444]">Very loud</td>
            <td class="px-4 py-3 text-[#666] text-sm">As loud as possible</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-[#fef3ee] border-l-4 border-purple rounded-lg p-4 mt-6">
      <p class="text-sm text-[#444]">
        <strong>💡 Memory tip:</strong> "Piano" means soft (the word for the instrument, piano, comes from the Italian word for soft because it could play at different dynamics — unlike harpsichords!)
      </p>
    </div>
  </section>

  <!-- Section 3: Crescendo & Diminuendo -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Crescendo & Diminuendo</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Sometimes, instead of jumping from one volume to another, music <strong>gradually</strong> changes volume. These gradual changes are called:
    </p>

    <ul class="text-[#444] leading-[1.7] space-y-3 ml-6 mb-6">
      <li>• <strong>Crescendo (cresc.)</strong> — Gradually getting louder over time</li>
      <li>• <strong>Diminuendo (dim.)</strong> — Gradually getting softer over time</li>
    </ul>

    <p class="text-[#444] leading-[1.7] mb-6">
      These are shown using <strong>hairpin symbols</strong>:
    </p>

    <div class="space-y-6">
      <!-- Crescendo -->
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
        <p class="text-sm font-semibold text-navy mb-4">Crescendo (getting louder):</p>
        <div class="flex items-center gap-6 mb-4">
          <svg viewBox="0 0 200 60" width="200" height="60">
            <text x="10" y="35" font-size="14" fill="#666">Soft</text>
            <path d="M 60 20 L 140 40" stroke="#3d3929" stroke-width="2" fill="none" />
            <path d="M 60 40 L 140 20" stroke="#3d3929" stroke-width="2" fill="none" />
            <text x="150" y="35" font-size="14" fill="#666">Loud</text>
          </svg>
        </div>
        <p class="text-[#666] text-sm">
          Start soft and gradually build to loud. This is written as: <span class="font-mono bg-[#f5f4f0] px-2 py-1 rounded">cresc.</span>
        </p>
      </div>

      <!-- Diminuendo -->
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
        <p class="text-sm font-semibold text-navy mb-4">Diminuendo (getting softer):</p>
        <div class="flex items-center gap-6 mb-4">
          <svg viewBox="0 0 200 60" width="200" height="60">
            <text x="10" y="35" font-size="14" fill="#666">Loud</text>
            <path d="M 60 20 L 140 40" stroke="#3d3929" stroke-width="2" fill="none" />
            <path d="M 60 40 L 140 20" stroke="#3d3929" stroke-width="2" fill="none" />
            <text x="150" y="35" font-size="14" fill="#666">Soft</text>
          </svg>
        </div>
        <p class="text-[#666] text-sm">
          Start loud and gradually fade to soft. This is written as: <span class="font-mono bg-[#f5f4f0] px-2 py-1 rounded">dim.</span>
        </p>
      </div>
    </div>

    <p class="text-[#444] leading-[1.7] mt-6">
      Crescendos and diminuendos are essential for creating emotional depth. A crescendo builds anticipation and excitement, while a diminuendo creates a sense of resolution and peace.
    </p>
  </section>

  <!-- Section 4: Practice with Dynamics -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Practice with Dynamics</h2>
    <p class="text-[#444] leading-[1.7] mb-6">
      Now let's practice playing notes at different volumes! Try the exercises below:
    </p>

    <div class="bg-[#fdf6ee] border border-[#f0dcc8] rounded-lg p-4 mb-6">
      <p class="text-[#444] leading-[1.7] text-sm mb-3">
        <strong>Finger Control for Dynamics:</strong> Dynamic control comes from your fingers and wrist, not from tensing your arms. For <strong>piano (soft)</strong>, use a relaxed, light finger drop from close to the keys. For <strong>forte (loud)</strong>, use more finger energy and slightly higher key drops, but keep your wrist loose.
      </p>
      <p class="text-[#444] leading-[1.7] text-sm">
        Pro tip: Finger 3 (middle finger) is naturally the strongest; fingers 4 and 5 are weaker. Practice them deliberately to even out your dynamics across all five fingers.
      </p>
    </div>

    <div class="space-y-6">
      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
        <p class="text-sm font-semibold text-navy mb-4">Exercise 1: Play soft (pianissimo)</p>
        <p class="text-[#666] text-sm mb-4">
          Select a note below and play it very quietly (pp). Your touch should be light and gentle.
        </p>
        <VirtualKeyboard startOctave={3} endOctave={5} showLabels={true} />
      </div>

      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
        <p class="text-sm font-semibold text-navy mb-4">Exercise 2: Play loud (fortissimo)</p>
        <p class="text-[#666] text-sm mb-4">
          Select the same note and play it very loudly (ff). Strike the key with more force and let the sound ring.
        </p>
        <VirtualKeyboard startOctave={3} endOctave={5} showLabels={true} />
      </div>

      <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
        <p class="text-sm font-semibold text-navy mb-4">Exercise 3: Crescendo (getting louder)</p>
        <p class="text-[#666] text-sm mb-4">
          Play a single note repeatedly, starting very soft and gradually getting louder with each repetition. You should hear the volume climb.
        </p>
        <VirtualKeyboard startOctave={3} endOctave={5} showLabels={true} />
      </div>

      <div class="bg-[#fef3ee] border-l-4 border-purple rounded-lg p-4">
        <p class="text-sm text-[#444]">
          <strong>💡 Practice tip:</strong> Dynamics are created by how hard you strike the key and how quickly you release it. Softer = lighter touch. Louder = more force. A good pianist can play the entire range of dynamics on the same note!
        </p>
      </div>
    </div>
  </section>

  <!-- Section 5: Play Minuet in G -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Play Minuet in G</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Now let's listen to a classical piece with beautiful dynamic variation: <strong>Minuet in G</strong> by Johann Sebastian Bach. Pay attention to how the volume changes to create expression and shape the phrases.
    </p>

    {#if minuet}
      {#each minuet.lines as line, lineIdx}
        <div class="mb-6">
          <p class="text-sm text-[#999] mb-2">Line {lineIdx + 1}</p>
          <SongStaff notes={line} {highlightIndex} />
        </div>
      {/each}

      <button
        class="bg-purple text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity mb-6"
        onclick={playMelody}
      >
        {isPlaying ? 'Stop Playback' : 'Play Minuet in G'}
      </button>
    {/if}

    <div class="bg-[#fef3ee] border-l-4 border-purple rounded-lg p-4 mt-6">
      <p class="text-sm text-[#444]">
        <strong>💡 What to listen for:</strong> Notice how the music "breathes." Phrases often start softer and build energy, then release. This natural ebb and flow of energy is what makes music expressive!
      </p>
    </div>
  </section>

  <!-- Section 6: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test your understanding of dynamics and expression? Take the quiz below!
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >
        Start Quiz
      </button>
    {:else}
      <QuizEngine questions={quizQuestions} onComplete={onQuizComplete} />
    {/if}
  </section>
</LessonLayout>
