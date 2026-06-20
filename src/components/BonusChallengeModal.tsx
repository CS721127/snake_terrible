import { useEffect, useRef } from "react";
import type { BonusChallengeViewState } from "@/app/types";

interface BonusChallengeModalProps {
  readonly state: BonusChallengeViewState;
  readonly onAnswerChange: (answer: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}

export function BonusChallengeModal({
  state,
  onAnswerChange,
  onSubmit,
  onClose,
}: BonusChallengeModalProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.visible && !state.resolved) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [state.resolved, state.visible]);

  return (
    <div
      aria-hidden={!state.visible}
      aria-labelledby="bonus-question"
      aria-modal="true"
      className="bonus-modal"
      data-visible={state.visible}
      role="dialog"
    >
      <div className="bonus-modal__panel">
        <p className="bonus-modal__eyebrow">POST_GAME_BONUS</p>
        <p className="bonus-modal__question" id="bonus-question">
          {state.challenge?.prompt ?? "No bonus challenge."}
        </p>

        <div className="bonus-modal__input-row">
          <input
            aria-label="C expression"
            autoComplete="off"
            className="bonus-modal__input"
            disabled={state.resolved}
            onChange={(event) => onAnswerChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit();
              }
            }}
            placeholder="(len >> 3) & 0x7"
            ref={inputRef}
            type="text"
            value={state.answerText}
          />
          <button
            className="bonus-modal__submit"
            disabled={state.resolved}
            onClick={onSubmit}
            type="button"
          >
            RUN
          </button>
        </div>

        <p
          className={
            state.feedbackOk
              ? "bonus-modal__feedback bonus-modal__feedback--ok"
              : "bonus-modal__feedback"
          }
          data-visible={Boolean(state.feedback)}
        >
          {state.feedback}
        </p>

        <button className="bonus-modal__close" onClick={onClose} type="button">
          CLOSE
        </button>
      </div>
    </div>
  );
}
