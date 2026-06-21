import type { Cell } from "./types";
import type { Grid } from "./Grid";

/**
 * SimpleFood: Sprint 1 placeholder food implementation.
 *
 * Per Definition of Done: "food is plain +1 growth" with no complement/bitwise logic.
 * Sprint 2 replaces or wraps this with engine/complement/Food.ts;
 * kept minimal (position + fixed growth only) so Sprint 1 does not constrain Sprint 2 design.
 */
export class SimpleFood {
  private currentPosition: Cell;
  /** Sprint 1 fixed at +1; configurable for tests; default satisfies DoD "plain +1 growth". */
  readonly growthAmount: number;

  constructor(position: Cell, growthAmount: number = 1) {
    this.currentPosition = position;
    this.growthAmount = growthAmount;
  }

  get position(): Cell {
    return this.currentPosition;
  }

  /** After food is eaten, respawn at a new empty grid cell. */
  respawn(grid: Grid, occupied: ReadonlySet<string>): boolean {
    const next = grid.randomEmptyCell(occupied);
    if (!next) return false;
    this.currentPosition = next;
    return true;
  }
}
