import { describe, it, expect } from 'vitest';
import {
  MODULES,
  LESSONS,
  getLessonBySlug,
  getLessonById,
  getModuleLessons,
} from '../data/lessons';

describe('MODULES', () => {
  it('has exactly 6 modules', () => {
    expect(MODULES).toHaveLength(6);
  });

  it('each module has 3 lessons', () => {
    for (const mod of MODULES) {
      expect(mod.lessons).toHaveLength(3);
    }
  });

  it('module IDs are sequential 1–6', () => {
    expect(MODULES.map(m => m.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('all module lesson IDs are covered in LESSONS', () => {
    const allModuleLessonIds = MODULES.flatMap(m => m.lessons);
    const lessonIds = LESSONS.map(l => l.id);
    for (const id of allModuleLessonIds) {
      expect(lessonIds).toContain(id);
    }
  });
});

describe('LESSONS', () => {
  it('has exactly 18 lessons', () => {
    expect(LESSONS).toHaveLength(18);
  });

  it('IDs are sequential 1–18', () => {
    expect(LESSONS.map(l => l.id)).toEqual(
      Array.from({ length: 18 }, (_, i) => i + 1)
    );
  });

  it('every lesson has a slug matching "lesson-{id}"', () => {
    for (const lesson of LESSONS) {
      expect(lesson.slug).toBe(`lesson-${lesson.id}`);
    }
  });

  it('every lesson has a non-empty title and subtitle', () => {
    for (const lesson of LESSONS) {
      expect(lesson.title.length).toBeGreaterThan(0);
      expect(lesson.subtitle.length).toBeGreaterThan(0);
    }
  });

  it('every lesson has at least one objective', () => {
    for (const lesson of LESSONS) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every lesson references a valid module (1–6)', () => {
    for (const lesson of LESSONS) {
      expect(lesson.module).toBeGreaterThanOrEqual(1);
      expect(lesson.module).toBeLessThanOrEqual(6);
    }
  });
});

describe('getLessonById', () => {
  it('returns the correct lesson for valid IDs', () => {
    const lesson1 = getLessonById(1);
    expect(lesson1).toBeDefined();
    expect(lesson1!.title).toBe('The Piano Keyboard');

    const lesson18 = getLessonById(18);
    expect(lesson18).toBeDefined();
    expect(lesson18!.title).toBe('Putting It All Together');
  });

  it('returns undefined for invalid IDs', () => {
    expect(getLessonById(0)).toBeUndefined();
    expect(getLessonById(19)).toBeUndefined();
    expect(getLessonById(-1)).toBeUndefined();
  });
});

describe('getLessonBySlug', () => {
  it('returns the correct lesson for valid slugs', () => {
    const lesson = getLessonBySlug('lesson-5');
    expect(lesson).toBeDefined();
    expect(lesson!.id).toBe(5);
  });

  it('returns undefined for invalid slugs', () => {
    expect(getLessonBySlug('lesson-0')).toBeUndefined();
    expect(getLessonBySlug('not-a-lesson')).toBeUndefined();
  });
});

describe('getModuleLessons', () => {
  it('returns 3 lessons for each module', () => {
    for (let mod = 1; mod <= 6; mod++) {
      expect(getModuleLessons(mod)).toHaveLength(3);
    }
  });

  it('returns empty array for invalid module', () => {
    expect(getModuleLessons(0)).toHaveLength(0);
    expect(getModuleLessons(7)).toHaveLength(0);
  });

  it('returns lessons belonging to the correct module', () => {
    const mod2Lessons = getModuleLessons(2);
    for (const lesson of mod2Lessons) {
      expect(lesson.module).toBe(2);
    }
  });
});
