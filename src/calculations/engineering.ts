export type RatioKind = "amplitude" | "power";

export interface SpeakerDelayResult {
  speedOfSoundMetersPerSecond: number;
  delayMilliseconds: number;
}

export interface SubwooferAlignmentResult {
  delayedSource: "main" | "sub" | "none";
  delayMilliseconds: number;
}

export interface CrossoverStartingPointResult {
  hasOverlap: boolean;
  suggestedFrequencyHz: number | null;
  overlapLowerHz: number | null;
  overlapUpperHz: number | null;
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
}

function requirePositive(value: number, label: string): void {
  requireFinite(value, label);
  if (value <= 0) {
    throw new RangeError(`${label} must be greater than zero.`);
  }
}

function requireNonNegative(value: number, label: string): void {
  requireFinite(value, label);
  if (value < 0) {
    throw new RangeError(`${label} cannot be negative.`);
  }
}

/**
 * Calculates acoustic propagation delay using c = 331.3 + 0.606T.
 * Temperature is in Celsius and is limited to a practical -20°C to 50°C range.
 */
export function calculateSpeakerDelay(
  distanceMeters: number,
  temperatureCelsius = 20,
): SpeakerDelayResult {
  requireNonNegative(distanceMeters, "Distance");
  requireFinite(temperatureCelsius, "Temperature");
  if (temperatureCelsius < -20 || temperatureCelsius > 50) {
    throw new RangeError("Temperature must be between -20°C and 50°C.");
  }

  const speedOfSoundMetersPerSecond = 331.3 + 0.606 * temperatureCelsius;
  return {
    speedOfSoundMetersPerSecond,
    delayMilliseconds: (distanceMeters / speedOfSoundMetersPerSecond) * 1000,
  };
}

/**
 * Returns the delay needed to align measured arrivals by delaying only
 * the source that arrived first. This does not infer polarity or phase.
 */
export function calculateSubwooferAlignment(
  mainArrivalMilliseconds: number,
  subArrivalMilliseconds: number,
): SubwooferAlignmentResult {
  requireNonNegative(mainArrivalMilliseconds, "Main arrival time");
  requireNonNegative(subArrivalMilliseconds, "Sub arrival time");

  if (mainArrivalMilliseconds < subArrivalMilliseconds) {
    return {
      delayedSource: "main",
      delayMilliseconds: subArrivalMilliseconds - mainArrivalMilliseconds,
    };
  }
  if (subArrivalMilliseconds < mainArrivalMilliseconds) {
    return {
      delayedSource: "sub",
      delayMilliseconds: mainArrivalMilliseconds - subArrivalMilliseconds,
    };
  }
  return { delayedSource: "none", delayMilliseconds: 0 };
}

/**
 * Suggests the geometric midpoint of the overlap between subwoofer upper
 * and main-speaker lower operating limits. It is a starting point only.
 */
export function calculateCrossoverStartingPoint(
  subwooferUpperHz: number,
  mainSpeakerLowerHz: number,
): CrossoverStartingPointResult {
  requirePositive(subwooferUpperHz, "Subwoofer upper frequency");
  requirePositive(mainSpeakerLowerHz, "Main speaker lower frequency");

  const overlapLowerHz = mainSpeakerLowerHz;
  const overlapUpperHz = subwooferUpperHz;
  if (overlapLowerHz > overlapUpperHz) {
    return {
      hasOverlap: false,
      suggestedFrequencyHz: null,
      overlapLowerHz: null,
      overlapUpperHz: null,
    };
  }

  return {
    hasOverlap: true,
    suggestedFrequencyHz: Math.sqrt(overlapLowerHz * overlapUpperHz),
    overlapLowerHz,
    overlapUpperHz,
  };
}

/** Calculates ideal symmetric coverage width: 2 × distance × tan(angle / 2). */
export function calculateCoverageWidth(
  distanceMeters: number,
  horizontalCoverageDegrees: number,
): number {
  requireNonNegative(distanceMeters, "Throw distance");
  requireFinite(horizontalCoverageDegrees, "Horizontal coverage angle");
  if (horizontalCoverageDegrees <= 0 || horizontalCoverageDegrees >= 180) {
    throw new RangeError("Coverage angle must be greater than 0° and less than 180°.");
  }
  return (
    2 *
    distanceMeters *
    Math.tan((horizontalCoverageDegrees * Math.PI) / 360)
  );
}

/** Estimates SPL at a new distance using free-field inverse-square behavior. */
export function calculateSplAtDistance(
  referenceSplDb: number,
  referenceDistanceMeters: number,
  targetDistanceMeters: number,
): number {
  requireFinite(referenceSplDb, "Reference SPL");
  requirePositive(referenceDistanceMeters, "Reference distance");
  requirePositive(targetDistanceMeters, "Target distance");
  return (
    referenceSplDb -
    20 * Math.log10(targetDistanceMeters / referenceDistanceMeters)
  );
}

/** Solves the free-field inverse-square equation for target distance. */
export function calculateDistanceForTargetSpl(
  referenceSplDb: number,
  referenceDistanceMeters: number,
  targetSplDb: number,
): number {
  requireFinite(referenceSplDb, "Reference SPL");
  requirePositive(referenceDistanceMeters, "Reference distance");
  requireFinite(targetSplDb, "Target SPL");
  const distance =
    referenceDistanceMeters * 10 ** ((referenceSplDb - targetSplDb) / 20);
  if (!Number.isFinite(distance) || distance <= 0) {
    throw new RangeError("The target SPL is outside the supported distance range.");
  }
  return distance;
}

/** Converts a positive amplitude or power ratio to decibels. */
export function calculateDecibelsFromRatio(
  ratio: number,
  kind: RatioKind,
): number {
  requirePositive(ratio, "Ratio");
  const multiplier = kind === "amplitude" ? 20 : 10;
  return multiplier * Math.log10(ratio);
}

/** Converts a decibel value to a linear amplitude or power ratio. */
export function calculateRatioFromDecibels(
  decibels: number,
  kind: RatioKind,
): number {
  requireFinite(decibels, "Decibels");
  const multiplier = kind === "amplitude" ? 20 : 10;
  const ratio = 10 ** (decibels / multiplier);
  if (!Number.isFinite(ratio)) {
    throw new RangeError("Decibel value is outside the supported ratio range.");
  }
  return ratio;
}

/** Calculates voltage gain using 20 × log10(Vout / Vin). */
export function calculateVoltageGainDb(
  inputVoltage: number,
  outputVoltage: number,
): number {
  requirePositive(inputVoltage, "Input voltage");
  requirePositive(outputVoltage, "Output voltage");
  return 20 * Math.log10(outputVoltage / inputVoltage);
}

/** Calculates output voltage from input voltage and voltage gain in dB. */
export function calculateOutputVoltage(
  inputVoltage: number,
  gainDecibels: number,
): number {
  requirePositive(inputVoltage, "Input voltage");
  requireFinite(gainDecibels, "Voltage gain");
  const outputVoltage = inputVoltage * 10 ** (gainDecibels / 20);
  if (!Number.isFinite(outputVoltage) || outputVoltage <= 0) {
    throw new RangeError("Gain is outside the supported output-voltage range.");
  }
  return outputVoltage;
}
