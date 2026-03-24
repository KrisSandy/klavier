# Klavier

A free, browser-based piano learning app. 18 interactive lessons covering music theory, keyboard skills, rhythm, chords, sight-reading, and expression — all running locally in your browser with no account required.

## Features

- 18 structured lessons across 6 modules (beginner to intermediate)
- Interactive virtual keyboard with keyboard shortcut support
- Music theory quizzes with instant feedback
- 10 playable songs with staff notation
- Metronome, rhythm trainer, ear training, and sight-reading exercises
- Progress tracking with streaks (stored locally, GDPR-compliant)
- Fully accessible: keyboard navigation, screen reader support, skip links, focus management

## Tech Stack

- Svelte 5 (runes syntax), Vite 6, TypeScript, Tailwind CSS v4
- Web Audio API piano synth (no external audio libraries)
- Vitest for testing
- Deployed on Vercel

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run test       # Run tests once
npm run test:watch # Run tests in watch mode
npm run check      # TypeScript type-check
```

## Project Structure

```
src/
├── pages/          # Route pages (Home, Practice, Songs, Settings, Privacy, Terms)
├── lessons/        # 18 lesson components (lazy-loaded)
├── components/     # Shared UI (keyboard, staff, quiz engine, sidebar, etc.)
├── stores/         # State management (progress, consent, audio, sidebar)
├── data/           # Static data (lessons, notes, songs)
└── __tests__/      # Vitest test files
```

## License

All rights reserved.
