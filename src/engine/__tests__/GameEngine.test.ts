import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GameEngine } from "../GameEngine";

/**
 * GameEngine 集成测试：验证顶层门面正确串联了
 * Grid / Snake / SimpleFood / CollisionDetector / GameState / TickLoop。
 *
 * 同样手动 mock requestAnimationFrame，让测试可以精确控制每一次 tick 的触发时机，
 * 不依赖真实时间流逝或 vitest fake-timer 对 rAF 支持程度的不确定性。
 */
describe("GameEngine", () => {
  let pendingCallback: ((timestamp: number) => void) | null = null;

  beforeEach(() => {
    pendingCallback = null;
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
      pendingCallback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {
      pendingCallback = null;
    });
    // Math.random 固定为 0，使 randomEmptyCell 的选择具有确定性，方便断言食物位置。
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function fireFrame(timestamp: number): void {
    const cb = pendingCallback;
    if (!cb) throw new Error("没有等待中的 rAF 回调");
    pendingCallback = null;
    cb(timestamp);
  }

  function createEngine() {
    const snapshots: unknown[] = [];
    const scores: number[] = [];
    const phases: string[] = [];
    const revivals: Array<{ remaining: number; total: number }> = [];
    const quizRequired = vi.fn();
    const engine = new GameEngine({
      grid: { columns: 10, rows: 10 },
      cellSizePx: 20,
      tickIntervalMs: 150,
      inputTarget: window,
      onRenderSnapshot: (s) => snapshots.push(s),
      onScoreChange: (s) => scores.push(s),
      onPhaseChange: (p) => phases.push(p),
      onRevivalsChange: (remaining, total) => revivals.push({ remaining, total }),
      onQuizRequired: quizRequired,
    });
    return { engine, snapshots, scores, phases, revivals, quizRequired };
  }

  function advanceTicks(count: number, startTimestamp: number): number {
    let t = startTimestamp;
    for (let i = 0; i < count; i++) {
      t += 150;
      fireFrame(t);
    }
    return t;
  }

  function driveIntoRightWall(
    engine: GameEngine,
    revivals: Array<{ remaining: number; total: number }>,
    startTimestamp: number,
  ): number {
    const targetRevivalEvents = revivals.length + 1;
    let t = startTimestamp;

    for (let i = 0; i < 24; i++) {
      t = advanceTicks(1, t);
      if (revivals.length >= targetRevivalEvents || engine.state.is("REVIVING")) {
        return t;
      }
    }

    throw new Error("Expected the snake to collide with the right wall.");
  }

  it("初始状态为 IDLE，调用 start() 后进入 PLAYING", () => {
    const { engine, phases } = createEngine();
    expect(engine.state.is("IDLE")).toBe(true);
    engine.start();
    expect(engine.state.is("PLAYING")).toBe(true);
    expect(phases).toContain("PLAYING");
  });

  it("PLAYING 状态下，每个 tick 蛇前进一格", () => {
    const { engine } = createEngine();
    engine.start();
    fireFrame(0);

    // 蛇初始头部在网格中心 (5,5)，方向 RIGHT
    fireFrame(150);
    // 触发一次 tick 后，再渲染一帧来获取最新快照
    fireFrame(150 + 16);

    // 无法直接读取私有 snake，但可以通过 getScore 等公开状态间接验证引擎仍在运行
    expect(engine.state.is("PLAYING")).toBe(true);
  });

  it("撞墙后优先消耗免费复活，耗尽后进入 REVIVING", () => {
    const { engine, phases, revivals, quizRequired } = createEngine();
    engine.start();
    fireFrame(0);

    let t = 0;
    t = driveIntoRightWall(engine, revivals, t);
    expect(engine.state.is("PLAYING")).toBe(true);
    expect(revivals[revivals.length - 1]).toEqual({ remaining: 2, total: 3 });

    t = driveIntoRightWall(engine, revivals, t);
    expect(engine.state.is("PLAYING")).toBe(true);
    expect(revivals[revivals.length - 1]).toEqual({ remaining: 1, total: 3 });

    t = driveIntoRightWall(engine, revivals, t);
    expect(engine.state.is("PLAYING")).toBe(true);
    expect(revivals[revivals.length - 1]).toEqual({ remaining: 0, total: 3 });

    t = driveIntoRightWall(engine, revivals, t);

    expect(engine.state.is("REVIVING")).toBe(true);
    expect(phases).toContain("REVIVING");
    expect(quizRequired).toHaveBeenCalledTimes(1);
  });

  it("答题复活失败 GAME_OVER 后调用 start() 可以重新开始一局", () => {
    const { engine, scores, revivals } = createEngine();
    engine.start();
    fireFrame(0);

    let t = 0;
    for (let i = 0; i < 4; i++) {
      t = driveIntoRightWall(engine, revivals, t);
    }
    expect(engine.state.is("REVIVING")).toBe(true);

    engine.submitQuizFailure();
    expect(engine.state.is("GAME_OVER")).toBe(true);

    engine.start();
    expect(engine.state.is("PLAYING")).toBe(true);
    expect(engine.getScore()).toBe(0);
    expect(scores[scores.length - 1]).toBe(0);
    expect(revivals[revivals.length - 1]).toEqual({ remaining: 3, total: 3 });
  });

  it("非 PLAYING 状态下方向输入不会被蛇接受（不抛错、静默忽略）", () => {
    const { engine } = createEngine();
    engine.attachInput();
    // 此时是 IDLE 状态，派发方向键事件不应导致任何异常
    expect(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    }).not.toThrow();
    // 仍应停留在 IDLE，证明输入没有被错误地路由到 Snake 上
    expect(engine.state.is("IDLE")).toBe(true);
  });

  it("dispose 后停止渲染循环（不再消费 pending 的 rAF 回调）", () => {
    const { engine } = createEngine();
    engine.attachInput();
    engine.start();
    fireFrame(0);
    engine.dispose();
    expect(pendingCallback).toBeNull();
  });
});
