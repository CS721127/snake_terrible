interface SpeedControlProps {
  readonly tickIntervalMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly onSpeedChange: (tickIntervalMs: number) => void;
  readonly readOnly: boolean;
}

/**
 * SpeedControl：游戏进行中可调整蛇移动速度的滑块（todo.md 要求）。
 *
 * 数值含义是 tick 间隔（毫秒），滑块方向特意反过来——
 * 滑块往右 = "更快"，内部据此换算成更小的 tickIntervalMs，
 * 避免玩家以为"往右滑=数值变大=变快"和实际效果（数值变小才是变快）相反而困惑。
 */
export function SpeedControl({
  tickIntervalMs,
  minMs,
  maxMs,
  onSpeedChange,
  readOnly,
}: SpeedControlProps): JSX.Element {
  // 滑块刻度统一用 0~100 的"速度等级"表示，0=最慢(maxMs)，100=最快(minMs)。
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
