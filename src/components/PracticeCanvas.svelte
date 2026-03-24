<script lang="ts">
  import VirtualKeyboard from './VirtualKeyboard.svelte';
  import ScrollingStaff from './ScrollingStaff.svelte';
  import FeedbackStrip from './FeedbackStrip.svelte';
  import PracticeResults from './PracticeResults.svelte';
  import InputSourceSelector from './InputSourceSelector.svelte';
  import Metronome from './Metronome.svelte';
  import { practiceSession, type NoteResult, type PracticeResult } from '../stores/practice-session.svelte';
  import { inputAdapter, type NoteEvent } from '../stores/input-adapter.svelte';
  import { playNote } from '../stores/audio';
  import type { Song } from '../data/songs';
  import type { NoteStatus } from './ScrollingStaff.svelte';

  // ── Props ──────────────────────────────────────────────────────────────────
  interface Props {
    /** Song to practice (null for free play) */
    song?: Song | null;
    /** Practice mode */
    mode?: 'free' | 'guided';
  }

  let {
    song = null,
    mode = 'free',
  }: Props = $props();

  // ── Local UI state ─────────────────────────────────────────────────────────

  /** Active key for keyboard highlight */
  let activeKey = $state<string | null>(null);

  /** Per-note visual statuses for ScrollingStaff */
  let noteStatuses = $state<Record<number, NoteStatus>>({});

  /** Last played note name for FeedbackStrip */
  let lastPlayedNote = $state<string | null>(null);

  /** Last result for flash animation */
  let lastResult = $state<'correct' | 'wrong' | 'missed' | null>(null);

  /** Cents off from last mic detection */
  let lastCentsOff = $state<number | null>(null);

  /** Completed practice result for results screen */
  let completedResult = $state<PracticeResult | null>(null);

  // ── Derived from practice session ──────────────────────────────────────────

  const songNotes = $derived(song ? song.lines.flat() : []);
  const expectedNote = $derived(practiceSession.expectedNote);
  const highlightKeys = $derived(expectedNote ? [expectedNote] : []);

  // ── Note event handling ────────────────────────────────────────────────────

  function handleVirtualNotePlay(noteId: string, midiNote: number) {
    playNote(midiNote);
    inputAdapter.emitVirtualNote(midiNote);

    activeKey = noteId;
    setTimeout(() => { activeKey = null; }, 200);

    // Feed into practice session
    const event: NoteEvent = {
      midiNote,
      noteName: noteId,
      velocity: 100,
      source: 'virtual',
      timestamp: performance.now(),
    };
    processNoteEvent(event);
  }

  function processNoteEvent(event: NoteEvent) {
    lastPlayedNote = event.noteName;
    lastCentsOff = event.centsOff ?? null;

    if (mode === 'free' || !practiceSession.isPlaying) return;

    practiceSession.submitNote(event);
  }

  // ── Subscribe to practice session events ──────────────────────────────────

  $effect(() => {
    const unsubResult = practiceSession.onNoteResult((result: NoteResult, index: number) => {
      if (result.correct) {
        noteStatuses = { ...noteStatuses, [index]: 'correct' };
        lastResult = 'correct';
      } else if (result.actualMidi === null) {
        noteStatuses = { ...noteStatuses, [index]: 'missed' };
        lastResult = 'missed';
      } else {
        noteStatuses = { ...noteStatuses, [index]: 'wrong' };
        lastResult = 'wrong';
        // Clear wrong status after delay so user can retry
        setTimeout(() => {
          if (noteStatuses[index] === 'wrong' && practiceSession.currentIndex === index) {
            const updated = { ...noteStatuses };
            delete updated[index];
            noteStatuses = updated;
          }
        }, 600);
      }
    });

    const unsubComplete = practiceSession.onComplete((result: PracticeResult) => {
      // Override input source with actual source
      completedResult = { ...result, inputSource: inputAdapter.activeSource };
    });

    return () => {
      unsubResult();
      unsubComplete();
    };
  });

  // Subscribe to non-virtual input sources
  $effect(() => {
    const unsub = inputAdapter.onNote((event: NoteEvent) => {
      if (event.source === 'virtual') return;
      playNote(event.midiNote);
      activeKey = event.noteName;
      setTimeout(() => { activeKey = null; }, 200);
      processNoteEvent(event);
    });

    return () => { unsub(); };
  });

  // ── Practice controls ──────────────────────────────────────────────────────

  function startPractice() {
    if (!song) return;
    completedResult = null;
    noteStatuses = {};
    lastResult = null;
    lastPlayedNote = null;
    lastCentsOff = null;
    practiceSession.start(song);
  }

  function stopPractice() {
    practiceSession.stop();
    noteStatuses = {};
  }

  function pausePractice() {
    practiceSession.pause();
  }

  function resumePractice() {
    practiceSession.resume();
  }

  function retryPractice() {
    completedResult = null;
    noteStatuses = {};
    lastResult = null;
    lastPlayedNote = null;
    practiceSession.retry();
  }

  function closeResults() {
    completedResult = null;
    practiceSession.stop();
  }
</script>

<div class="practice-canvas">
  <!-- Control bar -->
  <div class="practice-control-bar">
    <div class="practice-controls-left">
      {#if song}
        <Metronome initialBpm={song.bpm} />
      {:else}
        <Metronome initialBpm={120} />
      {/if}
    </div>

    <div class="practice-controls-center">
      {#if mode !== 'free' && song}
        {#if practiceSession.state === 'idle' || practiceSession.isComplete}
          <button class="practice-btn practice-btn-start" onclick={startPractice}>
            &#x25B6; Start
          </button>
        {:else if practiceSession.state === 'countdown'}
          <div class="countdown-display">
            <span class="countdown-number">{practiceSession.countdownBeat}</span>
          </div>
        {:else if practiceSession.isPlaying}
          <button class="practice-btn practice-btn-stop" onclick={pausePractice}>
            &#x23F8; Pause
          </button>
          <button class="practice-btn practice-btn-stop" onclick={stopPractice}>
            &#x25A0; Stop
          </button>
        {:else if practiceSession.isPaused}
          <button class="practice-btn practice-btn-start" onclick={resumePractice}>
            &#x25B6; Resume
          </button>
          <button class="practice-btn practice-btn-stop" onclick={stopPractice}>
            &#x25A0; Stop
          </button>
        {/if}

        {#if practiceSession.isPlaying || practiceSession.isPaused}
          <span class="practice-progress-text">
            {practiceSession.currentIndex + 1}/{songNotes.length}
          </span>
        {/if}
      {/if}
    </div>

    <div class="practice-controls-right">
      <InputSourceSelector />
    </div>
  </div>

  <!-- Song title -->
  {#if song}
    <div class="practice-song-header">
      <h2 class="practice-song-title">{song.title}</h2>
      {#if song.composer}
        <span class="practice-song-composer">{song.composer}</span>
      {/if}
      <span class="practice-song-meta">
        {song.keySignature} &middot; {song.timeSignature[0]}/{song.timeSignature[1]} &middot; {song.bpm} BPM
      </span>
    </div>
  {/if}

  <!-- Scrolling staff -->
  {#if songNotes.length > 0}
    <div class="practice-staff-section">
      <ScrollingStaff
        notes={songNotes}
        currentIndex={practiceSession.isPlaying ? practiceSession.currentIndex : -1}
        {noteStatuses}
        timeSignature={song?.timeSignature ?? [4, 4]}
        showLabels={true}
      />
    </div>
  {/if}

  <!-- Feedback strip -->
  {#if practiceSession.isPlaying || practiceSession.isPaused || inputAdapter.activeSource !== 'virtual'}
    <FeedbackStrip
      currentNote={lastPlayedNote}
      {expectedNote}
      centsOff={lastCentsOff}
      {lastResult}
      correctCount={practiceSession.correctCount}
      totalCount={practiceSession.totalAttempts}
      streak={practiceSession.currentStreak}
      inputSource={inputAdapter.activeSource}
    />
  {/if}

  <!-- Virtual keyboard -->
  <div class="practice-keyboard-section">
    <VirtualKeyboard
      startOctave={3}
      endOctave={5}
      onNotePlay={handleVirtualNotePlay}
      {highlightKeys}
      {activeKey}
      showLabels={true}
    />
  </div>

  <!-- Results overlay -->
  {#if completedResult}
    <PracticeResults
      result={completedResult}
      onRetry={retryPractice}
      onClose={closeResults}
    />
  {/if}
</div>
