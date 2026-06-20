import "./style.css";
import { GameEngine } from "./engine/GameEngine";
import { CanvasRenderer } from "./rendering/CanvasRenderer";
import type { GamePhase } from "./engine/core/GameState";

const GRID_CONFIG = { columns: 24, rows: 24 };
const CELL_SIZE_PX = 22;
const TICK_INTERVAL_MS = 150;

function $<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) {
    throw new Error(`未找到元素：${selector}`);
  }
  return el;
}

const canvas = $<HTMLCanvasElement>("#game-canvas");
const overlay = $<HTMLDivElement>("#overlay");
const overlayTitle = $<HTMLHeadingElement>("#overlay-title");
const overlayDesc = $<HTMLParagraphElement>("#overlay-desc");
const startButton = $<HTMLButtonElement>("#start-button");
const scoreDecEl = $<HTMLSpanElement>("#score-dec");
const scoreHexEl = $<HTMLSpanElement>("#score-hex");
const phaseLabelEl = $<HTMLSpanElement>("#phase-label");
const gridSizeLabelEl = $<HTMLSpanElement>("#grid-size-label");

gridSizeLabelEl.textContent = `${GRID_CONFIG.columns}x${GRID_CONFIG.rows}`;

const renderer = new CanvasRenderer(canvas);

function formatHex(score: number): string {
  // Sprint 1 阶段分数恒为非负整数，直接转十六进制即可；
  // Sprint 2 引入补码运算后，这里会替换为真正展示"补码表示"的格式化逻辑。
  return `0x${score.toString(16).toUpperCase().padStart(2, "0")}`;
}

function updateScoreDisplay(score: number): void {
  scoreDecEl.textContent = String(score);
  scoreHexEl.textContent = formatHex(score);
}

const PHASE_COPY: Record<GamePhase, { title: string; desc: string; cta: string }> = {
  IDLE: {
    title: "READY?",
    desc: "方向键 / WASD / 滑动屏幕控制移动。撞墙或撞到自己的身体，进程终止。",
    cta: "START_GAME()",
  },
  PLAYING: {
    title: "",
    desc: "",
    cta: "",
  },
  GAME_OVER: {
    title: "PROCESS_TERMINATED",
    desc: "撞到边界或自身。重新初始化进程以再次运行。",
    cta: "RESTART()",
  },
};

function syncOverlay(phase: GamePhase): void {
  phaseLabelEl.textContent = phase;

  if (phase === "PLAYING") {
    overlay.dataset.visible = "false";
    return;
  }

  overlay.dataset.visible = "true";
  const copy = PHASE_COPY[phase];
  overlayTitle.textContent = copy.title;
  overlayTitle.dataset.state = phase === "GAME_OVER" ? "gameover" : "idle";
  overlayDesc.textContent = copy.desc;
  startButton.textContent = copy.cta;
}

const engine = new GameEngine({
  grid: GRID_CONFIG,
  cellSizePx: CELL_SIZE_PX,
  tickIntervalMs: TICK_INTERVAL_MS,
  inputTarget: window,
  onRenderSnapshot: (snapshot) => renderer.render(snapshot),
  onScoreChange: updateScoreDisplay,
  onPhaseChange: syncOverlay,
});

engine.attachInput();
syncOverlay(engine.state.current);
// 初始也画一帧静态画面（蛇 + 食物 + 网格），避免开始前看到的是空白 canvas。
renderer.render({
  grid: GRID_CONFIG,
  snakeBody: [],
  food: null,
  cellSizePx: CELL_SIZE_PX,
});

function handleStart(): void {
  engine.start();
}

startButton.addEventListener("click", handleStart);

// Space 键快捷开始/重开，与 InputController 的方向键监听互不冲突
// （方向键只在 PLAYING 阶段生效，这里只在非 PLAYING 阶段生效）。
window.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  if (engine.state.is("PLAYING")) return;
  e.preventDefault();
  handleStart();
});

window.addEventListener("beforeunload", () => {
  engine.dispose();
});
