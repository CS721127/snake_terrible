import type { Cell, GridConfig, Direction } from "../engine/core/types";
import type { BitwiseFoodSnapshot } from "../engine/bitwise/BitwiseFood";

/** Read-only game snapshot for the renderer — cares only about what to draw, not how the game works internally. */
export interface RenderSnapshot {
  readonly grid: GridConfig;
  readonly snakeBody: readonly Cell[];
  readonly snakeDirection: Direction;
  /** Sprint 1.5: food pool, always 7 foods present at once. */
  readonly foods: readonly BitwiseFoodSnapshot[];
  readonly cellSizePx: number;
  /** Skin ID; "default" is solid color, other values map to image skins under public/assets/snake/{skinId}/. */
  readonly skinId: string;
}

/**
 * Renderer: abstract base class for renderers.
 *
 * Sprint 1 has only one concrete implementation (CanvasRenderer).
 * This abstract base is defined early per directory structure so that when Sprint 6
 * introduces HostViewRenderer and ClientViewRenderer, both can reuse the same
 * "mount canvas / resize / clear / drawCell" infrastructure and only override what range to draw.
 */
export abstract class Renderer {
  protected readonly canvas: HTMLCanvasElement;
  protected readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to get 2D rendering context; this environment may not support Canvas");
    }
    this.ctx = ctx;
  }

  /** Adjust canvas physical pixel size from grid config and cell size (shared by subclasses to avoid duplicating DPR handling). */
  protected resizeToGrid(grid: GridConfig, cellSizePx: number): void {
    const dpr = window.devicePixelRatio || 1;
    const widthPx = grid.columns * cellSizePx;
    const heightPx = grid.rows * cellSizePx;

    // CSS size uses logical pixels; drawing buffer uses physical pixels compensated via scale,
    // so lines stay crisp on high-DPR screens (e.g. Retina).
    this.canvas.style.width = `${widthPx}px`;
    this.canvas.style.height = `${heightPx}px`;
    this.canvas.width = widthPx * dpr;
    this.canvas.height = heightPx * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Clear the canvas; subclasses call this at the start of each redraw. */
  protected clear(widthPx: number, heightPx: number): void {
    this.ctx.clearRect(0, 0, widthPx, heightPx);
  }

  /** Render entry point; subclasses must implement: given a snapshot, draw the current frame. */
  abstract render(snapshot: RenderSnapshot): void;
}
