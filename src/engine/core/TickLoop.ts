/**
 * TickLoop: fixed-timestep game main loop.
 *
 * Core problem: browser requestAnimationFrame callback intervals vary with display refresh rate
 * and system load (60Hz ≈ 16.7ms/frame, 120Hz ≈ 8.3ms/frame, stutters can jump to 30ms+).
 * Moving the snake "one cell" directly in each rAF callback makes speed depend on device/load,
 * which feels inconsistent.
 *
 * Solution (fixed timestep + accumulator pattern):
 * - Each rAF callback accumulates real elapsed time delta;
 * - When accumulated time >= tickIntervalMs, run onTick (logic update) and consume one tick's worth of time;
 * - If frames drop badly and accumulated time far exceeds one tick, catch up at most MAX_CATCH_UP_TICKS times,
 *   avoiding the snake "teleporting" through all missed time when returning from a long background tab.
 * - Rendering (onRender) runs every rAF for smooth visuals, decoupled from tick rate —
 *   this leaves room for interpolated animation later; in Sprint 1, onRender draws the current logic state directly.
 */

export interface TickLoopOptions {
  /** Interval per logic tick (ms); typical snake values 100~200ms, requirement specifies 150ms. */
  tickIntervalMs: number;
  /** Fires once per logic tick to drive game logic (movement, collision detection, etc.). */
  onTick: () => void;
  /** Fires every animation frame for rendering, decoupled from logic tick frequency. */
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
      throw new Error("tickIntervalMs must be a positive number");
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
   * Adjust tick interval at runtime (player changes snake speed in-game, per todo.md).
   * Does not interrupt the current rAF loop; takes effect on the next frame() accumulator check;
   * also clears the accumulator to avoid a speed-change burst of "instant multi-step" from old accumulated time.
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

  /** rAF callback; arrow function binds this to avoid manual bind on every requestAnimationFrame. */
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
    // If catch-up hits the cap (e.g. long background suspend), clear the accumulator
    // to avoid another burst of overdue ticks on focus restore.
    if (catchUpTicks >= MAX_CATCH_UP_TICKS) {
      this.accumulatorMs = 0;
    }

    this.onRender(frameDelta);

    this.rafHandle = requestAnimationFrame(this.frame);
  };
}
