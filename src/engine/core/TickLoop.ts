/**
 * TickLoop：固定时间步的游戏主循环。
 *
 * 核心问题：浏览器的 requestAnimationFrame 回调间隔会随显示器刷新率、
 * 系统负载浮动（60Hz 约 16.7ms 一帧，120Hz 约 8.3ms 一帧，卡顿时可能跳到 30ms+）。
 * 如果直接在每个 rAF 回调里"挪一格"，蛇的移动速度会随着设备/负载不同而不同，手感不稳定。
 *
 * 解决方式（固定时间步 + 累积器模式）：
 * - 每次 rAF 回调累积经过的真实时间 delta；
 * - 当累积时间 >= tickIntervalMs 时，执行一次 onTick（逻辑更新），并消耗掉一个 tick 的时间；
 * - 如果掉帧严重导致累积时间远超一个 tick，最多连续补帧 MAX_CATCH_UP_TICKS 次，
 *   避免长时间切到后台标签页再切回来时，蛇"瞬间疯狂移动"补偿掉所有丢失的时间。
 * - 渲染（onRender）则每个 rAF 都执行，保证视觉流畅，不受 tick 频率限制——
 *   这一点为后续如果想做"插值平滑动画"留好了接口，Sprint 1 阶段 onRender 里直接画当前逻辑状态即可。
 */

export interface TickLoopOptions {
  /** 每个逻辑 tick 的间隔（毫秒），贪吃蛇典型值 100~200ms，需求给出 150ms。 */
  tickIntervalMs: number;
  /** 每个逻辑 tick 触发一次，用于驱动游戏逻辑（移动、碰撞检测等）。 */
  onTick: () => void;
  /** 每个动画帧触发一次，用于渲染，与逻辑 tick 频率解耦。 */
  onRender: (frameDeltaMs: number) => void;
}

const MAX_CATCH_UP_TICKS = 5;

export class TickLoop {
  private tickIntervalMs: number;
  private readonly onTick: () => void;
  private readonly onRender: (frameDeltaMs: number) => void;

  private rafHandle: number | null = null;
  private lastTimestamp: number | null = null;
  private accumulatorMs = 0;
  private running = false;

  constructor(options: TickLoopOptions) {
    if (options.tickIntervalMs <= 0) {
      throw new Error("tickIntervalMs 必须为正数");
    }
    this.tickIntervalMs = options.tickIntervalMs;
    this.onTick = options.onTick;
    this.onRender = options.onRender;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get intervalMs(): number {
    return this.tickIntervalMs;
  }

  /**
   * 运行时调整 tick 间隔（玩家在游戏中调整移动速度，todo.md 要求）。
   * 不打断当前 rAF 循环，下一次 frame() 判定 accumulator 时立即生效；
   * 同时清空 accumulator，避免切换速度瞬间因为旧的累积值触发"瞬间多步"的跳变。
   */
  setTickIntervalMs(nextIntervalMs: number): void {
    if (nextIntervalMs <= 0) return;
    this.tickIntervalMs = nextIntervalMs;
    this.accumulatorMs = 0;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = null;
    this.accumulatorMs = 0;
    this.rafHandle = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  /** rAF 回调，箭头函数绑定 this，避免每次 requestAnimationFrame 都要手动 bind。 */
  private frame = (timestamp: number): void => {
    if (!this.running) return;

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }
    const frameDelta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.accumulatorMs += frameDelta;

    let catchUpTicks = 0;
    while (
      this.accumulatorMs >= this.tickIntervalMs &&
      catchUpTicks < MAX_CATCH_UP_TICKS
    ) {
      this.onTick();
      this.accumulatorMs -= this.tickIntervalMs;
      catchUpTicks++;
    }
    // 如果补帧次数触顶（例如长时间挂起后台），直接清空累积器，
    // 避免恢复焦点的瞬间又触发一长串迟到的 tick。
    if (catchUpTicks >= MAX_CATCH_UP_TICKS) {
      this.accumulatorMs = 0;
    }

    this.onRender(frameDelta);

    this.rafHandle = requestAnimationFrame(this.frame);
  };
}
