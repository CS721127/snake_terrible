import { describe, expect, it } from "vitest";
import { Grid } from "../Grid";

describe("Grid", () => {
  it("rejects non-positive integer dimensions on construction", () => {
    expect(() => new Grid({ columns: 0, rows: 5 })).toThrow();
    expect(() => new Grid({ columns: 5, rows: -1 })).toThrow();
  });

  it("isInBounds correctly determines whether a cell is inside the grid", () => {
    const grid = new Grid({ columns: 5, rows: 5 });
    expect(grid.isInBounds({ x: 0, y: 0 })).toBe(true);
    expect(grid.isInBounds({ x: 4, y: 4 })).toBe(true);
    expect(grid.isInBounds({ x: 5, y: 0 })).toBe(false);
    expect(grid.isInBounds({ x: 0, y: 5 })).toBe(false);
    expect(grid.isInBounds({ x: -1, y: 0 })).toBe(false);
  });

  it("isWallCollision is the inverse of isInBounds", () => {
    const grid = new Grid({ columns: 3, rows: 3 });
    expect(grid.isWallCollision({ x: 2, y: 2 })).toBe(false);
    expect(grid.isWallCollision({ x: 3, y: 0 })).toBe(true);
  });

  it("randomEmptyCell does not return occupied cells", () => {
    const grid = new Grid({ columns: 2, rows: 2 });
    // Occupy 3 cells, only (1,1) free
    const occupied = new Set(["0,0", "1,0", "0,1"]);
    const cell = grid.randomEmptyCell(occupied);
    expect(cell).toEqual({ x: 1, y: 1 });
  });

  it("randomEmptyCell returns null when the grid is full", () => {
    const grid = new Grid({ columns: 1, rows: 1 });
    const occupied = new Set(["0,0"]);
    expect(grid.randomEmptyCell(occupied)).toBeNull();
  });

  it("cellKey produces stable unique string keys", () => {
    expect(Grid.cellKey({ x: 3, y: 7 })).toBe("3,7");
    expect(Grid.cellKey({ x: 7, y: 3 })).toBe("7,3");
  });
});
