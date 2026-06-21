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

/** 图片阶段：用户累计"尝试/躲避"满这么久之后才浮现数学题，而不是固定计时器一启动就算。 */
const IMAGE_STAGE_ATTEMPT_MS = 5_000;

/** X 按钮与鼠标之间始终保持的最小距离（像素）。 */
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

/** 第一关：占位全屏播放器（假进度条 + 播放按钮），左上角文字是真正的退出入口。 */
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
        不好意思，请点此退出
      </button>

      <div className="exit-troll__video-frame">
        <div className="exit-troll__video-placeholder">
          {/* 真实视频文件接入位：之后把下面这个占位 div 换成 <video src="..."> 即可。 */}
          <span className="exit-troll__video-glyph">▶</span>
          <p className="exit-troll__video-caption">PLACEHOLDER_VIDEO.MP4</p>
        </div>

        <div className="exit-troll__video-controls">
          <button
            aria-label={playing ? "Pause" : "Play"}
            className="exit-troll__video-play"
            onClick={() => setPlaying((prev) => !prev)}
            type="button"
          >
            {playing ? "❙❙" : "▶"}
          </button>

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

/** 第二关：一张图片 + 一个始终躲着鼠标的 X 退出按钮；累计尝试满 5 秒才进入下一关。 */
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

  // 初始把按钮放在图片框右上角附近，而不是 (0,0)。
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

    // 只要用户在这一关里动鼠标，就视为"在尝试"，开始/继续累计时长。
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

    // 沿着"鼠标→按钮"的方向继续推开按钮，并夹在图片框范围内。
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

  // 累计"尝试/躲避中"的时长；满 5 秒（todo.md 要求）后进入数学题关。
  // 另外加一道兜底：即使完全没有指针事件（极端设备），25 秒挂钟时间后也会强制进入下一关，
  // 避免用户被卡死在这一关出不去。
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
        <div className="exit-troll__image-placeholder">
          {/* 真实图片素材接入位：之后把这块占位换成 <img src="..."> 即可。 */}
          <span className="exit-troll__image-glyph">🖼</span>
          <p className="exit-troll__image-caption">PLACEHOLDER_IMAGE</p>
        </div>

        <button
          aria-label="退出"
          className="exit-troll__evade-button"
          ref={buttonRef}
          style={{ left: `${buttonPos.x}px`, top: `${buttonPos.y}px` }}
          type="button"
        >
          X 退出
        </button>
      </div>
    </div>
  );
}

/** 第三关：看起来特别复杂、实际答案恒为 0 的数学题；答对才能真正退出。 */
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
    setFeedback("不对，再想想（提示：答案其实很简单）。");
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
            aria-label="答案"
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
            提交
          </button>
        </div>

        <button
          className="exit-troll__math-hint-toggle"
          onClick={() => setShowHint((prev) => !prev)}
          type="button"
        >
          {showHint ? "隐藏提示" : "需要提示？"}
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

/** 最终阶段：答对数学题后展示的真正退出确认。 */
function DoneStage(): JSX.Element {
  return (
    <div className="exit-troll__stage exit-troll__stage--done">
      <div className="exit-troll__done-panel">
        <p className="exit-troll__done-title">恭喜你完成游戏</p>
      </div>
    </div>
  );
}
