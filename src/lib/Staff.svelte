<script lang="ts">
  let { yPos }: { yPos: number } = $props();

  const STAFF_LINES = [40, 60, 80, 100, 120];
  const NOTE_X = 280;

  // Notes on or below the middle line (B4, y>=80) get stems up;
  // notes above the middle line get stems down.
  const stemUp = $derived(yPos >= 80);
</script>

<svg
  viewBox="0 0 500 180"
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  style="max-width: 500px; display: block; margin: 0 auto; overflow: visible;"
>
  <!-- 5 staff lines -->
  {#each STAFF_LINES as lineY}
    <line x1="30" y1={lineY} x2="480" y2={lineY} stroke="black" stroke-width="1.5" />
  {/each}

  <!-- Treble clef: Unicode U+1D11E. The glyph baseline is placed at y=155 so
       that the curl at the bottom sits just below the staff and the top
       rises above the top line. font-size=170 spans the full staff height. -->
  <text
    x="18"
    y="155"
    font-size="170"
    font-family="serif"
    fill="black"
    style="user-select: none;"
  >𝄞</text>

  <!-- Note head: filled ellipse rotated -20deg for standard note head appearance -->
  <ellipse
    cx={NOTE_X}
    cy={yPos}
    rx="10"
    ry="7"
    fill="black"
    transform="rotate(-20, {NOTE_X}, {yPos})"
  />

  <!-- Stem -->
  {#if stemUp}
    <line
      x1={NOTE_X + 9}
      y1={yPos}
      x2={NOTE_X + 9}
      y2={yPos - 35}
      stroke="black"
      stroke-width="1.5"
    />
  {:else}
    <line
      x1={NOTE_X - 9}
      y1={yPos}
      x2={NOTE_X - 9}
      y2={yPos + 35}
      stroke="black"
      stroke-width="1.5"
    />
  {/if}
</svg>
