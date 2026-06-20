import "./style.css";
import { GameEngine } from "./engine/GameEngine";
import type { DifficultyLevel } from "./engine/GameEngine";
import { CanvasRenderer } from "./rendering/CanvasRenderer";
import type { GamePhase } from "./engine/core/GameState";
import { QuizEngine } from "./engine/revival/QuizEngine";
import type { QuizQuestion } from "./engine/revival/QuizEngine";

/* ============================================================
   工具：严格 querySelector，找不到就抛错，方便排查漏写 id。
   ============================================================ */
function $<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`未找到元素：${selector}`);
  return el;
}

/* ============================================================
   DOM 引用
   ============================================================ */
const canvas        = $<HTMLCanvasElement>("#game-canvas");
const overlay       = $<HTMLDivElement>("#overlay");
const overlayTitle  = $<HTMLHeadingElement>("#overlay-title");
const overlayDesc   = $<HTMLParagraphElement>("#overlay-desc");
const startButton   = $<HTMLButtonElement>("#start-button");

const lenDecEl   = $<HTMLSpanElement>("#len-dec");
const lenHexEl   = $<HTMLSpanElement>("#len-hex");
const lenBinEl   = $<HTMLSpanElement>("#len-bin");
const scoreDecEl = $<HTMLSpanElement>("#score-dec");
const phaseLabelEl = $<HTMLSpanElement>("#phase-label");
const gridSizeLabelEl = $<HTMLSpanElement>("#grid-size-label");
const gridSizeInlineEl = $<HTMLSpanElement>("#grid-size-inline");

const pip0 = $<HTMLSpanElement>("#pip-0");
const pip1 = $<HTMLSpanElement>("#pip-1");
const pip2 = $<HTMLSpanElement>("#pip-2");
const pips = [pip0, pip1, pip2];

const themeToggleBtn = $<HTMLButtonElement>("#theme-toggle");

// 难度 tabs
const difficultyTabsEl = $<HTMLDivElement>("#difficulty-tabs");
const diffTabs = difficultyTabsEl.querySelectorAll<HTMLButtonElement>(".difficulty-tab");

// 皮肤选择
const skinCardsEl = $<HTMLDivElement>("#skin-cards");
const skinCards = skinCardsEl.querySelectorAll<HTMLButtonElement>(".skin-card");

// 答题弹窗
const quizModal     = $<HTMLDivElement>("#quiz-modal");
const quizQuestion  = $<HTMLParagraphElement>("#quiz-question");
const quizTimerFill = $<HTMLDivElement>("#quiz-timer-fill");
const quizTimerWrapper = $<HTMLDivElement>("#quiz-timer-bar-wrapper");
const quizInput     = $<HTMLInputElement>("#quiz-input");
const quizSubmit    = $<HTMLButtonElement>("#quiz-submit");
const quizFeedback  = $<HTMLParagraphElement>("#quiz-feedback");

/* ============================================================
   状态
   ============================================================ */
const CELL_SIZE_PX = 18;

const DIFFICULTY_META: Record<DifficultyLevel, { grid: string; tick: string }> = {
  EASY:   { grid: "20×20", tick: "200ms" },
  MEDIUM: { grid: "28×28", tick: "150ms" },
  HARD:   { grid: "36×36", tick: "100ms" },
};

let currentDifficulty: DifficultyLevel = "MEDIUM";
let currentSkin = "default";
let isDark = true;

const renderer = new CanvasRenderer(canvas);
const quizEngine = new QuizEngine(currentDifficulty);

let currentQuiz: QuizQuestion | null = null;
let quizTimerHandle: ReturnType<typeof setInterval> | null = null;
let quizSecondsLeft = 0;

/* ============================================================
   格式化工具
   ============================================================ */
function formatDec(n: number): string {
  return String(n);
}
function formatHex(n: number): string {
  return `0x${n.toString(16).toUpperCase().padStart(2, "0")}`;
}
function formatBin(n: number): string {
  const bits = n.toString(2).padStart(Math.max(4, Math.ceil(n.toString(2).length / 4) * 4), "0");
  return `0b${bits}`;
}

/* ============================================================
   HUD 更新
   ============================================================ */
function updateLengthDisplay(length: number): void {
  lenDecEl.textContent = formatDec(length);
  lenHexEl.textContent = formatHex(length);
  lenBinEl.textContent = formatBin(length);
}

function updateScoreDisplay(score: number): void {
  scoreDecEl.textContent = String(score);
}

function updateRevivalsDisplay(remaining: number, total: number): void {
  pips.forEach((pip, i) => {
    if (i < total) {
      pip.style.display = "inline-block";
      pip.classList.toggle("revival-pip--spent", i >= remaining);
    } else {
      pip.style.display = "none";
    }
  });
}

function updateGridLabel(): void {
  const meta = DIFFICULTY_META[currentDifficulty];
  const label = `${meta.grid} · ${meta.tick}`;
  gridSizeLabelEl.textContent = label;
  gridSizeInlineEl.textContent = meta.grid;
}

/* ============================================================
   Overlay（开始 / GAME_OVER）
   ============================================================ */
const PHASE_COPY: Record<GamePhase, { title: string; desc: string; cta: string; state?: string }> = {
  IDLE: {
    title: "READY?",
    desc: "方向键 / WASD / 滑动屏幕控制移动。碰撞时有 3 次免费复活；耗尽后须答题复活。",
    cta: "START_GAME()",
  },
  PLAYING: { title: "", desc: "", cta: "" },
  REVIVING: { title: "", desc: "", cta: "" },
  GAME_OVER: {
    title: "PROCESS_TERMINATED",
    desc: "所有复活机会已耗尽或答题失败。重新初始化进程以再次运行。",
    cta: "RESTART()",
    state: "gameover",
  },
};

function syncOverlay(phase: GamePhase): void {
  phaseLabelEl.textContent = phase;

  if (phase === "PLAYING" || phase === "REVIVING") {
    overlay.dataset.visible = "false";
    return;
  }

  overlay.dataset.visible = "true";
  const copy = PHASE_COPY[phase];
  overlayTitle.textContent = copy.title;
  overlayTitle.dataset.state = copy.state ?? "idle";
  overlayDesc.textContent = copy.desc;
  startButton.textContent = copy.cta;
}

/* ============================================================
   答题弹窗逻辑
   ============================================================ */
function showQuiz(): void {
  quizEngine.setDifficulty(currentDifficulty);
  currentQuiz = quizEngine.generateQuestion();

  quizQuestion.textContent = currentQuiz.question;
  quizInput.value = "";
  hideFeedback();
  quizModal.dataset.visible = "true";

  // 聚焦输入框
  requestAnimationFrame(() => quizInput.focus());

  // 启动倒计时
  quizSecondsLeft = currentQuiz.timeLimitSeconds;
  updateTimerBar(1);
  if (quizTimerHandle) clearInterval(quizTimerHandle);
  quizTimerHandle = setInterval(() => {
    quizSecondsLeft -= 0.1;
    const ratio = Math.max(0, quizSecondsLeft / currentQuiz!.timeLimitSeconds);
    updateTimerBar(ratio);
    quizTimerFill.dataset.urgent = ratio < 0.25 ? "true" : "false";
    if (quizSecondsLeft <= 0) {
      stopQuizTimer();
      handleQuizTimeout();
    }
  }, 100);
}

function hideQuiz(): void {
  quizModal.dataset.visible = "false";
  stopQuizTimer();
  currentQuiz = null;
}

function stopQuizTimer(): void {
  if (quizTimerHandle) {
    clearInterval(quizTimerHandle);
    quizTimerHandle = null;
  }
}

function updateTimerBar(ratio: number): void {
  quizTimerFill.style.width = `${ratio * 100}%`;
  quizTimerWrapper.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
}

function showFeedback(msg: string, ok: boolean): void {
  quizFeedback.textContent = msg;
  quizFeedback.dataset.visible = "true";
  quizFeedback.classList.toggle("quiz-modal__feedback--ok", ok);
}

function hideFeedback(): void {
  quizFeedback.dataset.visible = "false";
  quizFeedback.textContent = "";
}

function handleQuizSubmit(): void {
  if (!currentQuiz) return;
  const raw = parseInt(quizInput.value, 10);
  if (isNaN(raw)) {
    showFeedback("请输入有效整数。", false);
    return;
  }
  if (quizEngine.checkAnswer(raw, currentQuiz)) {
    showFeedback("✓ 正确！复活成功", true);
    stopQuizTimer();
    setTimeout(() => {
      hideQuiz();
      engine.submitQuizSuccess();
    }, 600);
  } else {
    showFeedback(`✗ 错误，正确答案是 ${currentQuiz.answer}`, false);
    stopQuizTimer();
    setTimeout(() => {
      hideQuiz();
      engine.submitQuizFailure();
    }, 1200);
  }
}

function handleQuizTimeout(): void {
  showFeedback(`⏱ 超时！正确答案是 ${currentQuiz?.answer ?? "?"}`, false);
  setTimeout(() => {
    hideQuiz();
    engine.submitQuizFailure();
  }, 1200);
}

quizSubmit.addEventListener("click", handleQuizSubmit);
quizInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleQuizSubmit();
});

/* ============================================================
   GameEngine 工厂（每次换难度/重开时重新创建）
   ============================================================ */
let engine: GameEngine;

function createEngine(): void {
  engine?.dispose();

  engine = new GameEngine({
    difficulty: currentDifficulty,
    cellSizePx: CELL_SIZE_PX,
    skinId: currentSkin,
    inputTarget: window,
    onRenderSnapshot: (snapshot) => renderer.render(snapshot),
    onScoreChange: updateScoreDisplay,
    onLengthChange: updateLengthDisplay,
    onRevivalsChange: updateRevivalsDisplay,
    onPhaseChange: (phase) => {
      syncOverlay(phase);
    },
    onQuizRequired: () => {
      showQuiz();
    },
    onRevivalFailed: () => {
      // engine 内部已触发 GAME_OVER
    },
  });

  engine.attachInput();
  syncOverlay(engine.state.current);
  updateRevivalsDisplay(3, 3);
  updateLengthDisplay(3);
  updateScoreDisplay(0);

  // 初始渲染静态帧
  renderer.render({
    grid: engine.grid.config,
    snakeBody: [],
    snakeDirection: "RIGHT",
    foods: [],
    cellSizePx: CELL_SIZE_PX,
    skinId: currentSkin,
  });
}

/* ============================================================
   开始按钮
   ============================================================ */
function handleStart(): void {
  // 如果难度已切换但 engine 还是旧的，engine 在 createEngine 时已重建
  engine.start();
}

startButton.addEventListener("click", handleStart);

window.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  if (engine.state.is("PLAYING") || engine.state.is("REVIVING")) return;
  e.preventDefault();
  handleStart();
});

/* ============================================================
   难度切换
   ============================================================ */
diffTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const difficulty = tab.dataset.difficulty as DifficultyLevel;
    if (difficulty === currentDifficulty) return;
    currentDifficulty = difficulty;

    diffTabs.forEach((t) => t.setAttribute("aria-selected", "false"));
    tab.setAttribute("aria-selected", "true");

    updateGridLabel();
    // 重新创建 engine（新难度）
    createEngine();
  });
});

/* ============================================================
   皮肤切换
   ============================================================ */
skinCards.forEach((card) => {
  card.addEventListener("click", () => {
    const skinId = card.dataset.skin ?? "default";
    if (skinId === currentSkin) return;
    currentSkin = skinId;

    skinCards.forEach((c) => c.setAttribute("aria-selected", "false"));
    card.setAttribute("aria-selected", "true");

    // 只替换皮肤，不重建 engine
    engine.setSkin(skinId);
  });
});

/* ============================================================
   主题切换
   ============================================================ */
themeToggleBtn.addEventListener("click", () => {
  isDark = !isDark;
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggleBtn.textContent = isDark ? "🌙" : "☀️";
  themeToggleBtn.setAttribute("aria-label", isDark ? "切换到 light 主题" : "切换到 dark 主题");
});

// 初始无 data-theme（CSS 变量默认 dark），不设置也可，但明确设一下方便 JS 读取
document.documentElement.dataset.theme = "dark";

/* ============================================================
   初始化
   ============================================================ */
updateGridLabel();
createEngine();

window.addEventListener("beforeunload", () => {
  engine.dispose();
  stopQuizTimer();
});
