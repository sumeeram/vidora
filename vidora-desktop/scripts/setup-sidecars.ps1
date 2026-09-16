$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $projectRoot "src-tauri\binaries"
New-Item -ItemType Directory -Force -Path $binDir | Out-Null

$hostLine = rustc -vV | Select-String "host:"
if (-not $hostLine) {
    throw "rustc is required to detect the target triple."
}
$triple = ($hostLine.Line -split "\s+")[-1]
Write-Host "Target triple: $triple"

$ytPath = Join-Path $binDir "yt-dlp-$triple.exe"
Write-Host "Downloading yt-dlp..."
& curl.exe -L --retry 3 --retry-delay 2 "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -o $ytPath
if (-not (Test-Path $ytPath) -or (Get-Item $ytPath).Length -lt 10000) {
    throw "yt-dlp download failed."
}

$zip = Join-Path $env:TEMP "vidora-ffmpeg.zip"
$extract = Join-Path $env:TEMP "vidora-ffmpeg"
Write-Host "Downloading ffmpeg..."
& curl.exe -L --retry 3 --retry-delay 2 "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -o $zip
if (Test-Path $extract) {
    Remove-Item $extract -Recurse -Force
}
Expand-Archive -Path $zip -DestinationPath $extract -Force

$ffmpegExe = Get-ChildItem $extract -Recurse -Filter ffmpeg.exe | Select-Object -First 1
$ffprobeExe = Get-ChildItem $extract -Recurse -Filter ffprobe.exe | Select-Object -First 1
if (-not $ffmpegExe -or -not $ffprobeExe) {
    throw "ffmpeg.exe / ffprobe.exe not found in the archive."
}

Copy-Item $ffmpegExe.FullName (Join-Path $binDir "ffmpeg-$triple.exe") -Force
Copy-Item $ffprobeExe.FullName (Join-Path $binDir "ffprobe-$triple.exe") -Force

Write-Host "Sidecars installed:"
Get-ChildItem $binDir | ForEach-Object { Write-Host " - $($_.Name)" }
