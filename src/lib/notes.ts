// Treble clef notes from top to bottom of the 5-line staff.
// Staff lines are at SVG y = 40, 60, 80, 100, 120 (spacing 20px).
// Each space between lines is 10px above/below the line.

export interface Note {
  id: string;
  name: string;
  yPos: number;
}

export const NOTES: Note[] = [
  { id: 'F5', name: 'F', yPos: 40 },   // Line 5 (top)
  { id: 'E5', name: 'E', yPos: 50 },   // Space 4
  { id: 'D5', name: 'D', yPos: 60 },   // Line 4
  { id: 'C5', name: 'C', yPos: 70 },   // Space 3
  { id: 'B4', name: 'B', yPos: 80 },   // Line 3 (middle)
  { id: 'A4', name: 'A', yPos: 90 },   // Space 2
  { id: 'G4', name: 'G', yPos: 100 },  // Line 2
  { id: 'F4', name: 'F', yPos: 110 },  // Space 1
  { id: 'E4', name: 'E', yPos: 120 }   // Line 1 (bottom)
];

// All 7 unique letter names used for generating answer choices
export const ALL_LETTERS: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
