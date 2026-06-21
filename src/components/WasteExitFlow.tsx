import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { formatTime } from "@/app/format";

export interface WasteExitStats {
  readonly id: number;
  readonly elapsedMs: number;
  readonly directionPresses: number;
}

interface WasteExitFlowProps {
  readonly stats: WasteExitStats | null;
}

type WasteExitStage = "hidden" | "summary" | "video" | "image" | "question" | "complete";

const HARD_QUESTION =
  "令 A_n = Σ(k=1..n) [(k^3 - 3k + 2)^2 mod 997]，再令 B_n 为完全相同的表达式。求 lim(n→∞) (A_n - B_n)。";

export function WasteExitFlow({ stats }: WasteExitFlowProps): JSX.Element | null {
  const [stage, setStage] = useState<WasteExitStage>("hidden");
  const [answerText, setAnswerText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [exitButtonPosition, setExitButtonPosition] = useState({ x: 18, y: 18 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const trapImageSrc = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
        <rect width="640" height="360" fill="#0d1318"/>
        <rect x="28" y="28" width="584" height="304" fill="#10171c" stroke="#38f26e" stroke-width="4"/>
        <path d="M90 252 C160 96 280 92 320 192 C360 292 480 276 550 110" fill="none" stroke="#48d6ff" stroke-width="18" stroke-linecap="round"/>
        <circle cx="106" cy="230" r="28" fill="#38f26e"/>
        <circle cx="544" cy="112" r="30" fill="#ff4d6a"/>
        <text x="320" y="84" fill="#e8f2ee" font-family="monospace" font-size="30" font-weight="700" text-anchor="middle">EXIT VALIDATION IMAGE</text>
        <text x="320" y="318" fill="#87a096" font-family="monospace" font-size="18" text-anchor="middle">THIS IMAGE IS DEFINITELY HELPING</text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, []);

  useEffect(() => {
    if (!stats) {
      setStage("hidden");
      return;
    }

    setStage("summary");
    setAnswerText("");
    setFeedback("");
  }, [stats]);

  useEffect(() => {
    if (stage !== "video") return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let frame = 0;

    const draw = () => {
      frame += 1;
      const gradient = ctx.createLinearGradient(0, 0, 640, 360);
      gradient.addColorStop(0, "#071018");
      gradient.addColorStop(0.55, "#12301d");
      gradient.addColorStop(1, "#111827");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 640, 360);

      for (let i = 0; i < 18; i++) {
        const x = (frame * 4 + i * 62) % 760 - 60;
        const y = 54 + ((i * 37 + frame * 2) % 250);
        ctx.fillStyle = i % 2 === 0 ? "#38f26e" : "#48d6ff";
        ctx.globalAlpha = 0.22;
        ctx.fillRect(x, y, 44, 10);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#e8f2ee";
      ctx.font = "700 34px monospace";
      ctx.textAlign = "center";
      ctx.fillText("PLEASE KEEP EXITING", 320, 152);
      ctx.fillStyle = "#87a096";
      ctx.font = "18px monospace";
      ctx.fillText(`wasted=${stats ? formatTime(stats.elapsedMs) : "0:00"}`, 320, 196);

      rafId = window.requestAnimationFrame(draw);
    };

    draw();
    const stream = typeof canvas.captureStream === "function" ? canvas.captureStream(24) : null;
    if (video && stream) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, [stage, stats]);

  useEffect(() => {
    if (stage !== "image") return;

    setExitButtonPosition({ x: 18, y: 18 });
    const timer = window.setTimeout(() => {
      setStage("question");
    }, 5_000);

    return () => window.clearTimeout(timer);
  }, [stage]);

  const keepExitButtonAway = useCallback(
    (event: MouseEvent) => {
      const buttonHalf = 18;
      const minDistance = 112;
      const centerX = exitButtonPosition.x + buttonHalf;
      const centerY = exitButtonPosition.y + buttonHalf;
      const dx = centerX - event.clientX;
      const dy = centerY - event.clientY;
      const distance = Math.hypot(dx, dy);
      if (distance >= minDistance) return;

      const angle = distance === 0 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx);
      const nextCenterX = clamp(
        event.clientX + Math.cos(angle) * minDistance,
        buttonHalf,
        window.innerWidth - buttonHalf,
      );
      const nextCenterY = clamp(
        event.clientY + Math.sin(angle) * minDistance,
        buttonHalf,
        window.innerHeight - buttonHalf,
      );

      setExitButtonPosition({
        x: nextCenterX - buttonHalf,
        y: nextCenterY - buttonHalf,
      });
    },
    [exitButtonPosition],
  );

  const handleQuestionSubmit = useCallback(() => {
    const answer = Number(answerText.trim());
    if (answer === 0) {
      setFeedback("");
      setStage("complete");
      return;
    }

    setFeedback("答案不对。再想想这个完全没有必要的极限。");
  }, [answerText]);

  if (!stats || stage === "hidden") return null;

  if (stage === "summary") {
    return (
      <div className="waste-flow" role="dialog" aria-modal="true">
        <section className="waste-flow__panel">
          <p className="waste-flow__eyebrow">GAME_SETTLEMENT</p>
          <h2 className="waste-flow__title">恭喜你浪费了 {formatTime(stats.elapsedMs)}</h2>
          <p className="waste-flow__copy">
            你还按了 {stats.directionPresses} 次方向键。
          </p>
          <button className="waste-flow__primary" onClick={() => setStage("video")} type="button">
            退出
          </button>
        </section>
      </div>
    );
  }

  if (stage === "video") {
    return (
      <div className="waste-flow waste-flow--media" role="dialog" aria-modal="true">
        <button className="waste-flow__corner-action" onClick={() => setStage("image")} type="button">
          不好意思，请点此退出
        </button>
        <video
          aria-label="Exit video"
          autoPlay
          className="waste-flow__video"
          muted
          playsInline
          ref={videoRef}
        />
      </div>
    );
  }

  if (stage === "image") {
    return (
      <div
        className="waste-flow waste-flow--media"
        onMouseMove={keepExitButtonAway}
        role="dialog"
        aria-modal="true"
      >
        <button
          aria-label="Exit"
          className="waste-flow__evade"
          onClick={() => setStage("question")}
          style={
            {
              "--exit-x": `${exitButtonPosition.x}px`,
              "--exit-y": `${exitButtonPosition.y}px`,
            } as CSSProperties
          }
          type="button"
        >
          X
        </button>
        <img alt="Exit validation" className="waste-flow__image" src={trapImageSrc} />
      </div>
    );
  }

  if (stage === "question") {
    return (
      <div className="waste-flow" role="dialog" aria-modal="true">
        <section className="waste-flow__panel waste-flow__panel--wide">
          <p className="waste-flow__eyebrow">FINAL_EXIT_CHECK</p>
          <h2 className="waste-flow__title">回答正确后退出</h2>
          <p className="waste-flow__question">{HARD_QUESTION}</p>
          <div className="waste-flow__input-row">
            <input
              aria-label="Answer"
              className="waste-flow__input"
              onChange={(event) => setAnswerText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleQuestionSubmit();
              }}
              value={answerText}
            />
            <button className="waste-flow__primary" onClick={handleQuestionSubmit} type="button">
              提交
            </button>
          </div>
          <p className="waste-flow__feedback" data-visible={Boolean(feedback)}>
            {feedback}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="waste-flow" role="dialog" aria-modal="true">
      <section className="waste-flow__panel">
        <p className="waste-flow__eyebrow">COMPLETE</p>
        <h2 className="waste-flow__title">恭喜你完成游戏。</h2>
      </section>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
