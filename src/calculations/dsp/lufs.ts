export interface BiquadCoefficients {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

export interface KWeightingCoefficients {
  shelf: BiquadCoefficients;
  highPass: BiquadCoefficients;
}

const SHELF_FREQUENCY_HZ = 1681.974450955533;
const SHELF_Q = 0.7071752369554196;
const SHELF_GAIN_DB = 3.999843853973347;
const HIGH_PASS_FREQUENCY_HZ = 38.13547087602444;
const HIGH_PASS_Q = 0.5003270373238773;
const ABSOLUTE_GATE_LUFS = -70;
const RELATIVE_GATE_LU = 10;
const GATING_BLOCK_SECONDS = 0.4;
const GATING_OVERLAP = 0.75;

function validateSampleRate(sampleRate: number): void {
  if (!Number.isFinite(sampleRate) || sampleRate < 16_000) {
    throw new RangeError("BS.1770 K-weighting requires a sample rate of at least 16 kHz.");
  }
}

/**
 * Derives the two BS.1770 K-weighting biquads for the selected sample rate.
 * At 48 kHz these coefficients match ITU-R BS.1770-5 Annex 1, Tables 1–2.
 */
export function createKWeightingCoefficients(sampleRate: number): KWeightingCoefficients {
  validateSampleRate(sampleRate);

  const shelfAmplitude = 10 ** (SHELF_GAIN_DB / 20);
  const shelfIntermediate = shelfAmplitude ** 0.4996667741545416;
  const shelfK = Math.tan((Math.PI * SHELF_FREQUENCY_HZ) / sampleRate);
  const shelfA0 = 1 + shelfK / SHELF_Q + shelfK * shelfK;
  const shelf: BiquadCoefficients = {
    b0: (shelfAmplitude + shelfIntermediate * shelfK / SHELF_Q + shelfK * shelfK) / shelfA0,
    b1: (2 * (shelfK * shelfK - shelfAmplitude)) / shelfA0,
    b2: (shelfAmplitude - shelfIntermediate * shelfK / SHELF_Q + shelfK * shelfK) / shelfA0,
    a1: (2 * (shelfK * shelfK - 1)) / shelfA0,
    a2: (1 - shelfK / SHELF_Q + shelfK * shelfK) / shelfA0,
  };

  const highPassK = Math.tan((Math.PI * HIGH_PASS_FREQUENCY_HZ) / sampleRate);
  const highPassA0 = 1 + highPassK / HIGH_PASS_Q + highPassK * highPassK;
  const highPass: BiquadCoefficients = {
    b0: 1 / highPassA0,
    b1: -2 / highPassA0,
    b2: 1 / highPassA0,
    a1: (2 * (highPassK * highPassK - 1)) / highPassA0,
    a2: (1 - highPassK / HIGH_PASS_Q + highPassK * highPassK) / highPassA0,
  };

  return { shelf, highPass };
}

class BiquadFilter {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  constructor(private readonly coefficients: BiquadCoefficients) {}

  process(input: number): number {
    const { b0, b1, b2, a1, a2 } = this.coefficients;
    const output =
      b0 * input +
      b1 * this.x1 +
      b2 * this.x2 -
      a1 * this.y1 -
      a2 * this.y2;

    this.x2 = this.x1;
    this.x1 = input;
    this.y2 = this.y1;
    this.y1 = output;
    return output;
  }

  reset(): void {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }
}

function loudnessFromPower(power: number): number {
  return power > 0 ? -0.691 + 10 * Math.log10(power) : Number.NEGATIVE_INFINITY;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Mono integrated loudness meter using ITU-R BS.1770-5 Annex 1:
 * K-weighting, 400 ms blocks, 75% overlap, -70 LUFS absolute gate,
 * and a relative gate 10 LU below the absolute-gated loudness.
 */
export class IntegratedLufsMeter {
  private shelf: BiquadFilter;
  private highPass: BiquadFilter;
  private readonly blockSize: number;
  private readonly stepSize: number;
  private readonly pendingSamples: number[] = [];
  private readonly blockPowers: number[] = [];

  constructor(readonly sampleRate: number) {
    const coefficients = createKWeightingCoefficients(sampleRate);
    this.shelf = new BiquadFilter(coefficients.shelf);
    this.highPass = new BiquadFilter(coefficients.highPass);
    this.blockSize = Math.round(sampleRate * GATING_BLOCK_SECONDS);
    this.stepSize = Math.round(this.blockSize * (1 - GATING_OVERLAP));
  }

  push(samples: ArrayLike<number>): void {
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index];
      if (!Number.isFinite(sample)) {
        throw new RangeError("Loudness input samples must be finite.");
      }
      const weighted = this.highPass.process(this.shelf.process(sample));
      this.pendingSamples.push(weighted);
    }

    while (this.pendingSamples.length >= this.blockSize) {
      let squareSum = 0;
      for (let index = 0; index < this.blockSize; index += 1) {
        const sample = this.pendingSamples[index];
        squareSum += sample * sample;
      }
      this.blockPowers.push(squareSum / this.blockSize);
      this.pendingSamples.splice(0, this.stepSize);
    }
  }

  getBlockCount(): number {
    return this.blockPowers.length;
  }

  getIntegratedLufs(): number | null {
    const absoluteGated = this.blockPowers.filter(
      (power) => loudnessFromPower(power) > ABSOLUTE_GATE_LUFS,
    );
    if (absoluteGated.length === 0) return null;

    const absoluteGatedLufs = loudnessFromPower(mean(absoluteGated));
    const relativeThreshold = absoluteGatedLufs - RELATIVE_GATE_LU;
    const relativeGated = absoluteGated.filter(
      (power) => loudnessFromPower(power) > relativeThreshold,
    );
    if (relativeGated.length === 0) return null;
    return loudnessFromPower(mean(relativeGated));
  }

  reset(): void {
    this.shelf.reset();
    this.highPass.reset();
    this.pendingSamples.length = 0;
    this.blockPowers.length = 0;
  }
}
