use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn target_triple() -> String {
    match (std::env::consts::ARCH, std::env::consts::OS) {
        ("x86_64", "windows") => "x86_64-pc-windows-msvc".into(),
        ("aarch64", "windows") => "aarch64-pc-windows-msvc".into(),
        ("x86_64", "linux") => "x86_64-unknown-linux-gnu".into(),
        ("aarch64", "linux") => "aarch64-unknown-linux-gnu".into(),
        ("x86_64", "macos") => "x86_64-apple-darwin".into(),
        ("aarch64", "macos") => "aarch64-apple-darwin".into(),
        (arch, os) => format!("{arch}-unknown-{os}"),
    }
}

fn bin_name(name: &str) -> String {
    if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.to_string()
    }
}

pub fn resolve_sidecar(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    let filename = bin_name(name);
    let triple_name = if cfg!(windows) {
        format!("{}-{}.exe", name, target_triple())
    } else {
        format!("{}-{}", name, target_triple())
    };

    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(dir) = app.path().executable_dir() {
        candidates.push(dir.join(&filename));
    }
    if let Ok(dir) = app.path().resource_dir() {
        candidates.push(dir.join(&filename));
        candidates.push(dir.join("binaries").join(&triple_name));
        candidates.push(dir.join("binaries").join(&filename));
    }

    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    candidates.push(manifest.join("binaries").join(&triple_name));
    candidates.push(manifest.join("binaries").join(&filename));

    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join("src-tauri").join("binaries").join(&triple_name));
        candidates.push(cwd.join("binaries").join(&triple_name));
    }

    for path in candidates {
        if path.exists() {
            return Ok(path);
        }
    }

    Err(format!(
        "Could not find {name}. Run npm run setup to download yt-dlp and ffmpeg."
    ))
}

pub fn default_output_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .video_dir()
        .or_else(|_| app.path().download_dir())
        .or_else(|_| app.path().home_dir())
        .unwrap_or_else(|_| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
        .join("Vidora")
}

pub fn app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))
}
