<script lang="ts">
  import { playNote, playSequence } from '../stores/audio';
  import { TREBLE_NOTES, ALL_LETTERS, type Note } from '../data/notes';

  type Mode = 'note' | 'interval' | 'chord';

  interface IntervalType {
    name: string;
    semitones: number;
  }

  const INTERVALS: IntervalType[] = [
    { name: 'Unison', semitones: 0 },
    { name: 'Minor 2nd', semitones: 1 },
    { name: 'Major 2nd', semitones: 2 },
    { name: 'Minor 3rd', semitones: 3 },
    { name: 'Major 3rd', semitones: 4 },
    { name: 'Perfect 4th', semitones: 5 },
    { name: 'Perfect 5th', semitones: 7 },
    { name: 'Octave', semitones: 12 },
  ];

  let {
    mode = 'note',
    notePool = TREBLE_NOTES.map(n => n.id),
    onComplete,
  }: {
    mode?: Mode;
    notePool?: string[];
    onComplete?: (score: number, total: number) => void;
  } = $props();

  const TOTAL_QUESTIONS = 10;

  let questionIndex = $state(0);
  let selected = $state<string | null>(null);
  let correct = $state(0);
  let finished = $state(false);
  let currentNote = $state<Note | null>(null);
  let currentNote2 = $state<Note | null>(null);
  let currentChord = $state<'major' | 'minor' | null>(null);
  let choices = $state<string[]>([]);
  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getNoteById(id: string): Note | undefined {
    return TREBLE_NOTES.find(n => n.id === id);
  }

  function generateQuestion() {
    selected = null;

    if (mode === 'note') {
      generateNoteQuestion();
    } else if (mode === 'interval') {
      generateIntervalQuestion();
    } else if (mode === 'chord') {
      generateChordQuestion();
    }
  }

  function generateNoteQuestion() {
    const availableNotes = notePool
      .map(id => getNoteById(id))
      .filter((n): n is Note => n !== undefined);

    if (availableNotes.length === 0) return;

    currentNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    if (!currentNote) return;

    // Generate 3 distractor letters
    const correctLetter = currentNote.name;
    const distractors = shuffle(ALL_LETTERS.filter(l => l !== correctLetter)).slice(0, 3);
    choices = shuffle([correctLetter, ...distractors]);

    // Auto-play the note
    setTimeout(() => {
      playNote(currentNote!.midiNote, 0.8);
    }, 300);
  }

  function generateIntervalQuestion() {
    const availableNotes = notePool
      .map(id => getNoteById(id))
      .filter((n): n is Note => n !== undefined);

    if (availableNotes.length < 2) return;

    // Pick first note randomly
    currentNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    if (!currentNote) return;

    // Pick a random interval
    const randomInterval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
    const secondMidiNote = currentNote.midiNote + randomInterval.semitones;

    // Find note closest to the calculated MIDI note
    const candidate = TREBLE_NOTES.find(
      n => n.midiNote === secondMidiNote
    );
    currentNote2 = candidate || availableNotes[Math.floor(Math.random() * availableNotes.length)];
    if (!currentNote2) return;

    // All interval names as choices, shuffled
    choices = shuffle(INTERVALS.map(i => i.name));

    // Auto-play interval
    setTimeout(() => {
      playNote(currentNote!.midiNote, 0.5);
      playNote(currentNote2!.midiNote, 0.5, 0.7);
    }, 300);
  }

  function generateChordQuestion() {
    const availableNotes = notePool
      .map(id => getNoteById(id))
      .filter((n): n is Note => n !== undefined);

    if (availableNotes.length === 0) return;

    currentNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    if (!currentNote) return;

    currentChord = Math.random() < 0.5 ? 'major' : 'minor';
    choices = shuffle(['Major', 'Minor']);

    // Auto-play chord
    setTimeout(() => {
      const rootMidi = currentNote!.midiNote;
      const thirdInterval = currentChord === 'major' ? 4 : 3;
      const fifthMidi = rootMidi + 7;
      const thirdMidi = rootMidi + thirdInterval;

      playNote(rootMidi, 0.8);
      playNote(thirdMidi, 0.8, 0.7);
      playNote(fifthMidi, 0.8, 0.6);
    }, 300);
  }

  function handleAnswer(answer: string) {
    if (selected !== null) return;
    selected = answer;

    let isCorrect = false;
    if (mode === 'note') {
      isCorrect = answer === currentNote?.name;
    } else if (mode === 'interval') {
      const selectedSemitones = INTERVALS.find(i => i.name === answer)?.semitones ?? -1;
      const actualSemitones =
        (currentNote2?.midiNote ?? 0) - (currentNote?.midiNote ?? 0);
      isCorrect = selectedSemitones === actualSemitones;
    } else if (mode === 'chord') {
      isCorrect = answer === (currentChord === 'major' ? 'Major' : 'Minor');
    }

    if (isCorrect) {
      correct += 1;
    }
  }

  function playAgain() {
    if (mode === 'note' && currentNote) {
      playNote(currentNote.midiNote, 0.8);
    } else if (mode === 'interval' && currentNote && currentNote2) {
      playNote(currentNote.midiNote, 0.5);
      playNote(currentNote2.midiNote, 0.5, 0.7);
    } else if (mode === 'chord' && currentNote && currentChord) {
      const rootMidi = currentNote.midiNote;
      const thirdInterval = currentChord === 'major' ? 4 : 3;
      const fifthMidi = rootMidi + 7;
      const thirdMidi = rootMidi + thirdInterval;

      playNote(rootMidi, 0.8);
      playNote(thirdMidi, 0.8, 0.7);
      playNote(fifthMidi, 0.8, 0.6);
    }
  }

  function nextQuestion() {
    if (questionIndex + 1 >= TOTAL_QUESTIONS) {
      finished = true;
      onComplete?.(correct, TOTAL_QUESTIONS);
      return;
    }
    questionIndex += 1;
    generateQuestion();
  }

  function restart() {
    questionIndex = 0;
    selected = null;
    correct = 0;
    finished = false;
    generateQuestion();
  }

  // Initialize first question
  generateQuestion();

  function getButtonClass(choice: string): string {
    if (selected === null) return 'default';

    let correctAnswer = '';
    if (mode === 'note') {
      correctAnswer = currentNote?.name || '';
    } else if (mode === 'interval') {
      const selectedSemitones = INTERVALS.find(i => i.name === choice)?.semitones ?? -1;
      const actualSemitones =
        (currentNote2?.midiNote ?? 0) - (currentNote?.midiNote ?? 0);
      if (selectedSemitones === actualSemitones) {
        correctAnswer = choice;
      }
    } else if (mode === 'chord') {
      correctAnswer = currentChord === 'major' ? 'Major' : 'Minor';
    }

    if (choice === correctAnswer) return 'correct';
    if (choice === selected) return 'wrong';
    return 'dimmed';
  }

  function getButtonStyle(state: string): string {
    const base =
      'border-2 rounded-lg p-3 text-base font-medium cursor-pointer transition-all duration-150 flex-1 min-h-16';
    if (state === 'default') {
      return `${base} bg-white border-gray-300 text-gray-800 hover:border-purple hover:shadow-sm`;
    }
    if (state === 'correct') {
      return `${base} bg-correct-bg border-correct text-green-800`;
    }
    if (state === 'wrong') {
      return `${base} bg-wrong-bg border-wrong text-red-800`;
    }
    // dimmed
    return `${base} bg-white border-gray-300 text-gray-800 opacity-40`;
  }

  const modeLabel = $derived(
    mode === 'note' ? 'Note Recognition' : mode === 'interval' ? 'Interval Training' : 'Chord Training'
  );
</script>

{#if !finished}
  <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Progress indicator -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <span style="font-size: 0.875rem; color: #3d3929; font-weight: 500;">
        {modeLabel} • Question {questionIndex + 1} of {TOTAL_QUESTIONS}
      </span>
      <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; margin: 0 16px; overflow: hidden;">
        <div
          style="height: 100%; background: #ce7e4f; width: {((questionIndex + 1) / TOTAL_QUESTIONS) * 100}%; transition: width 0.3s ease;"
        ></div>
      </div>
    </div>

    <!-- Mode-specific prompt -->
    <div style="text-align: center; font-size: 1.125rem; margin-bottom: 24px; color: #3d3929; font-weight: 500;">
      {#if mode === 'note'}
        What note is this?
      {:else if mode === 'interval'}
        What interval is this?
      {:else if mode === 'chord'}
        Is this major or minor?
      {/if}
    </div>

    <!-- Play Again button -->
    <div style="display: flex; justify-content: center; margin-bottom: 24px;">
      <button
        onclick={playAgain}
        style="background: #ce7e4f; color: white; padding: 10px 24px; border-radius: 8px; border: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.15s; hover:opacity: 0.9;"
      >
        🔊 Play Again
      </button>
    </div>

    <!-- Answer buttons (2x2 grid) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      {#each choices as choice}
        <button
          class={getButtonStyle(getButtonClass(choice))}
          onclick={() => handleAnswer(choice)}
        >
          {choice}
        </button>
      {/each}
    </div>

    <!-- Next button -->
    {#if selected !== null}
      <div style="display: flex; justify-content: center;">
        <button
          onclick={nextQuestion}
          style="background: #3d3929; color: white; padding: 12px 36px; border-radius: 8px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.15s; hover:opacity: 0.9;"
        >
          Next
        </button>
      </div>
    {/if}
  </div>
{:else}
  <!-- Summary card -->
  <div style="width: 100%; max-width: 500px; margin: 0 auto; padding: 40px 24px;">
    <div
      style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 32px; text-align: center;"
    >
      <h2 style="font-size: 1.875rem; font-weight: 700; color: #3d3929; margin-bottom: 24px;">
        Ear Training Complete!
      </h2>

      <div style="margin-bottom: 32px;">
        <div style="font-size: 3rem; font-weight: 700; color: #28a745; margin-bottom: 8px;">
          {correct}/{TOTAL_QUESTIONS}
        </div>
        <div style="font-size: 1rem; color: #666;">
          {Math.round((correct / TOTAL_QUESTIONS) * 100)}% Correct
        </div>
      </div>

      <button
        onclick={restart}
        style="background: #ce7e4f; color: white; padding: 14px 32px; border-radius: 8px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.15s; width: 100%;"
      >
        Try Again
      </button>
    </div>
  </div>
{/if}
