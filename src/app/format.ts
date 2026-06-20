export function formatDec(n: number): string {
  return String(n);
}

export function formatHex(n: number): string {
  return `0x${n.toString(16).toUpperCase().padStart(2, "0")}`;
}

export function formatBin(n: number): string {
  const width = Math.max(4, Math.ceil(n.toString(2).length / 4) * 4);
  return `0b${n.toString(2).padStart(width, "0")}`;
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

