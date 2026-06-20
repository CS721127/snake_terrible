import type { Direction } from "./types";

type DirectionListener = (direction: Direction) => void;

export interface InputControllerOptions {
  /** 触屏滑动手势的最小有效距离（像素），低于这个距离视为误触/点击，不触发转向。 */
  swipeThresholdPx?: number;
  /**
   * 节流间隔（毫秒）：同一时间窗口内只接受一次方向输入。
   * 防误触场景：手指/手柄在短时间内连续触发多次相同或不同方向的事件
   * （例如键盘按键重复触发、触屏滑动结束时的惯性多次 touchmove）。
   * 注意这与 TickLoop 的 tick 节流是两件事——这里限制的是"输入事件本身的频率"，
   * 而不是"逻辑帧的频率"；即使节流值小于 tick 间隔，仍能防止单个 tick 内被同一手势触发多次。
   */
  throttleMs?: number;
}

const DEFAULT_SWIPE_THRESHOLD_PX = 24;
const DEFAULT_THROTTLE_MS = 60;

/**
 * InputController：统一键盘 + 触屏输入，对外只暴露"方向输入事件"。
 *
 * 不直接依赖 Snake/GameEngine，而是用监听者模式向外广播 Direction，
 * 这样测试时可以完全脱离 DOM 真实事件，直接调用内部处理函数验证节流逻辑。
 */
export class InputController {
  private readonly swipeThresholdPx: number;
  private readonly throttleMs: number;
  private listeners: Set<DirectionListener> = new Set();

  private lastEmitTime = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchActive = false;

  private readonly target: HTMLElement | Window;
  private boundKeydown: (e: KeyboardEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor(target: HTMLElement | Window, options: InputControllerOptions = {}) {
    this.target = target;
    this.swipeThresholdPx = options.swipeThresholdPx ?? DEFAULT_SWIPE_THRESHOLD_PX;
    this.throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS;

    this.boundKeydown = this.handleKeydown.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
  }

  /** 开始监听 DOM 事件。 */
  attach(): void {
    this.target.addEventListener("keydown", this.boundKeydown as EventListener);
    this.target.addEventListener("touchstart", this.boundTouchStart as EventListener, {
      passive: true,
    });
    this.target.addEventListener("touchmove", this.boundTouchMove as EventListener, {
      passive: true,
    });
    this.target.addEventListener("touchend", this.boundTouchEnd as EventListener, {
      passive: true,
    });
  }

  /** 停止监听，避免内存泄漏（页面切走/组件卸载时调用）。 */
  detach(): void {
    this.target.removeEventListener("keydown", this.boundKeydown as EventListener);
    this.target.removeEventListener("touchstart", this.boundTouchStart as EventListener);
    this.target.removeEventListener("touchmove", this.boundTouchMove as EventListener);
    this.target.removeEventListener("touchend", this.boundTouchEnd as EventListener);
  }

  onDirection(listener: DirectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(direction: Direction): void {
    const now = performance.now();
    if (now - this.lastEmitTime < this.throttleMs) {
      return;
    }
    this.lastEmitTime = now;
    for (const listener of this.listeners) {
      listener(direction);
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    const direction = InputController.keyToDirection(e.key);
    if (!direction) return;
    // 阻止方向键滚动页面这种默认行为干扰游戏操作体验。
    e.preventDefault();
    this.emit(direction);
  }

  private static keyToDirection(key: string): Direction | null {
    switch (key) {
      case "ArrowUp":
      case "w":
      case "W":
        return "UP";
      case "ArrowDown":
      case "s":
      case "S":
        return "DOWN";
      case "ArrowLeft":
      case "a":
      case "A":
        return "LEFT";
      case "ArrowRight":
      case "d":
      case "D":
        return "RIGHT";
      default:
        return null;
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    if (!touch) return;
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchActive = true;
  }

  /**
   * 在 touchmove 阶段就判定方向（而不是等 touchend），
   * 这样滑动操作的响应更及时，手感更接近原生游戏的"滑一下立刻转向"。
   * 判定后立即把 touchActive 置为 false，避免同一次滑动连续触发多个方向事件。
   */
  private handleTouchMove(e: TouchEvent): void {
    if (!this.touchActive) return;
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < this.swipeThresholdPx) {
      return;
    }

    const direction: Direction =
      absDx > absDy ? (dx > 0 ? "RIGHT" : "LEFT") : dy > 0 ? "DOWN" : "UP";

    this.touchActive = false; // 本次滑动已判定，等待下一次 touchstart 重新激活
    this.emit(direction);
  }

  private handleTouchEnd(): void {
    this.touchActive = false;
  }
}
