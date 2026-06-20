import { Renderer } from "./Renderer";
import type { RenderSnapshot } from "./Renderer";
import type { Direction } from "../engine/core/types";

/**
 * SkinImageCache：管理图片皮肤的 HTMLImageElement 缓存。
 * 每个 skinId 独立缓存 head/body 两张图，加载失败时自动回退到纯色渲染。
 */
class SkinImageCache {
  private cache = new Map<string, { head: HTMLImageElement; body: HTMLImageElement }>();
  private loading = new Set<string>();

  /** 触发加载（非阻塞），加载完成后下一帧自动使用。 */
  preload(skinId: string): void {
    if (this.cache.has(skinId) || this.loading.has(skinId)) return;
    this.loading.add(skinId);

    const head = new Image();
    const body = new Image();
    let headOk = false;
    let bodyOk = false;

    const tryCommit = () => {
      if (headOk && bodyOk) {
        this.cache.set(skinId, { head, body });
        this.loading.delete(skinId);
      }
    };

    head.onload = () => { headOk = true; tryCommit(); };
    body.onload = () => { bodyOk = true; tryCommit(); };
    // 加载失败时直接放弃，回退纯色
    head.onerror = () => this.loading.delete(skinId);
    body.onerror = () => this.loading.delete(skinId);

    head.src = `/assets/snake/${skinId}/head.png`;
    body.src = `/assets/snake/${skinId}/body.png`;
  }

  get(skinId: string): { head: HTMLImageElement; body: HTMLImageElement } | null {
    return this.cache.get(skinId) ?? null;
  }
}

/**
 * CanvasRenderer：Sprint 1.5 单机模式渲染器。
 *
 * 新增：
 * - 皮肤系统（default 纯色 / 图片皮肤，通过 SkinImageCache 异步加载）
 * - 多食物池渲染（foods 数组）
 * - 蛇头方向旋转（图片皮肤时自动旋转头部图片）
 */
export class CanvasRenderer extends Renderer {
  private lastResizedKey: string | null = null;
  private readonly skinCache = new SkinImageCache();

  render(snapshot: RenderSnapshot): void {
    const { grid, cellSizePx, snakeBody, snakeDirection, foods, skinId } = snapshot;

    const resizeKey = `${grid.columns}x${grid.rows}@${cellSizePx}`;
    if (resizeKey !== this.lastResizedKey) {
      this.resizeToGrid(grid, cellSizePx);
      this.lastResizedKey = resizeKey;
    }

    // 预加载图片皮肤（如果还没加载）
    if (skinId !== "default") {
      this.skinCache.preload(skinId);
    }

    const widthPx = grid.columns * cellSizePx;
    const heightPx = grid.rows * cellSizePx;

    this.clear(widthPx, heightPx);
    this.drawGridBackground(grid, cellSizePx);

    for (const food of foods) {
      this.drawFood(food.x, food.y, cellSizePx);
    }

    const images = skinId !== "default" ? this.skinCache.get(skinId) : null;
    this.drawSnake(snakeBody, snakeDirection, cellSizePx, images);
  }

  /** 棋盘格背景，明暗交替的暗绿色块，模拟"内存页"的视觉质感。 */
  private drawGridBackground(
    grid: { columns: number; rows: number },
    cellSizePx: number,
  ): void {
    const { ctx } = this;
    // 读取 CSS 变量，支持 light/dark 主题
    const colorA = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-grid-a").trim() || "#0D1A10";
    const colorB = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-grid-b").trim() || "#0F1E13";

    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.columns; x++) {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? colorA : colorB;
        ctx.fillRect(x * cellSizePx, y * cellSizePx, cellSizePx, cellSizePx);
      }
    }
  }

  private drawSnake(
    body: readonly { x: number; y: number }[],
    direction: Direction,
    cellSizePx: number,
    images: { head: HTMLImageElement; body: HTMLImageElement } | null,
  ): void {
    const { ctx } = this;
    const padding = Math.max(1, Math.floor(cellSizePx * 0.08));

    for (let i = 0; i < body.length; i++) {
      const segment = body[i];
      if (!segment) continue;
      const isHead = i === 0;

      if (images) {
        // 图片皮肤模式
        const img = isHead ? images.head : images.body;
        const x = segment.x * cellSizePx + padding;
        const y = segment.y * cellSizePx + padding;
        const size = cellSizePx - padding * 2;

        if (isHead) {
          // 旋转头部图片以匹配蛇的方向
          ctx.save();
          ctx.translate(x + size / 2, y + size / 2);
          ctx.rotate(this.directionToAngle(direction));
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          ctx.drawImage(img, x, y, size, size);
        }
      } else {
        // 默认纯色模式
        ctx.fillStyle = isHead ? "#9BFFC2" : "#39FF6A";
        ctx.fillRect(
          segment.x * cellSizePx + padding,
          segment.y * cellSizePx + padding,
          cellSizePx - padding * 2,
          cellSizePx - padding * 2,
        );

        // 头部额外画一个细的高亮描边，模拟"当前光标"的强调感。
        if (isHead) {
          ctx.strokeStyle = "#D6FFE6";
          ctx.lineWidth = Math.max(1, cellSizePx * 0.04);
          ctx.strokeRect(
            segment.x * cellSizePx + padding,
            segment.y * cellSizePx + padding,
            cellSizePx - padding * 2,
            cellSizePx - padding * 2,
          );
        }
      }
    }
  }

  private drawFood(x: number, y: number, cellSizePx: number): void {
    const { ctx } = this;
    const centerX = x * cellSizePx + cellSizePx / 2;
    const centerY = y * cellSizePx + cellSizePx / 2;
    const radius = cellSizePx * 0.32;

    ctx.fillStyle = "#FF4D6A";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FFC2CE";
    ctx.lineWidth = Math.max(1, cellSizePx * 0.03);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** 将蛇的移动方向转换为头部图片的旋转角度（弧度），以 RIGHT 为 0° 基准。 */
  private directionToAngle(direction: Direction): number {
    switch (direction) {
      case "RIGHT": return 0;
      case "DOWN":  return Math.PI / 2;
      case "LEFT":  return Math.PI;
      case "UP":    return -Math.PI / 2;
    }
  }
}
