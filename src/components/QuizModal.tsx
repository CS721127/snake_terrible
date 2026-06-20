import { useEffect, useRef } from "react";
import type { QuizViewState } from "@/app/types";

interface QuizModalProps {
  readonly state: QuizViewState;
  readonly onAnswerChange: (answer: string) => void;
  readonly onSubmit: () => void;
}

export function QuizModal({
  state,
  onAnswerChange,
  onSubmit,
}: QuizModalProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.visible) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [state.visible, state.question]);

  return (
    <div
      aria-hidden={!state.visible}
      aria-labelledby="quiz-question"
      aria-modal="true"
      className="quiz-modal"
      data-visible={state.visible}
      role="dialog"
    >
      <div className="quiz-modal__panel">
        <p className="quiz-modal__eyebrow">REVIVAL_QUIZ</p>
        <p className="quiz-modal__question" id="quiz-question">
          {state.question || "0 + 0 = ?"}
        </p>

        {state.imageSrc ? (
          <img alt="" className="quiz-modal__image" src={state.imageSrc} />
        ) : null}

        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(state.timerRatio * 100)}
          className="quiz-modal__timer-bar"
          role="progressbar"
        >
          <div
            className="quiz-modal__timer-fill"
            data-urgent={state.isUrgent}
            style={{ width: `${state.timerRatio * 100}%` }}
          />
        </div>

        <div className="quiz-modal__input-row">
          <input
            aria-label="Answer"
            autoComplete="off"
            className="quiz-modal__input"
            onChange={(event) => onAnswerChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit();
              }
            }}
            placeholder="?"
            ref={inputRef}
            type="number"
            value={state.answerText}
          />
          <button className="quiz-modal__submit" onClick={onSubmit} type="button">
            SUBMIT
          </button>
        </div>

        <p
          className={
            state.feedbackOk
              ? "quiz-modal__feedback quiz-modal__feedback--ok"
              : "quiz-modal__feedback"
          }
          data-visible={Boolean(state.feedback)}
        >
          {state.feedback}
        </p>
      </div>
    </div>
  );
}
