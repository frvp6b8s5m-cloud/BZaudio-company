import {
  startMicrophoneSession,
  type AudioRuntime,
  type MicrophoneSession,
} from "./microphone";

export interface AnalyzerSnapshot {
  sampleRate: number;
  contextTime: number;
  fftSize: number;
  timeDomain: Float32Array;
  frequencyDbfs: Float32Array;
}

export interface AnalyzerSession {
  readonly microphone: MicrophoneSession;
  readonly analyser: AnalyserNode;
  readonly startedAtContextTime: number;
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
      startedAtContextTime: microphone.context.currentTime,
      read: () => {
        analyser.getFloatTimeDomainData(timeDomain);
        analyser.getFloatFrequencyData(frequencyDbfs);
        return {
          sampleRate: microphone.context.sampleRate,
          contextTime: microphone.context.currentTime,
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


export interface StereoAnalyzerSnapshot {
  sampleRate: number;
  contextTime: number;
  fftSize: number;
  leftTimeDomain: Float32Array;
  rightTimeDomain: Float32Array;
  leftFrequencyDbfs: Float32Array;
  rightFrequencyDbfs: Float32Array;
}

export interface StereoAnalyzerSession {
  readonly microphone: MicrophoneSession;
  readonly leftAnalyser: AnalyserNode;
  readonly rightAnalyser: AnalyserNode;
  readonly startedAtContextTime: number;
  read: () => StereoAnalyzerSnapshot;
  stop: () => Promise<void>;
}

/**
 * Starts an explicitly requested two-channel microphone capture and splits
 * it into independent analyser paths. Neither path is connected to speakers.
 */
export async function startStereoAnalyzerSession(
  runtime?: AudioRuntime,
): Promise<StereoAnalyzerSession> {
  const microphone = await startMicrophoneSession(runtime, {
    audio: { channelCount: { ideal: 2 } },
  });

  try {
    const track = microphone.stream.getAudioTracks()[0];
    const channelCount = track?.getSettings().channelCount;
    if (channelCount !== undefined && channelCount < 2) {
      throw new Error(
        "This analyzer needs a two-channel input. Select a stereo microphone or two-channel audio interface.",
      );
    }

    const splitter = microphone.context.createChannelSplitter(2);
    const leftAnalyser = microphone.context.createAnalyser();
    const rightAnalyser = microphone.context.createAnalyser();

    for (const analyser of [leftAnalyser, rightAnalyser]) {
      analyser.fftSize = 16_384;
      analyser.smoothingTimeConstant = 0.65;
      analyser.minDecibels = -100;
      analyser.maxDecibels = 0;
    }

    microphone.source.connect(splitter);
    splitter.connect(leftAnalyser, 0);
    splitter.connect(rightAnalyser, 1);

    const leftTimeDomain = new Float32Array(leftAnalyser.fftSize);
    const rightTimeDomain = new Float32Array(rightAnalyser.fftSize);
    const leftFrequencyDbfs = new Float32Array(leftAnalyser.frequencyBinCount);
    const rightFrequencyDbfs = new Float32Array(rightAnalyser.frequencyBinCount);
    let stopped = false;

    return {
      microphone,
      leftAnalyser,
      rightAnalyser,
      startedAtContextTime: microphone.context.currentTime,
      read: () => {
        leftAnalyser.getFloatTimeDomainData(leftTimeDomain);
        rightAnalyser.getFloatTimeDomainData(rightTimeDomain);
        leftAnalyser.getFloatFrequencyData(leftFrequencyDbfs);
        rightAnalyser.getFloatFrequencyData(rightFrequencyDbfs);
        return {
          sampleRate: microphone.context.sampleRate,
          contextTime: microphone.context.currentTime,
          fftSize: leftAnalyser.fftSize,
          leftTimeDomain,
          rightTimeDomain,
          leftFrequencyDbfs,
          rightFrequencyDbfs,
        };
      },
      stop: async () => {
        if (stopped) return;
        stopped = true;
        try {
          leftAnalyser.disconnect();
          rightAnalyser.disconnect();
          splitter.disconnect();
        } catch {
          // Continue microphone cleanup if a graph node was already disconnected.
        }
        await microphone.stop();
      },
    };
  } catch (error) {
    await microphone.stop();
    throw error;
  }
}
