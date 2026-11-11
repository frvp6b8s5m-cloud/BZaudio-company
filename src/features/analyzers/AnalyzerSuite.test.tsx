import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyzerSuite } from "./AnalyzerSuite";

const analyzerMocks = vi.hoisted(() => ({
  startAnalyzerSession: vi.fn(),
  startStereoAnalyzerSession: vi.fn(),
}));

vi.mock("../../audio/analyzer", () => analyzerMocks);

function makeSession() {
  const timeDomain = new Float32Array(16_384);
  timeDomain.set([0, 1, 0, -1]);
  const frequencyDbfs = new Float32Array(8_192).fill(-100);
  frequencyDbfs[340] = -3;
  frequencyDbfs[339] = -12;
  frequencyDbfs[341] = -9;
  return {
    analyser: {} as AnalyserNode,
    microphone: { context: { sampleRate: 48_000 } } as never,
    startedAtContextTime: 0,
    read: vi.fn(() => ({
      sampleRate: 48_000,
      contextTime: 1,
      fftSize: 16_384,
      timeDomain,
      frequencyDbfs,
    })),
    stop: vi.fn().mockResolvedValue(undefined),
  };
}

describe("live analyzer suite", () => {
  let frameCallback: FrameRequestCallback | null = null;

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    frameCallback = null;
  });

  it("renders the four live analysis tools and explains calibration limits", () => {
    render(<AnalyzerSuite />);

    for (const title of [
      "Peak / RMS meter",
      "FFT spectrum analyzer",
      "Audio frequency analyzer",
      "Real-time analyzer (RTA)",
      "Feedback frequency finder",
      "LUFS loudness meter",
      "Phase / polarity analyzer",
    ]) {
      expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText(/not calibrated sound pressure level/i)).toBeInTheDocument();
  });

  it("starts one shared microphone session and stops it from the selected panel", async () => {
    const session = makeSession();
    analyzerMocks.startAnalyzerSession.mockResolvedValue(session);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    render(<AnalyzerSuite />);

    const fftPanel = screen.getByRole("region", { name: "FFT spectrum analyzer" });
    fireEvent.click(within(fftPanel).getByRole("button", { name: "Start analysis" }));

    await waitFor(() => {
      expect(analyzerMocks.startAnalyzerSession).toHaveBeenCalledOnce();
      expect(within(fftPanel).getByText("Analyzing")).toBeInTheDocument();
    });
    expect(
      within(screen.getByRole("region", { name: "Peak / RMS meter" }))
        .getByRole("button", { name: "Start analysis" }),
    ).toBeDisabled();

    act(() => frameCallback?.(100));
    expect(session.read).toHaveBeenCalledOnce();

    fireEvent.click(within(fftPanel).getByRole("button", { name: "Stop analysis" }));
    await waitFor(() => expect(within(fftPanel).getByText("Stopped")).toBeInTheDocument());
    expect(session.stop).toHaveBeenCalledOnce();
  });

  it("uses the stereo analyzer for phase and polarity checks", async () => {
    const stereoSession = {
      startedAtContextTime: 0,
      microphone: { context: { sampleRate: 48_000 } },
      read: vi.fn(() => ({
        sampleRate: 48_000,
        contextTime: 1,
        fftSize: 16_384,
        leftTimeDomain: new Float32Array(16_384),
        rightTimeDomain: new Float32Array(16_384),
        leftFrequencyDbfs: new Float32Array(8_192).fill(-100),
        rightFrequencyDbfs: new Float32Array(8_192).fill(-100),
      })),
      stop: vi.fn().mockResolvedValue(undefined),
    };
    analyzerMocks.startStereoAnalyzerSession.mockResolvedValue(stereoSession);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    render(<AnalyzerSuite />);

    const panel = screen.getByRole("region", { name: "Phase / polarity analyzer" });
    fireEvent.click(within(panel).getByRole("button", { name: "Start analysis" }));
    await waitFor(() => {
      expect(analyzerMocks.startStereoAnalyzerSession).toHaveBeenCalledOnce();
      expect(within(panel).getByText("Analyzing")).toBeInTheDocument();
    });
    fireEvent.click(within(panel).getByRole("button", { name: "Stop analysis" }));
    await waitFor(() => expect(within(panel).getByText("Stopped")).toBeInTheDocument());
    expect(stereoSession.stop).toHaveBeenCalledOnce();
  });

  it("shows a permission error without leaving a live session active", async () => {
    analyzerMocks.startAnalyzerSession.mockRejectedValue(
      new Error("Microphone access was denied."),
    );
    render(<AnalyzerSuite />);

    const panel = screen.getByRole("region", { name: "Peak / RMS meter" });
    fireEvent.click(within(panel).getByRole("button", { name: "Start analysis" }));

    expect(await within(panel).findByRole("alert")).toHaveTextContent(
      "Microphone access was denied.",
    );
    expect(within(panel).getByText("Microphone unavailable")).toBeInTheDocument();
  });
});
