interface SpectrumBarsProps {
  label: string;
  bins: readonly number[];
}

function normalizeBin(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function SpectrumBars({ label, bins }: SpectrumBarsProps) {
  const values = bins.map(normalizeBin);

  if (values.length === 0) {
    return (
      <figure className="spectrum-bars">
        <figcaption className="spectrum-bars__caption">{label}</figcaption>
        <p className="spectrum-bars__empty">Waiting for spectrum data</p>
      </figure>
    );
  }

  const peak = Math.max(...values);
  const slotWidth = 240 / values.length;
  const barWidth = Math.max(1, slotWidth - 3);

  return (
    <figure className="spectrum-bars">
      <svg
        className="spectrum-bars__plot"
        viewBox="0 0 240 100"
        role="img"
        aria-label={label}
        preserveAspectRatio="none"
      >
        <line x1="0" x2="240" y1="99" y2="99" className="spectrum-bars__baseline" />
        {values.map((value, index) => {
          const height = value * 88;
          return (
            <rect
              key={index}
              x={index * slotWidth + (slotWidth - barWidth) / 2}
              y={98 - height}
              width={barWidth}
              height={height}
              rx="1"
              className="spectrum-bars__bar"
            />
          );
        })}
      </svg>
      <figcaption className="spectrum-bars__summary">
        {values.length} bands · peak {Math.round(peak * 100)}%
      </figcaption>
    </figure>
  );
}
