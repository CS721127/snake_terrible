export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuizQuestion {
  readonly question: string;
  readonly answer: number;
  readonly timeLimitSeconds: number;
  readonly imageSrc?: string;
}

const DIFFICULTY_CONFIG: Record<
  QuizDifficulty,
  { timeLimitSeconds: number; maxOperand: number }
> = {
  EASY: { timeLimitSeconds: 30, maxOperand: 0xff },
  MEDIUM: { timeLimitSeconds: 20, maxOperand: 0x0fff },
  HARD: { timeLimitSeconds: 12, maxOperand: 0xffff },
};

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
    const shift = Math.floor(Math.random() * 5);

    switch (Math.floor(Math.random() * 5)) {
      case 0:
        return this.question(`${hex(a)} & ${hex(b)} = ?`, a & b, cfg.timeLimitSeconds);
      case 1:
        return this.question(`${hex(a)} | ${hex(b)} = ?`, a | b, cfg.timeLimitSeconds);
      case 2:
        return this.question(`${hex(a)} ^ ${hex(b)} = ?`, a ^ b, cfg.timeLimitSeconds);
      case 3:
        return this.question(`${hex(a)} << ${shift} = ?`, a << shift, cfg.timeLimitSeconds);
      default:
        return this.question(`${hex(a)} >> ${shift} = ?`, a >>> shift, cfg.timeLimitSeconds);
    }
  }

  checkAnswer(userInput: number, question: QuizQuestion): boolean {
    return Number.isInteger(userInput) && (userInput & 0xffff) === question.answer;
  }

  private question(
    question: string,
    answer: number,
    timeLimitSeconds: number,
  ): QuizQuestion {
    return {
      question,
      answer: answer & 0xffff,
      timeLimitSeconds,
    };
  }
}

function randomInt(maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive + 1));
}

function hex(value: number): string {
  return `0x${(value & 0xffff).toString(16).toUpperCase().padStart(4, "0")}`;
}
