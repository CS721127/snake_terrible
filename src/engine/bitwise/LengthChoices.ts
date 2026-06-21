import {
  type LengthChoiceOperation,
  applyLengthChoiceOperation,
  formatHex8,
  toUint8,
} from "@/engine/bitwise/BitwiseMath";

export type LengthChoiceReason = "START" | "PATTERN_MATCH";

/**
 * LengthChoice：一个可选的"位运算表达式"。
 *
 * 设计取舍（todo.md）：选项框里只展示 expression（例如 "0xAF & 0x3C"），
 * 不展示运算后的长度/十六进制/是否反转等结果——玩家必须在脑子里算出来，
 * 这是这个游戏"硬核计算机科学"调性的核心体验点。
 * resultLength / reversed 仍然保留在数据结构里，但只用于 GameEngine 内部结算，
 * UI 层（LengthChoiceModal）禁止读取并展示这些字段。
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
