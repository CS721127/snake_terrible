import type { Cell } from "./types";
import { Grid } from "./Grid";
import { Snake } from "./Snake";

export type CollisionType = "WALL" | "SELF" | "NONE";

export interface CollisionResult {
  readonly type: CollisionType;
  readonly cell: Cell;
}

/**
 * CollisionDetector：碰撞判定的唯一权威来源。
 *
 * 设计原则：判定逻辑不依赖游戏循环的执行时机——给定"网格 + 蛇 + 待检测的格子"，
 * 任何时候调用都应该得到确定性的结果，方便单元测试与（未来）网络对账时双端复现同一结论。
 */
export class CollisionDetector {
  constructor(private readonly grid: Grid) {}

  /**
   * 检测蛇的头部是否发生撞墙或撞自己。
   *
   * 注意调用时机：应该在 Snake.move() 之后，用移动后的新头部坐标调用本方法，
   * 而不是用移动前的坐标——否则永远检测不到"刚好移动到墙外/身体上"的那一帧。
   *
   * 撞自己的判定：检测头部是否与"自己身体除头部以外的部分"重叠。
   * 这里特意排除头部自身（includeHead: false），否则刚移动完头部必然与 body[0] 重合，
   * 会产生误判。
   */
  checkSelfCollision(snake: Snake): CollisionResult {
    const head = snake.head;

    if (this.grid.isWallCollision(head)) {
      return { type: "WALL", cell: head };
    }

    if (snake.occupies(head, { includeHead: false })) {
      return { type: "SELF", cell: head };
    }

    return { type: "NONE", cell: head };
  }

  /** 便捷布尔判断：是否发生了任意一种致命碰撞（游戏结束条件）。 */
  isFatal(result: CollisionResult): boolean {
    return result.type !== "NONE";
  }
}
