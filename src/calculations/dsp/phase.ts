export type PolarityClassification = "same" | "inverted" | "uncorrelated" | "unavailable";

export interface StereoPhaseResult {
  correlation: number | null;
  polarity: PolarityClassification;
  phaseDegrees: number | null;
  frequencyHz: number;
}

function validatePair(left: ArrayLike<number>, right: ArrayLike<number>): void {
  if (
    !Number.isSafeInteger(left.length) ||
    left.length < 16 ||
    left.length !== right.length
  ) {
    throw new RangeError("Stereo channels must have equal buffers of at least 16 samples.");
  }
  for (let index = 0; index < left.length; index += 1) {
    if (!Number.isFinite(left[index]) || !Number.isFinite(right[index])) {
      throw new RangeError("Stereo samples must be finite numbers.");
    }
  }
}

/** Returns the zero-lag Pearson correlation coefficient for two channels. */
export function calculateCorrelationCoefficient(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): number | null {
  validatePair(left, right);
  let leftMean = 0;
  let rightMean = 0;
  for (let index = 0; index < left.length; index += 1) {
    leftMean += left[index];
    rightMean += right[index];
  }
  leftMean /= left.length;
  rightMean /= right.length;

  let covariance = 0;
  let leftEnergy = 0;
  let rightEnergy = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftCentered = left[index] - leftMean;
    const rightCentered = right[index] - rightMean;
    covariance += leftCentered * rightCentered;
    leftEnergy += leftCentered * leftCentered;
    rightEnergy += rightCentered * rightCentered;
  }

  const denominator = Math.sqrt(leftEnergy * rightEnergy);
  if (denominator === 0) return null;
  return Math.max(-1, Math.min(1, covariance / denominator));
}

function phaseAtFrequency(
  samples: ArrayLike<number>,
  sampleRate: number,
  frequencyHz: number,
): number | null {
  let mean = 0;
  for (let index = 0; index < samples.length; index += 1) {
    mean += samples[index];
  }
  mean /= samples.length;

  let real = 0;
  let imaginary = 0;
  let magnitude = 0;
  const denominator = Math.max(1, samples.length - 1);
  for (let index = 0; index < samples.length; index += 1) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * index) / denominator));
    const angle = (2 * Math.PI * frequencyHz * index) / sampleRate;
    const sample = (samples[index] - mean) * window;
    real += sample * Math.cos(angle);
    imaginary -= sample * Math.sin(angle);
  }
  magnitude = Math.hypot(real, imaginary);
  if (magnitude < 1e-9) return null;
  return Math.atan2(imaginary, real);
}

/** Estimates channel B phase relative to channel A at a selected frequency. */
export function estimatePhaseDifferenceDegrees(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
  sampleRate: number,
  frequencyHz: number,
): number | null {
  validatePair(left, right);
  if (
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0 ||
    !Number.isFinite(frequencyHz) ||
    frequencyHz <= 0 ||
    frequencyHz >= sampleRate / 2
  ) {
    throw new RangeError("Sample rate and analysis frequency must be valid and below Nyquist.");
  }

  const leftPhase = phaseAtFrequency(left, sampleRate, frequencyHz);
  const rightPhase = phaseAtFrequency(right, sampleRate, frequencyHz);
  if (leftPhase === null || rightPhase === null) return null;

  const difference = ((rightPhase - leftPhase) * 180) / Math.PI;
  return ((difference + 180 + 360) % 360) - 180;
}

/** Combines relative correlation/polarity and frequency-specific phase. */
export function analyzeStereoPhase(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
  sampleRate: number,
  frequencyHz: number,
): StereoPhaseResult {
  const correlation = calculateCorrelationCoefficient(left, right);
  const phaseDegrees = estimatePhaseDifferenceDegrees(
    left,
    right,
    sampleRate,
    frequencyHz,
  );

  let polarity: PolarityClassification = "unavailable";
  if (correlation !== null) {
    if (correlation >= 0.7) polarity = "same";
    else if (correlation <= -0.7) polarity = "inverted";
    else polarity = "uncorrelated";
  }

  return { correlation, polarity, phaseDegrees, frequencyHz };
}
