import type { DifficultyLevel } from "@/engine/GameEngine";
import type { GamePhase } from "@/engine/core/GameState";
import type { Direction } from "@/engine/core/types";
import type { RenderSnapshot } from "@/rendering/Renderer";

export const REALTIME_SCHEMA_VERSION = 1;

export type RealtimeRole = "host" | "client";

export type TransportStatus =
  | "idle"
  | "disabled"
  | "connecting"
  | "connected"
  | "error";

export interface RealtimeRoomConfig {
  readonly roomCode: string;
  readonly role: RealtimeRole;
}

export interface GameSnapshotMessage {
  readonly schemaVersion: typeof REALTIME_SCHEMA_VERSION;
  readonly roomCode: string;
  readonly hostId: string;
  readonly sequence: number;
  readonly phase: GamePhase;
  readonly difficulty: DifficultyLevel;
  readonly skinId: string;
  readonly score: number;
  readonly length: number;
  readonly revivalsRemaining: number;
  readonly revivalsTotal: number;
  readonly render: RenderSnapshot;
  readonly sentAt: number;
}

export interface PlayerInputMessage {
  readonly schemaVersion: typeof REALTIME_SCHEMA_VERSION;
  readonly roomCode: string;
  readonly playerId: string;
  readonly direction: Direction;
  readonly sentAt: number;
}

export interface ClientCommandMessage {
  readonly schemaVersion: typeof REALTIME_SCHEMA_VERSION;
  readonly roomCode: string;
  readonly playerId: string;
  readonly kind: "START_GAME";
  readonly sentAt: number;
}

export type SnapshotListener = (message: GameSnapshotMessage) => void;
export type InputListener = (message: PlayerInputMessage) => void;
export type CommandListener = (message: ClientCommandMessage) => void;

export interface GameTransport {
  readonly isConfigured: boolean;
  connect(config: RealtimeRoomConfig): Promise<void>;
  disconnect(): Promise<void>;
  publishSnapshot(message: GameSnapshotMessage): Promise<void>;
  publishInput(message: PlayerInputMessage): Promise<void>;
  publishCommand(message: ClientCommandMessage): Promise<void>;
  onSnapshot(listener: SnapshotListener): () => void;
  onInput(listener: InputListener): () => void;
  onCommand(listener: CommandListener): () => void;
}

