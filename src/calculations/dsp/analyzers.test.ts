import { describe, expect, it } from "vitest";
import {
  calculatePeakRms,
  calculateRtaBands,
  estimateDominantFrequency,
  mapSpectrumToLogBins,
} from "./analyzers";

function spectrumWithPeak(
  sampleRate: number,
  fftSize: number,
  frequencyHz: number,
  peakDbfs = -6,
): Float32Array {
  const values = new Float32Array(fftSize / 2).fill(-100);
  const bin = Math.round(frequencyHz / (sampleRate / fftSize));
  values[bin - 1] = peakDbfs - 12;
  values[bin] = peakDbfs;
  values[bin + 1] = peakDbfs - 9;
  return values;
}

describe("peak and RMS analysis", () => {
  it("calculates full-scale peak and RMS from PCM samples", () => {
    const result = calculatePeakRms(new Float32Array([1, -1, 1, -1]));
    expect(result.peakAmplitude).toBe(1);
    expect(result.rmsAmplitude).toBe(1);
    expect(result.peakDbfs).toBeCloseTo(0, 8);
    expect(result.rmsDbfs).toBeCloseTo(0, 8);
    expect(result.isClipping).toBe(false);
  });

  it("calculates sine-like RMS and flags samples above full scale", () => {
    const result = calculatePeakRms(new Float32Array([0, 1.2, 0, -1.2]));
    expect(result.peakAmplitude).toBeCloseTo(1.2, 5);
    expect(result.rmsAmplitude).toBeCloseTo(Math.sqrt(0.72), 5);
    expect(result.peakDbfs).toBeGreaterThan(0);
    expect(result.isClipping).toBe(true);
  });

  it("represents digital silence without inventing a finite dBFS value", () => {
    const result = calculatePeakRms(new Float32Array(8));
    expect(result.peakAmplitude).toBe(0);
    expect(result.rmsAmplitude).toBe(0);
    expect(result.peakDbfs).toBeNull();
    expect(result.rmsDbfs).toBeNull();
  });

  it("rejects empty and non-finite sample buffers", () => {
    expect(() => calculatePeakRms(new Float32Array())).toThrow(RangeError);
    expect(() => calculatePeakRms(new Float32Array([0, Number.NaN]))).toThrow(RangeError);
  });
});

describe("FFT spectrum analysis", () => {
  const sampleRate = 48_000;
  const fftSize = 16_384;

  it("estimates a dominant frequency with sub-bin interpolation", () => {
    const values = spectrumWithPeak(sampleRate, fftSize, 1000);
    const result = estimateDominantFrequency(values, sampleRate, fftSize);
    expect(result).not.toBeNull();
    expect(result?.frequencyHz).toBeCloseTo(1000, -1);
    expect(result?.peakDbfs).toBe(-6);
    expect(result?.resolutionHz).toBeCloseTo(sampleRate / fftSize, 8);
  });

  it("returns null for a silent spectrum and rejects invalid dimensions", () => {
    const silence = new Float32Array(fftSize / 2).fill(-Infinity);
    expect(estimateDominantFrequency(silence, sampleRate, fftSize)).toBeNull();
    expect(() => estimateDominantFrequency(silence, 0, fftSize)).toThrow(RangeError);
  });

  it("maps FFT power into logarithmically spaced display bins", () => {
    const values = spectrumWithPeak(sampleRate, fftSize, 1000, -3);
    const mapped = mapSpectrumToLogBins(values, sampleRate, fftSize, 64);
    expect(mapped).toHaveLength(64);
    expect(mapped.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(Math.max(...mapped)).toBeGreaterThan(0.79);
  });

  it("aggregates FFT-bin power into nominal one-third-octave bands", () => {
    const values = spectrumWithPeak(sampleRate, fftSize, 1000, -6);
    const binWidth = sampleRate / fftSize;
    const lowerBin = Math.ceil((1000 / 2 ** (1 / 6)) / binWidth);
    const upperBin = Math.floor((1000 * 2 ** (1 / 6)) / binWidth);
    for (let bin = lowerBin; bin <= upperBin; bin += 1) values[bin] = -6;
    const bands = calculateRtaBands(values, sampleRate, fftSize);
    const band = bands.find((item) => item.centerFrequencyHz === 1000);
    expect(bands.length).toBeGreaterThan(25);
    expect(band?.levelDbfs).toBeCloseTo(-6, 1);
    expect(bands.find((item) => item.centerFrequencyHz === 31.5)?.levelDbfs).toBeNull();
  });
});
