<script lang="ts">
  import { untrack } from 'svelte';

  let { lessonId }: { lessonId: number } = $props();

  // Map lesson IDs to dynamic imports — Vite splits each into its own chunk
  const loaders: Record<number, () => Promise<{ default: any }>> = {
    1: () => import('../lessons/Lesson1.svelte'),
    2: () => import('../lessons/Lesson2.svelte'),
    3: () => import('../lessons/Lesson3.svelte'),
    4: () => import('../lessons/Lesson4.svelte'),
    5: () => import('../lessons/Lesson5.svelte'),
    6: () => import('../lessons/Lesson6.svelte'),
    7: () => import('../lessons/Lesson7.svelte'),
    8: () => import('../lessons/Lesson8.svelte'),
    9: () => import('../lessons/Lesson9.svelte'),
    10: () => import('../lessons/Lesson10.svelte'),
    11: () => import('../lessons/Lesson11.svelte'),
    12: () => import('../lessons/Lesson12.svelte'),
    13: () => import('../lessons/Lesson13.svelte'),
    14: () => import('../lessons/Lesson14.svelte'),
    15: () => import('../lessons/Lesson15.svelte'),
    16: () => import('../lessons/Lesson16.svelte'),
    17: () => import('../lessons/Lesson17.svelte'),
    18: () => import('../lessons/Lesson18.svelte'),
    19: () => import('../lessons/Lesson19.svelte'),
  };

  // Re-derive the promise whenever lessonId changes
  let lessonPromise = $derived(
    loaders[lessonId]
      ? loaders[lessonId]()
      : Promise.reject(new Error(`Lesson ${lessonId} not found`))
  );
</script>

{#await lessonPromise}
  <!-- Loading state -->
  <div class="max-w-3xl mx-auto px-6 py-20 text-center">
    <div class="inline-block w-8 h-8 border-3 border-[#dad9d4] border-t-purple rounded-full animate-spin"></div>
    <p class="mt-4 text-[0.9rem] text-[#6b6455]">Loading lesson…</p>
  </div>
{:then module}
  {@const Lesson = module.default}
  <Lesson />
{:catch error}
  <!-- Error state -->
  <div class="max-w-3xl mx-auto px-6 py-16 text-center">
    <div class="text-[2.5rem] mb-4">⚠️</div>
    <h2 class="text-[1.3rem] font-bold text-navy mb-2">Failed to load lesson</h2>
    <p class="text-[0.9rem] text-[#6b6455] mb-6">Something went wrong loading lesson {lessonId}. This might be a network issue.</p>
    <button
      class="bg-navy text-white px-6 py-2.5 rounded-lg text-[0.95rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
      onclick={() => window.location.reload()}
    >Reload Page</button>
  </div>
{/await}
