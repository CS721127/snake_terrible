import { describe, expect, it } from "vitest";
import { Grid } from "../Grid";

describe("Grid", () => {
  it("构造时拒绝非正整数尺寸", () => {
    expect(() => new Grid({ columns: 0, rows: 5 })).toThrow();
    expect(() => new Grid({ columns: 5, rows: -1 })).toThrow();
  });

  it("isInBounds 正确判断格子是否在网格内", () => {
    const grid = new Grid({ columns: 5, rows: 5 });
    expect(grid.isInBounds({ x: 0, y: 0 })).toBe(true);
    expect(grid.isInBounds({ x: 4, y: 4 })).toBe(true);
    expect(grid.isInBounds({ x: 5, y: 0 })).toBe(false);
    expect(grid.isInBounds({ x: 0, y: 5 })).toBe(false);
    expect(grid.isInBounds({ x: -1, y: 0 })).toBe(false);
  });

  it("isWallCollision 与 isInBounds 互为反义", () => {
    const grid = new Grid({ columns: 3, rows: 3 });
    expect(grid.isWallCollision({ x: 2, y: 2 })).toBe(false);
    expect(grid.isWallCollision({ x: 3, y: 0 })).toBe(true);
  });

  it("randomEmptyCell 不会返回被占用的格子", () => {
    const grid = new Grid({ columns: 2, rows: 2 });
    // 占满 3 格，只留 (1,1) 空闲
    const occupied = new Set(["0,0", "1,0", "0,1"]);
    const cell = grid.randomEmptyCell(occupied);
    expect(cell).toEqual({ x: 1, y: 1 });
  });

  it("randomEmptyCell 在网格被完全占满时返回 null", () => {
    const grid = new Grid({ columns: 1, rows: 1 });
    const occupied = new Set(["0,0"]);
    expect(grid.randomEmptyCell(occupied)).toBeNull();
  });

  it("cellKey 生成稳定且唯一的字符串表示", () => {
    expect(Grid.cellKey({ x: 3, y: 7 })).toBe("3,7");
    expect(Grid.cellKey({ x: 7, y: 3 })).toBe("7,3");
  });
});
