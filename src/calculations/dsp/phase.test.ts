import { describe, expect, it } from "vitest";
import {
  analyzeStereoPhase,
  calculateCorrelationCoefficient,
  estimatePhaseDifferenceDegrees,
} from "./phase";

function sine(frequencyHz: number, sampleRate: number, count: number, phase = 0): Float32Array {
  const values = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    values[index] = Math.sin((2 * Math.PI * frequencyHz * index) / sampleRate + phase);
  }
  return values;
}

describe("stereo phase and polarity analysis", () => {
  const sampleRate = 48_000;
  const frequencyHz = 1000;
  const left = sine(frequencyHz, sampleRate, 4096);

  it("identifies matching polarity and zero relative phase", () => {
    const result = analyzeStereoPhase(left, left, sampleRate, frequencyHz);
    expect(result.correlation).toBeCloseTo(1, 4);
    expect(result.polarity).toBe("same");
    expect(result.phaseDegrees).toBeCloseTo(0, 0);
  });

  it("identifies inverted polarity and approximately 180 degrees", () => {
    const inverted = Float32Array.from(left, (sample) => -sample);
    const result = analyzeStereoPhase(left, inverted, sampleRate, frequencyHz);
    expect(result.correlation).toBeCloseTo(-1, 4);
    expect(result.polarity).toBe("inverted");
    expect(Math.abs(result.phaseDegrees ?? 0)).toBeCloseTo(180, 0);
  });

  it("measures a 90-degree phase offset without declaring polarity inversion", () => {
    const shifted = sine(frequencyHz, sampleRate, left.length, Math.PI / 2);
    const result = analyzeStereoPhase(left, shifted, sampleRate, frequencyHz);
    expect(result.correlation).toBeCloseTo(0, 1);
    expect(result.polarity).toBe("uncorrelated");
    expect(result.phaseDegrees).toBeCloseTo(90, 0);
  });

  it("returns unavailable when a channel is silent", () => {
    const silence = new Float32Array(left.length);
    expect(calculateCorrelationCoefficient(left, silence)).toBeNull();
    expect(estimatePhaseDifferenceDegrees(left, silence, sampleRate, frequencyHz)).toBeNull();
  });

  it("rejects mismatched buffers and invalid frequency settings", () => {
    expect(() => calculateCorrelationCoefficient(left, new Float32Array(4))).toThrow(RangeError);
    expect(() => estimatePhaseDifferenceDegrees(left, left, sampleRate, 0)).toThrow(RangeError);
  });
});
