// Reactive Svelte 5 wrapper around the MIDIInput class
// Exposes $state-based properties for use in Svelte components

import { MIDIInput, isMIDISupported, type MIDIDevice } from './midi-input';
import { midiToNoteName } from './pitch-detector';

class ReactiveMIDIInput {
  private midi = new MIDIInput();
  private unsubNoteOn: (() => void) | null = null;
  private unsubNoteOff: (() => void) | null = null;
  private unsubDeviceChange: (() => void) | null = null;

  // ── Reactive state ─────────────────────────────────────────────────────────

  /** Whether the Web MIDI API is available in this browser */
  isSupported = $state(isMIDISupported());

  /** Whether we have an active connection to a MIDI device */
  isConnected = $state(false);

  /** List of detected MIDI input devices */
  devices = $state<MIDIDevice[]>([]);

  /** The currently active MIDI device, or null */
  activeDevice = $state<MIDIDevice | null>(null);

  /** The last note-on event: { midiNote, velocity, noteName } */
  lastNoteOn = $state<{ midiNote: number; velocity: number; noteName: string } | null>(null);

  /** The last note-off event midiNote */
  lastNoteOff = $state<number | null>(null);

  /** Error message if something went wrong */
  error = $state<string | null>(null);

  /** Whether MIDI access has been requested (even if no device is connected) */
  hasAccess = $state(false);

  // ── Derived state ──────────────────────────────────────────────────────────

  /** Number of connected devices */
  readonly deviceCount = $derived(this.devices.filter(d => d.state === 'connected').length);

  /** Active device name, or empty string */
  readonly activeDeviceName = $derived(this.activeDevice?.name ?? '');

  // ── Note event callbacks (for external consumers like InputAdapter) ────────

  private noteOnCallbacks: Set<(midiNote: number, velocity: number) => void> = new Set();
  private noteOffCallbacks: Set<(midiNote: number) => void> = new Set();

  /**
   * Subscribe to note-on events. Returns unsubscribe function.
   */
  onNoteOn(callback: (midiNote: number, velocity: number) => void): () => void {
    this.noteOnCallbacks.add(callback);
    return () => { this.noteOnCallbacks.delete(callback); };
  }

  /**
   * Subscribe to note-off events. Returns unsubscribe function.
   */
  onNoteOff(callback: (midiNote: number) => void): () => void {
    this.noteOffCallbacks.add(callback);
    return () => { this.noteOffCallbacks.delete(callback); };
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /**
   * Request MIDI access and connect to the first available device.
   */
  async connect(): Promise<boolean> {
    if (!this.isSupported) {
      this.error = 'Web MIDI API is not supported in this browser';
      return false;
    }

    this.error = null;

    // Subscribe to events before requesting access
    this.unsubNoteOn = this.midi.onNoteOn((midiNote, velocity) => {
      const noteName = midiToNoteName(midiNote);
      this.lastNoteOn = { midiNote, velocity, noteName };
      // Forward to external subscribers
      for (const cb of this.noteOnCallbacks) {
        cb(midiNote, velocity);
      }
    });

    this.unsubNoteOff = this.midi.onNoteOff((midiNote) => {
      this.lastNoteOff = midiNote;
      for (const cb of this.noteOffCallbacks) {
        cb(midiNote);
      }
    });

    this.unsubDeviceChange = this.midi.onDeviceChange((devices) => {
      this.devices = devices;
      this.isConnected = this.midi.isConnected;
      this.activeDevice = this.midi.activeDevice;
    });

    const success = await this.midi.requestAccess();
    if (success) {
      this.hasAccess = true;
      this.devices = this.midi.devices;
      this.isConnected = this.midi.isConnected;
      this.activeDevice = this.midi.activeDevice;
    } else {
      this.error = 'Failed to access MIDI devices';
      this.cleanup();
    }

    return success;
  }

  /**
   * Switch to a specific MIDI device by ID.
   */
  selectDevice(deviceId: string): boolean {
    const success = this.midi.selectDevice(deviceId);
    if (success) {
      this.isConnected = true;
      this.activeDevice = this.midi.activeDevice;
    }
    return success;
  }

  /**
   * Disconnect from all MIDI devices.
   */
  disconnect(): void {
    this.cleanup();
    this.midi.disconnect();
    this.isConnected = false;
    this.activeDevice = null;
    this.devices = [];
    this.hasAccess = false;
    this.lastNoteOn = null;
    this.lastNoteOff = null;
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.cleanup();
    this.midi.destroy();
    this.noteOnCallbacks.clear();
    this.noteOffCallbacks.clear();
  }

  private cleanup(): void {
    this.unsubNoteOn?.();
    this.unsubNoteOff?.();
    this.unsubDeviceChange?.();
    this.unsubNoteOn = null;
    this.unsubNoteOff = null;
    this.unsubDeviceChange = null;
  }
}

export const reactiveMIDIInput = new ReactiveMIDIInput();
