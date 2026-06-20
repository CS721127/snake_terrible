export type GamePhase = "IDLE" | "PLAYING" | "GAME_OVER";

type StateChangeListener = (next: GamePhase, prev: GamePhase) => void;

/** 合法的状态迁移表：key 为当前状态，value 为该状态允许迁移到的目标状态集合。 */
const ALLOWED_TRANSITIONS: Readonly<Record<GamePhase, readonly GamePhase[]>> = {
  IDLE: ["PLAYING"],
  PLAYING: ["GAME_OVER", "IDLE"], // 允许 PLAYING -> IDLE，用于"中途重置"场景
  GAME_OVER: ["IDLE"],
};

/**
 * GameState：单机游戏的状态机。
 *
 * Idle    —— 尚未开始 / 等待玩家操作开始游戏（显示开始界面）
 * Playing —— 游戏进行中（TickLoop 驱动蛇移动）
 * GameOver—— 发生致命碰撞后进入，显示结算界面，等待玩家重新开始
 *
 * 设计取舍：用显式的迁移白名单（ALLOWED_TRANSITIONS）而不是"想到哪写到哪"的 if/else，
 * 是因为状态机最容易在项目变大后出现"本不该发生的跳转"（例如 GameOver 时收到 PLAYING 请求
 * 又把游戏复活了），显式表驱动可以在出问题的第一时间 throw，而不是悄悄进入不一致状态。
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
   * @returns 是否成功迁移（非法迁移返回 false 而不是抛错，方便调用处用 if 守卫而不必 try/catch）
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
}
