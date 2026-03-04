<script lang="ts">
  let { yPos }: { yPos: number } = $props();

  const STAFF_LINES = [40, 60, 80, 100, 120];
  const NOTE_X = 280;

  // Notes on or below the middle line (B4, y>=80) get stems up;
  // notes above the middle line get stems down.
  const stemUp = $derived(yPos >= 80);

  // Android Chrome bug: SVG font-size doesn't scale with viewBox coordinate transform.
  // Fix: measure actual rendered width and compute font-size in CSS px explicitly.
  let svgEl: SVGSVGElement | null = $state(null);
  let clefFs = $state(170);

  $effect(() => {
    const el = svgEl;
    if (!el) return;
    const refresh = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) clefFs = 170 * w / 500;
    };
    refresh();
    const ro = new ResizeObserver(refresh);
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<svg
  bind:this={svgEl}
  viewBox="0 -50 500 230"
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  style="max-width: 500px; display: block; margin: 0 auto;"
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
    font-family="serif"
    fill="black"
    style="font-size: {clefFs}px; user-select: none;"
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
