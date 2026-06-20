import { Grid } from "./core/Grid";
import { Snake } from "./core/Snake";
import { CollisionDetector } from "./core/CollisionDetector";
import { GameState } from "./core/GameState";
import type { GamePhase } from "./core/GameState";
import { TickLoop } from "./core/TickLoop";
import { InputController } from "./core/InputController";
import type { Direction, GridConfig } from "./core/types";
import type { RenderSnapshot } from "../rendering/Renderer";
import { FoodPool } from "./FoodPool";
import { RevivalManager } from "./revival/RevivalManager";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

/** 各难度对应的游戏参数。 */
const DIFFICULTY_PRESETS: Record<
  DifficultyLevel,
  { grid: GridConfig; tickIntervalMs: number }
> = {
  EASY: { grid: { columns: 20, rows: 20 }, tickIntervalMs: 200 },
  MEDIUM: { grid: { columns: 28, rows: 28 }, tickIntervalMs: 150 },
  HARD: { grid: { columns: 36, rows: 36 }, tickIntervalMs: 100 },
};

export interface GameEngineOptions {
  difficulty?: DifficultyLevel;
  /** 若指定则覆盖 difficulty 给出的网格（供测试或自定义模式使用）。 */
  grid?: GridConfig;
  /** 若指定则覆盖 difficulty 给出的 tick 速度。 */
  tickIntervalMs?: number;
  cellSizePx: number;
  inputTarget: HTMLElement | Window;
  skinId?: string;
  onRenderSnapshot: (snapshot: RenderSnapshot) => void;
  onScoreChange?: (score: number) => void;
  onLengthChange?: (length: number) => void;
  onPhaseChange?: (phase: GamePhase) => void;
  onRevivalsChange?: (remaining: number, total: number) => void;
  onQuizRequired?: () => void;
  onRevivalFailed?: () => void;
}

/**
 * GameEngine：顶层门面（Facade），组合所有子系统并对外提供简单接口。
 *
 * Sprint 1.5 新增：
 * - DifficultyLevel 驱动网格大小与 tick 速度
 * - FoodPool 维持 7 个食物同时存在
 * - RevivalManager 实现 3 次免费复活 + 答题复活
 * - onLengthChange 回调供 HUD 显示蛇长
 */
export class GameEngine {
  readonly grid: Grid;
  readonly state: GameState;
  private snake: Snake;
  private readonly foodPool: FoodPool;
  private readonly collisionDetector: CollisionDetector;
  private readonly tickLoop: TickLoop;
  private readonly input: InputController;
  private readonly revival: RevivalManager;

  private readonly cellSizePx: number;
  private skinId: string;
  private score = 0;

  private readonly onRenderSnapshot: (snapshot: RenderSnapshot) => void;
  private readonly onScoreChange?: (score: number) => void;
  private readonly onLengthChange?: (length: number) => void;
  private readonly onRevivalsChange?: (remaining: number, total: number) => void;

  constructor(options: GameEngineOptions) {
    const difficulty = options.difficulty ?? "MEDIUM";
    const preset = DIFFICULTY_PRESETS[difficulty];

    const gridConfig = options.grid ?? preset.grid;
    const tickIntervalMs = options.tickIntervalMs ?? preset.tickIntervalMs;

    this.grid = new Grid(gridConfig);
    this.state = new GameState();
    this.cellSizePx = options.cellSizePx;
    this.skinId = options.skinId ?? "default";
    this.onRenderSnapshot = options.onRenderSnapshot;
    this.onScoreChange = options.onScoreChange;
    this.onLengthChange = options.onLengthChange;
    this.onRevivalsChange = options.onRevivalsChange;

    this.snake = this.createInitialSnake();
    this.collisionDetector = new CollisionDetector(this.grid);
    this.foodPool = new FoodPool(this.grid);

    this.revival = new RevivalManager({
      onFreeRevive: () => this.doRevive(),
      onQuizRequired: () => {
        // 暂停游戏，等待外部答题弹窗
        this.tickLoop.stop();
        this.state.startReviving();
        options.onQuizRequired?.();
      },
      onReviveGranted: () => this.doRevive(),
      onRevivalFailed: () => {
        this.state.resumeAfterRevival(); // REVIVING → PLAYING (临时)
        this.state.end();                // PLAYING → GAME_OVER
        this.renderFrame();
        options.onRevivalFailed?.();
      },
    });

    this.tickLoop = new TickLoop({
      tickIntervalMs,
      onTick: () => this.tick(),
      onRender: () => this.renderFrame(),
    });

    this.input = new InputController(options.inputTarget);
    this.input.onDirection((direction) => this.handleDirectionInput(direction));

    if (options.onPhaseChange) {
      this.state.onChange((phase) => options.onPhaseChange?.(phase));
    }
  }

  /** 初始化输入监听（与构造分离，方便测试时跳过真实 DOM 绑定）。 */
  attachInput(): void {
    this.input.attach();
  }

  /** 开始/重新开始一局游戏。 */
  start(): void {
    if (this.state.is("PLAYING")) return;

    if (this.state.is("GAME_OVER") || this.state.is("REVIVING")) {
      this.state.transition("IDLE");
    }

    this.snake = this.createInitialSnake();
    this.score = 0;
    this.onScoreChange?.(this.score);
    this.onLengthChange?.(this.snake.length);

    this.revival.reset();
    this.onRevivalsChange?.(this.revival.remaining, this.revival.total);

    const occupied = new Set(this.snake.body.map((c) => Grid.cellKey(c)));
    this.foodPool.init(occupied);

    this.state.start();
    this.tickLoop.start();
    this.renderFrame();
  }

  /** 彻底释放资源（移除事件监听、停止循环），供页面卸载时调用。 */
  dispose(): void {
    this.tickLoop.stop();
    this.input.detach();
  }

  getScore(): number {
    return this.score;
  }

  getSnakeLength(): number {
    return this.snake.length;
  }

  /** 外部答题结果：答对，授予复活。 */
  submitQuizSuccess(): void {
    if (!this.state.is("REVIVING")) return;
    this.revival.grantRevival();
  }

  /** 外部答题结果：答错或超时，游戏结束。 */
  submitQuizFailure(): void {
    if (!this.state.is("REVIVING")) return;
    this.revival.failRevival();
  }

  /** 更新皮肤 ID（下一帧生效）。 */
  setSkin(skinId: string): void {
    this.skinId = skinId;
  }

  /** Queues a direction input from any controller, including remote clients. */
  queueDirection(direction: Direction): void {
    if (!this.state.is("PLAYING")) return;
    this.snake.requestDirection(direction);
  }

  private createInitialSnake(): Snake {
    const startX = Math.floor(this.grid.columns / 2);
    const startY = Math.floor(this.grid.rows / 2);
    return new Snake({
      start: { x: startX, y: startY },
      direction: "RIGHT",
      initialLength: 3,
    });
  }

  private handleDirectionInput(direction: Direction): void {
    this.queueDirection(direction);
  }

  /** 逻辑帧：由 TickLoop 以固定间隔调用，不受渲染帧率影响。 */
  private tick(): void {
    if (!this.state.is("PLAYING")) return;

    this.snake.move();

    const collision = this.collisionDetector.checkSelfCollision(this.snake);
    if (this.collisionDetector.isFatal(collision)) {
      // 不直接 GAME_OVER，而是先问 RevivalManager
      this.tickLoop.stop();
      this.revival.tryRevive();
      this.onRevivalsChange?.(this.revival.remaining, this.revival.total);
      this.renderFrame();
      return;
    }

    const occupied = new Set(this.snake.body.map((c) => Grid.cellKey(c)));
    const growth = this.foodPool.tryEat(this.snake.head, occupied);
    if (growth > 0) {
      this.snake.grow(growth);
      this.score += 1;
      this.onScoreChange?.(this.score);
      this.onLengthChange?.(this.snake.length);
    }
  }

  /** 复活：把蛇重置到出生位置，恢复游戏循环。 */
  private doRevive(): void {
    // 保留蛇的长度，但重置位置到中心，避免蛇头还在墙里
    const len = this.snake.length;
    this.snake = new Snake({
      start: {
        x: Math.floor(this.grid.columns / 2),
        y: Math.floor(this.grid.rows / 2),
      },
      direction: "RIGHT",
      initialLength: len,
    });

    // 重新初始化食物，避免与复活后的蛇身重叠
    const occupied = new Set(this.snake.body.map((c) => Grid.cellKey(c)));
    this.foodPool.init(occupied);

    if (this.state.is("REVIVING")) {
      this.state.resumeAfterRevival();
    } else {
      // 免费复活路径：此时仍在 PLAYING
    }

    this.onRevivalsChange?.(this.revival.remaining, this.revival.total);
    this.onLengthChange?.(this.snake.length);
    this.tickLoop.start();
    this.renderFrame();
  }

  /** 渲染帧：每个 rAF 都调用，把当前逻辑状态打包成快照交给渲染器。 */
  private renderFrame(): void {
    this.onRenderSnapshot({
      grid: this.grid.config,
      snakeBody: this.snake.body,
      snakeDirection: this.snake.direction,
      foods: this.foodPool.getAll(),
      cellSizePx: this.cellSizePx,
      skinId: this.skinId,
    });
  }
}
