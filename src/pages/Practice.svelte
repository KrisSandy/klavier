<script lang="ts">
  import PracticeCanvas from '../components/PracticeCanvas.svelte';
  import EarTraining from '../components/EarTraining.svelte';
  import RhythmTrainer from '../components/RhythmTrainer.svelte';
  import SightReadingExercise from '../components/SightReadingExercise.svelte';
  import IntervalTrainer from '../components/IntervalTrainer.svelte';
  import { SONGS, getSongById, type Song } from '../data/songs';

  let activeTab = $state<'piano' | 'ear' | 'rhythm' | 'sight' | 'intervals'>('piano');

  // ── Song selection for guided practice ─────────────────────────────────────
  let selectedSong = $state<Song | null>(null);
  let practiceMode = $state<'free' | 'guided'>('free');

  // Check for ?song= query parameter (from Songs page "Practice" button)
  $effect(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex >= 0) {
      const params = new URLSearchParams(hash.slice(queryIndex));
      const songId = params.get('song');
      if (songId) {
        const song = getSongById(songId);
        if (song) {
          selectedSong = song;
          practiceMode = 'guided';
        }
      }
    }
  });

  function selectSong(song: Song) {
    selectedSong = song;
    practiceMode = 'guided';
  }

  function clearSong() {
    selectedSong = null;
    practiceMode = 'free';
  }

  // Rhythm patterns for practice
  const rhythmPatterns = [
    { name: 'Simple Quarter Notes', pattern: [1, 1, 1, 1], bpm: 80 },
    { name: 'Quarter & Eighth Mix', pattern: [1, 0.5, 0.5, 1, 1], bpm: 90 },
    { name: 'Syncopated', pattern: [0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1], bpm: 85 },
    { name: 'Waltz Feel', pattern: [1, 1, 1], bpm: 100, timeSignature: [3, 4] as [number, number] },
  ];
  let selectedPattern = $state(0);

  // Beginner-friendly songs for the song picker
  const practiceableSongs = $derived(
    SONGS.filter(s => s.lines.flat().length <= 40).slice(0, 6)
  );
</script>

<div class="max-w-4xl mx-auto px-6 py-8">
  <h1 class="text-[1.6rem] font-bold text-navy mb-2">Free Practice</h1>
  <p class="text-[1.05rem] text-[#6b6455] mb-6">
    Sharpen your skills with keyboard play, ear training, or rhythm exercises.
  </p>

  <!-- Tab switcher -->
  <div class="flex gap-2 mb-6 flex-wrap">
    <button
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'piano' ? 'bg-navy text-white' : 'bg-white text-navy border border-[#dad9d4] hover:border-purple'}"
      onclick={() => activeTab = 'piano'}
    >Piano</button>
    <button
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'ear' ? 'bg-navy text-white' : 'bg-white text-navy border border-[#dad9d4] hover:border-purple'}"
      onclick={() => activeTab = 'ear'}
    >Ear Training</button>
    <button
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'rhythm' ? 'bg-navy text-white' : 'bg-white text-navy border border-[#dad9d4] hover:border-purple'}"
      onclick={() => activeTab = 'rhythm'}
    >Rhythm</button>
    <button
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'sight' ? 'bg-navy text-white' : 'bg-white text-navy border border-[#dad9d4] hover:border-purple'}"
      onclick={() => activeTab = 'sight'}
    >Sight-Reading</button>
    <button
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'intervals' ? 'bg-navy text-white' : 'bg-white text-navy border border-[#dad9d4] hover:border-purple'}"
      onclick={() => activeTab = 'intervals'}
    >Intervals</button>
  </div>

  <!-- Piano tab — unified practice canvas -->
  {#if activeTab === 'piano'}
    <!-- Mode toggle: Free Play vs Guided -->
    <div class="flex items-center gap-3 mb-4">
      <button
        class="px-3 py-1.5 rounded text-sm font-medium transition-all {practiceMode === 'free' ? 'bg-purple text-white' : 'bg-[#faf9f5] text-navy border border-[#dad9d4] hover:border-purple'}"
        onclick={clearSong}
      >Free Play</button>
      <span class="text-sm text-[#6b6455]">or choose a song:</span>
      <div class="flex gap-2 flex-wrap">
        {#each practiceableSongs as song}
          <button
            class="px-3 py-1.5 rounded text-sm font-medium transition-all {selectedSong?.id === song.id ? 'bg-purple text-white' : 'bg-[#faf9f5] text-navy border border-[#dad9d4] hover:border-purple'}"
            onclick={() => selectSong(song)}
          >{song.title}</button>
        {/each}
      </div>
    </div>

    <PracticeCanvas
      song={selectedSong}
      mode={practiceMode}
    />

  <!-- Ear Training tab -->
  {:else if activeTab === 'ear'}
    <div class="space-y-6">
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
        <h2 class="text-[1rem] font-semibold text-navy mb-1">Note Recognition</h2>
        <p class="text-sm text-[#6b6455] mb-4">Listen to a note and identify it by name.</p>
        <EarTraining mode="note" />
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
        <h2 class="text-[1rem] font-semibold text-navy mb-1">Interval Recognition</h2>
        <p class="text-sm text-[#6b6455] mb-4">Listen to two notes and identify the interval between them.</p>
        <EarTraining mode="interval" />
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
        <h2 class="text-[1rem] font-semibold text-navy mb-1">Major vs Minor</h2>
        <p class="text-sm text-[#6b6455] mb-4">Listen to a chord and identify whether it's major or minor.</p>
        <EarTraining mode="chord" />
      </div>
    </div>

  <!-- Rhythm tab -->
  {:else if activeTab === 'rhythm'}
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
      <h2 class="text-[1rem] font-semibold text-navy mb-4">Rhythm Patterns</h2>
      <div class="flex flex-wrap gap-2 mb-6">
        {#each rhythmPatterns as rp, i}
          <button
            class="px-3 py-1.5 rounded text-sm font-medium transition-all {selectedPattern === i ? 'bg-purple text-white' : 'bg-[#faf9f5] text-navy border border-[#dad9d4] hover:border-purple'}"
            onclick={() => selectedPattern = i}
          >{rp.name}</button>
        {/each}
      </div>
      <RhythmTrainer
        pattern={rhythmPatterns[selectedPattern].pattern}
        bpm={rhythmPatterns[selectedPattern].bpm}
        timeSignature={rhythmPatterns[selectedPattern].timeSignature ?? [4, 4]}
      />
    </div>

  <!-- Sight-Reading tab -->
  {:else if activeTab === 'sight'}
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
      <h2 class="text-[1rem] font-semibold text-navy mb-1">Sight-Reading Drill</h2>
      <p class="text-sm text-[#6b6455] mb-4">Identify notes as fast as you can before the timer runs out.</p>
      <SightReadingExercise />
    </div>

  <!-- Intervals tab -->
  {:else if activeTab === 'intervals'}
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
      <h2 class="text-[1rem] font-semibold text-navy mb-1">Interval Training</h2>
      <p class="text-sm text-[#6b6455] mb-4">Listen to two notes and identify the interval between them.</p>
      <IntervalTrainer />
    </div>
  {/if}
</div>
