import { describe, expect, it } from "vitest";
import {
  calculateCoverageWidth,
  calculateCrossoverStartingPoint,
  calculateDecibelsFromRatio,
  calculateDistanceForTargetSpl,
  calculateOutputVoltage,
  calculateSpeakerDelay,
  calculateSplAtDistance,
  calculateSubwooferAlignment,
  calculateVoltageGainDb,
  calculateRatioFromDecibels,
} from "./engineering";

describe("speaker delay", () => {
  it("uses temperature-adjusted speed of sound at 20°C", () => {
    const result = calculateSpeakerDelay(10, 20);
    expect(result.speedOfSoundMetersPerSecond).toBeCloseTo(343.42, 2);
    expect(result.delayMilliseconds).toBeCloseTo(29.119, 2);
  });

  it("supports zero distance and rejects invalid distance or temperature", () => {
    expect(calculateSpeakerDelay(0).delayMilliseconds).toBe(0);
    expect(() => calculateSpeakerDelay(-1)).toThrow(RangeError);
    expect(() => calculateSpeakerDelay(1, 51)).toThrow(RangeError);
    expect(() => calculateSpeakerDelay(Number.NaN)).toThrow(RangeError);
  });
});

describe("subwoofer alignment", () => {
  it("delays the main system when it arrives first", () => {
    expect(calculateSubwooferAlignment(5, 8)).toEqual({
      delayedSource: "main",
      delayMilliseconds: 3,
    });
  });

  it("delays the subwoofer when it arrives first", () => {
    expect(calculateSubwooferAlignment(8, 5)).toEqual({
      delayedSource: "sub",
      delayMilliseconds: 3,
    });
  });

  it("reports no delay for equal arrival times and rejects invalid readings", () => {
    expect(calculateSubwooferAlignment(4.5, 4.5)).toEqual({
      delayedSource: "none",
      delayMilliseconds: 0,
    });
    expect(() => calculateSubwooferAlignment(-1, 2)).toThrow(RangeError);
    expect(() => calculateSubwooferAlignment(1, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("crossover starting point", () => {
  it("uses the geometric midpoint of an overlapping operating range", () => {
    const result = calculateCrossoverStartingPoint(100, 80);
    expect(result.hasOverlap).toBe(true);
    expect(result.suggestedFrequencyHz).toBeCloseTo(Math.sqrt(8000), 5);
    expect(result.overlapLowerHz).toBe(80);
    expect(result.overlapUpperHz).toBe(100);
  });

  it("reports a touching boundary and a no-overlap range", () => {
    expect(calculateCrossoverStartingPoint(80, 80).suggestedFrequencyHz).toBe(80);
    expect(calculateCrossoverStartingPoint(70, 80)).toEqual({
      hasOverlap: false,
      suggestedFrequencyHz: null,
      overlapLowerHz: null,
      overlapUpperHz: null,
    });
  });

  it("rejects non-positive frequency limits", () => {
    expect(() => calculateCrossoverStartingPoint(0, 80)).toThrow(RangeError);
  });
});

describe("speaker coverage", () => {
  it("calculates width from throw distance and horizontal angle", () => {
    expect(calculateCoverageWidth(10, 90)).toBeCloseTo(20, 6);
  });

  it("accepts a zero throw and rejects impossible angles", () => {
    expect(calculateCoverageWidth(0, 90)).toBe(0);
    expect(() => calculateCoverageWidth(10, 0)).toThrow(RangeError);
    expect(() => calculateCoverageWidth(10, 180)).toThrow(RangeError);
  });
});

describe("SPL and distance", () => {
  it("applies free-field inverse-square SPL change", () => {
    expect(calculateSplAtDistance(100, 1, 2)).toBeCloseTo(93.9794, 3);
    expect(calculateSplAtDistance(100, 1, 1)).toBe(100);
  });

  it("solves the inverse distance for a target SPL", () => {
    const distance = calculateDistanceForTargetSpl(100, 1, 94);
    expect(distance).toBeCloseTo(1.99526, 4);
    expect(calculateSplAtDistance(100, 1, distance)).toBeCloseTo(94, 8);
  });

  it("rejects zero reference or target distance", () => {
    expect(() => calculateSplAtDistance(100, 0, 2)).toThrow(RangeError);
    expect(() => calculateSplAtDistance(100, 1, 0)).toThrow(RangeError);
  });
});

describe("decibel ratio conversion", () => {
  it("distinguishes amplitude and power ratios", () => {
    expect(calculateDecibelsFromRatio(2, "amplitude")).toBeCloseTo(6.0206, 3);
    expect(calculateDecibelsFromRatio(2, "power")).toBeCloseTo(3.0103, 3);
    expect(calculateRatioFromDecibels(6.0206, "amplitude")).toBeCloseTo(2, 3);
    expect(calculateRatioFromDecibels(3.0103, "power")).toBeCloseTo(2, 3);
  });

  it("handles unity and rejects invalid ratios", () => {
    expect(calculateDecibelsFromRatio(1, "amplitude")).toBe(0);
    expect(calculateRatioFromDecibels(0, "power")).toBe(1);
    expect(() => calculateDecibelsFromRatio(0, "power")).toThrow(RangeError);
  });
});

describe("gain and voltage", () => {
  it("calculates voltage gain and the inverse output voltage", () => {
    const gain = calculateVoltageGainDb(1, 2);
    expect(gain).toBeCloseTo(6.0206, 3);
    expect(calculateOutputVoltage(1, gain)).toBeCloseTo(2, 6);
    expect(calculateOutputVoltage(2, 0)).toBe(2);
  });

  it("rejects non-positive voltages and non-finite gain", () => {
    expect(() => calculateVoltageGainDb(0, 2)).toThrow(RangeError);
    expect(() => calculateVoltageGainDb(1, -2)).toThrow(RangeError);
    expect(() => calculateOutputVoltage(1, Number.NaN)).toThrow(RangeError);
  });
});
