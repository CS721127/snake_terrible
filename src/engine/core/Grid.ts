import type { Cell, GridConfig, GridState } from "./types";

/**
 * Grid：网格世界的几何与边界工具类。
 *
 * 职责边界（重要，避免后续 Sprint 职责混乱）：
 * - 只回答"坐标层面"的问题：是否在界内、是否越界、随机空格在哪。
 * - 不知道蛇在哪、食物在哪——那是 Snake / Food / CollisionDetector 的职责。
 *   Grid 在判断"随机空格子"时需要外部传入"已占用格子集合"，而不是自己去查询 Snake。
 */
export class Grid {
  readonly config: GridConfig;

  constructor(config: GridConfig) {
    if (config.columns <= 0 || config.rows <= 0) {
      throw new Error(
        `Grid 尺寸必须为正整数，收到 columns=${config.columns}, rows=${config.rows}`,
      );
    }
    this.config = { ...config };
  }

  get columns(): number {
    return this.config.columns;
  }

  get rows(): number {
    return this.config.rows;
  }

  /** 导出只读状态快照，供需要纯数据（而非类实例）的场景使用，例如网络同步、单测构造。 */
  toState(): GridState {
    return { config: { ...this.config } };
  }

  /** 判断某个格子坐标是否落在网格范围内。 */
  isInBounds(cell: Cell): boolean {
    return (
      cell.x >= 0 &&
      cell.x < this.config.columns &&
      cell.y >= 0 &&
      cell.y < this.config.rows
    );
  }

  /** 判断某个格子是否越界（isInBounds 的反义，语义更贴合"撞墙"场景，调用处更直观）。 */
  isWallCollision(cell: Cell): boolean {
    return !this.isInBounds(cell);
  }

  /** 网格中格子总数，常用于"是否已被蛇填满全图"等胜利/极限条件判断。 */
  get totalCells(): number {
    return this.config.columns * this.config.rows;
  }

  /**
   * 在网格内随机挑选一个不在 `occupied` 集合中的空格子。
   * @param occupied 当前被占用的格子（通常是蛇身）
   * @returns 随机空格子；若网格已被完全占满则返回 null
   */
  randomEmptyCell(occupied: ReadonlySet<string>): Cell | null {
    const freeCells: Cell[] = [];
    for (let y = 0; y < this.config.rows; y++) {
      for (let x = 0; x < this.config.columns; x++) {
        const key = Grid.cellKey({ x, y });
        if (!occupied.has(key)) {
          freeCells.push({ x, y });
        }
      }
    }
    if (freeCells.length === 0) return null;
    const index = Math.floor(Math.random() * freeCells.length);
    return freeCells[index] ?? null;
  }

  /** 将格子坐标编码为字符串 key，用于 Set/Map 去重（Sprint 1 起统一使用，避免各处自行拼接格式不一致）。 */
  static cellKey(cell: Cell): string {
    return `${cell.x},${cell.y}`;
  }
}
