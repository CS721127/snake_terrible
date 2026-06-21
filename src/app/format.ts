export function formatBin(n: number): string {
  return `0b${(n & 0xff).toString(2).padStart(8, "0")}`;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** 结算框里展示"这一局花了多久"，保留到 0.1 秒，比 HUD 倒计时的整秒粒度更精细。 */
export function formatDuration(ms: number): string {
  // 先按 0.1 秒精度整体四舍五入，再拆分分钟/秒，避免临界值（如 59.96s）
  // 被 toFixed 单独舍入成 "X:60.0" 这种不进位的显示错误。
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
