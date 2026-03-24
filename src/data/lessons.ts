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
  { id: 1, name: 'The Keyboard & First Notes', lessons: [1, 2, 3, 4] },
  { id: 2, name: 'Both Hands & Scales', lessons: [5, 6, 7] },
  { id: 3, name: 'Rhythm & Dynamics', lessons: [8, 9, 10] },
  { id: 4, name: 'Chords & Harmony', lessons: [11, 12, 13] },
  { id: 5, name: 'Sight-Reading & Fluency', lessons: [14, 15, 16] },
  { id: 6, name: 'Expression & Performance', lessons: [17, 18, 19] },
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
    title: 'Finger Numbers & Hand Position',
    subtitle: 'The universal finger numbering system and C position',
    module: 1,
    moduleName: 'The Keyboard & First Notes',
    objectives: [
      'Know the finger numbering system (1–5) for both hands',
      'Understand proper hand position and curved fingers',
      'Play in C position with the right and left hand',
      'Read finger numbers in sheet music',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: false,
  },
  {
    id: 3,
    slug: 'lesson-3',
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
    id: 4,
    slug: 'lesson-4',
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
    id: 5,
    slug: 'lesson-5',
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
    id: 6,
    slug: 'lesson-6',
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
    id: 7,
    slug: 'lesson-7',
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
  {
    id: 8,
    slug: 'lesson-8',
    title: 'Eighth Notes & Counting',
    subtitle: 'Subdividing beats into eighth notes',
    module: 3,
    moduleName: 'Rhythm & Dynamics',
    objectives: [
      'Subdivide beats into eighth notes',
      'Count 1-and-2-and patterns',
      'Clap and tap rhythms accurately',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: false,
  },
  {
    id: 9,
    slug: 'lesson-9',
    title: 'Time Signatures',
    subtitle: 'Understanding 4/4, 3/4, and 6/8',
    module: 3,
    moduleName: 'Rhythm & Dynamics',
    objectives: [
      'Understand 4/4, 3/4, and 6/8 time signatures',
      'Recognize time signature changes',
      'Feel the difference between duple and triple meter',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 10,
    slug: 'lesson-10',
    title: 'Dynamics & Expression',
    subtitle: 'Playing with varying velocity and expression',
    module: 3,
    moduleName: 'Rhythm & Dynamics',
    objectives: [
      'Understand dynamic markings (piano, forte, mezzo-piano)',
      'Play with varying velocity',
      'Add expression to a musical piece',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 11,
    slug: 'lesson-11',
    title: 'Building Chords',
    subtitle: 'Major triads and chord tones',
    module: 4,
    moduleName: 'Chords & Harmony',
    objectives: [
      'Build major triads from root-third-fifth',
      'Play C, F, and G major chords',
      'Identify chord tones on the keyboard',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: false,
  },
  {
    id: 12,
    slug: 'lesson-12',
    title: 'Chord Progressions',
    subtitle: 'Common progressions and harmonic movement',
    module: 4,
    moduleName: 'Chords & Harmony',
    objectives: [
      'Play I-IV-V-I progression',
      'Recognize common progressions by ear',
      'Play a song with chord accompaniment',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 13,
    slug: 'lesson-13',
    title: 'Minor Chords & Keys',
    subtitle: 'Building and playing minor triads',
    module: 4,
    moduleName: 'Chords & Harmony',
    objectives: [
      'Build minor triads',
      'Distinguish major from minor by ear',
      'Play Am, Dm, and Em chords',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 14,
    slug: 'lesson-14',
    title: 'Sight-Reading Basics',
    subtitle: 'Reading music fluently at first sight',
    module: 5,
    moduleName: 'Sight-Reading & Fluency',
    objectives: [
      'Scan ahead while playing to anticipate notes',
      'Recognise common melodic patterns at a glance',
      'Build speed and confidence reading new music',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: false,
  },
  {
    id: 15,
    slug: 'lesson-15',
    title: 'Key Signatures',
    subtitle: 'Sharps, flats, and the circle of fifths',
    module: 5,
    moduleName: 'Sight-Reading & Fluency',
    objectives: [
      'Understand how key signatures work',
      'Identify common key signatures (up to 3 sharps/flats)',
      'Apply key signatures when reading music',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: false,
  },
  {
    id: 16,
    slug: 'lesson-16',
    title: 'Intervals',
    subtitle: 'Recognising and playing intervals from 2nds to octaves',
    module: 5,
    moduleName: 'Sight-Reading & Fluency',
    objectives: [
      'Name intervals from unison to octave',
      'Hear and identify intervals by ear',
      'Play intervals on the keyboard',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 17,
    slug: 'lesson-17',
    title: 'Pedaling & Sustain',
    subtitle: 'Using the sustain pedal for expression',
    module: 6,
    moduleName: 'Expression & Performance',
    objectives: [
      'Understand how the sustain pedal works',
      'Learn basic pedaling technique',
      'Apply sustain to create a legato sound',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 18,
    slug: 'lesson-18',
    title: 'Musical Form',
    subtitle: 'Understanding structure in music',
    module: 6,
    moduleName: 'Expression & Performance',
    objectives: [
      'Identify ABA and verse-chorus form',
      'Recognise repeated sections and variations',
      'Understand how form creates musical narrative',
    ],
    hasQuiz: true,
    hasPractice: true,
    hasSong: true,
  },
  {
    id: 19,
    slug: 'lesson-19',
    title: 'Putting It All Together',
    subtitle: 'A complete performance combining everything you\'ve learned',
    module: 6,
    moduleName: 'Expression & Performance',
    objectives: [
      'Combine reading, rhythm, dynamics, and chords',
      'Perform a complete piece with expression',
      'Plan your own practice routine going forward',
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
