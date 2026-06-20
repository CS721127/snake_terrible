import { BIT_WIDTH, formatBin16, popcount16, toUint16 } from "@/engine/bitwise/BitwiseMath";

export type LengthPatternKind = "BIT_SEQUENCE" | "ONE_COUNT";

export interface LengthPatternGoal {
  readonly id: string;
  readonly kind: LengthPatternKind;
  readonly description: string;
  readonly sequence?: string;
  readonly oneCount?: number;
}

const BIT_PATTERNS = ["101", "110", "0110", "1001", "1110", "0101"] as const;

export function generateLengthPatternGoal(currentLength = 1): LengthPatternGoal {
  for (let attempt = 0; attempt < 8; attempt++) {
    const goal = Math.random() < 0.55
      ? createSequenceGoal()
      : createOneCountGoal();

    if (!matchesLengthPattern(currentLength, goal)) {
      return goal;
    }
  }

  return createSequenceGoal();
}

export function matchesLengthPattern(length: number, goal: LengthPatternGoal): boolean {
  const raw = toUint16(length);
  const bits = formatBin16(raw).slice(2);

  if (goal.kind === "BIT_SEQUENCE") {
    return Boolean(goal.sequence && bits.includes(goal.sequence));
  }

  return goal.oneCount === popcount16(raw);
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
  const count = 2 + Math.floor(Math.random() * Math.max(1, BIT_WIDTH - 3));
  return {
    id: `ones-${count}-${Date.now()}-${Math.random()}`,
    kind: "ONE_COUNT",
    oneCount: count,
    description: `popcount(LEN_BIN) == ${count}`,
  };
}
