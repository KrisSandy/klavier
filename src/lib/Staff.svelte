<script lang="ts">
  import { CLEF_FONT_SIZE } from './notes';

  let { yPos }: { yPos: number } = $props();

  const STAFF_LINES = [40, 60, 80, 100, 120];
  const NOTE_X = 280;

  // Notes on or below the middle line (B4, y>=80) get stems up;
  // notes above the middle line get stems down.
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
    <line
      x1="30"
      y1={lineY}
      x2="480"
      y2={lineY}
      stroke="black"
      stroke-width="1.5"
    />
  {/each}

  <!-- Treble clef: Unicode 𝄞 rendered via Noto Music web font.
       Positioned so the G-circle wraps around the G4 staff line (y=100). -->
  <text
    x="42"
    y="128"
    font-size={CLEF_FONT_SIZE}
    font-family="'Noto Music', serif"
    fill="black">&#x1D11E;</text
  >

  <!-- Ledger lines for notes outside the 5-line staff.
       Draw all ledger lines between the staff edge and the note position.
       Notes in spaces (D4 y=130, G5 y=30) need the nearest ledger line for context. -->
  <!-- Above staff: ledger lines at y=20, 0, -20… -->
  {#if yPos <= 20}
    <line
      x1={NOTE_X - 15}
      y1={20}
      x2={NOTE_X + 15}
      y2={20}
      stroke="black"
      stroke-width="1.5"
    />
  {/if}
  <!-- Below staff: ledger line at y=140 (Middle C and D4) -->
  {#if yPos >= 130}
    <line
      x1={NOTE_X - 15}
      y1={140}
      x2={NOTE_X + 15}
      y2={140}
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
