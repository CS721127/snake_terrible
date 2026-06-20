import type { RefObject } from "react";
import { DIFFICULTY_META } from "@/app/constants";
import type { DifficultyLevel } from "@/engine/GameEngine";
import type { GamePhase } from "@/engine/core/GameState";
import type { RealtimeRole } from "@/realtime/types";

interface GameStageProps {
  readonly canvasRef: RefObject<HTMLCanvasElement>;
  readonly difficulty: DifficultyLevel;
  readonly phase: GamePhase;
  readonly role: RealtimeRole;
  readonly onStart: () => void;
}

const GAME_OVER_COPY = {
  title: "PROCESS_TERMINATED",
  desc: "All revival chances are spent, or the revival answer failed.",
  cta: "RESTART()",
  state: "gameover",
};

export function GameStage({
  canvasRef,
  difficulty,
  phase,
  role,
  onStart,
}: GameStageProps): JSX.Element {
  const meta = DIFFICULTY_META[difficulty];
  const overlayVisible = phase !== "PLAYING" && phase !== "REVIVING";
  const idleCopy =
    role === "client"
      ? {
          title: "CLIENT_VIEW",
          desc: "Render Host snapshots and forward directional input.",
          cta: "REQUEST_START()",
          state: "idle",
        }
      : {
          title: "READY?",
          desc: "Choose a 16-bit starting length, then use Arrow keys, WASD, or touch swipes to chase bitwise food.",
          cta: "START_GAME()",
          state: "idle",
        };
  const copy = phase === "GAME_OVER" ? GAME_OVER_COPY : idleCopy;

  return (
    <main className="stage">
      <div className="stage__board">
        <canvas aria-label="Complement-Snake game canvas" id="game-canvas" ref={canvasRef} />

        <div
          aria-hidden={!overlayVisible}
          aria-labelledby="overlay-title"
          aria-modal="true"
          className="overlay"
          data-visible={overlayVisible}
          role="dialog"
        >
          <div className="overlay__panel">
            <p className="overlay__eyebrow">HOST_AUTHORITY / CANVAS</p>
            <h1 className="overlay__title" data-state={copy.state} id="overlay-title">
              {copy.title}
            </h1>
            <p className="overlay__desc">{copy.desc}</p>
            <button className="overlay__cta" onClick={onStart} type="button">
              {copy.cta}
            </button>
            <p className="overlay__hint">SPACE / REMOTE_COMMAND</p>
          </div>
        </div>
      </div>

      <p className="stage__footnote">
        tick = {meta.tick} / grid = {meta.grid} / food_pool = 8 / time_limit = 3:00
      </p>
    </main>
  );
}
