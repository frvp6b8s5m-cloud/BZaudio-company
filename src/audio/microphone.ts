export type MicrophoneErrorCode =
  | "unsupported"
  | "permission-denied"
  | "no-device"
  | "failed";

export class MicrophoneStartError extends Error {
  readonly code: MicrophoneErrorCode;

  constructor(code: MicrophoneErrorCode, message: string) {
    super(message);
    this.name = "MicrophoneStartError";
    this.code = code;
  }
}

export interface AudioRuntime {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  createAudioContext: () => AudioContext;
}

export interface MicrophoneSession {
  readonly stream: MediaStream;
  readonly context: AudioContext;
  readonly source: MediaStreamAudioSourceNode;
  stop: () => Promise<void>;
}

function toMicrophoneError(error: unknown): MicrophoneStartError {
  if (error instanceof MicrophoneStartError) {
    return error;
  }

  const name =
    error instanceof Error && "name" in error ? String(error.name) : "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return new MicrophoneStartError(
      "permission-denied",
      "Microphone access was denied. Allow microphone access and try again.",
    );
  }

  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "OverconstrainedError"
  ) {
    return new MicrophoneStartError(
      "no-device",
      "No usable microphone was found. Connect an input device and try again.",
    );
  }

  return new MicrophoneStartError(
    "failed",
    "The microphone could not be started. Check the input device and browser permissions.",
  );
}

function createBrowserAudioRuntime(): AudioRuntime {
  const audioWindow =
    typeof window === "undefined"
      ? undefined
      : (window as Window & { webkitAudioContext?: typeof AudioContext });
  const AudioContextConstructor =
    typeof AudioContext === "undefined"
      ? audioWindow?.webkitAudioContext
      : AudioContext;

  if (
    typeof navigator === "undefined" ||
    typeof navigator.mediaDevices?.getUserMedia !== "function" ||
    !AudioContextConstructor
  ) {
    throw new MicrophoneStartError(
      "unsupported",
      "This browser does not support microphone capture with the Web Audio API.",
    );
  }

  return {
    getUserMedia: (constraints) =>
      navigator.mediaDevices.getUserMedia(constraints),
    createAudioContext: () => new AudioContextConstructor(),
  };
}

/**
 * Starts microphone capture only when called by an explicit user action.
 * The caller owns the returned session and must call stop() when finished.
 */
export async function startMicrophoneSession(
  runtime?: AudioRuntime,
): Promise<MicrophoneSession> {
  const audioRuntime = runtime ?? createBrowserAudioRuntime();
  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;

  try {
    // Construct the context before the first await so a click handler can
    // satisfy browsers that gate Web Audio startup on user activation.
    context = audioRuntime.createAudioContext();
    stream = await audioRuntime.getUserMedia({ audio: true });
    const source = context.createMediaStreamSource(stream);
    let stopped = false;

    return {
      stream,
      context,
      source,
      stop: async () => {
        if (stopped) {
          return;
        }
        stopped = true;

        try {
          source.disconnect();
        } catch {
          // A source may already be disconnected by browser teardown.
        }

        for (const track of stream?.getTracks() ?? []) {
          try {
            track.stop();
          } catch {
            // Continue stopping remaining tracks if one device track fails.
          }
        }

        if (context && context.state !== "closed") {
          await context.close();
        }
      },
    };
  } catch (error) {
    for (const track of stream?.getTracks() ?? []) {
      try {
        track.stop();
      } catch {
        // Preserve the original startup error while attempting cleanup.
      }
    }

    if (context && context.state !== "closed") {
      try {
        await context.close();
      } catch {
        // Preserve the original startup error.
      }
    }

    throw toMicrophoneError(error);
  }
}
