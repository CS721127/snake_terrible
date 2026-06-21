import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TickLoop } from "../TickLoop";

/**
 * Test strategy:
 * vitest vi.useFakeTimers() does not reliably mock requestAnimationFrame
 * (needs explicit toFake; jsdom rAF internals are unpredictable).
 * Manually replace global requestAnimationFrame / cancelAnimationFrame:
 * - store callbacks and invoke with chosen timestamps,
 *   simulating fixed 150ms ticks, uneven frames, severe frame drops, etc.
 */
describe("TickLoop", () => {
  let pendingCallback: ((timestamp: number) => void) | null = null;
  let rafCallCount = 0;

  beforeEach(() => {
    pendingCallback = null;
    rafCallCount = 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: (timestamp: number) => void) => {
        pendingCallback = cb;
        rafCallCount += 1;
        return rafCallCount;
      },
    );
    vi.stubGlobal("cancelAnimationFrame", () => {
      pendingCallback = null;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Manually fire "next frame" with absolute timestamp (simulates rAF callback). */
  function fireFrame(timestamp: number): void {
    const cb = pendingCallback;
    if (!cb) throw new Error("No pending rAF callback; TickLoop may not be running");
    pendingCallback = null;
    cb(timestamp);
  }

  it("fires onTick at fixed tick interval regardless of uneven frame spacing", () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = new TickLoop({ tickIntervalMs: 150, onTick, onRender });

    loop.start();
    fireFrame(0); // first frame establishes baseline, no tick yet
    expect(onTick).toHaveBeenCalledTimes(0);

    fireFrame(150); // 150ms accumulated, one tick
    expect(onTick).toHaveBeenCalledTimes(1);

    fireFrame(290); // 140ms accumulated (not enough), no extra tick
    expect(onTick).toHaveBeenCalledTimes(1);

    fireFrame(300); // 150ms accumulated, second tick
    expect(onTick).toHaveBeenCalledTimes(2);

    loop.stop();
  });

  it("catch-up fires multiple ticks when one frame accumulates far beyond one tick (max 5)", () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = new TickLoop({ tickIntervalMs: 100, onTick, onRender });

    loop.start();
    fireFrame(0);

    // Jump to 1000ms (severe drop / tab backgrounded),
    // theoretically 10 ticks but MAX_CATCH_UP_TICKS = 5.
    fireFrame(1000);
    expect(onTick).toHaveBeenCalledTimes(5);

    loop.stop();
  });

  it("onRender runs every frame, independent of tick rate", () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = new TickLoop({ tickIntervalMs: 150, onTick, onRender });

    loop.start();
    fireFrame(0);
    fireFrame(16);
    fireFrame(32);
    fireFrame(48);

    expect(onRender).toHaveBeenCalledTimes(4);
    // only 48ms accumulated, far below 150ms, no ticks
    expect(onTick).toHaveBeenCalledTimes(0);

    loop.stop();
  });

  it("after stop, no new tick or render", () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = new TickLoop({ tickIntervalMs: 100, onTick, onRender });

    loop.start();
    fireFrame(0);
    loop.stop();
    expect(loop.isRunning).toBe(false);
    // stop() cancels rAF; pendingCallback should be cleared
    expect(pendingCallback).toBeNull();
  });

  it("constructor rejects non-positive tickIntervalMs", () => {
    expect(
      () => new TickLoop({ tickIntervalMs: 0, onTick: () => {}, onRender: () => {} }),
    ).toThrow();
    expect(
      () => new TickLoop({ tickIntervalMs: -10, onTick: () => {}, onRender: () => {} }),
    ).toThrow();
  });
});
