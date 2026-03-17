export interface LessonMeta {
  id: number;
  slug: string;          // URL hash, e.g. "lesson-1"
  title: string;
  subtitle: string;      // short description
  module: number;        // 1-based module number
  moduleName: string;
  videoUrl?: string;     // Bill Hilton YouTube link
  objectives: string[];  // learning objectives
  hasQuiz: boolean;
  hasPractice: boolean;  // has interactive keyboard exercise
  hasSong: boolean;      // has a piece to learn
}

export const MODULES = [
  { id: 1, name: 'The Keyboard & First Notes', lessons: [1, 2, 3] },
  { id: 2, name: 'Both Hands & Scales', lessons: [4, 5, 6] },
];

export const LESSONS: LessonMeta[] = [
  {
    id: 1,
    slug: 'lesson-1',
    title: 'The Piano Keyboard',
    subtitle: 'Finding notes and learning their names',
    module: 1,
    moduleName: 'The Keyboard & First Notes',
    videoUrl: 'https://www.youtube.com/watch?v=...', // placeholder
    objectives: [
      'Identify white and black keys on the piano',
      'Name the 7 natural notes (A through G)',
      'Understand octave numbering',
      'Find any note on the keyboard',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: false,
  },
  {
    id: 2,
    slug: 'lesson-2',
    title: 'Reading Music',
    subtitle: 'The treble clef and the staff',
    module: 1,
    moduleName: 'The Keyboard & First Notes',
    objectives: [
      'Read the 5-line staff',
      'Understand the treble clef (G clef)',
      'Identify notes on lines and spaces',
      'Connect staff notes to the keyboard',
    ],
    hasQuiz: true,
    hasPractice: false,
    hasSong: false,
  },
  {
    id: 3,
    slug: 'lesson-3',
    title: 'Reading a Melody',
    subtitle: 'Note durations and your first melody',
    module: 1,
    moduleName: 'The Keyboard & First Notes',
    objectives: [
      'Understand note durations (whole, half, quarter)',
      'Read a simple melody on the staff',
      'Play a melody on the virtual keyboard',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 4,
    slug: 'lesson-4',
    title: 'The Left Hand & C Major',
    subtitle: 'Bass clef and your first scale',
    module: 2,
    moduleName: 'Both Hands & Scales',
    objectives: [
      'Read notes in the bass clef',
      'Play the C major scale with the left hand',
      'Understand whole and half steps',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: false,
  },
  {
    id: 5,
    slug: 'lesson-5',
    title: 'Learning a Piece',
    subtitle: 'Hands together for the first time',
    module: 2,
    moduleName: 'Both Hands & Scales',
    objectives: [
      'Read the grand staff (treble + bass)',
      'Coordinate both hands on a simple piece',
      'Practice a complete short piece',
    ],
    hasQuiz: false,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 6,
    slug: 'lesson-6',
    title: 'A New Piece, G Major & Rests',
    subtitle: 'Rest symbols and the G major scale',
    module: 2,
    moduleName: 'Both Hands & Scales',
    objectives: [
      'Identify rest symbols (whole, half, quarter)',
      'Play the G major scale',
      'Learn a new piece using rests',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
];

export function getLessonBySlug(slug: string): LessonMeta | undefined {
  return LESSONS.find(l => l.slug === slug);
}

export function getLessonById(id: number): LessonMeta | undefined {
  return LESSONS.find(l => l.id === id);
}

export function getModuleLessons(moduleId: number): LessonMeta[] {
  return LESSONS.filter(l => l.module === moduleId);
}
