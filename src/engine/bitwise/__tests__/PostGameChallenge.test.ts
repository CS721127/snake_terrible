import { describe, expect, it } from "vitest";
import {
  checkPostGameChallenge,
  evaluateCBitwiseExpression,
} from "../PostGameChallenge";
import type { PostGameChallenge } from "../PostGameChallenge";

describe("PostGameChallenge", () => {
  it("evaluates a safe subset of C-style bitwise expressions", () => {
    expect(evaluateCBitwiseExpression("(len >> 2) & 0x7", { len: 0b111100 })).toBe(0b111);
    expect(evaluateCBitwiseExpression("len & ~(1 << 3)", { len: 0b1111 })).toBe(0b0111);
  });

  it("checks challenge answers against the expected 16-bit result", () => {
    const challenge: PostGameChallenge = {
      prompt: "extract bits",
      length: 0b111100,
      expected: 0b111,
      variableName: "len",
    };

    expect(checkPostGameChallenge("(len >> 2) & 0x7", challenge).ok).toBe(true);
    expect(checkPostGameChallenge("0x7", challenge).ok).toBe(false);
  });
});
