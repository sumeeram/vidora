import { FORMAT_PRESETS, emptyOptions, type FavoriteItem, type HistoryItem, type Job } from "../types";
import { useApp } from "../store/app";

export function shouldLoadBrowserDemo() {
  if (typeof window === "undefined") return false;
  if ("__TAURI_INTERNALS__" in window) return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export function applyBrowserDemo() {
  const options = emptyOptions({
    outputDir: "C:\\Users\\Demo\\Videos\\Vidora",
    filenameTemplate: "%(title)s [%(id)s].%(ext)s",
  });
  options.outputDir = "C:\\Users\\Demo\\Videos\\Vidora";

  const queue: Job[] = [
    {
      id: "q1",
      url: "https://www.youtube.com/watch?v=running",
      title: "Live set from the rooftop",
      channel: "North Room",
      thumbnail: null,
      videoId: "running",
      format: FORMAT_PRESETS[5],
      status: "running",
      progress: 42,
      speed: "4.2MiB/s",
      eta: "00:12",
      error: null,
      outputPath: null,
      options,
      addedAt: new Date().toISOString(),
    },
    {
      id: "q2",
      url: "https://www.youtube.com/watch?v=queued",
      title: "Interview: analog film stock",
      channel: "Frame Notes",
      thumbnail: null,
      videoId: "queued",
      format: FORMAT_PRESETS[4],
      status: "queued",
      progress: 0,
      speed: null,
      eta: null,
      error: null,
      outputPath: null,
      options,
      addedAt: new Date().toISOString(),
    },
    {
      id: "q3",
      url: "https://www.youtube.com/watch?v=failed",
      title: "Private video that failed",
      channel: "Archive",
      thumbnail: null,
      videoId: "failed",
      format: FORMAT_PRESETS[0],
      status: "failed",
      progress: 18,
      speed: null,
      eta: null,
      error: "Video unavailable",
      outputPath: null,
      options,
      addedAt: new Date().toISOString(),
    },
    {
      id: "q4",
      url: "https://www.youtube.com/watch?v=done",
      title: "Coastal hike — golden hour",
      channel: "Trail Cam",
      thumbnail: null,
      videoId: "done",
      format: FORMAT_PRESETS[5],
      status: "completed",
      progress: 100,
      speed: null,
      eta: null,
      error: null,
      outputPath: "C:\\Users\\Demo\\Videos\\Vidora\\coastal.mp4",
      options,
      addedAt: new Date().toISOString(),
    },
    {
      id: "q5",
      url: "https://www.youtube.com/watch?v=paused",
      title: "Paused lecture on color",
      channel: "Studio Lab",
      thumbnail: null,
      videoId: "paused",
      format: FORMAT_PRESETS[3],
      status: "paused",
      progress: 61,
      speed: null,
      eta: null,
      error: null,
      outputPath: null,
      options,
      addedAt: new Date().toISOString(),
    },
  ];

  const history: HistoryItem[] = [
    {
      id: "h1",
      videoId: "done",
      title: "Coastal hike — golden hour",
      channel: "Trail Cam",
      thumbnail: null,
      url: "https://www.youtube.com/watch?v=done",
      formatLabel: "1080p",
      filepath: "C:\\Users\\Demo\\Videos\\Vidora\\coastal.mp4",
      createdAt: new Date().toISOString(),
    },
    {
      id: "h2",
      videoId: "older",
      title: "Rain on the market roof",
      channel: "North Room",
      thumbnail: null,
      url: "https://www.youtube.com/watch?v=older",
      formatLabel: "MP3",
      filepath: "C:\\Users\\Demo\\Videos\\Vidora\\rain.mp3",
      createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    },
    {
      id: "h3",
      videoId: "month",
      title: "Workshop recap",
      channel: "Studio Lab",
      thumbnail: null,
      url: "https://www.youtube.com/watch?v=month",
      formatLabel: "720p",
      filepath: "C:\\Users\\Demo\\Videos\\Vidora\\workshop.mp4",
      createdAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    },
  ];

  const favorites: FavoriteItem[] = [
    {
      id: "f1",
      videoId: "done",
      title: "Coastal hike — golden hour",
      channel: "Trail Cam",
      thumbnail: null,
      url: "https://www.youtube.com/watch?v=done",
      createdAt: new Date().toISOString(),
    },
  ];

  const state = useApp.getState();
  state.setSettings({
    ...state.settings,
    outputDir: options.outputDir,
    concurrency: 2,
  });
  state.setSidecar({
    ready: true,
    ytDlp: "demo",
    ffmpeg: "demo",
    message: "Demo preview — Tauri APIs are mocked in the browser.",
  });
  state.setQueue(queue);
  state.setHistory(history);
  state.setFavorites(favorites);
}
