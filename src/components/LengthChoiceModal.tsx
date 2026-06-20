import type { LengthChoiceViewState } from "@/app/types";
import type { LengthChoice } from "@/engine/bitwise/LengthChoices";

interface LengthChoiceModalProps {
  readonly state: LengthChoiceViewState;
  readonly onChoose: (choice: LengthChoice) => void;
}

export function LengthChoiceModal({
  state,
  onChoose,
}: LengthChoiceModalProps): JSX.Element {
  const title = state.reason === "START" ? "SELECT_START_LENGTH" : "PATTERN_LOCKED";
  const description = state.reason === "START"
    ? "Choose one 16-bit expression before entering the board."
    : "Score +1. Choose the next length to continue.";

  return (
    <div
      aria-hidden={!state.visible}
      aria-labelledby="length-choice-title"
      aria-modal="true"
      className="length-choice-modal"
      data-visible={state.visible}
      role="dialog"
    >
      <div className="length-choice-modal__panel">
        <p className="length-choice-modal__eyebrow">BITWISE_LENGTH</p>
        <h2 className="length-choice-modal__title" id="length-choice-title">
          {title}
        </h2>
        <p className="length-choice-modal__desc">{description}</p>

        <div className="length-choice-grid">
          {state.choices.map((choice) => (
            <button
              className="length-choice"
              key={choice.id}
              onClick={() => onChoose(choice)}
              type="button"
            >
              <span className="length-choice__expr">{choice.expression}</span>
              <span className="length-choice__result">
                LEN={choice.resultLength}
                {choice.reversed ? " / REV" : ""}
              </span>
              <span className="length-choice__hex">{choice.resultHex}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
