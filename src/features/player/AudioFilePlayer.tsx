import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ToolPanel } from "../../components/ToolPanel";
import "./audio-file-player.css";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—:—";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AudioFilePlayer() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setSource(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setSource(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!selected) return;
    if (selected.type && !selected.type.startsWith("audio/")) {
      setError("Choose an audio file.");
      return;
    }
    setError("");
    setDuration(null);
    setCurrentTime(0);
    setFile(selected);
  }

  function clearFile() {
    setFile(null);
    setSource(null);
    setDuration(null);
    setCurrentTime(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="audio-player-section">
      <ToolPanel
        title="Audio file player"
        description="Play a local reference track or multitrack stem directly in your browser."
        eyebrow="AUDIO UTILITIES / 01"
      >
        <div className="audio-player-picker">
          <label className="audio-player-file-label" htmlFor="bzaudio-file-input">
            <span>Choose audio file</span>
            <input
              ref={inputRef}
              id="bzaudio-file-input"
              type="file"
              accept="audio/*"
              aria-label="Choose audio file"
              onChange={handleFileChange}
            />
          </label>
          {file && (
            <button type="button" className="audio-player-clear" onClick={clearFile}>
              Clear file
            </button>
          )}
        </div>

        {error && <p className="audio-player-error" role="alert">{error}</p>}

        {file ? (
          <div className="audio-player-track">
            <div className="audio-player-track__meta">
              <strong>{file.name}</strong>
              <span>{formatFileSize(file.size)} · {duration === null ? "Reading duration…" : formatTime(duration)}</span>
            </div>
            {source && (
              <audio
                key={source}
                className="audio-player-native"
                aria-label="Audio playback"
                controls
                preload="metadata"
                src={source}
                onLoadedMetadata={(event) => {
                  const loadedDuration = event.currentTarget.duration;
                  setDuration(Number.isFinite(loadedDuration) ? loadedDuration : null);
                }}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onError={() => setError("This browser could not decode the selected audio file.")}
              />
            )}
            <div className="audio-player-time" aria-live="off">
              <span>POSITION {formatTime(currentTime)}</span>
              <span>{duration === null ? "DURATION —:—" : `DURATION ${formatTime(duration)}`}</span>
            </div>
          </div>
        ) : (
          <div className="audio-player-empty">
            <span className="audio-player-empty__icon" aria-hidden="true">♫</span>
            <strong>No audio loaded</strong>
            <span>Select a local audio file to begin playback</span>
          </div>
        )}

        <p className="audio-player-privacy">The selected file stays on this device. BZaudio creates a temporary local browser URL and revokes it when the file is cleared, replaced, or the player is closed. Nothing is uploaded.</p>
      </ToolPanel>
    </section>
  );
}
