import {
  startMicrophoneSession,
  type AudioRuntime,
  type MicrophoneSession,
} from "./microphone";

export interface AnalyzerSnapshot {
  sampleRate: number;
  fftSize: number;
  timeDomain: Float32Array;
  frequencyDbfs: Float32Array;
}

export interface AnalyzerSession {
  readonly microphone: MicrophoneSession;
  readonly analyser: AnalyserNode;
  read: () => AnalyzerSnapshot;
  stop: () => Promise<void>;
}

/**
 * Starts one explicit microphone capture and connects it to an AnalyserNode.
 * The analyser output is intentionally not connected to the speakers.
 */
export async function startAnalyzerSession(
  runtime?: AudioRuntime,
  constraints: MediaStreamConstraints = { audio: true },
): Promise<AnalyzerSession> {
  const microphone = await startMicrophoneSession(runtime, constraints);

  try {
    const analyser = microphone.context.createAnalyser();
    analyser.fftSize = 16_384;
    analyser.smoothingTimeConstant = 0.65;
    analyser.minDecibels = -100;
    analyser.maxDecibels = 0;
    microphone.source.connect(analyser);

    const timeDomain = new Float32Array(analyser.fftSize);
    const frequencyDbfs = new Float32Array(analyser.frequencyBinCount);
    let stopped = false;

    return {
      microphone,
      analyser,
      read: () => {
        analyser.getFloatTimeDomainData(timeDomain);
        analyser.getFloatFrequencyData(frequencyDbfs);
        return {
          sampleRate: microphone.context.sampleRate,
          fftSize: analyser.fftSize,
          timeDomain,
          frequencyDbfs,
        };
      },
      stop: async () => {
        if (stopped) return;
        stopped = true;
        try {
          analyser.disconnect();
        } catch {
          // Continue microphone cleanup if analyser teardown already happened.
        }
        await microphone.stop();
      },
    };
  } catch (error) {
    await microphone.stop();
    throw error;
  }
}
