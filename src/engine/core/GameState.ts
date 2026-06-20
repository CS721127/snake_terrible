export type GamePhase = "IDLE" | "PLAYING" | "REVIVING" | "GAME_OVER";

type StateChangeListener = (next: GamePhase, prev: GamePhase) => void;

/** 合法的状态迁移表：key 为当前状态，value 为该状态允许迁移到的目标状态集合。 */
const ALLOWED_TRANSITIONS: Readonly<Record<GamePhase, readonly GamePhase[]>> = {
  IDLE: ["PLAYING"],
  PLAYING: ["GAME_OVER", "IDLE", "REVIVING"],
  // REVIVING：等待答题中，可以复活回 PLAYING，也可以答错直接 GAME_OVER
  REVIVING: ["PLAYING", "GAME_OVER", "IDLE"],
  GAME_OVER: ["IDLE"],
};

/**
 * GameState：单机游戏的状态机。
 *
 * Idle     —— 尚未开始 / 等待玩家操作开始游戏（显示开始界面）
 * Playing  —— 游戏进行中（TickLoop 驱动蛇移动）
 * Reviving —— 发生碰撞后，等待玩家答题或消耗免费复活次数（TickLoop 暂停）
 * GameOver —— 致命碰撞且复活失败后进入，显示结算界面
 *
 * 设计取舍：用显式的迁移白名单（ALLOWED_TRANSITIONS）而不是"想到哪写到哪"的 if/else，
 * 是因为状态机最容易在项目变大后出现"本不该发生的跳转"，显式表驱动可以在出问题的
 * 第一时间提前阻断，而不是悄悄进入不一致状态。
 */
export class GameState {
  private phase: GamePhase = "IDLE";
  private listeners: Set<StateChangeListener> = new Set();

  get current(): GamePhase {
    return this.phase;
  }

  is(phase: GamePhase): boolean {
    return this.phase === phase;
  }

  /** 订阅状态变化，返回取消订阅函数。 */
  onChange(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 尝试迁移到目标状态。
   * @param next 目标状态
   * @returns 是否成功迁移（非法迁移返回 false 而不是抛错）
   */
  transition(next: GamePhase): boolean {
    if (next === this.phase) return false;
    const allowed = ALLOWED_TRANSITIONS[this.phase];
    if (!allowed.includes(next)) {
      return false;
    }
    const prev = this.phase;
    this.phase = next;
    for (const listener of this.listeners) {
      listener(next, prev);
    }
    return true;
  }

  /** 语义化快捷方法：开始游戏。 */
  start(): boolean {
    return this.transition("PLAYING");
  }

  /** 语义化快捷方法：游戏结束。 */
  end(): boolean {
    return this.transition("GAME_OVER");
  }

  /** 语义化快捷方法：重置回 Idle，准备下一局。 */
  reset(): boolean {
    return this.transition("IDLE");
  }

  /** 语义化快捷方法：进入复活等待状态（暂停游戏，等待答题）。 */
  startReviving(): boolean {
    return this.transition("REVIVING");
  }

  /** 语义化快捷方法：复活成功，恢复游戏。 */
  resumeAfterRevival(): boolean {
    return this.transition("PLAYING");
  }
}
