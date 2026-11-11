import { useState } from "react";
import { ToolPanel } from "../../components/ToolPanel";
import {
  calculateCoverageWidth,
  calculateCrossoverStartingPoint,
  calculateDecibelsFromRatio,
  calculateDistanceForTargetSpl,
  calculateOutputVoltage,
  calculateRatioFromDecibels,
  calculateSpeakerDelay,
  calculateSplAtDistance,
  calculateSubwooferAlignment,
  calculateVoltageGainDb,
  type RatioKind,
} from "../../calculations/engineering";
import "./calculator-suite.css";

interface NumberFieldProps {
  label: string;
  value: string;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: string) => void;
}

function NumberField({
  label,
  value,
  unit,
  min,
  max,
  step = "any",
  onChange,
}: NumberFieldProps) {
  return (
    <label className="calculator-field">
      <span className="calculator-field__label">{label}</span>
      <span className="calculator-field__control">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

function Result({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | null;
  detail?: string;
}) {
  return (
    <div className="calculator-result" aria-live="polite">
      <span className="calculator-result__label">{label}</span>
      <output className="calculator-result__value">
        {value ?? "Enter valid values"}
      </output>
      {detail && <span className="calculator-result__detail">{detail}</span>}
    </div>
  );
}

function readNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function format(value: number | null, digits = 2): string | null {
  return value !== null && Number.isFinite(value) ? value.toFixed(digits) : null;
}

function safely<T>(calculate: () => T): T | null {
  try {
    return calculate();
  } catch {
    return null;
  }
}

function SpeakerDelayCalculator() {
  const [distance, setDistance] = useState("10");
  const [temperature, setTemperature] = useState("20");
  const distanceValue = readNumber(distance);
  const temperatureValue = readNumber(temperature);
  const result =
    distanceValue === null || temperatureValue === null
      ? null
      : safely(() => calculateSpeakerDelay(distanceValue, temperatureValue));

  return (
    <ToolPanel
      title="Speaker delay"
      description="Convert physical distance into acoustic propagation delay."
      eyebrow="SYSTEM DESIGN / 01"
    >
      <div className="calculator-field-grid">
        <NumberField label="Distance (m)" value={distance} unit="m" min={0} onChange={setDistance} />
        <NumberField label="Air temperature (°C)" value={temperature} unit="°C" min={-20} max={50} onChange={setTemperature} />
      </div>
      <Result
        label="Propagation delay"
        value={result ? `${format(result.delayMilliseconds)} ms` : null}
        detail={result ? `Speed of sound: ${result.speedOfSoundMetersPerSecond.toFixed(2)} m/s` : undefined}
      />
      <p className="calculator-formula">t = distance ÷ (331.3 + 0.606 × temperature) × 1000</p>
    </ToolPanel>
  );
}

function SubwooferAlignmentCalculator() {
  const [mainArrival, setMainArrival] = useState("5");
  const [subArrival, setSubArrival] = useState("8");
  const mainValue = readNumber(mainArrival);
  const subValue = readNumber(subArrival);
  const result =
    mainValue === null || subValue === null
      ? null
      : safely(() => calculateSubwooferAlignment(mainValue, subValue));
  const recommendation = result
    ? result.delayedSource === "none"
      ? "Arrivals are aligned"
      : `Delay the ${result.delayedSource === "main" ? "main system" : "subwoofer"}`
    : null;

  return (
    <ToolPanel
      title="Subwoofer alignment"
      description="Compare measured arrival times and delay the source that arrives first."
      eyebrow="SYSTEM DESIGN / 02"
    >
      <div className="calculator-field-grid">
        <NumberField label="Main arrival (ms)" value={mainArrival} unit="ms" min={0} onChange={setMainArrival} />
        <NumberField label="Subwoofer arrival (ms)" value={subArrival} unit="ms" min={0} onChange={setSubArrival} />
      </div>
      <Result
        label={recommendation ?? "Required adjustment"}
        value={result ? `${format(result.delayMilliseconds, 3)} ms` : null}
        detail={result ? recommendation ?? undefined : undefined}
      />
      <p className="calculator-formula">Delay required = later arrival − earlier arrival</p>
      <p className="calculator-caution">Uses measured arrival times only. Verify polarity, phase, crossover region, and acoustic summation with measurement.</p>
    </ToolPanel>
  );
}

function CrossoverCalculator() {
  const [subUpper, setSubUpper] = useState("100");
  const [mainLower, setMainLower] = useState("80");
  const subValue = readNumber(subUpper);
  const mainValue = readNumber(mainLower);
  const result =
    subValue === null || mainValue === null
      ? null
      : safely(() => calculateCrossoverStartingPoint(subValue, mainValue));

  return (
    <ToolPanel
      title="Crossover starting point"
      description="Find the geometric midpoint of the shared subwoofer and main-speaker operating range."
      eyebrow="SYSTEM DESIGN / 03"
    >
      <div className="calculator-field-grid">
        <NumberField label="Subwoofer upper limit (Hz)" value={subUpper} unit="Hz" min={0} onChange={setSubUpper} />
        <NumberField label="Main speaker lower limit (Hz)" value={mainLower} unit="Hz" min={0} onChange={setMainLower} />
      </div>
      <Result
        label="Suggested starting frequency"
        value={result?.hasOverlap ? `${format(result.suggestedFrequencyHz)} Hz` : result ? "No overlap" : null}
        detail={result?.hasOverlap ? `Shared range: ${result.overlapLowerHz}–${result.overlapUpperHz} Hz` : undefined}
      />
      <p className="calculator-formula">fₓ = √(subwoofer upper limit × main lower limit)</p>
      <p className="calculator-caution">A starting point only. Confirm manufacturer limits, filter slopes, phase, and measured acoustic response.</p>
    </ToolPanel>
  );
}

function CoverageCalculator() {
  const [distance, setDistance] = useState("10");
  const [angle, setAngle] = useState("90");
  const distanceValue = readNumber(distance);
  const angleValue = readNumber(angle);
  const width =
    distanceValue === null || angleValue === null
      ? null
      : safely(() => calculateCoverageWidth(distanceValue, angleValue));

  return (
    <ToolPanel
      title="Speaker coverage"
      description="Estimate horizontal coverage width at a specified listening distance."
      eyebrow="SYSTEM DESIGN / 04"
    >
      <div className="calculator-field-grid">
        <NumberField label="Throw distance (m)" value={distance} unit="m" min={0} onChange={setDistance} />
        <NumberField label="Horizontal angle (°)" value={angle} unit="°" min={0} max={179} onChange={setAngle} />
      </div>
      <Result label="Ideal coverage width" value={format(width) ? `${format(width)} m` : null} />
      <p className="calculator-formula">width = 2 × distance × tan(horizontal angle ÷ 2)</p>
      <p className="calculator-caution">Assumes a symmetric coverage angle in an ideal plane; real coverage varies with frequency, room, and loudspeaker directivity.</p>
    </ToolPanel>
  );
}

function SplDistanceCalculator() {
  const [referenceSpl, setReferenceSpl] = useState("100");
  const [referenceDistance, setReferenceDistance] = useState("1");
  const [targetDistance, setTargetDistance] = useState("2");
  const [targetSpl, setTargetSpl] = useState("94");
  const splValue = readNumber(referenceSpl);
  const referenceDistanceValue = readNumber(referenceDistance);
  const targetDistanceValue = readNumber(targetDistance);
  const targetSplValue = readNumber(targetSpl);
  const predictedSpl =
    splValue === null || referenceDistanceValue === null || targetDistanceValue === null
      ? null
      : safely(() => calculateSplAtDistance(splValue, referenceDistanceValue, targetDistanceValue));
  const predictedDistance =
    splValue === null || referenceDistanceValue === null || targetSplValue === null
      ? null
      : safely(() => calculateDistanceForTargetSpl(splValue, referenceDistanceValue, targetSplValue));

  return (
    <ToolPanel
      title="SPL and distance"
      description="Estimate level change with distance or solve for the distance to a target level."
      eyebrow="SYSTEM DESIGN / 05"
    >
      <div className="calculator-field-grid">
        <NumberField label="Reference SPL (dB)" value={referenceSpl} unit="dB" onChange={setReferenceSpl} />
        <NumberField label="Reference distance (m)" value={referenceDistance} unit="m" min={0} onChange={setReferenceDistance} />
        <NumberField label="Target distance (m)" value={targetDistance} unit="m" min={0} onChange={setTargetDistance} />
        <NumberField label="Target SPL (dB)" value={targetSpl} unit="dB" onChange={setTargetSpl} />
      </div>
      <div className="calculator-result-grid">
        <Result label="Estimated SPL at target distance" value={format(predictedSpl) ? `${format(predictedSpl)} dB` : null} />
        <Result label="Distance for target SPL" value={format(predictedDistance) ? `${format(predictedDistance)} m` : null} />
      </div>
      <p className="calculator-formula">ΔL = −20 log₁₀(d₂ ÷ d₁)</p>
      <p className="calculator-caution">Free-field estimate only. Room reflections, array directivity, air absorption, power compression, and limiting are not included.</p>
    </ToolPanel>
  );
}

function DecibelCalculator() {
  const [ratio, setRatio] = useState("2");
  const [decibels, setDecibels] = useState("6.0206");
  const [kind, setKind] = useState<RatioKind>("amplitude");
  const ratioValue = readNumber(ratio);
  const decibelValue = readNumber(decibels);
  const convertedDb =
    ratioValue === null ? null : safely(() => calculateDecibelsFromRatio(ratioValue, kind));
  const convertedRatio =
    decibelValue === null ? null : safely(() => calculateRatioFromDecibels(decibelValue, kind));

  return (
    <ToolPanel
      title="Decibel calculator"
      description="Convert linear ratios to decibels and back, with the ratio type made explicit."
      eyebrow="CALCULATE / 06"
    >
      <label className="calculator-field">
        <span className="calculator-field__label">Ratio type</span>
        <select value={kind} onChange={(event) => setKind(event.currentTarget.value as RatioKind)}>
          <option value="amplitude">Amplitude (20 log₁₀)</option>
          <option value="power">Power (10 log₁₀)</option>
        </select>
      </label>
      <div className="calculator-field-grid">
        <NumberField label="Ratio" value={ratio} unit="×" min={0} onChange={setRatio} />
        <NumberField label="Decibels" value={decibels} unit="dB" onChange={setDecibels} />
      </div>
      <div className="calculator-result-grid">
        <Result label="Ratio expressed in dB" value={format(convertedDb) ? `${format(convertedDb)} dB` : null} />
        <Result label="dB expressed as a ratio" value={format(convertedRatio, 4) ? `${format(convertedRatio, 4)} ×` : null} />
      </div>
      <p className="calculator-formula">{kind === "amplitude" ? "dB = 20 log₁₀(ratio)" : "dB = 10 log₁₀(ratio)"}</p>
    </ToolPanel>
  );
}

function GainVoltageCalculator() {
  const [inputVoltage, setInputVoltage] = useState("1");
  const [outputVoltage, setOutputVoltage] = useState("2");
  const [gain, setGain] = useState("6.0206");
  const inputValue = readNumber(inputVoltage);
  const outputValue = readNumber(outputVoltage);
  const gainValue = readNumber(gain);
  const calculatedGain =
    inputValue === null || outputValue === null
      ? null
      : safely(() => calculateVoltageGainDb(inputValue, outputValue));
  const calculatedVoltage =
    inputValue === null || gainValue === null
      ? null
      : safely(() => calculateOutputVoltage(inputValue, gainValue));

  return (
    <ToolPanel
      title="Gain and voltage"
      description="Calculate voltage gain in decibels or derive output voltage from a gain value."
      eyebrow="CALCULATE / 07"
    >
      <div className="calculator-field-grid">
        <NumberField label="Input voltage (V)" value={inputVoltage} unit="V" min={0} onChange={setInputVoltage} />
        <NumberField label="Output voltage (V)" value={outputVoltage} unit="V" min={0} onChange={setOutputVoltage} />
        <NumberField label="Voltage gain (dB)" value={gain} unit="dB" onChange={setGain} />
      </div>
      <div className="calculator-result-grid">
        <Result label="Calculated voltage gain" value={format(calculatedGain) ? `${format(calculatedGain)} dB` : null} />
        <Result label="Output voltage at entered gain" value={format(calculatedVoltage, 4) ? `${format(calculatedVoltage, 4)} V` : null} />
      </div>
      <p className="calculator-formula">Gain = 20 log₁₀(Vout ÷ Vin)</p>
      <p className="calculator-caution">Voltage ratio only. Power depends on load impedance and is not inferred by this calculator.</p>
    </ToolPanel>
  );
}

export function CalculatorSuite() {
  return (
    <section className="calculator-suite-section" aria-labelledby="calculator-suite-title">
      <div className="calculator-suite-heading">
        <div>
          <span className="eyebrow">RELEASE 1 / CALCULATORS</span>
          <h3 id="calculator-suite-title">Engineering tools, <span>ready to use.</span></h3>
        </div>
        <p>Live calculations with visible units, formulas, and assumptions. Change an input to update the result.</p>
      </div>
      <div className="calculator-suite">
        <SpeakerDelayCalculator />
        <SubwooferAlignmentCalculator />
        <CrossoverCalculator />
        <CoverageCalculator />
        <SplDistanceCalculator />
        <DecibelCalculator />
        <GainVoltageCalculator />
      </div>
    </section>
  );
}
