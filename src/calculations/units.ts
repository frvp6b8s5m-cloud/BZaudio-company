type Unit<Value extends string> = number & { readonly __unit: Value };

export type FrequencyHz = Unit<"Hz">;
export type DistanceMeters = Unit<"m">;
export type Decibels = Unit<"dB">;
export type SampleRateHz = Unit<"samples/s">;

function finiteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}

export function createFrequencyHz(value: number): FrequencyHz {
  finiteNumber(value, "Frequency");
  if (value <= 0) {
    throw new RangeError("Frequency must be greater than zero hertz.");
  }
  return value as FrequencyHz;
}

export function createDistanceMeters(value: number): DistanceMeters {
  finiteNumber(value, "Distance");
  if (value < 0) {
    throw new RangeError("Distance cannot be negative.");
  }
  return value as DistanceMeters;
}

export function createDecibels(value: number): Decibels {
  finiteNumber(value, "Decibels");
  return value as Decibels;
}

export function createSampleRateHz(value: number): SampleRateHz {
  finiteNumber(value, "Sample rate");
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError("Sample rate must be a positive whole number of hertz.");
  }
  return value as SampleRateHz;
}

/** Converts an amplitude ratio in dB to a linear amplitude ratio. */
export function decibelsToLinearGain(decibels: number): number {
  finiteNumber(decibels, "Decibels");
  const gain = 10 ** (decibels / 20);
  if (!Number.isFinite(gain)) {
    throw new RangeError("Decibel value is outside the supported numeric range.");
  }
  return gain;
}

/** Converts a positive linear amplitude ratio to dB. */
export function linearGainToDecibels(linearGain: number): number {
  finiteNumber(linearGain, "Linear gain");
  if (linearGain <= 0) {
    throw new RangeError("Linear gain must be greater than zero.");
  }
  return 20 * Math.log10(linearGain);
}

/** Converts milliseconds to the nearest whole sample at the given sample rate. */
export function millisecondsToSamples(
  durationMs: number,
  sampleRateHz: number,
): number {
  finiteNumber(durationMs, "Duration");
  if (durationMs < 0) {
    throw new RangeError("Duration cannot be negative.");
  }
  createSampleRateHz(sampleRateHz);

  const samples = (durationMs * sampleRateHz) / 1000;
  if (!Number.isSafeInteger(Math.round(samples))) {
    throw new RangeError("Duration exceeds the supported sample-count range.");
  }
  return Math.round(samples);
}
