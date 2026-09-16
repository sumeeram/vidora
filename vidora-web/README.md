# Vidora website

Marketing site for the Vidora Windows downloader. Deployed on Vercel. The installer is **not** hosted here — it lives on GitHub Releases.

## Local

```bash
cd vidora-web
npm install
npm run dev
```

Copy `.env.example` to `.env` and set the installer URL when you have a release:

```
VITE_DOWNLOAD_URL=https://github.com/YOUR_USER/YOUR_REPO/releases/latest/download/Vidora_0.1.0_x64-setup.exe
```

If the env var is empty, the Download button shows “Installer coming soon”.

## Publish the Windows installer

From the desktop app folder:

```bash
cd vidora
npm run setup
npm run tauri build
```

Upload the NSIS/MSI from `vidora/src-tauri/target/release/bundle/` to a GitHub Release. Copy that asset URL into `VITE_DOWNLOAD_URL`.

## Deploy on Vercel

1. Push this folder (or the parent repo) to GitHub.
2. Import the project in Vercel.
3. Set **Root Directory** to `vidora-web` if the repo contains more than this site.
4. Framework: Vite. Build: `npm run build`. Output: `dist`.
5. Add environment variable `VITE_DOWNLOAD_URL` (after the first release).
6. Deploy. After changing the env var, redeploy so Vite can bake it into the build.
