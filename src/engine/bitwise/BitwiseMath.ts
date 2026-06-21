/**
 * 全游戏位运算的底层常量与工具函数。
 *
 * 设计取舍（todo.md 改版后）：蛇的逻辑长度统一收窄为 8-bit（0x00~0xFF），
 * 与 UI 上"8位二进制长度显示"、"2位16进制初始长度/食物数值"完全对齐，
 * 不再有"底层16位、显示层只截8位"这种表里不一致的情况。
 */

export const BIT_WIDTH = 8;
export const BIT_MASK = 0xff;
export const FOOD_VALUE_MASK = 0xff;

export type BitwiseFoodOperation = "&" | "|" | "^" | "<<" | ">>" | "~";
export type LengthChoiceOperation = "&" | "|" | "^";

export interface NormalizedLength {
  readonly raw8: number;
  readonly signed8: number;
  readonly length: number;
  readonly reversed: boolean;
}

export function toUint8(value: number): number {
  return value & BIT_MASK;
}

export function toSigned8(value: number): number {
  const raw = toUint8(value);
  return raw >= 0x80 ? raw - 0x100 : raw;
}

export function normalizeLength(value: number): NormalizedLength {
  const raw8 = toUint8(value);
  const signed8 = toSigned8(raw8);
  const magnitude = Math.abs(signed8);

  return {
    raw8,
    signed8,
    length: magnitude === 0 ? 1 : magnitude,
    reversed: signed8 < 0,
  };
}

export function formatHex8(value: number): string {
  return `0x${toUint8(value).toString(16).toUpperCase().padStart(2, "0")}`;
}

export function formatBin8(value: number): string {
  return `0b${toUint8(value).toString(2).padStart(BIT_WIDTH, "0")}`;
}

export function popcount8(value: number): number {
  let n = toUint8(value);
  let count = 0;
  while (n > 0) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
}

export function applyBitwiseOperation(
  currentLength: number,
  operation: BitwiseFoodOperation,
  value: number | null,
): NormalizedLength {
  const left = toUint8(currentLength);
  const operand = value ?? 0;

  switch (operation) {
    case "&":
      return normalizeLength(left & (operand & FOOD_VALUE_MASK));
    case "|":
      return normalizeLength(left | (operand & FOOD_VALUE_MASK));
    case "^":
      return normalizeLength(left ^ (operand & FOOD_VALUE_MASK));
    case "<<":
      return normalizeLength(left << Math.min(4, Math.max(0, operand)));
    case ">>":
      return normalizeLength(left >>> Math.min(4, Math.max(0, operand)));
    case "~":
      return normalizeLength(~left);
  }
}

export function applyLengthChoiceOperation(
  left: number,
  operation: LengthChoiceOperation,
  right: number,
): NormalizedLength {
  switch (operation) {
    case "&":
      return normalizeLength(left & right);
    case "|":
      return normalizeLength(left | right);
    case "^":
      return normalizeLength(left ^ right);
  }
}
