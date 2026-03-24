<script lang="ts">
  import { router } from '../router.svelte';
  import { progress } from '../stores/progress.svelte';
  import { consent } from '../stores/consent.svelte';

  let showDeleteConfirm = $state(false);
  let showRevokeConfirm = $state(false);
  let exportSuccess = $state(false);
  let deleteSuccess = $state(false);

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
  <p class="text-[0.85rem] text-[#b4b2a7] mb-8">Manage your data and privacy preferences</p>

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
            <p class="text-navy font-medium">{progress.data.completedLessons.length} / 18</p>
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
