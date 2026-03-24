<script lang="ts">
  import LessonLayout from '../components/LessonLayout.svelte';
  import VirtualKeyboard from '../components/VirtualKeyboard.svelte';
  import { getLessonById } from '../data/lessons';
  import { playNote } from '../stores/audio';

  const lesson = getLessonById(2)!;

  // ── Interactive state ─────────────────────────────────────────────────────
  let activeKey = $state<string | null>(null);
  let showRightHand = $state(true);
  let currentFingerDemo = $state<number | null>(null);

  // Right hand C position: thumb on C4, pinky on G4
  const rightHandPosition: Record<number, { note: string; finger: string; label: string }> = {
    1: { note: 'C4', finger: '1 — Thumb', label: 'C' },
    2: { note: 'D4', finger: '2 — Index', label: 'D' },
    3: { note: 'E4', finger: '3 — Middle', label: 'E' },
    4: { note: 'F4', finger: '4 — Ring', label: 'F' },
    5: { note: 'G4', finger: '5 — Pinky', label: 'G' },
  };

  // Left hand C position: pinky on C3, thumb on G3
  const leftHandPosition: Record<number, { note: string; finger: string; label: string }> = {
    5: { note: 'C3', finger: '5 — Pinky', label: 'C' },
    4: { note: 'D3', finger: '4 — Ring', label: 'D' },
    3: { note: 'E3', finger: '3 — Middle', label: 'E' },
    2: { note: 'F3', finger: '2 — Index', label: 'F' },
    1: { note: 'G3', finger: '1 — Thumb', label: 'G' },
  };

  const currentPosition = $derived(showRightHand ? rightHandPosition : leftHandPosition);
  const highlightedKeys = $derived(
    Object.values(currentPosition).map(p => p.note)
  );

  function handleFingerClick(fingerNum: number) {
    currentFingerDemo = fingerNum;
    const pos = currentPosition[fingerNum];
    if (pos) {
      activeKey = pos.note;
      const midiMap: Record<string, number> = {
        'C3': 48, 'D3': 50, 'E3': 52, 'F3': 53, 'G3': 55,
        'C4': 60, 'D4': 62, 'E4': 64, 'F4': 65, 'G4': 67,
      };
      playNote(midiMap[pos.note], 0.6);
      setTimeout(() => { activeKey = null; currentFingerDemo = null; }, 800);
    }
  }

  function handleNotePlay(noteId: string, midiNote: number) {
    activeKey = noteId;
    playNote(midiNote, 0.5);
    setTimeout(() => { activeKey = null; }, 400);
  }

  // Play all five fingers in sequence
  let isPlayingSequence = $state(false);
  function playFingerSequence() {
    if (isPlayingSequence) return;
    isPlayingSequence = true;
    const fingers = showRightHand ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];
    let i = 0;
    function playNext() {
      if (i >= fingers.length) {
        isPlayingSequence = false;
        return;
      }
      handleFingerClick(fingers[i]);
      i++;
      setTimeout(playNext, 500);
    }
    playNext();
  }

</script>

<LessonLayout {lesson}>
  <!-- Section 1: Why Finger Numbers Matter -->
  <section class="mb-10">
    <h2 class="text-[1.25rem] font-bold text-navy mb-3">Why Finger Numbers Matter</h2>
    <p class="text-[0.95rem] text-[#444] leading-relaxed mb-4">
      Before you play a single melody, you need to know which finger goes where. Piano music uses a
      universal numbering system for fingers — and it is the same for both hands. Getting comfortable
      with this system early will make learning every piece that follows much easier.
    </p>
    <p class="text-[0.95rem] text-[#444] leading-relaxed">
      Finger numbers appear in sheet music as small digits above or below notes. They tell you exactly
      which finger to use, helping you play smoothly without awkward hand jumps. Professional pianists
      plan their fingering carefully — and so should you, right from the start.
    </p>
  </section>

  <!-- Section 2: The Five Fingers -->
  <section class="mb-10">
    <h2 class="text-[1.25rem] font-bold text-navy mb-3">The Numbering System</h2>
    <p class="text-[0.95rem] text-[#444] leading-relaxed mb-5">
      Each finger gets a number from 1 to 5. The numbering is the same on both hands — your thumb is
      always 1 and your pinky is always 5.
    </p>

    <!-- Hand diagram -->
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-6 mb-6">
      <div class="flex justify-center gap-8 flex-wrap">
        <!-- Left Hand -->
        <div class="text-center">
          <p class="text-[0.85rem] font-semibold text-navy mb-3">Left Hand</p>
          <svg viewBox="0 0 200 220" width="180" height="200" class="mx-auto">
            <!-- Palm -->
            <ellipse cx="100" cy="160" rx="55" ry="50" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" opacity="0.4" />
            <!-- Pinky (5) -->
            <rect x="148" y="55" width="18" height="75" rx="9" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" />
            <text x="157" y="85" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">5</text>
            <!-- Ring (4) -->
            <rect x="125" y="35" width="20" height="90" rx="10" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" />
            <text x="135" y="70" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">4</text>
            <!-- Middle (3) -->
            <rect x="90" y="25" width="22" height="100" rx="11" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" />
            <text x="101" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">3</text>
            <!-- Index (2) -->
            <rect x="58" y="40" width="20" height="88" rx="10" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" />
            <text x="68" y="73" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">2</text>
            <!-- Thumb (1) -->
            <rect x="28" y="95" width="22" height="55" rx="11" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" transform="rotate(-25, 39, 122)" />
            <text x="35" y="115" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">1</text>
          </svg>
        </div>

        <!-- Right Hand -->
        <div class="text-center">
          <p class="text-[0.85rem] font-semibold text-navy mb-3">Right Hand</p>
          <svg viewBox="0 0 200 220" width="180" height="200" class="mx-auto">
            <!-- Palm -->
            <ellipse cx="100" cy="160" rx="55" ry="50" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" opacity="0.4" />
            <!-- Thumb (1) -->
            <rect x="150" y="95" width="22" height="55" rx="11" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" transform="rotate(25, 161, 122)" />
            <text x="165" y="115" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">1</text>
            <!-- Index (2) -->
            <rect x="122" y="40" width="20" height="88" rx="10" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" />
            <text x="132" y="73" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">2</text>
            <!-- Middle (3) -->
            <rect x="90" y="25" width="22" height="100" rx="11" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" />
            <text x="101" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">3</text>
            <!-- Ring (4) -->
            <rect x="57" y="35" width="20" height="90" rx="10" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" />
            <text x="67" y="70" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">4</text>
            <!-- Pinky (5) -->
            <rect x="34" y="55" width="18" height="75" rx="9" fill="#fde68a" stroke="#ce7e4f" stroke-width="1.5" />
            <text x="43" y="85" text-anchor="middle" font-size="14" font-weight="bold" fill="#3d3929">5</text>
          </svg>
        </div>
      </div>

      <div class="mt-4 text-center">
        <p class="text-[0.85rem] text-[#6b6455]">
          <strong>1</strong> = Thumb &nbsp;·&nbsp;
          <strong>2</strong> = Index &nbsp;·&nbsp;
          <strong>3</strong> = Middle &nbsp;·&nbsp;
          <strong>4</strong> = Ring &nbsp;·&nbsp;
          <strong>5</strong> = Pinky
        </p>
      </div>
    </div>

    <p class="text-[0.95rem] text-[#444] leading-relaxed">
      Notice that the thumb is always 1, regardless of which hand you are using. This is a universal
      convention used by pianists worldwide. When you see a "1" in sheet music, it always means the thumb.
    </p>
  </section>

  <!-- Section 3: Hand Position -->
  <section class="mb-10">
    <h2 class="text-[1.25rem] font-bold text-navy mb-3">Proper Hand Position</h2>
    <p class="text-[0.95rem] text-[#444] leading-relaxed mb-4">
      Good hand position is the foundation of good piano playing. Here are the key principles to remember
      every time you sit at the keyboard.
    </p>

    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-4">
      <div class="space-y-4">
        <div class="flex gap-3 items-start">
          <span class="text-[1.2rem] shrink-0 mt-0.5">🤲</span>
          <div>
            <p class="text-[0.95rem] font-medium text-navy">Curved fingers</p>
            <p class="text-[0.85rem] text-[#6b6455] leading-relaxed">
              Imagine holding a tennis ball — your fingers should be gently curved, not flat.
              Play with the fingertips, not the flat pads of your fingers.
            </p>
          </div>
        </div>
        <div class="flex gap-3 items-start">
          <span class="text-[1.2rem] shrink-0 mt-0.5">🫳</span>
          <div>
            <p class="text-[0.95rem] font-medium text-navy">Relaxed wrist</p>
            <p class="text-[0.85rem] text-[#6b6455] leading-relaxed">
              Your wrist should be level with or slightly above the keys — not drooping below
              or raised high. Keep it relaxed to avoid tension and fatigue.
            </p>
          </div>
        </div>
        <div class="flex gap-3 items-start">
          <span class="text-[1.2rem] shrink-0 mt-0.5">🪑</span>
          <div>
            <p class="text-[0.95rem] font-medium text-navy">Seated position</p>
            <p class="text-[0.85rem] text-[#6b6455] leading-relaxed">
              Sit at the center of the keyboard with your elbows slightly above key level. Your forearms
              should be roughly parallel to the floor. Feet flat on the ground.
            </p>
          </div>
        </div>
        <div class="flex gap-3 items-start">
          <span class="text-[1.2rem] shrink-0 mt-0.5">👍</span>
          <div>
            <p class="text-[0.95rem] font-medium text-navy">Thumb position</p>
            <p class="text-[0.85rem] text-[#6b6455] leading-relaxed">
              Your thumb plays with its side edge (not the tip like the other fingers). It rests
              naturally on the keys — avoid letting it hang off the keyboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 4: C Position — Interactive -->
  <section class="mb-10">
    <h2 class="text-[1.25rem] font-bold text-navy mb-3">C Position — Your First Hand Position</h2>
    <p class="text-[0.95rem] text-[#444] leading-relaxed mb-4">
      The "C position" is the first hand position every pianist learns. Place your thumb on C and let
      each finger rest on the next white key. For the right hand, that means fingers 1-2-3-4-5 on
      C-D-E-F-G. For the left hand, fingers 5-4-3-2-1 rest on C-D-E-F-G (pinky on C, thumb on G).
    </p>

    <!-- Hand toggle -->
    <div class="flex gap-2 mb-4">
      <button
        class="px-4 py-2 rounded-lg text-[0.85rem] font-medium cursor-pointer transition-all border-none"
        style="background: {showRightHand ? '#3d3929' : '#f0ede6'}; color: {showRightHand ? '#fff' : '#6b6455'};"
        onclick={() => { showRightHand = true; currentFingerDemo = null; }}
      >Right Hand</button>
      <button
        class="px-4 py-2 rounded-lg text-[0.85rem] font-medium cursor-pointer transition-all border-none"
        style="background: {!showRightHand ? '#3d3929' : '#f0ede6'}; color: {!showRightHand ? '#fff' : '#6b6455'};"
        onclick={() => { showRightHand = false; currentFingerDemo = null; }}
      >Left Hand</button>
    </div>

    <!-- Finger buttons -->
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-4">
      <p class="text-[0.85rem] font-semibold text-navy mb-3">
        {showRightHand ? 'Right Hand' : 'Left Hand'} — C Position
      </p>
      <p class="text-[0.85rem] text-[#6b6455] mb-4">
        Click a finger number to see and hear which key it plays:
      </p>

      <div class="flex gap-2 justify-center mb-4 flex-wrap">
        {#each Object.entries(currentPosition) as [num, pos]}
          <button
            class="w-16 h-20 rounded-lg cursor-pointer transition-all border-2 flex flex-col items-center justify-center gap-1"
            style="
              background: {currentFingerDemo === Number(num) ? '#ce7e4f' : '#faf9f5'};
              border-color: {currentFingerDemo === Number(num) ? '#ce7e4f' : '#dad9d4'};
              color: {currentFingerDemo === Number(num) ? '#fff' : '#3d3929'};
            "
            onclick={() => handleFingerClick(Number(num))}
          >
            <span class="text-[1.2rem] font-bold">{num}</span>
            <span class="text-[0.7rem]">{pos.label}</span>
          </button>
        {/each}
      </div>

      <div class="text-center mb-4">
        <button
          class="px-5 py-2 rounded-lg text-[0.85rem] font-medium cursor-pointer border-none transition-opacity"
          style="background: #3d3929; color: #fff; opacity: {isPlayingSequence ? '0.5' : '1'};"
          onclick={playFingerSequence}
          disabled={isPlayingSequence}
        >
          Play All Fingers {showRightHand ? '1→5' : '5→1'}
        </button>
      </div>

      <!-- Show current finger info -->
      {#if currentFingerDemo !== null}
        <div class="text-center p-3 bg-[#fdf6ee] rounded-md border border-[#f0dcc8]">
          <p class="text-[0.9rem] font-medium text-navy">
            Finger {currentFingerDemo}: {currentPosition[currentFingerDemo]?.finger}
          </p>
          <p class="text-[0.8rem] text-[#6b6455]">
            plays note {currentPosition[currentFingerDemo]?.label}
          </p>
        </div>
      {/if}
    </div>

    <!-- Keyboard showing C position -->
    <VirtualKeyboard
      startOctave={showRightHand ? 4 : 3}
      endOctave={showRightHand ? 4 : 3}
      highlightKeys={highlightedKeys}
      {activeKey}
      onNotePlay={handleNotePlay}
    />

    <p class="text-[0.85rem] text-[#6b6455] mt-3 text-center">
      The highlighted keys show where each finger rests in C position.
    </p>
  </section>

  <!-- Section 5: Fingering in Sheet Music -->
  <section class="mb-10">
    <h2 class="text-[1.25rem] font-bold text-navy mb-3">Reading Finger Numbers in Music</h2>
    <p class="text-[0.95rem] text-[#444] leading-relaxed mb-4">
      When you see printed piano music, you will often find small numbers written next to the notes.
      These are fingering suggestions — they tell you which finger to use for that note.
    </p>

    <!-- Example notation -->
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-4">
      <p class="text-[0.85rem] font-semibold text-navy mb-3">Example: Fingered Notes</p>
      <svg viewBox="0 0 400 100" width="100%" style="max-width: 400px;" class="mx-auto block">
        <!-- Staff lines -->
        <line x1="20" y1="30" x2="380" y2="30" stroke="#999" stroke-width="0.8" />
        <line x1="20" y1="40" x2="380" y2="40" stroke="#999" stroke-width="0.8" />
        <line x1="20" y1="50" x2="380" y2="50" stroke="#999" stroke-width="0.8" />
        <line x1="20" y1="60" x2="380" y2="60" stroke="#999" stroke-width="0.8" />
        <line x1="20" y1="70" x2="380" y2="70" stroke="#999" stroke-width="0.8" />

        <!-- C (ledger line) with finger 1 -->
        <line x1="65" y1="80" x2="95" y2="80" stroke="#333" stroke-width="1" />
        <ellipse cx="80" cy="80" rx="8" ry="5.5" fill="#3d3929" transform="rotate(-15, 80, 80)" />
        <text x="80" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="#ce7e4f">1</text>

        <!-- D with finger 2 -->
        <ellipse cx="145" cy="75" rx="8" ry="5.5" fill="#3d3929" transform="rotate(-15, 145, 75)" />
        <text x="145" y="91" text-anchor="middle" font-size="12" font-weight="bold" fill="#ce7e4f">2</text>

        <!-- E (on first line) with finger 3 -->
        <ellipse cx="210" cy="70" rx="8" ry="5.5" fill="#3d3929" transform="rotate(-15, 210, 70)" />
        <text x="210" y="86" text-anchor="middle" font-size="12" font-weight="bold" fill="#ce7e4f">3</text>

        <!-- F (first space) with finger 4 -->
        <ellipse cx="275" cy="65" rx="8" ry="5.5" fill="#3d3929" transform="rotate(-15, 275, 65)" />
        <text x="275" y="81" text-anchor="middle" font-size="12" font-weight="bold" fill="#ce7e4f">4</text>

        <!-- G (second line) with finger 5 -->
        <ellipse cx="340" cy="60" rx="8" ry="5.5" fill="#3d3929" transform="rotate(-15, 340, 60)" />
        <text x="340" y="76" text-anchor="middle" font-size="12" font-weight="bold" fill="#ce7e4f">5</text>

        <!-- Note labels -->
        <text x="80" y="20" text-anchor="middle" font-size="10" fill="#6b6455">C</text>
        <text x="145" y="20" text-anchor="middle" font-size="10" fill="#6b6455">D</text>
        <text x="210" y="20" text-anchor="middle" font-size="10" fill="#6b6455">E</text>
        <text x="275" y="20" text-anchor="middle" font-size="10" fill="#6b6455">F</text>
        <text x="340" y="20" text-anchor="middle" font-size="10" fill="#6b6455">G</text>
      </svg>
      <p class="text-[0.8rem] text-[#6b6455] text-center mt-3">
        The orange numbers below each note indicate which finger to use (right hand, C position).
      </p>
    </div>

    <p class="text-[0.95rem] text-[#444] leading-relaxed">
      Not every note in a piece will have a finger number written on it — usually they appear at the
      beginning of a passage, at position changes, and wherever the fingering might not be obvious.
      Once you know the position, you can figure out the rest.
    </p>
  </section>

  <!-- Section 6: Common Mistakes -->
  <section class="mb-10">
    <h2 class="text-[1.25rem] font-bold text-navy mb-3">Common Mistakes to Avoid</h2>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
      <div class="space-y-3">
        <div class="flex gap-3 items-start">
          <span class="text-wrong font-bold shrink-0">✗</span>
          <p class="text-[0.9rem] text-[#444]">
            <strong>Flat fingers</strong> — Playing with fingers straight and flat makes it hard to
            control each key independently. Keep them curved.
          </p>
        </div>
        <div class="flex gap-3 items-start">
          <span class="text-wrong font-bold shrink-0">✗</span>
          <p class="text-[0.9rem] text-[#444]">
            <strong>Collapsed knuckles</strong> — If your first knuckle (closest to the nail) bends
            inward, you lose power and control. Keep knuckles firm but not tense.
          </p>
        </div>
        <div class="flex gap-3 items-start">
          <span class="text-wrong font-bold shrink-0">✗</span>
          <p class="text-[0.9rem] text-[#444]">
            <strong>Flying fingers</strong> — Lifting unused fingers high above the keys wastes energy
            and slows you down. Keep fingers close to the keys at all times.
          </p>
        </div>
        <div class="flex gap-3 items-start">
          <span class="text-wrong font-bold shrink-0">✗</span>
          <p class="text-[0.9rem] text-[#444]">
            <strong>Tense shoulders</strong> — Tension in the shoulders travels down to the hands.
            Drop your shoulders, breathe, and stay relaxed.
          </p>
        </div>
      </div>
    </div>
  </section>

</LessonLayout>
