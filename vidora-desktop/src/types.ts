export type JobStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export interface FormatSpec {
  id: string;
  label: string;
  kind: "audio" | "video" | "custom" | string;
  selector: string;
  audioExt?: string | null;
}

export interface JobOptions {
  outputDir: string;
  filenameTemplate: string;
  rateLimit: string;
  trimStart: string;
  trimEnd: string;
  subtitles: boolean;
  autoSubs: boolean;
  embedChapters: boolean;
  embedThumbnail: boolean;
  noPlaylist: boolean;
}

export interface Job {
  id: string;
  url: string;
  title: string;
  thumbnail?: string | null;
  channel?: string | null;
  videoId?: string | null;
  format: FormatSpec;
  status: JobStatus;
  progress: number;
  speed?: string | null;
  eta?: string | null;
  error?: string | null;
  outputPath?: string | null;
  options: JobOptions;
  addedAt: string;
}

export interface FormatInfo {
  id: string;
  label: string;
  ext: string;
  height?: number | null;
  fps?: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  filesize?: number | null;
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
  channel?: string | null;
}

export interface MediaInfo {
  kind: "video" | "playlist" | string;
  id: string;
  title: string;
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
  channel?: string | null;
  formats: FormatInfo[];
  entries: PlaylistEntry[];
}

export interface Settings {
  outputDir: string;
  concurrency: number;
  rateLimit: string;
  filenameTemplate: string;
  theme: string;
  clipboardWatch: boolean;
  clipboardUnfocused: boolean;
  embedChapters: boolean;
  embedThumbnail: boolean;
  writeSubs: boolean;
  writeAutoSubs: boolean;
}

export interface HistoryItem {
  id: string;
  videoId?: string | null;
  title: string;
  channel?: string | null;
  thumbnail?: string | null;
  url: string;
  formatLabel?: string | null;
  filepath?: string | null;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  videoId?: string | null;
  title: string;
  channel?: string | null;
  thumbnail?: string | null;
  url: string;
  createdAt: string;
}

export interface SidecarStatus {
  ready: boolean;
  ytDlp?: string | null;
  ffmpeg?: string | null;
  message: string;
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const FORMAT_PRESETS: FormatSpec[] = [
  { id: "mp3", label: "MP3", kind: "audio", selector: "", audioExt: "mp3" },
  { id: "m4a", label: "M4A", kind: "audio", selector: "", audioExt: "m4a" },
  { id: "opus", label: "Opus", kind: "audio", selector: "", audioExt: "opus" },
  {
    id: "360",
    label: "360p",
    kind: "video",
    selector: "bv*[height<=360]+ba/b[height<=360]",
  },
  {
    id: "720",
    label: "720p",
    kind: "video",
    selector: "bv*[height<=720]+ba/b[height<=720]",
  },
  {
    id: "1080",
    label: "1080p",
    kind: "video",
    selector: "bv*[height<=1080]+ba/b[height<=1080]",
  },
  {
    id: "1440",
    label: "1440p",
    kind: "video",
    selector: "bv*[height<=1440]+ba/b[height<=1440]",
  },
  {
    id: "2160",
    label: "4K",
    kind: "video",
    selector: "bv*[height<=2160]+ba/b[height<=2160]",
  },
  { id: "best", label: "Best", kind: "video", selector: "bv*+ba/b" },
];

export function emptyOptions(settings?: Partial<Settings>): JobOptions {
  return {
    outputDir: settings?.outputDir ?? "",
    filenameTemplate: settings?.filenameTemplate ?? "%(title)s [%(id)s].%(ext)s",
    rateLimit: settings?.rateLimit ?? "",
    trimStart: "",
    trimEnd: "",
    subtitles: settings?.writeSubs ?? false,
    autoSubs: settings?.writeAutoSubs ?? false,
    embedChapters: settings?.embedChapters ?? true,
    embedThumbnail: settings?.embedThumbnail ?? true,
    noPlaylist: true,
  };
}
