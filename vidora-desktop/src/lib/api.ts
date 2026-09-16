import { invoke } from "@tauri-apps/api/core";
import type {
  FavoriteItem,
  HistoryItem,
  Job,
  JobOptions,
  FormatSpec,
  MediaInfo,
  Settings,
  SidecarStatus,
} from "../types";

export interface EnqueueShape {
  url: string;
  title: string;
  thumbnail?: string | null;
  channel?: string | null;
  videoId?: string | null;
  format: FormatSpec;
  options: JobOptions;
}

export const api = {
  getSettings: () => invoke<Settings>("get_settings"),
  saveSettings: (settings: Settings) => invoke<Settings>("save_settings", { settings }),
  sidecarStatus: () => invoke<SidecarStatus>("sidecar_status"),
  fetchInfo: (url: string) => invoke<MediaInfo>("fetch_info", { url }),
  enqueue: (request: EnqueueShape) => invoke<Job>("enqueue", { request }),
  enqueueBatch: (requests: EnqueueShape[]) =>
    invoke<Job[]>("enqueue_batch", { requests }),
  getQueue: () => invoke<Job[]>("get_queue"),
  pauseJob: (id: string) => invoke<void>("pause_job", { id }),
  resumeJob: (id: string) => invoke<void>("resume_job", { id }),
  cancelJob: (id: string) => invoke<void>("cancel_job", { id }),
  retryJob: (id: string) => invoke<void>("retry_job", { id }),
  reorderQueue: (from: number, to: number) =>
    invoke<void>("reorder_queue", { from, to }),
  getHistory: () => invoke<HistoryItem[]>("get_history"),
  clearHistory: () => invoke<void>("clear_history"),
  getFavorites: () => invoke<FavoriteItem[]>("get_favorites"),
  toggleFavorite: (payload: {
    url: string;
    title: string;
    thumbnail?: string | null;
    channel?: string | null;
    videoId?: string | null;
  }) => invoke<boolean>("toggle_favorite", payload),
  isFavorite: (url: string, videoId?: string | null) =>
    invoke<boolean>("is_favorite", { url, videoId }),
  updateYtdlp: () => invoke<string>("update_ytdlp"),
  revealPath: (path: string) => invoke<void>("reveal_path", { path }),
  openPath: (path: string) => invoke<void>("open_path", { path }),
};
