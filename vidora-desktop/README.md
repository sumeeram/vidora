# Vidora

Local-first YouTube downloader for Windows. Built with Tauri 2, React, DaisyUI, and bundled `yt-dlp` + `ffmpeg`.

Use it only for media you have the right to download.

## Prerequisites

- Node.js 20+
- Rust stable (1.85+; GitHub Actions uses the latest stable toolchain)
- WebView2 (Windows)

## First run

```bash
cd vidora-desktop
npm install
npm run setup
npm run tauri dev
```

`npm run setup` downloads Windows `yt-dlp`, `ffmpeg`, and `ffprobe` into `src-tauri/binaries/`.

## Production build

Unsigned local installers (no updater artifacts):

```bash
npm run setup
npm run tauri build
```

Installers land in `src-tauri/target/release/bundle/`.

`tauri dev` and unsigned `tauri build` do not need signing keys. Updater artifacts are created only in CI (see `src-tauri/tauri.ci.conf.json`).

To produce signed updater artifacts locally (same as CI):

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $HOME/.tauri/vidora.key -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""  # or your key password
npm run tauri build -- --config src-tauri/tauri.ci.conf.json
```

## Releases and auto-update

Tagged versions (`v0.2.0`, …) run [`.github/workflows/release.yml`](../.github/workflows/release.yml) on `windows-latest`. That workflow downloads sidecars (`npm run setup`), builds NSIS + MSI, and publishes a GitHub Release including `latest.json` for the in-app updater.

The installed app checks `https://github.com/sumeeram/vidora/releases/latest/download/latest.json` on launch (production only, non-blocking) and from **Settings → App updates**.

**Before the first tag:** generate your own updater keypair and replace the `plugins.updater.pubkey` value in `src-tauri/tauri.conf.json`. The public key currently in that file is a placeholder from this setup; a release signed with a different private key will not verify against it. Do not ship an installer until the committed public key matches the private key stored in GitHub Secrets.

### 1. Generate updater signing keys

From `vidora-desktop` (never commit the private key):

```bash
npx tauri signer generate --ci -w "$HOME/.tauri/vidora.key"
```

The command prints a public key string. Paste it into `src-tauri/tauri.conf.json` at `plugins.updater.pubkey` (replace the existing value), commit that change, then keep `$HOME/.tauri/vidora.key` only in a password manager.

If you set a password when generating the key, you will need it as `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. An empty password is allowed.

Updater signatures are **not** Windows Authenticode. They only prove GitHub Release artifacts were signed with your Tauri key.

### 2. GitHub Actions secrets

Repo **Settings → Secrets and variables → Actions**. Exact names:

| Secret | Required | Value |
| --- | --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | **Yes** (release workflow) | Full contents of the private key file (`vidora.key`) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Only if the key has a password | Key password; omit or leave empty if none |
| `GITHUB_TOKEN` | No | Automatic for GitHub Actions |

If release upload fails with “Resource not accessible by integration”, set **Settings → Actions → General → Workflow permissions** to **Read and write**.

### 3. Bump versions, then tag

Keep these three versions identical (semver **without** a leading `v`):

- `vidora-desktop/package.json` → `version`
- `vidora-desktop/src-tauri/tauri.conf.json` → `version`
- `vidora-desktop/src-tauri/Cargo.toml` → `[package] version`

`npm version` only updates `package.json`. Prefer:

```bash
cd vidora-desktop
npm version 0.2.0 --no-git-tag-version
# also set 0.2.0 in src-tauri/tauri.conf.json and src-tauri/Cargo.toml
cd ..
git add vidora-desktop/package.json vidora-desktop/package-lock.json \
  vidora-desktop/src-tauri/tauri.conf.json vidora-desktop/src-tauri/Cargo.toml
git commit -m "release: v0.2.0"
git tag v0.2.0
git push origin main
git push origin v0.2.0
```

The workflow compares the tag (`v0.2.0`) to those three files and fails if they drift.

After the release is published, point the marketing site at it (Vercel env `VITE_DOWNLOAD_URL`, default in `vidora-web/.env.example`):

```
https://github.com/sumeeram/vidora/releases/latest
```

### 4. Optional Windows code signing (Authenticode)

Not required for GitHub Releases or in-app updates. Without an OV/EV certificate, Windows SmartScreen may warn on first launch.

To add later (do not enable until you have a real cert — a missing cert will fail the build):

1. Obtain an Authenticode certificate.
2. Import it on the `windows-latest` runner in the release workflow.
3. Set `bundle.windows.certificateThumbprint`, `digestAlgorithm`, and `timestampUrl` in `tauri.conf.json` as described in [Tauri Windows code signing](https://v2.tauri.app/distribute/sign/windows/).

Azure Trusted Signing is another option documented on that page. Do not put certificate files or passwords in the repo.
