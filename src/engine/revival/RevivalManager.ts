/**
 * RevivalManager: manages player revival counts and quiz flow.
 *
 * Rules:
 * - Each game starts with FREE_REVIVALS (default 3) free revival chances.
 * - Free revival: triggers onFreeRevive callback directly; snake continues at current length.
 * - After free revivals are exhausted: triggers onQuizRequired and waits for the quiz UI.
 *   - Correct answer: triggers onReviveGranted (same effect as free revival).
 *   - Wrong answer / timeout: triggers onRevivalFailed → true GAME_OVER.
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

  /** Reset revival count (called at the start of each game). */
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
   * Called when the player triggers a collision.
   * - If free revivals remain → revive directly, consume 1, call onFreeRevive.
   * - If none remain → call onQuizRequired and wait for external quiz result.
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
   * External quiz result callback: call when the answer is correct.
   */
  grantRevival(): void {
    this.onReviveGranted();
  }

  /**
   * External quiz result callback: call on wrong answer or timeout.
   */
  failRevival(): void {
    this.onRevivalFailed();
  }
}
