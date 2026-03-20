<script lang="ts">
  import { router } from './router.svelte';
  import { sidebar } from './stores/sidebar.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import ConsentBanner from './components/ConsentBanner.svelte';
  import Home from './pages/Home.svelte';
  import Practice from './pages/Practice.svelte';
  import Songs from './pages/Songs.svelte';
  import PrivacyPolicy from './pages/PrivacyPolicy.svelte';
  import TermsOfService from './pages/TermsOfService.svelte';
  import Settings from './pages/Settings.svelte';
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
  class="sticky top-0 z-[100] bg-[#faf9f5] border-b border-[#dad9d4] px-8 py-[0.85rem] flex items-center shrink-0 gap-3"
>
  <!-- Hamburger (mobile only) -->
  <button
    class="w-8 h-8 items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-navy hover:bg-[#f0ede6] transition-colors hidden max-sm:flex"
    onclick={() => sidebar.toggle()}
    aria-label="Open navigation"
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="3" y1="5" x2="17" y2="5" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="15" x2="17" y2="15" />
    </svg>
  </button>
  <a
    class="text-[1.2rem] font-extrabold text-navy no-underline tracking-[-.02em] hover:text-purple transition-colors"
    href="#/"
  >Klavier</a>
</header>

<div class="flex-1 flex min-h-0">
  <Sidebar />

  <main class="flex-1 overflow-y-auto">
    {#if router.isHome}
      <Home />
    {:else if router.isPractice}
      <Practice />
    {:else if router.isSongs}
      <Songs />
    {:else if router.isPrivacy}
      <PrivacyPolicy />
    {:else if router.isTerms}
      <TermsOfService />
    {:else if router.isSettings}
      <Settings />
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
      <div class="max-w-3xl mx-auto px-6 py-16 text-center">
        <div class="text-[3rem] mb-4">🎹</div>
        <h1 class="text-[1.6rem] font-bold text-navy mb-3">Page not found</h1>
        <p class="text-[1rem] text-[#6b6455] mb-2">
          The page <code class="text-[0.85rem] bg-[#f0ede6] px-2 py-0.5 rounded text-navy">#{router.current}</code> doesn't exist.
        </p>
        <p class="text-[0.9rem] text-[#b4b2a7] mb-8">It may have been moved or the link might be incorrect.</p>
        <div class="flex gap-3 justify-center mb-10">
          <button
            class="bg-navy text-white px-6 py-2.5 rounded-lg text-[0.95rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
            onclick={() => router.navigate('/')}
          >Go Home</button>
          <button
            class="bg-white text-navy px-6 py-2.5 rounded-lg text-[0.95rem] font-medium cursor-pointer border-2 border-[#dad9d4] hover:border-purple transition-colors"
            onclick={() => router.navigate('/practice')}
          >Free Practice</button>
        </div>
        <div class="border-t border-[#e8e6e0] pt-6">
          <p class="text-[0.8rem] text-[#b4b2a7] mb-3">Or jump to a section:</p>
          <div class="flex gap-2 justify-center flex-wrap">
            <button class="text-[0.8rem] text-[#6b6455] bg-[#f0ede6] border-none rounded-md px-3 py-1.5 cursor-pointer hover:bg-[#e8e3d9] transition-colors" onclick={() => router.navigate('/lesson-1')}>Lesson 1</button>
            <button class="text-[0.8rem] text-[#6b6455] bg-[#f0ede6] border-none rounded-md px-3 py-1.5 cursor-pointer hover:bg-[#e8e3d9] transition-colors" onclick={() => router.navigate('/songs')}>Songs</button>
            <button class="text-[0.8rem] text-[#6b6455] bg-[#f0ede6] border-none rounded-md px-3 py-1.5 cursor-pointer hover:bg-[#e8e3d9] transition-colors" onclick={() => router.navigate('/settings')}>Settings</button>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<footer class="text-center py-4 text-[0.75rem] text-[#b4b2a7] border-t border-[#e8e6e0] mt-auto shrink-0">
  <span>Klavier — Learn piano at your own pace</span>
  <div class="mt-1.5 flex items-center justify-center gap-3">
    <button
      class="text-[0.7rem] text-[#b4b2a7] bg-transparent border-none cursor-pointer p-0 hover:text-navy transition-colors underline"
      onclick={() => router.navigate('/privacy')}
    >Privacy</button>
    <span class="text-[#dad9d4]">·</span>
    <button
      class="text-[0.7rem] text-[#b4b2a7] bg-transparent border-none cursor-pointer p-0 hover:text-navy transition-colors underline"
      onclick={() => router.navigate('/terms')}
    >Terms</button>
    <span class="text-[#dad9d4]">·</span>
    <button
      class="text-[0.7rem] text-[#b4b2a7] bg-transparent border-none cursor-pointer p-0 hover:text-navy transition-colors underline"
      onclick={() => router.navigate('/settings')}
    >Settings</button>
  </div>
</footer>

<ConsentBanner />
