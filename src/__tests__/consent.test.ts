import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('consent store', () => {
  beforeEach(() => {
    // Clear localStorage and reset module
    localStorage.clear();
    vi.resetModules();
  });

  it('starts in pending state when no consent stored', async () => {
    const { consent } = await import('../stores/consent.svelte');
    expect(consent.isPending).toBe(true);
    expect(consent.hasConsented).toBe(false);
    expect(consent.hasDeclined).toBe(false);
  });

  it('accept() transitions to accepted', async () => {
    const { consent } = await import('../stores/consent.svelte');
    consent.accept();
    expect(consent.hasConsented).toBe(true);
    expect(consent.isPending).toBe(false);
    expect(consent.hasDeclined).toBe(false);
  });

  it('accept() persists to localStorage', async () => {
    const { consent } = await import('../stores/consent.svelte');
    consent.accept();
    const raw = localStorage.getItem('klavier-consent');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.status).toBe('accepted');
    expect(parsed.version).toBe(consent.policyVersion);
    expect(parsed.date).toBeTruthy();
  });

  it('decline() transitions to declined', async () => {
    const { consent } = await import('../stores/consent.svelte');
    consent.decline();
    expect(consent.hasDeclined).toBe(true);
    expect(consent.hasConsented).toBe(false);
    expect(consent.isPending).toBe(false);
  });

  it('decline() clears progress data from localStorage', async () => {
    localStorage.setItem('klavier-progress', '{"test": true}');
    const { consent } = await import('../stores/consent.svelte');
    consent.decline();
    expect(localStorage.getItem('klavier-progress')).toBeNull();
  });

  it('revoke() returns to pending and clears all data', async () => {
    const { consent } = await import('../stores/consent.svelte');
    consent.accept();
    localStorage.setItem('klavier-progress', '{"test": true}');

    consent.revoke();
    expect(consent.isPending).toBe(true);
    expect(localStorage.getItem('klavier-consent')).toBeNull();
    expect(localStorage.getItem('klavier-progress')).toBeNull();
  });

  it('loads existing accepted consent from localStorage', async () => {
    localStorage.setItem('klavier-consent', JSON.stringify({
      status: 'accepted',
      date: new Date().toISOString(),
      version: '1.0',
    }));
    const { consent } = await import('../stores/consent.svelte');
    expect(consent.hasConsented).toBe(true);
  });

  it('re-prompts when policy version changes', async () => {
    // Simulate consent with an older version
    localStorage.setItem('klavier-consent', JSON.stringify({
      status: 'accepted',
      date: new Date().toISOString(),
      version: '0.9', // different from CURRENT_POLICY_VERSION
    }));
    const { consent } = await import('../stores/consent.svelte');
    // Should reset to pending because version mismatch
    expect(consent.isPending).toBe(true);
    expect(consent.hasConsented).toBe(false);
  });
});
