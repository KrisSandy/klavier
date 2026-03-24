import { describe, it, expect, beforeEach } from 'vitest';

// The router uses $state which requires the Svelte compiler.
// We test it by importing through Vite's transform pipeline (vitest handles this).

describe('Router', () => {
  beforeEach(() => {
    // Reset hash before each test
    window.location.hash = '';
  });

  it('can be imported', async () => {
    const { router } = await import('../router.svelte');
    expect(router).toBeDefined();
  });

  it('isHome is true for empty hash', async () => {
    window.location.hash = '';
    const { router } = await import('../router.svelte');
    // Manually trigger the state since hash change event may not fire in jsdom
    router.navigate('/');
    expect(router.isHome).toBe(true);
  });

  it('lessonId parses lesson routes correctly', async () => {
    const { router } = await import('../router.svelte');
    window.location.hash = '/lesson-5';
    // Manually set current to simulate hashchange
    (router as any).current = '/lesson-5';
    expect(router.lessonId).toBe(5);
  });

  it('lessonId returns null for out-of-range values', async () => {
    const { router } = await import('../router.svelte');
    (router as any).current = '/lesson-0';
    expect(router.lessonId).toBeNull();

    (router as any).current = '/lesson-20';
    expect(router.lessonId).toBeNull();

    (router as any).current = '/lesson-99';
    expect(router.lessonId).toBeNull();
  });

  it('lessonId returns null for non-lesson routes', async () => {
    const { router } = await import('../router.svelte');
    (router as any).current = '/practice';
    expect(router.lessonId).toBeNull();

    (router as any).current = '/songs';
    expect(router.lessonId).toBeNull();
  });

  it('isPractice works', async () => {
    const { router } = await import('../router.svelte');
    (router as any).current = '/practice';
    expect(router.isPractice).toBe(true);
    expect(router.isHome).toBe(false);
  });

  it('isSongs works', async () => {
    const { router } = await import('../router.svelte');
    (router as any).current = '/songs';
    expect(router.isSongs).toBe(true);
  });

  it('isPrivacy works', async () => {
    const { router } = await import('../router.svelte');
    (router as any).current = '/privacy';
    expect(router.isPrivacy).toBe(true);
  });

  it('isTerms works', async () => {
    const { router } = await import('../router.svelte');
    (router as any).current = '/terms';
    expect(router.isTerms).toBe(true);
  });

  it('isSettings works', async () => {
    const { router } = await import('../router.svelte');
    (router as any).current = '/settings';
    expect(router.isSettings).toBe(true);
  });

  it('lessonSlug returns correct slug', async () => {
    const { router } = await import('../router.svelte');
    (router as any).current = '/lesson-12';
    expect(router.lessonSlug).toBe('lesson-12');
  });

  it('navigate changes hash', async () => {
    const { router } = await import('../router.svelte');
    router.navigate('/practice');
    expect(window.location.hash).toBe('#/practice');
  });
});
