import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { InputController } from "../InputController";

/**
 * 测试策略：
 * InputController 内部用 performance.now() 做节流计时，这里手动 stub 它，
 * 让测试可以精确控制"两次输入之间经过了多少毫秒"，而不依赖真实时间流逝
 * （真实时间流逝的测试既慢又不稳定，容易在 CI 上偶发失败）。
 *
 * DOM 事件通过 EventTarget 原生派发（KeyboardEvent / TouchEvent 在 jsdom 下可用），
 * 这样测试覆盖的是 InputController 真实绑定的事件处理路径，而不是绕过 DOM 直接调用私有方法。
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

  it("方向键触发对应的 Direction 事件", () => {
    const controller = new InputController(window);
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);

    dispatchKey(window, "ArrowUp");
    expect(listener).toHaveBeenCalledWith("UP");

    controller.detach();
  });

  it("WASD 键同样触发方向事件", () => {
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

  it("非方向键不触发任何事件", () => {
    const controller = new InputController(window, { throttleMs: 0 });
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);

    dispatchKey(window, "Enter");
    expect(listener).not.toHaveBeenCalled();

    controller.detach();
  });

  it("节流：短时间内的第二次输入被忽略", () => {
    const controller = new InputController(window, { throttleMs: 60 });
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);

    dispatchKey(window, "ArrowUp");
    expect(listener).toHaveBeenCalledTimes(1);

    now += 30; // 仅过去 30ms，小于节流窗口 60ms
    dispatchKey(window, "ArrowDown");
    expect(listener).toHaveBeenCalledTimes(1); // 应被节流忽略

    now += 40; // 累计过去 70ms，超过节流窗口
    dispatchKey(window, "ArrowDown");
    expect(listener).toHaveBeenCalledTimes(2);

    controller.detach();
  });

  it("detach 后不再响应事件", () => {
    const controller = new InputController(window, { throttleMs: 0 });
    controller.attach();
    const listener = vi.fn();
    controller.onDirection(listener);
    controller.detach();

    dispatchKey(window, "ArrowUp");
    expect(listener).not.toHaveBeenCalled();
  });

  it("onDirection 返回的取消订阅函数生效后不再收到事件", () => {
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
