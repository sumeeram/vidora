# Vidora

Local-first YouTube downloader for Windows. Built with Tauri 2, React, DaisyUI, and bundled `yt-dlp` + `ffmpeg`.

Use it only for media you have the right to download.

## Prerequisites

- Node.js 20+
- Rust (stable)
- WebView2 (Windows)

## First run

```bash
cd vidora
npm install
npm run setup
npm run tauri dev
```

`npm run setup` downloads Windows `yt-dlp`, `ffmpeg`, and `ffprobe` into `src-tauri/binaries/`.

## Production build

```bash
npm run setup
npm run tauri build
```

Installers land in `src-tauri/target/release/bundle/`.
