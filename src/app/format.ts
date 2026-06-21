export function formatBin(n: number): string {
  return `0b${(n & 0xff).toString(2).padStart(8, "0")}`;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Format run duration for the summary modal to 0.1s, finer than HUD countdown whole seconds. */
export function formatDuration(ms: number): string {
  // Round to 0.1s first, then split minutes/seconds, avoiding edge cases (e.g. 59.96s)
  // displaying as "X:60.0" without carrying to the next minute.
  const totalTenths = Math.round(Math.max(0, ms) / 100);
  const minutes = Math.floor(totalTenths / 600);
  const remainderTenths = totalTenths % 600;
  const seconds = remainderTenths / 10;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
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
