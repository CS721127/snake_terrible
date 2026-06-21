import type { Cell, GridConfig, GridState } from "./types";

/**
 * Grid: geometry and boundary utilities for the grid world.
 *
 * Responsibility boundary (important to avoid Sprint scope creep):
 * - Only answers coordinate questions: in bounds, out of bounds, random empty cell.
 * - Does not know snake or food positions — Snake / Food / CollisionDetector own that.
 *   randomEmptyCell takes an external occupied set; Grid does not query Snake.
 */
export class Grid {
  readonly config: GridConfig;

  constructor(config: GridConfig) {
    if (config.columns <= 0 || config.rows <= 0) {
      throw new Error(
        `Grid dimensions must be positive integers; got columns=${config.columns}, rows=${config.rows}`,
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

  /** Export read-only state snapshot for pure-data use cases (network sync, test fixtures). */
  toState(): GridState {
    return { config: { ...this.config } };
  }

  /** Whether a cell coordinate lies within the grid. */
  isInBounds(cell: Cell): boolean {
    return (
      cell.x >= 0 &&
      cell.x < this.config.columns &&
      cell.y >= 0 &&
      cell.y < this.config.rows
    );
  }

  /** Whether a cell is out of bounds (inverse of isInBounds; clearer for wall-collision call sites). */
  isWallCollision(cell: Cell): boolean {
    return !this.isInBounds(cell);
  }

  /** Total cells in the grid; used for "board full" win/limit checks. */
  get totalCells(): number {
    return this.config.columns * this.config.rows;
  }

  /**
   * Pick a random empty cell not in `occupied`.
   * @param occupied currently occupied cells (usually snake body)
   * @returns random empty cell, or null if the grid is full
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

  /** Encode cell coordinates as a string key for Set/Map dedup (unified format from Sprint 1 onward). */
  static cellKey(cell: Cell): string {
    return `${cell.x},${cell.y}`;
  }
}
