<script lang="ts">
  import { router } from '../router.svelte';
  import { progress } from '../stores/progress.svelte';
  import { consent } from '../stores/consent.svelte';
  import { reactivePitchDetector } from '../stores/pitch-detector.svelte';
  import { reactiveMIDIInput } from '../stores/midi-input.svelte';
  import { inputAdapter, type InputSource } from '../stores/input-adapter.svelte';
  import { playNote } from '../stores/audio';

  let showDeleteConfirm = $state(false);
  let showRevokeConfirm = $state(false);
  let exportSuccess = $state(false);
  let deleteSuccess = $state(false);

  // ── Audio input state ──────────────────────────────────────────────────────
  let micTesting = $state(false);
  let micTestTimer: ReturnType<typeof setTimeout> | null = null;
  let micTestNote = $state('');
  let micTestConfidence = $state(0);
  let micTestCentsOff = $state(0);
  let calibrating = $state(false);
  let calibrationRMS = $state(0);
  let calibrationDone = $state(false);
  let midiConnecting = $state(false);

  const preferredSource = $derived(progress.data.inputPreference ?? 'virtual');
  const dailyGoal = $derived(progress.data.dailyPracticeGoalMinutes ?? 15);

  // ── Mic test: listen for 10 seconds and display detected notes ────────────
  async function startMicTest() {
    if (micTesting) {
      stopMicTest();
      return;
    }

    micTesting = true;
    micTestNote = '';
    micTestConfidence = 0;
    micTestCentsOff = 0;

    try {
      await reactivePitchDetector.start();

      // Auto-stop after 10 seconds
      micTestTimer = setTimeout(() => stopMicTest(), 10000);
    } catch {
      micTesting = false;
    }
  }

  function stopMicTest() {
    if (micTestTimer) {
      clearTimeout(micTestTimer);
      micTestTimer = null;
    }
    reactivePitchDetector.stop();
    micTesting = false;
  }

  // React to pitch detection during mic test
  $effect(() => {
    if (micTesting && reactivePitchDetector.currentPitch) {
      const p = reactivePitchDetector.currentPitch;
      micTestNote = p.noteName;
      micTestConfidence = p.confidence;
      micTestCentsOff = p.centsOff;
      // Play the detected note on the synth for feedback
      playNote(p.midiNote, 0.3, 0.5);
    }
  });

  // ── Mic calibration ──────────────────────────────────────────────────────
  async function startCalibration() {
    calibrating = true;
    calibrationRMS = 0;
    calibrationDone = false;

    try {
      await reactivePitchDetector.start();

      // Sample noise floor for 3 seconds
      let maxRMS = 0;
      const samples: number[] = [];

      const unsub = reactivePitchDetector.onPitchEvent((result) => {
        samples.push(result.confidence);
        if (result.confidence > maxRMS) maxRMS = result.confidence;
        calibrationRMS = maxRMS;
      });

      // Wait 3 seconds then set threshold
      setTimeout(() => {
        unsub();
        reactivePitchDetector.stop();

        // Set silence threshold slightly above observed noise
        const threshold = Math.max(0.005, maxRMS * 1.2 + 0.005);
        reactivePitchDetector.setSilenceThreshold(Math.min(threshold, 0.05));

        // Save to localStorage (not consent-gated, just a calibration value)
        try {
          localStorage.setItem('klavier-mic-threshold', String(threshold));
        } catch { /* ignore */ }

        calibrating = false;
        calibrationDone = true;
        setTimeout(() => (calibrationDone = false), 3000);
      }, 3000);
    } catch {
      calibrating = false;
    }
  }

  // Load saved mic threshold on init
  try {
    const saved = localStorage.getItem('klavier-mic-threshold');
    if (saved) {
      reactivePitchDetector.setSilenceThreshold(parseFloat(saved));
    }
  } catch { /* ignore */ }

  // ── MIDI connect ────────────────────────────────────────────────────────
  async function connectMIDI() {
    midiConnecting = true;
    await reactiveMIDIInput.connect();
    midiConnecting = false;
  }

  // ── Input preference ──────────────────────────────────────────────────────
  function setPreference(source: InputSource) {
    progress.setInputPreference(source);
  }

  function updateDailyGoal(minutes: number) {
    progress.setDailyGoal(minutes);
  }

  function exportData() {
    const data = {
      exportDate: new Date().toISOString(),
      appVersion: '1.0',
      consent: {
        status: consent.data.status,
        date: consent.data.date,
        policyVersion: consent.data.version,
      },
      progress: consent.hasConsented ? progress.data : null,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klavier-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    exportSuccess = true;
    setTimeout(() => (exportSuccess = false), 3000);
  }

  function deleteAllData() {
    progress.reset();
    showDeleteConfirm = false;
    deleteSuccess = true;
    setTimeout(() => (deleteSuccess = false), 3000);
  }

  function revokeConsent() {
    consent.revoke();
    showRevokeConfirm = false;
  }
</script>

<div class="max-w-3xl mx-auto px-6 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6">
    <button
      class="text-[0.85rem] text-[#6b6455] bg-transparent border-none cursor-pointer hover:text-navy transition-colors p-0"
      onclick={() => router.navigate('/')}
    >← Back to Home</button>
  </div>

  <h1 class="text-[1.8rem] font-bold text-navy mb-2">Settings</h1>
  <p class="text-[0.85rem] text-[#b4b2a7] mb-8">Manage your audio input, practice goals, data, and privacy</p>

  <!-- Audio Input -->
  <section class="mb-8">
    <h2 class="text-[1.15rem] font-semibold text-navy mb-4">Audio Input</h2>

    <!-- Preferred Input Source -->
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-4">
      <p class="text-[0.95rem] font-medium text-navy mb-1">Preferred Input</p>
      <p class="text-[0.85rem] text-[#6b6455] mb-4">This will be selected by default when you start a practice session.</p>
      <div class="settings-input-buttons">
        <button
          type="button"
          class="settings-input-btn {preferredSource === 'virtual' ? 'settings-input-btn-active' : ''}"
          onclick={() => setPreference('virtual')}
          aria-pressed={preferredSource === 'virtual'}
        >
          <span aria-hidden="true">🎹</span> Virtual Keyboard
        </button>
        {#if inputAdapter.micAvailable}
          <button
            type="button"
            class="settings-input-btn {preferredSource === 'mic' ? 'settings-input-btn-active' : ''}"
            onclick={() => setPreference('mic')}
            aria-pressed={preferredSource === 'mic'}
          >
            <span aria-hidden="true">🎤</span> Microphone
          </button>
        {/if}
        {#if inputAdapter.midiAvailable}
          <button
            type="button"
            class="settings-input-btn {preferredSource === 'midi' ? 'settings-input-btn-active' : ''}"
            onclick={() => setPreference('midi')}
            aria-pressed={preferredSource === 'midi'}
          >
            <span aria-hidden="true">🎵</span> MIDI Keyboard
          </button>
        {/if}
      </div>
    </div>

    <!-- Microphone -->
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <p class="text-[0.95rem] font-medium text-navy">Microphone</p>
          <p class="text-[0.85rem] text-[#6b6455]">
            {#if !reactivePitchDetector.isSupported}
              Not supported in this browser
            {:else if reactivePitchDetector.permissionState === 'granted'}
              Permission granted
            {:else if reactivePitchDetector.permissionState === 'denied'}
              Permission denied — enable in browser settings
            {:else}
              Permission not yet requested
            {/if}
          </p>
        </div>
        <span class="settings-permission-badge
          {reactivePitchDetector.permissionState === 'granted' ? 'settings-permission-granted' : ''}
          {reactivePitchDetector.permissionState === 'denied' ? 'settings-permission-denied' : ''}
          {reactivePitchDetector.permissionState !== 'granted' && reactivePitchDetector.permissionState !== 'denied' ? 'settings-permission-pending' : ''}
        ">
          {#if reactivePitchDetector.permissionState === 'granted'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          {:else if reactivePitchDetector.permissionState === 'denied'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          {:else}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {/if}
        </span>
      </div>

      {#if reactivePitchDetector.isSupported}
        <div class="flex flex-wrap gap-3 mb-3">
          <button
            type="button"
            class="text-[0.85rem] text-white bg-navy rounded-lg px-4 py-2 cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={startMicTest}
            disabled={calibrating}
          >
            {micTesting ? 'Stop Test' : 'Test Microphone'}
          </button>
          <button
            type="button"
            class="text-[0.85rem] text-navy bg-white rounded-lg px-4 py-2 cursor-pointer border border-[#dad9d4] hover:border-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={startCalibration}
            disabled={micTesting || calibrating}
          >
            {calibrating ? 'Calibrating...' : 'Calibrate Sensitivity'}
          </button>
        </div>

        <!-- Mic test feedback -->
        {#if micTesting}
          <div class="settings-mic-test" aria-live="polite">
            <p class="text-[0.85rem] text-[#6b6455] mb-2">Play a note on your piano — Klavier will show what it detects. Test ends in 10 seconds.</p>
            {#if micTestNote}
              <div class="settings-mic-test-result">
                <span class="settings-mic-test-note">{micTestNote}</span>
                <span class="text-[0.8rem] text-[#6b6455]">
                  {micTestCentsOff > 0 ? '+' : ''}{micTestCentsOff} cents
                </span>
                <span class="text-[0.8rem] text-[#6b6455]">
                  Confidence: {Math.round(micTestConfidence * 100)}%
                </span>
              </div>
            {:else}
              <p class="text-[0.85rem] text-[#b4b2a7]">Listening...</p>
            {/if}
          </div>
        {/if}

        <!-- Calibration feedback -->
        {#if calibrating}
          <div class="settings-mic-test" aria-live="polite">
            <p class="text-[0.85rem] text-[#6b6455]">
              Measuring ambient noise... Keep quiet for 3 seconds.
            </p>
            <div class="settings-calibration-bar">
              <div class="settings-calibration-fill" style="width: {Math.min(100, calibrationRMS * 500)}%"></div>
            </div>
          </div>
        {/if}

        {#if calibrationDone}
          <p class="text-[0.85rem] text-[#28a745] mt-2">Sensitivity calibrated successfully.</p>
        {/if}

        {#if reactivePitchDetector.error}
          <p class="text-[0.85rem] text-[#dc3545] mt-2">{reactivePitchDetector.error}</p>
        {/if}

        {#if reactivePitchDetector.permissionState === 'denied'}
          <div class="settings-mic-help mt-3">
            <p class="text-[0.85rem] text-[#6b6455]">
              To re-enable microphone access, click the lock or site settings icon in your browser's address bar and allow microphone access for this site, then reload the page.
            </p>
          </div>
        {/if}
      {/if}
    </div>

    <!-- MIDI Devices -->
    {#if inputAdapter.midiAvailable}
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="text-[0.95rem] font-medium text-navy">MIDI Devices</p>
            <p class="text-[0.85rem] text-[#6b6455]">
              {#if reactiveMIDIInput.isConnected}
                Connected to {reactiveMIDIInput.activeDeviceName || 'MIDI device'}
              {:else if reactiveMIDIInput.hasAccess}
                No MIDI device detected — plug in a USB MIDI keyboard
              {:else}
                Connect to detect MIDI keyboards
              {/if}
            </p>
          </div>
          {#if reactiveMIDIInput.isConnected}
            <span class="settings-permission-badge settings-permission-granted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
          {/if}
        </div>

        {#if !reactiveMIDIInput.hasAccess}
          <button
            type="button"
            class="text-[0.85rem] text-white bg-navy rounded-lg px-4 py-2 cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={connectMIDI}
            disabled={midiConnecting}
          >
            {midiConnecting ? 'Connecting...' : 'Connect MIDI'}
          </button>
        {:else if reactiveMIDIInput.devices.length > 0}
          <div class="settings-midi-devices">
            {#each reactiveMIDIInput.devices as device}
              <div class="settings-midi-device {device.state === 'connected' ? 'settings-midi-device-connected' : ''}">
                <div class="flex-1 min-w-0">
                  <p class="text-[0.9rem] text-navy font-medium truncate">{device.name}</p>
                  <p class="text-[0.8rem] text-[#b4b2a7]">{device.manufacturer || 'Unknown manufacturer'}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[0.75rem] px-2 py-0.5 rounded
                    {device.state === 'connected' ? 'bg-[#d4edda] text-[#155724]' : 'bg-[#f0ede6] text-[#999]'}">
                    {device.state === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                  {#if device.state === 'connected' && reactiveMIDIInput.activeDevice?.id !== device.id}
                    <button
                      type="button"
                      class="text-[0.8rem] text-purple bg-transparent border border-purple rounded px-2 py-0.5 cursor-pointer hover:bg-purple hover:text-white transition-colors"
                      onclick={() => reactiveMIDIInput.selectDevice(device.id)}
                    >Use</button>
                  {:else if reactiveMIDIInput.activeDevice?.id === device.id}
                    <span class="text-[0.75rem] text-purple font-medium">Active</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-[0.85rem] text-[#b4b2a7]">No MIDI devices detected. Connect a USB MIDI keyboard and it will appear here.</p>
        {/if}

        {#if reactiveMIDIInput.error}
          <p class="text-[0.85rem] text-[#dc3545] mt-2">{reactiveMIDIInput.error}</p>
        {/if}
      </div>
    {/if}

    <!-- Daily Practice Goal -->
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
      <p class="text-[0.95rem] font-medium text-navy mb-1">Daily Practice Goal</p>
      <p class="text-[0.85rem] text-[#6b6455] mb-3">Set how many minutes you want to practice each day.</p>
      <div class="flex items-center gap-3">
        <input
          type="range"
          min="5"
          max="120"
          step="5"
          value={dailyGoal}
          oninput={(e) => updateDailyGoal(parseInt((e.target as HTMLInputElement).value))}
          class="settings-range flex-1"
          aria-label="Daily practice goal in minutes"
        />
        <span class="text-[1rem] font-medium text-navy w-16 text-right">{dailyGoal} min</span>
      </div>
    </div>
  </section>

  <!-- Consent Status -->
  <section class="mb-8">
    <h2 class="text-[1.15rem] font-semibold text-navy mb-4">Data Storage Consent</h2>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
      <div class="flex items-start gap-3 mb-4">
        <span class="mt-0.5 shrink-0 flex items-center justify-center" style="width: 1.5rem; height: 1.5rem;">
          {#if consent.hasConsented}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          {:else if consent.hasDeclined}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b4b2a7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          {/if}
        </span>
        <div>
          <p class="text-[0.95rem] font-medium text-navy">
            {#if consent.hasConsented}
              Consent granted
            {:else if consent.hasDeclined}
              Consent declined
            {:else}
              Consent pending
            {/if}
          </p>
          <p class="text-[0.85rem] text-[#6b6455] mt-1">
            {#if consent.hasConsented}
              You have allowed Klavier to store your learning progress locally on this device. Consented on {new Date(consent.data.date).toLocaleDateString()}.
            {:else if consent.hasDeclined}
              You have declined local data storage. Klavier works fully, but your progress is not saved between sessions.
            {:else}
              You haven't made a choice yet. A consent banner will appear to ask your preference.
            {/if}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        {#if consent.hasConsented}
          <button
            class="text-[0.85rem] text-[#dc3545] bg-transparent border border-[#dc3545] rounded-lg px-4 py-2 cursor-pointer hover:bg-[#f8d7da] transition-colors"
            onclick={() => (showRevokeConfirm = true)}
          >Revoke Consent</button>
        {:else if consent.hasDeclined}
          <button
            class="text-[0.85rem] text-white bg-navy rounded-lg px-4 py-2 cursor-pointer border-none hover:opacity-90 transition-opacity"
            onclick={() => consent.accept()}
          >Enable Data Storage</button>
        {/if}
      </div>
    </div>
  </section>

  <!-- Revoke Consent Confirmation -->
  {#if showRevokeConfirm}
    <div class="bg-[#f8d7da] border border-[#dc3545] rounded-lg p-5 mb-8">
      <p class="text-[0.95rem] font-medium text-[#721c24] mb-2">Are you sure?</p>
      <p class="text-[0.9rem] text-[#721c24] mb-4">
        Revoking consent will permanently delete all your stored progress data (completed lessons, quiz scores, streaks, and practice time). This cannot be undone.
      </p>
      <div class="flex gap-3">
        <button
          class="text-[0.85rem] text-white bg-[#dc3545] rounded-lg px-4 py-2 cursor-pointer border-none hover:opacity-90"
          onclick={revokeConsent}
        >Yes, Revoke & Delete</button>
        <button
          class="text-[0.85rem] text-[#6b6455] bg-white rounded-lg px-4 py-2 cursor-pointer border border-[#dad9d4] hover:bg-[#f5f0e8]"
          onclick={() => (showRevokeConfirm = false)}
        >Cancel</button>
      </div>
    </div>
  {/if}

  <!-- Data Export -->
  <section class="mb-8">
    <h2 class="text-[1.15rem] font-semibold text-navy mb-4">Export Your Data</h2>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
      <p class="text-[0.9rem] text-[#6b6455] mb-4">
        Download all data stored by Klavier on this device as a JSON file. This includes your consent preferences, completed lessons, quiz scores, streaks, and practice time.
      </p>
      <button
        class="text-[0.85rem] text-white bg-navy rounded-lg px-4 py-2 cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={exportData}
      >Download My Data (.json)</button>
      {#if exportSuccess}
        <p class="text-[0.85rem] text-[#28a745] mt-2">Data exported successfully.</p>
      {/if}
    </div>
  </section>

  <!-- Delete Data -->
  <section class="mb-8">
    <h2 class="text-[1.15rem] font-semibold text-navy mb-4">Delete Progress Data</h2>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
      <p class="text-[0.9rem] text-[#6b6455] mb-4">
        Permanently delete all your learning progress (completed lessons, quiz scores, streaks, practice time). Your consent preference will be kept. This action cannot be undone.
      </p>
      {#if !showDeleteConfirm}
        <button
          class="text-[0.85rem] text-[#dc3545] bg-transparent border border-[#dc3545] rounded-lg px-4 py-2 cursor-pointer hover:bg-[#f8d7da] transition-colors"
          onclick={() => (showDeleteConfirm = true)}
        >Delete All Progress</button>
      {:else}
        <div class="bg-[#f8d7da] rounded-lg p-4">
          <p class="text-[0.9rem] text-[#721c24] mb-3">This will reset all your progress. Are you sure?</p>
          <div class="flex gap-3">
            <button
              class="text-[0.85rem] text-white bg-[#dc3545] rounded-lg px-4 py-2 cursor-pointer border-none hover:opacity-90"
              onclick={deleteAllData}
            >Yes, Delete Everything</button>
            <button
              class="text-[0.85rem] text-[#6b6455] bg-white rounded-lg px-4 py-2 cursor-pointer border border-[#dad9d4] hover:bg-[#f5f0e8]"
              onclick={() => (showDeleteConfirm = false)}
            >Cancel</button>
          </div>
        </div>
      {/if}
      {#if deleteSuccess}
        <p class="text-[0.85rem] text-[#28a745] mt-2">All progress data has been deleted.</p>
      {/if}
    </div>
  </section>

  <!-- Data Summary -->
  <section class="mb-8">
    <h2 class="text-[1.15rem] font-semibold text-navy mb-4">Currently Stored Data</h2>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
      {#if consent.hasConsented}
        <div class="grid grid-cols-2 gap-4 text-[0.9rem]">
          <div>
            <p class="text-[#b4b2a7] text-[0.8rem]">Lessons completed</p>
            <p class="text-navy font-medium">{progress.data.completedLessons.length} / 19</p>
          </div>
          <div>
            <p class="text-[#b4b2a7] text-[0.8rem]">Quiz scores saved</p>
            <p class="text-navy font-medium">{Object.keys(progress.data.quizScores).length}</p>
          </div>
          <div>
            <p class="text-[#b4b2a7] text-[0.8rem]">Current streak</p>
            <p class="text-navy font-medium">{progress.data.currentStreak} days</p>
          </div>
          <div>
            <p class="text-[#b4b2a7] text-[0.8rem]">Practice time</p>
            <p class="text-navy font-medium">{progress.data.totalPracticeMinutes} minutes</p>
          </div>
          <div>
            <p class="text-[#b4b2a7] text-[0.8rem]">Practice sessions</p>
            <p class="text-navy font-medium">{progress.data.totalSessions}</p>
          </div>
          <div>
            <p class="text-[#b4b2a7] text-[0.8rem]">Best accuracy</p>
            <p class="text-navy font-medium">{progress.overallBestAccuracy}%</p>
          </div>
        </div>
      {:else}
        <p class="text-[0.9rem] text-[#b4b2a7]">No progress data stored (consent not granted or data deleted).</p>
      {/if}
    </div>
  </section>

  <!-- Legal Links -->
  <section class="mb-8">
    <h2 class="text-[1.15rem] font-semibold text-navy mb-4">Legal</h2>
    <div class="flex gap-4">
      <button
        class="text-[0.9rem] text-purple bg-transparent border-none cursor-pointer underline p-0 hover:opacity-80"
        onclick={() => router.navigate('/privacy')}
      >Privacy Policy</button>
      <button
        class="text-[0.9rem] text-purple bg-transparent border-none cursor-pointer underline p-0 hover:opacity-80"
        onclick={() => router.navigate('/terms')}
      >Terms of Service</button>
    </div>
  </section>
</div>
