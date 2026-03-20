// Progress store - tracks completed lessons, quiz scores, streaks
// Respects user's localStorage consent preference

export interface QuizScore {
  lessonId: number;
  score: number;
  total: number;
  bestTimeMs: number;
  date: string;  // ISO date string
}

export interface ProgressData {
  completedLessons: number[];
  quizScores: Record<number, QuizScore>;  // keyed by lessonId
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;  // ISO date string
  totalPracticeMinutes: number;
}

const STORAGE_KEY = 'klavier-progress';
const CONSENT_KEY = 'klavier-consent';
const SCHEMA_VERSION = 1;

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
 * Add new cases here when you change the ProgressData shape.
 *
 * Example for a future v2 migration:
 *   case 1: stored.data.newField = defaultValue; stored._schemaVersion = 2;
 */
function migrate(stored: StoredData): StoredData {
  // Currently on schema v1, no migrations needed yet.
  // When adding v2, add: while (stored._schemaVersion < SCHEMA_VERSION) { switch... }
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
        _schemaVersion: SCHEMA_VERSION,
        data: { ...defaultProgress, ...parsed },
      };
      // Re-save in new format if we have consent
      if (hasConsent()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      }
      return stored.data;
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
    return Math.round((this.data.completedLessons.length / 18) * 100); // 18 lessons across phases 1-3
  }

  reset() {
    this.data = { ...defaultProgress };
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const progress = new ProgressStore();
