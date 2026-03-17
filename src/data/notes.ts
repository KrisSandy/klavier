// Note interface
export interface Note {
  id: string;       // e.g. "C4", "F#4"
  name: string;     // letter name, e.g. "C", "F"
  yPos: number;     // SVG y position on treble staff
  octave: number;   // e.g. 4, 5
  isSharp?: boolean; // true for black keys
  midiNote: number; // MIDI note number for audio
}

// Staff constants
export const STAFF_LINES = [40, 60, 80, 100, 120]; // y positions
export const CLEF_FONT_SIZE = 100;
export const NOTE_X = 280; // x position for single note display

// Treble clef notes - natural notes from C4 to A5
// Include yPos for staff positioning (20px spacing, line at every 20px)
// Staff lines: F5=40, D5=60, B4=80, G4=100, E4=120
// Spaces: E5=50, C5=70, A4=90, F4=110
// Above staff: A5=20, G5=30
// Below staff: D4=130, C4=140, B3=150, A3=160, G3=170
export const TREBLE_NOTES: Note[] = [
  { id: 'A5', name: 'A', yPos: 20, octave: 5, midiNote: 81 },
  { id: 'G5', name: 'G', yPos: 30, octave: 5, midiNote: 79 },
  { id: 'F5', name: 'F', yPos: 40, octave: 5, midiNote: 77 },
  { id: 'E5', name: 'E', yPos: 50, octave: 5, midiNote: 76 },
  { id: 'D5', name: 'D', yPos: 60, octave: 5, midiNote: 74 },
  { id: 'C5', name: 'C', yPos: 70, octave: 5, midiNote: 72 },
  { id: 'B4', name: 'B', yPos: 80, octave: 4, midiNote: 71 },
  { id: 'A4', name: 'A', yPos: 90, octave: 4, midiNote: 69 },
  { id: 'G4', name: 'G', yPos: 100, octave: 4, midiNote: 67 },
  { id: 'F4', name: 'F', yPos: 110, octave: 4, midiNote: 65 },
  { id: 'E4', name: 'E', yPos: 120, octave: 4, midiNote: 64 },
  { id: 'D4', name: 'D', yPos: 130, octave: 4, midiNote: 62 },
  { id: 'C4', name: 'C', yPos: 140, octave: 4, midiNote: 60 },
  { id: 'B3', name: 'B', yPos: 150, octave: 3, midiNote: 59 },
  { id: 'A3', name: 'A', yPos: 160, octave: 3, midiNote: 57 },
  { id: 'G3', name: 'G', yPos: 170, octave: 3, midiNote: 55 },
];

// Sharp notes for songs that use them
export const SHARP_NOTES: Note[] = [
  { id: 'G#5', name: 'G', yPos: 30, octave: 5, isSharp: true, midiNote: 80 },
  { id: 'F#5', name: 'F', yPos: 40, octave: 5, isSharp: true, midiNote: 78 },
  { id: 'D#5', name: 'D', yPos: 60, octave: 5, isSharp: true, midiNote: 75 },
  { id: 'C#5', name: 'C', yPos: 70, octave: 5, isSharp: true, midiNote: 73 },
  { id: 'A#4', name: 'A', yPos: 90, octave: 4, isSharp: true, midiNote: 70 },
  { id: 'G#4', name: 'G', yPos: 100, octave: 4, isSharp: true, midiNote: 68 },
  { id: 'F#4', name: 'F', yPos: 110, octave: 4, isSharp: true, midiNote: 66 },
  { id: 'D#4', name: 'D', yPos: 130, octave: 4, isSharp: true, midiNote: 63 },
  { id: 'C#4', name: 'C', yPos: 140, octave: 4, isSharp: true, midiNote: 61 },
];

// All notes combined for lookup
export const ALL_NOTES: Note[] = [...TREBLE_NOTES, ...SHARP_NOTES];

// Lookup by id
export function getNoteById(id: string): Note | undefined {
  return ALL_NOTES.find(n => n.id === id);
}

// Y position lookup map (for SongStaff etc)
export const Y_MAP: Record<string, number> = {};
for (const n of ALL_NOTES) {
  Y_MAP[n.id] = n.yPos;
}

// All 7 unique letter names for quiz distractors
export const ALL_LETTERS: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Piano key data for virtual keyboard (2 octaves: C3 to B5)
export interface PianoKey {
  note: string;    // e.g. "C4"
  name: string;    // e.g. "C"
  octave: number;
  isBlack: boolean;
  midiNote: number;
}

// Generate piano keys for a range of octaves
export function generatePianoKeys(startOctave: number, endOctave: number): PianoKey[] {
  const keys: PianoKey[] = [];
  const pattern = [
    { name: 'C', black: false, offset: 0 },
    { name: 'C#', black: true, offset: 1 },
    { name: 'D', black: false, offset: 2 },
    { name: 'D#', black: true, offset: 3 },
    { name: 'E', black: false, offset: 4 },
    { name: 'F', black: false, offset: 5 },
    { name: 'F#', black: true, offset: 6 },
    { name: 'G', black: false, offset: 7 },
    { name: 'G#', black: true, offset: 8 },
    { name: 'A', black: false, offset: 9 },
    { name: 'A#', black: true, offset: 10 },
    { name: 'B', black: false, offset: 11 },
  ];
  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const p of pattern) {
      const midiNote = (oct + 1) * 12 + p.offset;
      keys.push({
        note: `${p.name}${oct}`,
        name: p.name,
        octave: oct,
        isBlack: p.black,
        midiNote,
      });
    }
  }
  return keys;
}
