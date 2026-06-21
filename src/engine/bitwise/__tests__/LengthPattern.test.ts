import { describe, expect, it } from "vitest";
import { matchesLengthPattern } from "../LengthPattern";
import type { LengthPatternGoal } from "../LengthPattern";

describe("LengthPattern", () => {
  it("BIT_SEQUENCE: matches when the 8-bit binary string contains the target substring", () => {
    const goal: LengthPatternGoal = {
      id: "test-seq",
      kind: "BIT_SEQUENCE",
      sequence: "110",
      description: "test",
    };
    // 6 = 0b00000110, contains "110"
    expect(matchesLengthPattern(6, goal)).toBe(true);
    // 5 = 0b00000101, does not contain "110"
    expect(matchesLengthPattern(5, goal)).toBe(false);
  });

  it("ONE_COUNT: matches when popcount equals the target", () => {
    const goal: LengthPatternGoal = {
      id: "test-count",
      kind: "ONE_COUNT",
      oneCount: 3,
      description: "test",
    };
    // 7 = 0b00000111, popcount = 3
    expect(matchesLengthPattern(7, goal)).toBe(true);
    // 6 = 0b00000110, popcount = 2
    expect(matchesLengthPattern(6, goal)).toBe(false);
  });

  it("BIT_SET: matches when the given bit index equals the target value (set to 1)", () => {
    const goal: LengthPatternGoal = {
      id: "test-bitset-1",
      kind: "BIT_SET",
      bitIndex: 2,
      bitValue: 1,
      description: "test",
    };
    // 4 = 0b00000100, bit[2] = 1
    expect(matchesLengthPattern(4, goal)).toBe(true);
    // 3 = 0b00000011, bit[2] = 0
    expect(matchesLengthPattern(3, goal)).toBe(false);
  });

  it("BIT_SET: matches when the given bit index equals the target value (set to 0)", () => {
    const goal: LengthPatternGoal = {
      id: "test-bitset-0",
      kind: "BIT_SET",
      bitIndex: 0,
      bitValue: 0,
      description: "test",
    };
    // 4 = 0b00000100, bit[0] = 0
    expect(matchesLengthPattern(4, goal)).toBe(true);
    // 5 = 0b00000101, bit[0] = 1
    expect(matchesLengthPattern(5, goal)).toBe(false);
  });

  it("BIT_SET: returns false when bitIndex/bitValue are missing (defensive)", () => {
    const goal: LengthPatternGoal = {
      id: "test-bitset-incomplete",
      kind: "BIT_SET",
      description: "test",
    };
    expect(matchesLengthPattern(4, goal)).toBe(false);
  });
});
