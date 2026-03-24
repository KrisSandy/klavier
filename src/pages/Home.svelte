<script lang="ts">
  import { MODULES, LESSONS } from '../data/lessons';
  import { progress } from '../stores/progress.svelte';
  import { router } from '../router.svelte';

  const nextLesson = $derived(
    LESSONS.find(l => !progress.isLessonCompleted(l.id)) ?? LESSONS[0]
  );
</script>

<div class="max-w-3xl mx-auto px-6 py-8">
  <!-- Hero -->
  <div class="mb-10">
    <h1 class="text-[2rem] font-bold text-navy mb-2">Welcome to Klavier</h1>
    <p class="text-[1.1rem] text-[#6b6455] leading-relaxed">
      A complete beginner's guide to playing the piano. Work through the lessons at your own pace, practice with the virtual keyboard, and track your progress along the way.
    </p>
  </div>

  <!-- Progress Stats -->
  <div class="grid grid-cols-3 gap-4 mb-10">
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-4 text-center">
      <p class="text-[1.8rem] font-bold text-navy">{progress.data.completedLessons.length}<span class="text-[1rem] text-[#b4b2a7] font-normal">/{LESSONS.length}</span></p>
      <p class="text-[0.8rem] text-[#999] mt-1">Lessons Complete</p>
    </div>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-4 text-center">
      <p class="text-[1.8rem] font-bold text-purple">{progress.data.currentStreak}</p>
      <p class="text-[0.8rem] text-[#999] mt-1">Day Streak</p>
    </div>
    <div class="bg-white rounded-lg border border-[#e8e6e0] p-4 text-center">
      <p class="text-[1.8rem] font-bold text-navy">{progress.completionPercent}%</p>
      <p class="text-[0.8rem] text-[#999] mt-1">Course Progress</p>
    </div>
  </div>

  <!-- Practice Stats -->
  {#if progress.data.totalSessions > 0}
    <div class="grid grid-cols-3 gap-4 mb-10">
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4 text-center">
        <p class="text-[1.8rem] font-bold text-navy">{progress.practiceSessionsThisWeek}</p>
        <p class="text-[0.8rem] text-[#999] mt-1">Sessions This Week</p>
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4 text-center">
        <p class="text-[1.8rem] font-bold text-correct">{progress.overallBestAccuracy}%</p>
        <p class="text-[0.8rem] text-[#999] mt-1">Best Accuracy</p>
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-4 text-center">
        <p class="text-[1.8rem] font-bold text-navy">{progress.data.totalSessions}</p>
        <p class="text-[0.8rem] text-[#999] mt-1">Total Sessions</p>
      </div>
    </div>
  {/if}

  <!-- Quick Actions -->
  <div class="flex gap-3 mb-10">
    <button
      class="flex-1 bg-navy text-white py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
      onclick={() => router.navigate(`/lesson-${nextLesson.id}`)}
    >
      {progress.data.completedLessons.length === 0 ? 'Start Learning' : 'Continue Learning'}
    </button>
    <button
      class="flex-1 bg-white text-navy py-3 rounded-lg text-[1rem] font-medium cursor-pointer border-2 border-[#dad9d4] hover:border-purple transition-colors"
      onclick={() => router.navigate('/practice')}
    >
      Free Practice
    </button>
  </div>

  <!-- Module Cards -->
  {#each MODULES as mod}
    {@const moduleLessons = LESSONS.filter(l => l.module === mod.id)}
    {@const completedCount = moduleLessons.filter(l => progress.isLessonCompleted(l.id)).length}

    <div class="bg-white rounded-lg border border-[#e8e6e0] p-6 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-[1.1rem] font-bold text-navy">Module {mod.id}: {mod.name}</h2>
        <span class="text-[0.8rem] text-[#999]">{completedCount}/{moduleLessons.length} complete</span>
      </div>

      <!-- Progress bar -->
      <div class="w-full h-1.5 bg-[#f0ede6] rounded-full mb-4 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-300"
          style="width: {(completedCount / moduleLessons.length) * 100}%; background: {completedCount === moduleLessons.length ? '#28a745' : '#ce7e4f'};"
        ></div>
      </div>

      <div class="space-y-2">
        {#each moduleLessons as lesson}
          {@const isCompleted = progress.isLessonCompleted(lesson.id)}
          <button
            class="w-full flex items-center gap-3 py-2.5 px-3 rounded-md text-left cursor-pointer border-none bg-transparent hover:bg-[#faf9f5] transition-colors"
            onclick={() => router.navigate(`/lesson-${lesson.id}`)}
          >
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-[0.75rem] font-medium shrink-0"
              style="background: {isCompleted ? '#d4edda' : '#f0ede6'}; color: {isCompleted ? '#155724' : '#999'};"
            >
              {#if isCompleted}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#155724" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              {:else}
                {lesson.id}
              {/if}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[0.95rem] text-navy font-medium truncate">{lesson.title}</p>
              <p class="text-[0.8rem] text-[#999] truncate">{lesson.subtitle}</p>
            </div>
            <div class="flex gap-1.5 shrink-0">
              {#if lesson.hasQuiz}
                <span class="text-[0.65rem] bg-[#f0ede6] text-[#999] px-1.5 py-0.5 rounded">Quiz</span>
              {/if}
              {#if lesson.hasSong}
                <span class="text-[0.65rem] bg-[#f0ede6] text-[#999] px-1.5 py-0.5 rounded">Song</span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>
