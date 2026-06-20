import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClientCommandMessage,
  CommandListener,
  GameSnapshotMessage,
  GameTransport,
  InputListener,
  PlayerInputMessage,
  RealtimeRoomConfig,
  SnapshotListener,
} from "./types";

type RealtimeChannelHandle = ReturnType<SupabaseClient["channel"]>;

const SNAPSHOT_EVENT = "game:snapshot";
const INPUT_EVENT = "game:input";
const COMMAND_EVENT = "game:command";

export function createSupabaseRealtimeTransport(
  client: SupabaseClient | null,
): GameTransport {
  let channel: RealtimeChannelHandle | null = null;

  const snapshotListeners = new Set<SnapshotListener>();
  const inputListeners = new Set<InputListener>();
  const commandListeners = new Set<CommandListener>();

  const ensureChannel = (): RealtimeChannelHandle => {
    if (!channel) {
      throw new Error("Realtime channel is not connected.");
    }
    return channel;
  };

  return {
    isConfigured: client !== null,

    async connect(config: RealtimeRoomConfig): Promise<void> {
      if (!client) {
        throw new Error("Supabase env is missing.");
      }

      if (channel) {
        await client.removeChannel(channel);
      }

      channel = client.channel(`complement-snake:${config.roomCode}`, {
        config: {
          broadcast: { self: false },
          presence: { key: `${config.role}:${crypto.randomUUID()}` },
        },
      });

      channel.on("broadcast", { event: SNAPSHOT_EVENT }, ({ payload }) => {
        for (const listener of snapshotListeners) {
          listener(payload as GameSnapshotMessage);
        }
      });

      channel.on("broadcast", { event: INPUT_EVENT }, ({ payload }) => {
        for (const listener of inputListeners) {
          listener(payload as PlayerInputMessage);
        }
      });

      channel.on("broadcast", { event: COMMAND_EVENT }, ({ payload }) => {
        for (const listener of commandListeners) {
          listener(payload as ClientCommandMessage);
        }
      });

      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error("Realtime subscribe timed out."));
        }, 10_000);

        ensureChannel().subscribe((status) => {
          if (status === "SUBSCRIBED") {
            window.clearTimeout(timeoutId);
            resolve();
            return;
          }

          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            window.clearTimeout(timeoutId);
            reject(new Error(`Realtime subscribe failed: ${status}`));
          }
        });
      });
    },

    async disconnect(): Promise<void> {
      if (!client || !channel) return;
      const previous = channel;
      channel = null;
      await client.removeChannel(previous);
    },

    async publishSnapshot(message: GameSnapshotMessage): Promise<void> {
      await ensureChannel().send({
        type: "broadcast",
        event: SNAPSHOT_EVENT,
        payload: message,
      });
    },

    async publishInput(message: PlayerInputMessage): Promise<void> {
      await ensureChannel().send({
        type: "broadcast",
        event: INPUT_EVENT,
        payload: message,
      });
    },

    async publishCommand(message: ClientCommandMessage): Promise<void> {
      await ensureChannel().send({
        type: "broadcast",
        event: COMMAND_EVENT,
        payload: message,
      });
    },

    onSnapshot(listener: SnapshotListener): () => void {
      snapshotListeners.add(listener);
      return () => snapshotListeners.delete(listener);
    },

    onInput(listener: InputListener): () => void {
      inputListeners.add(listener);
      return () => inputListeners.delete(listener);
    },

    onCommand(listener: CommandListener): () => void {
      commandListeners.add(listener);
      return () => commandListeners.delete(listener);
    },
  };
}

