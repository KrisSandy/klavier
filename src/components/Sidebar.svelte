<script lang="ts">
  import { MODULES, LESSONS } from '../data/lessons';
  import { progress } from '../stores/progress.svelte';
  import { router } from '../router.svelte';

  function navigateTo(path: string) {
    router.navigate(path);
  }
</script>

<aside class="sticky top-(--header-height) w-60 h-[calc(100vh-var(--header-height))] overflow-y-auto bg-[#faf9f5] border-r border-[#dad9d4] shrink-0 flex flex-col max-sm:static max-sm:w-full max-sm:h-auto max-sm:border-r-0 max-sm:border-b">
  <nav class="py-6 flex flex-col max-sm:flex-row max-sm:p-0 max-sm:overflow-x-auto">
    <p class="text-[0.7rem] font-bold uppercase tracking-widest text-[#b4b2a7] px-5 mb-2 max-sm:hidden">Course</p>

    {#each MODULES as mod}
      <p class="text-[0.75rem] font-semibold uppercase tracking-wider text-navy px-5 mt-4 mb-1 max-sm:hidden">
        {mod.name}
      </p>
      {#each LESSONS.filter(l => l.module === mod.id) as lesson}
        {@const isActive = router.lessonId === lesson.id}
        {@const isCompleted = progress.isLessonCompleted(lesson.id)}
        <button
          class="flex items-center gap-[0.6rem] py-[0.65rem] px-5 bg-transparent cursor-pointer text-[0.9rem] text-left leading-[1.4] transition-colors duration-120 w-full hover:bg-[#f5f0e8] hover:text-navy border-none max-sm:whitespace-nowrap max-sm:px-4"
          style="border-left: 3px solid {isActive ? '#ce7e4f' : 'transparent'}; color: {isActive ? '#3d3929' : '#6b6455'}; font-weight: {isActive ? '600' : '400'}; background: {isActive ? '#f5f0e8' : 'transparent'};"
          onclick={() => navigateTo(`/lesson-${lesson.id}`)}
        >
          <span class="text-[0.8rem] shrink-0" style="width: 1.2rem; text-align: center;">
            {#if isCompleted}
              <span style="color: #28a745;">✓</span>
            {:else}
              <span style="color: #b4b2a7;">{lesson.id}</span>
            {/if}
          </span>
          <span>{lesson.title}</span>
        </button>
      {/each}
    {/each}

    <!-- Divider -->
    <div class="border-t border-[#dad9d4] my-4 mx-5 max-sm:hidden"></div>

    <!-- Practice link -->
    <button
      class="flex items-center gap-[0.6rem] py-[0.65rem] px-5 bg-transparent cursor-pointer text-[0.9rem] text-left leading-[1.4] transition-colors duration-120 w-full hover:bg-[#f5f0e8] hover:text-navy border-none max-sm:whitespace-nowrap max-sm:px-4"
      style="border-left: 3px solid {router.isPractice ? '#ce7e4f' : 'transparent'}; color: {router.isPractice ? '#3d3929' : '#6b6455'}; font-weight: {router.isPractice ? '600' : '400'};"
      onclick={() => navigateTo('/practice')}
    >
      <span class="text-[0.8rem]" style="width: 1.2rem; text-align: center;">🎹</span>
      <span>Practice</span>
    </button>
  </nav>
</aside>
