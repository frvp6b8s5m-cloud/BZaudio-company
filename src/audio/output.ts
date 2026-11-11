import {
  generatePinkNoiseSamples,
  generateWhiteNoiseSamples,
} from "./noise";

export type OscillatorWaveform = "sine" | "square" | "sawtooth" | "triangle";
export type NoiseKind = "pink" | "white";

export interface ToneOptions {
  frequencyHz: number;
  waveform: OscillatorWaveform;
  levelDbfs: number;
}

export interface SweepOptions {
  startFrequencyHz: number;
  endFrequencyHz: number;
  durationSeconds: number;
  levelDbfs: number;
}

export interface AudioOutputRuntime {
  createAudioContext: () => AudioContext;
  random?: () => number;
}

export interface AudioOutputSession {
  readonly ended: Promise<void>;
  stop: () => Promise<void>;
}

const MIN_FREQUENCY_HZ = 20;
const MAX_FREQUENCY_HZ = 20_000;
const MIN_LEVEL_DBFS = -60;
const MAX_LEVEL_DBFS = 0;
const MIN_SWEEP_SECONDS = 1;
const MAX_SWEEP_SECONDS = 120;
const NOISE_BUFFER_SECONDS = 2;
const SWEEP_CURVE_POINTS = 128;

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
}

function validateLevel(levelDbfs: number): void {
  requireFinite(levelDbfs, "Output level");
  if (levelDbfs < MIN_LEVEL_DBFS || levelDbfs > MAX_LEVEL_DBFS) {
    throw new RangeError("Output level must be between -60 and 0 dBFS.");
  }
}

function validateFrequency(frequencyHz: number, sampleRate: number): void {
  requireFinite(frequencyHz, "Frequency");
  if (
    frequencyHz < MIN_FREQUENCY_HZ ||
    frequencyHz > MAX_FREQUENCY_HZ ||
    frequencyHz >= sampleRate / 2
  ) {
    throw new RangeError(
      `Frequency must be at least ${MIN_FREQUENCY_HZ} Hz and below the lesser of ${MAX_FREQUENCY_HZ} Hz or the Nyquist frequency.`,
    );
  }
}

function createBrowserRuntime(): AudioOutputRuntime {
  const audioWindow =
    typeof window === "undefined"
      ? undefined
      : (window as Window & { webkitAudioContext?: typeof AudioContext });
  const Constructor =
    typeof AudioContext === "undefined"
      ? audioWindow?.webkitAudioContext
      : AudioContext;

  if (!Constructor) {
    throw new Error("This browser does not support the Web Audio API.");
  }
  return { createAudioContext: () => new Constructor() };
}

function createSession(
  context: AudioContext,
  source: AudioScheduledSourceNode,
): AudioOutputSession {
  let stopped = false;
  let closePromise: Promise<void> | null = null;
  let resolveEnded: () => void = () => undefined;
  const ended = new Promise<void>((resolve) => {
    resolveEnded = resolve;
  });

  const closeContext = (): Promise<void> => {
    if (!closePromise) {
      closePromise = (async () => {
        try {
          if (context.state !== "closed") {
            await context.close();
          }
        } finally {
          resolveEnded();
        }
      })();
    }
    return closePromise;
  };

  source.onended = () => {
    void closeContext();
  };

  return {
    ended,
    stop: async () => {
      if (!stopped) {
        stopped = true;
        try {
          source.stop();
        } catch {
          // A source that already ended cannot be stopped again.
        }
      }
      await closeContext();
    },
  };
}

function connectAtLevel(
  context: AudioContext,
  source: AudioNode,
  levelDbfs: number,
): void {
  validateLevel(levelDbfs);
  const gain = context.createGain();
  gain.gain.setValueAtTime(10 ** (levelDbfs / 20), context.currentTime);
  source.connect(gain);
  gain.connect(context.destination);
}

async function startWithContext(
  configure: (context: AudioContext) => AudioScheduledSourceNode,
  runtime?: AudioOutputRuntime,
): Promise<AudioOutputSession> {
  const audioRuntime = runtime ?? createBrowserRuntime();
  const context = audioRuntime.createAudioContext();

  try {
    if (context.state === "suspended") {
      await context.resume();
    }
    const source = configure(context);
    return createSession(context, source);
  } catch (error) {
    if (context.state !== "closed") {
      try {
        await context.close();
      } catch {
        // Preserve the original configuration or startup error.
      }
    }
    throw error;
  }
}

/** Starts a tone only when called from an explicit user action. */
export function startToneSession(
  options: ToneOptions,
  runtime?: AudioOutputRuntime,
): Promise<AudioOutputSession> {
  validateLevel(options.levelDbfs);
  if (!["sine", "square", "sawtooth", "triangle"].includes(options.waveform)) {
    throw new RangeError("Select a supported oscillator waveform.");
  }

  return startWithContext((context) => {
    validateFrequency(options.frequencyHz, context.sampleRate);
    const oscillator = context.createOscillator();
    oscillator.type = options.waveform;
    oscillator.frequency.setValueAtTime(options.frequencyHz, context.currentTime);
    connectAtLevel(context, oscillator, options.levelDbfs);
    oscillator.start();
    return oscillator;
  }, runtime);
}

/** Starts a two-second in-memory noise buffer in a loop. */
export function startNoiseSession(
  kind: NoiseKind,
  levelDbfs: number,
  runtime?: AudioOutputRuntime,
): Promise<AudioOutputSession> {
  validateLevel(levelDbfs);
  if (kind !== "pink" && kind !== "white") {
    throw new RangeError("Select pink noise or white noise.");
  }

  return startWithContext((context) => {
    const sampleCount = Math.round(context.sampleRate * NOISE_BUFFER_SECONDS);
    const random = runtime?.random ?? Math.random;
    const samples =
      kind === "pink"
        ? generatePinkNoiseSamples(sampleCount, random)
        : generateWhiteNoiseSamples(sampleCount, random);
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    buffer.getChannelData(0).set(samples);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    connectAtLevel(context, source, levelDbfs);
    source.start();
    return source;
  }, runtime);
}

/** Starts an exponential/logarithmic sine sweep with a scheduled end time. */
export function startSweepSession(
  options: SweepOptions,
  runtime?: AudioOutputRuntime,
): Promise<AudioOutputSession> {
  validateLevel(options.levelDbfs);
  requireFinite(options.durationSeconds, "Sweep duration");
  if (
    options.durationSeconds < MIN_SWEEP_SECONDS ||
    options.durationSeconds > MAX_SWEEP_SECONDS
  ) {
    throw new RangeError("Sweep duration must be between 1 and 120 seconds.");
  }
  requireFinite(options.startFrequencyHz, "Sweep start frequency");
  requireFinite(options.endFrequencyHz, "Sweep end frequency");
  if (options.startFrequencyHz === options.endFrequencyHz) {
    throw new RangeError("Sweep start and end frequencies must be different.");
  }

  return startWithContext((context) => {
    validateFrequency(options.startFrequencyHz, context.sampleRate);
    validateFrequency(options.endFrequencyHz, context.sampleRate);

    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    const curve = new Float32Array(SWEEP_CURVE_POINTS);
    const ratio = options.endFrequencyHz / options.startFrequencyHz;
    for (let index = 0; index < curve.length; index += 1) {
      const progress = index / (curve.length - 1);
      curve[index] = options.startFrequencyHz * ratio ** progress;
    }
    oscillator.frequency.setValueCurveAtTime(
      curve,
      context.currentTime,
      options.durationSeconds,
    );
    connectAtLevel(context, oscillator, options.levelDbfs);
    oscillator.start();
    oscillator.stop(context.currentTime + options.durationSeconds);
    return oscillator;
  }, runtime);
}
