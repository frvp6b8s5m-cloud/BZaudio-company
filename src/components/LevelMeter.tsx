interface LevelMeterProps {
  label: string;
  valueDbfs: number;
  peakDbfs?: number;
  minDbfs?: number;
  maxDbfs?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function LevelMeter({
  label,
  valueDbfs,
  peakDbfs,
  minDbfs = -60,
  maxDbfs = 0,
}: LevelMeterProps) {
  if (!Number.isFinite(minDbfs) || !Number.isFinite(maxDbfs) || maxDbfs <= minDbfs) {
    throw new RangeError("Meter maximum must be greater than its finite minimum.");
  }

  const hasSignal = Number.isFinite(valueDbfs);
  const displayedValue = hasSignal ? clamp(valueDbfs, minDbfs, maxDbfs) : minDbfs;
  const percentage = ((displayedValue - minDbfs) / (maxDbfs - minDbfs)) * 100;
  const peakPercentage =
    peakDbfs !== undefined && Number.isFinite(peakDbfs)
      ? ((clamp(peakDbfs, minDbfs, maxDbfs) - minDbfs) / (maxDbfs - minDbfs)) * 100
      : undefined;

  return (
    <div className="level-meter">
      <div className="level-meter__readout">
        <span className="level-meter__label">{label}</span>
        <output className="level-meter__value">
          {hasSignal ? `${valueDbfs.toFixed(1)} dBFS` : "No signal"}
        </output>
      </div>
      <div
        className="level-meter__track"
        role="meter"
        aria-label={label}
        aria-valuemin={minDbfs}
        aria-valuemax={maxDbfs}
        aria-valuenow={displayedValue}
        aria-valuetext={hasSignal ? `${valueDbfs.toFixed(1)} dBFS` : "No signal"}
      >
        <span className="level-meter__fill" style={{ width: `${percentage}%` }} />
        {peakPercentage !== undefined && (
          <span
            className="level-meter__peak"
            style={{ left: `${peakPercentage}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="level-meter__scale" aria-hidden="true">
        <span>{minDbfs} dBFS</span>
        <span>{maxDbfs} dBFS</span>
      </div>
    </div>
  );
}
