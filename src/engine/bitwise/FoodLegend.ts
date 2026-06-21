import type { BitwiseFoodOperation } from "@/engine/bitwise/BitwiseMath";

/**
 * FoodLegend: single source of truth for food "operation type → visual appearance".
 *
 * Design tradeoff: color/shape mapping is defined once here; CanvasRenderer (food on canvas)
 * and FoodLegendPanel (right-side legend sidebar) both read from here, avoiding duplicate color tables
 * and mismatches where "legend color ≠ on-screen color" after a partial update.
 */
export interface FoodLegendEntry {
  readonly operation: BitwiseFoodOperation;
  readonly tone: string;
  readonly color: string;
  readonly shapeLabel: string;
  readonly name: string;
  /** Shift operators carry no value (per todo.md); other operations carry a 2-digit hex value. */
  readonly hasValue: boolean;
}

export const FOOD_LEGEND: readonly FoodLegendEntry[] = [
  { operation: "&", tone: "and", color: "#67E8F9", shapeLabel: "●", name: "AND", hasValue: true },
  { operation: "|", tone: "or", color: "#FBBF24", shapeLabel: "●", name: "OR", hasValue: true },
  { operation: "^", tone: "xor", color: "#A78BFA", shapeLabel: "●", name: "XOR", hasValue: true },
  {
    operation: "<<",
    tone: "shift-left",
    color: "#34D399",
    shapeLabel: "◀",
    name: "SHL",
    hasValue: false,
  },
  {
    operation: ">>",
    tone: "shift-right",
    color: "#FB7185",
    shapeLabel: "▶",
    name: "SHR",
    hasValue: false,
  },
  { operation: "~", tone: "not", color: "#F8FAFC", shapeLabel: "●", name: "NOT", hasValue: true },
];

export function getFoodLegendEntry(operation: BitwiseFoodOperation): FoodLegendEntry {
  return FOOD_LEGEND.find((entry) => entry.operation === operation) ?? FOOD_LEGEND[0]!;
}

export function foodColorByTone(tone: string): string {
  return FOOD_LEGEND.find((entry) => entry.tone === tone)?.color ?? "#FF4D6A";
}
