import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MicrophoneStartError,
  startMicrophoneSession,
  type AudioRuntime,
} from "./microphone";

function makeRuntime() {
  const track = { stop: vi.fn() };
  const source = { disconnect: vi.fn() };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  const contextState = { value: "running" as AudioContextState };
  const context = {
    get state() { return contextState.value; },
    resume: vi.fn(async () => { contextState.value = "running"; }),
    createMediaStreamSource: vi.fn(() => source),
    close: vi.fn(async () => { contextState.value = "closed"; }),
  } as unknown as AudioContext;
  const runtime: AudioRuntime = {
    getUserMedia: vi.fn().mockResolvedValue(stream),
    createAudioContext: vi.fn(() => context),
  };

  return { runtime, track, source, stream, context };
}

describe("microphone session lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requests microphone access only when start is called and cleans up on stop", async () => {
    const { runtime, track, source, stream, context } = makeRuntime();

    const session = await startMicrophoneSession(runtime);

    expect(runtime.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(session.stream).toBe(stream);
    expect(session.context).toBe(context);
    expect(session.source).toBe(source);

    await session.stop();
    await session.stop();

    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it("resumes a suspended audio context while requesting the microphone", async () => {
    const { runtime, context } = makeRuntime();
    Object.defineProperty(context, "state", { configurable: true, get: () => "suspended" });
    await startMicrophoneSession(runtime, { audio: { channelCount: 2 } });
    expect(context.resume).toHaveBeenCalledOnce();
    expect(runtime.getUserMedia).toHaveBeenCalledWith({ audio: { channelCount: 2 } });
  });

  it("closes the audio context if microphone permission is denied", async () => {
    const { runtime } = makeRuntime();
    runtime.getUserMedia = vi.fn().mockRejectedValue(
      Object.assign(new Error("Permission denied"), { name: "NotAllowedError" }),
    );

    await expect(startMicrophoneSession(runtime)).rejects.toMatchObject({
      name: "MicrophoneStartError",
      code: "permission-denied",
    });
    expect(runtime.createAudioContext).toHaveBeenCalledTimes(1);
  });

  it("classifies a missing input device", async () => {
    const { runtime } = makeRuntime();
    runtime.getUserMedia = vi.fn().mockRejectedValue(
      Object.assign(new Error("No device"), { name: "NotFoundError" }),
    );

    await expect(startMicrophoneSession(runtime)).rejects.toMatchObject({
      code: "no-device",
    });
  });

  it("does not request the microphone if audio context creation fails", async () => {
    const { runtime } = makeRuntime();
    runtime.createAudioContext = vi.fn(() => {
      throw new Error("Audio context unavailable");
    });

    await expect(startMicrophoneSession(runtime)).rejects.toBeInstanceOf(
      MicrophoneStartError,
    );
    expect(runtime.getUserMedia).not.toHaveBeenCalled();
  });

  it("stops acquired tracks if the audio source cannot be created", async () => {
    const { runtime, track, context } = makeRuntime();
    context.createMediaStreamSource = vi.fn(() => {
      throw new Error("Audio source unavailable");
    });

    await expect(startMicrophoneSession(runtime)).rejects.toBeInstanceOf(
      MicrophoneStartError,
    );
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it("reports unsupported browser audio APIs clearly", async () => {
    await expect(startMicrophoneSession()).rejects.toMatchObject({
      code: "unsupported",
    });
  });
});
