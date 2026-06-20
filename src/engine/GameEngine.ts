import { Grid } from "./core/Grid";
import { Snake } from "./core/Snake";
import { SimpleFood } from "./core/SimpleFood";
import { CollisionDetector } from "./core/CollisionDetector";
import { GameState } from "./core/GameState";
import type { GamePhase } from "./core/GameState";
import { TickLoop } from "./core/TickLoop";
import { InputController } from "./core/InputController";
import { cellsEqual } from "./core/types";
import type { Direction, GridConfig } from "./core/types";
import type { RenderSnapshot } from "../rendering/Renderer";

export interface GameEngineOptions {
  grid: GridConfig;
  /** 每个逻辑 tick 的毫秒数，需求给出 150ms 作为默认值。 */
  tickIntervalMs?: number;
  cellSizePx: number;
  inputTarget: HTMLElement | Window;
  onRenderSnapshot: (snapshot: RenderSnapshot) => void;
  onScoreChange?: (score: number) => void;
  onPhaseChange?: (phase: GamePhase) => void;
}

/**
 * GameEngine：顶层门面（Facade），组合所有子系统并对外提供一个简单的接口。
 *
 * 这一层的核心价值：main.ts（UI/启动代码）不需要知道 Grid/Snake/CollisionDetector
 * 之间如何协作，只需要 new GameEngine(options) 然后调用 start()/dispose() 等少量方法。
 * 子系统之间的"先 move 蛇，再检测碰撞，再判断是否吃到食物，再决定是否结束游戏"
 * 这条核心规则链，集中写在这里的 tick() 方法里，方便单元测试与未来 Sprint 2
 * 在这条链路中插入"补码运算"步骤（替换吃食物后的逻辑，而不影响其余部分）。
 */
export class GameEngine {
  readonly grid: Grid;
  readonly state: GameState;
  private snake: Snake;
  private food: SimpleFood;
  private readonly collisionDetector: CollisionDetector;
  private readonly tickLoop: TickLoop;
  private readonly input: InputController;

  private readonly cellSizePx: number;
  private score = 0;

  private readonly onRenderSnapshot: (snapshot: RenderSnapshot) => void;
  private readonly onScoreChange?: (score: number) => void;

  constructor(options: GameEngineOptions) {
    this.grid = new Grid(options.grid);
    this.state = new GameState();
    this.cellSizePx = options.cellSizePx;
    this.onRenderSnapshot = options.onRenderSnapshot;
    this.onScoreChange = options.onScoreChange;

    this.snake = this.createInitialSnake();
    this.collisionDetector = new CollisionDetector(this.grid);
    this.food = this.spawnFood();

    this.tickLoop = new TickLoop({
      tickIntervalMs: options.tickIntervalMs ?? 150,
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

    // 无论从 IDLE 还是 GAME_OVER 进入，都重新构造一条新蛇、新分数、新食物。
    if (this.state.is("GAME_OVER")) {
      this.state.reset();
    }
    this.snake = this.createInitialSnake();
    this.score = 0;
    this.onScoreChange?.(this.score);
    this.food = this.spawnFood();

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

  private createInitialSnake(): Snake {
    const startX = Math.floor(this.grid.columns / 2);
    const startY = Math.floor(this.grid.rows / 2);
    return new Snake({
      start: { x: startX, y: startY },
      direction: "RIGHT",
      initialLength: 3,
    });
  }

  private spawnFood(): SimpleFood {
    const occupied = new Set(this.snake.body.map((c) => Grid.cellKey(c)));
    const position = this.grid.randomEmptyCell(occupied);
    // 网格够大时几乎不可能为 null；兜底放在网格中心避免类型上出现 null 分支扩散。
    return new SimpleFood(
      position ?? { x: 0, y: 0 },
      1,
    );
  }

  private handleDirectionInput(direction: Direction): void {
    if (!this.state.is("PLAYING")) return;
    this.snake.requestDirection(direction);
  }

  /** 逻辑帧：由 TickLoop 以固定间隔调用，不受渲染帧率影响。 */
  private tick(): void {
    if (!this.state.is("PLAYING")) return;

    this.snake.move();

    const collision = this.collisionDetector.checkSelfCollision(this.snake);
    if (this.collisionDetector.isFatal(collision)) {
      this.state.end();
      this.tickLoop.stop();
      this.renderFrame();
      return;
    }

    if (cellsEqual(this.snake.head, this.food.position)) {
      // Sprint 1 DoD：吃到普通食物只是单纯 +1 变长，不含补码运算。
      this.snake.grow(this.food.growthAmount);
      this.score += 1;
      this.onScoreChange?.(this.score);

      const occupied = new Set(this.snake.body.map((c) => Grid.cellKey(c)));
      this.food.respawn(this.grid, occupied);
    }
  }

  /** 渲染帧：每个 rAF 都调用，把当前逻辑状态打包成快照交给渲染器。 */
  private renderFrame(): void {
    this.onRenderSnapshot({
      grid: this.grid.config,
      snakeBody: this.snake.body,
      food: this.food.position,
      cellSizePx: this.cellSizePx,
    });
  }
}
