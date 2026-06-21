import { BIT_WIDTH, formatBin8, popcount8, toUint8 } from "@/engine/bitwise/BitwiseMath";

export type LengthPatternKind = "BIT_SEQUENCE" | "ONE_COUNT" | "BIT_SET";

export interface LengthPatternGoal {
  readonly id: string;
  readonly kind: LengthPatternKind;
  readonly description: string;
  readonly sequence?: string;
  readonly oneCount?: number;
  /** BIT_SET 专用：从低位数起第几位（0-indexed）。 */
  readonly bitIndex?: number;
  /** BIT_SET 专用：要求该位被设为 0 还是 1。 */
  readonly bitValue?: 0 | 1;
}

const BIT_PATTERNS = ["101", "110", "0110", "1001", "1110", "0101"] as const;

export function generateLengthPatternGoal(currentLength = 1): LengthPatternGoal {
  for (let attempt = 0; attempt < 8; attempt++) {
    const roll = Math.random();
    const goal =
      roll < 0.4
        ? createSequenceGoal()
        : roll < 0.7
          ? createOneCountGoal()
          : createBitSetGoal();

    if (!matchesLengthPattern(currentLength, goal)) {
      return goal;
    }
  }

  return createSequenceGoal();
}

export function matchesLengthPattern(length: number, goal: LengthPatternGoal): boolean {
  const raw = toUint8(length);
  const bits = formatBin8(raw).slice(2);

  if (goal.kind === "BIT_SEQUENCE") {
    return Boolean(goal.sequence && bits.includes(goal.sequence));
  }

  if (goal.kind === "BIT_SET") {
    if (goal.bitIndex === undefined || goal.bitValue === undefined) return false;
    const actualBit = (raw >>> goal.bitIndex) & 1;
    return actualBit === goal.bitValue;
  }

  return goal.oneCount === popcount8(raw);
}

function createSequenceGoal(): LengthPatternGoal {
  const sequence = BIT_PATTERNS[Math.floor(Math.random() * BIT_PATTERNS.length)] ?? "110";
  return {
    id: `bits-${sequence}-${Date.now()}-${Math.random()}`,
    kind: "BIT_SEQUENCE",
    sequence,
    description: `LEN_BIN contains ${sequence}`,
  };
}

function createOneCountGoal(): LengthPatternGoal {
  const count = 1 + Math.floor(Math.random() * Math.max(1, BIT_WIDTH - 1));
  return {
    id: `ones-${count}-${Date.now()}-${Math.random()}`,
    kind: "ONE_COUNT",
    oneCount: count,
    description: `popcount(LEN_BIN) == ${count}`,
  };
}

function createBitSetGoal(): LengthPatternGoal {
  const bitIndex = Math.floor(Math.random() * BIT_WIDTH);
  const bitValue: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
  return {
    id: `bitset-${bitIndex}-${bitValue}-${Date.now()}-${Math.random()}`,
    kind: "BIT_SET",
    bitIndex,
    bitValue,
    description: `set bit[${bitIndex}] of LEN_BIN to ${bitValue}`,
  };
}
