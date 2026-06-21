import {
  type LengthChoiceOperation,
  applyLengthChoiceOperation,
  formatHex8,
  toUint8,
} from "@/engine/bitwise/BitwiseMath";

export type LengthChoiceReason = "START" | "PATTERN_MATCH";

/**
 * LengthChoice: one selectable bitwise expression option.
 *
 * Design tradeoff (todo.md): the choice modal shows only expression (e.g. "0xAF & 0x3C"),
 * not the computed length/hex/reversal — the player must calculate mentally.
 * That is core to this game's hardcore CS tone.
 * resultLength / reversed remain in the data structure for GameEngine settlement only;
 * the UI layer (LengthChoiceModal) must not read or display those fields.
 */
export interface LengthChoice {
  readonly id: string;
  readonly left: number;
  readonly right: number;
  readonly operation: LengthChoiceOperation;
  readonly resultRaw8: number;
  readonly resultLength: number;
  readonly reversed: boolean;
  readonly expression: string;
}

const OPERATIONS: readonly LengthChoiceOperation[] = ["&", "|", "^"];
const DEFAULT_CHOICE_COUNT = 3;

export function generateLengthChoices(
  count = DEFAULT_CHOICE_COUNT,
): readonly LengthChoice[] {
  const choices: LengthChoice[] = [];
  const seen = new Set<string>();

  while (choices.length < count) {
    const left = randomUint8();
    const right = randomUint8();
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
      resultRaw8: normalized.raw8,
      resultLength: normalized.length,
      reversed: normalized.reversed,
      expression: `${formatHex8(left)} ${operation} ${formatHex8(right)}`,
    });
  }

  return choices;
}

export function createFallbackLengthChoice(length: number): LengthChoice {
  const raw = toUint8(length);
  return {
    id: "choice-fallback",
    left: raw,
    right: raw,
    operation: "|",
    resultRaw8: raw,
    resultLength: Math.max(1, length),
    reversed: false,
    expression: `${formatHex8(raw)} | ${formatHex8(raw)}`,
  };
}

function randomUint8(): number {
  return Math.floor(Math.random() * 0x100);
}
