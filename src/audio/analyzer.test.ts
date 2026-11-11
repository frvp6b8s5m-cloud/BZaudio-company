import { describe, expect, it, vi } from "vitest";
import { startAnalyzerSession, startStereoAnalyzerSession } from "./analyzer";
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


describe("stereo analyzer audio session", () => {
  function makeStereoRuntime(channelCount: number) {
    const leftTrack = { stop: vi.fn(), getSettings: () => ({ channelCount }) };
    const stream = {
      getTracks: () => [leftTrack],
      getAudioTracks: () => [leftTrack],
    } as unknown as MediaStream;
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const splitter = { connect: vi.fn(), disconnect: vi.fn() };
    const makeChannelAnalyser = () => ({
      fftSize: 16_384,
      frequencyBinCount: 8_192,
      smoothingTimeConstant: 0,
      minDecibels: -100,
      maxDecibels: 0,
      getFloatTimeDomainData: vi.fn((values: Float32Array) => values.fill(0.5)),
      getFloatFrequencyData: vi.fn((values: Float32Array) => values.fill(-70)),
      disconnect: vi.fn(),
    }) as unknown as AnalyserNode;
    const leftAnalyser = makeChannelAnalyser();
    const rightAnalyser = makeChannelAnalyser();
    const contextState = { value: "running" as AudioContextState };
    const context = {
      get state() { return contextState.value; },
      sampleRate: 48_000,
      currentTime: 2,
      createMediaStreamSource: vi.fn(() => source),
      createChannelSplitter: vi.fn(() => splitter),
      createAnalyser: vi.fn()
        .mockReturnValueOnce(leftAnalyser)
        .mockReturnValueOnce(rightAnalyser),
      close: vi.fn(async () => { contextState.value = "closed"; }),
    } as unknown as AudioContext;
    const runtime: AudioRuntime = {
      getUserMedia: vi.fn().mockResolvedValue(stream),
      createAudioContext: vi.fn(() => context),
    };
    return { runtime, context, source, splitter, leftAnalyser, rightAnalyser, leftTrack };
  }

  it("splits two input channels and reads independent channel buffers", async () => {
    const fake = makeStereoRuntime(2);
    const session = await startStereoAnalyzerSession(fake.runtime);

    expect(fake.runtime.getUserMedia).toHaveBeenCalledWith({
      audio: { channelCount: { ideal: 2 } },
    });
    expect(fake.context.createChannelSplitter).toHaveBeenCalledWith(2);
    expect(fake.splitter.connect).toHaveBeenNthCalledWith(1, fake.leftAnalyser, 0);
    expect(fake.splitter.connect).toHaveBeenNthCalledWith(2, fake.rightAnalyser, 1);
    const snapshot = session.read();
    expect(snapshot.leftTimeDomain[0]).toBeCloseTo(0.5, 5);
    expect(snapshot.rightTimeDomain[0]).toBeCloseTo(0.5, 5);
    expect(snapshot.contextTime).toBe(2);

    await session.stop();
    expect(fake.leftAnalyser.disconnect).toHaveBeenCalledOnce();
    expect(fake.rightAnalyser.disconnect).toHaveBeenCalledOnce();
    expect(fake.splitter.disconnect).toHaveBeenCalledOnce();
    expect(fake.leftTrack.stop).toHaveBeenCalledOnce();
    expect(fake.context.close).toHaveBeenCalledOnce();
  });

  it("rejects mono input and releases microphone resources", async () => {
    const fake = makeStereoRuntime(1);
    await expect(startStereoAnalyzerSession(fake.runtime)).rejects.toThrow(
      "two-channel input",
    );
    expect(fake.leftTrack.stop).toHaveBeenCalledOnce();
    expect(fake.context.close).toHaveBeenCalledOnce();
  });
});
