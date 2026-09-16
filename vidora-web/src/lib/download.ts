export function getDownloadUrl(): string {
  return (import.meta.env.VITE_DOWNLOAD_URL ?? "").trim();
}

export function hasInstaller(): boolean {
  return getDownloadUrl().length > 0;
}
