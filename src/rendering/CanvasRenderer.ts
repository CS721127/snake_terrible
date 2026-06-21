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
 * SkinImageCache: manages HTMLImageElement cache for image-based skins.
 * Each skinId caches head/body images independently; on load failure, falls back to solid-color rendering.
 */
class SkinImageCache {
  private cache = new Map<string, { head: HTMLImageElement; body: HTMLImageElement }>();
  private loading = new Set<string>();

  /** Trigger load (non-blocking); next frame uses the image once loaded. */
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
    // On load failure, give up and fall back to solid color
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
 * UniversityLogoCache: per-university logo cache for the stitched snake skin.
 * Separate from SkinImageCache because the stitched snake is not "one skin, two images",
 * but "one skin where each body segment may use a different university logo"; cache by university id.
 * If any university logo is missing or fails to load, that segment falls back to color block + initials.
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
      // University logo file not ready yet (todo.md placeholder phase); record failure to avoid retrying.
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
 * CanvasRenderer: Sprint 1.5 single-player renderer.
 *
 * Additions:
 * - Skin system (default solid color / image skins, loaded asynchronously via SkinImageCache)
 * - Stitched snake skin (university): per-segment logos in UNSW→Melbourne→Sydney→...→Western→UNSW cycle
 * - Multi-food pool rendering (foods array)
 * - Head direction rotation (auto-rotate head image for image skins)
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

    // Preload image skin if not loaded yet
    if (skinAsset.headSrc && skinAsset.bodySrc) {
      this.skinCache.preload(skinId);
    }

    const images = skinAsset.headSrc && skinAsset.bodySrc
      ? this.skinCache.get(skinId)
      : null;
    this.drawSnake(snakeBody, snakeDirection, cellSizePx, images, skinAsset);
  }

  /** Checkerboard background with alternating dark green cells, evoking a "memory page" look. */
  private drawGridBackground(
    grid: { columns: number; rows: number },
    cellSizePx: number,
  ): void {
    const { ctx } = this;
    // Read CSS variables to support light/dark themes
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
        // Image skin mode
        const img = isHead ? images.head : images.body;
        const x = segment.x * cellSizePx + padding;
        const y = segment.y * cellSizePx + padding;
        const size = cellSizePx - padding * 2;

        if (isHead) {
          // Rotate head image to match snake direction
          ctx.save();
          ctx.translate(x + size / 2, y + size / 2);
          ctx.rotate(this.directionToAngle(direction));
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          ctx.drawImage(img, x, y, size, size);
        }
      } else {
        // Default solid-color mode
        ctx.fillStyle = isHead
          ? skinAsset.placeholder.headColor
          : skinAsset.placeholder.bodyColor;
        ctx.fillRect(
          segment.x * cellSizePx + padding,
          segment.y * cellSizePx + padding,
          cellSizePx - padding * 2,
          cellSizePx - padding * 2,
        );

        // Extra thin highlight stroke on the head, like a "current cursor" emphasis.
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
   * Per-segment drawing for the stitched snake skin: each body segment looks up its university
   * by position (getUniversityForSegment), instead of one head/body image for the whole snake.
   * Index 0 (head) is always UNSW; after a full university cycle, loop back to UNSW.
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

      // Placeholder when logo is not ready: university color block + initials, same fallback as other image skins.
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

  /** Convert snake movement direction to head image rotation angle (radians), with RIGHT as 0°. */
  private directionToAngle(direction: Direction): number {
    switch (direction) {
      case "RIGHT": return 0;
      case "DOWN":  return Math.PI / 2;
      case "LEFT":  return Math.PI;
      case "UP":    return -Math.PI / 2;
    }
  }
}
