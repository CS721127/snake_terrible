import { describe, expect, it, vi } from "vitest";
import { GameState } from "../GameState";

describe("GameState", () => {
  it("initial state is IDLE", () => {
    const state = new GameState();
    expect(state.current).toBe("IDLE");
    expect(state.is("IDLE")).toBe(true);
  });

  it("IDLE -> PLAYING is a valid transition", () => {
    const state = new GameState();
    expect(state.start()).toBe(true);
    expect(state.current).toBe("PLAYING");
  });

  it("IDLE -> GAME_OVER is invalid and leaves state unchanged", () => {
    const state = new GameState();
    expect(state.transition("GAME_OVER")).toBe(false);
    expect(state.current).toBe("IDLE");
  });

  it("full lifecycle PLAYING -> GAME_OVER -> IDLE", () => {
    const state = new GameState();
    state.start();
    expect(state.end()).toBe(true);
    expect(state.current).toBe("GAME_OVER");
    expect(state.reset()).toBe(true);
    expect(state.current).toBe("IDLE");
  });

  it("start() from GAME_OVER is rejected until reset()", () => {
    const state = new GameState();
    state.start();
    state.end();
    expect(state.transition("PLAYING")).toBe(false);
    expect(state.current).toBe("GAME_OVER");
  });

  it("transition to same state is invalid, returns false, no listener", () => {
    const state = new GameState();
    const listener = vi.fn();
    state.onChange(listener);
    expect(state.transition("IDLE")).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("onChange listener fires on valid transition with (next, prev)", () => {
    const state = new GameState();
    const listener = vi.fn();
    state.onChange(listener);
    state.start();
    expect(listener).toHaveBeenCalledWith("PLAYING", "IDLE");
  });

  it("onChange unsubscribe successfully cancels subscription", () => {
    const state = new GameState();
    const listener = vi.fn();
    const unsubscribe = state.onChange(listener);
    unsubscribe();
    state.start();
    expect(listener).not.toHaveBeenCalled();
  });
});
