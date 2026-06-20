import type { GamePhase } from "@/engine/core/GameState";
import type { RealtimeRole } from "@/realtime/types";

export type ThemeMode = "dark" | "light";

export interface HudState {
  readonly length: number;
  readonly score: number;
  readonly phase: GamePhase;
  readonly revivalsRemaining: number;
  readonly revivalsTotal: number;
}

export interface QuizViewState {
  readonly visible: boolean;
  readonly question: string;
  readonly answerText: string;
  readonly timerRatio: number;
  readonly isUrgent: boolean;
  readonly feedback: string;
  readonly feedbackOk: boolean;
}

export interface RoomFormState {
  readonly roomCode: string;
  readonly role: RealtimeRole;
}

