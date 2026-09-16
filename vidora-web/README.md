# Vidora website

Marketing site for the Vidora Windows downloader. Deployed on Vercel. The installer is **not** hosted here — it lives on [GitHub Releases](https://github.com/sumeeram/vidora/releases/latest).

## Local

```bash
cd vidora-web
npm install
npm run dev
```

Copy `.env.example` to `.env` if you want to override the download URL:

```
VITE_DOWNLOAD_URL=https://github.com/sumeeram/vidora/releases/latest
```

That default is also baked in when the env var is unset, so the Download button always points at the latest GitHub Release page. After the first `v*` tag, you can optionally switch the env var to a direct NSIS asset URL (the filename includes the version and changes every release):

```
VITE_DOWNLOAD_URL=https://github.com/sumeeram/vidora/releases/latest/download/Vidora_0.1.0_x64-setup.exe
```

## Publish the Windows installer

Push a version tag from the repo root after bumping `vidora-desktop` versions (see `vidora-desktop/README.md`):

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions builds the NSIS/MSI on `windows-latest` and attaches them to the GitHub Release. No manual upload is required.

## Deploy on Vercel

1. Push this folder (or the parent repo) to GitHub.
2. Import the project in Vercel.
3. Set **Root Directory** to `vidora-web` if the repo contains more than this site.
4. Framework: Vite. Build: `npm run build`. Output: `dist`.
5. Optional: set `VITE_DOWNLOAD_URL` if you do not want the built-in GitHub Releases URL.
6. Deploy. After changing the env var, redeploy so Vite can bake it into the build.
