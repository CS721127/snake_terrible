import type { Cell } from "@/engine/core/types";
import type { Grid } from "@/engine/core/Grid";
import {
  FOOD_VALUE_MASK,
  type BitwiseFoodOperation,
  formatHex8,
} from "@/engine/bitwise/BitwiseMath";

export interface BitwiseFoodSnapshot extends Cell {
  readonly operation: BitwiseFoodOperation;
  readonly value: number | null;
  readonly label: string;
  readonly tone: string;
}

const OPERATIONS: readonly BitwiseFoodOperation[] = ["&", "|", "^", "<<", ">>", "~"];

const FOOD_TONES: Record<BitwiseFoodOperation, string> = {
  "&": "and",
  "|": "or",
  "^": "xor",
  "<<": "shift-left",
  ">>": "shift-right",
  "~": "not",
};

export class BitwiseFood {
  private currentPosition: Cell;
  readonly operation: BitwiseFoodOperation;
  readonly value: number | null;

  constructor(position: Cell, operation = randomOperation(), value = randomValue(operation)) {
    this.currentPosition = position;
    this.operation = operation;
    this.value = value;
  }

  get position(): Cell {
    return this.currentPosition;
  }

  get snapshot(): BitwiseFoodSnapshot {
    return {
      ...this.currentPosition,
      operation: this.operation,
      value: this.value,
      label: this.createLabel(),
      tone: FOOD_TONES[this.operation],
    };
  }

  respawn(grid: Grid, occupied: ReadonlySet<string>): BitwiseFood | null {
    const next = grid.randomEmptyCell(occupied);
    if (!next) return null;
    return BitwiseFood.randomAt(next);
  }

  static randomAt(position: Cell): BitwiseFood {
    const operation = randomOperation();
    return new BitwiseFood(position, operation, randomValue(operation));
  }

  private createLabel(): string {
    if (this.operation === "~") return "~";
    if (this.operation === "<<" || this.operation === ">>") {
      return `${this.operation}${this.value ?? 0}`;
    }
    return `${this.operation}${formatHex8(this.value ?? 0)}`;
  }
}

function randomOperation(): BitwiseFoodOperation {
  const index = Math.floor(Math.random() * OPERATIONS.length);
  return OPERATIONS[index] ?? "&";
}

function randomValue(operation: BitwiseFoodOperation): number | null {
  if (operation === "~") return null;
  if (operation === "<<" || operation === ">>") {
    return Math.floor(Math.random() * 5);
  }
  return Math.floor(Math.random() * (FOOD_VALUE_MASK + 1));
}
