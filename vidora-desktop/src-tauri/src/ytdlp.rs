use crate::paths::resolve_sidecar;
use crate::types::{FormatInfo, Job, MediaInfo, PlaylistEntry};
use regex::Regex;
use serde_json::Value;
use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::AppHandle;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

pub fn looks_like_playlist(url: &str) -> bool {
    let u = url.to_lowercase();
    u.contains("/playlist")
        || u.contains("/channel/")
        || u.contains("/c/")
        || u.contains("/user/")
        || (u.contains("youtube.com/") && u.contains("/@"))
        || u.contains("/videos")
        || u.contains("/streams")
        || u.contains("/releases")
}

pub fn is_youtube(url: &str) -> bool {
    let u = url.to_lowercase();
    u.contains("youtube.com") || u.contains("youtu.be") || u.contains("youtube-nocookie.com")
}

pub fn sidecar_command(
    app: &AppHandle,
    name: &str,
) -> Result<tauri_plugin_shell::process::Command, String> {
    app.shell()
        .sidecar(name)
        .or_else(|_| app.shell().sidecar(format!("binaries/{name}")))
        .map_err(|e| format!("sidecar {name}: {e}"))
}

pub async fn run_ytdlp_collect(app: &AppHandle, args: Vec<String>) -> Result<(String, String, i32), String> {
    let cmd = sidecar_command(app, "yt-dlp")?;
    let (mut rx, _child) = cmd.args(args).spawn().map_err(|e| e.to_string())?;
    let mut stdout = Vec::new();
    let mut stderr = Vec::new();
    let mut code = 1;
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(bytes) => stdout.extend_from_slice(&bytes),
            CommandEvent::Stderr(bytes) => stderr.extend_from_slice(&bytes),
            CommandEvent::Terminated(payload) => {
                code = payload.code.unwrap_or(1);
            }
            CommandEvent::Error(err) => return Err(err),
            _ => {}
        }
    }
    Ok((
        String::from_utf8_lossy(&stdout).to_string(),
        String::from_utf8_lossy(&stderr).to_string(),
        code,
    ))
}

pub fn spawn_ytdlp(
    app: &AppHandle,
    args: Vec<String>,
) -> Result<(tauri::async_runtime::Receiver<CommandEvent>, CommandChild), String> {
    let cmd = sidecar_command(app, "yt-dlp")?;
    cmd.args(args).spawn().map_err(|e| e.to_string())
}

pub fn ffmpeg_location(app: &AppHandle) -> Result<PathBuf, String> {
    let ffmpeg = resolve_sidecar(app, "ffmpeg")?;
    Ok(ffmpeg
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or(ffmpeg))
}

pub fn build_info_args(url: &str) -> Vec<String> {
    let mut args = vec![
        "-J".into(),
        "--no-warnings".into(),
        "--no-color".into(),
        "--socket-timeout".into(),
        "30".into(),
    ];
    if looks_like_playlist(url) {
        args.push("--yes-playlist".into());
        args.push("--flat-playlist".into());
        args.push("--playlist-end".into());
        args.push("400".into());
    } else {
        args.push("--no-playlist".into());
    }
    args.push("--".into());
    args.push(url.to_string());
    args
}

pub fn build_download_args(app: &AppHandle, job: &Job) -> Result<Vec<String>, String> {
    let ffmpeg = ffmpeg_location(app)?;
    let output_dir = job.options.output_dir.replace('\\', "/").trim_end_matches('/').to_string();
    let template = if job.options.filename_template.trim().is_empty() {
        "%(title)s [%(id)s].%(ext)s".to_string()
    } else {
        job.options.filename_template.clone()
    };
    let output = format!("{output_dir}/{template}");

    let mut args = vec![
        "--newline".into(),
        "--no-warnings".into(),
        "--no-color".into(),
        "--windows-filenames".into(),
        "--no-mtime".into(),
        "--progress".into(),
        "--retries".into(),
        "3".into(),
        "--ffmpeg-location".into(),
        ffmpeg.to_string_lossy().to_string(),
        "-o".into(),
        output,
    ];

    match job.format.kind.as_str() {
        "audio" => {
            let ext = job
                .format
                .audio_ext
                .clone()
                .unwrap_or_else(|| "mp3".into());
            args.extend([
                "-x".into(),
                "--audio-format".into(),
                ext,
                "--audio-quality".into(),
                "0".into(),
            ]);
        }
        "custom" => {
            args.extend(["-f".into(), job.format.selector.clone()]);
        }
        _ => {
            let selector = if job.format.selector.trim().is_empty() {
                "bv*+ba/b".to_string()
            } else {
                job.format.selector.clone()
            };
            args.extend([
                "-f".into(),
                selector,
                "--merge-output-format".into(),
                "mp4".into(),
            ]);
        }
    }

    if !job.options.rate_limit.trim().is_empty() {
        args.extend(["--limit-rate".into(), job.options.rate_limit.trim().to_string()]);
    }

    if job.options.subtitles {
        args.extend([
            "--write-subs".into(),
            "--embed-subs".into(),
            "--sub-langs".into(),
            "en.*,en".into(),
        ]);
    }
    if job.options.auto_subs {
        args.push("--write-auto-subs".into());
        if !job.options.subtitles {
            args.extend([
                "--embed-subs".into(),
                "--sub-langs".into(),
                "en.*,en".into(),
            ]);
        }
    }
    if job.options.embed_chapters {
        args.push("--embed-chapters".into());
    }
    if job.options.embed_thumbnail {
        args.extend([
            "--embed-thumbnail".into(),
            "--convert-thumbnails".into(),
            "jpg".into(),
        ]);
    }

    let start = job.options.trim_start.trim();
    let end = job.options.trim_end.trim();
    if !start.is_empty() || !end.is_empty() {
        let section = format!("*{start}-{end}");
        args.extend([
            "--download-sections".into(),
            section,
            "--force-keyframes-at-cuts".into(),
        ]);
    }

    if job.options.no_playlist {
        args.push("--no-playlist".into());
    }

    args.push("--".into());
    args.push(job.url.clone());
    Ok(args)
}

pub fn parse_media_info(raw: &str, fallback_url: &str) -> Result<MediaInfo, String> {
    let value: Value = serde_json::from_str(raw).map_err(|e| {
        format!("Could not parse video info ({e}). The extractor may need an update.")
    })?;
    let kind = value
        .get("_type")
        .and_then(|v| v.as_str())
        .unwrap_or("video")
        .to_string();

    if kind == "playlist" {
        let entries = value
            .get("entries")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|entry| {
                        let id = entry.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        if id.is_empty() {
                            return None;
                        }
                        let title = entry
                            .get("title")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Untitled")
                            .to_string();
                        Some(PlaylistEntry {
                            url: format!("https://www.youtube.com/watch?v={id}"),
                            thumbnail: thumb(entry),
                            duration: number(entry.get("duration")),
                            channel: text(entry, &["channel", "uploader", "playlist_uploader"]),
                            id,
                            title,
                        })
                    })
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        return Ok(MediaInfo {
            kind: "playlist".into(),
            id: text(&value, &["id"]).unwrap_or_else(|| "playlist".into()),
            title: text(&value, &["title"]).unwrap_or_else(|| "Playlist".into()),
            url: text(&value, &["webpage_url", "original_url"])
                .unwrap_or_else(|| fallback_url.to_string()),
            thumbnail: thumb(&value),
            duration: None,
            channel: text(&value, &["channel", "uploader"]),
            formats: vec![],
            entries,
        });
    }

    Ok(MediaInfo {
        kind: "video".into(),
        id: text(&value, &["id"]).unwrap_or_default(),
        title: text(&value, &["title"]).unwrap_or_else(|| "Untitled".into()),
        url: text(&value, &["webpage_url", "original_url"])
            .unwrap_or_else(|| fallback_url.to_string()),
        thumbnail: thumb(&value),
        duration: number(value.get("duration")),
        channel: text(&value, &["channel", "uploader"]),
        formats: slim_formats(&value),
        entries: vec![],
    })
}

fn text(value: &Value, keys: &[&str]) -> Option<String> {
    for key in keys {
        if let Some(s) = value.get(*key).and_then(|v| v.as_str()) {
            if !s.is_empty() {
                return Some(s.to_string());
            }
        }
    }
    None
}

fn number(value: Option<&Value>) -> Option<f64> {
    value.and_then(|v| v.as_f64().or_else(|| v.as_u64().map(|n| n as f64)))
}

fn thumb(value: &Value) -> Option<String> {
    if let Some(s) = value.get("thumbnail").and_then(|v| v.as_str()) {
        return Some(s.to_string());
    }
    value
        .get("thumbnails")
        .and_then(|v| v.as_array())
        .and_then(|arr| arr.last())
        .and_then(|t| t.get("url"))
        .and_then(|u| u.as_str())
        .map(|s| s.to_string())
}

fn slim_formats(value: &Value) -> Vec<FormatInfo> {
    let Some(arr) = value.get("formats").and_then(|v| v.as_array()) else {
        return vec![];
    };
    let mut out = Vec::new();
    for item in arr {
        let protocol = item
            .get("protocol")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        if protocol.contains("mhtml") {
            continue;
        }
        let vcodec = item.get("vcodec").and_then(|v| v.as_str()).unwrap_or("none");
        let acodec = item.get("acodec").and_then(|v| v.as_str()).unwrap_or("none");
        let has_video = vcodec != "none" && !vcodec.is_empty();
        let has_audio = acodec != "none" && !acodec.is_empty();
        if !has_video && !has_audio {
            continue;
        }
        let id = match item.get("format_id").and_then(|v| v.as_str()) {
            Some(id) => id.to_string(),
            None => continue,
        };
        let ext = item
            .get("ext")
            .and_then(|v| v.as_str())
            .unwrap_or("mp4")
            .to_string();
        let height = item.get("height").and_then(|v| v.as_u64());
        let fps = number(item.get("fps"));
        let note = item
            .get("format_note")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let label = if has_video {
            format!(
                "{} {}{}{}",
                ext.to_uppercase(),
                height.map(|h| format!("{h}p")).unwrap_or_else(|| "video".into()),
                fps.map(|f| format!(" {f:.0}fps")).unwrap_or_default(),
                if has_audio { "" } else { " video-only" }
            )
        } else {
            format!(
                "{} audio{}",
                ext.to_uppercase(),
                if note.is_empty() {
                    String::new()
                } else {
                    format!(" {note}")
                }
            )
        };
        out.push(FormatInfo {
            id,
            label: label.trim().to_string(),
            ext,
            height,
            fps,
            has_video,
            has_audio,
            filesize: item
                .get("filesize")
                .or_else(|| item.get("filesize_approx"))
                .and_then(|v| v.as_u64()),
        });
    }
    out.sort_by(|a, b| {
        b.height
            .unwrap_or(0)
            .cmp(&a.height.unwrap_or(0))
            .then(b.has_audio.cmp(&a.has_audio))
    });
    out
}

pub fn parse_progress(line: &str) -> Option<(f64, Option<String>, Option<String>)> {
    static RE: OnceLock<Regex> = OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(r"\[download\]\s+(\d+(?:\.\d+)?)%.*?at\s+(\S+)\s+ETA\s+(\S+)").expect("progress regex")
    });
    re.captures(line).map(|caps| {
        let percent = caps.get(1).and_then(|m| m.as_str().parse().ok()).unwrap_or(0.0);
        let speed = caps.get(2).map(|m| m.as_str().to_string());
        let eta = caps.get(3).map(|m| m.as_str().to_string());
        (percent, speed, eta)
    })
}

pub fn parse_destination(line: &str) -> Option<String> {
    if let Some(rest) = line.strip_prefix("[download] Destination: ") {
        return Some(rest.trim().to_string());
    }
    if let Some(rest) = line.strip_prefix("[ExtractAudio] Destination: ") {
        return Some(rest.trim().to_string());
    }
    if let Some(idx) = line.find("Merging formats into \"") {
        let rest = &line[idx + "Merging formats into \"".len()..];
        if let Some(end) = rest.rfind('"') {
            return Some(rest[..end].to_string());
        }
    }
    None
}

pub struct LineSplitter {
    buf: Vec<u8>,
}

impl LineSplitter {
    pub fn new() -> Self {
        Self { buf: Vec::new() }
    }

    pub fn push(&mut self, data: &[u8]) -> Vec<String> {
        self.buf.extend_from_slice(data);
        let mut lines = Vec::new();
        while let Some(pos) = self.buf.iter().position(|b| *b == b'\n') {
            let mut line: Vec<u8> = self.buf.drain(..=pos).collect();
            if line.last() == Some(&b'\n') {
                line.pop();
            }
            if line.last() == Some(&b'\r') {
                line.pop();
            }
            lines.push(String::from_utf8_lossy(&line).to_string());
        }
        lines
    }
}
