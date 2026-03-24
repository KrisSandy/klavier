<script lang="ts">
  import { MODULES, LESSONS } from '../data/lessons';
  import { progress } from '../stores/progress.svelte';
  import { router } from '../router.svelte';
  import { sidebar } from '../stores/sidebar.svelte';

  let asideEl: HTMLElement | undefined = $state(undefined);

  function navigateTo(path: string) {
    router.navigate(path);
    sidebar.close();
  }

  // Focus trap: when mobile drawer opens, trap Tab within it; Escape closes it
  function handleKeydown(e: KeyboardEvent) {
    if (!sidebar.open || !asideEl) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      sidebar.close();
      // Return focus to hamburger button
      const hamburger = document.querySelector('[aria-label="Open navigation"]') as HTMLElement | null;
      hamburger?.focus();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = asideEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // When drawer opens on mobile, focus the close button
  $effect(() => {
    if (sidebar.open && asideEl) {
      requestAnimationFrame(() => {
        const closeBtn = asideEl?.querySelector('[aria-label="Close navigation"]') as HTMLElement | null;
        closeBtn?.focus();
      });
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- Backdrop (mobile only) -->
{#if sidebar.open}
  <div
    class="fixed inset-0 bg-black/40 z-[200] sm:hidden"
    style="transition: opacity 0.2s ease;"
    onclick={() => sidebar.close()}
    onkeydown={(e) => { if (e.key === 'Escape') sidebar.close(); }}
    role="presentation"
  ></div>
{/if}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- Sidebar -->
<aside
  bind:this={asideEl}
  onkeydown={handleKeydown}
  role="navigation"
  aria-label="Course navigation"
  class="
    sm:sticky sm:top-(--header-height) sm:w-60 sm:h-[calc(100vh-var(--header-height))]
    sm:overflow-y-auto sm:bg-[#faf9f5] sm:border-r sm:border-[#dad9d4] sm:shrink-0 sm:flex sm:flex-col
    max-sm:fixed max-sm:top-0 max-sm:left-0 max-sm:bottom-0 max-sm:w-72 max-sm:z-[210]
    max-sm:bg-[#faf9f5] max-sm:shadow-2xl max-sm:overflow-y-auto max-sm:flex max-sm:flex-col
  "
  style="
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    {typeof window !== 'undefined' ? '' : ''}
  "
  class:max-sm:-translate-x-full={!sidebar.open}
  class:max-sm:translate-x-0={sidebar.open}
>
  <!-- Mobile drawer header -->
  <div class="flex items-center justify-between px-5 py-4 border-b border-[#dad9d4] sm:hidden">
    <span class="text-[1rem] font-extrabold text-navy tracking-[-.02em]">Klavier</span>
    <button
      class="w-8 h-8 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-[#6b6455] hover:bg-[#f0ede6] transition-colors"
      onclick={() => sidebar.close()}
      aria-label="Close navigation"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="4" y1="4" x2="14" y2="14" />
        <line x1="14" y1="4" x2="4" y2="14" />
      </svg>
    </button>
  </div>

  <nav class="py-6 flex flex-col flex-1">
    <p class="text-[0.7rem] font-bold uppercase tracking-widest text-[#b4b2a7] px-5 mb-2">Course</p>

    {#each MODULES as mod}
      <p class="text-[0.75rem] font-semibold uppercase tracking-wider text-navy px-5 mt-4 mb-1">
        {mod.name}
      </p>
      {#each LESSONS.filter(l => l.module === mod.id) as lesson}
        {@const isActive = router.lessonId === lesson.id}
        {@const isCompleted = progress.isLessonCompleted(lesson.id)}
        <button
          class="flex items-center gap-[0.6rem] py-[0.65rem] px-5 bg-transparent cursor-pointer text-[0.9rem] text-left leading-[1.4] transition-colors duration-120 w-full hover:bg-[#f5f0e8] hover:text-navy border-none"
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
    <div class="border-t border-[#dad9d4] my-4 mx-5"></div>

    <!-- Practice link -->
    <button
      class="flex items-center gap-[0.6rem] py-[0.65rem] px-5 bg-transparent cursor-pointer text-[0.9rem] text-left leading-[1.4] transition-colors duration-120 w-full hover:bg-[#f5f0e8] hover:text-navy border-none"
      style="border-left: 3px solid {router.isPractice ? '#ce7e4f' : 'transparent'}; color: {router.isPractice ? '#3d3929' : '#6b6455'}; font-weight: {router.isPractice ? '600' : '400'};"
      onclick={() => navigateTo('/practice')}
    >
      <span class="text-[0.8rem]" style="width: 1.2rem; text-align: center;">🎹</span>
      <span>Practice</span>
    </button>

    <!-- Songs link -->
    <button
      class="flex items-center gap-[0.6rem] py-[0.65rem] px-5 bg-transparent cursor-pointer text-[0.9rem] text-left leading-[1.4] transition-colors duration-120 w-full hover:bg-[#f5f0e8] hover:text-navy border-none"
      style="border-left: 3px solid {router.isSongs ? '#ce7e4f' : 'transparent'}; color: {router.isSongs ? '#3d3929' : '#6b6455'}; font-weight: {router.isSongs ? '600' : '400'};"
      onclick={() => navigateTo('/songs')}
    >
      <span class="text-[0.8rem]" style="width: 1.2rem; text-align: center;">🎵</span>
      <span>Songs</span>
    </button>

    <!-- Spacer to push settings to bottom -->
    <div class="flex-1"></div>

    <!-- Divider -->
    <div class="border-t border-[#dad9d4] my-2 mx-5"></div>

    <!-- Settings link -->
    <button
      class="flex items-center gap-[0.6rem] py-[0.65rem] px-5 bg-transparent cursor-pointer text-[0.9rem] text-left leading-[1.4] transition-colors duration-120 w-full hover:bg-[#f5f0e8] hover:text-navy border-none mb-2"
      style="border-left: 3px solid {router.isSettings ? '#ce7e4f' : 'transparent'}; color: {router.isSettings ? '#3d3929' : '#6b6455'}; font-weight: {router.isSettings ? '600' : '400'};"
      onclick={() => navigateTo('/settings')}
    >
      <span class="text-[0.8rem]" style="width: 1.2rem; text-align: center;">⚙</span>
      <span>Settings</span>
    </button>
  </nav>
</aside>
