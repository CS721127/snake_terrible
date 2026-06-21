import { Renderer } from "./Renderer";
import type { RenderSnapshot } from "./Renderer";
import type { Direction } from "../engine/core/types";
import type { BitwiseFoodSnapshot } from "../engine/bitwise/BitwiseFood";
import { foodColorByTone } from "../engine/bitwise/FoodLegend";
import {
  getSkinAsset,
  getUniversityForSegment,
  UNIVERSITY_SKIN_ID,
} from "../engine/skins";
import type { SkinAsset, UniversityAsset } from "../engine/skins";

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
    const asset = getSkinAsset(skinId);
    if (!asset.headSrc || !asset.bodySrc) return;

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

    head.src = asset.headSrc;
    body.src = asset.bodySrc;
  }

  get(skinId: string): { head: HTMLImageElement; body: HTMLImageElement } | null {
    return this.cache.get(skinId) ?? null;
  }
}

/**
 * UniversityLogoCache：拼接蛇皮肤专用的逐校 logo 缓存。
 * 与 SkinImageCache 分开是因为拼接蛇不是"一个皮肤两张图"，
 * 而是"一个皮肤、每段身体可能对应不同大学的 logo"，按大学 id 缓存即可，
 * 任意一所大学的 logo 缺失/加载失败时该段自动回退到颜色块 + 缩写。
 */
class UniversityLogoCache {
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Set<string>();
  private failed = new Set<string>();

  preload(university: UniversityAsset): void {
    const { id, logoSrc } = university;
    if (!logoSrc || this.cache.has(id) || this.loading.has(id) || this.failed.has(id)) {
      return;
    }

    this.loading.add(id);
    const img = new Image();
    img.onload = () => {
      this.cache.set(id, img);
      this.loading.delete(id);
    };
    img.onerror = () => {
      // 该大学 logo 文件还没准备好（todo.md 占位阶段），记下来避免重复尝试加载。
      this.loading.delete(id);
      this.failed.add(id);
    };
    img.src = logoSrc;
  }

  get(universityId: string): HTMLImageElement | null {
    return this.cache.get(universityId) ?? null;
  }
}

/**
 * CanvasRenderer：Sprint 1.5 单机模式渲染器。
 *
 * 新增：
 * - 皮肤系统（default 纯色 / 图片皮肤，通过 SkinImageCache 异步加载）
 * - 拼接蛇皮肤（university）：逐段按 UNSW→Melbourne→Sydney→...→Western→UNSW 循环取 logo
 * - 多食物池渲染（foods 数组）
 * - 蛇头方向旋转（图片皮肤时自动旋转头部图片）
 */
export class CanvasRenderer extends Renderer {
  private lastResizedKey: string | null = null;
  private readonly skinCache = new SkinImageCache();
  private readonly universityLogoCache = new UniversityLogoCache();

  render(snapshot: RenderSnapshot): void {
    const { grid, cellSizePx, snakeBody, snakeDirection, foods, skinId } = snapshot;

    const resizeKey = `${grid.columns}x${grid.rows}@${cellSizePx}`;
    if (resizeKey !== this.lastResizedKey) {
      this.resizeToGrid(grid, cellSizePx);
      this.lastResizedKey = resizeKey;
    }

    const skinAsset = getSkinAsset(skinId);
    const widthPx = grid.columns * cellSizePx;
    const heightPx = grid.rows * cellSizePx;

    this.clear(widthPx, heightPx);
    this.drawGridBackground(grid, cellSizePx);

    for (const food of foods) {
      this.drawFood(food, cellSizePx);
    }

    if (skinId === UNIVERSITY_SKIN_ID) {
      this.drawUniversitySnake(snakeBody, snakeDirection, cellSizePx);
      return;
    }

    // 预加载图片皮肤（如果还没加载）
    if (skinAsset.headSrc && skinAsset.bodySrc) {
      this.skinCache.preload(skinId);
    }

    const images = skinAsset.headSrc && skinAsset.bodySrc
      ? this.skinCache.get(skinId)
      : null;
    this.drawSnake(snakeBody, snakeDirection, cellSizePx, images, skinAsset);
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
    skinAsset: SkinAsset,
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
        ctx.fillStyle = isHead
          ? skinAsset.placeholder.headColor
          : skinAsset.placeholder.bodyColor;
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
          if (skinAsset.id !== "default") {
            ctx.fillStyle = "#06130b";
            ctx.font = `${Math.max(7, Math.floor(cellSizePx * 0.36))}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              skinAsset.placeholder.initials.slice(0, 2),
              segment.x * cellSizePx + cellSizePx / 2,
              segment.y * cellSizePx + cellSizePx / 2,
            );
          }
        }
      }
    }
  }

  /**
   * 拼接蛇皮肤的逐段绘制：每一段身体根据它在蛇身上的位置（index）
   * 去查对应的大学（getUniversityForSegment），而不是整条蛇共用一张 head/body 图。
   * index 0（蛇头）永远是 UNSW；用完一整轮大学后从 UNSW 重新循环。
   */
  private drawUniversitySnake(
    body: readonly { x: number; y: number }[],
    direction: Direction,
    cellSizePx: number,
  ): void {
    const { ctx } = this;
    const padding = Math.max(1, Math.floor(cellSizePx * 0.08));

    for (let i = 0; i < body.length; i++) {
      const segment = body[i];
      if (!segment) continue;
      const isHead = i === 0;

      const university = getUniversityForSegment(i);
      this.universityLogoCache.preload(university);
      const logo = this.universityLogoCache.get(university.id);

      const x = segment.x * cellSizePx + padding;
      const y = segment.y * cellSizePx + padding;
      const size = cellSizePx - padding * 2;

      if (logo) {
        if (isHead) {
          ctx.save();
          ctx.translate(x + size / 2, y + size / 2);
          ctx.rotate(this.directionToAngle(direction));
          ctx.drawImage(logo, -size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          ctx.drawImage(logo, x, y, size, size);
        }
        continue;
      }

      // Logo 还没准备好时的占位：该大学专属颜色块 + 缩写，行为与其它图片皮肤的回退逻辑一致。
      ctx.fillStyle = university.placeholder.color;
      ctx.fillRect(x, y, size, size);

      if (isHead) {
        ctx.strokeStyle = "#D6FFE6";
        ctx.lineWidth = Math.max(1, cellSizePx * 0.04);
        ctx.strokeRect(x, y, size, size);
      }

      ctx.fillStyle = "#06130b";
      ctx.font = `${Math.max(7, Math.floor(cellSizePx * 0.36))}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        university.placeholder.initials.slice(0, 2),
        x + size / 2,
        y + size / 2,
      );
    }
  }

  private drawFood(food: BitwiseFoodSnapshot, cellSizePx: number): void {
    const { ctx } = this;
    const centerX = food.x * cellSizePx + cellSizePx / 2;
    const centerY = food.y * cellSizePx + cellSizePx / 2;
    const radius = cellSizePx * 0.32;

    ctx.fillStyle = foodColorByTone(food.tone);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = Math.max(1, cellSizePx * 0.03);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#06130b";
    ctx.font = `${Math.max(7, Math.floor(cellSizePx * 0.36))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.shortFoodLabel(food), centerX, centerY);
  }

  private shortFoodLabel(food: BitwiseFoodSnapshot): string {
    if (food.operation === "~") return "~";
    if (food.operation === "<<") return `L${food.value ?? 0}`;
    if (food.operation === ">>") return `R${food.value ?? 0}`;
    return `${food.operation}${(food.value ?? 0).toString(16).toUpperCase().padStart(2, "0")}`;
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
