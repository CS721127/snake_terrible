import { useCallback, useEffect, useRef, useState } from "react";
import {
  CELL_SIZE_PX,
  DEFAULT_ROOM_CODE,
  DIFFICULTY_GRID,
} from "@/app/constants";
import { normalizeRoomCode } from "@/app/format";
import type { HudState, QuizViewState, RoomFormState, ThemeMode } from "@/app/types";
import { DifficultyToolbar } from "@/components/DifficultyToolbar";
import { GameStage } from "@/components/GameStage";
import { Hud } from "@/components/Hud";
import { QuizModal } from "@/components/QuizModal";
import { RealtimePanel } from "@/components/RealtimePanel";
import { SkinSelector } from "@/components/SkinSelector";
import { GameEngine } from "@/engine/GameEngine";
import type { DifficultyLevel } from "@/engine/GameEngine";
import { InputController } from "@/engine/core/InputController";
import { QuizEngine } from "@/engine/revival/QuizEngine";
import type { QuizQuestion } from "@/engine/revival/QuizEngine";
import {
  REALTIME_SCHEMA_VERSION,
  type ClientCommandMessage,
  type GameSnapshotMessage,
  type PlayerInputMessage,
} from "@/realtime/types";
import type { RealtimeRole } from "@/realtime/types";
import { CanvasRenderer } from "@/rendering/CanvasRenderer";
import type { RenderSnapshot } from "@/rendering/Renderer";
import { useRealtimeRoom } from "@/hooks/useRealtimeRoom";

const INITIAL_HUD: HudState = {
  length: 3,
  score: 0,
  phase: "IDLE",
  revivalsRemaining: 3,
  revivalsTotal: 3,
};

const INITIAL_QUIZ: QuizViewState = {
  visible: false,
  question: "",
  answerText: "",
  timerRatio: 1,
  isUrgent: false,
  feedback: "",
  feedbackOk: false,
};

function createEmptySnapshot(
  difficulty: DifficultyLevel,
  skinId: string,
): RenderSnapshot {
  return {
    grid: DIFFICULTY_GRID[difficulty],
    snakeBody: [],
    snakeDirection: "RIGHT",
    foods: [],
    cellSizePx: CELL_SIZE_PX,
    skinId,
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const latestSnapshotRef = useRef<RenderSnapshot | null>(null);

  const [difficulty, setDifficultyState] = useState<DifficultyLevel>("MEDIUM");
  const difficultyRef = useRef<DifficultyLevel>(difficulty);
  const setDifficulty = useCallback((next: DifficultyLevel) => {
    difficultyRef.current = next;
    setDifficultyState(next);
  }, []);

  const [skinId, setSkinIdState] = useState("default");
  const skinIdRef = useRef(skinId);
  const setSkinId = useCallback((next: string) => {
    skinIdRef.current = next;
    setSkinIdState(next);
  }, []);

  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [hud, setHudState] = useState<HudState>(INITIAL_HUD);
  const hudRef = useRef<HudState>(hud);
  const setHudPatch = useCallback((patch: Partial<HudState>) => {
    setHudState((prev) => {
      const next = { ...prev, ...patch };
      hudRef.current = next;
      return next;
    });
  }, []);

  const [quiz, setQuiz] = useState<QuizViewState>(INITIAL_QUIZ);
  const quizEngineRef = useRef(new QuizEngine(difficulty));
  const currentQuizRef = useRef<QuizQuestion | null>(null);
  const quizIntervalRef = useRef<number | null>(null);
  const quizResolutionRef = useRef<number | null>(null);

  const [roomForm, setRoomForm] = useState<RoomFormState>({
    roomCode: DEFAULT_ROOM_CODE,
    role: "host",
  });
  const roleRef = useRef<RealtimeRole>(roomForm.role);

  const stopQuizInterval = useCallback(() => {
    if (quizIntervalRef.current !== null) {
      window.clearInterval(quizIntervalRef.current);
      quizIntervalRef.current = null;
    }
  }, []);

  const hideQuiz = useCallback(() => {
    stopQuizInterval();
    currentQuizRef.current = null;
    setQuiz(INITIAL_QUIZ);
  }, [stopQuizInterval]);

  const finishQuiz = useCallback(
    (success: boolean, delayMs: number) => {
      stopQuizInterval();
      if (quizResolutionRef.current !== null) {
        window.clearTimeout(quizResolutionRef.current);
      }

      quizResolutionRef.current = window.setTimeout(() => {
        quizResolutionRef.current = null;
        hideQuiz();
        if (success) {
          engineRef.current?.submitQuizSuccess();
        } else {
          engineRef.current?.submitQuizFailure();
        }
      }, delayMs);
    },
    [hideQuiz, stopQuizInterval],
  );

  const showQuiz = useCallback(() => {
    quizEngineRef.current.setDifficulty(difficultyRef.current);
    const question = quizEngineRef.current.generateQuestion();
    currentQuizRef.current = question;

    if (quizResolutionRef.current !== null) {
      window.clearTimeout(quizResolutionRef.current);
      quizResolutionRef.current = null;
    }

    let secondsLeft = question.timeLimitSeconds;
    stopQuizInterval();
    setQuiz({
      visible: true,
      question: question.question,
      answerText: "",
      timerRatio: 1,
      isUrgent: false,
      feedback: "",
      feedbackOk: false,
    });

    quizIntervalRef.current = window.setInterval(() => {
      secondsLeft -= 0.1;
      const ratio = Math.max(0, secondsLeft / question.timeLimitSeconds);
      setQuiz((prev) => ({
        ...prev,
        timerRatio: ratio,
        isUrgent: ratio < 0.25,
      }));

      if (secondsLeft <= 0) {
        stopQuizInterval();
        setQuiz((prev) => ({
          ...prev,
          feedback: `Timeout. Answer: ${question.answer}`,
          feedbackOk: false,
        }));
        finishQuiz(false, 1_200);
      }
    }, 100);
  }, [finishQuiz, stopQuizInterval]);

  const handleRemoteSnapshot = useCallback(
    (message: GameSnapshotMessage) => {
      if (roleRef.current !== "client") return;
      if (message.schemaVersion !== REALTIME_SCHEMA_VERSION) return;

      setDifficulty(message.difficulty);
      setSkinId(message.skinId);
      setHudPatch({
        phase: message.phase,
        score: message.score,
        length: message.length,
        revivalsRemaining: message.revivalsRemaining,
        revivalsTotal: message.revivalsTotal,
      });

      latestSnapshotRef.current = message.render;
      rendererRef.current?.render(message.render);
    },
    [setDifficulty, setHudPatch, setSkinId],
  );

  const handleRemoteInput = useCallback((message: PlayerInputMessage) => {
    if (roleRef.current !== "host") return;
    if (message.schemaVersion !== REALTIME_SCHEMA_VERSION) return;
    engineRef.current?.queueDirection(message.direction);
  }, []);

  const handleRemoteCommand = useCallback((message: ClientCommandMessage) => {
    if (roleRef.current !== "host") return;
    if (message.schemaVersion !== REALTIME_SCHEMA_VERSION) return;
    if (message.kind === "START_GAME") {
      engineRef.current?.start();
    }
  }, []);

  const realtime = useRealtimeRoom({
    onSnapshot: handleRemoteSnapshot,
    onInput: handleRemoteInput,
    onCommand: handleRemoteCommand,
  });
  const {
    status,
    error,
    isConfigured,
    sessionId,
    connectedRoom,
    connectedRole,
    connect,
    disconnect,
    publishSnapshot,
    publishInput,
    publishCommand,
  } = realtime;

  const statusRef = useRef(status);
  const connectedRoomRef = useRef(connectedRoom);
  const lastSnapshotSentAtRef = useRef(0);
  const snapshotSequenceRef = useRef(1);

  useEffect(() => {
    difficultyRef.current = difficulty;
    quizEngineRef.current.setDifficulty(difficulty);
  }, [difficulty]);

  useEffect(() => {
    skinIdRef.current = skinId;
    engineRef.current?.setSkin(skinId);
  }, [skinId]);

  useEffect(() => {
    roleRef.current = roomForm.role;
  }, [roomForm.role]);

  useEffect(() => {
    statusRef.current = status;
    connectedRoomRef.current = connectedRoom;
  }, [connectedRoom, status]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const publishHostSnapshot = useCallback(
    (snapshot: RenderSnapshot, force = false) => {
      if (roleRef.current !== "host") return;
      if (statusRef.current !== "connected" || !connectedRoomRef.current) return;

      const now = performance.now();
      if (!force && now - lastSnapshotSentAtRef.current < 75) return;
      lastSnapshotSentAtRef.current = now;

      const hudNow = hudRef.current;
      void publishSnapshot({
        schemaVersion: REALTIME_SCHEMA_VERSION,
        roomCode: connectedRoomRef.current,
        hostId: sessionId,
        sequence: snapshotSequenceRef.current++,
        phase: hudNow.phase,
        difficulty: difficultyRef.current,
        skinId: skinIdRef.current,
        score: hudNow.score,
        length: hudNow.length,
        revivalsRemaining: hudNow.revivalsRemaining,
        revivalsTotal: hudNow.revivalsTotal,
        render: snapshot,
        sentAt: Date.now(),
      });
    },
    [publishSnapshot, sessionId],
  );

  const renderEmptyBoard = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const snapshot = createEmptySnapshot(difficultyRef.current, skinIdRef.current);
    latestSnapshotRef.current = snapshot;
    renderer.render(snapshot);
    publishHostSnapshot(snapshot, true);
  }, [publishHostSnapshot]);

  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new CanvasRenderer(canvasRef.current);
    renderEmptyBoard();

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
      rendererRef.current = null;
    };
  }, [renderEmptyBoard]);

  useEffect(() => {
    if (!rendererRef.current || roomForm.role !== "host") {
      engineRef.current?.dispose();
      engineRef.current = null;
      setHudPatch(INITIAL_HUD);
      renderEmptyBoard();
      return;
    }

    engineRef.current?.dispose();
    const engine = new GameEngine({
      difficulty,
      cellSizePx: CELL_SIZE_PX,
      skinId: skinIdRef.current,
      inputTarget: window,
      onRenderSnapshot: (snapshot) => {
        latestSnapshotRef.current = snapshot;
        rendererRef.current?.render(snapshot);
        publishHostSnapshot(snapshot);
      },
      onScoreChange: (score) => setHudPatch({ score }),
      onLengthChange: (length) => setHudPatch({ length }),
      onPhaseChange: (phase) => setHudPatch({ phase }),
      onRevivalsChange: (revivalsRemaining, revivalsTotal) =>
        setHudPatch({ revivalsRemaining, revivalsTotal }),
      onQuizRequired: showQuiz,
      onRevivalFailed: () => {
        // The engine has already moved into GAME_OVER and rendered the final frame.
      },
    });

    engineRef.current = engine;
    engine.attachInput();
    setHudPatch(INITIAL_HUD);
    renderEmptyBoard();

    return () => {
      if (engineRef.current === engine) {
        engineRef.current = null;
      }
      engine.dispose();
    };
  }, [
    difficulty,
    publishHostSnapshot,
    renderEmptyBoard,
    roomForm.role,
    setHudPatch,
    showQuiz,
  ]);

  useEffect(() => {
    if (roomForm.role !== "client") return;

    const input = new InputController(window);
    const unsubscribe = input.onDirection((direction) => {
      if (status !== "connected" || !connectedRoom) return;
      void publishInput({
        schemaVersion: REALTIME_SCHEMA_VERSION,
        roomCode: connectedRoom,
        playerId: sessionId,
        direction,
        sentAt: Date.now(),
      });
    });

    input.attach();
    return () => {
      unsubscribe();
      input.detach();
    };
  }, [connectedRoom, publishInput, roomForm.role, sessionId, status]);

  const handleStart = useCallback(() => {
    if (roleRef.current === "client") {
      if (status !== "connected" || !connectedRoom) return;
      void publishCommand({
        schemaVersion: REALTIME_SCHEMA_VERSION,
        roomCode: connectedRoom,
        playerId: sessionId,
        kind: "START_GAME",
        sentAt: Date.now(),
      });
      return;
    }

    engineRef.current?.start();
    if (latestSnapshotRef.current) {
      publishHostSnapshot(latestSnapshotRef.current, true);
    }
  }, [connectedRoom, publishCommand, publishHostSnapshot, sessionId, status]);

  useEffect(() => {
    const handleSpace = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (isEditableTarget(event.target)) return;
      if (hudRef.current.phase === "PLAYING" || hudRef.current.phase === "REVIVING") {
        return;
      }
      event.preventDefault();
      handleStart();
    };

    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, [handleStart]);

  useEffect(() => {
    return () => {
      stopQuizInterval();
      if (quizResolutionRef.current !== null) {
        window.clearTimeout(quizResolutionRef.current);
      }
    };
  }, [stopQuizInterval]);

  const handleQuizAnswerChange = useCallback((answerText: string) => {
    setQuiz((prev) => ({
      ...prev,
      answerText,
      feedback: "",
    }));
  }, []);

  const handleQuizSubmit = useCallback(() => {
    const question = currentQuizRef.current;
    if (!question) return;

    const raw = Number.parseInt(quiz.answerText, 10);
    if (!Number.isInteger(raw)) {
      setQuiz((prev) => ({
        ...prev,
        feedback: "Enter an integer.",
        feedbackOk: false,
      }));
      return;
    }

    if (quizEngineRef.current.checkAnswer(raw, question)) {
      setQuiz((prev) => ({
        ...prev,
        feedback: "Correct. Revival granted.",
        feedbackOk: true,
      }));
      finishQuiz(true, 600);
    } else {
      setQuiz((prev) => ({
        ...prev,
        feedback: `Wrong. Answer: ${question.answer}`,
        feedbackOk: false,
      }));
      finishQuiz(false, 1_200);
    }
  }, [finishQuiz, quiz.answerText]);

  const handleConnect = useCallback(() => {
    const roomCode = normalizeRoomCode(roomForm.roomCode);
    setRoomForm((prev) => ({ ...prev, roomCode }));
    void connect(roomCode, roomForm.role);
  }, [connect, roomForm.role, roomForm.roomCode]);

  const handleRoomCodeChange = useCallback((roomCode: string) => {
    setRoomForm((prev) => ({
      ...prev,
      roomCode: normalizeRoomCode(roomCode),
    }));
  }, []);

  const handleRoleChange = useCallback((role: RealtimeRole) => {
    setRoomForm((prev) => ({ ...prev, role }));
  }, []);

  const readOnlyByHost = roomForm.role === "client" && status === "connected";

  return (
    <div className="app-shell">
      <div className="app-shell__stack">
        <Hud
          hud={hud}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          theme={theme}
        />

        <RealtimePanel
          connectedRole={connectedRole}
          connectedRoom={connectedRoom}
          error={error}
          form={roomForm}
          isConfigured={isConfigured}
          onConnect={handleConnect}
          onDisconnect={() => void disconnect()}
          onRoleChange={handleRoleChange}
          onRoomCodeChange={handleRoomCodeChange}
          status={status}
        />

        <DifficultyToolbar
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          readOnly={readOnlyByHost}
        />

        <SkinSelector
          onSkinChange={setSkinId}
          readOnly={readOnlyByHost}
          skinId={skinId}
        />

        <GameStage
          canvasRef={canvasRef}
          difficulty={difficulty}
          onStart={handleStart}
          phase={hud.phase}
          role={roomForm.role}
        />
      </div>

      <QuizModal
        onAnswerChange={handleQuizAnswerChange}
        onSubmit={handleQuizSubmit}
        state={quiz}
      />
    </div>
  );
}
