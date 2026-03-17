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
</script>

<div style="overflow-x: auto; max-width: 100%;">
<svg
  viewBox="0 -15 {svgWidth} 195"
  xmlns="http://www.w3.org/2000/svg"
  width={svgWidth}
  style="display: block; min-width: {svgWidth}px; max-width: 100%;"
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

  <!-- Treble clef: Unicode 𝄞 via Noto Music web font -->
  <text
    x="42"
    y="128"
    font-size="105"
    font-family="'Noto Music', serif"
    fill="black"
  >&#x1D11E;</text>

  <!-- Notes -->
  {#each noteData as note}
    <!-- Ledger lines for notes outside the 5-line staff.
         Draw all needed ledger lines between staff edge and note. -->
    {#if note.yPos <= 20}
      <line x1={note.x - 15} y1={20} x2={note.x + 15} y2={20} stroke="black" stroke-width="1.5" />
    {/if}
    {#if note.yPos >= 130}
      <line x1={note.x - 15} y1={140} x2={note.x + 15} y2={140} stroke="black" stroke-width="1.5" />
    {/if}

    <!-- Sharp accidental — positioned to avoid stem/note collisions -->
    {#if note.isSharp}
      <text
        x={note.x - 18}
        y={note.yPos + 5}
        font-size="16"
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
</div>
