/**
 * QuizEngine：答题引擎（Sprint 1.5 占位版）。
 *
 * 当前实现：10 以内的加减法随机题目，作为复活答题的占位。
 * Sprint 2 将替换 generateQuestion() 为补码/位运算题目生成器，
 * 接口（generateQuestion / checkAnswer）保持不变，上层 RevivalManager 无需改动。
 */

export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuizQuestion {
  /** 展示给玩家的题目字符串，例如 "7 + 8 = ?" */
  readonly question: string;
  /** 正确答案（整数） */
  readonly answer: number;
  /** 答题时限（秒） */
  readonly timeLimitSeconds: number;
}

/** 各难度的答题时限与数值范围配置。 */
const DIFFICULTY_CONFIG: Record<
  QuizDifficulty,
  { timeLimitSeconds: number; maxOperand: number }
> = {
  EASY: { timeLimitSeconds: 30, maxOperand: 10 },
  MEDIUM: { timeLimitSeconds: 20, maxOperand: 20 },
  HARD: { timeLimitSeconds: 10, maxOperand: 50 },
};

export class QuizEngine {
  private difficulty: QuizDifficulty;

  constructor(difficulty: QuizDifficulty = "MEDIUM") {
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty: QuizDifficulty): void {
    this.difficulty = difficulty;
  }

  /**
   * 生成一道随机题目。
   * Sprint 1.5：简单加减法。
   * Sprint 2：替换为补码/位运算题目生成逻辑。
   */
  generateQuestion(): QuizQuestion {
    const cfg = DIFFICULTY_CONFIG[this.difficulty];
    const a = Math.floor(Math.random() * cfg.maxOperand) + 1;
    const b = Math.floor(Math.random() * cfg.maxOperand) + 1;

    // 随机选择加法或减法，减法保证结果非负（更直觉）。
    const useAdd = Math.random() < 0.5;
    if (useAdd) {
      return {
        question: `${a} + ${b} = ?`,
        answer: a + b,
        timeLimitSeconds: cfg.timeLimitSeconds,
      };
    } else {
      const [bigger, smaller] = a >= b ? [a, b] : [b, a];
      return {
        question: `${bigger} - ${smaller} = ?`,
        answer: bigger - smaller,
        timeLimitSeconds: cfg.timeLimitSeconds,
      };
    }
  }

  /**
   * 判断用户输入是否正确。
   * @param userInput 用户输入的整数
   * @param question 当前题目（含正确答案）
   */
  checkAnswer(userInput: number, question: QuizQuestion): boolean {
    return Number.isInteger(userInput) && userInput === question.answer;
  }
}
