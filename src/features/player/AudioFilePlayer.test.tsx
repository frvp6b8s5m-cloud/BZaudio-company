import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioFilePlayer } from "./AudioFilePlayer";

const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();
const NativeURL = URL;

describe("local audio file player", () => {
  beforeEach(() => {
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();
    createObjectURL.mockReturnValue("blob:bzaudio-test");
    const URLMock = Object.assign(class extends NativeURL {}, {
      createObjectURL,
      revokeObjectURL,
    });
    vi.stubGlobal("URL", URLMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders a local-only file selection prompt", () => {
    render(<AudioFilePlayer />);
    expect(screen.getByRole("heading", { name: "Audio file player" })).toBeInTheDocument();
    expect(screen.getByText(/stays on this device/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Choose audio file")).toBeInTheDocument();
  });

  it("creates a local object URL and exposes native playback controls", async () => {
    const file = new File(["audio bytes"], "rehearsal.wav", { type: "audio/wav" });
    render(<AudioFilePlayer />);
    fireEvent.change(screen.getByLabelText("Choose audio file"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(file));
    expect(await screen.findByText("rehearsal.wav")).toBeInTheDocument();
    expect(screen.getByLabelText("Audio playback")).toHaveAttribute("controls");
    expect(screen.getByLabelText("Audio playback")).toHaveAttribute("src", "blob:bzaudio-test");
  });

  it("revokes the previous object URL when a file is replaced and on unmount", async () => {
    createObjectURL
      .mockReturnValueOnce("blob:first-audio")
      .mockReturnValueOnce("blob:second-audio");
    const first = new File(["first"], "first.wav", { type: "audio/wav" });
    const second = new File(["second"], "second.wav", { type: "audio/wav" });
    const view = render(<AudioFilePlayer />);
    const input = screen.getByLabelText("Choose audio file");

    fireEvent.change(input, { target: { files: [first] } });
    await screen.findByText("first.wav");
    fireEvent.change(input, { target: { files: [second] } });
    await screen.findByText("second.wav");

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first-audio");
    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second-audio");
  });

  it("rejects non-audio files without creating an object URL", async () => {
    const file = new File(["not audio"], "notes.txt", { type: "text/plain" });
    render(<AudioFilePlayer />);
    fireEvent.change(screen.getByLabelText("Choose audio file"), {
      target: { files: [file] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Choose an audio file.");
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
