// Web MIDI API input handler
// Provides note-on/note-off events from USB MIDI keyboards
// Supported in Chrome, Edge, Opera. Falls back gracefully in Firefox/Safari.

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
}

export type NoteOnCallback = (midiNote: number, velocity: number) => void;
export type NoteOffCallback = (midiNote: number) => void;
export type DeviceChangeCallback = (devices: MIDIDevice[]) => void;

// ── MIDI message constants ─────────────────────────────────────────────────────

// MIDI status bytes (upper nibble): channel is lower nibble (0x0–0xF)
const NOTE_ON_MASK = 0x90;   // 1001nnnn — Note On
const NOTE_OFF_MASK = 0x80;  // 1000nnnn — Note Off

/**
 * Parse a MIDI status byte to determine if it's a note-on or note-off message.
 * Returns the message type, or null if it's neither.
 */
export function parseMIDIStatus(status: number): 'noteOn' | 'noteOff' | null {
  const type = status & 0xf0; // mask off channel
  if (type === NOTE_ON_MASK) return 'noteOn';
  if (type === NOTE_OFF_MASK) return 'noteOff';
  return null;
}

// ── Browser support check ──────────────────────────────────────────────────────

/**
 * Check if the Web MIDI API is available in this browser.
 * Returns false in Firefox, Safari, and non-secure contexts.
 */
export function isMIDISupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
}

// ── MIDIInput class ────────────────────────────────────────────────────────────

export class MIDIInput {
  private midiAccess: MIDIAccess | null = null;
  private noteOnListeners: Set<NoteOnCallback> = new Set();
  private noteOffListeners: Set<NoteOffCallback> = new Set();
  private deviceChangeListeners: Set<DeviceChangeCallback> = new Set();
  private boundHandleMessage: (e: MIDIMessageEvent) => void;
  private boundHandleStateChange: (e: Event) => void;

  private _isConnected = false;
  private _devices: MIDIDevice[] = [];
  private _activeInputId: string | null = null;

  constructor() {
    this.boundHandleMessage = this.handleMessage.bind(this);
    this.boundHandleStateChange = this.handleStateChange.bind(this);
  }

  get isSupported(): boolean {
    return isMIDISupported();
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get devices(): MIDIDevice[] {
    return this._devices;
  }

  get activeDeviceId(): string | null {
    return this._activeInputId;
  }

  get activeDevice(): MIDIDevice | null {
    if (!this._activeInputId) return null;
    return this._devices.find(d => d.id === this._activeInputId) ?? null;
  }

  /**
   * Request MIDI access and start listening to the first available input device.
   * Returns true if successful, false if MIDI is not available.
   */
  async requestAccess(): Promise<boolean> {
    if (!isMIDISupported()) return false;

    try {
      this.midiAccess = await navigator.requestMIDIAccess();

      // Listen for device connect/disconnect
      this.midiAccess.addEventListener('statechange', this.boundHandleStateChange);

      // Discover initial devices and connect to the first one
      this.refreshDevices();
      this.connectToFirstAvailable();

      return true;
    } catch (err) {
      console.warn('[Klavier] MIDI access denied or failed:', err);
      return false;
    }
  }

  /**
   * Switch to a specific MIDI input device by ID.
   * Returns true if the device was found and connected.
   */
  selectDevice(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) return false;

    // Disconnect from current device
    this.disconnectCurrent();

    // Connect to new device
    input.addEventListener('midimessage', this.boundHandleMessage as EventListener);
    this._activeInputId = deviceId;
    this._isConnected = true;

    return true;
  }

  /**
   * Subscribe to MIDI note-on events.
   * Callback receives (midiNote: number, velocity: number).
   * Returns an unsubscribe function.
   */
  onNoteOn(callback: NoteOnCallback): () => void {
    this.noteOnListeners.add(callback);
    return () => { this.noteOnListeners.delete(callback); };
  }

  /**
   * Subscribe to MIDI note-off events.
   * Callback receives (midiNote: number).
   * Returns an unsubscribe function.
   */
  onNoteOff(callback: NoteOffCallback): () => void {
    this.noteOffListeners.add(callback);
    return () => { this.noteOffListeners.delete(callback); };
  }

  /**
   * Subscribe to device connect/disconnect events.
   * Callback receives the updated device list.
   * Returns an unsubscribe function.
   */
  onDeviceChange(callback: DeviceChangeCallback): () => void {
    this.deviceChangeListeners.add(callback);
    return () => { this.deviceChangeListeners.delete(callback); };
  }

  /**
   * Get the list of currently connected MIDI input devices.
   */
  getConnectedDevices(): MIDIDevice[] {
    return this._devices.filter(d => d.state === 'connected');
  }

  /**
   * Disconnect from all devices and release MIDI access.
   */
  disconnect(): void {
    this.disconnectCurrent();

    if (this.midiAccess) {
      this.midiAccess.removeEventListener('statechange', this.boundHandleStateChange);
      this.midiAccess = null;
    }

    this._devices = [];
    this._isConnected = false;
  }

  /**
   * Clean up all resources and listeners.
   */
  destroy(): void {
    this.disconnect();
    this.noteOnListeners.clear();
    this.noteOffListeners.clear();
    this.deviceChangeListeners.clear();
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private handleMessage(e: MIDIMessageEvent): void {
    const data = e.data;
    if (!data || data.length < 3) return;

    const status = data[0];
    const note = data[1];
    const velocity = data[2];
    const type = parseMIDIStatus(status);

    if (type === 'noteOn' && velocity > 0) {
      // Note On with velocity > 0
      for (const listener of this.noteOnListeners) {
        listener(note, velocity);
      }
    } else if (type === 'noteOff' || (type === 'noteOn' && velocity === 0)) {
      // Note Off, or Note On with velocity 0 (some keyboards send this instead)
      for (const listener of this.noteOffListeners) {
        listener(note);
      }
    }
  }

  private handleStateChange(_e: Event): void {
    this.refreshDevices();

    // If our active device disconnected, try to connect to another
    if (this._activeInputId) {
      const activeDevice = this._devices.find(d => d.id === this._activeInputId);
      if (!activeDevice || activeDevice.state === 'disconnected') {
        this._activeInputId = null;
        this._isConnected = false;
        this.connectToFirstAvailable();
      }
    } else {
      // No active device — try connecting
      this.connectToFirstAvailable();
    }

    // Notify listeners
    for (const listener of this.deviceChangeListeners) {
      listener(this._devices);
    }
  }

  private refreshDevices(): void {
    if (!this.midiAccess) {
      this._devices = [];
      return;
    }

    this._devices = [];
    for (const [id, input] of this.midiAccess.inputs) {
      this._devices.push({
        id,
        name: input.name ?? 'Unknown MIDI Device',
        manufacturer: input.manufacturer ?? 'Unknown',
        state: input.state as 'connected' | 'disconnected',
      });
    }
  }

  private connectToFirstAvailable(): void {
    if (!this.midiAccess) return;

    for (const [id, input] of this.midiAccess.inputs) {
      if (input.state === 'connected') {
        input.addEventListener('midimessage', this.boundHandleMessage as EventListener);
        this._activeInputId = id;
        this._isConnected = true;
        return;
      }
    }

    // No connected devices
    this._isConnected = false;
  }

  private disconnectCurrent(): void {
    if (!this.midiAccess || !this._activeInputId) return;

    const currentInput = this.midiAccess.inputs.get(this._activeInputId);
    if (currentInput) {
      currentInput.removeEventListener('midimessage', this.boundHandleMessage as EventListener);
    }

    this._activeInputId = null;
    this._isConnected = false;
  }
}

// ── Singleton instance ─────────────────────────────────────────────────────────

export const midiInput = new MIDIInput();
