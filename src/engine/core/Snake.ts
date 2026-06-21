import type { Cell, Direction } from "./types";
import { DIRECTION_VECTORS, cellsEqual, isOppositeDirection, step } from "./types";

export interface SnakeInitOptions {
  /** Snake's initial head position. */
  readonly start: Cell;
  /** Initial facing direction. */
  readonly direction: Direction;
  /** Initial length (including head); Sprint 1 default 3 segments so the player can see body direction immediately. */
  readonly initialLength?: number;
}

/**
 * Snake: core class managing snake body coordinates and movement logic.
 *
 * Data structure choice: body is a Cell array; body[0] is always the head, body[length-1] is the tail.
 * Array over linked list because:
 * - At Sprint 1 scale, snake length is limited (dozens to hundreds of cells); array unshift/pop cost is negligible;
 * - Rendering and network sync (StateDiffer) need an ordered snapshot of the whole snake; arrays fit naturally.
 *
 * Key design: move() does not check wall/self collision — that is CollisionDetector's job.
 * Snake only answers "if we take one legal step forward, what does state look like?" (single responsibility).
 */
export class Snake {
  private bodyCells: Cell[];
  private currentDirection: Direction;
  /** Direction to apply on the next frame (input is buffered here and applied on tick to avoid instant U-turns within one frame). */
  private pendingDirection: Direction;
  /** Pending body segments to add (after eating food +1; next move skips tail pop to grow). */
  private pendingGrowth: number;

  constructor(options: SnakeInitOptions) {
    const { start, direction, initialLength = 3 } = options;
    this.currentDirection = direction;
    this.pendingDirection = direction;
    this.pendingGrowth = 0;

    // Use start as head; lay out initial body backward along the opposite of direction.
    const body: Cell[] = [start];
    let cursor = start;
    const backward = Snake.opposite(direction);
    for (let i = 1; i < initialLength; i++) {
      cursor = step(cursor, backward);
      body.push(cursor);
    }
    this.bodyCells = body;
  }

  /** Read-only snapshot of body coordinates, ordered [head, ..., tail]. */
  get body(): readonly Cell[] {
    return this.bodyCells;
  }

  get head(): Cell {
    // body always has at least 1 segment (invariant maintained in constructor and move).
    return this.bodyCells[0] as Cell;
  }

  get tail(): Cell {
    return this.bodyCells[this.bodyCells.length - 1] as Cell;
  }

  get length(): number {
    return this.bodyCells.length;
  }

  get direction(): Direction {
    return this.currentDirection;
  }

  /**
   * Request a turn. Does not change currentDirection immediately; caches to pendingDirection
   * until the next move().
   *
   * Rules:
   * - Ignore turns opposite to current direction (prevents the snake from reversing into its neck);
   * - Multiple calls in one tick keep only the last valid request (overwrite).
   */
  requestDirection(direction: Direction): void {
    if (isOppositeDirection(direction, this.currentDirection)) {
      return;
    }
    this.pendingDirection = direction;
  }

  /** Mark the snake to grow on the next move (does not change body immediately; move handles it). */
  grow(amount: number = 1): void {
    this.pendingGrowth += amount;
  }

  resizeToLength(targetLength: number): void {
    const safeLength = Math.max(1, Math.floor(targetLength));

    if (safeLength < this.bodyCells.length) {
      this.bodyCells.length = safeLength;
      this.pendingGrowth = 0;
      return;
    }

    while (this.bodyCells.length < safeLength) {
      this.bodyCells.push(this.nextTailCell());
    }

    this.pendingGrowth = 0;
  }

  reverseFromTail(): void {
    this.bodyCells.reverse();
    this.currentDirection = Snake.opposite(this.currentDirection);
    this.pendingDirection = this.currentDirection;
  }

  /**
   * Advance one frame: move one cell in pendingDirection.
   * Returns the new head coordinate after the move, for CollisionDetector to check immediately after move().
   *
   * Grow/shrink behavior:
   * - By default each step unshifts head and pops tail (length unchanged, "sliding" look);
   * - If pendingGrowth > 0, skip tail pop (length +1), consuming 1 pendingGrowth each time;
   * - pendingGrowth may be negative (Sprint 2 complement food may shrink the snake);
   *   if negative and |pendingGrowth| accumulates, extra tail pops occur (minimum length 1,
   *   avoiding meaningless 0 or negative segment counts).
   */
  move(): Cell {
    this.currentDirection = this.pendingDirection;
    const newHead = step(this.head, this.currentDirection);
    this.bodyCells.unshift(newHead);

    if (this.pendingGrowth > 0) {
      this.pendingGrowth -= 1;
      // Grow: do not pop tail; body naturally gains one cell.
    } else if (this.pendingGrowth < 0) {
      this.pendingGrowth += 1;
      // Shrink: pop tail an extra time (but keep at least 1 segment; see shrinkTailIfPossible below).
      this.bodyCells.pop();
      this.shrinkTailIfPossible();
    } else {
      this.shrinkTailIfPossible();
    }

    return newHead;
  }

  /** Pop one tail cell but keep at least 1 body segment to avoid an empty snake. */
  private shrinkTailIfPossible(): void {
    if (this.bodyCells.length > 1) {
      this.bodyCells.pop();
    }
  }

  private nextTailCell(): Cell {
    const tail = this.tail;
    const beforeTail = this.bodyCells[this.bodyCells.length - 2];

    if (beforeTail) {
      return {
        x: tail.x + (tail.x - beforeTail.x),
        y: tail.y + (tail.y - beforeTail.y),
      };
    }

    const vector = DIRECTION_VECTORS[Snake.opposite(this.currentDirection)];
    return {
      x: tail.x + vector.x,
      y: tail.y + vector.y,
    };
  }

  /** Whether the given cell overlaps the snake body (optionally excluding head); used by CollisionDetector. */
  occupies(cell: Cell, options: { includeHead?: boolean } = {}): boolean {
    const { includeHead = true } = options;
    const cells = includeHead ? this.bodyCells : this.bodyCells.slice(1);
    return cells.some((c) => cellsEqual(c, cell));
  }

  private static opposite(direction: Direction): Direction {
    switch (direction) {
      case "UP":
        return "DOWN";
      case "DOWN":
        return "UP";
      case "LEFT":
        return "RIGHT";
      case "RIGHT":
        return "LEFT";
    }
  }
}
