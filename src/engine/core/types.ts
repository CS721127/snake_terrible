/**
 * Core type definitions for the grid world.
 *
 * Design tradeoffs:
 * - Coordinate system: origin (0,0) at top-left, x increases right, y increases down (screen coords),
 *   matching Canvas 2D so the renderer needs no coordinate transform.
 * - Cell uses readonly fields so values are not accidentally mutated in transit;
 *   each "move" produces a new Cell object instead of mutating coordinates in place.
 */

/** A single grid cell coordinate. */
export interface Cell {
  readonly x: number;
  readonly y: number;
}

/** Snake's four movement directions. */
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

/** Grid world size configuration (in cells). */
export interface GridConfig {
  readonly columns: number;
  readonly rows: number;
}

/**
 * Read-only snapshot of grid world state.
 * In Sprint 1 the grid itself has no mutable state (no walls, portals, etc.),
 * but GridState is defined separately to:
 * 1. Decouple from the Grid class so tests can construct data without class instances;
 * 2. Reserve extension points for Sprint 6 "large map boundary expansion" (e.g. origin, wrap mode).
 */
export interface GridState {
  readonly config: GridConfig;
}

/** Unit displacement vector per direction. */
export const DIRECTION_VECTORS: Readonly<Record<Direction, Cell>> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

/** Whether two directions are opposite (used to block 180° U-turn). */
export function isOppositeDirection(a: Direction, b: Direction): boolean {
  const va = DIRECTION_VECTORS[a];
  const vb = DIRECTION_VECTORS[b];
  return va.x === -vb.x && va.y === -vb.y;
}

/** Whether two cell coordinates are equal. */
export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Next cell from a given cell and direction (no boundary handling; pure coordinate math). */
export function step(cell: Cell, direction: Direction): Cell {
  const v = DIRECTION_VECTORS[direction];
  return { x: cell.x + v.x, y: cell.y + v.y };
}
