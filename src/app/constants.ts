import type { DifficultyLevel } from "@/engine/GameEngine";
import type { GridConfig } from "@/engine/core/types";
import { SKIN_ASSETS } from "@/engine/skins";

export const CELL_SIZE_PX = 18;

export const DIFFICULTY_META: Record<
  DifficultyLevel,
  { label: string; grid: string; tick: string }
> = {
  EASY: { label: "EASY", grid: "20x20", tick: "200ms" },
  MEDIUM: { label: "MEDIUM", grid: "28x28", tick: "150ms" },
  HARD: { label: "HARD", grid: "36x36", tick: "100ms" },
};

export const DIFFICULTIES = Object.keys(DIFFICULTY_META) as DifficultyLevel[];

export const DIFFICULTY_GRID: Record<DifficultyLevel, GridConfig> = {
  EASY: { columns: 20, rows: 20 },
  MEDIUM: { columns: 28, rows: 28 },
  HARD: { columns: 36, rows: 36 },
};

export interface SkinOption {
  readonly id: string;
  readonly label: string;
  readonly previewSrc?: string;
  readonly placeholder: {
    readonly initials: string;
    readonly headColor: string;
    readonly bodyColor: string;
  };
}

export const SKINS: readonly SkinOption[] = SKIN_ASSETS.map((skin) => ({
  id: skin.id,
  label: skin.label,
  previewSrc: skin.previewSrc,
  placeholder: skin.placeholder,
}));

export const DEFAULT_ROOM_CODE = "ROOM-01";
