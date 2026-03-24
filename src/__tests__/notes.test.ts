import { describe, it, expect } from 'vitest';
import {
  TREBLE_NOTES,
  SHARP_NOTES,
  ALL_NOTES,
  ALL_LETTERS,
  STAFF_LINES,
  Y_MAP,
  getNoteById,
  generatePianoKeys,
} from '../data/notes';

describe('TREBLE_NOTES', () => {
  it('has 16 natural notes (C4–A5 range plus B3–G3)', () => {
    expect(TREBLE_NOTES).toHaveLength(16);
  });

  it('every note has required fields', () => {
    for (const note of TREBLE_NOTES) {
      expect(note.id).toBeTruthy();
      expect(note.name).toBeTruthy();
      expect(typeof note.yPos).toBe('number');
      expect(typeof note.octave).toBe('number');
      expect(typeof note.midiNote).toBe('number');
    }
  });

  it('y positions are sorted descending (higher notes have lower y)', () => {
    for (let i = 0; i < TREBLE_NOTES.length - 1; i++) {
      expect(TREBLE_NOTES[i].yPos).toBeLessThan(TREBLE_NOTES[i + 1].yPos);
    }
  });

  it('C4 (Middle C) has MIDI note 60', () => {
    const c4 = TREBLE_NOTES.find(n => n.id === 'C4');
    expect(c4).toBeDefined();
    expect(c4!.midiNote).toBe(60);
  });

  it('A4 (concert pitch) has MIDI note 69', () => {
    const a4 = TREBLE_NOTES.find(n => n.id === 'A4');
    expect(a4).toBeDefined();
    expect(a4!.midiNote).toBe(69);
  });
});

describe('SHARP_NOTES', () => {
  it('has 9 sharp notes', () => {
    expect(SHARP_NOTES).toHaveLength(9);
  });

  it('every sharp note is marked isSharp', () => {
    for (const note of SHARP_NOTES) {
      expect(note.isSharp).toBe(true);
    }
  });

  it('every sharp note ID contains #', () => {
    for (const note of SHARP_NOTES) {
      expect(note.id).toContain('#');
    }
  });
});

describe('ALL_NOTES', () => {
  it('is the union of TREBLE_NOTES and SHARP_NOTES', () => {
    expect(ALL_NOTES).toHaveLength(TREBLE_NOTES.length + SHARP_NOTES.length);
  });

  it('every note has a unique ID', () => {
    const ids = ALL_NOTES.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Y_MAP', () => {
  it('contains an entry for every note in ALL_NOTES', () => {
    for (const note of ALL_NOTES) {
      expect(Y_MAP[note.id]).toBe(note.yPos);
    }
  });

  it('known staff positions are correct', () => {
    expect(Y_MAP['A5']).toBe(20);
    expect(Y_MAP['C4']).toBe(140);
    expect(Y_MAP['G3']).toBe(170);
    expect(Y_MAP['B4']).toBe(80);
  });
});

describe('STAFF_LINES', () => {
  it('has 5 staff lines', () => {
    expect(STAFF_LINES).toHaveLength(5);
  });

  it('are at y=40,60,80,100,120', () => {
    expect(STAFF_LINES).toEqual([40, 60, 80, 100, 120]);
  });
});

describe('ALL_LETTERS', () => {
  it('has 7 letters A through G', () => {
    expect(ALL_LETTERS).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });
});

describe('getNoteById', () => {
  it('finds natural notes', () => {
    const c4 = getNoteById('C4');
    expect(c4).toBeDefined();
    expect(c4!.name).toBe('C');
    expect(c4!.octave).toBe(4);
  });

  it('finds sharp notes', () => {
    const fSharp4 = getNoteById('F#4');
    expect(fSharp4).toBeDefined();
    expect(fSharp4!.isSharp).toBe(true);
    expect(fSharp4!.midiNote).toBe(66);
  });

  it('returns undefined for non-existent notes', () => {
    expect(getNoteById('Z9')).toBeUndefined();
    expect(getNoteById('')).toBeUndefined();
  });
});

describe('generatePianoKeys', () => {
  it('generates 12 keys per octave', () => {
    const keys = generatePianoKeys(4, 4);
    expect(keys).toHaveLength(12);
  });

  it('generates 24 keys for 2 octaves', () => {
    const keys = generatePianoKeys(3, 4);
    expect(keys).toHaveLength(24);
  });

  it('has 7 white keys and 5 black keys per octave', () => {
    const keys = generatePianoKeys(4, 4);
    const white = keys.filter(k => !k.isBlack);
    const black = keys.filter(k => k.isBlack);
    expect(white).toHaveLength(7);
    expect(black).toHaveLength(5);
  });

  it('first key of octave 4 is C4 with correct MIDI', () => {
    const keys = generatePianoKeys(4, 4);
    expect(keys[0].note).toBe('C4');
    expect(keys[0].name).toBe('C');
    expect(keys[0].isBlack).toBe(false);
    // MIDI for C4 = (4+1)*12 + 0 = 60
    expect(keys[0].midiNote).toBe(60);
  });

  it('MIDI notes are monotonically increasing', () => {
    const keys = generatePianoKeys(3, 5);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i].midiNote).toBe(keys[i - 1].midiNote + 1);
    }
  });
});
