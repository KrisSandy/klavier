import { describe, it, expect } from 'vitest';
import {
  SONGS,
  getSongById,
  getSongsByLesson,
  getSongLibrary,
  getSongsByDifficulty,
} from '../data/songs';
import { ALL_NOTES } from '../data/notes';

describe('SONGS', () => {
  it('has at least 10 songs', () => {
    expect(SONGS.length).toBeGreaterThanOrEqual(10);
  });

  it('every song has required fields', () => {
    for (const song of SONGS) {
      expect(song.id).toBeTruthy();
      expect(song.title).toBeTruthy();
      expect(song.timeSignature).toHaveLength(2);
      expect(song.timeSignature[0]).toBeGreaterThan(0);
      expect(song.timeSignature[1]).toBeGreaterThan(0);
      expect(song.keySignature).toBeTruthy();
      expect(song.bpm).toBeGreaterThan(0);
      expect(song.lines.length).toBeGreaterThan(0);
    }
  });

  it('every song has unique ID', () => {
    const ids = SONGS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every note in every song exists in ALL_NOTES', () => {
    const validIds = new Set(ALL_NOTES.map(n => n.id));
    for (const song of SONGS) {
      for (const line of song.lines) {
        for (const noteId of line) {
          expect(validIds.has(noteId)).toBe(true);
        }
      }
    }
  });

  it('BPM values are reasonable (40–200)', () => {
    for (const song of SONGS) {
      expect(song.bpm).toBeGreaterThanOrEqual(40);
      expect(song.bpm).toBeLessThanOrEqual(200);
    }
  });
});

describe('getSongById', () => {
  it('finds Ode to Joy', () => {
    const song = getSongById('ode-to-joy');
    expect(song).toBeDefined();
    expect(song!.title).toBe('Ode to Joy');
    expect(song!.composer).toBe('Beethoven');
  });

  it('returns undefined for non-existent ID', () => {
    expect(getSongById('not-a-song')).toBeUndefined();
  });
});

describe('getSongsByLesson', () => {
  it('returns songs linked to lesson 3', () => {
    const songs = getSongsByLesson(3);
    expect(songs.length).toBeGreaterThanOrEqual(1);
    expect(songs.every(s => s.lessonId === 3)).toBe(true);
  });

  it('returns empty array for lesson with no songs', () => {
    // Lesson 1 has no song
    expect(getSongsByLesson(1)).toHaveLength(0);
  });
});

describe('getSongLibrary', () => {
  it('returns only songs with a difficulty rating', () => {
    const library = getSongLibrary();
    for (const song of library) {
      expect(song.difficulty).toBeDefined();
    }
  });
});

describe('getSongsByDifficulty', () => {
  it('returns only beginner songs when filtering beginner', () => {
    const beginner = getSongsByDifficulty('beginner');
    for (const song of beginner) {
      expect(song.difficulty).toBe('beginner');
    }
  });
});
