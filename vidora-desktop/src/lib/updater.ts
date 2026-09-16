import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";

export type { Update };

export type UpdateProgress = {
  downloaded: number;
  contentLength: number | null;
  percent: number | null;
};

export async function getAppVersion(): Promise<string | null> {
  try {
    return await getVersion();
  } catch (err) {
    console.warn("Could not read app version", err);
    return null;
  }
}

export async function checkForAppUpdate(): Promise<Update | null> {
  return await check();
}

export async function installAppUpdate(
  update: Update,
  onProgress?: (progress: UpdateProgress) => void,
): Promise<void> {
  let downloaded = 0;
  let contentLength: number | null = null;

  await update.downloadAndInstall((event: DownloadEvent) => {
    switch (event.event) {
      case "Started":
        contentLength = event.data.contentLength ?? null;
        downloaded = 0;
        onProgress?.({ downloaded, contentLength, percent: contentLength ? 0 : null });
        break;
      case "Progress":
        downloaded += event.data.chunkLength;
        onProgress?.({
          downloaded,
          contentLength,
          percent: contentLength ? Math.min(100, Math.round((downloaded / contentLength) * 100)) : null,
        });
        break;
      case "Finished":
        onProgress?.({
          downloaded,
          contentLength,
          percent: 100,
        });
        break;
    }
  });

  try {
    await relaunch();
  } catch (err) {
    // Windows installers exit the app during install; relaunch is best-effort.
    console.warn("Relaunch after update skipped", err);
  }
}
