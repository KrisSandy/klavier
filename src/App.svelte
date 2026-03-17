<script lang="ts">
  import { router } from './router.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Home from './pages/Home.svelte';
  import Practice from './pages/Practice.svelte';
  import Lesson1 from './lessons/Lesson1.svelte';
  import Lesson2 from './lessons/Lesson2.svelte';
  import Lesson3 from './lessons/Lesson3.svelte';
  import Lesson4 from './lessons/Lesson4.svelte';
  import Lesson5 from './lessons/Lesson5.svelte';
  import Lesson6 from './lessons/Lesson6.svelte';
  import Lesson7 from './lessons/Lesson7.svelte';
  import Lesson8 from './lessons/Lesson8.svelte';
  import Lesson9 from './lessons/Lesson9.svelte';
  import Lesson10 from './lessons/Lesson10.svelte';
  import Lesson11 from './lessons/Lesson11.svelte';
  import Lesson12 from './lessons/Lesson12.svelte';
  import Lesson13 from './lessons/Lesson13.svelte';
  import Lesson14 from './lessons/Lesson14.svelte';
  import Lesson15 from './lessons/Lesson15.svelte';
  import Lesson16 from './lessons/Lesson16.svelte';
  import Lesson17 from './lessons/Lesson17.svelte';
  import Lesson18 from './lessons/Lesson18.svelte';
</script>

<header
  class="sticky top-0 z-[100] bg-[#faf9f5] border-b border-[#dad9d4] px-8 py-[0.85rem] flex items-center shrink-0"
>
  <a
    class="text-[1.2rem] font-extrabold text-navy no-underline tracking-[-.02em] hover:text-purple transition-colors"
    href="#/"
  >Klavier</a>
</header>

<div class="flex-1 flex min-h-0 max-sm:flex-col">
  <Sidebar />

  <main class="flex-1 overflow-y-auto">
    {#if router.isHome}
      <Home />
    {:else if router.isPractice}
      <Practice />
    {:else if router.lessonId === 1}
      <Lesson1 />
    {:else if router.lessonId === 2}
      <Lesson2 />
    {:else if router.lessonId === 3}
      <Lesson3 />
    {:else if router.lessonId === 4}
      <Lesson4 />
    {:else if router.lessonId === 5}
      <Lesson5 />
    {:else if router.lessonId === 6}
      <Lesson6 />
    {:else if router.lessonId === 7}
      <Lesson7 />
    {:else if router.lessonId === 8}
      <Lesson8 />
    {:else if router.lessonId === 9}
      <Lesson9 />
    {:else if router.lessonId === 10}
      <Lesson10 />
    {:else if router.lessonId === 11}
      <Lesson11 />
    {:else if router.lessonId === 12}
      <Lesson12 />
    {:else if router.lessonId === 13}
      <Lesson13 />
    {:else if router.lessonId === 14}
      <Lesson14 />
    {:else if router.lessonId === 15}
      <Lesson15 />
    {:else if router.lessonId === 16}
      <Lesson16 />
    {:else if router.lessonId === 17}
      <Lesson17 />
    {:else if router.lessonId === 18}
      <Lesson18 />
    {:else}
      <div class="max-w-3xl mx-auto px-6 py-12 text-center">
        <h1 class="text-[1.4rem] font-bold text-navy mb-3">Page not found</h1>
        <p class="text-[#6b6455] mb-4">The page you're looking for doesn't exist.</p>
        <button
          class="bg-navy text-white px-6 py-2.5 rounded-lg text-[0.95rem] font-medium cursor-pointer border-none hover:opacity-90"
          onclick={() => router.navigate('/')}
        >Go Home</button>
      </div>
    {/if}
  </main>
</div>

<footer class="text-center py-4 text-[0.75rem] text-[#b4b2a7] border-t border-[#e8e6e0] mt-auto shrink-0">
  Klavier — Learn piano at your own pace
</footer>
