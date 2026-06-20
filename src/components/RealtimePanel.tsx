import type { RoomFormState } from "@/app/types";
import type { RealtimeRole, TransportStatus } from "@/realtime/types";

interface RealtimePanelProps {
  readonly form: RoomFormState;
  readonly status: TransportStatus;
  readonly error: string | null;
  readonly isConfigured: boolean;
  readonly connectedRoom: string | null;
  readonly connectedRole: RealtimeRole | null;
  readonly onRoomCodeChange: (roomCode: string) => void;
  readonly onRoleChange: (role: RealtimeRole) => void;
  readonly onConnect: () => void;
  readonly onDisconnect: () => void;
}

const STATUS_LABEL: Record<TransportStatus, string> = {
  idle: "LOCAL",
  disabled: "NO_ENV",
  connecting: "SYNCING",
  connected: "LIVE",
  error: "ERROR",
};

export function RealtimePanel({
  form,
  status,
  error,
  isConfigured,
  connectedRoom,
  connectedRole,
  onRoomCodeChange,
  onRoleChange,
  onConnect,
  onDisconnect,
}: RealtimePanelProps): JSX.Element {
  const locked = status === "connecting" || status === "connected";
  const connected = status === "connected";

  return (
    <section className="realtime-panel" aria-label="Realtime room">
      <div className="realtime-panel__group">
        <span className="realtime-panel__label">ROOM</span>
        <input
          className="realtime-panel__input"
          disabled={locked}
          maxLength={24}
          onChange={(event) => onRoomCodeChange(event.target.value)}
          spellCheck={false}
          value={form.roomCode}
        />
      </div>

      <div className="realtime-panel__group">
        <span className="realtime-panel__label">ROLE</span>
        <div className="role-switch" role="tablist">
          <RoleButton
            active={form.role === "host"}
            disabled={locked}
            label="HOST"
            onClick={() => onRoleChange("host")}
          />
          <RoleButton
            active={form.role === "client"}
            disabled={locked}
            label="CLIENT"
            onClick={() => onRoleChange("client")}
          />
        </div>
      </div>

      <div className="realtime-panel__status">
        <span className={`status-chip status-chip--${status}`}>{STATUS_LABEL[status]}</span>
        <span className="realtime-panel__meta">
          {connected && connectedRoom && connectedRole
            ? `${connectedRole.toUpperCase()} / ${connectedRoom}`
            : isConfigured
              ? "SUPABASE_READY"
              : "SUPABASE_ENV_MISSING"}
        </span>
      </div>

      <button
        className="realtime-panel__button"
        disabled={status === "connecting"}
        onClick={connected ? onDisconnect : onConnect}
        type="button"
      >
        {connected ? "DISCONNECT" : "CONNECT"}
      </button>

      {error ? <p className="realtime-panel__error">{error}</p> : null}
    </section>
  );
}

interface RoleButtonProps {
  readonly active: boolean;
  readonly disabled: boolean;
  readonly label: string;
  readonly onClick: () => void;
}

function RoleButton({ active, disabled, label, onClick }: RoleButtonProps): JSX.Element {
  return (
    <button
      aria-selected={active}
      className="role-switch__button"
      disabled={disabled}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {label}
    </button>
  );
}

