use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum JobStatus {
    Queued,
    Running,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatSpec {
    pub id: String,
    pub label: String,
    pub kind: String,
    pub selector: String,
    #[serde(default)]
    pub audio_ext: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobOptions {
    #[serde(default)]
    pub output_dir: String,
    #[serde(default)]
    pub filename_template: String,
    #[serde(default)]
    pub rate_limit: String,
    #[serde(default)]
    pub trim_start: String,
    #[serde(default)]
    pub trim_end: String,
    #[serde(default)]
    pub subtitles: bool,
    #[serde(default)]
    pub auto_subs: bool,
    #[serde(default)]
    pub embed_chapters: bool,
    #[serde(default)]
    pub embed_thumbnail: bool,
    #[serde(default = "default_true")]
    pub no_playlist: bool,
}

fn default_true() -> bool {
    true
}

impl Default for JobOptions {
    fn default() -> Self {
        Self {
            output_dir: String::new(),
            filename_template: "%(title)s [%(id)s].%(ext)s".into(),
            rate_limit: String::new(),
            trim_start: String::new(),
            trim_end: String::new(),
            subtitles: false,
            auto_subs: false,
            embed_chapters: true,
            embed_thumbnail: true,
            no_playlist: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    pub id: String,
    pub url: String,
    pub title: String,
    #[serde(default)]
    pub thumbnail: Option<String>,
    #[serde(default)]
    pub channel: Option<String>,
    #[serde(default)]
    pub video_id: Option<String>,
    pub format: FormatSpec,
    pub status: JobStatus,
    pub progress: f64,
    #[serde(default)]
    pub speed: Option<String>,
    #[serde(default)]
    pub eta: Option<String>,
    #[serde(default)]
    pub error: Option<String>,
    #[serde(default)]
    pub output_path: Option<String>,
    pub options: JobOptions,
    pub added_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnqueueRequest {
    pub url: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub thumbnail: Option<String>,
    #[serde(default)]
    pub channel: Option<String>,
    #[serde(default)]
    pub video_id: Option<String>,
    pub format: FormatSpec,
    #[serde(default)]
    pub options: JobOptions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatInfo {
    pub id: String,
    pub label: String,
    pub ext: String,
    #[serde(default)]
    pub height: Option<u64>,
    #[serde(default)]
    pub fps: Option<f64>,
    pub has_video: bool,
    pub has_audio: bool,
    #[serde(default)]
    pub filesize: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistEntry {
    pub id: String,
    pub title: String,
    pub url: String,
    #[serde(default)]
    pub thumbnail: Option<String>,
    #[serde(default)]
    pub duration: Option<f64>,
    #[serde(default)]
    pub channel: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub kind: String,
    pub id: String,
    pub title: String,
    pub url: String,
    #[serde(default)]
    pub thumbnail: Option<String>,
    #[serde(default)]
    pub duration: Option<f64>,
    #[serde(default)]
    pub channel: Option<String>,
    #[serde(default)]
    pub formats: Vec<FormatInfo>,
    #[serde(default)]
    pub entries: Vec<PlaylistEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub output_dir: String,
    pub concurrency: u32,
    pub rate_limit: String,
    pub filename_template: String,
    pub theme: String,
    pub clipboard_watch: bool,
    pub clipboard_unfocused: bool,
    pub embed_chapters: bool,
    pub embed_thumbnail: bool,
    pub write_subs: bool,
    pub write_auto_subs: bool,
}

impl Settings {
    pub fn with_output_dir(output_dir: String) -> Self {
        Self {
            output_dir,
            concurrency: 2,
            rate_limit: String::new(),
            filename_template: "%(title)s [%(id)s].%(ext)s".into(),
            theme: "vidora-dark".into(),
            clipboard_watch: true,
            clipboard_unfocused: false,
            embed_chapters: true,
            embed_thumbnail: true,
            write_subs: false,
            write_auto_subs: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    pub id: String,
    #[serde(default)]
    pub video_id: Option<String>,
    pub title: String,
    #[serde(default)]
    pub channel: Option<String>,
    #[serde(default)]
    pub thumbnail: Option<String>,
    pub url: String,
    #[serde(default)]
    pub format_label: Option<String>,
    #[serde(default)]
    pub filepath: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteItem {
    pub id: String,
    #[serde(default)]
    pub video_id: Option<String>,
    pub title: String,
    #[serde(default)]
    pub channel: Option<String>,
    #[serde(default)]
    pub thumbnail: Option<String>,
    pub url: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SidecarStatus {
    pub ready: bool,
    pub yt_dlp: Option<String>,
    pub ffmpeg: Option<String>,
    pub message: String,
}
