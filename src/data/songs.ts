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
];

export function getSongById(id: string): Song | undefined {
  return SONGS.find(s => s.id === id);
}

export function getSongsByLesson(lessonId: number): Song[] {
  return SONGS.filter(s => s.lessonId === lessonId);
}
