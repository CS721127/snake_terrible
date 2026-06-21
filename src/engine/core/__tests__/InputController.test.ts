import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { InputController } from "../InputController";

/**
 * Test strategy:
 * InputController uses performance.now() for throttling; stub it here
 * so tests control exact ms between inputs without real time (slow, flaky on CI).
 *
 * DOM events via native EventTarget dispatch (KeyboardEvent / TouchEvent work in jsdom),
 * covering InputController's real bound handlers, not private method bypass.
 */
describe("InputController", () => {
  let now = 0;

  beforeEach(() => {
    now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function dispatchKey(target: EventTarget, key: string): void {
    const event = new KeyboardEvent("keydown", { key, cancelable: true });
    target.dispatchEvent(event);
  }

  it("arrow keys emit the corresponding Direction", () => {
    const controller = new InputController(window);
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);

    dispatchKey(window, "ArrowUp");
    expect(listener).toHaveBeenCalledWith("UP");

    controller.detach();
  });

  it("WASD keys also emit direction events", () => {
    const controller = new InputController(window, { throttleMs: 0 });
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);

    dispatchKey(window, "w");
    expect(listener).toHaveBeenLastCalledWith("UP");
    dispatchKey(window, "d");
    expect(listener).toHaveBeenLastCalledWith("RIGHT");
    dispatchKey(window, "s");
    expect(listener).toHaveBeenLastCalledWith("DOWN");
    dispatchKey(window, "a");
    expect(listener).toHaveBeenLastCalledWith("LEFT");

    controller.detach();
  });

  it("non-direction keys emit no events", () => {
    const controller = new InputController(window, { throttleMs: 0 });
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);

    dispatchKey(window, "Enter");
    expect(listener).not.toHaveBeenCalled();

    controller.detach();
  });

  it("throttle: second input within the window is ignored", () => {
    const controller = new InputController(window, { throttleMs: 60 });
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);

    dispatchKey(window, "ArrowUp");
    expect(listener).toHaveBeenCalledTimes(1);

    now += 30; // only 30ms elapsed, less than 60ms throttle window
    dispatchKey(window, "ArrowDown");
    expect(listener).toHaveBeenCalledTimes(1); // should be throttled

    now += 40; // 70ms total, past throttle window
    dispatchKey(window, "ArrowDown");
    expect(listener).toHaveBeenCalledTimes(2);

    controller.detach();
  });

  it("does not respond after detach", () => {
    const controller = new InputController(window, { throttleMs: 0 });
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);
    controller.detach();

    dispatchKey(window, "ArrowUp");
    expect(listener).not.toHaveBeenCalled();
  });

  it("onDirection unsubscribe stops receiving events", () => {
    const controller = new InputController(window, { throttleMs: 0 });
    controller.attach();
    const listener = vi.fn();
    const unsubscribe = controller.onDirection(listener);
    unsubscribe();

    dispatchKey(window, "ArrowUp");
    expect(listener).not.toHaveBeenCalled();

    controller.detach();
  });
});
