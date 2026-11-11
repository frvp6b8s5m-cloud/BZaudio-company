import { describe, expect, it, vi } from "vitest";
import {
  generatePinkNoiseSamples,
  generateWhiteNoiseSamples,
} from "./noise";
import {
  startNoiseSession,
  startSweepSession,
  startToneSession,
  type AudioOutputRuntime,
} from "./output";

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function createFakeRuntime(): {
  runtime: AudioOutputRuntime;
  context: AudioContext;
  oscillator: OscillatorNode;
  bufferSource: AudioBufferSourceNode;
  gain: GainNode;
  buffer: AudioBuffer;
} {
  const setValueCurveAtTime = vi.fn();
  const oscillator = {
    type: "sine",
    frequency: {
      setValueAtTime: vi.fn(),
      setValueCurveAtTime,
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as OscillatorNode["onended"],
  } as unknown as OscillatorNode;

  const bufferSource = {
    buffer: null as AudioBuffer | null,
    loop: false,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as AudioBufferSourceNode["onended"],
  } as unknown as AudioBufferSourceNode;

  const gain = {
    gain: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
  } as unknown as GainNode;

  const samples = new Float32Array(96_000);
  const buffer = {
    getChannelData: vi.fn(() => samples),
  } as unknown as AudioBuffer;

  const contextState = { value: "suspended" as AudioContextState };
  const context = {
    get state() {
      return contextState.value;
    },
    sampleRate: 48_000,
    currentTime: 10,
    destination: {},
    resume: vi.fn(async () => {
      contextState.value = "running";
    }),
    close: vi.fn(async () => {
      contextState.value = "closed";
    }),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
    createBuffer: vi.fn(() => buffer),
    createBufferSource: vi.fn(() => bufferSource),
  } as unknown as AudioContext;

  oscillator.stop = vi.fn(() => {
    oscillator.onended?.call(oscillator, new Event("ended"));
  });
  bufferSource.stop = vi.fn(() => {
    bufferSource.onended?.call(bufferSource, new Event("ended"));
  });

  return {
    runtime: { createAudioContext: () => context, random: seededRandom(42) },
    context,
    oscillator,
    bufferSource,
    gain,
    buffer,
    setValueCurveAtTime,
  };
}

describe("noise sample generation", () => {
  it("creates deterministic white noise in the normalized sample range", () => {
    const samples = generateWhiteNoiseSamples(4, () => 0.75);
    expect(Array.from(samples)).toEqual([0.5, 0.5, 0.5, 0.5]);
  });

  it("creates repeatable, finite pink noise bounded to a safe buffer peak", () => {
    const first = generatePinkNoiseSamples(2048, seededRandom(7));
    const second = generatePinkNoiseSamples(2048, seededRandom(7));
    expect(Array.from(first)).toEqual(Array.from(second));
    expect(first.length).toBe(2048);
    expect(Array.from(first).every(Number.isFinite)).toBe(true);
    expect(Math.max(...Array.from(first, Math.abs))).toBeLessThanOrEqual(0.8);
  });

  it("rejects invalid sample counts and invalid random sources", () => {
    expect(() => generateWhiteNoiseSamples(0)).toThrow(RangeError);
    expect(() => generatePinkNoiseSamples(-2)).toThrow(RangeError);
    expect(() => generateWhiteNoiseSamples(2, () => 1.5)).toThrow(RangeError);
  });
});

describe("Web Audio output sessions", () => {
  it("starts a selected oscillator waveform at the requested frequency and level", async () => {
    const fake = createFakeRuntime();
    const session = await startToneSession(
      { frequencyHz: 1000, waveform: "square", levelDbfs: -20 },
      fake.runtime,
    );

    expect(fake.context.resume).toHaveBeenCalledOnce();
    expect(fake.oscillator.type).toBe("square");
    expect(fake.oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(1000, 10);
    expect(fake.gain.gain.setValueAtTime).toHaveBeenCalledWith(0.1, 10);
    expect(fake.oscillator.start).toHaveBeenCalledOnce();

    await session.stop();
    await session.stop();
    expect(fake.oscillator.stop).toHaveBeenCalledOnce();
    expect(fake.context.close).toHaveBeenCalledOnce();
  });

  it("rejects unsupported frequency, waveform level, and invalid ranges", async () => {
    const fake = createFakeRuntime();
    await expect(
      startToneSession({ frequencyHz: 0, waveform: "sine", levelDbfs: -20 }, fake.runtime),
    ).rejects.toThrow(RangeError);
    await expect(
      startToneSession({ frequencyHz: 24_001, waveform: "sine", levelDbfs: -20 }, fake.runtime),
    ).rejects.toThrow(RangeError);
    await expect(
      startToneSession({ frequencyHz: 1000, waveform: "sine", levelDbfs: 1 }, fake.runtime),
    ).rejects.toThrow(RangeError);
  });

  it("creates a looping noise buffer and closes its context on stop", async () => {
    const fake = createFakeRuntime();
    const session = await startNoiseSession("white", -20, fake.runtime);

    expect(fake.context.createBuffer).toHaveBeenCalledWith(1, 96_000, 48_000);
    expect(fake.bufferSource.loop).toBe(true);
    expect(fake.bufferSource.buffer).toBe(fake.buffer);
    expect(fake.bufferSource.start).toHaveBeenCalledOnce();
    expect(fake.gain.gain.setValueAtTime).toHaveBeenCalledWith(0.1, 10);

    await session.stop();
    expect(fake.bufferSource.stop).toHaveBeenCalledOnce();
    expect(fake.context.close).toHaveBeenCalledOnce();
  });

  it("schedules a logarithmic frequency sweep and an automatic stop", async () => {
    const fake = createFakeRuntime();
    const session = await startSweepSession(
      {
        startFrequencyHz: 20,
        endFrequencyHz: 20_000,
        durationSeconds: 5,
        levelDbfs: -20,
      },
      fake.runtime,
    );

    const curve = fake.setValueCurveAtTime.mock.calls[0][0] as Float32Array;
    expect(curve.length).toBe(128);
    expect(curve[0]).toBeCloseTo(20, 3);
    expect(curve[curve.length - 1]).toBeCloseTo(20_000, 1);
    expect(fake.setValueCurveAtTime).toHaveBeenCalledWith(curve, 10, 5);
    expect(fake.oscillator.stop).toHaveBeenCalledWith(15);

    await session.stop();
    expect(fake.context.close).toHaveBeenCalledOnce();
  });

  it("rejects equal sweep limits and invalid duration", async () => {
    const fake = createFakeRuntime();
    await expect(
      startSweepSession(
        { startFrequencyHz: 100, endFrequencyHz: 100, durationSeconds: 5, levelDbfs: -20 },
        fake.runtime,
      ),
    ).rejects.toThrow(RangeError);
    await expect(
      startSweepSession(
        { startFrequencyHz: 20, endFrequencyHz: 20_000, durationSeconds: 0, levelDbfs: -20 },
        fake.runtime,
      ),
    ).rejects.toThrow(RangeError);
  });
});
