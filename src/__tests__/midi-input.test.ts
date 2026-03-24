import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseMIDIStatus, isMIDISupported, MIDIInput } from '../stores/midi-input';

// ── parseMIDIStatus ─────────────────────────────────────────────────────────

describe('parseMIDIStatus', () => {
  it('recognizes Note On messages (0x90–0x9F)', () => {
    expect(parseMIDIStatus(0x90)).toBe('noteOn');  // channel 0
    expect(parseMIDIStatus(0x91)).toBe('noteOn');  // channel 1
    expect(parseMIDIStatus(0x9f)).toBe('noteOn');  // channel 15
  });

  it('recognizes Note Off messages (0x80–0x8F)', () => {
    expect(parseMIDIStatus(0x80)).toBe('noteOff'); // channel 0
    expect(parseMIDIStatus(0x85)).toBe('noteOff'); // channel 5
    expect(parseMIDIStatus(0x8f)).toBe('noteOff'); // channel 15
  });

  it('returns null for other MIDI messages', () => {
    expect(parseMIDIStatus(0xa0)).toBeNull(); // Polyphonic aftertouch
    expect(parseMIDIStatus(0xb0)).toBeNull(); // Control change
    expect(parseMIDIStatus(0xc0)).toBeNull(); // Program change
    expect(parseMIDIStatus(0xd0)).toBeNull(); // Channel aftertouch
    expect(parseMIDIStatus(0xe0)).toBeNull(); // Pitch bend
    expect(parseMIDIStatus(0xf0)).toBeNull(); // System exclusive
    expect(parseMIDIStatus(0x00)).toBeNull(); // Invalid
  });
});

// ── isMIDISupported ─────────────────────────────────────────────────────────

describe('isMIDISupported', () => {
  it('returns false when navigator.requestMIDIAccess is not a function', () => {
    // jsdom does not implement Web MIDI
    expect(isMIDISupported()).toBe(false);
  });
});

// ── MIDIInput class with mocked Web MIDI API ────────────────────────────────

// Mock types matching the Web MIDI API shape
interface MockMIDIInput {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

interface MockMIDIAccess {
  inputs: Map<string, MockMIDIInput>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function createMockMIDIInput(id: string, name: string, state = 'connected'): MockMIDIInput {
  return {
    id,
    name,
    manufacturer: 'Test',
    state,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

function createMockMIDIAccess(inputs: MockMIDIInput[] = []): MockMIDIAccess {
  const inputMap = new Map<string, MockMIDIInput>();
  for (const input of inputs) {
    inputMap.set(input.id, input);
  }
  return {
    inputs: inputMap,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('MIDIInput', () => {
  let originalRequestMIDIAccess: typeof navigator.requestMIDIAccess;

  beforeEach(() => {
    // Save original
    originalRequestMIDIAccess = navigator.requestMIDIAccess;
  });

  afterEach(() => {
    // Restore original
    if (originalRequestMIDIAccess) {
      navigator.requestMIDIAccess = originalRequestMIDIAccess;
    } else {
      // @ts-expect-error — removing mock
      delete navigator.requestMIDIAccess;
    }
  });

  it('requestAccess returns false when MIDI is not supported', async () => {
    const midi = new MIDIInput();
    // jsdom doesn't have requestMIDIAccess
    const result = await midi.requestAccess();
    expect(result).toBe(false);
    expect(midi.isConnected).toBe(false);
  });

  it('requestAccess connects to the first available device', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    // Mock the API
    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    const result = await midi.requestAccess();

    expect(result).toBe(true);
    expect(midi.isConnected).toBe(true);
    expect(midi.devices).toHaveLength(1);
    expect(midi.devices[0].name).toBe('Test Piano');
    expect(midi.activeDeviceId).toBe('input-1');

    // Should have attached a midimessage listener
    expect(mockInput.addEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    );

    midi.destroy();
  });

  it('discovers multiple devices', async () => {
    const input1 = createMockMIDIInput('input-1', 'Piano A');
    const input2 = createMockMIDIInput('input-2', 'Piano B');
    const mockAccess = createMockMIDIAccess([input1, input2]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    await midi.requestAccess();

    expect(midi.devices).toHaveLength(2);
    // Should connect to first one
    expect(midi.activeDeviceId).toBe('input-1');

    midi.destroy();
  });

  it('selectDevice switches to a different device', async () => {
    const input1 = createMockMIDIInput('input-1', 'Piano A');
    const input2 = createMockMIDIInput('input-2', 'Piano B');
    const mockAccess = createMockMIDIAccess([input1, input2]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    await midi.requestAccess();

    expect(midi.activeDeviceId).toBe('input-1');

    const switched = midi.selectDevice('input-2');
    expect(switched).toBe(true);
    expect(midi.activeDeviceId).toBe('input-2');

    // Should have disconnected from input-1
    expect(input1.removeEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    );
    // Should have connected to input-2
    expect(input2.addEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    );

    midi.destroy();
  });

  it('selectDevice returns false for non-existent device', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    await midi.requestAccess();

    const switched = midi.selectDevice('non-existent');
    expect(switched).toBe(false);
    expect(midi.activeDeviceId).toBe('input-1'); // unchanged

    midi.destroy();
  });

  it('fires noteOn callbacks on MIDI noteOn messages', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    const noteOnSpy = vi.fn();
    midi.onNoteOn(noteOnSpy);

    await midi.requestAccess();

    // Get the midimessage handler that was registered
    const messageHandler = mockInput.addEventListener.mock.calls.find(
      (call: [string, Function]) => call[0] === 'midimessage',
    )?.[1] as (e: { data: Uint8Array }) => void;

    expect(messageHandler).toBeDefined();

    // Simulate a Note On: channel 0, note 60 (C4), velocity 100
    messageHandler({ data: new Uint8Array([0x90, 60, 100]) });

    expect(noteOnSpy).toHaveBeenCalledWith(60, 100);

    midi.destroy();
  });

  it('fires noteOff callbacks on MIDI noteOff messages', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    const noteOffSpy = vi.fn();
    midi.onNoteOff(noteOffSpy);

    await midi.requestAccess();

    const messageHandler = mockInput.addEventListener.mock.calls.find(
      (call: [string, Function]) => call[0] === 'midimessage',
    )?.[1] as (e: { data: Uint8Array }) => void;

    // Simulate a Note Off: channel 0, note 60 (C4)
    messageHandler({ data: new Uint8Array([0x80, 60, 0]) });

    expect(noteOffSpy).toHaveBeenCalledWith(60);

    midi.destroy();
  });

  it('treats noteOn with velocity 0 as noteOff', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    const noteOnSpy = vi.fn();
    const noteOffSpy = vi.fn();
    midi.onNoteOn(noteOnSpy);
    midi.onNoteOff(noteOffSpy);

    await midi.requestAccess();

    const messageHandler = mockInput.addEventListener.mock.calls.find(
      (call: [string, Function]) => call[0] === 'midimessage',
    )?.[1] as (e: { data: Uint8Array }) => void;

    // Note On with velocity 0 = Note Off (common on many keyboards)
    messageHandler({ data: new Uint8Array([0x90, 60, 0]) });

    expect(noteOnSpy).not.toHaveBeenCalled();
    expect(noteOffSpy).toHaveBeenCalledWith(60);

    midi.destroy();
  });

  it('ignores non-note MIDI messages', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    const noteOnSpy = vi.fn();
    const noteOffSpy = vi.fn();
    midi.onNoteOn(noteOnSpy);
    midi.onNoteOff(noteOffSpy);

    await midi.requestAccess();

    const messageHandler = mockInput.addEventListener.mock.calls.find(
      (call: [string, Function]) => call[0] === 'midimessage',
    )?.[1] as (e: { data: Uint8Array }) => void;

    // Control Change (0xB0) — should be ignored
    messageHandler({ data: new Uint8Array([0xb0, 64, 127]) });
    // Program Change (0xC0) — should be ignored
    messageHandler({ data: new Uint8Array([0xc0, 1, 0]) });

    expect(noteOnSpy).not.toHaveBeenCalled();
    expect(noteOffSpy).not.toHaveBeenCalled();

    midi.destroy();
  });

  it('handles short messages gracefully', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    const noteOnSpy = vi.fn();
    midi.onNoteOn(noteOnSpy);

    await midi.requestAccess();

    const messageHandler = mockInput.addEventListener.mock.calls.find(
      (call: [string, Function]) => call[0] === 'midimessage',
    )?.[1] as (e: { data: Uint8Array }) => void;

    // Message too short (< 3 bytes) — should be ignored
    messageHandler({ data: new Uint8Array([0x90, 60]) });
    messageHandler({ data: new Uint8Array([0x90]) });
    messageHandler({ data: new Uint8Array([]) });

    expect(noteOnSpy).not.toHaveBeenCalled();

    midi.destroy();
  });

  it('unsubscribe removes listener', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    const spy = vi.fn();
    const unsub = midi.onNoteOn(spy);

    await midi.requestAccess();

    const messageHandler = mockInput.addEventListener.mock.calls.find(
      (call: [string, Function]) => call[0] === 'midimessage',
    )?.[1] as (e: { data: Uint8Array }) => void;

    // Fire one event
    messageHandler({ data: new Uint8Array([0x90, 60, 100]) });
    expect(spy).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsub();

    // Fire another — should NOT call the spy
    messageHandler({ data: new Uint8Array([0x90, 64, 100]) });
    expect(spy).toHaveBeenCalledTimes(1);

    midi.destroy();
  });

  it('disconnect cleans up resources', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    await midi.requestAccess();

    expect(midi.isConnected).toBe(true);

    midi.disconnect();

    expect(midi.isConnected).toBe(false);
    expect(midi.devices).toHaveLength(0);
    expect(midi.activeDeviceId).toBeNull();

    // Should have removed the midimessage listener
    expect(mockInput.removeEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    );
    // Should have removed the statechange listener
    expect(mockAccess.removeEventListener).toHaveBeenCalledWith(
      'statechange',
      expect.any(Function),
    );
  });

  it('getConnectedDevices filters by connection state', async () => {
    const connected = createMockMIDIInput('input-1', 'Connected Piano', 'connected');
    const disconnected = createMockMIDIInput('input-2', 'Disconnected Piano', 'disconnected');
    const mockAccess = createMockMIDIAccess([connected, disconnected]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    await midi.requestAccess();

    const connectedDevices = midi.getConnectedDevices();
    expect(connectedDevices).toHaveLength(1);
    expect(connectedDevices[0].name).toBe('Connected Piano');

    midi.destroy();
  });

  it('requestAccess returns false when permission is denied', async () => {
    navigator.requestMIDIAccess = vi.fn().mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'));

    const midi = new MIDIInput();
    const result = await midi.requestAccess();

    expect(result).toBe(false);
    expect(midi.isConnected).toBe(false);

    midi.destroy();
  });

  it('handles MIDI messages on different channels', async () => {
    const mockInput = createMockMIDIInput('input-1', 'Test Piano');
    const mockAccess = createMockMIDIAccess([mockInput]);

    navigator.requestMIDIAccess = vi.fn().mockResolvedValue(mockAccess);

    const midi = new MIDIInput();
    const noteOnSpy = vi.fn();
    midi.onNoteOn(noteOnSpy);

    await midi.requestAccess();

    const messageHandler = mockInput.addEventListener.mock.calls.find(
      (call: [string, Function]) => call[0] === 'midimessage',
    )?.[1] as (e: { data: Uint8Array }) => void;

    // Note On on channel 5 (0x95)
    messageHandler({ data: new Uint8Array([0x95, 72, 80]) });

    expect(noteOnSpy).toHaveBeenCalledWith(72, 80);

    midi.destroy();
  });
});
