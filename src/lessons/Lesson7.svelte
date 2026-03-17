<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import RhythmTrainer from '../components/RhythmTrainer.svelte';
  import QuizEngine from '../components/QuizEngine.svelte';
  import type { QuizQuestion } from '../components/QuizEngine.svelte';
  import { getLessonById } from '../data/lessons';
  import { progress } from '../stores/progress.svelte';

  const lesson = getLessonById(7)!;

  let showQuiz = $state(false);

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

    // Question 1: How many beats do eighth notes get?
    questions.push({
      id: 'q1',
      prompt: 'How many beats does a single eighth note get in 4/4 time?',
      correctAnswer: '0.5 beats',
      choices: shuffle(['0.5 beats', '1 beat', '2 beats', '1.5 beats']),
    });

    // Question 2: How many eighth notes in one beat?
    questions.push({
      id: 'q2',
      prompt: 'How many eighth notes fit in one quarter note (1 beat)?',
      correctAnswer: '2',
      choices: shuffle(['1', '2', '3', '4']),
    });

    // Question 3: How many eighth notes in one measure?
    questions.push({
      id: 'q3',
      prompt: 'How many eighth notes fit in one measure of 4/4 time?',
      correctAnswer: '8',
      choices: shuffle(['4', '6', '8', '16']),
    });

    // Question 4: Counting pattern
    questions.push({
      id: 'q4',
      prompt: 'What is the correct way to count a pattern of four eighth notes followed by a quarter note?',
      correctAnswer: '1-and-2-and-3',
      choices: shuffle(['1-2-3-4', '1-and-2-and-3', '1-and-2-and-3-and-4', 'one-two-three']),
    });

    // Question 5: Eighth note symbol
    questions.push({
      id: 'q5',
      prompt: 'Which symbol represents an eighth note?',
      correctAnswer: '♪',
      choices: shuffle(['○', '𝅗𝅥', '♩', '♪']),
    });

    // Question 6: Two eighth notes duration
    questions.push({
      id: 'q6',
      prompt: 'How many beats do two eighth notes equal together?',
      correctAnswer: '1 beat',
      choices: shuffle(['0.5 beats', '1 beat', '1.5 beats', '2 beats']),
    });

    // Question 7: Subdivision concept
    questions.push({
      id: 'q7',
      prompt: 'An eighth note is created by subdividing what larger note value?',
      correctAnswer: 'Quarter note',
      choices: shuffle(['Whole note', 'Half note', 'Quarter note', 'Sixteenth note']),
    });

    // Question 8: "And" counting explanation
    questions.push({
      id: 'q8',
      prompt: 'In the counting pattern "1-and-2-and-3-and-4-and," the "and" represents which beat?',
      correctAnswer: 'The second eighth note of each beat',
      choices: shuffle([
        'The whole beat',
        'The first eighth note of each beat',
        'The second eighth note of each beat',
        'A rest',
      ]),
    });

    return questions;
  }

  let quizQuestions = $state(generateQuestions());

  function onQuizComplete(score: number, total: number) {
    progress.saveQuizScore(7, score, total, 0);
  }

  function startQuiz() {
    quizQuestions = generateQuestions();
    showQuiz = true;
  }
</script>

<LessonLayout {lesson}>
  <!-- Section 1: Subdividing the Beat -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Subdividing the Beat</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      So far, you've learned whole notes, half notes, and quarter notes. But music can move faster! An <strong>eighth note</strong> is created by subdividing a beat into two smaller parts.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4">
      Think of it like this: if a <strong>quarter note = 1 beat</strong>, then:
    </p>
    <ul class="text-[#444] leading-[1.7] space-y-2 ml-6 mb-6">
      <li>• <strong>Two eighth notes = 1 beat</strong></li>
      <li>• <strong>One eighth note = 0.5 beats (half a beat)</strong></li>
      <li>• <strong>Four eighth notes = 2 beats</strong></li>
    </ul>
    <p class="text-[#444] leading-[1.7] mb-4">
      When you count eighth notes, you use the pattern <strong>"1-and-2-and-3-and-4-and"</strong>. The numbers (1, 2, 3, 4) represent the main beats, and the "and"s fill in the gaps with the second half of each beat. This is called <strong>subdividing</strong> the beat.
    </p>
    <div class="bg-[#fef3ee] border-l-4 border-purple rounded-lg p-4 mt-6">
      <p class="text-sm text-[#444]">
        <strong>💡 Memory tip:</strong> The symbol for an eighth note looks like a quarter note with a flag or hook at the top. When eighth notes appear together, the flags connect into a beam (e.g., ♫).
      </p>
    </div>
  </section>

  <!-- Section 2: Note Duration Chart -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Note Duration Chart</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Here's how all the note durations compare:
    </p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Whole note -->
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0] text-center">
        <div class="mb-3 flex justify-center">
          <svg viewBox="0 0 60 50" width="60" height="50">
            <ellipse cx="30" cy="25" rx="16" ry="12" fill="none" stroke="#3d3929" stroke-width="2" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-1 text-sm">Whole</p>
        <p class="text-xs text-[#666]"><strong>4 beats</strong></p>
      </div>

      <!-- Half note -->
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0] text-center">
        <div class="mb-3 flex justify-center">
          <svg viewBox="0 0 60 50" width="60" height="50">
            <ellipse cx="22" cy="32" rx="14" ry="11" fill="none" stroke="#3d3929" stroke-width="1.5" />
            <line x1="36" y1="32" x2="36" y2="8" stroke="#3d3929" stroke-width="1.5" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-1 text-sm">Half</p>
        <p class="text-xs text-[#666]"><strong>2 beats</strong></p>
      </div>

      <!-- Quarter note -->
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0] text-center">
        <div class="mb-3 flex justify-center">
          <svg viewBox="0 0 60 50" width="60" height="50">
            <ellipse cx="22" cy="32" rx="14" ry="11" fill="#3d3929" />
            <line x1="36" y1="32" x2="36" y2="8" stroke="#3d3929" stroke-width="1.5" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-1 text-sm">Quarter</p>
        <p class="text-xs text-[#666]"><strong>1 beat</strong></p>
      </div>

      <!-- Eighth note -->
      <div class="bg-white rounded-lg p-4 border border-[#e8e6e0] text-center">
        <div class="mb-3 flex justify-center">
          <svg viewBox="0 0 60 50" width="60" height="50">
            <ellipse cx="20" cy="32" rx="13" ry="10" fill="#3d3929" />
            <line x1="33" y1="32" x2="33" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <path d="M 33 8 Q 45 12 40 20" fill="none" stroke="#3d3929" stroke-width="1.5" />
          </svg>
        </div>
        <p class="font-bold text-navy mb-1 text-sm">Eighth</p>
        <p class="text-xs text-[#666]"><strong>0.5 beats</strong></p>
      </div>
    </div>

    <div class="mt-6 bg-white rounded-lg p-5 border border-[#e8e6e0]">
      <p class="text-sm font-semibold text-navy mb-3">Visual comparison: one measure of 4/4 time</p>
      <div class="space-y-3 text-sm">
        <div class="flex items-center gap-4">
          <span class="text-[#666] w-24">1 whole note:</span>
          <svg viewBox="0 0 200 40" width="200" height="40">
            <ellipse cx="100" cy="20" rx="18" ry="13" fill="none" stroke="#3d3929" stroke-width="2" />
          </svg>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[#666] w-24">2 half notes:</span>
          <svg viewBox="0 0 200 40" width="200" height="40">
            <ellipse cx="40" cy="25" rx="14" ry="10" fill="none" stroke="#3d3929" stroke-width="1.5" />
            <line x1="54" y1="25" x2="54" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="130" cy="25" rx="14" ry="10" fill="none" stroke="#3d3929" stroke-width="1.5" />
            <line x1="144" y1="25" x2="144" y2="8" stroke="#3d3929" stroke-width="1.5" />
          </svg>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[#666] w-24">4 quarter notes:</span>
          <svg viewBox="0 0 200 40" width="200" height="40">
            <ellipse cx="25" cy="25" rx="12" ry="9" fill="#3d3929" />
            <line x1="37" y1="25" x2="37" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="65" cy="25" rx="12" ry="9" fill="#3d3929" />
            <line x1="77" y1="25" x2="77" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="105" cy="25" rx="12" ry="9" fill="#3d3929" />
            <line x1="117" y1="25" x2="117" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="145" cy="25" rx="12" ry="9" fill="#3d3929" />
            <line x1="157" y1="25" x2="157" y2="8" stroke="#3d3929" stroke-width="1.5" />
          </svg>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[#666] w-24">8 eighth notes:</span>
          <svg viewBox="0 0 200 40" width="200" height="40">
            <ellipse cx="15" cy="25" rx="11" ry="8" fill="#3d3929" />
            <line x1="26" y1="25" x2="26" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="33" cy="25" rx="11" ry="8" fill="#3d3929" />
            <line x1="44" y1="25" x2="44" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="51" cy="25" rx="11" ry="8" fill="#3d3929" />
            <line x1="62" y1="25" x2="62" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="69" cy="25" rx="11" ry="8" fill="#3d3929" />
            <line x1="80" y1="25" x2="80" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="87" cy="25" rx="11" ry="8" fill="#3d3929" />
            <line x1="98" y1="25" x2="98" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="105" cy="25" rx="11" ry="8" fill="#3d3929" />
            <line x1="116" y1="25" x2="116" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="123" cy="25" rx="11" ry="8" fill="#3d3929" />
            <line x1="134" y1="25" x2="134" y2="8" stroke="#3d3929" stroke-width="1.5" />
            <ellipse cx="141" cy="25" rx="11" ry="8" fill="#3d3929" />
            <line x1="152" y1="25" x2="152" y2="8" stroke="#3d3929" stroke-width="1.5" />
          </svg>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 3: Rhythm Practice -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Rhythm Practice</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Let's practice tapping along to a rhythm pattern with eighth notes. Listen to the metronome and tap when you hear the beats. The pattern below uses a mix of quarter notes and eighth notes at a comfortable pace of 80 BPM.
    </p>
    <p class="text-[#444] leading-[1.7] mb-4 text-sm">
      <strong>Pattern:</strong> Q Q E E Q Q E E Q (where Q = quarter note, E = eighth note)
    </p>
    <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
      <RhythmTrainer pattern={[1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1]} bpm={80} />
    </div>
  </section>

  <!-- Section 4: Try a Harder Pattern -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Try a Harder Pattern</h2>
    <p class="text-[#444] leading-[1.7] mb-4">
      Ready for a challenge? Here's a trickier rhythm with more eighth notes. The tempo is also slightly faster at 90 BPM. Pay attention to the counting and try to stay with the beat!
    </p>
    <p class="text-[#444] leading-[1.7] mb-4 text-sm">
      <strong>Pattern:</strong> E E Q E E E E Q Q (more eighth notes, less predictable)
    </p>
    <div class="bg-white rounded-lg p-6 border border-[#e8e6e0]">
      <RhythmTrainer pattern={[0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 1]} bpm={90} />
    </div>
  </section>

  <!-- Section 5: Quiz -->
  <section class="mb-10">
    <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Test Your Knowledge</h2>
    {#if !showQuiz}
      <p class="text-[#444] leading-[1.7] mb-4">
        Now that you understand eighth notes and subdivision, let's test your knowledge with a quick quiz!
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
