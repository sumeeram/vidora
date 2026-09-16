import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { extractYoutubeUrl } from "../lib/format";
import { useApp } from "../store/app";

export function useClipboardWatch() {
  const navigate = useNavigate();
  const clipboardWatch = useApp((s) => s.settings.clipboardWatch);
  const clipboardUnfocused = useApp((s) => s.settings.clipboardUnfocused);
  const pushToast = useApp((s) => s.pushToast);
  const last = useRef("");

  useEffect(() => {
    if (!clipboardWatch) return;
    const tick = async () => {
      if (!clipboardUnfocused && document.hidden) return;
      try {
        const text = await readText();
        const url = extractYoutubeUrl(text ?? "");
        if (!url || url === last.current) return;
        last.current = url;
        pushToast({
          title: "YouTube link detected",
          body: url,
          actionLabel: "Use URL",
          onAction: () => {
            useApp.getState().setPendingUrl(url);
            navigate("/");
          },
        });
      } catch {
        // clipboard permission or empty
      }
    };
    const id = window.setInterval(tick, 1800);
    void tick();
    return () => window.clearInterval(id);
  }, [clipboardWatch, clipboardUnfocused, pushToast, navigate]);
}
