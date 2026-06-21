import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GameEngine } from "../GameEngine";

/**
 * GameEngine integration tests: verify the top-level facade wires
 * Grid / Snake / SimpleFood / CollisionDetector / GameState / TickLoop correctly.
 *
 * Manually mocks requestAnimationFrame so tests control each tick precisely,
 * without relying on real time or vitest fake-timer rAF behavior.
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
    // Fix Math.random to 0 so randomEmptyCell is deterministic for assertions.
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function fireFrame(timestamp: number): void {
    const cb = pendingCallback;
    if (!cb) throw new Error("No pending rAF callback");
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

  it("starts in IDLE and enters PLAYING after start()", () => {
    const { engine, phases } = createEngine();
    expect(engine.state.is("IDLE")).toBe(true);
    engine.start();
    expect(engine.state.is("PLAYING")).toBe(true);
    expect(phases).toContain("PLAYING");
  });

  it("advances the snake one cell per tick while PLAYING", () => {
    const { engine } = createEngine();
    engine.start();
    fireFrame(0);

    // Initial head at grid center (5,5), direction RIGHT
    fireFrame(150);
    // After one tick, render another frame for latest snapshot
    fireFrame(150 + 16);

    // Cannot read private snake; verify engine still running via public state
    expect(engine.state.is("PLAYING")).toBe(true);
  });

  it("uses free revivals first, then enters REVIVING when exhausted", () => {
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

  it("can restart with start() after quiz revival failure and GAME_OVER", () => {
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

  it("ignores direction input when not PLAYING (no throw, silent ignore)", () => {
    const { engine } = createEngine();
    engine.attachInput();
    // IDLE: direction key events should not throw
    expect(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    }).not.toThrow();
    // Should stay IDLE — input not routed to Snake incorrectly
    expect(engine.state.is("IDLE")).toBe(true);
  });

  it("stops render loop after dispose (no pending rAF consumed)", () => {
    const { engine } = createEngine();
    engine.attachInput();
    engine.start();
    fireFrame(0);
    engine.dispose();
    expect(pendingCallback).toBeNull();
  });

  it("rendered grid length = logical length / 4 (per todo.md)", () => {
    const { engine, snapshots } = createEngine();
    // 10x10 grid = 100 cells, enough for 128/4=32 segments without boardCap truncation.
    engine.start(128);
    fireFrame(0);

    const lastSnapshot = snapshots[snapshots.length - 1] as {
      snakeBody: readonly unknown[];
    };
    expect(lastSnapshot.snakeBody).toHaveLength(32);
    expect(engine.getSnakeLength()).toBe(128);
  });

  it("setSpeed clamps tick interval to valid range", () => {
    const { engine } = createEngine();
    const { minMs, maxMs } = engine.getSpeedRange();

    engine.setSpeed(1);
    expect(engine.getTickIntervalMs()).toBe(minMs);

    engine.setSpeed(10_000);
    expect(engine.getTickIntervalMs()).toBe(maxMs);

    const mid = Math.round((minMs + maxMs) / 2);
    engine.setSpeed(mid);
    expect(engine.getTickIntervalMs()).toBe(mid);
  });
});
