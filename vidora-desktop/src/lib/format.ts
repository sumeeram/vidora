export function formatDuration(seconds?: number | null) {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return "";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export const YOUTUBE_RE =
  /https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i;

export function extractYoutubeUrl(text: string) {
  const match = text.match(YOUTUBE_RE);
  return match?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

export function extractYoutubeUrlFromDrop(data: DataTransfer | null) {
  if (!data) return null;
  const raw = [
    data.getData("text/uri-list"),
    data.getData("text/plain"),
    data.getData("text"),
    data.getData("text/html"),
  ]
    .filter(Boolean)
    .join("\n");
  return extractYoutubeUrl(raw);
}

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type DateFilter = "all" | "today" | "week" | "month";

export function matchesDateFilter(iso: string | null | undefined, filter: DateFilter) {
  if (filter === "all" || !iso) return filter === "all";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = Date.now();
  if (filter === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return date.getTime() >= start.getTime();
  }
  const days = filter === "week" ? 7 : 30;
  return now - date.getTime() <= days * 86_400_000;
}
