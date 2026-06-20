import { useCallback, useEffect, useRef, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { createSupabaseRealtimeTransport } from "@/realtime/supabaseRealtimeTransport";
import type {
  ClientCommandMessage,
  CommandListener,
  GameSnapshotMessage,
  GameTransport,
  InputListener,
  PlayerInputMessage,
  RealtimeRole,
  SnapshotListener,
  TransportStatus,
} from "@/realtime/types";

interface RealtimeCallbacks {
  readonly onSnapshot: SnapshotListener;
  readonly onInput: InputListener;
  readonly onCommand: CommandListener;
}

export interface RealtimeRoomState {
  readonly status: TransportStatus;
  readonly error: string | null;
  readonly isConfigured: boolean;
  readonly sessionId: string;
  readonly connectedRoom: string | null;
  readonly connectedRole: RealtimeRole | null;
  connect: (roomCode: string, role: RealtimeRole) => Promise<boolean>;
  disconnect: () => Promise<void>;
  publishSnapshot: (message: GameSnapshotMessage) => Promise<void>;
  publishInput: (message: PlayerInputMessage) => Promise<void>;
  publishCommand: (message: ClientCommandMessage) => Promise<void>;
}

export function useRealtimeRoom(callbacks: RealtimeCallbacks): RealtimeRoomState {
  const [status, setStatus] = useState<TransportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [connectedRoom, setConnectedRoom] = useState<string | null>(null);
  const [connectedRole, setConnectedRole] = useState<RealtimeRole | null>(null);

  const callbacksRef = useRef(callbacks);
  const transportRef = useRef<GameTransport | null>(null);
  const unsubsRef = useRef<readonly (() => void)[]>([]);
  const sessionIdRef = useRef(`player-${crypto.randomUUID()}`);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const cleanupSubscriptions = useCallback(() => {
    for (const unsub of unsubsRef.current) {
      unsub();
    }
    unsubsRef.current = [];
  }, []);

  const disconnect = useCallback(async () => {
    cleanupSubscriptions();
    const transport = transportRef.current;
    transportRef.current = null;
    if (transport) {
      await transport.disconnect();
    }
    setConnectedRoom(null);
    setConnectedRole(null);
    setStatus("idle");
  }, [cleanupSubscriptions]);

  const connect = useCallback(
    async (roomCode: string, role: RealtimeRole): Promise<boolean> => {
      if (!hasSupabaseConfig || !supabase) {
        setStatus("disabled");
        setError("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not configured.");
        return false;
      }

      setStatus("connecting");
      setError(null);

      try {
        await disconnect();

        const transport = createSupabaseRealtimeTransport(supabase);
        unsubsRef.current = [
          transport.onSnapshot((message) => callbacksRef.current.onSnapshot(message)),
          transport.onInput((message) => callbacksRef.current.onInput(message)),
          transport.onCommand((message) => callbacksRef.current.onCommand(message)),
        ];

        await transport.connect({ roomCode, role });
        transportRef.current = transport;
        setConnectedRoom(roomCode);
        setConnectedRole(role);
        setStatus("connected");
        return true;
      } catch (err) {
        cleanupSubscriptions();
        transportRef.current = null;
        setConnectedRoom(null);
        setConnectedRole(null);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Realtime connection failed.");
        return false;
      }
    },
    [cleanupSubscriptions, disconnect],
  );

  const publishSnapshot = useCallback(async (message: GameSnapshotMessage) => {
    await transportRef.current?.publishSnapshot(message);
  }, []);

  const publishInput = useCallback(async (message: PlayerInputMessage) => {
    await transportRef.current?.publishInput(message);
  }, []);

  const publishCommand = useCallback(async (message: ClientCommandMessage) => {
    await transportRef.current?.publishCommand(message);
  }, []);

  useEffect(() => {
    return () => {
      cleanupSubscriptions();
      void transportRef.current?.disconnect();
      transportRef.current = null;
    };
  }, [cleanupSubscriptions]);

  return {
    status,
    error,
    isConfigured: hasSupabaseConfig,
    sessionId: sessionIdRef.current,
    connectedRoom,
    connectedRole,
    connect,
    disconnect,
    publishSnapshot,
    publishInput,
    publishCommand,
  };
}

