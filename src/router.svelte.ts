// Simple hash router for Svelte 5
// Routes: #/ (home), #/lesson-1, #/lesson-2, ..., #/practice

// Reactive route state using module-level $state
// Since $state can only be used at component top-level or in classes,
// we'll use a class-based approach

class Router {
  current = $state(window.location.hash.slice(1) || '/');

  constructor() {
    window.addEventListener('hashchange', () => {
      this.current = window.location.hash.slice(1) || '/';
    });
  }

  navigate(path: string) {
    window.location.hash = path;
  }

  get isHome() {
    return this.current === '/' || this.current === '';
  }

  get isPractice() {
    return this.current === '/practice';
  }

  get lessonSlug(): string | null {
    const match = this.current.match(/^\/?lesson-(\d+)$/);
    return match ? `lesson-${match[1]}` : null;
  }

  get lessonId(): number | null {
    const match = this.current.match(/^\/?lesson-(\d+)$/);
    return match ? parseInt(match[1]) : null;
  }

  get isSongs() {
    return this.current === '/songs' || this.current.startsWith('/songs/');
  }

  get songSlug(): string | null {
    const match = this.current.match(/^\/?songs\/(.+)$/);
    return match ? match[1] : null;
  }

  get isPrivacy() {
    return this.current === '/privacy';
  }

  get isTerms() {
    return this.current === '/terms';
  }

  get isSettings() {
    return this.current === '/settings';
  }
}

export const router = new Router();
