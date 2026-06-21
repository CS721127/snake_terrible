import { describe, expect, it } from "vitest";
import { Snake } from "../Snake";

describe("Snake", () => {
  it("lays out initial body backward from start for the given length", () => {
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

  it("after move, head advances one cell in current direction; body shifts; length unchanged", () => {
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

  it("requestDirection ignores turns opposite to current direction", () => {
    const snake = new Snake({
      start: { x: 5, y: 5 },
      direction: "RIGHT",
      initialLength: 3,
    });
    snake.requestDirection("LEFT"); // should be ignored
    snake.move();
    expect(snake.direction).toBe("RIGHT");
    expect(snake.head).toEqual({ x: 6, y: 5 });
  });

  it("requestDirection accepts valid perpendicular turns applied on next move", () => {
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

  it("multiple requestDirection calls in one frame keep only the last valid request", () => {
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

  it("after grow(1), next move increases length by 1 without dropping tail", () => {
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

  it("multiple grow calls accumulate pending growth", () => {
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
    // Third move: pendingGrowth exhausted, length stops growing
    expect(snake.length).toBe(3);
  });

  it("occupies includes head by default; includeHead:false excludes head", () => {
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

  it("body length is not shrunk to 0 by shrink logic", () => {
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
