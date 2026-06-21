import { formatDuration } from "@/app/format";
import type { RunSummaryViewState } from "@/app/types";

interface RunSummaryModalProps {
  readonly state: RunSummaryViewState;
  readonly onExit: () => void;
}

export function RunSummaryModal({ state, onExit }: RunSummaryModalProps): JSX.Element {
  const stats = state.stats;

  return (
    <div
      aria-hidden={!state.visible}
      aria-labelledby="run-summary-title"
      aria-modal="true"
      className="run-summary-modal"
      data-visible={state.visible}
      role="dialog"
    >
      <div className="run-summary-modal__panel">
        <p className="run-summary-modal__eyebrow">SESSION_SETTLED</p>
        <h2 className="run-summary-modal__title" id="run-summary-title">
          Congratulations
        </h2>

        <div className="run-summary-modal__stats">
          <div className="run-summary-modal__stat">
            <span className="run-summary-modal__stat-label">Time wasted</span>
            <span className="run-summary-modal__stat-value">
              {formatDuration(stats?.elapsedMs ?? 0)}
            </span>
          </div>
          <div className="run-summary-modal__stat">
            <span className="run-summary-modal__stat-label">Arrow key presses</span>
            <span className="run-summary-modal__stat-value">
              {stats?.arrowKeyPresses ?? 0}
            </span>
          </div>
        </div>

        <p className="run-summary-modal__desc">
          Congratulations, you wasted {formatDuration(stats?.elapsedMs ?? 0)} and
          pressed the arrow keys {stats?.arrowKeyPresses ?? 0} times.
        </p>

        <button
          autoFocus
          className="run-summary-modal__exit"
          onClick={onExit}
          type="button"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
