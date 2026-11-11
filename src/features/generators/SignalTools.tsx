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

function useAudioPlayback() {
  const [status, setStatus] = useState<PlaybackStatus>("stopped");
  const [error, setError] = useState("");
  const sessionRef = useRef<AudioOutputSession | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) void session.stop();
    };
  }, []);

  async function stop() {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      await session.stop();
    }
    if (mountedRef.current) setStatus("stopped");
  }

  async function start(createSession: () => Promise<AudioOutputSession>) {
    await stop();
    setError("");
    setStatus("starting");
    try {
      const session = await createSession();
      if (!mountedRef.current) {
        await session.stop();
        return;
      }
      sessionRef.current = session;
      setStatus("playing");
      void session.ended.then(() => {
        if (sessionRef.current === session) {
          sessionRef.current = null;
          if (mountedRef.current) setStatus("stopped");
        }
      });
    } catch (cause) {
      if (mountedRef.current) {
        setError(cause instanceof Error ? cause.message : "Audio output could not start.");
        setStatus("error");
      }
    }
  }

  return { status, error, start, stop };
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
}: {
  status: PlaybackStatus;
  error: string;
  onStart: () => void;
  onStop: () => void;
  startLabel: string;
  stopLabel: string;
}) {
  return (
    <div className="generator-actions">
      <div className="generator-actions__buttons">
        <button
          type="button"
          className="generator-button generator-button--start"
          onClick={onStart}
          disabled={status === "starting" || status === "playing"}
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

function SignalGenerator() {
  const [frequency, setFrequency] = useState("1000");
  const [waveform, setWaveform] = useState<OscillatorWaveform>("sine");
  const [level, setLevel] = useState("-20");
  const playback = useAudioPlayback();
  const disabled = playback.status === "playing" || playback.status === "starting";

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
        status={playback.status}
        error={playback.error}
        startLabel="Start signal"
        stopLabel="Stop signal"
        onStart={() => void playback.start(() => startToneSession({
          frequencyHz: Number(frequency),
          waveform,
          levelDbfs: Number(level),
        }))}
        onStop={() => void playback.stop()}
      />
      <p className="generator-caution">Starts at -20 dBFS. Confirm downstream gain is low before sending a test signal to a PA or headphones.</p>
    </ToolPanel>
  );
}

function NoiseGenerator({ kind }: { kind: NoiseKind }) {
  const [level, setLevel] = useState("-20");
  const playback = useAudioPlayback();
  const disabled = playback.status === "playing" || playback.status === "starting";
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
        status={playback.status}
        error={playback.error}
        startLabel={`Start ${kind} noise`}
        stopLabel={`Stop ${kind} noise`}
        onStart={() => void playback.start(() => startNoiseSession(kind, Number(level)))}
        onStop={() => void playback.stop()}
      />
      <p className="generator-caution">Noise is generated locally in a short looping buffer. Start with system gain low; pink noise is approximate and not a calibrated measurement signal.</p>
    </ToolPanel>
  );
}

function FrequencySweepGenerator() {
  const [startFrequency, setStartFrequency] = useState("20");
  const [endFrequency, setEndFrequency] = useState("20000");
  const [duration, setDuration] = useState("10");
  const [level, setLevel] = useState("-20");
  const playback = useAudioPlayback();
  const disabled = playback.status === "playing" || playback.status === "starting";

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
        status={playback.status}
        error={playback.error}
        startLabel="Start sweep"
        stopLabel="Stop sweep"
        onStart={() => void playback.start(() => startSweepSession({
          startFrequencyHz: Number(startFrequency),
          endFrequencyHz: Number(endFrequency),
          durationSeconds: Number(duration),
          levelDbfs: Number(level),
        }))}
        onStop={() => void playback.stop()}
      />
      <p className="generator-caution">The sweep stops automatically at the selected duration. Start with system gain low and avoid running a sweep through a loud PA without a controlled test procedure.</p>
    </ToolPanel>
  );
}

function TestToneGenerator() {
  const [frequency, setFrequency] = useState("1000");
  const [level, setLevel] = useState("-20");
  const playback = useAudioPlayback();
  const disabled = playback.status === "playing" || playback.status === "starting";

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
        status={playback.status}
        error={playback.error}
        startLabel="Start test tone"
        stopLabel="Stop test tone"
        onStart={() => void playback.start(() => startToneSession({
          frequencyHz: Number(frequency),
          waveform: "sine",
          levelDbfs: Number(level),
        }))}
        onStop={() => void playback.stop()}
      />
      <p className="generator-caution">Default is 1 kHz at -20 dBFS. A digital reference level is not a guarantee of acoustic SPL or amplifier output.</p>
    </ToolPanel>
  );
}

export function SignalTools() {
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
        <SignalGenerator />
        <NoiseGenerator kind="pink" />
        <NoiseGenerator kind="white" />
        <FrequencySweepGenerator />
        <TestToneGenerator />
      </div>
    </section>
  );
}
