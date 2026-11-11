export interface PeakRmsResult {
  peakAmplitude: number;
  rmsAmplitude: number;
  peakDbfs: number | null;
  rmsDbfs: number | null;
  isClipping: boolean;
}

export interface DominantFrequencyResult {
  frequencyHz: number;
  peakDbfs: number;
  resolutionHz: number;
}

export interface RtaBandResult {
  centerFrequencyHz: number;
  levelDbfs: number | null;
}

export const THIRD_OCTAVE_CENTERS_HZ = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500,
  630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000,
  10_000, 12_500, 16_000, 20_000,
] as const;

function validateSpectrumDimensions(
  sampleRate: number,
  fftSize: number,
  valuesLength: number,
): void {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new RangeError("Sample rate must be a finite positive number.");
  }
  if (
    !Number.isSafeInteger(fftSize) ||
    fftSize < 32 ||
    (fftSize & (fftSize - 1)) !== 0
  ) {
    throw new RangeError("FFT size must be a power of two of at least 32.");
  }
  if (valuesLength < 2) {
    throw new RangeError("Spectrum must contain at least two frequency bins.");
  }
}

function dbfsFromAmplitude(amplitude: number): number | null {
  return amplitude > 0 ? 20 * Math.log10(amplitude) : null;
}

function averagePowerDbfs(
  values: ArrayLike<number>,
  firstBin: number,
  lastBin: number,
): number | null {
  let powerSum = 0;
  let count = 0;
  for (let bin = firstBin; bin <= lastBin; bin += 1) {
    const dbfs = values[bin];
    if (!Number.isFinite(dbfs)) continue;
    powerSum += 10 ** (dbfs / 10);
    count += 1;
  }
  return count > 0 ? 10 * Math.log10(powerSum / count) : null;
}

/** Calculates digital peak and RMS levels from float PCM samples. */
export function calculatePeakRms(samples: ArrayLike<number>): PeakRmsResult {
  if (!Number.isSafeInteger(samples.length) || samples.length <= 0) {
    throw new RangeError("PCM sample buffer must contain at least one sample.");
  }

  let peakAmplitude = 0;
  let squareSum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    if (!Number.isFinite(sample)) {
      throw new RangeError("PCM samples must all be finite numbers.");
    }
    const magnitude = Math.abs(sample);
    peakAmplitude = Math.max(peakAmplitude, magnitude);
    squareSum += sample * sample;
  }

  const rmsAmplitude = Math.sqrt(squareSum / samples.length);
  return {
    peakAmplitude,
    rmsAmplitude,
    peakDbfs: dbfsFromAmplitude(peakAmplitude),
    rmsDbfs: dbfsFromAmplitude(rmsAmplitude),
    isClipping: peakAmplitude > 1,
  };
}

/** Finds the strongest FFT bin and refines its frequency with parabolic interpolation. */
export function estimateDominantFrequency(
  frequencyDbfs: ArrayLike<number>,
  sampleRate: number,
  fftSize: number,
  minFrequencyHz = 20,
  maxFrequencyHz = 20_000,
): DominantFrequencyResult | null {
  validateSpectrumDimensions(sampleRate, fftSize, frequencyDbfs.length);
  if (
    !Number.isFinite(minFrequencyHz) ||
    !Number.isFinite(maxFrequencyHz) ||
    minFrequencyHz <= 0 ||
    maxFrequencyHz <= minFrequencyHz
  ) {
    throw new RangeError("Frequency limits must be finite, positive, and increasing.");
  }

  const resolutionHz = sampleRate / fftSize;
  const firstBin = Math.max(1, Math.ceil(minFrequencyHz / resolutionHz));
  const lastBin = Math.min(
    frequencyDbfs.length - 1,
    Math.floor(Math.min(maxFrequencyHz, sampleRate / 2) / resolutionHz),
  );
  if (firstBin > lastBin) return null;

  let peakBin = -1;
  let peakDbfs = Number.NEGATIVE_INFINITY;
  for (let bin = firstBin; bin <= lastBin; bin += 1) {
    const value = frequencyDbfs[bin];
    if (Number.isFinite(value) && value > peakDbfs) {
      peakDbfs = value;
      peakBin = bin;
    }
  }
  if (peakBin < 0) return null;

  const left = frequencyDbfs[peakBin - 1];
  const right = frequencyDbfs[peakBin + 1];
  let offset = 0;
  if (Number.isFinite(left) && Number.isFinite(right)) {
    const denominator = left - 2 * peakDbfs + right;
    if (denominator !== 0) {
      offset = Math.max(-0.5, Math.min(0.5, 0.5 * (left - right) / denominator));
    }
  }

  return {
    frequencyHz: (peakBin + offset) * resolutionHz,
    peakDbfs,
    resolutionHz,
  };
}

/** Aggregates FFT-bin power into logarithmically spaced display bars. */
export function mapSpectrumToLogBins(
  frequencyDbfs: ArrayLike<number>,
  sampleRate: number,
  fftSize: number,
  outputBinCount = 96,
  minDbfs = -90,
  maxDbfs = 0,
): number[] {
  validateSpectrumDimensions(sampleRate, fftSize, frequencyDbfs.length);
  if (!Number.isSafeInteger(outputBinCount) || outputBinCount <= 0) {
    throw new RangeError("Output bin count must be a positive integer.");
  }
  if (
    !Number.isFinite(minDbfs) ||
    !Number.isFinite(maxDbfs) ||
    maxDbfs <= minDbfs
  ) {
    throw new RangeError("Display dBFS maximum must be greater than its minimum.");
  }

  const minimumFrequency = 20;
  const maximumFrequency = Math.min(20_000, sampleRate / 2);
  if (maximumFrequency <= minimumFrequency) {
    return Array.from({ length: outputBinCount }, () => 0);
  }

  const resolutionHz = sampleRate / fftSize;
  const frequencyRatio = maximumFrequency / minimumFrequency;
  return Array.from({ length: outputBinCount }, (_, index) => {
    const lowerFrequency =
      minimumFrequency * frequencyRatio ** (index / outputBinCount);
    const upperFrequency =
      minimumFrequency * frequencyRatio ** ((index + 1) / outputBinCount);
    const firstBin = Math.max(1, Math.ceil(lowerFrequency / resolutionHz));
    const lastBin = Math.min(
      frequencyDbfs.length - 1,
      Math.floor(upperFrequency / resolutionHz),
    );
    const level = averagePowerDbfs(frequencyDbfs, firstBin, lastBin);
    if (level === null) return 0;
    return Math.max(0, Math.min(1, (level - minDbfs) / (maxDbfs - minDbfs)));
  });
}

/** Calculates nominal one-third-octave band levels by averaging FFT-bin power. */
export function calculateRtaBands(
  frequencyDbfs: ArrayLike<number>,
  sampleRate: number,
  fftSize: number,
): RtaBandResult[] {
  validateSpectrumDimensions(sampleRate, fftSize, frequencyDbfs.length);
  const resolutionHz = sampleRate / fftSize;
  const nyquistHz = sampleRate / 2;
  const bandRatio = 2 ** (1 / 6);

  return THIRD_OCTAVE_CENTERS_HZ.map((centerFrequencyHz) => {
    const lowerFrequency = centerFrequencyHz / bandRatio;
    const upperFrequency = centerFrequencyHz * bandRatio;
    if (lowerFrequency >= nyquistHz) {
      return { centerFrequencyHz, levelDbfs: null };
    }
    const firstBin = Math.max(1, Math.ceil(lowerFrequency / resolutionHz));
    const lastBin = Math.min(
      frequencyDbfs.length - 1,
      Math.floor(Math.min(upperFrequency, nyquistHz) / resolutionHz),
    );
    return {
      centerFrequencyHz,
      levelDbfs: firstBin <= lastBin
        ? averagePowerDbfs(frequencyDbfs, firstBin, lastBin)
        : null,
    };
  });
}
