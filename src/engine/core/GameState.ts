export type GamePhase = "IDLE" | "PLAYING" | "REVIVING" | "GAME_OVER";

type StateChangeListener = (next: GamePhase, prev: GamePhase) => void;

/** Valid state transition table: key is current state, value is the set of allowed target states. */
const ALLOWED_TRANSITIONS: Readonly<Record<GamePhase, readonly GamePhase[]>> = {
  IDLE: ["PLAYING"],
  PLAYING: ["GAME_OVER", "IDLE", "REVIVING"],
  // REVIVING: waiting for quiz; can revive back to PLAYING or go straight to GAME_OVER on wrong answer
  REVIVING: ["PLAYING", "GAME_OVER", "IDLE"],
  GAME_OVER: ["IDLE"],
};

/**
 * GameState: single-player game state machine.
 *
 * Idle     — not started / waiting for player to start (start screen)
 * Playing  — game in progress (TickLoop drives snake movement)
 * Reviving — after collision, waiting for quiz or free revival (TickLoop paused)
 * GameOver — fatal collision and revival failed; show summary screen
 *
 * Design tradeoff: explicit transition whitelist (ALLOWED_TRANSITIONS) instead of ad-hoc if/else,
 * because state machines often grow invalid jumps; table-driven transitions block bad moves early
 * instead of silently entering inconsistent state.
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

  /** Subscribe to state changes; returns an unsubscribe function. */
  onChange(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Attempt transition to target state.
   * @param next target state
   * @returns whether transition succeeded (illegal transitions return false, not throw)
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

  /** Semantic shortcut: start game. */
  start(): boolean {
    return this.transition("PLAYING");
  }

  /** Semantic shortcut: game over. */
  end(): boolean {
    return this.transition("GAME_OVER");
  }

  /** Semantic shortcut: reset to Idle for the next game. */
  reset(): boolean {
    return this.transition("IDLE");
  }

  /** Semantic shortcut: enter revival wait state (pause game, wait for quiz). */
  startReviving(): boolean {
    return this.transition("REVIVING");
  }

  /** Semantic shortcut: revival succeeded, resume game. */
  resumeAfterRevival(): boolean {
    return this.transition("PLAYING");
  }
}
