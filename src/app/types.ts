import type { GamePhase } from "@/engine/core/GameState";
import type { GameResult, LengthChoiceRequest } from "@/engine/GameEngine";
import type { PostGameChallenge } from "@/engine/bitwise/PostGameChallenge";
import type { RealtimeRole } from "@/realtime/types";

export type ThemeMode = "dark" | "light";

export interface HudState {
  readonly length: number;
  readonly score: number;
  readonly phase: GamePhase;
  readonly revivalsRemaining: number;
  readonly revivalsTotal: number;
  readonly timeRemainingMs: number;
  readonly totalTimeMs: number;
  readonly targetScore: number;
  readonly patternDescription: string;
  readonly gameResult: GameResult | null;
}

export interface QuizViewState {
  readonly visible: boolean;
  readonly question: string;
  readonly imageSrc?: string;
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

export interface LengthChoiceViewState extends LengthChoiceRequest {
  readonly visible: boolean;
}

export interface BonusChallengeViewState {
  readonly visible: boolean;
  readonly challenge: PostGameChallenge | null;
  readonly answerText: string;
  readonly feedback: string;
  readonly feedbackOk: boolean;
  readonly resolved: boolean;
}
