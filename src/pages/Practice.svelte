<script lang="ts">
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import Metronome from '../components/Metronome.svelte';
  import { playNote } from '../stores/audio';

  let activeKey = $state<string | null>(null);

  function handleNotePlay(note: string, midiNote: number) {
    playNote(midiNote);
    activeKey = note;
    setTimeout(() => { activeKey = null; }, 200);
  }
</script>

<div class="max-w-4xl mx-auto px-6 py-8">
  <h1 class="text-[1.6rem] font-bold text-navy mb-2">Free Practice</h1>
  <p class="text-[1.05rem] text-[#6b6455] mb-6">
    Play freely on the virtual keyboard. Use the metronome to keep a steady beat.
  </p>

  <div class="bg-white rounded-lg border border-[#e8e6e0] p-6 mb-6">
    <VirtualKeyboard
      startOctave={3}
      endOctave={5}
      onNotePlay={handleNotePlay}
      {activeKey}
      showLabels={true}
    />
  </div>

  <div class="bg-white rounded-lg border border-[#e8e6e0] p-6">
    <h2 class="text-[1rem] font-semibold text-navy mb-4">Metronome</h2>
    <Metronome initialBpm={120} />
  </div>
</div>
