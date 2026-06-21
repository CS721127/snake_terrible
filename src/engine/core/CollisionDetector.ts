import type { Cell } from "./types";
import { Grid } from "./Grid";
import { Snake } from "./Snake";

export type CollisionType = "WALL" | "SELF" | "NONE";

export interface CollisionResult {
  readonly type: CollisionType;
  readonly cell: Cell;
}

/**
 * CollisionDetector: single authoritative source for collision checks.
 *
 * Design principle: logic does not depend on when the game loop runs — given "grid + snake + cell to test",
 * any call should be deterministic for unit tests and (future) network reconciliation.
 */
export class CollisionDetector {
  constructor(private readonly grid: Grid) {}

  /**
   * Check whether the snake head hit a wall or itself.
   *
   * Call timing: after Snake.move(), using the new head coordinate —
   * not the pre-move head — or you will never detect the frame where the head moves onto a wall/body cell.
   *
   * Self-collision: head vs body excluding head (includeHead: false).
   * Head is excluded because right after move, head coincides with body[0] and would false-positive.
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

  /** Convenience: whether any fatal collision occurred (game-over condition). */
  isFatal(result: CollisionResult): boolean {
    return result.type !== "NONE";
  }
}
