import { describe, expect, it } from "vitest";
import {
  createDecibels,
  createDistanceMeters,
  createFrequencyHz,
  createSampleRateHz,
  decibelsToLinearGain,
  linearGainToDecibels,
  millisecondsToSamples,
} from "./units";

describe("typed audio units", () => {
  it("accepts finite values within each unit's physical domain", () => {
    expect(createFrequencyHz(1000)).toBe(1000);
    expect(createDistanceMeters(0)).toBe(0);
    expect(createDecibels(-12)).toBe(-12);
    expect(createSampleRateHz(48000)).toBe(48000);
  });

  const invalidUnits: Array<[string, () => unknown]> = [
    ["frequency", () => createFrequencyHz(0)],
    ["distance", () => createDistanceMeters(-1)],
    ["decibels", () => createDecibels(Number.NaN)],
    ["sample rate", () => createSampleRateHz(44100.5)],
    ["infinite sample rate", () => createSampleRateHz(Number.POSITIVE_INFINITY)],
  ];

  it.each(invalidUnits)("rejects invalid %s values", (_label, createValue) => {
    expect(createValue).toThrow(RangeError);
  });
});

describe("audio level conversions", () => {
  it("converts decibels to linear amplitude gain", () => {
    expect(decibelsToLinearGain(0)).toBe(1);
    expect(decibelsToLinearGain(-6.020599913)).toBeCloseTo(0.5, 8);
    expect(decibelsToLinearGain(20)).toBe(10);
  });

  it("converts positive linear amplitude gain to decibels", () => {
    expect(linearGainToDecibels(1)).toBe(0);
    expect(linearGainToDecibels(0.5)).toBeCloseTo(-6.020599913, 8);
    expect(linearGainToDecibels(10)).toBe(20);
  });

  it("rejects non-positive or non-finite linear gain", () => {
    expect(() => linearGainToDecibels(0)).toThrow(RangeError);
    expect(() => linearGainToDecibels(-1)).toThrow(RangeError);
    expect(() => linearGainToDecibels(Number.NaN)).toThrow(RangeError);
  });

  it("converts milliseconds to the nearest sample count", () => {
    expect(millisecondsToSamples(1, 48000)).toBe(48);
    expect(millisecondsToSamples(0.5, 44100)).toBe(22);
  });

  it("rejects invalid durations and sample rates", () => {
    expect(() => millisecondsToSamples(-1, 48000)).toThrow(RangeError);
    expect(() => millisecondsToSamples(1, 0)).toThrow(RangeError);
    expect(() => millisecondsToSamples(Number.POSITIVE_INFINITY, 48000)).toThrow(RangeError);
  });
});
