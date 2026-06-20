import { DIFFICULTIES, DIFFICULTY_META } from "@/app/constants";
import type { DifficultyLevel } from "@/engine/GameEngine";

interface DifficultyToolbarProps {
  readonly difficulty: DifficultyLevel;
  readonly onDifficultyChange: (difficulty: DifficultyLevel) => void;
  readonly readOnly: boolean;
}

export function DifficultyToolbar({
  difficulty,
  onDifficultyChange,
  readOnly,
}: DifficultyToolbarProps): JSX.Element {
  const meta = DIFFICULTY_META[difficulty];

  return (
    <div aria-label="Game settings" className="toolbar" role="toolbar">
      <span className="toolbar__label">DIFFICULTY</span>
      <div className="difficulty-tabs" role="tablist">
        {DIFFICULTIES.map((item) => (
          <button
            aria-selected={item === difficulty}
            className="difficulty-tab"
            disabled={readOnly}
            key={item}
            onClick={() => onDifficultyChange(item)}
            role="tab"
            type="button"
          >
            {DIFFICULTY_META[item].label}
          </button>
        ))}
      </div>
      <span className="toolbar__grid-info">
        {meta.grid} / {meta.tick}
      </span>
    </div>
  );
}

