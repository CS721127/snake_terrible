/**
 * ExitTrollMath: math problem for the final stage of the exit troll flow (todo.md).
 *
 * Design principle: the prompt should look very complex and hard to parse, but the answer is always 0—
 * users who guess 0 can exit; what traps people is how intimidating the problem looks,
 * not actually needing calculus or linear algebra.
 *
 * The project does not use KaTeX/MathJax, so prompts are plain-text math notation
 * (∑ ∏ ∮ ∇ ∂ ∫ and other Unicode symbols + regular parentheses), not LaTeX source strings,
 * so they render in a normal <p> tag without extra renderers.
 */

export interface ExitTrollMathProblem {
  readonly prompt: string;
  readonly hint: string;
}

const ZERO_IDENTITY_TEMPLATES: readonly (() => ExitTrollMathProblem)[] = [
  () => {
    const n = 3 + Math.floor(Math.random() * 6);
    return {
      prompt: `Σ(k=0→${n}) (-1)^k · C(${n}, k) = ?`,
      hint: `The sum of coefficients in the binomial expansion of (1-1)^${n} is always 0.`,
    };
  },
  () => {
    const theta = ["π", "2π", "3π", "-π"][Math.floor(Math.random() * 4)];
    return {
      prompt: `[d/dx · sin(x − ${theta}) · e^cos(0)]ₓ₌${theta} × det[[1,2],[1,2]] = ?`,
      hint: "The matrix on the right has proportional rows, so its determinant is always 0, and the whole product is 0.",
    };
  },
  () => {
    const a = 2 + Math.floor(Math.random() * 7);
    return {
      prompt: `∮꜀ ∇×(∇f(x,y,z)) · dS,  f(x,y,z) = x^${a} y^${a} z^${a}  = ?`,
      hint: "The curl of any scalar field gradient is always the zero vector, so the surface integral is 0.",
    };
  },
  () => {
    const n = 4 + Math.floor(Math.random() * 5);
    return {
      prompt: `trace(AB − BA),  A, B ∈ ℝ^(${n}×${n}) = ?`,
      hint: "Cyclic trace property: trace(AB) = trace(BA), so trace(AB−BA) is always 0.",
    };
  },
  () => {
    const k = 5 + Math.floor(Math.random() * 20);
    return {
      prompt: `Σ(x∈∅) f(x)^${k}  +  ∏(n=1→0) n!  ·  log_${k}(1) = ?`,
      hint: "A sum over the empty set is always 0, and log(1) = 0, so the result is still 0.",
    };
  },
  () => {
    const n = 3 + Math.floor(Math.random() * 6);
    return {
      prompt: `[∂/∂t ∫(a→a) g(t,τ) dτ]  ÷  (1 + sinh(0))^${n} = ?`,
      hint: "Equal integration bounds make the integral always 0; the denominator is non-zero, so the whole expression is still 0.",
    };
  },
];

export function generateExitTrollMathProblem(): ExitTrollMathProblem {
  const template =
    ZERO_IDENTITY_TEMPLATES[Math.floor(Math.random() * ZERO_IDENTITY_TEMPLATES.length)] ??
    ZERO_IDENTITY_TEMPLATES[0]!;
  return template();
}

/** Answer is always 0; only accepts the literal number 0 (allows "0", "-0", " 0 ", etc.). */
export function checkExitTrollMathAnswer(rawInput: string): boolean {
  const trimmed = rawInput.trim();
  if (trimmed === "") return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && value === 0;
}
