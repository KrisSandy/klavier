<script lang="ts">
  import { STAFF_LINES, CLEF_FONT_SIZE, Y_MAP } from '../data/notes';

  // ── Types ──────────────────────────────────────────────────────────────────
  export type NoteStatus = 'upcoming' | 'current' | 'correct' | 'wrong' | 'missed';

  interface Props {
    /** Array of note IDs (e.g. ['C4', 'E4', 'G4']) */
    notes: string[];
    /** Index of the current note the user should play */
    currentIndex?: number;
    /** Map of note index → result status (filled as user plays) */
    noteStatuses?: Record<number, NoteStatus>;
    /** Time signature displayed at the start, e.g. [4, 4] */
    timeSignature?: [number, number];
    /** Whether to show note labels below each note */
    showLabels?: boolean;
  }

  let {
    notes,
    currentIndex = -1,
    noteStatuses = {},
    timeSignature = [4, 4],
    showLabels = true,
  }: Props = $props();

  // ── Layout constants ────────────────────────────────────────────────────────
  const NOTE_START_X = 130;
  const NOTE_SPACING = 56;
  const VISIBLE_NOTES = 12;  // how many notes fit in the viewport
  const STAFF_HEIGHT = 195;

  // ── Derived data ────────────────────────────────────────────────────────────

  const noteData = $derived(
    notes.map((id, i) => {
      const isSharp = id.includes('#');
      const yPos = Y_MAP[id] ?? 80;
      const x = NOTE_START_X + i * NOTE_SPACING;
      return { id, isSharp, yPos, x, index: i };
    })
  );

  const contentWidth = $derived(NOTE_START_X + notes.length * NOTE_SPACING + 60);
  const svgWidth = $derived(Math.max(540, contentWidth));

  // Calculate the scroll offset to keep current note centered
  const scrollOffset = $derived.by(() => {
    if (currentIndex < 0) return 0;
    const currentX = NOTE_START_X + currentIndex * NOTE_SPACING;
    const viewportCenter = (VISIBLE_NOTES * NOTE_SPACING) / 2;
    return Math.max(0, currentX - viewportCenter);
  });

  // ── Color helpers ───────────────────────────────────────────────────────────

  function getStatus(index: number): NoteStatus {
    if (noteStatuses[index]) return noteStatuses[index];
    if (index === currentIndex) return 'current';
    return 'upcoming';
  }

  function getNoteColor(status: NoteStatus): string {
    switch (status) {
      case 'correct':  return '#28a745';  // green
      case 'wrong':    return '#dc3545';  // red
      case 'missed':   return '#adb5bd';  // gray
      case 'current':  return '#ce7e4f';  // terracotta (brand)
      case 'upcoming':
      default:         return '#1a1a1a';  // near-black
    }
  }

  function getNoteOpacity(index: number): number {
    const status = getStatus(index);
    if (status === 'upcoming' && currentIndex >= 0) {
      // Fade upcoming notes the further away they are
      const distance = index - currentIndex;
      if (distance > 8) return 0.3;
      if (distance > 4) return 0.5;
      return 0.7;
    }
    return 1;
  }
</script>

<!-- Scrolling staff container -->
<div
  class="scrolling-staff-container"
  role="img"
  aria-label="Musical staff showing {notes.length} notes, currently on note {currentIndex + 1}"
>
  <div
    class="scrolling-staff-inner"
    style="transform: translateX(-{scrollOffset}px); transition: transform 0.3s ease-out;"
  >
    <svg
      viewBox="0 -15 {svgWidth} {STAFF_HEIGHT}"
      xmlns="http://www.w3.org/2000/svg"
      width={svgWidth}
      height={STAFF_HEIGHT}
      style="display: block;"
    >
      <!-- Staff lines -->
      {#each STAFF_LINES as lineY}
        <line x1="30" y1={lineY} x2={svgWidth - 10} y2={lineY} stroke="#c9c8c3" stroke-width="1" />
      {/each}

      <!-- Treble clef -->
      <text
        x="42"
        y="128"
        font-size={CLEF_FONT_SIZE}
        font-family="'Noto Music', serif"
        fill="#3d3929"
      >&#x1D11E;</text>

      <!-- Time signature -->
      <text x="105" y="72" font-size="28" font-family="'Inter', serif" font-weight="700" fill="#3d3929"
        text-anchor="middle">{timeSignature[0]}</text>
      <text x="105" y="112" font-size="28" font-family="'Inter', serif" font-weight="700" fill="#3d3929"
        text-anchor="middle">{timeSignature[1]}</text>

      <!-- Bar lines (every N notes based on time signature) -->
      {#each noteData as note}
        {#if note.index > 0 && note.index % timeSignature[0] === 0}
          <line
            x1={note.x - NOTE_SPACING / 2 + 4}
            y1={STAFF_LINES[0]}
            x2={note.x - NOTE_SPACING / 2 + 4}
            y2={STAFF_LINES[STAFF_LINES.length - 1]}
            stroke="#c9c8c3"
            stroke-width="1"
          />
        {/if}
      {/each}

      <!-- Notes -->
      {#each noteData as note}
        {@const status = getStatus(note.index)}
        {@const color = getNoteColor(status)}
        {@const opacity = getNoteOpacity(note.index)}
        {@const stemUp = note.yPos >= 80}

        <g opacity={opacity}>
          <!-- Current note glow ring -->
          {#if status === 'current'}
            <circle
              cx={note.x}
              cy={note.yPos}
              r="18"
              fill="none"
              stroke="#ce7e4f"
              stroke-width="2"
              opacity="0.4"
              class="current-note-pulse"
            />
          {/if}

          <!-- Result badge for played notes -->
          {#if status === 'correct'}
            <text
              x={note.x}
              y={stemUp ? note.yPos - 45 : note.yPos + 50}
              text-anchor="middle"
              font-size="14"
              fill="#28a745"
            >&#x2713;</text>
          {:else if status === 'wrong'}
            <text
              x={note.x}
              y={stemUp ? note.yPos - 45 : note.yPos + 50}
              text-anchor="middle"
              font-size="14"
              fill="#dc3545"
            >&#x2717;</text>
          {:else if status === 'missed'}
            <text
              x={note.x}
              y={stemUp ? note.yPos - 45 : note.yPos + 50}
              text-anchor="middle"
              font-size="11"
              fill="#adb5bd"
            >skip</text>
          {/if}

          <!-- Ledger lines above staff -->
          {#if note.yPos < 40}
            {#each Array.from({ length: Math.ceil((40 - note.yPos) / 20) }, (_, i) => 40 - (i + 1) * 20).filter(y => y % 20 === 0) as ledgerY}
              <line x1={note.x - 15} y1={ledgerY} x2={note.x + 15} y2={ledgerY} stroke={color} stroke-width="1.5" />
            {/each}
          {/if}
          <!-- Ledger lines below staff -->
          {#if note.yPos > 120}
            {#each Array.from({ length: Math.ceil((note.yPos - 120) / 20) }, (_, i) => 140 + i * 20).filter(y => y % 20 === 0) as ledgerY}
              <line x1={note.x - 15} y1={ledgerY} x2={note.x + 15} y2={ledgerY} stroke={color} stroke-width="1.5" />
            {/each}
          {/if}

          <!-- Sharp accidental -->
          {#if note.isSharp}
            <text
              x={note.x - 18}
              y={note.yPos + 5}
              font-size="16"
              font-family="serif"
              fill={color}
            >&#x266F;</text>
          {/if}

          <!-- Note head -->
          <ellipse
            cx={note.x}
            cy={note.yPos}
            rx="10"
            ry="7"
            fill={color}
            transform="rotate(-20, {note.x}, {note.yPos})"
          />

          <!-- Stem -->
          {#if stemUp}
            <line
              x1={note.x + 9} y1={note.yPos}
              x2={note.x + 9} y2={note.yPos - 35}
              stroke={color} stroke-width="1.5"
            />
          {:else}
            <line
              x1={note.x - 9} y1={note.yPos}
              x2={note.x - 9} y2={note.yPos + 35}
              stroke={color} stroke-width="1.5"
            />
          {/if}

          <!-- Note label -->
          {#if showLabels}
            <text
              x={note.x}
              y="175"
              text-anchor="middle"
              font-size="11"
              font-family="'Inter', sans-serif"
              fill={status === 'current' ? '#ce7e4f' : '#999'}
              font-weight={status === 'current' ? '600' : '400'}
            >{note.id}</text>
          {/if}
        </g>
      {/each}

      <!-- End barline (double line) -->
      <line
        x1={svgWidth - 30}
        y1={STAFF_LINES[0]}
        x2={svgWidth - 30}
        y2={STAFF_LINES[STAFF_LINES.length - 1]}
        stroke="#3d3929"
        stroke-width="1"
      />
      <line
        x1={svgWidth - 25}
        y1={STAFF_LINES[0]}
        x2={svgWidth - 25}
        y2={STAFF_LINES[STAFF_LINES.length - 1]}
        stroke="#3d3929"
        stroke-width="3"
      />
    </svg>
  </div>
</div>
