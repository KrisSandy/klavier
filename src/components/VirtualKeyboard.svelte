<script lang="ts">
  interface Props {
    startOctave?: number;
    endOctave?: number;
    onNotePlay?: (note: string, midiNote: number) => void;
    highlightKeys?: string[];
    activeKey?: string | null;
    showLabels?: boolean;
  }

  let {
    startOctave = 3,
    endOctave = 4,
    onNotePlay = undefined,
    highlightKeys = [],
    activeKey = null,
    showLabels = true,
  }: Props = $props();

  // ── Piano key data ──────────────────────────────────────────────────────────
  interface PianoKey {
    id: string; // e.g. "C3", "C#3", "D3"
    letter: string; // "C", "C#", "D", etc.
    octave: number;
    isBlack: boolean;
    midiNote: number;
  }

  // Generate all keys for the specified octave range
  const whiteKeyPattern = ["C", "D", "E", "F", "G", "A", "B"];
  // Only these white keys have a sharp (black key) above them
  const hasSharp = new Set(["C", "D", "F", "G", "A"]);
  const allKeys = $derived.by(() => {
    const keys: PianoKey[] = [];
    const midiC0 = 12; // MIDI note number for C0
    let midiCounter = midiC0 + startOctave * 12;

    for (let octave = startOctave; octave <= endOctave; octave++) {
      for (let i = 0; i < whiteKeyPattern.length; i++) {
        const whiteLetter = whiteKeyPattern[i];
        keys.push({
          id: `${whiteLetter}${octave}`,
          letter: whiteLetter,
          octave,
          isBlack: false,
          midiNote: midiCounter++,
        });

        // Add black key only after C, D, F, G, A (no E# or B#)
        if (hasSharp.has(whiteLetter)) {
          keys.push({
            id: `${whiteLetter}#${octave}`,
            letter: `${whiteLetter}#`,
            octave,
            isBlack: true,
            midiNote: midiCounter++,
          });
        }
      }
    }

    return keys;
  });

  // White keys only (for layout positioning)
  const whiteKeys = $derived(allKeys.filter((k) => !k.isBlack));
  const blackKeys = $derived(allKeys.filter((k) => k.isBlack));

  // ── Styling helpers ────────────────────────────────────────────────────────

  function getWhiteKeyStyle(index: number): string {
    const width = "40px";
    const height = "150px";
    const xPos = index * 40;
    return `position: absolute; left: ${xPos}px; top: 0; width: ${width}; height: ${height};`;
  }

  function getBlackKeyStyle(whiteIndex: number): string {
    const width = "24px";
    const height = "95px";
    // Black keys are positioned between white keys, offset to the right of their "left" white key
    const xPos = (whiteIndex + 1) * 40 - 12; // Center on boundary
    return `position: absolute; left: ${xPos}px; top: 0; width: ${width}; height: ${height};`;
  }

  function getKeyBackground(keyId: string): string {
    const isHighlighted = highlightKeys.includes(keyId);
    const isActive = activeKey === keyId;

    if (isActive) {
      return "#ce7e4f"; // terracotta
    }

    if (isHighlighted) {
      const key = allKeys.find((k) => k.id === keyId);
      return key?.isBlack ? "#f59e0b" : "#fde68a"; // orange for black, amber for white
    }

    return "";
  }

  function getKeyTextColor(keyId: string): string {
    const key = allKeys.find((k) => k.id === keyId);
    if (!key) return "#333";

    const isHighlighted = highlightKeys.includes(keyId);
    const isActive = activeKey === keyId;

    // Active keys show white text
    if (isActive) return "#fff";

    // Black keys have light text on dark background
    if (key.isBlack) {
      return isHighlighted ? "#333" : "#fff";
    }

    // White keys have dark text
    return "#333";
  }

  function handleKeyClick(key: PianoKey): void {
    if (onNotePlay) {
      onNotePlay(key.id, key.midiNote);
    }
  }
</script>

<div
  style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 8px;"
>
  <!-- Keyboard container -->
  <div
    style="overflow-x: auto; border: 1px solid #ddd; border-radius: 6px; background: #fff; padding: 8px;"
  >
    <div
      style="position: relative; width: {whiteKeys.length * 40}px; height: 160px; background: #fff;"
    >
      <!-- White keys -->
      {#each whiteKeys as whiteKey, i}
        {@const bgColor = getKeyBackground(whiteKey.id)}
        {@const textColor = getKeyTextColor(whiteKey.id)}
        <button
          style="
            {getWhiteKeyStyle(i)}
            background: {bgColor || '#fff'};
            border: 1px solid #ccc;
            border-radius: 0 0 6px 6px;
            cursor: pointer;
            transition: all 0.1s ease;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            color: {textColor};
            font-size: 11px;
            font-weight: 500;
            padding-bottom: 6px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.1);
          "
          onclick={() => handleKeyClick(whiteKey)}
          onmouseover={(e) => {
            if (!highlightKeys.includes(whiteKey.id) && activeKey !== whiteKey.id) {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }
          }}
          onfocus={(e) => {
            if (!highlightKeys.includes(whiteKey.id) && activeKey !== whiteKey.id) {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }
          }}
          onmouseout={(e) => {
            if (!highlightKeys.includes(whiteKey.id) && activeKey !== whiteKey.id) {
              e.currentTarget.style.backgroundColor = "#fff";
            }
          }}
          onblur={(e) => {
            if (!highlightKeys.includes(whiteKey.id) && activeKey !== whiteKey.id) {
              e.currentTarget.style.backgroundColor = "#fff";
            }
          }}
          aria-label="Note {whiteKey.id}"
        >
          {#if showLabels}
            <span>{whiteKey.id}</span>
          {/if}
        </button>
      {/each}

      <!-- Black keys -->
      {#each blackKeys as blackKey, i}
        {@const whiteIndex = whiteKeys.findIndex(
          (w) => w.letter === blackKey.letter.split("#")[0] && w.octave === blackKey.octave,
        )}
        {@const bgColor = getKeyBackground(blackKey.id)}
        {@const textColor = getKeyTextColor(blackKey.id)}
        {#if whiteIndex >= 0 && whiteIndex < whiteKeys.length - 1}
          <button
            style="
              {getBlackKeyStyle(whiteIndex)}
              background: {bgColor || '#1a1a1a'};
              border: 1px solid #000;
              border-radius: 0 0 4px 4px;
              cursor: pointer;
              transition: all 0.1s ease;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-end;
              color: {textColor};
              font-size: 9px;
              font-weight: 500;
              padding-bottom: 4px;
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3);
              z-index: 10;
            "
            onclick={() => handleKeyClick(blackKey)}
            onmouseover={(e) => {
              if (!highlightKeys.includes(blackKey.id) && activeKey !== blackKey.id) {
                e.currentTarget.style.backgroundColor = "#333";
              }
            }}
            onfocus={(e) => {
              if (!highlightKeys.includes(blackKey.id) && activeKey !== blackKey.id) {
                e.currentTarget.style.backgroundColor = "#333";
              }
            }}
            onmouseout={(e) => {
              if (!highlightKeys.includes(blackKey.id) && activeKey !== blackKey.id) {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
              }
            }}
            onblur={(e) => {
              if (!highlightKeys.includes(blackKey.id) && activeKey !== blackKey.id) {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
              }
            }}
            aria-label="Note {blackKey.id}"
          >
            {#if showLabels}
              <span>{blackKey.id}</span>
            {/if}
          </button>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Legend -->
  <div style="font-size: 12px; color: #666; text-align: center;">
    <span style="margin-right: 16px;">
      <span style="display: inline-block; width: 12px; height: 12px; background: #fde68a; border: 1px solid #ddd; margin-right: 4px; vertical-align: middle; border-radius: 2px;"></span>
      Highlighted
    </span>
    <span>
      <span style="display: inline-block; width: 12px; height: 12px; background: #ce7e4f; border: 1px solid #ddd; margin-right: 4px; vertical-align: middle; border-radius: 2px;"></span>
      Active
    </span>
  </div>
</div>
