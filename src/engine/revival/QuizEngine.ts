export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuizQuestion {
  readonly question: string;
  readonly answer: number;
  readonly timeLimitSeconds: number;
  /** 可选：图片类题目（例如"图中二进制对应的十进制值是多少"）。文字题该字段省略。 */
  readonly imageSrc?: string;
}

const DIFFICULTY_CONFIG: Record<
  QuizDifficulty,
  { timeLimitSeconds: number; maxOperand: number }
> = {
  EASY: { timeLimitSeconds: 30, maxOperand: 0x0f },
  MEDIUM: { timeLimitSeconds: 20, maxOperand: 0x3f },
  HARD: { timeLimitSeconds: 12, maxOperand: 0xff },
};

/** 图片题素材池：复用 public/assets 下已有的蛇皮肤贴图作为视觉素材占位。 */
const QUIZ_IMAGE_POOL: readonly string[] = [
  "/assets/snake/classic/head.png",
  "/assets/snake/neon/head.png",
];

export class QuizEngine {
  private difficulty: QuizDifficulty;

  constructor(difficulty: QuizDifficulty = "MEDIUM") {
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty: QuizDifficulty): void {
    this.difficulty = difficulty;
  }

  generateQuestion(): QuizQuestion {
    const cfg = DIFFICULTY_CONFIG[this.difficulty];
    const a = randomInt(cfg.maxOperand);
    const b = randomInt(cfg.maxOperand);
    const shift = Math.floor(Math.random() * 3);
    const useImagePrompt = Math.random() < 0.3;
    const imageSrc = useImagePrompt
      ? QUIZ_IMAGE_POOL[Math.floor(Math.random() * QUIZ_IMAGE_POOL.length)]
      : undefined;

    switch (Math.floor(Math.random() * 5)) {
      case 0:
        return this.question(`${hex(a)} & ${hex(b)} = ?`, a & b, cfg.timeLimitSeconds, imageSrc);
      case 1:
        return this.question(`${hex(a)} | ${hex(b)} = ?`, a | b, cfg.timeLimitSeconds, imageSrc);
      case 2:
        return this.question(`${hex(a)} ^ ${hex(b)} = ?`, a ^ b, cfg.timeLimitSeconds, imageSrc);
      case 3:
        return this.question(
          `${hex(a)} << ${shift} = ?`,
          a << shift,
          cfg.timeLimitSeconds,
          imageSrc,
        );
      default:
        return this.question(
          `${hex(a)} >> ${shift} = ?`,
          a >>> shift,
          cfg.timeLimitSeconds,
          imageSrc,
        );
    }
  }

  checkAnswer(userInput: number, question: QuizQuestion): boolean {
    return Number.isInteger(userInput) && (userInput & 0xff) === question.answer;
  }

  private question(
    question: string,
    answer: number,
    timeLimitSeconds: number,
    imageSrc?: string,
  ): QuizQuestion {
    return {
      question,
      answer: answer & 0xff,
      timeLimitSeconds,
      imageSrc,
    };
  }
}

function randomInt(maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive + 1));
}

function hex(value: number): string {
  return `0x${(value & 0xff).toString(16).toUpperCase().padStart(2, "0")}`;
}
