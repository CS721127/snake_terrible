import { BIT_MASK, formatHex8, toUint8 } from "@/engine/bitwise/BitwiseMath";

export interface PostGameChallenge {
  readonly prompt: string;
  readonly length: number;
  readonly expected: number;
  readonly variableName: "len";
}

export interface ChallengeCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

export function generatePostGameChallenge(length: number): PostGameChallenge {
  const raw = toUint8(length);

  if (Math.random() < 0.5) {
    const start = Math.floor(Math.random() * 5);
    const width = 2 + Math.floor(Math.random() * 3);
    const end = Math.min(7, start + width - 1);
    const mask = (1 << (end - start + 1)) - 1;

    return {
      prompt: `uint8_t len = ${formatHex8(raw)}; write a C expression using len to extract bits ${end}..${start}.`,
      length: raw,
      expected: (raw >>> start) & mask,
      variableName: "len",
    };
  }

  const bit = Math.floor(Math.random() * 8);
  return {
    prompt: `uint8_t len = ${formatHex8(raw)}; write a C expression using len that clears bit ${bit} to 0.`,
    length: raw,
    expected: raw & ~(1 << bit) & BIT_MASK,
    variableName: "len",
  };
}

export function checkPostGameChallenge(
  answer: string,
  challenge: PostGameChallenge,
): ChallengeCheckResult {
  if (!/\blen\b/.test(answer)) {
    return { ok: false, message: "Use the variable len in the expression." };
  }

  try {
    const value = evaluateCBitwiseExpression(answer, { len: challenge.length });
    const normalized = toUint8(value);
    const ok = normalized === toUint8(challenge.expected);

    return {
      ok,
      message: ok
        ? "Correct. Bonus point granted."
        : `Wrong. Expected value: ${formatHex8(challenge.expected)}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid expression.",
    };
  }
}

export function evaluateCBitwiseExpression(
  source: string,
  variables: Readonly<Record<string, number>>,
): number {
  return new ExpressionParser(source, variables).parse();
}

type TokenType =
  | "number"
  | "identifier"
  | "&"
  | "|"
  | "^"
  | "~"
  | "<<"
  | ">>"
  | "("
  | ")"
  | "eof";

interface Token {
  readonly type: TokenType;
  readonly value?: number | string;
}

class ExpressionParser {
  private readonly tokens: Token[];
  private index = 0;

  constructor(source: string, private readonly variables: Readonly<Record<string, number>>) {
    this.tokens = tokenize(source);
  }

  parse(): number {
    const value = this.parseOr();
    this.expect("eof");
    return toUint8(value);
  }

  private parseOr(): number {
    let value = this.parseXor();
    while (this.match("|")) {
      value = toUint8(value | this.parseXor());
    }
    return value;
  }

  private parseXor(): number {
    let value = this.parseAnd();
    while (this.match("^")) {
      value = toUint8(value ^ this.parseAnd());
    }
    return value;
  }

  private parseAnd(): number {
    let value = this.parseShift();
    while (this.match("&")) {
      value = toUint8(value & this.parseShift());
    }
    return value;
  }

  private parseShift(): number {
    let value = this.parseUnary();
    while (true) {
      if (this.match("<<")) {
        value = toUint8(value << this.parseUnary());
      } else if (this.match(">>")) {
        value = toUint8(value >>> this.parseUnary());
      } else {
        return value;
      }
    }
  }

  private parseUnary(): number {
    if (this.match("~")) {
      return toUint8(~this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.peek();

    if (this.match("number")) {
      return Number(token.value);
    }

    if (this.match("identifier")) {
      const name = String(token.value);
      if (!(name in this.variables)) {
        throw new Error(`Unknown variable: ${name}`);
      }
      return toUint8(this.variables[name] ?? 0);
    }

    if (this.match("(")) {
      const value = this.parseOr();
      this.expect(")");
      return value;
    }

    throw new Error("Invalid expression.");
  }

  private peek(): Token {
    return this.tokens[this.index] ?? { type: "eof" };
  }

  private match(type: TokenType): boolean {
    if (this.peek().type !== type) return false;
    this.index += 1;
    return true;
  }

  private expect(type: TokenType): void {
    if (!this.match(type)) {
      throw new Error(`Expected ${type}.`);
    }
  }
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    if (!char) break;

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (source.startsWith("<<", index) || source.startsWith(">>", index)) {
      tokens.push({ type: source.slice(index, index + 2) as "<<" | ">>" });
      index += 2;
      continue;
    }

    if ("&|^~()".includes(char)) {
      tokens.push({ type: char as TokenType });
      index += 1;
      continue;
    }

    const numberMatch = /^(0x[0-9a-fA-F]+|0b[01]+|\d+)/.exec(source.slice(index));
    if (numberMatch) {
      const literal = numberMatch[0];
      tokens.push({ type: "number", value: parseNumber(literal) });
      index += literal.length;
      continue;
    }

    const identifierMatch = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(index));
    if (identifierMatch) {
      const identifier = identifierMatch[0];
      tokens.push({ type: "identifier", value: identifier });
      index += identifier.length;
      continue;
    }

    throw new Error(`Unsupported token near "${source.slice(index, index + 8)}".`);
  }

  tokens.push({ type: "eof" });
  return tokens;
}

function parseNumber(literal: string): number {
  if (literal.startsWith("0x") || literal.startsWith("0X")) {
    return Number.parseInt(literal.slice(2), 16);
  }
  if (literal.startsWith("0b") || literal.startsWith("0B")) {
    return Number.parseInt(literal.slice(2), 2);
  }
  return Number.parseInt(literal, 10);
}
