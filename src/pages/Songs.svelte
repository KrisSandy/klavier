<script lang="ts">
  import { router } from '../router.svelte';
  import { getSongLibrary, getSongById, type Song } from '../data/songs';
  import SongStaff from '../components/SongStaff.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import Metronome from '../components/Metronome.svelte';
  import { playNote, playSequence } from '../stores/audio';
  import { getNoteById } from '../data/notes';

  const songLibrary = getSongLibrary();
  const activeSong = $derived(router.songSlug ? getSongById(router.songSlug) : null);

  // Playback state
  let isPlaying = $state(false);
  let highlightIndex = $state(-1);
  let playbackStop: { stop: () => void } | null = null;
  let activeKey = $state<string | null>(null);

  function playSong(song: Song) {
    if (isPlaying && playbackStop) {
      playbackStop.stop();
      isPlaying = false;
      highlightIndex = -1;
      return;
    }

    const allNotes = song.lines.flat();
    const noteSequence = allNotes.map(id => {
      const note = getNoteById(id);
      return { midiNote: note?.midiNote ?? 60, duration: 1 };
    });

    isPlaying = true;
    playbackStop = playSequence(noteSequence, song.bpm, (index) => {
      highlightIndex = index;
    });

    const totalDuration = noteSequence.length * (60 / song.bpm) * 1000;
    setTimeout(() => {
      isPlaying = false;
      highlightIndex = -1;
    }, totalDuration + 200);
  }

  function handleNotePlay(note: string, midiNote: number) {
    playNote(midiNote);
    activeKey = note;
    setTimeout(() => { activeKey = null; }, 200);
  }

  const difficultyColor: Record<string, string> = {
    beginner: '#28a745',
    intermediate: '#ce7e4f',
    advanced: '#dc3545',
  };
</script>

{#if activeSong}
  <!-- Song detail view -->
  <div class="max-w-3xl mx-auto px-6 py-8">
    <button
      class="text-[0.85rem] text-[#6b6455] hover:text-navy cursor-pointer bg-transparent border-none transition-colors mb-4"
      onclick={() => router.navigate('/songs')}
    >← Back to Songs</button>

    <div class="flex items-center gap-3 mb-2">
      <h1 class="text-[1.6rem] font-bold text-navy leading-tight">{activeSong.title}</h1>
      {#if activeSong.difficulty}
        <span
          class="text-[0.7rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
          style="background: {difficultyColor[activeSong.difficulty] ?? '#999'};"
        >{activeSong.difficulty}</span>
      {/if}
    </div>

    {#if activeSong.composer}
      <p class="text-[1rem] text-[#6b6455] mb-2">{activeSong.composer}</p>
    {/if}

    <div class="flex gap-4 text-sm text-[#999] mb-6">
      <span>Key: <strong class="text-navy">{activeSong.keySignature}</strong></span>
      <span>Time: <strong class="text-navy">{activeSong.timeSignature[0]}/{activeSong.timeSignature[1]}</strong></span>
      <span>Tempo: <strong class="text-navy">{activeSong.bpm} BPM</strong></span>
    </div>

    <!-- Sheet music -->
    <section class="mb-8">
      <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Sheet Music</h2>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4 mb-4">
        {#each activeSong.lines as line, lineIdx}
          {@const lineStart = activeSong.lines.slice(0, lineIdx).reduce((sum, l) => sum + l.length, 0)}
          {@const localIndex = highlightIndex >= lineStart && highlightIndex < lineStart + line.length ? highlightIndex - lineStart : -1}
          <div class="mb-2">
            <SongStaff notes={line} highlightIndex={localIndex} />
          </div>
        {/each}
      </div>

      <div class="flex gap-3 items-center">
        <button
          class="bg-purple text-white px-5 py-2.5 rounded-lg text-[0.9rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
          onclick={() => playSong(activeSong)}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <Metronome initialBpm={activeSong.bpm} />
      </div>
    </section>

    <!-- Play along keyboard -->
    <section class="mb-8">
      <h2 class="text-[1.1rem] font-bold text-navy mb-3 pb-2 border-b-2 border-[#dad9d4]">Play Along</h2>
      <p class="text-[#444] leading-[1.7] mb-4">
        The keys used in this song are highlighted. Try playing along!
      </p>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4">
        <VirtualKeyboard
          startOctave={3}
          endOctave={5}
          showLabels={true}
          highlightKeys={[...new Set(activeSong.lines.flat())]}
          onNotePlay={handleNotePlay}
          {activeKey}
        />
      </div>
    </section>
  </div>
{:else}
  <!-- Song library view -->
  <div class="max-w-3xl mx-auto px-6 py-8">
    <h1 class="text-[1.8rem] font-bold text-navy mb-2">Songs</h1>
    <p class="text-[1rem] text-[#6b6455] mb-8 leading-relaxed">
      Practice with real songs. Pick one that matches your level and play along with the sheet music and virtual keyboard.
    </p>

    {#each ['beginner', 'intermediate', 'advanced'] as difficulty}
      {@const songs = songLibrary.filter(s => s.difficulty === difficulty)}
      {#if songs.length > 0}
        <div class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <span
              class="text-[0.7rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
              style="background: {difficultyColor[difficulty]};"
            >{difficulty}</span>
            <span class="text-sm text-[#999]">{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
          </div>

          <div class="space-y-3">
            {#each songs as song}
              <button
                class="w-full text-left p-4 rounded-lg border-2 border-[#e8e6e0] bg-white hover:border-purple hover:shadow-sm transition-all cursor-pointer"
                onclick={() => router.navigate(`/songs/${song.id}`)}
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[0.95rem] font-semibold text-navy">{song.title}</p>
                    <p class="text-[0.8rem] text-[#999]">
                      {song.composer ? `${song.composer} · ` : ''}{song.keySignature} · {song.timeSignature[0]}/{song.timeSignature[1]} · {song.bpm} BPM
                    </p>
                  </div>
                  <span class="text-purple text-lg">→</span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {/each}

    {#if songLibrary.length === 0}
      <p class="text-[#999] text-center py-8">No songs yet. Check back soon!</p>
    {/if}
  </div>
{/if}
