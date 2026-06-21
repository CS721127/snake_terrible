import { useCallback, useEffect, useRef, useState } from "react";
import type { ExitTrollStage, ExitTrollViewState } from "@/app/types";
import {
  checkExitTrollMathAnswer,
  generateExitTrollMathProblem,
} from "@/engine/exit-troll/ExitTrollMath";
import type { ExitTrollMathProblem } from "@/engine/exit-troll/ExitTrollMath";

interface ExitTrollOverlayProps {
  readonly state: ExitTrollViewState;
  readonly onAdvance: (nextStage: ExitTrollStage) => void;
}

/** Image stage: the math problem appears only after the user has accumulated this much "trying/evading" time, not from a fixed timer at stage start. */
const IMAGE_STAGE_ATTEMPT_MS = 5_000;

/** Minimum distance (px) the X button always keeps from the mouse. */
const EVADE_DISTANCE_PX = 90;

export function ExitTrollOverlay({
  state,
  onAdvance,
}: ExitTrollOverlayProps): JSX.Element {
  if (state.stage === "none") {
    return <div aria-hidden="true" className="exit-troll" data-visible={false} />;
  }

  return (
    <div
      aria-modal="true"
      className="exit-troll"
      data-visible={true}
      role="dialog"
    >
      {state.stage === "video" ? <VideoStage onAdvance={onAdvance} /> : null}
      {state.stage === "image" ? <ImageStage onAdvance={onAdvance} /> : null}
      {state.stage === "math" ? <MathStage onAdvance={onAdvance} /> : null}
      {state.stage === "done" ? <DoneStage /> : null}
    </div>
  );
}

/** Stage 1: placeholder fullscreen player (fake progress bar + play button); the top-left text is the real exit entry. */
function VideoStage({
  onAdvance,
}: {
  onAdvance: (nextStage: ExitTrollStage) => void;
}): JSX.Element {
  const [playing, setPlaying] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setProgressPct((prev) => (prev >= 100 ? 0 : prev + 1.2));
    }, 200);
    return () => window.clearInterval(id);
  }, [playing]);

  return (
    <div className="exit-troll__stage exit-troll__stage--video">
      <button
        autoFocus
        className="exit-troll__video-exit-label"
        onClick={() => onAdvance("image")}
        type="button"
      >
        Sorry, click here to exit
      </button>

      <div className="exit-troll__video-frame">
        <div className="exit-troll__video-frame">
          {/* Real video implementation */}
          <video 
            src="/public/assets/video.mp4" 
            className="exit-troll__video"
            controls 
            playsInline
            autoPlay 
          />
        </div>

        <div className="exit-troll__video-controls">
          {/* <button
            aria-label={playing ? "Pause" : "Play"}
            className="exit-troll__video-play"
            onClick={() => setPlaying((prev) => !prev)}
            type="button"
          >
            {playing ? "❙❙" : "▶"}
          </button> */}

          <div
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progressPct)}
            className="exit-troll__video-progress"
            role="progressbar"
          >
            <div
              className="exit-troll__video-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <span className="exit-troll__video-time">
            {formatFakeTime(progressPct)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatFakeTime(progressPct: number): string {
  const totalSeconds = Math.floor((progressPct / 100) * 137);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} / 2:17`;
}

/** Stage 2: an image plus an X exit button that always evades the mouse; advance after 5 seconds of accumulated attempts. */
function ImageStage({
  onAdvance,
}: {
  onAdvance: (nextStage: ExitTrollStage) => void;
}): JSX.Element {
  const frameRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const attemptedMsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Initially place the button near the top-right of the image frame, not at (0,0).
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    setButtonPos({ x: rect.width - 64, y: 16 });
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    const button = buttonRef.current;
    if (!frame || !button) return;

    // Any mouse movement in this stage counts as "trying" and starts/continues the accumulated timer.
    lastTickRef.current ??= performance.now();

    const frameRect = frame.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const buttonCenterX = buttonRect.left - frameRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top - frameRect.top + buttonRect.height / 2;

    const pointerX = event.clientX - frameRect.left;
    const pointerY = event.clientY - frameRect.top;

    const dx = buttonCenterX - pointerX;
    const dy = buttonCenterY - pointerY;
    const distance = Math.hypot(dx, dy);

    if (distance >= EVADE_DISTANCE_PX) return;

    // Push the button further along the mouse→button direction and clamp it inside the image frame.
    const angle = distance === 0
      ? Math.random() * Math.PI * 2
      : Math.atan2(dy, dx);

    const pushDistance = EVADE_DISTANCE_PX + 24;
    const buttonW = buttonRect.width;
    const buttonH = buttonRect.height;

    let nextX = pointerX + Math.cos(angle) * pushDistance - buttonW / 2;
    let nextY = pointerY + Math.sin(angle) * pushDistance - buttonH / 2;

    nextX = Math.min(Math.max(nextX, 4), frameRect.width - buttonW - 4);
    nextY = Math.min(Math.max(nextY, 4), frameRect.height - buttonH - 4);

    setButtonPos({ x: nextX, y: nextY });
  }, []);

  const handlePointerLeave = useCallback(() => {
    lastTickRef.current = null;
  }, []);

  // Accumulate time spent trying/evading; after 5 seconds (todo.md), advance to the math stage.
  // Fallback: even with no pointer events (edge-case devices), force advance after 25 seconds
  // so the user cannot get stuck on this stage.
  useEffect(() => {
    const mountedAtMs = performance.now();
    const HARD_FALLBACK_MS = 25_000;

    const tick = () => {
      const now = performance.now();
      if (lastTickRef.current !== null) {
        attemptedMsRef.current += now - lastTickRef.current;
        lastTickRef.current = now;
      }
      if (
        attemptedMsRef.current >= IMAGE_STAGE_ATTEMPT_MS ||
        now - mountedAtMs >= HARD_FALLBACK_MS
      ) {
        onAdvance("math");
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [onAdvance]);

  return (
    <div className="exit-troll__stage exit-troll__stage--image">
      <div
        className="exit-troll__image-frame"
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
        ref={frameRef}
      >
        <div className="exit-troll__image-container">
          {/* Real image implementation */}
          <img 
            src="/public/assets/meme.webp" 
            alt="Exit Troll Meme" 
            className="exit-troll__image" 
            loading="lazy" 
          />
        </div>

        <button
          aria-label="Exit"
          className="exit-troll__evade-button"
          ref={buttonRef}
          style={{ left: `${buttonPos.x}px`, top: `${buttonPos.y}px` }}
          type="button"
        >
          X Exit
        </button>
      </div>
    </div>
  );
}

/** Stage 3: a math problem that looks very complex but always has answer 0; only a correct answer exits. */
function MathStage({
  onAdvance,
}: {
  onAdvance: (nextStage: ExitTrollStage) => void;
}): JSX.Element {
  const [problem, setProblem] = useState<ExitTrollMathProblem>(() =>
    generateExitTrollMathProblem(),
  );
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSubmit = useCallback(() => {
    if (checkExitTrollMathAnswer(answer)) {
      onAdvance("done");
      return;
    }
    setFeedback("Wrong, try again (hint: the answer is very simple).");
    setProblem(generateExitTrollMathProblem());
    setAnswer("");
    setShowHint(false);
  }, [answer, onAdvance]);

  return (
    <div className="exit-troll__stage exit-troll__stage--math">
      <div className="exit-troll__math-panel">
        <p className="exit-troll__math-eyebrow">FINAL_CHECK</p>
        <p className="exit-troll__math-prompt">{problem.prompt}</p>

        <div className="exit-troll__math-input-row">
          <input
            aria-label="Answer"
            autoComplete="off"
            className="exit-troll__math-input"
            onChange={(event) => {
              setAnswer(event.target.value);
              setFeedback("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSubmit();
            }}
            placeholder="?"
            ref={inputRef}
            type="text"
            value={answer}
          />
          <button
            className="exit-troll__math-submit"
            onClick={handleSubmit}
            type="button"
          >
            Submit
          </button>
        </div>

        <button
          className="exit-troll__math-hint-toggle"
          onClick={() => setShowHint((prev) => !prev)}
          type="button"
        >
          {showHint ? "Hide hint" : "Need a hint?"}
        </button>

        {showHint ? <p className="exit-troll__math-hint">{problem.hint}</p> : null}

        <p
          className="exit-troll__math-feedback"
          data-visible={Boolean(feedback)}
        >
          {feedback}
        </p>
      </div>
    </div>
  );
}

/** Final stage: the real exit confirmation shown after answering the math problem correctly. */
function DoneStage(): JSX.Element {
  return (
    <div className="exit-troll__stage exit-troll__stage--done">
      <div className="exit-troll__done-panel">
        <p className="exit-troll__done-title">Congratulations, you completed the game</p>
      </div>
    </div>
  );
}
