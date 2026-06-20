/**
 * RevivalManager：管理玩家的复活次数与答题流程。
 *
 * 规则：
 * - 每局开始时有 FREE_REVIVALS 次（默认 3）免费复活机会。
 * - 免费复活：直接触发 onFreeRevive 回调，蛇保持当前长度继续游戏。
 * - 免费次数耗尽：触发 onQuizRequired，等待上层展示答题弹窗。
 *   - 答对：触发 onReviveGranted（同免费复活效果）。
 *   - 答错/超时：触发 onRevivalFailed → 真正 GAME_OVER。
 */

export interface RevivalManagerOptions {
  freeRevivalsPerGame?: number;
  onFreeRevive: () => void;
  onQuizRequired: () => void;
  onReviveGranted: () => void;
  onRevivalFailed: () => void;
}

export class RevivalManager {
  private readonly freeRevivalsPerGame: number;
  private freeRevivalsLeft: number;

  private readonly onFreeRevive: () => void;
  private readonly onQuizRequired: () => void;
  private readonly onReviveGranted: () => void;
  private readonly onRevivalFailed: () => void;

  constructor(options: RevivalManagerOptions) {
    this.freeRevivalsPerGame = options.freeRevivalsPerGame ?? 3;
    this.freeRevivalsLeft = this.freeRevivalsPerGame;
    this.onFreeRevive = options.onFreeRevive;
    this.onQuizRequired = options.onQuizRequired;
    this.onReviveGranted = options.onReviveGranted;
    this.onRevivalFailed = options.onRevivalFailed;
  }

  /** 重置复活次数（每局开始时调用）。 */
  reset(): void {
    this.freeRevivalsLeft = this.freeRevivalsPerGame;
  }

  get remaining(): number {
    return this.freeRevivalsLeft;
  }

  get total(): number {
    return this.freeRevivalsPerGame;
  }

  /**
   * 玩家触发碰撞后调用。
   * - 有免费次数 → 直接复活，消耗 1 次，调用 onFreeRevive。
   * - 无免费次数 → 调用 onQuizRequired，等待外部答题结果。
   */
  tryRevive(): void {
    if (this.freeRevivalsLeft > 0) {
      this.freeRevivalsLeft -= 1;
      this.onFreeRevive();
    } else {
      this.onQuizRequired();
    }
  }

  /**
   * 外部答题结果回调：答对时调用。
   */
  grantRevival(): void {
    this.onReviveGranted();
  }

  /**
   * 外部答题结果回调：答错或超时时调用。
   */
  failRevival(): void {
    this.onRevivalFailed();
  }
}
