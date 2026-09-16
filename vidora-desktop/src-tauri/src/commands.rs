use crate::db;
use crate::paths::{default_output_dir, resolve_sidecar};
use crate::queue;
use crate::types::{
    EnqueueRequest, FavoriteItem, HistoryItem, Job, JobStatus, MediaInfo, Settings, SidecarStatus,
};
use crate::ytdlp;
use chrono::Utc;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_opener::OpenerExt;
use uuid::Uuid;

#[tauri::command]
pub fn get_settings(state: State<'_, crate::AppState>) -> Result<Settings, String> {
    db::load_settings(&state.db.lock())
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Settings) -> Result<Settings, String> {
    let mut next = settings;
    next.concurrency = next.concurrency.clamp(1, 4);
    {
        let state = app.state::<crate::AppState>();
        db::save_settings(&state.db.lock(), &next)?;
    }
    queue::apply_settings(&app, &next);
    Ok(next)
}

#[tauri::command]
pub fn sidecar_status(app: AppHandle) -> SidecarStatus {
    let yt = resolve_sidecar(&app, "yt-dlp").ok();
    let ff = resolve_sidecar(&app, "ffmpeg").ok();
    let ready = yt.is_some() && ff.is_some();
    SidecarStatus {
        ready,
        yt_dlp: yt.map(|p| p.to_string_lossy().to_string()),
        ffmpeg: ff.map(|p| p.to_string_lossy().to_string()),
        message: if ready {
            "Engine ready".into()
        } else {
            "Run npm run setup to download yt-dlp and ffmpeg.".into()
        },
    }
}

#[tauri::command]
pub async fn fetch_info(app: AppHandle, url: String) -> Result<MediaInfo, String> {
    let url = url.trim().to_string();
    if !ytdlp::is_youtube(&url) {
        return Err("Paste a YouTube video, playlist, or channel link.".into());
    }
    let args = ytdlp::build_info_args(&url);
    let (stdout, stderr, code) = ytdlp::run_ytdlp_collect(&app, args).await?;
    if code != 0 {
        let err = stderr
            .lines()
            .rev()
            .find(|l| !l.trim().is_empty())
            .unwrap_or("Could not read this link.");
        return Err(err.to_string());
    }
    let json = stdout
        .lines()
        .find(|line| line.starts_with('{'))
        .unwrap_or(&stdout);
    ytdlp::parse_media_info(json, &url)
}

#[tauri::command]
pub fn enqueue(app: AppHandle, request: EnqueueRequest) -> Result<Job, String> {
    let job = build_job(&app, request)?;
    queue::enqueue(&app, job.clone());
    Ok(job)
}

#[tauri::command]
pub fn enqueue_batch(app: AppHandle, requests: Vec<EnqueueRequest>) -> Result<Vec<Job>, String> {
    let mut jobs = Vec::new();
    for request in requests {
        let job = build_job(&app, request)?;
        queue::enqueue(&app, job.clone());
        jobs.push(job);
    }
    Ok(jobs)
}

fn build_job(app: &AppHandle, request: EnqueueRequest) -> Result<Job, String> {
    if !ytdlp::is_youtube(&request.url) {
        return Err("Only YouTube links can be queued.".into());
    }
    let settings = db::load_settings(&app.state::<crate::AppState>().db.lock())?;
    let mut options = request.options;
    if options.output_dir.trim().is_empty() {
        options.output_dir = settings.output_dir.clone();
    }
    if options.filename_template.trim().is_empty() {
        options.filename_template = settings.filename_template.clone();
    }
    if options.rate_limit.trim().is_empty() {
        options.rate_limit = settings.rate_limit.clone();
    }
    let title = if request.title.trim().is_empty() {
        request.url.clone()
    } else {
        request.title
    };
    Ok(Job {
        id: Uuid::new_v4().to_string(),
        url: request.url,
        title,
        thumbnail: request.thumbnail,
        channel: request.channel,
        video_id: request.video_id,
        format: request.format,
        status: JobStatus::Queued,
        progress: 0.0,
        speed: None,
        eta: None,
        error: None,
        output_path: None,
        options,
        added_at: Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn get_queue(state: State<'_, crate::AppState>) -> Vec<Job> {
    state.queue.lock().jobs.clone()
}

#[tauri::command]
pub fn pause_job(app: AppHandle, id: String) -> Result<(), String> {
    queue::pause_job(&app, &id)
}

#[tauri::command]
pub fn resume_job(app: AppHandle, id: String) -> Result<(), String> {
    queue::resume_job(&app, &id)
}

#[tauri::command]
pub fn cancel_job(app: AppHandle, id: String) -> Result<(), String> {
    queue::cancel_job(&app, &id)
}

#[tauri::command]
pub fn retry_job(app: AppHandle, id: String) -> Result<(), String> {
    queue::retry_job(&app, &id)
}

#[tauri::command]
pub fn reorder_queue(app: AppHandle, from: usize, to: usize) -> Result<(), String> {
    queue::reorder(&app, from, to)
}

#[tauri::command]
pub fn get_history(state: State<'_, crate::AppState>) -> Result<Vec<HistoryItem>, String> {
    db::list_history(&state.db.lock())
}

#[tauri::command]
pub fn clear_history(state: State<'_, crate::AppState>) -> Result<(), String> {
    db::clear_history(&state.db.lock())
}

#[tauri::command]
pub fn get_favorites(state: State<'_, crate::AppState>) -> Result<Vec<FavoriteItem>, String> {
    db::list_favorites(&state.db.lock())
}

#[tauri::command]
pub fn toggle_favorite(
    state: State<'_, crate::AppState>,
    url: String,
    title: String,
    thumbnail: Option<String>,
    channel: Option<String>,
    video_id: Option<String>,
) -> Result<bool, String> {
    let db = state.db.lock();
    if let Some(id) = db::find_favorite(&db, &url, video_id.as_deref())? {
        db::delete_favorite(&db, &id)?;
        return Ok(false);
    }
    db::insert_favorite(
        &db,
        &FavoriteItem {
            id: Uuid::new_v4().to_string(),
            video_id,
            title,
            channel,
            thumbnail,
            url,
            created_at: Utc::now().to_rfc3339(),
        },
    )?;
    Ok(true)
}

#[tauri::command]
pub fn is_favorite(
    state: State<'_, crate::AppState>,
    url: String,
    video_id: Option<String>,
) -> Result<bool, String> {
    Ok(db::find_favorite(&state.db.lock(), &url, video_id.as_deref())?.is_some())
}

#[tauri::command]
pub async fn update_ytdlp(app: AppHandle) -> Result<String, String> {
    let (stdout, stderr, code) = ytdlp::run_ytdlp_collect(&app, vec!["-U".into()]).await?;
    let combined = format!("{stdout}\n{stderr}");
    if code != 0 {
        return Err(combined.trim().to_string());
    }
    Ok(combined.trim().to_string())
}

#[tauri::command]
pub fn reveal_path(app: AppHandle, path: String) -> Result<(), String> {
    app.opener()
        .reveal_item_in_dir(&path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_path(app: AppHandle, path: String) -> Result<(), String> {
    app.opener().open_path(&path, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn default_folder(app: AppHandle) -> String {
    default_output_dir(&app).to_string_lossy().to_string()
}
