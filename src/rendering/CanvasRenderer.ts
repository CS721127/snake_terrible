import { Renderer } from "./Renderer";
import type { RenderSnapshot } from "./Renderer";

/**
 * CanvasRenderer：Sprint 1 单机模式下唯一的渲染器实现。
 *
 * 视觉基调：终端 / 寄存器美学。即使 Sprint 1 还不含补码玩法，
 * 也提前把"这是一台计算机内部的游戏"的视觉语言立住——网格像内存地址表，
 * 蛇头像一个跳动的光标，颜色取自经典磷光绿终端配色，而不是泛用的霓虹赛博风。
 *
 * 性能要点（"刷新流畅无闪烁"验收标准）：
 * - 每帧完整 clearRect 后重绘，不依赖增量重绘，Sprint 1 网格规模下性能足够；
 * - 不在 render() 内创建新对象/新渐变（渐变在构造时预先计算好的颜色字符串即可），
 *   减少每帧 GC 压力，避免长时间运行后出现卡顿造成的"闪烁感"。
 */
export class CanvasRenderer extends Renderer {
  private lastResizedKey: string | null = null;

  render(snapshot: RenderSnapshot): void {
    const { grid, cellSizePx, snakeBody, food } = snapshot;

    const resizeKey = `${grid.columns}x${grid.rows}@${cellSizePx}`;
    if (resizeKey !== this.lastResizedKey) {
      this.resizeToGrid(grid, cellSizePx);
      this.lastResizedKey = resizeKey;
    }

    const widthPx = grid.columns * cellSizePx;
    const heightPx = grid.rows * cellSizePx;

    this.clear(widthPx, heightPx);
    this.drawGridBackground(grid, cellSizePx);

    if (food) {
      this.drawFood(food.x, food.y, cellSizePx);
    }

    this.drawSnake(snakeBody, cellSizePx);
  }

  /** 棋盘格背景，明暗交替的暗绿色块，模拟"内存页"的视觉质感。 */
  private drawGridBackground(
    grid: { columns: number; rows: number },
    cellSizePx: number,
  ): void {
    const { ctx } = this;
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.columns; x++) {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? "#0D1A10" : "#0F1E13";
        ctx.fillRect(x * cellSizePx, y * cellSizePx, cellSizePx, cellSizePx);
      }
    }
  }

  private drawSnake(body: readonly { x: number; y: number }[], cellSizePx: number): void {
    const { ctx } = this;
    const padding = Math.max(1, Math.floor(cellSizePx * 0.08));

    for (let i = 0; i < body.length; i++) {
      const segment = body[i];
      if (!segment) continue;
      const isHead = i === 0;

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
}
