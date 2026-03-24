<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LessonMeta } from '../data/lessons';
  import { LESSONS } from '../data/lessons';
  import { progress } from '../stores/progress.svelte';
  import { consent } from '../stores/consent.svelte';
  import { router } from '../router.svelte';

  let { lesson, children }: { lesson: LessonMeta; children: Snippet } = $props();

  const isCompleted = $derived(progress.isLessonCompleted(lesson.id));
  const nextLesson = $derived(LESSONS.find(l => l.id === lesson.id + 1));
  const prevLesson = $derived(LESSONS.find(l => l.id === lesson.id - 1));

  let showConsentPrompt = $state(false);

  function markComplete() {
    if (!consent.hasConsented) {
      showConsentPrompt = true;
      return;
    }
    progress.completeLesson(lesson.id);
  }

  function markIncomplete() {
    progress.uncompleteLesson(lesson.id);
  }

  function acceptAndComplete() {
    consent.accept();
    showConsentPrompt = false;
    progress.completeLesson(lesson.id);
  }

  function goNext() {
    if (nextLesson) router.navigate(`/lesson-${nextLesson.id}`);
  }

  function goPrev() {
    if (prevLesson) router.navigate(`/lesson-${prevLesson.id}`);
  }
</script>

<div class="max-w-3xl mx-auto px-6 py-8">
  <!-- Breadcrumb -->
  <p class="text-[0.8rem] text-[#b4b2a7] mb-2">
    Module {lesson.module}: {lesson.moduleName}
  </p>

  <!-- Title -->
  <h1 class="text-[1.6rem] font-bold text-navy mb-2 leading-tight">
    Lesson {lesson.id}: {lesson.title}
  </h1>
  <p class="text-[1.05rem] text-[#6b6455] mb-6">{lesson.subtitle}</p>

  <!-- Objectives -->
  <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-8">
    <h2 class="text-[0.85rem] font-semibold uppercase tracking-wider text-[#b4b2a7] mb-3">What you'll learn</h2>
    <ul class="space-y-1.5">
      {#each lesson.objectives as obj}
        <li class="text-[0.95rem] text-[#444] flex items-start gap-2">
          <span class="text-purple mt-0.5 shrink-0">•</span>
          <span>{obj}</span>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Lesson content (from children) -->
  {@render children()}

  <!-- Consent prompt (shown when user tries to save progress without consent) -->
  {#if showConsentPrompt}
    <div class="mt-8 bg-[#fdf6ee] border border-purple rounded-lg p-5">
      <p class="text-[0.95rem] font-medium text-navy mb-1">Enable progress tracking?</p>
      <p class="text-[0.85rem] text-[#6b6455] leading-relaxed mb-4">
        To save your progress, Klavier needs to store data locally on this device. No data is sent to any server.
      </p>
      <div class="flex gap-3">
        <button
          class="text-[0.85rem] text-white bg-navy rounded-lg px-5 py-2.5 cursor-pointer border-none hover:opacity-90 transition-opacity"
          onclick={acceptAndComplete}
        >Enable & Mark Complete</button>
        <button
          class="text-[0.85rem] text-[#6b6455] bg-transparent border border-[#dad9d4] rounded-lg px-4 py-2.5 cursor-pointer hover:bg-[#f5f0e8] transition-colors"
          onclick={() => (showConsentPrompt = false)}
        >Not now</button>
      </div>
    </div>
  {/if}

  <!-- Bottom nav -->
  <div class="mt-12 pt-6 border-t border-[#e8e6e0] flex items-center justify-center gap-3">
    {#if !isCompleted}
      <button
        class="bg-navy text-white px-5 py-2.5 rounded-lg text-[0.9rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={markComplete}
      >Mark as Complete</button>
    {:else}
      <button
        class="text-[0.9rem] text-correct font-medium flex items-center gap-1.5 bg-transparent border border-correct rounded-lg px-4 py-2 cursor-pointer hover:bg-wrong-bg hover:text-wrong hover:border-wrong transition-all"
        onclick={markIncomplete}
        title="Click to mark as incomplete"
      >
        ✓ Completed
      </button>
    {/if}
    {#if nextLesson}
      <button
        class="bg-purple text-white px-5 py-2.5 rounded-lg text-[0.9rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
        onclick={goNext}
      >Next Lesson →</button>
    {/if}
  </div>
</div>
