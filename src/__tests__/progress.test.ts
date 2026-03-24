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
    // v2 defaults
    expect(progress.data.practiceResults).toEqual({});
    expect(progress.data.dailyPracticeGoalMinutes).toBe(15);
    expect(progress.data.totalSessions).toBe(0);
    expect(progress.data.inputPreference).toBe('virtual');
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
    // 0 of 19
    expect(progress.completionPercent).toBe(0);
    // 9 of 19 ≈ 47%
    for (let i = 1; i <= 9; i++) {
      progress.completeLesson(i);
    }
    expect(progress.completionPercent).toBe(47);
    // 19 of 19 = 100%
    for (let i = 10; i <= 19; i++) {
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

  it('persists data to localStorage with schema version 2', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(3);
    const raw = localStorage.getItem('klavier-progress');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed._schemaVersion).toBe(2);
    expect(parsed.data.completedLessons).toContain(3);
    expect(parsed.data.practiceResults).toEqual({});
    expect(parsed.data.dailyPracticeGoalMinutes).toBe(15);
  });

  it('loads legacy data (pre-schema-versioning) and migrates to v2', async () => {
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
    // v2 fields should have defaults
    expect(progress.data.practiceResults).toEqual({});
    expect(progress.data.dailyPracticeGoalMinutes).toBe(15);
    expect(progress.data.totalSessions).toBe(0);
    expect(progress.data.inputPreference).toBe('virtual');
  });

  it('migrates v1 schema to v2', async () => {
    grantConsent();
    // v1 format: has _schemaVersion=1 but no v2 fields
    localStorage.setItem('klavier-progress', JSON.stringify({
      _schemaVersion: 1,
      data: {
        completedLessons: [1, 5],
        quizScores: {},
        currentStreak: 3,
        longestStreak: 3,
        lastActiveDate: '2026-03-20',
        totalPracticeMinutes: 45,
      },
    }));
    const { progress } = await import('../stores/progress.svelte');
    // Original fields preserved
    expect(progress.data.completedLessons).toEqual([1, 5]);
    expect(progress.data.totalPracticeMinutes).toBe(45);
    // v2 fields added with defaults
    expect(progress.data.practiceResults).toEqual({});
    expect(progress.data.dailyPracticeGoalMinutes).toBe(15);
    expect(progress.data.totalSessions).toBe(0);
    expect(progress.data.inputPreference).toBe('virtual');
    // Re-saved with v2 schema
    const raw = localStorage.getItem('klavier-progress');
    const parsed = JSON.parse(raw!);
    expect(parsed._schemaVersion).toBe(2);
  });

  it('reset() clears all progress', async () => {
    grantConsent();
    const { progress } = await import('../stores/progress.svelte');
    progress.completeLesson(1);
    progress.addPracticeTime(10);
    progress.reset();
    expect(progress.data.completedLessons).toEqual([]);
    expect(progress.data.totalPracticeMinutes).toBe(0);
    expect(progress.data.practiceResults).toEqual({});
    expect(progress.data.totalSessions).toBe(0);
    expect(localStorage.getItem('klavier-progress')).toBeNull();
  });

  // ── v2 practice result tests ──────────────────────────────────────────────

  describe('savePracticeResult', () => {
    it('saves a practice result for a song', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.savePracticeResult({
        songId: 'ode-to-joy',
        accuracy: 85,
        longestStreak: 12,
        date: '2026-03-24T10:00:00Z',
        inputSource: 'virtual',
      });
      expect(progress.data.practiceResults['ode-to-joy']).toHaveLength(1);
      expect(progress.data.practiceResults['ode-to-joy'][0].accuracy).toBe(85);
      expect(progress.data.totalSessions).toBe(1);
    });

    it('accumulates multiple results for same song', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.savePracticeResult({
        songId: 'ode-to-joy', accuracy: 70, longestStreak: 5,
        date: '2026-03-24T10:00:00Z', inputSource: 'virtual',
      });
      progress.savePracticeResult({
        songId: 'ode-to-joy', accuracy: 85, longestStreak: 10,
        date: '2026-03-24T11:00:00Z', inputSource: 'midi',
      });
      expect(progress.data.practiceResults['ode-to-joy']).toHaveLength(2);
      expect(progress.data.totalSessions).toBe(2);
    });

    it('requires consent', async () => {
      const { progress } = await import('../stores/progress.svelte');
      progress.savePracticeResult({
        songId: 'ode-to-joy', accuracy: 85, longestStreak: 10,
        date: '2026-03-24T10:00:00Z', inputSource: 'virtual',
      });
      expect(progress.data.practiceResults).toEqual({});
      expect(progress.data.totalSessions).toBe(0);
    });

    it('caps results at 50 per song', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      for (let i = 0; i < 55; i++) {
        progress.savePracticeResult({
          songId: 'test-song', accuracy: 50 + i, longestStreak: i,
          date: new Date(Date.now() + i * 1000).toISOString(), inputSource: 'virtual',
        });
      }
      expect(progress.data.practiceResults['test-song']).toHaveLength(50);
      // Should keep the most recent 50 (accuracy 55–104)
      expect(progress.data.practiceResults['test-song'][0].accuracy).toBe(55);
      expect(progress.data.practiceResults['test-song'][49].accuracy).toBe(104);
    });
  });

  describe('getBestScore', () => {
    it('returns null for song with no results', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      expect(progress.getBestScore('unknown-song')).toBeNull();
    });

    it('returns the highest accuracy result', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.savePracticeResult({
        songId: 'ode-to-joy', accuracy: 70, longestStreak: 5,
        date: '2026-03-24T10:00:00Z', inputSource: 'virtual',
      });
      progress.savePracticeResult({
        songId: 'ode-to-joy', accuracy: 92, longestStreak: 15,
        date: '2026-03-24T11:00:00Z', inputSource: 'midi',
      });
      progress.savePracticeResult({
        songId: 'ode-to-joy', accuracy: 80, longestStreak: 8,
        date: '2026-03-24T12:00:00Z', inputSource: 'virtual',
      });
      const best = progress.getBestScore('ode-to-joy');
      expect(best).not.toBeNull();
      expect(best!.accuracy).toBe(92);
    });
  });

  describe('getRecentSessions', () => {
    it('returns empty array when no sessions exist', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      expect(progress.getRecentSessions()).toEqual([]);
    });

    it('returns sessions sorted by date descending', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.savePracticeResult({
        songId: 'song-a', accuracy: 70, longestStreak: 5,
        date: '2026-03-20T10:00:00Z', inputSource: 'virtual',
      });
      progress.savePracticeResult({
        songId: 'song-b', accuracy: 80, longestStreak: 8,
        date: '2026-03-22T10:00:00Z', inputSource: 'midi',
      });
      progress.savePracticeResult({
        songId: 'song-a', accuracy: 90, longestStreak: 12,
        date: '2026-03-24T10:00:00Z', inputSource: 'virtual',
      });

      const recent = progress.getRecentSessions(2);
      expect(recent).toHaveLength(2);
      expect(recent[0].accuracy).toBe(90); // most recent
      expect(recent[1].accuracy).toBe(80);
    });

    it('respects limit parameter', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      for (let i = 0; i < 5; i++) {
        progress.savePracticeResult({
          songId: 'song-a', accuracy: 50 + i * 10, longestStreak: i,
          date: new Date(Date.now() + i * 60000).toISOString(), inputSource: 'virtual',
        });
      }
      expect(progress.getRecentSessions(3)).toHaveLength(3);
      expect(progress.getRecentSessions()).toHaveLength(5);
    });
  });

  describe('improvementTrend', () => {
    it('returns 0 with fewer than 4 sessions', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.savePracticeResult({
        songId: 'test', accuracy: 70, longestStreak: 5,
        date: '2026-03-24T10:00:00Z', inputSource: 'virtual',
      });
      expect(progress.improvementTrend('test')).toBe(0);
    });

    it('returns 0 for unknown song', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      expect(progress.improvementTrend('nope')).toBe(0);
    });

    it('calculates positive trend when improving', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      // Previous 3: avg 60
      progress.savePracticeResult({ songId: 's', accuracy: 50, longestStreak: 3, date: '2026-03-01T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 's', accuracy: 60, longestStreak: 5, date: '2026-03-02T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 's', accuracy: 70, longestStreak: 7, date: '2026-03-03T10:00:00Z', inputSource: 'virtual' });
      // Recent 3: avg 90
      progress.savePracticeResult({ songId: 's', accuracy: 85, longestStreak: 10, date: '2026-03-04T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 's', accuracy: 90, longestStreak: 12, date: '2026-03-05T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 's', accuracy: 95, longestStreak: 15, date: '2026-03-06T10:00:00Z', inputSource: 'virtual' });

      const trend = progress.improvementTrend('s');
      expect(trend).toBe(50); // (90 - 60) / 60 * 100 = 50%
    });

    it('calculates negative trend when declining', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      // Previous 3: avg 90
      progress.savePracticeResult({ songId: 's', accuracy: 85, longestStreak: 10, date: '2026-03-01T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 's', accuracy: 90, longestStreak: 12, date: '2026-03-02T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 's', accuracy: 95, longestStreak: 15, date: '2026-03-03T10:00:00Z', inputSource: 'virtual' });
      // Recent 3: avg 60
      progress.savePracticeResult({ songId: 's', accuracy: 50, longestStreak: 3, date: '2026-03-04T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 's', accuracy: 60, longestStreak: 5, date: '2026-03-05T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 's', accuracy: 70, longestStreak: 7, date: '2026-03-06T10:00:00Z', inputSource: 'virtual' });

      const trend = progress.improvementTrend('s');
      expect(trend).toBe(-33); // (60 - 90) / 90 * 100 ≈ -33%
    });
  });

  describe('input preference', () => {
    it('setInputPreference saves choice', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.setInputPreference('midi');
      expect(progress.data.inputPreference).toBe('midi');
    });

    it('setInputPreference requires consent', async () => {
      const { progress } = await import('../stores/progress.svelte');
      progress.setInputPreference('midi');
      expect(progress.data.inputPreference).toBe('virtual');
    });
  });

  describe('daily goal', () => {
    it('setDailyGoal updates the goal', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.setDailyGoal(30);
      expect(progress.data.dailyPracticeGoalMinutes).toBe(30);
    });

    it('setDailyGoal clamps to 1–120', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.setDailyGoal(0);
      expect(progress.data.dailyPracticeGoalMinutes).toBe(1);
      progress.setDailyGoal(999);
      expect(progress.data.dailyPracticeGoalMinutes).toBe(120);
    });
  });

  describe('derived stats', () => {
    it('overallBestAccuracy returns 0 with no sessions', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      expect(progress.overallBestAccuracy).toBe(0);
    });

    it('overallBestAccuracy returns highest across all songs', async () => {
      grantConsent();
      const { progress } = await import('../stores/progress.svelte');
      progress.savePracticeResult({ songId: 'a', accuracy: 70, longestStreak: 5, date: '2026-03-24T10:00:00Z', inputSource: 'virtual' });
      progress.savePracticeResult({ songId: 'b', accuracy: 95, longestStreak: 15, date: '2026-03-24T11:00:00Z', inputSource: 'midi' });
      progress.savePracticeResult({ songId: 'a', accuracy: 80, longestStreak: 8, date: '2026-03-24T12:00:00Z', inputSource: 'virtual' });
      expect(progress.overallBestAccuracy).toBe(95);
    });
  });
});
