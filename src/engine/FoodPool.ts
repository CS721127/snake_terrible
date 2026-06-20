import type { Cell } from "./core/types";
import { Grid } from "./core/Grid";
import { SimpleFood } from "./core/SimpleFood";

const POOL_SIZE = 7;

/**
 * FoodPool：始终维持 POOL_SIZE（7）个食物同时存在于网格中。
 *
 * 设计要点：
 * - 每帧由 GameEngine.tick() 调用 tryEat()，检测蛇头是否碰到任意一个食物；
 *   碰到则立即在随机空格补一个新食物，保证池子大小恒为 POOL_SIZE。
 * - 食物坐标不与蛇身重叠（通过 occupied 集合过滤），也不与已有食物重叠
 *   （初始化 / 补位时先把所有食物坐标加入 occupied）。
 */
export class FoodPool {
  private readonly items: SimpleFood[];
  private readonly grid: Grid;

  constructor(grid: Grid) {
    this.grid = grid;
    this.items = [];
  }

  /**
   * 用给定的「已占用格子集合」初始化食物池。
   * 通常在每局开始时（蛇已就位后）调用一次。
   */
  init(snakeOccupied: ReadonlySet<string>): void {
    this.items.length = 0;
    const occupied = new Set(snakeOccupied);

    for (let i = 0; i < POOL_SIZE; i++) {
      const pos = this.grid.randomEmptyCell(occupied);
      if (!pos) break; // 网格太小放不下，提前退出
      const food = new SimpleFood(pos, 1);
      this.items.push(food);
      occupied.add(Grid.cellKey(pos));
    }
  }

  /** 返回所有食物的位置快照，供渲染器使用。 */
  getAll(): readonly Cell[] {
    return this.items.map((f) => f.position);
  }

  get size(): number {
    return this.items.length;
  }

  /**
   * 检测蛇头是否吃到了池中任意食物。
   * 若吃到，立即补位，返回该食物的成长量（Sprint 1.5 固定 1）。
   * 若未吃到，返回 0。
   *
   * @param head 蛇头坐标
   * @param snakeOccupied 当前蛇身占据的所有格子（用于补位时避开蛇身）
   */
  tryEat(head: Cell, snakeOccupied: ReadonlySet<string>): number {
    for (const food of this.items) {
      if (food.position.x === head.x && food.position.y === head.y) {
        // 补位：先把所有现有食物位置 + 蛇身都标记为 occupied
        const occupied = new Set(snakeOccupied);
        for (const f of this.items) {
          occupied.add(Grid.cellKey(f.position));
        }
        food.respawn(this.grid, occupied);
        return food.growthAmount;
      }
    }
    return 0;
  }
}
