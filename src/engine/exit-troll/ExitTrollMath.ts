/**
 * ExitTrollMath：退出整蛊流程最后一关的数学题（todo.md 要求）。
 *
 * 设计原则：题目要"看起来特别复杂、难以理解"，但答案永远是 0——
 * 用户只要敢硬算/敢瞎蒙 0，就能退出；真正卡住人的是"这题看起来很吓人"
 * 这件事本身，而不是真的需要微积分/线性代数知识。
 *
 * 项目里没有接入 KaTeX/MathJax 这类公式渲染库，所以这里用纯文本的数学记号
 * （∑ ∏ ∮ ∇ ∂ ∫ 等 Unicode 符号 + 普通括号）拼接，而不是 LaTeX 源码字符串，
 * 这样不依赖任何额外渲染器就能在普通 <p> 标签里正常显示。
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
      hint: `二项展开 (1-1)^${n} 的系数和，恒等于 0。`,
    };
  },
  () => {
    const theta = ["π", "2π", "3π", "-π"][Math.floor(Math.random() * 4)];
    return {
      prompt: `[d/dx · sin(x − ${theta}) · e^cos(0)]ₓ₌${theta} × det[[1,2],[1,2]] = ?`,
      hint: "右边矩阵两行成比例，行列式恒为 0，整体乘积自然也是 0。",
    };
  },
  () => {
    const a = 2 + Math.floor(Math.random() * 7);
    return {
      prompt: `∮꜀ ∇×(∇f(x,y,z)) · dS,  f(x,y,z) = x^${a} y^${a} z^${a}  = ?`,
      hint: "任意标量场梯度的旋度恒为零向量，曲面积分自然是 0。",
    };
  },
  () => {
    const n = 4 + Math.floor(Math.random() * 5);
    return {
      prompt: `trace(AB − BA),  A, B ∈ ℝ^(${n}×${n}) = ?`,
      hint: "迹的循环性质：trace(AB) = trace(BA)，所以 trace(AB−BA) 恒为 0。",
    };
  },
  () => {
    const k = 5 + Math.floor(Math.random() * 20);
    return {
      prompt: `Σ(x∈∅) f(x)^${k}  +  ∏(n=1→0) n!  ·  log_${k}(1) = ?`,
      hint: "空集上的求和恒为 0，加上 log(1) = 0 的项，结果仍是 0。",
    };
  },
  () => {
    const n = 3 + Math.floor(Math.random() * 6);
    return {
      prompt: `[∂/∂t ∫(a→a) g(t,τ) dτ]  ÷  (1 + sinh(0))^${n} = ?`,
      hint: "积分上下限相等，积分本身恒为 0；分母不为 0，所以整体还是 0。",
    };
  },
];

export function generateExitTrollMathProblem(): ExitTrollMathProblem {
  const template =
    ZERO_IDENTITY_TEMPLATES[Math.floor(Math.random() * ZERO_IDENTITY_TEMPLATES.length)] ??
    ZERO_IDENTITY_TEMPLATES[0]!;
  return template();
}

/** 答案恒为 0；只接受字面意义上的数字 0（允许 "0"、"-0"、" 0 " 等空白/符号变体）。 */
export function checkExitTrollMathAnswer(rawInput: string): boolean {
  const trimmed = rawInput.trim();
  if (trimmed === "") return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && value === 0;
}
