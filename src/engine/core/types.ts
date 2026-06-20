/**
 * 网格世界的基础类型定义。
 *
 * 设计取舍：
 * - 坐标系采用「左上角为原点 (0,0)，x 向右增长，y 向下增长」的屏幕坐标系，
 *   与 Canvas 2D 坐标系保持一致，渲染层无需做坐标变换。
 * - Cell 使用 readonly 字段，保证传递过程中不会被意外修改；
 *   每次「移动」都产生一个新的 Cell 对象，而不是原地修改坐标。
 */

/** 网格中的一个格子坐标。 */
export interface Cell {
  readonly x: number;
  readonly y: number;
}

/** 蛇的四个移动方向。 */
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

/** 网格世界的尺寸配置（单位：格）。 */
export interface GridConfig {
  readonly columns: number;
  readonly rows: number;
}

/**
 * 网格世界的只读状态快照。
 * Sprint 1 阶段网格本身没有可变状态（不含墙体、传送门等），
 * 但单独定义 GridState 类型是为了：
 * 1. 与 Grid 类解耦，方便单元测试直接构造数据而不依赖类实例；
 * 2. 为后续 Sprint 6「大地图边界扩展」预留扩展位（例如 origin、wrap 模式等）。
 */
export interface GridState {
  readonly config: GridConfig;
}

/** 每个方向对应的单位位移向量。 */
export const DIRECTION_VECTORS: Readonly<Record<Direction, Cell>> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

/** 判断两个方向是否互为相反方向（用于阻止蛇直接 180° 掉头）。 */
export function isOppositeDirection(a: Direction, b: Direction): boolean {
  const va = DIRECTION_VECTORS[a];
  const vb = DIRECTION_VECTORS[b];
  return va.x === -vb.x && va.y === -vb.y;
}

/** 判断两个格子坐标是否相同。 */
export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

/** 按给定方向，从某个格子出发计算下一个格子（不做边界处理，纯坐标运算）。 */
export function step(cell: Cell, direction: Direction): Cell {
  const v = DIRECTION_VECTORS[direction];
  return { x: cell.x + v.x, y: cell.y + v.y };
}
