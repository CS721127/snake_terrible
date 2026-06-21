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
import { applyBitwiseOperation } from "./bitwise/BitwiseMath";
import { generateLengthChoices } from "./bitwise/LengthChoices";
import type {
  LengthChoice,
  LengthChoiceReason,
} from "./bitwise/LengthChoices";
import {
  generateLengthPatternGoal,
  matchesLengthPattern,
} from "./bitwise/LengthPattern";
import type { LengthPatternGoal } from "./bitwise/LengthPattern";
import {
  checkPostGameChallenge,
  generatePostGameChallenge,
} from "./bitwise/PostGameChallenge";
import type {
  ChallengeCheckResult,
  PostGameChallenge,
} from "./bitwise/PostGameChallenge";
import { AUTO_SKIN_IDS } from "./skins";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
export type GameResult = "WIN" | "LOSE";

export interface LengthChoiceRequest {
  readonly reason: LengthChoiceReason;
  readonly choices: readonly LengthChoice[];
}

const GAME_DURATION_MS = 180_000;
const TARGET_SCORE = 5;
const MAX_RENDERED_SNAKE_SEGMENTS = 128;

/** 玩家可在游戏中调整的 tick 间隔范围（todo.md 要求运行时调速）。数值越小蛇移动越快。 */
const MIN_TICK_INTERVAL_MS = 60;
const MAX_TICK_INTERVAL_MS = 320;

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
  grid?: GridConfig;
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
  onLengthChoicesRequired?: (request: LengthChoiceRequest) => void;
  onPatternChange?: (goal: LengthPatternGoal) => void;
  onTimerChange?: (remainingMs: number, totalMs: number) => void;
  onGameResultChange?: (result: GameResult | null) => void;
  onBonusChallengeChange?: (challenge: PostGameChallenge | null, resolved: boolean) => void;
  onSkinChange?: (skinId: string) => void;
  onSpeedChange?: (tickIntervalMs: number) => void;
}

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
  private tickIntervalMs: number;
  private skinId: string;
  private score = 0;
  private logicalLength = 3;
  private timeRemainingMs = GAME_DURATION_MS;
  private gameResult: GameResult | null = null;
  private patternGoal: LengthPatternGoal = generateLengthPatternGoal(3);
  private bonusChallenge: PostGameChallenge | null = null;
  private bonusResolved = false;
  private waitingForLengthChoice = false;

  private readonly onRenderSnapshot: (snapshot: RenderSnapshot) => void;
  private readonly onScoreChange?: (score: number) => void;
  private readonly onLengthChange?: (length: number) => void;
  private readonly onRevivalsChange?: (remaining: number, total: number) => void;
  private readonly onLengthChoicesRequired?: (request: LengthChoiceRequest) => void;
  private readonly onPatternChange?: (goal: LengthPatternGoal) => void;
  private readonly onTimerChange?: (remainingMs: number, totalMs: number) => void;
  private readonly onGameResultChange?: (result: GameResult | null) => void;
  private readonly onBonusChallengeChange?: (
    challenge: PostGameChallenge | null,
    resolved: boolean,
  ) => void;
  private readonly onSkinChange?: (skinId: string) => void;
  private readonly onSpeedChange?: (tickIntervalMs: number) => void;

  constructor(options: GameEngineOptions) {
    const difficulty = options.difficulty ?? "MEDIUM";
    const preset = DIFFICULTY_PRESETS[difficulty];

    const gridConfig = options.grid ?? preset.grid;
    const tickIntervalMs = options.tickIntervalMs ?? preset.tickIntervalMs;

    this.grid = new Grid(gridConfig);
    this.state = new GameState();
    this.cellSizePx = options.cellSizePx;
    this.tickIntervalMs = tickIntervalMs;
    this.skinId = options.skinId ?? "default";
    this.onRenderSnapshot = options.onRenderSnapshot;
    this.onScoreChange = options.onScoreChange;
    this.onLengthChange = options.onLengthChange;
    this.onRevivalsChange = options.onRevivalsChange;
    this.onLengthChoicesRequired = options.onLengthChoicesRequired;
    this.onPatternChange = options.onPatternChange;
    this.onTimerChange = options.onTimerChange;
    this.onGameResultChange = options.onGameResultChange;
    this.onBonusChallengeChange = options.onBonusChallengeChange;
    this.onSkinChange = options.onSkinChange;
    this.onSpeedChange = options.onSpeedChange;

    this.collisionDetector = new CollisionDetector(this.grid);
    this.foodPool = new FoodPool(this.grid);
    this.snake = this.createInitialSnake(this.logicalLength);

    this.revival = new RevivalManager({
      onFreeRevive: () => this.doRevive(),
      onQuizRequired: () => {
        this.tickLoop.stop();
        this.state.startReviving();
        options.onQuizRequired?.();
      },
      onReviveGranted: () => this.doRevive(),
      onRevivalFailed: () => {
        if (this.state.is("REVIVING")) {
          this.state.resumeAfterRevival();
        }
        this.finishGame();
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

  attachInput(): void {
    this.input.attach();
  }

  start(initialLength = 3, reverseFromTail = false): void {
    if (this.state.is("PLAYING")) return;

    if (this.state.is("GAME_OVER") || this.state.is("REVIVING")) {
      this.state.transition("IDLE");
    }

    this.score = 0;
    this.logicalLength = Math.max(1, Math.floor(initialLength));
    this.timeRemainingMs = GAME_DURATION_MS;
    this.gameResult = null;
    this.bonusChallenge = null;
    this.bonusResolved = false;
    this.waitingForLengthChoice = false;
    this.patternGoal = generateLengthPatternGoal(this.logicalLength);
    this.snake = this.createInitialSnake(this.logicalLength);
    if (reverseFromTail) {
      this.snake.reverseFromTail();
    }
    this.randomizeSkin();

    this.onScoreChange?.(this.score);
    this.onLengthChange?.(this.logicalLength);
    this.onTimerChange?.(this.timeRemainingMs, GAME_DURATION_MS);
    this.onPatternChange?.(this.patternGoal);
    this.onGameResultChange?.(this.gameResult);
    this.onBonusChallengeChange?.(this.bonusChallenge, this.bonusResolved);

    this.revival.reset();
    this.onRevivalsChange?.(this.revival.remaining, this.revival.total);

    const occupied = new Set(this.snake.body.map((c) => Grid.cellKey(c)));
    this.foodPool.init(occupied);

    this.state.start();
    this.tickLoop.start();
    this.renderFrame();
  }

  dispose(): void {
    this.tickLoop.stop();
    this.input.detach();
  }

  getScore(): number {
    return this.score;
  }

  getSnakeLength(): number {
    return this.logicalLength;
  }

  getRemainingTimeMs(): number {
    return this.timeRemainingMs;
  }

  getTargetScore(): number {
    return TARGET_SCORE;
  }

  getTickIntervalMs(): number {
    return this.tickIntervalMs;
  }

  getSpeedRange(): { minMs: number; maxMs: number } {
    return { minMs: MIN_TICK_INTERVAL_MS, maxMs: MAX_TICK_INTERVAL_MS };
  }

  /**
   * 玩家在游戏过程中调整移动速度（todo.md 要求）。
   * 数值越小蛇移动越快；范围被夹在 [MIN_TICK_INTERVAL_MS, MAX_TICK_INTERVAL_MS] 内，
   * 防止极端值导致游戏不可玩（太快无法反应 / 太慢失去紧张感）。
   */
  setSpeed(tickIntervalMs: number): void {
    const clamped = Math.min(
      MAX_TICK_INTERVAL_MS,
      Math.max(MIN_TICK_INTERVAL_MS, Math.round(tickIntervalMs)),
    );
    this.tickIntervalMs = clamped;
    this.tickLoop.setTickIntervalMs(clamped);
    this.onSpeedChange?.(clamped);
  }

  submitQuizSuccess(): void {
    if (!this.state.is("REVIVING")) return;
    this.revival.grantRevival();
  }

  submitQuizFailure(): void {
    if (!this.state.is("REVIVING")) return;
    this.revival.failRevival();
  }

  submitBonusAnswer(answer: string): ChallengeCheckResult {
    if (!this.bonusChallenge || this.bonusResolved) {
      return { ok: false, message: "No active bonus challenge." };
    }

    const result = checkPostGameChallenge(answer, this.bonusChallenge);
    if (result.ok) {
      this.bonusResolved = true;
      this.score += 1;
      this.gameResult = this.score >= TARGET_SCORE ? "WIN" : this.gameResult;
      this.onScoreChange?.(this.score);
      this.onGameResultChange?.(this.gameResult);
      this.onBonusChallengeChange?.(this.bonusChallenge, this.bonusResolved);
    }

    return result;
  }

  /** 皮肤不支持手动自定义（todo.md 要求），仅供内部在 start / pattern 切换时调用。 */
  private randomizeSkin(): void {
    const index = Math.floor(Math.random() * AUTO_SKIN_IDS.length);
    const nextSkinId = AUTO_SKIN_IDS[index] ?? "default";
    this.skinId = nextSkinId;
    this.onSkinChange?.(nextSkinId);
  }

  queueDirection(direction: Direction): void {
    if (!this.state.is("PLAYING") || this.waitingForLengthChoice) return;
    this.snake.requestDirection(direction);
  }

  applyLengthChoice(choice: LengthChoice): void {
    if (!this.state.is("PLAYING") || !this.waitingForLengthChoice) return;

    this.waitingForLengthChoice = false;
    this.applyLogicalLength(choice.resultLength, choice.reversed);
    this.patternGoal = generateLengthPatternGoal(this.logicalLength);
    this.onPatternChange?.(this.patternGoal);
    this.randomizeSkin();
    this.tickLoop.start();
    this.renderFrame();
  }

  private createInitialSnake(logicalLength: number): Snake {
    const startX = Math.floor(this.grid.columns / 2);
    const startY = Math.floor(this.grid.rows / 2);
    return new Snake({
      start: { x: startX, y: startY },
      direction: "RIGHT",
      initialLength: this.toRenderedSnakeLength(logicalLength),
    });
  }

  private handleDirectionInput(direction: Direction): void {
    this.queueDirection(direction);
  }

  private tick(): void {
    if (!this.state.is("PLAYING") || this.waitingForLengthChoice) return;

    this.timeRemainingMs = Math.max(0, this.timeRemainingMs - this.tickIntervalMs);
    this.onTimerChange?.(this.timeRemainingMs, GAME_DURATION_MS);
    if (this.timeRemainingMs <= 0) {
      this.finishGame();
      return;
    }

    this.snake.move();

    const collision = this.collisionDetector.checkSelfCollision(this.snake);
    if (this.collisionDetector.isFatal(collision)) {
      this.tickLoop.stop();
      this.revival.tryRevive();
      this.onRevivalsChange?.(this.revival.remaining, this.revival.total);
      this.renderFrame();
      return;
    }

    const occupied = new Set(this.snake.body.map((c) => Grid.cellKey(c)));
    const food = this.foodPool.tryEat(this.snake.head, occupied);
    if (!food) return;

    const nextLength = applyBitwiseOperation(
      this.logicalLength,
      food.operation,
      food.value,
    );
    this.applyLogicalLength(nextLength.length, nextLength.reversed);
    this.checkPatternScore();
  }

  private checkPatternScore(): void {
    if (!matchesLengthPattern(this.logicalLength, this.patternGoal)) return;

    this.score += 1;
    this.onScoreChange?.(this.score);

    if (this.score >= TARGET_SCORE) {
      this.finishGame();
      return;
    }

    this.requestLengthChoice("PATTERN_MATCH");
  }

  private requestLengthChoice(reason: LengthChoiceReason): void {
    this.waitingForLengthChoice = true;
    this.tickLoop.stop();
    const choices = generateLengthChoices();

    if (this.onLengthChoicesRequired) {
      this.onLengthChoicesRequired({ reason, choices });
      return;
    }

    const fallback = choices[0];
    if (fallback) {
      this.applyLengthChoice(fallback);
    }
  }

  private applyLogicalLength(length: number, reverseFromTail: boolean): void {
    this.logicalLength = Math.max(1, Math.floor(length));
    this.snake.resizeToLength(this.toRenderedSnakeLength(this.logicalLength));
    if (reverseFromTail) {
      this.snake.reverseFromTail();
    }

    this.onLengthChange?.(this.logicalLength);
  }

  private finishGame(): void {
    this.tickLoop.stop();
    this.waitingForLengthChoice = false;

    if (this.state.is("REVIVING")) {
      this.state.resumeAfterRevival();
    }

    if (!this.state.is("PLAYING")) return;

    this.gameResult = this.score >= TARGET_SCORE ? "WIN" : "LOSE";
    this.state.end();
    this.bonusChallenge = generatePostGameChallenge(this.logicalLength);
    this.bonusResolved = false;
    this.onGameResultChange?.(this.gameResult);
    this.onBonusChallengeChange?.(this.bonusChallenge, this.bonusResolved);
    this.renderFrame();
  }

  private doRevive(): void {
    this.snake = this.createInitialSnake(this.logicalLength);

    const occupied = new Set(this.snake.body.map((c) => Grid.cellKey(c)));
    this.foodPool.init(occupied);

    if (this.state.is("REVIVING")) {
      this.state.resumeAfterRevival();
    }

    this.onRevivalsChange?.(this.revival.remaining, this.revival.total);
    this.onLengthChange?.(this.logicalLength);
    this.tickLoop.start();
    this.renderFrame();
  }

  /**
   * 渲染（网格中实际可见）长度 = 逻辑长度 / 4（todo.md 要求）。
   * 例如逻辑长度 128 时，玩家在网格里操控的蛇只有 32 格长。
   * 这与 8-bit 逻辑长度上限 255 配合：渲染长度上限约 64 格，
   * 在常见 20~36 格的网格尺寸下仍是合理可玩的体量。
   */
  private toRenderedSnakeLength(logicalLength: number): number {
    const boardCap = Math.max(1, this.grid.totalCells - this.foodPool.size - 1);
    const scaledLength = Math.floor(logicalLength / 4);
    return Math.max(
      1,
      Math.min(scaledLength, boardCap, MAX_RENDERED_SNAKE_SEGMENTS),
    );
  }

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
