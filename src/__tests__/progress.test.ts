import { describe, it, expect, beforeEach, vi } from 'vitest';

// Helper to set up consent in localStorage before importing progress store
function grantConsent() {
  localStorage.setItem('klavier-consent', JSON.stringify({
    status: 'accepted',
    date: new Date().toISOString(),
    version: '1.0',
  }));
}

describe('progress store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('starts with default empty progress', async () => {
    const { progress } = await import('../stores/progress.svelte');
    expect(progress.data.completedLessons).toEqual([]);
    expect(progress.data.quizScores).toEqual({});
    expect(progress.data.currentStreak).toBe(0);
    expect(progress.data.totalPracticeMinutes).toBe(0);
    expect(progress.completionPercent).toBe(0);
  });

  it('completeLesson requires consent', async () => {
    // No consent granted
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(1);
    expect(progress.data.completedLessons).toEqual([]);
  });

  it('completeLesson works with consent', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(1);
    expect(progress.data.completedLessons).toContain(1);
    expect(progress.isLessonCompleted(1)).toBe(true);
  });

  it('completeLesson is idempotent', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(1);
    progress.completeLesson(1);
    expect(progress.data.completedLessons.filter(id => id === 1)).toHaveLength(1);
  });

  it('uncompleteLesson removes a completed lesson', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(1);
    expect(progress.isLessonCompleted(1)).toBe(true);
    progress.uncompleteLesson(1);
    expect(progress.isLessonCompleted(1)).toBe(false);
  });

  it('uncompleteLesson requires consent', async () => {
    // Manually set up some progress, then try to uncomplete without consent
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(1);

    // Remove consent
    localStorage.removeItem('klavier-consent');
    progress.uncompleteLesson(1);
    // Should still be completed since uncomplete was blocked
    expect(progress.isLessonCompleted(1)).toBe(true);
  });

  it('completionPercent calculates correctly', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    // 0 of 18
    expect(progress.completionPercent).toBe(0);
    // 9 of 18 = 50%
    for (let i = 1; i <= 9; i++) {
      progress.completeLesson(i);
    }
    expect(progress.completionPercent).toBe(50);
    // 18 of 18 = 100%
    for (let i = 10; i <= 18; i++) {
      progress.completeLesson(i);
    }
    expect(progress.completionPercent).toBe(100);
  });

  it('saveQuizScore stores the best score', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.saveQuizScore(1, 3, 5, 5000);
    expect(progress.getQuizScore(1)).toBeDefined();
    expect(progress.getQuizScore(1)!.score).toBe(3);

    // Higher score should replace
    progress.saveQuizScore(1, 5, 5, 4000);
    expect(progress.getQuizScore(1)!.score).toBe(5);

    // Lower score should NOT replace
    progress.saveQuizScore(1, 2, 5, 3000);
    expect(progress.getQuizScore(1)!.score).toBe(5);
  });

  it('saveQuizScore prefers better time on same score', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.saveQuizScore(1, 5, 5, 5000);
    // Same score but better time
    progress.saveQuizScore(1, 5, 5, 3000);
    expect(progress.getQuizScore(1)!.bestTimeMs).toBe(3000);
    // Same score but worse time — should not replace
    progress.saveQuizScore(1, 5, 5, 9000);
    expect(progress.getQuizScore(1)!.bestTimeMs).toBe(3000);
  });

  it('addPracticeTime accumulates minutes', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.addPracticeTime(5);
    progress.addPracticeTime(10);
    expect(progress.data.totalPracticeMinutes).toBe(15);
  });

  it('addPracticeTime requires consent', async () => {
    const { progress } = await import('../stores/progress.svelte');
    progress.addPracticeTime(5);
    expect(progress.data.totalPracticeMinutes).toBe(0);
  });

  it('persists data to localStorage when consent is granted', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(3);
    const raw = localStorage.getItem('klavier-progress');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed._schemaVersion).toBe(1);
    expect(parsed.data.completedLessons).toContain(3);
  });

  it('loads legacy data (pre-schema-versioning)', async () => {
    grantConsent();
    // Old format: ProgressData stored directly without _schemaVersion wrapper
    localStorage.setItem('klavier-progress', JSON.stringify({
      completedLessons: [1, 2, 3],
      quizScores: {},
      currentStreak: 2,
      longestStreak: 5,
      lastActiveDate: '2025-01-01',
      totalPracticeMinutes: 30,
    }));
    const { progress } = await import('../stores/progress.svelte');
    expect(progress.data.completedLessons).toEqual([1, 2, 3]);
    expect(progress.data.currentStreak).toBe(2);
    expect(progress.data.totalPracticeMinutes).toBe(30);
  });

  it('reset() clears all progress', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(1);
    progress.addPracticeTime(10);
    progress.reset();
    expect(progress.data.completedLessons).toEqual([]);
    expect(progress.data.totalPracticeMinutes).toBe(0);
    expect(localStorage.getItem('klavier-progress')).toBeNull();
  });
});
