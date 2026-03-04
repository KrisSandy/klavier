<script lang="ts">
  let { notes }: { notes: string[] } = $props();

  const Y_MAP: Record<string, number> = {
    A5: 20, G5: 30, F5: 40, E5: 50, D5: 60, C5: 70,
    B4: 80, A4: 90, G4: 100, F4: 110, E4: 120, D4: 130, C4: 140,
  };

  const STAFF_LINES = [40, 60, 80, 100, 120];
  const NOTE_START_X = 95;
  const NOTE_SPACING = 52;

  const noteData = $derived(
    notes.map((id, i) => {
      const isSharp = id.includes("#");
      const naturalId = id.replace("#", "");
      const yPos = Y_MAP[naturalId] ?? 80;
      const x = NOTE_START_X + i * NOTE_SPACING;
      return { id, isSharp, yPos, x };
    }),
  );

  const svgWidth = $derived(
    Math.max(320, NOTE_START_X + notes.length * NOTE_SPACING + 20),
  );

  // cqw font-size: 170/svgWidth * 100 gives "font-size as % of SVG rendered width"
  // e.g. 7 notes → svgWidth=479 → 35.49cqw. On 361px mobile: 35.49*3.61=128px CSS.
  const clefCqw = $derived((170 / svgWidth * 100).toFixed(4));
</script>

<!--
  container-type: inline-size makes this SVG a CSS container.
  clefCqw resolves to the correct CSS pixel size on all browsers including
  Android Chrome where SVG font-size attributes don't scale with viewBox.
-->
<svg
  viewBox="0 -50 {svgWidth} 225"
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  style="display: block; container-type: inline-size;"
>
  <!-- Staff lines -->
  {#each STAFF_LINES as lineY}
    <line
      x1="30"
      y1={lineY}
      x2={svgWidth - 10}
      y2={lineY}
      stroke="black"
      stroke-width="1.5"
    />
  {/each}

  <!-- Treble clef: clefCqw% of container width = correct CSS px on all browsers -->
  <text
    x="18"
    y="155"
    font-family="serif"
    fill="black"
    style="font-size: {clefCqw}cqw; user-select: none;"
  >𝄞</text>

  <!-- Notes -->
  {#each noteData as note}
    <!-- Ledger line for notes outside the 5-line staff -->
    {#if note.yPos % 20 === 0 && (note.yPos < 40 || note.yPos > 120)}
      <line
        x1={note.x - 15}
        y1={note.yPos}
        x2={note.x + 15}
        y2={note.yPos}
        stroke="black"
        stroke-width="1.5"
      />
    {/if}

    <!-- Sharp accidental -->
    {#if note.isSharp}
      <text
        x={note.x - 15}
        y={note.yPos + 5}
        font-size="18"
        font-family="serif"
        fill="black"
        text-anchor="middle"
      >♯</text>
    {/if}

    <!-- Note head -->
    <ellipse
      cx={note.x}
      cy={note.yPos}
      rx="10"
      ry="7"
      fill="black"
      transform="rotate(-20, {note.x}, {note.yPos})"
    />

    <!-- Stem -->
    {#if note.yPos >= 80}
      <line
        x1={note.x + 9}
        y1={note.yPos}
        x2={note.x + 9}
        y2={note.yPos - 35}
        stroke="black"
        stroke-width="1.5"
      />
    {:else}
      <line
        x1={note.x - 9}
        y1={note.yPos}
        x2={note.x - 9}
        y2={note.yPos + 35}
        stroke="black"
        stroke-width="1.5"
      />
    {/if}

    <!-- Note label below staff -->
    <text
      x={note.x}
      y="165"
      font-size="11"
      font-family="sans-serif"
      fill="#888"
      text-anchor="middle"
    >{note.id.replace("#", "♯")}</text>
  {/each}
</svg>
