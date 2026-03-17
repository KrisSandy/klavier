<script lang="ts">
  import { STAFF_LINES, CLEF_FONT_SIZE, Y_MAP } from '../data/notes';

  let { notes, highlightIndex = -1 }: { notes: string[]; highlightIndex?: number } = $props();

  const NOTE_START_X = 130;
  const NOTE_SPACING = 52;

  const noteData = $derived(
    notes.map((id, i) => {
      const isSharp = id.includes('#');
      const yPos = Y_MAP[id] ?? 80;
      const x = NOTE_START_X + i * NOTE_SPACING;
      return { id, isSharp, yPos, x, index: i };
    })
  );

  // Always use a consistent viewBox width so all lines render at the same scale
  const contentWidth = $derived(NOTE_START_X + notes.length * NOTE_SPACING + 20);
  const svgWidth = $derived(Math.max(540, contentWidth));
</script>

<div style="overflow-x: auto; max-width: 100%;">
  <svg
    viewBox="0 -15 {svgWidth} 195"
    xmlns="http://www.w3.org/2000/svg"
    style="display: block; width: 100%; height: auto; max-height: 140px;"
  >
    <!-- Staff lines -->
    {#each STAFF_LINES as lineY}
      <line x1="30" y1={lineY} x2={svgWidth - 10} y2={lineY} stroke="black" stroke-width="1.5" />
    {/each}

    <!-- Treble clef -->
    <text
      x="42"
      y="128"
      font-size={CLEF_FONT_SIZE}
      font-family="'Noto Music', serif"
      fill="black"
    >&#x1D11E;</text>

    <!-- Notes -->
    {#each noteData as note}
      {@const stemUp = note.yPos >= 80}
      {@const isHighlighted = note.index === highlightIndex}
      {@const fillColor = isHighlighted ? '#ce7e4f' : 'black'}

      <!-- Ledger lines -->
      {#if note.yPos <= 20}
        <line x1={note.x - 15} y1={20} x2={note.x + 15} y2={20} stroke="black" stroke-width="1.5" />
      {/if}
      {#if note.yPos >= 140}
        <line x1={note.x - 15} y1={140} x2={note.x + 15} y2={140} stroke="black" stroke-width="1.5" />
      {/if}

      <!-- Sharp accidental -->
      {#if note.isSharp}
        <text
          x={note.x - 18}
          y={note.yPos + 5}
          font-size="16"
          font-family="serif"
          fill={fillColor}
        >♯</text>
      {/if}

      <!-- Note head -->
      <ellipse
        cx={note.x}
        cy={note.yPos}
        rx="10"
        ry="7"
        fill={fillColor}
        transform="rotate(-20, {note.x}, {note.yPos})"
      />

      <!-- Stem -->
      {#if stemUp}
        <line
          x1={note.x + 9}
          y1={note.yPos}
          x2={note.x + 9}
          y2={note.yPos - 35}
          stroke={fillColor}
          stroke-width="1.5"
        />
      {:else}
        <line
          x1={note.x - 9}
          y1={note.yPos}
          x2={note.x - 9}
          y2={note.yPos + 35}
          stroke={fillColor}
          stroke-width="1.5"
        />
      {/if}

      <!-- Note label below -->
      <text
        x={note.x}
        y="165"
        text-anchor="middle"
        font-size="11"
        font-family="'Inter', sans-serif"
        fill="#999"
      >{note.id}</text>
    {/each}
  </svg>
</div>
