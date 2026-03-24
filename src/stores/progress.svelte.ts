// Progress store - tracks completed lessons, quiz scores, streaks, practice results
// Respects user's localStorage consent preference

export interface QuizScore {
  lessonId: number;
  score: number;
  total: number;
  bestTimeMs: number;
  date: string;  // ISO date string
}

export interface PracticeScore {
  songId: string;
  accuracy: number;       // 0–100
  longestStreak: number;
  date: string;           // ISO date string
  inputSource: 'mic' | 'midi' | 'virtual';
}

export interface ProgressData {
  completedLessons: number[];
  quizScores: Record<number, QuizScore>;  // keyed by lessonId
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;  // ISO date string
  totalPracticeMinutes: number;
  // v2 fields
  practiceResults: Record<string, PracticeScore[]>;  // keyed by songId
  dailyPracticeGoalMinutes: number;
  totalSessions: number;
  inputPreference: 'virtual' | 'mic' | 'midi';
}

const STORAGE_KEY = 'klavier-progress';
const CONSENT_KEY = 'klavier-consent';
const SCHEMA_VERSION = 2;

interface StoredData {
  _schemaVersion: number;
  data: ProgressData;
}

const defaultProgress: ProgressData = {
  completedLessons: [],
  quizScores: {},
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  totalPracticeMinutes: 0,
  // v2 defaults
  practiceResults: {},
  dailyPracticeGoalMinutes: 15,
  totalSessions: 0,
  inputPreference: 'virtual',
};

function hasConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.status === 'accepted';
  } catch {
    return false;
  }
}

/**
 * Migrate stored data from one schema version to the next.
 * Runs in a while-loop so migrations are applied sequentially.
 */
function migrate(stored: StoredData): StoredData {
  while (stored._schemaVersion < SCHEMA_VERSION) {
    switch (stored._schemaVersion) {
      case 1:
        // v1 → v2: add practice results, daily goal, session count, input preference
        (stored.data as any).practiceResults = (stored.data as any).practiceResults ?? {};
        (stored.data as any).dailyPracticeGoalMinutes = (stored.data as any).dailyPracticeGoalMinutes ?? 15;
        (stored.data as any).totalSessions = (stored.data as any).totalSessions ?? 0;
        (stored.data as any).inputPreference = (stored.data as any).inputPreference ?? 'virtual';
        stored._schemaVersion = 2;
        break;
      default:
        // Unknown version — skip to current to prevent infinite loop
        stored._schemaVersion = SCHEMA_VERSION;
        break;
    }
  }
  return stored;
}

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress };

    const parsed = JSON.parse(raw);

    // Handle legacy data (pre-schema-versioning): no _schemaVersion field
    if (parsed._schemaVersion === undefined) {
      // Old format stored ProgressData directly — wrap it
      const stored: StoredData = {
        _schemaVersion: 1,
        data: { ...defaultProgress, ...parsed },
      };
      // Run migrations from v1
      const migrated = migrate(stored);
      if (hasConsent()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
      return migrated.data;
    }

    // Versioned format — run migrations if needed
    let stored = parsed as StoredData;
    if (stored._schemaVersion < SCHEMA_VERSION) {
      stored = migrate(stored);
      if (hasConsent()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      }
    }

    return { ...defaultProgress, ...stored.data };
  } catch {
    return { ...defaultProgress };
  }
}

function save(data: ProgressData): void {
  // Only persist to localStorage if user has granted consent
  if (hasConsent()) {
    const stored: StoredData = { _schemaVersion: SCHEMA_VERSION, data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }
}

class ProgressStore {
  data = $state<ProgressData>(load());

  private persist() {
    save(this.data);
  }

  completeLesson(lessonId: number) {
    if (!hasConsent()) return;
    if (!this.data.completedLessons.includes(lessonId)) {
      this.data.completedLessons = [...this.data.completedLessons, lessonId];
    }
    this.updateStreak();
    this.persist();
  }

  uncompleteLesson(lessonId: number) {
    if (!hasConsent()) return;
    this.data.completedLessons = this.data.completedLessons.filter(id => id !== lessonId);
    this.persist();
  }

  saveQuizScore(lessonId: number, score: number, total: number, bestTimeMs: number) {
    if (!hasConsent()) return;
    const existing = this.data.quizScores[lessonId];
    if (!existing || score > existing.score || (score === existing.score && bestTimeMs < existing.bestTimeMs)) {
      this.data.quizScores = {
        ...this.data.quizScores,
        [lessonId]: { lessonId, score, total, bestTimeMs, date: new Date().toISOString() },
      };
    }
    this.persist();
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.data.completedLessons.includes(lessonId);
  }

  getQuizScore(lessonId: number): QuizScore | undefined {
    return this.data.quizScores[lessonId];
  }

  addPracticeTime(minutes: number) {
    if (!hasConsent()) return;
    this.data.totalPracticeMinutes += minutes;
    this.updateStreak();
    this.persist();
  }

  // ── v2 methods ────────────────────────────────────────────────────────────

  /**
   * Save a practice session result for a song.
   * Keeps all attempts (for trend analysis), capped at 50 per song.
   */
  savePracticeResult(result: PracticeScore) {
    if (!hasConsent()) return;

    const songId = result.songId;
    const existing = this.data.practiceResults[songId] ?? [];
    const updated = [...existing, result];

    // Cap at 50 results per song to prevent unbounded growth
    if (updated.length > 50) {
      updated.splice(0, updated.length - 50);
    }

    this.data.practiceResults = {
      ...this.data.practiceResults,
      [songId]: updated,
    };
    this.data.totalSessions++;
    this.updateStreak();
    this.persist();
  }

  /**
   * Get the best accuracy score for a song.
   */
  getBestScore(songId: string): PracticeScore | null {
    const scores = this.data.practiceResults[songId];
    if (!scores || scores.length === 0) return null;
    return scores.reduce((best, s) => s.accuracy > best.accuracy ? s : best, scores[0]);
  }

  /**
   * Get the N most recent practice sessions across all songs, newest first.
   */
  getRecentSessions(limit: number = 10): PracticeScore[] {
    const all: PracticeScore[] = [];
    for (const songScores of Object.values(this.data.practiceResults)) {
      all.push(...songScores);
    }
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all.slice(0, limit);
  }

  /**
   * Calculate improvement trend for a song.
   * Compares average accuracy of last 3 sessions vs previous 3.
   * Returns percentage change (positive = improving, negative = declining).
   * Returns 0 if fewer than 4 sessions exist.
   */
  improvementTrend(songId: string): number {
    const scores = this.data.practiceResults[songId];
    if (!scores || scores.length < 4) return 0;

    const recent = scores.slice(-3);
    const previous = scores.slice(-6, -3);

    if (previous.length === 0) return 0;

    const recentAvg = recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
    const prevAvg = previous.reduce((sum, s) => sum + s.accuracy, 0) / previous.length;

    if (prevAvg === 0) return recentAvg > 0 ? 100 : 0;
    return Math.round(((recentAvg - prevAvg) / prevAvg) * 100);
  }

  /**
   * Set the preferred input source (remembered across sessions).
   */
  setInputPreference(source: 'virtual' | 'mic' | 'midi') {
    if (!hasConsent()) return;
    this.data.inputPreference = source;
    this.persist();
  }

  /**
   * Set the daily practice goal in minutes.
   */
  setDailyGoal(minutes: number) {
    if (!hasConsent()) return;
    this.data.dailyPracticeGoalMinutes = Math.max(1, Math.min(120, minutes));
    this.persist();
  }

  /**
   * Get today's practice minutes (estimated from session count).
   * In a real app this would track per-day; for now we use total.
   */
  get practiceSessionsThisWeek(): number {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    let count = 0;
    for (const songScores of Object.values(this.data.practiceResults)) {
      for (const s of songScores) {
        if (s.date >= weekAgo) count++;
      }
    }
    return count;
  }

  /**
   * Get overall best accuracy across all songs.
   */
  get overallBestAccuracy(): number {
    let best = 0;
    for (const songScores of Object.values(this.data.practiceResults)) {
      for (const s of songScores) {
        if (s.accuracy > best) best = s.accuracy;
      }
    }
    return best;
  }

  // ── Existing internals ────────────────────────────────────────────────────

  private updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (this.data.lastActiveDate === today) return;

    if (this.data.lastActiveDate === yesterday) {
      this.data.currentStreak += 1;
    } else if (this.data.lastActiveDate !== today) {
      this.data.currentStreak = 1;
    }

    if (this.data.currentStreak > this.data.longestStreak) {
      this.data.longestStreak = this.data.currentStreak;
    }

    this.data.lastActiveDate = today;
  }

  get completionPercent(): number {
    return Math.round((this.data.completedLessons.length / 19) * 100);
  }

  reset() {
    this.data = { ...defaultProgress };
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const progress = new ProgressStore();
