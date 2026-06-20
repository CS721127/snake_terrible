import { describe, expect, it } from "vitest";
import { Snake } from "../Snake";

describe("Snake", () => {
  it("初始化时按反方向铺出指定长度的身体", () => {
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    expect(snake.length).toBe(3);
    expect(snake.body).toEqual([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ]);
    expect(snake.head).toEqual({ x: 5, y: 5 });
    expect(snake.tail).toEqual({ x: 3, y: 5 });
  });

  it("move 后头部按当前方向前进一格，身体整体平移，长度不变", () => {
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    const newHead = snake.move();
    expect(newHead).toEqual({ x: 6, y: 5 });
    expect(snake.length).toBe(3);
    expect(snake.body).toEqual([
      { x: 6, y: 5 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ]);
  });

  it("requestDirection 忽略与当前方向相反的转向请求", () => {
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    snake.requestDirection("LEFT"); // 应该被忽略
    snake.move();
    expect(snake.direction).toBe("RIGHT");
    expect(snake.head).toEqual({ x: 6, y: 5 });
  });

  it("requestDirection 接受合法的垂直转向，并在下一次 move 时生效", () => {
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    snake.requestDirection("UP");
    snake.move();
    expect(snake.direction).toBe("UP");
    expect(snake.head).toEqual({ x: 5, y: 4 });
  });

  it("同一帧内多次 requestDirection 只保留最后一次合法请求", () => {
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    snake.requestDirection("UP");
    snake.requestDirection("DOWN");
    snake.move();
    expect(snake.direction).toBe("DOWN");
  });

  it("grow(1) 后下一次 move 长度 +1，且不丢弃尾部", () => {
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    snake.grow(1);
    snake.move();
    expect(snake.length).toBe(4);
    expect(snake.body).toEqual([
      { x: 6, y: 5 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ]);
  });

  it("grow 多次调用可以累积多段增长", () => {
    const snake = new Snake({
      start: { x: 0, y: 0 },
      direction: "RIGHT",
      initialLength: 1,
    });
    snake.grow(2);
    snake.move();
    expect(snake.length).toBe(2);
    snake.move();
    expect(snake.length).toBe(3);
    snake.move();
    // 第三次 move 时 pendingGrowth 已耗尽，长度不再增加
    expect(snake.length).toBe(3);
  });

  it("occupies 默认包含头部，可通过 includeHead:false 排除头部", () => {
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    expect(snake.occupies({ x: 5, y: 5 })).toBe(true);
    expect(snake.occupies({ x: 5, y: 5 }, { includeHead: false })).toBe(false);
    expect(snake.occupies({ x: 4, y: 5 }, { includeHead: false })).toBe(true);
    expect(snake.occupies({ x: 99, y: 99 })).toBe(false);
  });

  it("蛇身长度不会因变短逻辑被收缩到 0", () => {
    const snake = new Snake({
      start: { x: 0, y: 0 },
      direction: "RIGHT",
      initialLength: 1,
    });
    snake.grow(-5);
    for (let i = 0; i < 5; i++) {
      snake.move();
    }
    expect(snake.length).toBeGreaterThanOrEqual(1);
  });
});
