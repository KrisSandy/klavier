<script lang="ts">
  let { yPos }: { yPos: number } = $props();

  const STAFF_LINES = [40, 60, 80, 100, 120];
  const NOTE_X = 280;

  // Notes on or below the middle line (B4, y>=80) get stems up;
  // notes above the middle line get stems down.
  const stemUp = $derived(yPos >= 80);
</script>

<!--
  container-type: inline-size makes this SVG a CSS container.
  Inside it, font-size: 34cqw resolves to 34% of the SVG's rendered CSS width,
  which equals 170/500 * rendered_width — correctly scaling the clef on all browsers
  including Android Chrome where SVG font-size attributes don't scale with viewBox.
-->
<svg
  viewBox="0 -50 500 230"
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  style="max-width: 500px; display: block; margin: 0 auto; container-type: inline-size;"
>
  <!-- 5 staff lines -->
  {#each STAFF_LINES as lineY}
    <line x1="30" y1={lineY} x2="480" y2={lineY} stroke="black" stroke-width="1.5" />
  {/each}

  <!-- Treble clef: 34cqw = 170/500 * container-width in CSS px, scales with SVG on all browsers -->
  <text
    x="18"
    y="155"
    font-family="serif"
    fill="black"
    style="font-size: 34cqw; user-select: none;"
  >𝄞</text>

  <!-- Ledger line for notes on a line position outside the 5-line staff -->
  {#if yPos % 20 === 0 && (yPos < 40 || yPos > 120)}
    <line
      x1={NOTE_X - 15}
      y1={yPos}
      x2={NOTE_X + 15}
      y2={yPos}
      stroke="black"
      stroke-width="1.5"
    />
  {/if}

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
