const MAX_NOISE_SAMPLES = 1_000_000;
const PINK_NOISE_PEAK = 0.8;

function validateLength(length: number): void {
  if (!Number.isSafeInteger(length) || length <= 0 || length > MAX_NOISE_SAMPLES) {
    throw new RangeError(`Sample count must be a whole number between 1 and ${MAX_NOISE_SAMPLES}.`);
  }
}

function nextWhiteSample(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("Random source must return a finite value from 0 up to (but not including) 1.");
  }
  return value * 2 - 1;
}

/** Creates uniformly distributed white-noise samples in the range [-1, 1). */
export function generateWhiteNoiseSamples(
  length: number,
  random: () => number = Math.random,
): Float32Array {
  validateLength(length);
  const samples = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    samples[index] = nextWhiteSample(random);
  }
  return samples;
}

/**
 * Creates approximate pink noise using a seven-stage filtered-noise
 * algorithm, then normalizes the buffer peak to 0.8 to preserve headroom.
 */
export function generatePinkNoiseSamples(
  length: number,
  random: () => number = Math.random,
): Float32Array {
  validateLength(length);
  const samples = new Float32Array(length);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let peak = 0;

  for (let index = 0; index < length; index += 1) {
    const white = nextWhiteSample(random);
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    samples[index] = pink;
    peak = Math.max(peak, Math.abs(pink));
  }

  if (peak > 0) {
    const scale = PINK_NOISE_PEAK / peak;
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] *= scale;
    }
  }
  return samples;
}
