import type { Direction } from "./types";

type DirectionListener = (direction: Direction) => void;

export interface InputControllerOptions {
  /** Minimum swipe distance (px) for touch gestures; below this counts as accidental tap, no turn. */
  swipeThresholdPx?: number;
  /**
   * Throttle interval (ms): accept at most one direction input per window.
   * Prevents accidental bursts (key repeat, touch inertia after swipe end).
   * Separate from TickLoop tick rate — this limits input event frequency, not logic frame rate;
   * even if throttle < tick interval, it still prevents multiple turns from one gesture in a single tick.
   */
  throttleMs?: number;
}

const DEFAULT_SWIPE_THRESHOLD_PX = 24;
const DEFAULT_THROTTLE_MS = 60;

/**
 * InputController: unified keyboard + touch input; exposes only "direction input" events.
 *
 * Does not depend on Snake/GameEngine directly; broadcasts Direction via listener pattern
 * so tests can validate throttle logic without real DOM events.
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

  /** Start listening to DOM events. */
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

  /** Stop listening to avoid leaks (call on page leave / component unmount). */
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
    // Prevent arrow keys from scrolling the page and interfering with gameplay.
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
   * Resolve direction on touchmove (not touchend) for snappier swipe response,
   * closer to native "swipe once, turn immediately".
   * After resolving, touchActive is false so one swipe does not emit multiple directions.
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

    this.touchActive = false; // swipe resolved; wait for next touchstart
    this.emit(direction);
  }

  private handleTouchEnd(): void {
    this.touchActive = false;
  }
}
