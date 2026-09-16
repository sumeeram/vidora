const DEFAULT_DOWNLOAD_URL = "https://github.com/sumeeram/vidora/releases/latest";

export function getDownloadUrl(): string {
  return (import.meta.env.VITE_DOWNLOAD_URL ?? DEFAULT_DOWNLOAD_URL).trim() || DEFAULT_DOWNLOAD_URL;
}

export function hasInstaller(): boolean {
  return getDownloadUrl().length > 0;
}
