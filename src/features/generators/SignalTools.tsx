import { useEffect, useRef, useState } from "react";
import { ToolPanel } from "../../components/ToolPanel";
import {
  startNoiseSession,
  startSweepSession,
  startToneSession,
  type AudioOutputSession,
  type NoiseKind,
  type OscillatorWaveform,
} from "../../audio/output";
import "./generator-suite.css";

type PlaybackStatus = "stopped" | "starting" | "playing" | "error";

interface PlaybackController {
  activeId: string | null;
  errorId: string | null;
  status: PlaybackStatus;
  error: string;
  start: (id: string, createSession: () => Promise<AudioOutputSession>) => Promise<void>;
  stop: (id: string) => Promise<void>;
}

function useAudioPlayback(): PlaybackController {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("stopped");
  const [error, setError] = useState("");
  const sessionRef = useRef<{ id: string; session: AudioOutputSession } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const active = sessionRef.current;
      sessionRef.current = null;
      if (active) void active.session.stop();
    };
  }, []);

  async function stop(id: string) {
    const active = sessionRef.current;
    if (!active || active.id !== id) return;
    sessionRef.current = null;
    await active.session.stop();
    if (mountedRef.current) {
      setActiveId(null);
      setStatus("stopped");
    }
  }

  async function start(id: string, createSession: () => Promise<AudioOutputSession>) {
    if (sessionRef.current) {
      await stop(sessionRef.current.id);
    }
    setError("");
    setErrorId(null);
    setActiveId(id);
    setStatus("starting");
    try {
      const session = await createSession();
      if (!mountedRef.current) {
        await session.stop();
        return;
      }
      sessionRef.current = { id, session };
      setStatus("playing");
      void session.ended.then(() => {
        if (sessionRef.current?.session === session) {
          sessionRef.current = null;
          setActiveId(null);
          setStatus("stopped");
        }
      });
    } catch (cause) {
      if (mountedRef.current) {
        setActiveId(null);
        setErrorId(id);
        setError(cause instanceof Error ? cause.message : "Audio output could not start.");
        setStatus("error");
      }
    }
  }

  return { activeId, errorId, status, error, start, stop };
}

function panelStatus(playback: PlaybackController, id: string): PlaybackStatus {
  if (playback.activeId === id) return playback.status;
  return playback.errorId === id ? "error" : "stopped";
}

function panelError(playback: PlaybackController, id: string): string {
  return playback.errorId === id ? playback.error : "";
}

function panelDisabled(playback: PlaybackController, id: string): boolean {
  return playback.activeId !== null && playback.activeId !== id;
}

function requiredNumber(value: string, label: string): number {
  if (value.trim() === "") {
    throw new RangeError(`${label} is required.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
  return parsed;
}

function NumberField({
  label,
  value,
  unit,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  min?: number;
  max?: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="generator-field">
      <span>{label}</span>
      <span className="generator-field__control">
        <input
          type="number"
          inputMode="decimal"
          aria-label={label}
          value={value}
          min={min}
          max={max}
          step="any"
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="generator-field">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function PlaybackControls({
  status,
  error,
  onStart,
  onStop,
  startLabel,
  stopLabel,
  startDisabled = false,
}: {
  status: PlaybackStatus;
  error: string;
  onStart: () => void;
  onStop: () => void;
  startLabel: string;
  stopLabel: string;
  startDisabled?: boolean;
}) {
  return (
    <div className="generator-actions">
      <div className="generator-actions__buttons">
        <button
          type="button"
          className="generator-button generator-button--start"
          onClick={onStart}
          disabled={startDisabled || status === "starting" || status === "playing"}
        >
          {status === "starting" ? "Starting…" : startLabel}
        </button>
        <button
          type="button"
          className="generator-button"
          onClick={onStop}
          disabled={status !== "playing"}
        >
          {stopLabel}
        </button>
      </div>
      <span className={`generator-status generator-status--${status}`} role="status">
        {status === "playing" ? "Playing" : status === "starting" ? "Starting audio" : status === "error" ? "Could not start" : "Stopped"}
      </span>
      {error && <p className="generator-error" role="alert">{error}</p>}
    </div>
  );
}

function SignalGenerator({ playback }: { playback: PlaybackController }) {
  const [frequency, setFrequency] = useState("1000");
  const [waveform, setWaveform] = useState<OscillatorWaveform>("sine");
  const [level, setLevel] = useState("-20");
  const id = "signal";
  const status = panelStatus(playback, id);
  const error = panelError(playback, id);
  const disabled = panelDisabled(playback, id) || status === "playing" || status === "starting";

  return (
    <ToolPanel
      title="Signal generator"
      description="Generate a continuous sine, square, sawtooth, or triangle test signal."
      eyebrow="GENERATE / 01"
    >
      <div className="generator-field-grid">
        <SelectField
          label="Waveform"
          value={waveform}
          options={[
            { value: "sine", label: "Sine" },
            { value: "square", label: "Square" },
            { value: "sawtooth", label: "Sawtooth" },
            { value: "triangle", label: "Triangle" },
          ]}
          disabled={disabled}
          onChange={(value) => setWaveform(value as OscillatorWaveform)}
        />
        <NumberField label="Frequency" value={frequency} unit="Hz" min={20} max={20_000} disabled={disabled} onChange={setFrequency} />
        <NumberField label="Output level" value={level} unit="dBFS" min={-60} max={0} disabled={disabled} onChange={setLevel} />
      </div>
      <PlaybackControls
        status={status}
        error={error}
        startLabel="Start signal"
        stopLabel="Stop signal"
        startDisabled={panelDisabled(playback, id)}
        onStart={() => void playback.start(id, () => startToneSession({
          frequencyHz: requiredNumber(frequency, "Frequency"),
          waveform,
          levelDbfs: requiredNumber(level, "Output level"),
        }))}
        onStop={() => void playback.stop(id)}
      />
      <p className="generator-caution">Starts at -20 dBFS. Confirm downstream gain is low before sending a test signal to a PA or headphones.</p>
    </ToolPanel>
  );
}

function NoiseGenerator({ kind, playback }: { kind: NoiseKind; playback: PlaybackController }) {
  const [level, setLevel] = useState("-20");
  const id = kind === "pink" ? "pink-noise" : "white-noise";
  const status = panelStatus(playback, id);
  const error = panelError(playback, id);
  const disabled = panelDisabled(playback, id) || status === "playing" || status === "starting";
  const label = kind === "pink" ? "Pink noise" : "White noise";

  return (
    <ToolPanel
      title={`${label} generator`}
      description={kind === "pink" ? "Generate broadband pink noise with approximately equal energy per octave." : "Generate broadband white noise with equal energy per hertz."}
      eyebrow={`GENERATE / ${kind === "pink" ? "02" : "03"}`}
    >
      <div className="generator-field-grid generator-field-grid--single">
        <NumberField label="Output level" value={level} unit="dBFS" min={-60} max={0} disabled={disabled} onChange={setLevel} />
      </div>
      <PlaybackControls
        status={status}
        error={error}
        startLabel={`Start ${kind} noise`}
        stopLabel={`Stop ${kind} noise`}
        startDisabled={panelDisabled(playback, id)}
        onStart={() => void playback.start(id, () => startNoiseSession(kind, requiredNumber(level, "Output level")))}
        onStop={() => void playback.stop(id)}
      />
      <p className="generator-caution">Noise is generated locally in a short looping buffer. Start with system gain low; pink noise is approximate and not a calibrated measurement signal.</p>
    </ToolPanel>
  );
}

function FrequencySweepGenerator({ playback }: { playback: PlaybackController }) {
  const [startFrequency, setStartFrequency] = useState("20");
  const [endFrequency, setEndFrequency] = useState("20000");
  const [duration, setDuration] = useState("10");
  const [level, setLevel] = useState("-20");
  const id = "sweep";
  const status = panelStatus(playback, id);
  const error = panelError(playback, id);
  const disabled = panelDisabled(playback, id) || status === "playing" || status === "starting";

  return (
    <ToolPanel
      title="Frequency sweep"
      description="Run a logarithmic sine sweep across a selected frequency range."
      eyebrow="GENERATE / 04"
    >
      <div className="generator-field-grid">
        <NumberField label="Start frequency" value={startFrequency} unit="Hz" min={20} max={20_000} disabled={disabled} onChange={setStartFrequency} />
        <NumberField label="End frequency" value={endFrequency} unit="Hz" min={20} max={20_000} disabled={disabled} onChange={setEndFrequency} />
        <NumberField label="Duration" value={duration} unit="s" min={1} max={120} disabled={disabled} onChange={setDuration} />
        <NumberField label="Output level" value={level} unit="dBFS" min={-60} max={0} disabled={disabled} onChange={setLevel} />
      </div>
      <PlaybackControls
        status={status}
        error={error}
        startLabel="Start sweep"
        stopLabel="Stop sweep"
        startDisabled={panelDisabled(playback, id)}
        onStart={() => void playback.start(id, () => startSweepSession({
          startFrequencyHz: requiredNumber(startFrequency, "Start frequency"),
          endFrequencyHz: requiredNumber(endFrequency, "End frequency"),
          durationSeconds: requiredNumber(duration, "Duration"),
          levelDbfs: requiredNumber(level, "Output level"),
        }))}
        onStop={() => void playback.stop(id)}
      />
      <p className="generator-caution">The sweep stops automatically at the selected duration. Start with system gain low and avoid running a sweep through a loud PA without a controlled test procedure.</p>
    </ToolPanel>
  );
}

function TestToneGenerator({ playback }: { playback: PlaybackController }) {
  const [frequency, setFrequency] = useState("1000");
  const [level, setLevel] = useState("-20");
  const id = "test-tone";
  const status = panelStatus(playback, id);
  const error = panelError(playback, id);
  const disabled = panelDisabled(playback, id) || status === "playing" || status === "starting";

  return (
    <ToolPanel
      title="Audio test tone"
      description="Quick reference tones for checking signal paths and system response."
      eyebrow="GENERATE / 05"
    >
      <div className="generator-field-grid">
        <SelectField
          label="Test tone frequency"
          value={frequency}
          options={[
            { value: "100", label: "100 Hz" },
            { value: "1000", label: "1 kHz" },
            { value: "10000", label: "10 kHz" },
          ]}
          disabled={disabled}
          onChange={setFrequency}
        />
        <NumberField label="Output level" value={level} unit="dBFS" min={-60} max={0} disabled={disabled} onChange={setLevel} />
      </div>
      <PlaybackControls
        status={status}
        error={error}
        startLabel="Start test tone"
        stopLabel="Stop test tone"
        startDisabled={panelDisabled(playback, id)}
        onStart={() => void playback.start(id, () => startToneSession({
          frequencyHz: requiredNumber(frequency, "Test tone frequency"),
          waveform: "sine",
          levelDbfs: requiredNumber(level, "Output level"),
        }))}
        onStop={() => void playback.stop(id)}
      />
      <p className="generator-caution">Default is 1 kHz at -20 dBFS. A digital reference level is not a guarantee of acoustic SPL or amplifier output.</p>
    </ToolPanel>
  );
}

export function SignalTools() {
  const playback = useAudioPlayback();
  return (
    <section className="generator-suite-section" aria-labelledby="generator-suite-title">
      <div className="generator-suite-heading">
        <div>
          <span className="eyebrow">RELEASE 1 / SIGNAL GENERATION</span>
          <h3 id="generator-suite-title">Put a known signal <span>through the system.</span></h3>
        </div>
        <p>Audio starts only when you press Start. Every generator has an explicit Stop control and releases its audio resources.</p>
      </div>
      <div className="generator-suite">
        <SignalGenerator playback={playback} />
        <NoiseGenerator kind="pink" playback={playback} />
        <NoiseGenerator kind="white" playback={playback} />
        <FrequencySweepGenerator playback={playback} />
        <TestToneGenerator playback={playback} />
      </div>
    </section>
  );
}
