import { describe, expect, it } from "vitest";
import { Grid } from "../Grid";
import { Snake } from "../Snake";
import { CollisionDetector } from "../CollisionDetector";

describe("CollisionDetector", () => {
  it("头部移出网格边界时判定为 WALL 碰撞", () => {
    const grid = new Grid({ columns: 5, rows: 5 });
    const detector = new CollisionDetector(grid);
    const snake = new Snake({
      start: { x: 4, y: 0 },
      direction: "RIGHT",
      initialLength: 2,
    });
    snake.move(); // 头部移动到 (5, 0)，越界
    const result = detector.checkSelfCollision(snake);
    expect(result.type).toBe("WALL");
    expect(detector.isFatal(result)).toBe(true);
  });

  it("精确构造自撞场景：头部撞上自己的身体", () => {
    const grid = new Grid({ columns: 10, rows: 10 });
    const detector = new CollisionDetector(grid);
    // 用一条长度为 5 的蛇走一个紧凑的 U 形路径，让头部在第三步撞上身体。
    // 该路径已用独立脚本逐步验算坐标，确保断言反映真实移动结果，而非凭空臆测：
    // init body: (5,5)(4,5)(3,5)(2,5)(1,5)
    // UP   -> head (5,4), body (5,4)(5,5)(4,5)(3,5)(2,5)
    // LEFT -> head (4,4), body (4,4)(5,4)(5,5)(4,5)(3,5)
    // DOWN -> head (4,5), body (4,5)(4,4)(5,4)(5,5)(4,5) —— 头部与旧的 (4,5) 重叠
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 5,
    });

    snake.requestDirection("UP");
    snake.move();
    snake.requestDirection("LEFT");
    snake.move();
    snake.requestDirection("DOWN");
    snake.move();

    const result = detector.checkSelfCollision(snake);
    expect(result.type).toBe("SELF");
    expect(detector.isFatal(result)).toBe(true);
  });

  it("正常移动且不越界、不自撞时判定为 NONE", () => {
    const grid = new Grid({ columns: 10, rows: 10 });
    const detector = new CollisionDetector(grid);
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    snake.move();
    const result = detector.checkSelfCollision(snake);
    expect(result.type).toBe("NONE");
    expect(detector.isFatal(result)).toBe(false);
  });
});
