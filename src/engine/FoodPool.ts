import type { Cell } from "./core/types";
import { Grid } from "./core/Grid";
import { BitwiseFood } from "./bitwise/BitwiseFood";
import type { BitwiseFoodSnapshot } from "./bitwise/BitwiseFood";

const POOL_SIZE = 8;

export class FoodPool {
  private readonly items: BitwiseFood[] = [];

  constructor(private readonly grid: Grid) {}

  init(snakeOccupied: ReadonlySet<string>): void {
    this.items.length = 0;
    const occupied = new Set(snakeOccupied);

    for (let i = 0; i < POOL_SIZE; i++) {
      const pos = this.grid.randomEmptyCell(occupied);
      if (!pos) break;
      const food = BitwiseFood.randomAt(pos);
      this.items.push(food);
      occupied.add(Grid.cellKey(pos));
    }
  }

  getAll(): readonly BitwiseFoodSnapshot[] {
    return this.items.map((food) => food.snapshot);
  }

  get size(): number {
    return this.items.length;
  }

  tryEat(head: Cell, snakeOccupied: ReadonlySet<string>): BitwiseFood | null {
    for (let i = 0; i < this.items.length; i++) {
      const food = this.items[i];
      if (!food) continue;

      if (food.position.x !== head.x || food.position.y !== head.y) {
        continue;
      }

      const occupied = new Set(snakeOccupied);
      for (const existing of this.items) {
        occupied.add(Grid.cellKey(existing.position));
      }

      const replacement = food.respawn(this.grid, occupied);
      if (replacement) {
        this.items[i] = replacement;
      } else {
        this.items.splice(i, 1);
      }

      return food;
    }

    return null;
  }
}
