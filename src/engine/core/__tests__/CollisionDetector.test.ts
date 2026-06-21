import { describe, expect, it } from "vitest";
import { Grid } from "../Grid";
import { Snake } from "../Snake";
import { CollisionDetector } from "../CollisionDetector";

describe("CollisionDetector", () => {
  it("detects WALL collision when head moves outside grid bounds", () => {
    const grid = new Grid({ columns: 5, rows: 5 });
    const detector = new CollisionDetector(grid);
    const snake = new Snake({
      start: { x: 4, y: 0 },
      direction: "RIGHT",
      initialLength: 2,
    });
    snake.move(); // head moves to (5, 0), out of bounds
    const result = detector.checkSelfCollision(snake);
    expect(result.type).toBe("WALL");
    expect(detector.isFatal(result)).toBe(true);
  });

  it("constructs precise self-collision: head hits its own body", () => {
    const grid = new Grid({ columns: 10, rows: 10 });
    const detector = new CollisionDetector(grid);
    // Length-5 snake on a tight U path; head hits body on step 3.
    // Path verified step-by-step with a script so assertions match real moves:
    // init body: (5,5)(4,5)(3,5)(2,5)(1,5)
    // UP   -> head (5,4), body (5,4)(5,5)(4,5)(3,5)(2,5)
    // LEFT -> head (4,4), body (4,4)(5,4)(5,5)(4,5)(3,5)
    // DOWN -> head (4,5), body (4,5)(4,4)(5,4)(5,5)(4,5) — head overlaps old (4,5)
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

  it("returns NONE for normal in-bounds move with no self-collision", () => {
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
