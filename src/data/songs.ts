export interface Song {
  id: string;
  title: string;
  composer?: string;
  lessonId: number;    // which lesson introduces this song
  timeSignature: [number, number]; // e.g. [4, 4]
  keySignature: string; // e.g. "C major", "G major"
  bpm: number;         // suggested tempo
  lines: string[][];   // each line is an array of note IDs
}

export const SONGS: Song[] = [
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    composer: 'Beethoven',
    lessonId: 3,
    timeSignature: [4, 4],
    keySignature: 'C major',
    bpm: 100,
    lines: [
      ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4'],
      ['C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'],
      ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4'],
      ['C4', 'C4', 'D4', 'E4', 'D4', 'C4', 'C4'],
    ],
  },
  {
    id: 'kushi',
    title: 'Kushi Theme',
    lessonId: 5,
    timeSignature: [4, 4],
    keySignature: 'F# minor',
    bpm: 80,
    lines: [
      ['F#4', 'C#5', 'B4', 'C#5', 'B4', 'C#5', 'E5', 'C#5'],
      ['F#4', 'C#5', 'B4', 'C#5', 'E5', 'C#5'],
      ['B4', 'A#4', 'G#4', 'A#4', 'G#4', 'A#4', 'C#5', 'B4', 'A#4', 'G#4'],
      ['A#4', 'G#4', 'A#4', 'C#5', 'B4'],
      ['E4', 'F#4', 'A4', 'E4', 'F#4', 'A4', 'F#4'],
      ['E4', 'C#4'],
      ['E4', 'F#4', 'A4', 'E4', 'F#4', 'A4', 'F#4'],
      ['C#5', 'D5', 'C#5', 'A4', 'F#4', 'F4'],
      ['C#5', 'D5', 'C#5', 'A4', 'F4', 'F#4'],
      ['A#4', 'G#4', 'A#4', 'C#5', 'B4', 'A#4', 'G#4'],
      ['A#4', 'G#4', 'A#4', 'C#5', 'B4'],
      ['E4', 'F#4', 'A4', 'E4', 'F#4', 'A4', 'F#4'],
      ['E4', 'C#4', 'E4', 'F#4', 'A4', 'E4', 'F#4', 'A4', 'F#4'],
    ],
  },
  {
    id: 'simple-waltz',
    title: 'Simple Waltz',
    lessonId: 6,
    timeSignature: [3, 4],
    keySignature: 'G major',
    bpm: 108,
    lines: [
      ['G4', 'B4', 'D5', 'B4', 'G4'],
      ['A4', 'C5', 'E5', 'C5', 'A4'],
      ['G4', 'B4', 'D5', 'B4', 'G4'],
      ['D5', 'B4', 'G4'],
    ],
  },
  {
    id: 'yankee-doodle',
    title: 'Yankee Doodle',
    lessonId: 8,
    timeSignature: [2, 4],
    keySignature: 'C major',
    bpm: 120,
    lines: [
      ['C4', 'C4', 'D4', 'E4', 'C4', 'E4', 'D4'],
      ['C4', 'C4', 'D4', 'E4', 'C4', 'B3', 'C4'],
      ['C4', 'C4', 'D4', 'E4', 'F4', 'E4', 'D4', 'C4'],
      ['B3', 'G3', 'A3', 'B3', 'C4', 'C4'],
    ],
  },
  {
    id: 'minuet-in-g',
    title: 'Minuet in G',
    composer: 'Bach',
    lessonId: 9,
    timeSignature: [3, 4],
    keySignature: 'G major',
    bpm: 100,
    lines: [
      ['D5', 'G4', 'A4', 'B4', 'C5', 'D5'],
      ['G4', 'G4'],
      ['E5', 'C5', 'D5', 'E5', 'F#5', 'G5'],
      ['G4', 'G4'],
      ['C5', 'D5', 'C5', 'B4', 'A4', 'B4'],
      ['C5', 'D5', 'C5', 'B4', 'A4', 'G4'],
      ['F#4', 'G4', 'A4', 'B4', 'G4', 'B4'],
      ['A4', 'A4', 'D5'],
    ],
  },
  {
    id: 'when-the-saints',
    title: 'When the Saints',
    lessonId: 11,
    timeSignature: [4, 4],
    keySignature: 'C major',
    bpm: 110,
    lines: [
      ['C4', 'E4', 'F4', 'G4'],
      ['C4', 'E4', 'F4', 'G4'],
      ['C4', 'E4', 'F4', 'G4', 'E4', 'C4', 'E4', 'D4'],
      ['E4', 'E4', 'D4', 'C4', 'C4', 'E4', 'G4', 'G4'],
      ['F4', 'F4', 'E4', 'F4', 'G4', 'E4', 'C4', 'D4', 'C4'],
    ],
  },
  {
    id: 'scarborough-fair',
    title: 'Scarborough Fair',
    lessonId: 12,
    timeSignature: [3, 4],
    keySignature: 'A minor',
    bpm: 92,
    lines: [
      ['A3', 'A3', 'E4', 'E4', 'F4', 'E4'],
      ['D4', 'E4', 'C4', 'A3'],
      ['A3', 'G4', 'G4', 'A4', 'G4'],
      ['E4', 'D4', 'E4', 'C4', 'B3', 'A3'],
    ],
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    lessonId: 15,
    timeSignature: [3, 4],
    keySignature: 'G major',
    bpm: 80,
    lines: [
      ['D4', 'G4', 'B4', 'G4', 'B4', 'A4'],
      ['G4', 'E4', 'D4'],
      ['D4', 'G4', 'B4', 'G4', 'B4', 'A4'],
      ['D5', 'D5'],
      ['D5', 'B4', 'D5', 'B4', 'G4', 'D4'],
      ['E4', 'G4', 'G4', 'E4', 'D4'],
      ['D4', 'G4', 'B4', 'G4', 'B4', 'A4'],
      ['G4', 'G4'],
    ],
  },
  {
    id: 'clair-de-lune-simplified',
    title: 'Clair de Lune (Simplified)',
    composer: 'Debussy',
    lessonId: 16,
    timeSignature: [3, 4],
    keySignature: 'C major',
    bpm: 60,
    lines: [
      ['E4', 'G4', 'C5', 'E5', 'C5', 'G4'],
      ['F4', 'A4', 'C5', 'F5', 'C5', 'A4'],
      ['E4', 'G4', 'C5', 'E5', 'D5', 'C5'],
      ['B4', 'G4', 'E4', 'C4'],
    ],
  },
  {
    id: 'fur-elise-simplified',
    title: 'Für Elise (Simplified)',
    composer: 'Beethoven',
    lessonId: 17,
    timeSignature: [3, 4],
    keySignature: 'A minor',
    bpm: 100,
    lines: [
      ['E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5'],
      ['A4', 'A4'],
      ['C4', 'E4', 'A4', 'B4', 'B4'],
      ['E4', 'G#4', 'B4', 'C5', 'C5'],
      ['E4', 'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5'],
      ['A4', 'A4'],
    ],
  },
  {
    id: 'canon-in-d-simplified',
    title: 'Canon in D (Simplified)',
    composer: 'Pachelbel',
    lessonId: 18,
    timeSignature: [4, 4],
    keySignature: 'D major',
    bpm: 72,
    lines: [
      ['F#5', 'E5', 'D5', 'C#5'],
      ['B4', 'A4', 'B4', 'C#5'],
      ['D5', 'C#5', 'B4', 'A4'],
      ['G4', 'F#4', 'G4', 'E4'],
      ['D4', 'D5', 'C#5', 'B4', 'A4', 'G4', 'F#4', 'E4'],
      ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'],
    ],
  },
];

export function getSongById(id: string): Song | undefined {
  return SONGS.find(s => s.id === id);
}

export function getSongsByLesson(lessonId: number): Song[] {
  return SONGS.filter(s => s.lessonId === lessonId);
}
