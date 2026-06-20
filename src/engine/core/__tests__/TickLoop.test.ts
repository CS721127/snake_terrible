import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TickLoop } from "../TickLoop";

/**
 * 测试策略说明：
 * vitest 的 vi.useFakeTimers() 默认不一定可靠地接管 requestAnimationFrame
 * （需要显式声明 toFake，且 jsdom 环境下 rAF 的内部实现细节会让行为难以预测）。
 * 为了让测试结果完全确定、不依赖第三方 fake-timer 库对 rAF 的支持程度，
 * 这里直接手动替换全局 requestAnimationFrame / cancelAnimationFrame：
 * - mockRAF 把回调存起来，由测试代码决定"什么时候、带着什么时间戳"去调用它，
 *   等价于完全掌控了每一帧的间隔，可以精确模拟"固定 150ms tick / 不均匀帧间隔 / 严重掉帧"等场景。
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

  /** 手动触发"下一帧"，并指定这一帧的绝对时间戳（模拟 rAF 回调收到的 timestamp 参数）。 */
  function fireFrame(timestamp: number): void {
    const cb = pendingCallback;
    if (!cb) throw new Error("没有等待中的 rAF 回调，TickLoop 可能未在运行");
    pendingCallback = null;
    cb(timestamp);
  }

  it("按固定 tick 间隔触发 onTick，不论每帧实际间隔是否均匀", () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = new TickLoop({ tickIntervalMs: 150, onTick, onRender });

    loop.start();
    fireFrame(0); // 第一帧建立时间基准，不应触发 tick
    expect(onTick).toHaveBeenCalledTimes(0);

    fireFrame(150); // 累积 150ms，正好触发一次 tick
    expect(onTick).toHaveBeenCalledTimes(1);

    fireFrame(290); // 累积 140ms（不足一个 tick），不应再触发
    expect(onTick).toHaveBeenCalledTimes(1);

    fireFrame(300); // 累积满 150ms，触发第二次
    expect(onTick).toHaveBeenCalledTimes(2);

    loop.stop();
  });

  it("单帧累积时间远超一个 tick 时，会补发多次 tick（上限 5 次）", () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = new TickLoop({ tickIntervalMs: 100, onTick, onRender });

    loop.start();
    fireFrame(0);

    // 一次性跳到 1000ms 之后（模拟严重掉帧/标签页切走再切回），
    // 理论上 1000ms / 100ms = 10 次 tick，但实现里 MAX_CATCH_UP_TICKS = 5。
    fireFrame(1000);
    expect(onTick).toHaveBeenCalledTimes(5);

    loop.stop();
  });

  it("onRender 每帧都会被调用，频率与 tick 无关", () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = new TickLoop({ tickIntervalMs: 150, onTick, onRender });

    loop.start();
    fireFrame(0);
    fireFrame(16);
    fireFrame(32);
    fireFrame(48);

    expect(onRender).toHaveBeenCalledTimes(4);
    // 累积时间只有 48ms，远不足 150ms，不应触发任何 tick
    expect(onTick).toHaveBeenCalledTimes(0);

    loop.stop();
  });

  it("stop 后不再触发新的 tick 或 render", () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = new TickLoop({ tickIntervalMs: 100, onTick, onRender });

    loop.start();
    fireFrame(0);
    loop.stop();
    expect(loop.isRunning).toBe(false);
    // stop() 内部会 cancelAnimationFrame，pendingCallback 应已被清空
    expect(pendingCallback).toBeNull();
  });

  it("构造函数拒绝非正数的 tickIntervalMs", () => {
    expect(
      () => new TickLoop({ tickIntervalMs: 0, onTick: () => {}, onRender: () => {} }),
    ).toThrow();
    expect(
      () => new TickLoop({ tickIntervalMs: -10, onTick: () => {}, onRender: () => {} }),
    ).toThrow();
  });
});
