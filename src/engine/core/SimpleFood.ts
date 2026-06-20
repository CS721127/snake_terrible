import type { Cell } from "./types";
import type { Grid } from "./Grid";

/**
 * SimpleFood：Sprint 1 阶段的占位食物实现。
 *
 * 按 Definition of Done 要求："食物只是普通 +1 变长"，不含任何补码/位运算逻辑。
 * 这个类会在 Sprint 2 被 engine/complement/Food.ts 中的正式 Food 类替代或包装，
 * 因此特意保持最小职责（只管"位置"和"固定增长量"），不在这里预埋补码相关字段，
 * 避免 Sprint 2 设计时被 Sprint 1 的占位实现"绑架"。
 */
export class SimpleFood {
  private currentPosition: Cell;
  /** Sprint 1 固定为 +1，预留为可配置项方便后续测试，但默认值满足 DoD 的"普通+1变长"。 */
  readonly growthAmount: number;

  constructor(position: Cell, growthAmount: number = 1) {
    this.currentPosition = position;
    this.growthAmount = growthAmount;
  }

  get position(): Cell {
    return this.currentPosition;
  }

  /** 食物被吃后，在网格的空格中重新生成一个新位置。 */
  respawn(grid: Grid, occupied: ReadonlySet<string>): boolean {
    const next = grid.randomEmptyCell(occupied);
    if (!next) return false;
    this.currentPosition = next;
    return true;
  }
}
