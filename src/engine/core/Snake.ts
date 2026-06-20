import type { Cell, Direction } from "./types";
import { cellsEqual, isOppositeDirection, step } from "./types";

export interface SnakeInitOptions {
  /** 蛇的初始头部位置。 */
  readonly start: Cell;
  /** 初始朝向。 */
  readonly direction: Direction;
  /** 初始长度（含头部），Sprint 1 默认 3 节，方便玩家一开始就能看清身体方向。 */
  readonly initialLength?: number;
}

/**
 * Snake：管理蛇身坐标与移动逻辑的核心类。
 *
 * 数据结构选择：body 是一个 Cell 数组，body[0] 始终是头部，body[length-1] 是尾部。
 * 选择数组而不是链表，是因为：
 * - Sprint 1 体量下蛇身长度有限（最多几十到几百格），数组的 unshift/pop 开销可忽略；
 * - 后续渲染、网络同步（StateDiffer）都需要"整条蛇"的有序快照，数组天然满足。
 *
 * 关键设计：move() 不在内部做"撞墙/撞自己"判断——那是 CollisionDetector 的职责。
 * Snake 只管"如果合法地往前走一步，状态会变成什么样"，保持单一职责。
 */
export class Snake {
  private bodyCells: Cell[];
  private currentDirection: Direction;
  /** 下一帧待应用的方向（输入先缓存到这里，tick 时才真正生效，避免一帧内多次转向导致瞬间掉头）。 */
  private pendingDirection: Direction;
  /** 待增加的身体节数（吃到食物后 +1，在下一次 move 时"少删一节尾巴"来实现变长）。 */
  private pendingGrowth: number;

  constructor(options: SnakeInitOptions) {
    const { start, direction, initialLength = 3 } = options;
    this.currentDirection = direction;
    this.pendingDirection = direction;
    this.pendingGrowth = 0;

    // 以 start 为头部，沿 direction 的反方向铺出初始身体。
    const body: Cell[] = [start];
    let cursor = start;
    const backward = Snake.opposite(direction);
    for (let i = 1; i < initialLength; i++) {
      cursor = step(cursor, backward);
      body.push(cursor);
    }
    this.bodyCells = body;
  }

  /** 蛇身坐标的只读快照，顺序为 [头, ..., 尾]。 */
  get body(): readonly Cell[] {
    return this.bodyCells;
  }

  get head(): Cell {
    // body 始终保证至少有 1 节（构造时与 move 时都维持此不变量）。
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
   * 请求转向。不会立刻改变 currentDirection，而是缓存到 pendingDirection，
   * 真正生效要等到下一次 move()。
   *
   * 规则：
   * - 忽略与当前方向相反的转向请求（防止蛇直接反向"咬"自己的颈部）；
   * - 同一 tick 内多次调用，只保留最后一次合法的请求（覆盖式写入）。
   */
  requestDirection(direction: Direction): void {
    if (isOppositeDirection(direction, this.currentDirection)) {
      return;
    }
    this.pendingDirection = direction;
  }

  /** 标记蛇在下一次 move 时应该变长（不立即改变 body，由 move 统一处理）。 */
  grow(amount: number = 1): void {
    this.pendingGrowth += amount;
  }

  /**
   * 推进一帧：朝 pendingDirection 移动一格。
   * 返回移动后的新头部坐标，供 CollisionDetector 在 move 之后立即检测碰撞。
   *
   * 变长/缩短的实现方式：
   * - 默认每走一步，头部前插一格、尾部弹出一格（长度不变，"平移"的视觉效果）；
   * - 若 pendingGrowth > 0，则跳过弹出尾部（长度 +1），每次消耗 1 点 pendingGrowth；
   * - pendingGrowth 允许为负数预留（Sprint 2 补码运算可能产生"变短"的食物效果），
   *   若为负且 |pendingGrowth| 达到一定量，则额外弹出尾部格子（但保证长度下限为 1，
   *   避免蛇被吃到 0 节甚至负数节这种无意义状态）。
   */
  move(): Cell {
    this.currentDirection = this.pendingDirection;
    const newHead = step(this.head, this.currentDirection);
    this.bodyCells.unshift(newHead);

    if (this.pendingGrowth > 0) {
      this.pendingGrowth -= 1;
      // 变长：不弹出尾部，body 自然多了一格。
    } else if (this.pendingGrowth < 0) {
      this.pendingGrowth += 1;
      // 变短：额外多弹出一次尾部（但至少保留 1 节，下面统一兜底）。
      this.bodyCells.pop();
      this.shrinkTailIfPossible();
    } else {
      this.shrinkTailIfPossible();
    }

    return newHead;
  }

  /** 弹出尾部一格，但保证蛇身至少保留 1 节，避免出现空蛇。 */
  private shrinkTailIfPossible(): void {
    if (this.bodyCells.length > 1) {
      this.bodyCells.pop();
    }
  }

  /** 判断给定格子是否与蛇身（不含头部，或按需含头部）发生重叠，供 CollisionDetector 调用。 */
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
