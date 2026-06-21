import type { HudState, ThemeMode } from "@/app/types";
import { formatBin, formatTime } from "@/app/format";

interface HudProps {
  readonly hud: HudState;
  readonly theme: ThemeMode;
  readonly onToggleTheme: () => void;
}

export function Hud({ hud, theme, onToggleTheme }: HudProps): JSX.Element {
  return (
    <header className="hud" role="banner">
      <div className="hud__brand">
        <span className="hud__brand-glyph" aria-hidden="true">
          01
        </span>
        <span className="hud__brand-name">COMPLEMENT_SNAKE</span>
      </div>

      <div className="hud__stats">
        <Stat label="LEN_BIN" value={formatBin(hud.length)} tone="bin-primary" />
        <Stat label="SCORE" value={String(hud.score)} />
        <Stat label="TARGET" value={String(hud.targetScore)} />
        <Stat label="TIME" value={formatTime(hud.timeRemainingMs)} tone="state" />
        <Stat label="STATE" value={hud.phase} tone="state" />
        <Stat label="PATTERN" value={hud.patternDescription} tone="bin" />
        {hud.gameResult ? (
          <Stat label="RESULT" value={hud.gameResult} tone="state" />
        ) : null}

        <div className="hud__revivals" title="Remaining free revivals">
          <span className="hud__stat-label">LIFE</span>
          {Array.from({ length: hud.revivalsTotal }).map((_, index) => (
            <span
              aria-hidden="true"
              className={
                index < hud.revivalsRemaining
                  ? "revival-pip"
                  : "revival-pip revival-pip--spent"
              }
              key={index}
            />
          ))}
        </div>
      </div>

      <div className="hud__controls">
        <button
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="btn-icon"
          onClick={onToggleTheme}
          title="Toggle theme"
          type="button"
        >
          <span aria-hidden="true" className="theme-toggle__mark" data-theme={theme} />
        </button>
      </div>
    </header>
  );
}

interface StatProps {
  readonly label: string;
  readonly value: string;
  readonly tone?: "hex" | "bin" | "bin-primary" | "state";
}

function Stat({ label, value, tone }: StatProps): JSX.Element {
  const toneClass = tone ? ` hud__stat--${tone}` : "";

  return (
    <div className={`hud__stat${toneClass}`}>
      <span className="hud__stat-label">{label}</span>
      <span className="hud__stat-value">{value}</span>
    </div>
  );
}
