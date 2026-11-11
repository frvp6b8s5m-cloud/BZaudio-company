import { describe, expect, it } from "vitest";
import { createKWeightingCoefficients, IntegratedLufsMeter } from "./lufs";

function sine(frequencyHz: number, sampleRate: number, durationSeconds: number, amplitude = 1): Float32Array {
  const count = Math.round(sampleRate * durationSeconds);
  const values = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    values[index] = amplitude * Math.sin((2 * Math.PI * frequencyHz * index) / sampleRate);
  }
  return values;
}

describe("ITU-R BS.1770-5 integrated loudness", () => {
  it("matches the published 48 kHz K-weighting coefficient table", () => {
    const coefficients = createKWeightingCoefficients(48_000);
    expect(coefficients.shelf.b0).toBeCloseTo(1.53512485958697, 10);
    expect(coefficients.shelf.b1).toBeCloseTo(-2.69169618940638, 10);
    expect(coefficients.shelf.a1).toBeCloseTo(-1.69065929318241, 10);
    expect(coefficients.highPass.b0).toBeCloseTo(0.9950299263, 8);
    expect(coefficients.highPass.a1).toBeCloseTo(-1.99004745483398, 10);
  });

  it("measures a 997 Hz full-scale sine close to the -3.01 LUFS reference", () => {
    const meter = new IntegratedLufsMeter(48_000);
    meter.push(sine(997, 48_000, 2));
    expect(meter.getBlockCount()).toBeGreaterThan(10);
    expect(meter.getIntegratedLufs()).toBeCloseTo(-3.01, 1);
  });

  it("tracks amplitude changes in loudness units", () => {
    const meter = new IntegratedLufsMeter(48_000);
    meter.push(sine(997, 48_000, 2, 0.1));
    expect(meter.getIntegratedLufs()).toBeCloseTo(-23.01, 1);
  });

  it("applies the relative gate to quiet passages", () => {
    const meter = new IntegratedLufsMeter(48_000);
    meter.push(sine(997, 48_000, 1, 1));
    meter.push(sine(997, 48_000, 1, 0.01));
    expect(meter.getIntegratedLufs()).toBeCloseTo(-3.01, 1);
  });

  it("returns no loudness for silence, below-gate content, or incomplete blocks", () => {
    const silence = new IntegratedLufsMeter(48_000);
    silence.push(new Float32Array(48_000));
    expect(silence.getIntegratedLufs()).toBeNull();

    const quiet = new IntegratedLufsMeter(48_000);
    quiet.push(sine(997, 48_000, 2, 0.00001));
    expect(quiet.getIntegratedLufs()).toBeNull();

    const short = new IntegratedLufsMeter(48_000);
    short.push(sine(997, 48_000, 0.2));
    expect(short.getIntegratedLufs()).toBeNull();
  });

  it("supports 44.1 kHz filter coefficient redesign and rejects low sample rates", () => {
    const coefficients = createKWeightingCoefficients(44_100);
    expect(coefficients.shelf.b0).toBeGreaterThan(1);
    const meter = new IntegratedLufsMeter(44_100);
    meter.push(sine(997, 44_100, 2));
    expect(meter.getIntegratedLufs()).toBeCloseTo(-3.01, 1);
    expect(() => createKWeightingCoefficients(8_000)).toThrow(RangeError);
  });
});
