import type { BitwiseFoodOperation } from "@/engine/bitwise/BitwiseMath";

/**
 * FoodLegend：果子的「运算类型 → 视觉表现」唯一数据源。
 *
 * 设计取舍：颜色/形状映射只在这里定义一次，CanvasRenderer（画布上的果子）
 * 和 FoodLegendPanel（右侧图鉴侧边栏）都从这里读取，避免两处颜色表各写一份、
 * 后续改配色时漏改其中一处导致"图鉴说的颜色和画面上不一样"。
 */
export interface FoodLegendEntry {
  readonly operation: BitwiseFoodOperation;
  readonly tone: string;
  readonly color: string;
  readonly shapeLabel: string;
  readonly name: string;
  /** shift 运算符不需要携带 value（todo.md 要求），其余运算都携带一个 2 位 16 进制数值。 */
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
