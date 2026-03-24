<script lang="ts">
  import { inputAdapter, type InputSource } from '../stores/input-adapter.svelte';

  // ── Source definitions ──────────────────────────────────────────────────────
  interface SourceOption {
    id: InputSource;
    label: string;
    icon: string;
    available: boolean;
    statusText: string;
  }

  const sources = $derived<SourceOption[]>([
    {
      id: 'virtual',
      label: 'Virtual',
      icon: '🎹',
      available: true,
      statusText: 'On-screen keyboard',
    },
    {
      id: 'mic',
      label: 'Microphone',
      icon: '🎤',
      available: inputAdapter.micAvailable,
      statusText: inputAdapter.micListening
        ? 'Listening'
        : inputAdapter.micPermission === 'denied'
          ? 'Blocked'
          : inputAdapter.micPermission === 'granted'
            ? 'Ready'
            : 'Tap to enable',
    },
    {
      id: 'midi',
      label: 'MIDI',
      icon: '🎵',
      available: inputAdapter.midiAvailable,
      statusText: inputAdapter.midiConnected
        ? inputAdapter.midiDeviceName || 'Connected'
        : 'No device',
    },
  ]);

  async function selectSource(source: InputSource) {
    await inputAdapter.setSource(source);
  }
</script>

<div class="flex items-center gap-2">
  {#each sources as source}
    {#if source.available}
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          {inputAdapter.activeSource === source.id
            ? 'bg-navy text-white'
            : 'bg-white text-navy border border-[#dad9d4] hover:border-purple'}"
        onclick={() => selectSource(source.id)}
        disabled={!source.available}
        aria-label="Use {source.label} input"
        aria-pressed={inputAdapter.activeSource === source.id}
      >
        <span aria-hidden="true">{source.icon}</span>
        <span>{source.label}</span>

        <!-- Status indicator -->
        {#if inputAdapter.activeSource === source.id && inputAdapter.isListening && source.id !== 'virtual'}
          <span
            class="w-2 h-2 rounded-full bg-green-400 animate-pulse"
            aria-label="Active"
          ></span>
        {/if}
      </button>
    {/if}
  {/each}

  <!-- Error display -->
  {#if inputAdapter.error}
    <span class="text-sm text-red-600 ml-2">{inputAdapter.error}</span>
  {/if}
</div>
