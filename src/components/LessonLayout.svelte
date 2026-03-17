<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LessonMeta } from '../data/lessons';
  import { LESSONS } from '../data/lessons';
  import { progress } from '../stores/progress.svelte';
  import { router } from '../router.svelte';

  let { lesson, children }: { lesson: LessonMeta; children: Snippet } = $props();

  const isCompleted = $derived(progress.isLessonCompleted(lesson.id));
  const nextLesson = $derived(LESSONS.find(l => l.id === lesson.id + 1));
  const prevLesson = $derived(LESSONS.find(l => l.id === lesson.id - 1));

  function markComplete() {
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
    <h3 class="text-[0.85rem] font-semibold uppercase tracking-wider text-[#b4b2a7] mb-3">What you'll learn</h3>
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

  <!-- Bottom nav -->
  <div class="flex items-center justify-between mt-12 pt-6 border-t border-[#e8e6e0]">
    <div>
      {#if prevLesson}
        <button
          class="text-[0.9rem] text-[#6b6455] hover:text-navy cursor-pointer bg-transparent border-none transition-colors"
          onclick={goPrev}
        >← Lesson {prevLesson.id}: {prevLesson.title}</button>
      {/if}
    </div>
    <div class="flex items-center gap-4">
      {#if !isCompleted}
        <button
          class="bg-navy text-white px-5 py-2.5 rounded-lg text-[0.95rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
          onclick={markComplete}
        >Mark as Complete</button>
      {:else}
        <span class="text-[0.9rem] text-correct font-medium flex items-center gap-1.5">
          ✓ Completed
        </span>
      {/if}
      {#if nextLesson}
        <button
          class="bg-purple text-white px-5 py-2.5 rounded-lg text-[0.95rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
          onclick={goNext}
        >Next: {nextLesson.title} →</button>
      {/if}
    </div>
  </div>
</div>
