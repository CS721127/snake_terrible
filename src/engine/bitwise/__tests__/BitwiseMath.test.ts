import { describe, expect, it } from "vitest";
import {
  applyBitwiseOperation,
  applyLengthChoiceOperation,
  formatBin8,
  formatHex8,
  normalizeLength,
} from "../BitwiseMath";

describe("BitwiseMath", () => {
  it("normalizes zero length to one segment", () => {
    expect(normalizeLength(0)).toMatchObject({
      raw8: 0,
      signed8: 0,
      length: 1,
      reversed: false,
    });
  });

  it("treats signed negative 8-bit results as reversed absolute length", () => {
    expect(normalizeLength(0xfc)).toMatchObject({
      raw8: 0xfc,
      signed8: -4,
      length: 4,
      reversed: true,
    });
  });

  it("applies bitwise food operations with 8-bit wrapping", () => {
    expect(applyBitwiseOperation(0xf0, "&", 0x0f).length).toBe(1);
    expect(applyBitwiseOperation(0x0f, "<<", 4).raw8).toBe(0xf0);
    expect(applyBitwiseOperation(0x03, "~", null)).toMatchObject({
      raw8: 0xfc,
      length: 4,
      reversed: true,
    });
  });

  it("applies starting length choices from two 8-bit operands", () => {
    expect(applyLengthChoiceOperation(0xf0, "^", 0x0f).raw8).toBe(0xff);
  });

  it("formats values as fixed-width 8-bit strings", () => {
    expect(formatHex8(3)).toBe("0x03");
    expect(formatBin8(3)).toBe("0b00000011");
  });
});
