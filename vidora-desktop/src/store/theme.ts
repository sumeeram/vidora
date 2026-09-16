import { create } from "zustand";

export type ThemeName = "vidora-dark" | "vidora-light";

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggle: () => void;
}

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("vidora-theme", theme);
}

const initial =
  (localStorage.getItem("vidora-theme") as ThemeName | null) ?? "vidora-dark";
applyTheme(initial);

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initial,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => {
    const next = get().theme === "vidora-dark" ? "vidora-light" : "vidora-dark";
    applyTheme(next);
    set({ theme: next });
  },
}));
