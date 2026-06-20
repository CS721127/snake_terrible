import type { Cell, GridConfig } from "../engine/core/types";

/** 渲染器需要的只读游戏快照——不关心游戏内部如何运作，只关心"画什么"。 */
export interface RenderSnapshot {
  readonly grid: GridConfig;
  readonly snakeBody: readonly Cell[];
  readonly food: Cell | null;
  readonly cellSizePx: number;
}

/**
 * Renderer：渲染器的抽象基类。
 *
 * Sprint 1 阶段只有一个具体实现（见 main.ts 中的 CanvasRenderer，单机场景无需区分 Host/Client 视角）。
 * 之所以仍按目录结构要求提前定义这个抽象基类，是为了在 Sprint 6 引入
 * HostViewRenderer（上帝视角，看到全图与所有玩家）与 ClientViewRenderer
 * （局部视野裁剪）时，两者可以复用同一套"挂载 canvas / resize / clear / drawCell"
 * 基础设施，只重写"画什么范围"的逻辑，而不必每个子类重新实现 Canvas 生命周期管理。
 */
export abstract class Renderer {
  protected readonly canvas: HTMLCanvasElement;
  protected readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("无法获取 2D 渲染上下文，当前环境可能不支持 Canvas");
    }
    this.ctx = ctx;
  }

  /** 根据网格配置与单格像素尺寸，调整 canvas 的物理像素大小（子类共享，避免重复实现 DPR 处理）。 */
  protected resizeToGrid(grid: GridConfig, cellSizePx: number): void {
    const dpr = window.devicePixelRatio || 1;
    const widthPx = grid.columns * cellSizePx;
    const heightPx = grid.rows * cellSizePx;

    // CSS 尺寸用逻辑像素，绘图缓冲区用物理像素并通过 scale 补偿，
    // 这样在高 DPR 屏幕（如 Retina）上也能保持线条清晰、不糊。
    this.canvas.style.width = `${widthPx}px`;
    this.canvas.style.height = `${heightPx}px`;
    this.canvas.width = widthPx * dpr;
    this.canvas.height = heightPx * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** 清空画布，子类在每次重绘开始时调用。 */
  protected clear(widthPx: number, heightPx: number): void {
    this.ctx.clearRect(0, 0, widthPx, heightPx);
  }

  /** 渲染入口，子类必须实现：给定一份快照，画出当前帧画面。 */
  abstract render(snapshot: RenderSnapshot): void;
}
