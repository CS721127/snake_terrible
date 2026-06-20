export function formatDec(n: number): string {
  return String(n);
}

export function formatHex(n: number): string {
  return `0x${(n & 0xffff).toString(16).toUpperCase().padStart(4, "0")}`;
}

export function formatBin(n: number): string {
  return `0b${(n & 0xffff).toString(2).padStart(16, "0")}`;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function normalizeRoomCode(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 24);

  return normalized || "ROOM-01";
}
