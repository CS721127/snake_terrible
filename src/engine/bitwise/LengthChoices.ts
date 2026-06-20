import {
  type LengthChoiceOperation,
  applyLengthChoiceOperation,
  formatBin16,
  formatHex16,
  toUint16,
} from "@/engine/bitwise/BitwiseMath";

export type LengthChoiceReason = "START" | "PATTERN_MATCH";

export interface LengthChoice {
  readonly id: string;
  readonly left: number;
  readonly right: number;
  readonly operation: LengthChoiceOperation;
  readonly resultRaw16: number;
  readonly resultLength: number;
  readonly reversed: boolean;
  readonly expression: string;
  readonly resultHex: string;
  readonly resultBin: string;
}

const OPERATIONS: readonly LengthChoiceOperation[] = ["&", "|", "^"];

export function generateLengthChoices(count = 5): readonly LengthChoice[] {
  const choices: LengthChoice[] = [];
  const seen = new Set<string>();

  while (choices.length < count) {
    const left = randomUint16();
    const right = randomUint16();
    const operation = OPERATIONS[Math.floor(Math.random() * OPERATIONS.length)] ?? "&";
    const normalized = applyLengthChoiceOperation(left, operation, right);
    const key = `${operation}:${left}:${right}:${normalized.length}`;

    if (seen.has(key)) continue;
    seen.add(key);

    choices.push({
      id: `choice-${choices.length}-${left}-${right}-${operation}`,
      left,
      right,
      operation,
      resultRaw16: normalized.raw16,
      resultLength: normalized.length,
      reversed: normalized.reversed,
      expression: `${formatHex16(left)} ${operation} ${formatHex16(right)}`,
      resultHex: formatHex16(normalized.raw16),
      resultBin: formatBin16(normalized.raw16),
    });
  }

  return choices;
}

export function createFallbackLengthChoice(length: number): LengthChoice {
  const raw = toUint16(length);
  return {
    id: "choice-fallback",
    left: raw,
    right: raw,
    operation: "|",
    resultRaw16: raw,
    resultLength: Math.max(1, length),
    reversed: false,
    expression: `${formatHex16(raw)} | ${formatHex16(raw)}`,
    resultHex: formatHex16(raw),
    resultBin: formatBin16(raw),
  };
}

function randomUint16(): number {
  return Math.floor(Math.random() * 0x10000);
}
