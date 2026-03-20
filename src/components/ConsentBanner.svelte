<script lang="ts">
  import { consent } from '../stores/consent.svelte';
  import { router } from '../router.svelte';
</script>

{#if consent.isPending}
  <div class="fixed bottom-0 left-0 right-0 z-[300] bg-white border-t border-[#dad9d4] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
    <div class="max-w-3xl mx-auto px-6 py-5">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex-1">
          <p class="text-[0.95rem] font-semibold text-navy mb-1">Your privacy matters</p>
          <p class="text-[0.85rem] text-[#6b6455] leading-relaxed">
            Klavier would like to save your learning progress locally on this device using browser storage. No data is sent to any server. You can use the app without this — your progress just won't be saved between sessions.
            <button
              class="text-purple underline bg-transparent border-none cursor-pointer p-0 text-[0.85rem]"
              onclick={() => router.navigate('/privacy')}
            >Read our Privacy Policy</button>
          </p>
        </div>
        <div class="flex gap-3 shrink-0">
          <button
            class="text-[0.85rem] text-[#6b6455] bg-transparent border border-[#dad9d4] rounded-lg px-5 py-2.5 cursor-pointer hover:bg-[#f5f0e8] transition-colors"
            onclick={() => consent.decline()}
          >Decline</button>
          <button
            class="text-[0.85rem] text-white bg-navy rounded-lg px-5 py-2.5 cursor-pointer border-none hover:opacity-90 transition-opacity"
            onclick={() => consent.accept()}
          >Accept</button>
        </div>
      </div>
    </div>
  </div>
{/if}
