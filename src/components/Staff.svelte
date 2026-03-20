<script lang="ts">
  import { STAFF_LINES, CLEF_FONT_SIZE } from '../data/notes';

  let { yPos }: { yPos: number } = $props();

  const NOTE_X = 280;
  const stemUp = $derived(yPos >= 80);
</script>

<svg
  viewBox="0 -15 500 200"
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  style="max-width: 500px; display: block; margin: 0 auto;"
  role="img"
  aria-label="Musical staff with a note to identify"
>
  <!-- 5 staff lines -->
  {#each STAFF_LINES as lineY}
    <line x1="30" y1={lineY} x2="480" y2={lineY} stroke="black" stroke-width="1.5" />
  {/each}

  <!-- Treble clef -->
  <text
    x="42"
    y="128"
    font-size={CLEF_FONT_SIZE}
    font-family="'Noto Music', serif"
    fill="black"
  >&#x1D11E;</text>

  <!-- Ledger lines above staff (y < 40, lines at every 20px: 20, 0, -20...) -->
  {#if yPos < 40}
    {#each Array.from({ length: Math.ceil((40 - yPos) / 20) }, (_, i) => 40 - (i + 1) * 20).filter(y => y % 20 === 0) as ledgerY}
      <line x1={NOTE_X - 15} y1={ledgerY} x2={NOTE_X + 15} y2={ledgerY} stroke="black" stroke-width="1.5" />
    {/each}
  {/if}
  <!-- Ledger lines below staff (y > 120, lines at every 20px: 140, 160, 180...) -->
  {#if yPos > 120}
    {#each Array.from({ length: Math.ceil((yPos - 120) / 20) }, (_, i) => 140 + i * 20).filter(y => y % 20 === 0) as ledgerY}
      <line x1={NOTE_X - 15} y1={ledgerY} x2={NOTE_X + 15} y2={ledgerY} stroke="black" stroke-width="1.5" />
    {/each}
  {/if}

  <!-- Note head -->
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
