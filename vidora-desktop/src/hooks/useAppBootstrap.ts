import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { api } from "../lib/api";
import { checkForAppUpdate, installAppUpdate } from "../lib/updater";
import { useApp } from "../store/app";
import { useTheme } from "../store/theme";
import type { Job } from "../types";

export function useAppBootstrap() {
  const setSettings = useApp((s) => s.setSettings);
  const setSidecar = useApp((s) => s.setSidecar);
  const setQueue = useApp((s) => s.setQueue);
  const setHistory = useApp((s) => s.setHistory);
  const setFavorites = useApp((s) => s.setFavorites);

  useEffect(() => {
    let unlistenQueue: (() => void) | undefined;
    let unlistenHistory: (() => void) | undefined;

    async function boot() {
      const [settings, sidecar, queue, history, favorites] = await Promise.all([
        api.getSettings(),
        api.sidecarStatus(),
        api.getQueue(),
        api.getHistory(),
        api.getFavorites(),
      ]);
      setSettings(settings);
      if (settings.theme === "vidora-dark" || settings.theme === "vidora-light") {
        useTheme.getState().setTheme(settings.theme);
      }
      setSidecar(sidecar);
      setQueue(queue);
      setHistory(history);
      setFavorites(favorites);

      if (!(await isPermissionGranted())) {
        await requestPermission();
      }

      unlistenQueue = await listen<Job[]>("queue:update", (event) => {
        setQueue(event.payload);
      });
      unlistenHistory = await listen("history:update", async () => {
        setHistory(await api.getHistory());
      });

      if (!import.meta.env.DEV) {
        try {
          const update = await checkForAppUpdate();
          if (update) {
            useApp.getState().pushToast({
              title: `Vidora ${update.version} is available`,
              body: "Install now, or check Settings later.",
              actionLabel: "Install",
              onAction: () => {
                void installAppUpdate(update).catch((err) => {
                  useApp.getState().pushToast({
                    title: "Update failed",
                    body: String(err),
                  });
                });
              },
            });
          }
        } catch (err) {
          console.warn("Launch update check skipped", err);
        }
      }
    }

    void boot().catch((err) => {
      console.error(err);
    });

    return () => {
      unlistenQueue?.();
      unlistenHistory?.();
    };
  }, [setFavorites, setHistory, setQueue, setSettings, setSidecar]);
}
