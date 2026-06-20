export const BIT_WIDTH = 16;
export const BIT_MASK = 0xffff;
export const FOOD_VALUE_MASK = 0xff;

export type BitwiseFoodOperation = "&" | "|" | "^" | "<<" | ">>" | "~";
export type LengthChoiceOperation = "&" | "|" | "^";

export interface NormalizedLength {
  readonly raw16: number;
  readonly signed16: number;
  readonly length: number;
  readonly reversed: boolean;
}

export function toUint16(value: number): number {
  return value & BIT_MASK;
}

export function toSigned16(value: number): number {
  const raw = toUint16(value);
  return raw >= 0x8000 ? raw - 0x10000 : raw;
}

export function normalizeLength(value: number): NormalizedLength {
  const raw16 = toUint16(value);
  const signed16 = toSigned16(raw16);
  const magnitude = Math.abs(signed16);

  return {
    raw16,
    signed16,
    length: magnitude === 0 ? 1 : magnitude,
    reversed: signed16 < 0,
  };
}

export function formatHex16(value: number): string {
  return `0x${toUint16(value).toString(16).toUpperCase().padStart(4, "0")}`;
}

export function formatHex8(value: number): string {
  return `0x${(value & FOOD_VALUE_MASK).toString(16).toUpperCase().padStart(2, "0")}`;
}

export function formatBin16(value: number): string {
  return `0b${toUint16(value).toString(2).padStart(BIT_WIDTH, "0")}`;
}

export function popcount16(value: number): number {
  let n = toUint16(value);
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
  const left = toUint16(currentLength);
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
