import { create } from "zustand";
import type { FavoriteItem, HistoryItem, Job, Settings, SidecarStatus, Toast } from "../types";

const defaultSettings: Settings = {
  outputDir: "",
  concurrency: 2,
  rateLimit: "",
  filenameTemplate: "%(title)s [%(id)s].%(ext)s",
  theme: "vidora-dark",
  clipboardWatch: true,
  clipboardUnfocused: false,
  embedChapters: true,
  embedThumbnail: true,
  writeSubs: false,
  writeAutoSubs: false,
};

interface AppState {
  settings: Settings;
  sidecar: SidecarStatus | null;
  queue: Job[];
  history: HistoryItem[];
  favorites: FavoriteItem[];
  toasts: Toast[];
  pendingUrl: string;
  setSettings: (settings: Settings) => void;
  setSidecar: (sidecar: SidecarStatus) => void;
  setQueue: (queue: Job[]) => void;
  setHistory: (history: HistoryItem[]) => void;
  setFavorites: (favorites: FavoriteItem[]) => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  setPendingUrl: (pendingUrl: string) => void;
}

export const useApp = create<AppState>((set) => ({
  settings: defaultSettings,
  sidecar: null,
  queue: [],
  history: [],
  favorites: [],
  toasts: [],
  pendingUrl: "",
  setSettings: (settings) => set({ settings }),
  setSidecar: (sidecar) => set({ sidecar }),
  setQueue: (queue) => set({ queue }),
  setHistory: (history) => set({ history }),
  setFavorites: (favorites) => set({ favorites }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }].slice(-4),
    })),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setPendingUrl: (pendingUrl) => set({ pendingUrl }),
}));
