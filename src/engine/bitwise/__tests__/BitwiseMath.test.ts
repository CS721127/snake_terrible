import { describe, expect, it } from "vitest";
import {
  applyBitwiseOperation,
  applyLengthChoiceOperation,
  formatBin16,
  formatHex16,
  normalizeLength,
} from "../BitwiseMath";

describe("BitwiseMath", () => {
  it("normalizes zero length to one segment", () => {
    expect(normalizeLength(0)).toMatchObject({
      raw16: 0,
      signed16: 0,
      length: 1,
      reversed: false,
    });
  });

  it("treats signed negative 16-bit results as reversed absolute length", () => {
    expect(normalizeLength(0xfffc)).toMatchObject({
      raw16: 0xfffc,
      signed16: -4,
      length: 4,
      reversed: true,
    });
  });

  it("applies bitwise food operations with 16-bit wrapping", () => {
    expect(applyBitwiseOperation(0x00f0, "&", 0x0f).length).toBe(1);
    expect(applyBitwiseOperation(0x000f, "<<", 4).raw16).toBe(0x00f0);
    expect(applyBitwiseOperation(0x0003, "~", null)).toMatchObject({
      raw16: 0xfffc,
      length: 4,
      reversed: true,
    });
  });

  it("applies starting length choices from two 16-bit operands", () => {
    expect(applyLengthChoiceOperation(0x00f0, "^", 0x0f0f).raw16).toBe(0x0fff);
  });

  it("formats values as fixed-width 16-bit strings", () => {
    expect(formatHex16(3)).toBe("0x0003");
    expect(formatBin16(3)).toBe("0b0000000000000011");
  });
});
