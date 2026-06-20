import { describe, expect, it, vi } from "vitest";
import { GameState } from "../GameState";

describe("GameState", () => {
  it("初始状态为 IDLE", () => {
    const state = new GameState();
    expect(state.current).toBe("IDLE");
    expect(state.is("IDLE")).toBe(true);
  });

  it("IDLE -> PLAYING 是合法迁移", () => {
    const state = new GameState();
    expect(state.start()).toBe(true);
    expect(state.current).toBe("PLAYING");
  });

  it("IDLE -> GAME_OVER 是非法迁移，应被拒绝且状态不变", () => {
    const state = new GameState();
    expect(state.transition("GAME_OVER")).toBe(false);
    expect(state.current).toBe("IDLE");
  });

  it("PLAYING -> GAME_OVER -> IDLE 的完整生命周期", () => {
    const state = new GameState();
    state.start();
    expect(state.end()).toBe(true);
    expect(state.current).toBe("GAME_OVER");
    expect(state.reset()).toBe(true);
    expect(state.current).toBe("IDLE");
  });

  it("GAME_OVER 状态下尝试直接 start() 应被拒绝（必须先 reset）", () => {
    const state = new GameState();
    state.start();
    state.end();
    expect(state.transition("PLAYING")).toBe(false);
    expect(state.current).toBe("GAME_OVER");
  });

  it("迁移到相同状态视为无效迁移，返回 false 且不触发监听器", () => {
    const state = new GameState();
    const listener = vi.fn();
    state.onChange(listener);
    expect(state.transition("IDLE")).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("onChange 监听器在合法迁移时被调用，参数为 (next, prev)", () => {
    const state = new GameState();
    const listener = vi.fn();
    state.onChange(listener);
    state.start();
    expect(listener).toHaveBeenCalledWith("PLAYING", "IDLE");
  });

  it("onChange 返回的取消函数可以成功取消订阅", () => {
    const state = new GameState();
    const listener = vi.fn();
    const unsubscribe = state.onChange(listener);
    unsubscribe();
    state.start();
    expect(listener).not.toHaveBeenCalled();
  });
});
