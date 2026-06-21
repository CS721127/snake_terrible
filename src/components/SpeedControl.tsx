interface SpeedControlProps {
  readonly tickIntervalMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly onSpeedChange: (tickIntervalMs: number) => void;
  readonly readOnly: boolean;
}

/**
 * SpeedControl: in-game slider to adjust snake speed (per todo.md).
 *
 * Value is tick interval (ms); slider direction is inverted on purpose —
 * slider right = "faster", mapped to smaller tickIntervalMs,
 * so players are not confused by "right = bigger number = faster" when smaller interval means faster.
 */
export function SpeedControl({
  tickIntervalMs,
  minMs,
  maxMs,
  onSpeedChange,
  readOnly,
}: SpeedControlProps): JSX.Element {
  // Slider uses 0~100 "speed level": 0 = slowest (maxMs), 100 = fastest (minMs).
  const speedLevel = Math.round(
    ((maxMs - tickIntervalMs) / (maxMs - minMs)) * 100,
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const level = Number(event.target.value);
    const nextIntervalMs = maxMs - (level / 100) * (maxMs - minMs);
    onSpeedChange(nextIntervalMs);
  };

  return (
    <div aria-label="Snake speed" className="speed-control" role="group">
      <span className="speed-control__label">SPEED</span>
      <input
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={speedLevel}
        className="speed-control__slider"
        disabled={readOnly}
        max={100}
        min={0}
        onChange={handleChange}
        type="range"
        value={speedLevel}
      />
      <span className="speed-control__value">{tickIntervalMs}ms/tick</span>
    </div>
  );
}
