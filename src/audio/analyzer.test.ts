import { describe, expect, it, vi } from "vitest";
import { startAnalyzerSession } from "./analyzer";
import type { AudioRuntime } from "./microphone";

function makeAnalyzerRuntime() {
  const track = { stop: vi.fn() };
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  const timeValues = new Float32Array(16_384).fill(0.25);
  const frequencyValues = new Float32Array(8_192).fill(-90);
  const analyser = {
    fftSize: 16_384,
    frequencyBinCount: 8_192,
    smoothingTimeConstant: 0,
    minDecibels: -100,
    maxDecibels: -10,
    getFloatTimeDomainData: vi.fn((values: Float32Array) => values.set(timeValues)),
    getFloatFrequencyData: vi.fn((values: Float32Array) => values.set(frequencyValues)),
    disconnect: vi.fn(),
  } as unknown as AnalyserNode;
  const contextState = { value: "running" as AudioContextState };
  const context = {
    get state() {
      return contextState.value;
    },
    sampleRate: 48_000,
    currentTime: 1.25,
    createMediaStreamSource: vi.fn(() => source),
    createAnalyser: vi.fn(() => analyser),
    close: vi.fn(async () => {
      contextState.value = "closed";
    }),
  } as unknown as AudioContext;
  const runtime: AudioRuntime = {
    getUserMedia: vi.fn().mockResolvedValue(stream),
    createAudioContext: vi.fn(() => context),
  };
  return { runtime, context, source, analyser, track, timeValues, frequencyValues };
}

describe("live analyzer audio session", () => {
  it("connects a user-started microphone to an unmonitored analyser and reads both domains", async () => {
    const fake = makeAnalyzerRuntime();
    const session = await startAnalyzerSession(fake.runtime);

    expect(fake.runtime.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(fake.context.createAnalyser).toHaveBeenCalledOnce();
    expect(fake.source.connect).toHaveBeenCalledWith(fake.analyser);
    expect(fake.analyser.fftSize).toBe(16_384);
    expect(session.startedAtContextTime).toBe(1.25);

    const snapshot = session.read();
    expect(snapshot.sampleRate).toBe(48_000);
    expect(snapshot.contextTime).toBe(1.25);
    expect(snapshot.fftSize).toBe(16_384);
    expect(snapshot.timeDomain[0]).toBeCloseTo(0.25, 5);
    expect(snapshot.frequencyDbfs[0]).toBe(-90);

    await session.stop();
    expect(fake.analyser.disconnect).toHaveBeenCalledOnce();
    expect(fake.source.disconnect).toHaveBeenCalledOnce();
    expect(fake.track.stop).toHaveBeenCalledOnce();
    expect(fake.context.close).toHaveBeenCalledOnce();
  });

  it("cleans up microphone resources if analyser creation fails", async () => {
    const fake = makeAnalyzerRuntime();
    fake.context.createAnalyser = vi.fn(() => {
      throw new Error("Analyser unavailable");
    });

    await expect(startAnalyzerSession(fake.runtime)).rejects.toThrow("Analyser unavailable");
    expect(fake.source.disconnect).toHaveBeenCalledOnce();
    expect(fake.track.stop).toHaveBeenCalledOnce();
    expect(fake.context.close).toHaveBeenCalledOnce();
  });
});
