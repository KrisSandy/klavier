<script lang="ts">
  import { playNote } from '../stores/audio';

  let {
    root,
    quality = 'major',
    octave = 4,
    showLabels = true,
    interactive = true,
  }: {
    root: string;
    quality?: 'major' | 'minor';
    octave?: number;
    showLabels?: boolean;
    interactive?: boolean;
  } = $props();

  const noteOffsets: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
    'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
  };

  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeyPositions = [
    { note: 'C#', afterIndex: 0 },
    { note: 'D#', afterIndex: 1 },
    { note: 'F#', afterIndex: 3 },
    { note: 'G#', afterIndex: 4 },
    { note: 'A#', afterIndex: 5 },
  ];

  const rootOffset = $derived(noteOffsets[root] ?? 0);
  const thirdOffset = $derived(quality === 'major' ? 4 : 3);

  function getNoteName(offset: number): string {
    const n = ((offset % 12) + 12) % 12;
    for (const [note, semi] of Object.entries(noteOffsets)) {
      if (semi === n) return note;
    }
    return '';
  }

  const chordTones = $derived([
    root,
    getNoteName(rootOffset + thirdOffset),
    getNoteName(rootOffset + 7),
  ]);

  const chordName = $derived(`${root}${quality === 'minor' ? 'm' : ''}`);

  function isChordTone(noteName: string): boolean {
    return chordTones.includes(noteName);
  }

  function noteToMidi(noteName: string, oct: number): number {
    return (oct + 1) * 12 + (noteOffsets[noteName] ?? 0);
  }

  function handlePlayChord(): void {
    if (!interactive) return;
    chordTones.forEach((note, i) => {
      setTimeout(() => playNote(noteToMidi(note, octave), 1, 0.6), i * 10);
    });
  }
</script>

<div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
  <div style="font-size: 1.25rem; font-weight: 600; color: #3d3929;">{chordName}</div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="cursor: {interactive ? 'pointer' : 'default'}; border-radius: 0.5rem; padding: 0.5rem; background: #f0ebe5;"
    onclick={handlePlayChord}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePlayChord(); }}
    role={interactive ? 'button' : 'img'}
    tabindex={interactive ? 0 : -1}
    aria-label="Chord diagram for {chordName}"
  >
    <div style="position: relative; display: flex; width: max-content; height: 160px; background: #f0ebe5; border-radius: 0.25rem;">
      {#each whiteKeys as wk, idx}
        <div
          style="
            position: relative;
            width: 45px;
            height: 160px;
            background: {isChordTone(wk) ? '#ce7e4f' : '#fff'};
            border: 1px solid {isChordTone(wk) ? '#b86a3d' : '#ccc'};
            border-radius: 0 0 6px 6px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 8px;
            transition: background-color 0.15s ease;
          "
        >
          {#if showLabels && isChordTone(wk)}
            <span style="font-size: 0.75rem; font-weight: 600; color: white; text-transform: uppercase;">{wk}</span>
          {/if}
        </div>
      {/each}

      {#each blackKeyPositions as bk}
        <div
          style="
            position: absolute;
            width: 28px;
            height: 100px;
            background: {isChordTone(bk.note) ? '#ce7e4f' : '#1a1a1a'};
            border: 1px solid {isChordTone(bk.note) ? '#b86a3d' : '#000'};
            border-radius: 0 0 4px 4px;
            top: 0;
            left: {bk.afterIndex * 45 + 30}px;
            z-index: 10;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 4px;
            transition: background-color 0.15s ease;
          "
        >
          {#if showLabels && isChordTone(bk.note)}
            <span style="font-size: 0.65rem; font-weight: 600; color: white;">{bk.note}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
