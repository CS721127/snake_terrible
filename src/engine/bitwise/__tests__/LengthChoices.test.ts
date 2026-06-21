import { describe, expect, it } from "vitest";
import { createFallbackLengthChoice, generateLengthChoices } from "../LengthChoices";

describe("LengthChoices", () => {
  it("generates 3 choices by default (todo.md requirement)", () => {
    const choices = generateLengthChoices();
    expect(choices).toHaveLength(3);
  });

  it("operands are within 8-bit range (0x00~0xFF)", () => {
    const choices = generateLengthChoices(10);
    for (const choice of choices) {
      expect(choice.left).toBeGreaterThanOrEqual(0);
      expect(choice.left).toBeLessThanOrEqual(0xff);
      expect(choice.right).toBeGreaterThanOrEqual(0);
      expect(choice.right).toBeLessThanOrEqual(0xff);
    }
  });

  it("expression uses 2-digit hex formatting", () => {
    const choices = generateLengthChoices(5);
    for (const choice of choices) {
      expect(choice.expression).toMatch(/^0x[0-9A-F]{2} [&|^] 0x[0-9A-F]{2}$/);
    }
  });

  it("does not expose resultHex/resultBin fields (result must stay hidden)", () => {
    const choices = generateLengthChoices(3);
    for (const choice of choices) {
      expect(choice).not.toHaveProperty("resultHex");
      expect(choice).not.toHaveProperty("resultBin");
    }
  });

  it("fallback choice still resolves to the same length via OR with itself", () => {
    const fallback = createFallbackLengthChoice(42);
    expect(fallback.resultLength).toBe(42);
    expect(fallback.operation).toBe("|");
  });
});
