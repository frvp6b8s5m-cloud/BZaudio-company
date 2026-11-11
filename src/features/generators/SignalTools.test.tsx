import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignalTools } from "./SignalTools";

const audioMocks = vi.hoisted(() => ({
  startToneSession: vi.fn(),
  startNoiseSession: vi.fn(),
  startSweepSession: vi.fn(),
}));

vi.mock("../../audio/output", () => audioMocks);

function createSession() {
  let finish: () => void = () => undefined;
  const ended = new Promise<void>((resolve) => {
    finish = resolve;
  });
  return {
    ended,
    stop: vi.fn(async () => finish()),
  };
}

describe("Release 1 signal generators", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the five generator tools and conservative defaults", () => {
    render(<SignalTools />);

    for (const title of [
      "Signal generator",
      "Pink noise generator",
      "White noise generator",
      "Frequency sweep",
      "Audio test tone",
    ]) {
      expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
    }

    expect(screen.getByLabelText("Frequency")).toHaveValue(1000);
    expect(screen.getAllByLabelText("Output level")).toHaveLength(5);
    expect(screen.getByLabelText("Test tone frequency")).toHaveValue("1000");
    expect(screen.getByRole("button", { name: "Start signal" })).toBeEnabled();
  });

  it("starts and stops a selected signal only from the user's controls", async () => {
    const session = createSession();
    audioMocks.startToneSession.mockResolvedValue(session);
    render(<SignalTools />);

    const signalPanel = screen.getByRole("region", { name: "Signal generator" });
    const start = within(signalPanel).getByRole("button", { name: "Start signal" });
    fireEvent.click(start);

    await waitFor(() => {
      expect(audioMocks.startToneSession).toHaveBeenCalledWith({
        frequencyHz: 1000,
        waveform: "sine",
        levelDbfs: -20,
      });
      expect(within(signalPanel).getByText("Playing")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start pink noise" })).toBeDisabled();
    });

    fireEvent.click(within(signalPanel).getByRole("button", { name: "Stop signal" }));
    await waitFor(() => expect(within(signalPanel).getByText("Stopped")).toBeInTheDocument());
    expect(session.stop).toHaveBeenCalledOnce();
  });

  it("maps pink and white noise panels to their respective generators", async () => {
    audioMocks.startNoiseSession.mockResolvedValue(createSession());
    render(<SignalTools />);

    fireEvent.click(screen.getByRole("button", { name: "Start pink noise" }));
    await waitFor(() => {
      expect(audioMocks.startNoiseSession).toHaveBeenCalledWith("pink", -20);
    });
  });

  it("rejects blank output levels instead of interpreting them as full-scale zero", async () => {
    render(<SignalTools />);
    const signalPanel = screen.getByRole("region", { name: "Signal generator" });
    fireEvent.change(within(signalPanel).getByLabelText("Output level"), {
      target: { value: "" },
    });
    fireEvent.click(within(signalPanel).getByRole("button", { name: "Start signal" }));
    expect(await within(signalPanel).findByRole("alert")).toHaveTextContent("Output level is required.");
    expect(audioMocks.startToneSession).not.toHaveBeenCalled();
  });

  it("shows a clear error if the browser cannot start audio output", async () => {
    audioMocks.startToneSession.mockRejectedValue(new Error("Audio output is unavailable."));
    render(<SignalTools />);

    fireEvent.click(screen.getByRole("button", { name: "Start signal" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Audio output is unavailable.");
    expect(screen.getByText("Could not start")).toBeInTheDocument();
  });
});
