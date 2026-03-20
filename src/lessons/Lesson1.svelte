<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { playNote } from '../stores/audio';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(1)!;

  // Interactive state
  let activeKey = $state<string | null>(null);
  let highlightedNote = $state<string[]>([]);
  let showQuiz = $state(false);

  function handleNotePlay(note: string, midiNote: number) {
    playNote(midiNote);
    activeKey = note;
    setTimeout(() => { activeKey = null; }, 300);
  }

  function highlightNote(letter: string) {
    highlightedNote = ['C3', 'C4', 'D3', 'D4', 'E3', 'E4', 'F3', 'F4', 'G3', 'G4', 'A3', 'A4', 'B3', 'B4']
      .filter(n => n.startsWith(letter));
  }

  // Generate quiz questions
  const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const allLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateQuestions(): { questions: QuizQuestion[]; noteMap: Record<string, string> } {
    const questions: QuizQuestion[] = [];
    const noteMap: Record<string, string> = {};

    for (let i = 0; i < 10; i++) {
      const oct = Math.random() > 0.5 ? 3 : 4;
      const letter = naturalNotes[Math.floor(Math.random() * 7)];
      const noteId = `${letter}${oct}`;
      const distractors = shuffle(allLetters.filter(l => l !== letter)).slice(0, 3);
      const qId = `q${i}`;

      noteMap[qId] = noteId;
      questions.push({
        id: qId,
        prompt: 'What note is highlighted?',
        correctAnswer: letter,
        choices: shuffle([letter, ...distractors]),
      });
    }
    return { questions, noteMap };
  }

  let quizData = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(1, score, total, 0);
  }

  function startQuiz() {
    quizData = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: The Pattern -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The Pattern</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Look at a piano keyboard and you'll notice a repeating pattern of white and black keys. The black keys come in alternating groups of <strong>2</strong> and <strong>3</strong>. This pattern repeats across the entire keyboard and is your roadmap for finding any note.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      Try clicking the keys below to hear what they sound like:
    </p>
    <VirtualKeyboard startOctave={3} endOctave={4} onNotePlay={handleNotePlay} {activeKey} />
  </section>

  <!-- Section 2: Finding C -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Finding C</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      The note <strong>C</strong> is always the white key just to the <strong>left of each group of 2 black keys</strong>. Once you can find C, you can find every other note — they go in alphabetical order from C: C, D, E, F, G, A, B, then back to C.
    </p>
    <VirtualKeyboard startOctave={3} endOctave={4} highlightKeys={['C3', 'C4']} onNotePlay={handleNotePlay} />
  </section>

  <!-- Section 3: The Seven Notes -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">The Seven Natural Notes</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      There are 7 natural notes that repeat across the keyboard. Click each letter below to see where it sits:
    </p>
    <div class="flex gap-2 mb-4 flex-wrap">
      {#each naturalNotes as letter}
        <button
          class="px-4 py-2 rounded-lg border-2 text-[1rem] font-semibold cursor-pointer transition-all"
          style="border-color: {highlightedNote.some(n => n.startsWith(letter)) ? '#ce7e4f' : '#ddd'}; background: {highlightedNote.some(n => n.startsWith(letter)) ? '#fef3ee' : 'white'}; color: #3d3929;"
          onclick={() => highlightNote(letter)}
        >{letter}</button>
      {/each}
    </div>
    <VirtualKeyboard startOctave={3} endOctave={4} highlightKeys={highlightedNote} onNotePlay={handleNotePlay} />
  </section>

  <!-- Section 4: Octave Numbers -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Octave Numbers</h2>
    <p class="text-[#444] leading-[1.7] mb-3">
      Because the same 7 notes repeat, we add a number to specify <em>which</em> C, D, etc. we mean. The system starts from the bottom of the keyboard: C1 is low, C4 is <strong>middle C</strong> (the most important landmark), and C7 is near the top.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      On the keyboard below, notice how each octave starts on C and runs through B:
    </p>
    <VirtualKeyboard startOctave={3} endOctave={4} onNotePlay={handleNotePlay} showLabels={true} />
  </section>

  <!-- Section 5: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Ready to test what you've learned? Identify the highlighted note on the keyboard.
      </p>
      <button
        class="bg-navy text-white px-6 py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={startQuiz}
      >Start Quiz</button>
    {:else}
      <QuizEngine questions={quizData.questions} onComplete={onQuizComplete}>
        {#snippet children({ currentQuestion, questionIndex })}
          <div class="mb-4">
            <VirtualKeyboard
              startOctave={3}
              endOctave={4}
              highlightKeys={[quizData.noteMap[quizData.questions[questionIndex]?.id] || 'C4']}
              showLabels={false}
            />
          </div>
        {/snippet}
      </QuizEngine>
    {/if}
  </section>
</LessonLayout>
