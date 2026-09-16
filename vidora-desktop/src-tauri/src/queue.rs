use crate::db;
use crate::types::{HistoryItem, Job, JobStatus, Settings};
use crate::ytdlp::{self, LineSplitter};
use chrono::Utc;
use parking_lot::Mutex;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_shell::process::CommandChild;
use uuid::Uuid;

pub struct QueueState {
    pub jobs: Vec<Job>,
    pub concurrency: u32,
    children: HashMap<String, Arc<Mutex<Option<CommandChild>>>>,
    flags: HashMap<String, Arc<JobFlags>>,
}

struct JobFlags {
    cancel: AtomicBool,
    pause: AtomicBool,
}

impl Default for QueueState {
    fn default() -> Self {
        Self {
            jobs: Vec::new(),
            concurrency: 2,
            children: HashMap::new(),
            flags: HashMap::new(),
        }
    }
}

pub fn emit_queue(app: &AppHandle) {
    let jobs = app.state::<crate::AppState>().queue.lock().jobs.clone();
    let _ = app.emit("queue:update", jobs);
}

pub fn spawn_scheduler(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            try_start(&app);
            tokio::time::sleep(std::time::Duration::from_millis(250)).await;
        }
    });
}

fn try_start(app: &AppHandle) {
    let state = app.state::<crate::AppState>();
    let job = {
        let mut q = state.queue.lock();
        let running = q
            .jobs
            .iter()
            .filter(|j| j.status == JobStatus::Running)
            .count() as u32;
        if running >= q.concurrency.max(1) {
            return;
        }
        let next = q.jobs.iter_mut().find(|j| j.status == JobStatus::Queued);
        if let Some(job) = next {
            job.status = JobStatus::Running;
            job.progress = 0.0;
            job.error = None;
            Some(job.clone())
        } else {
            None
        }
    };
    if let Some(job) = job {
        emit_queue(app);
        let handle = app.clone();
        tauri::async_runtime::spawn(async move {
            run_job(handle, job).await;
        });
    }
}

async fn run_job(app: AppHandle, job: Job) {
    let flags = Arc::new(JobFlags {
        cancel: AtomicBool::new(false),
        pause: AtomicBool::new(false),
    });
    let child_slot: Arc<Mutex<Option<CommandChild>>> = Arc::new(Mutex::new(None));
    {
        let state = app.state::<crate::AppState>();
        let mut q = state.queue.lock();
        q.flags.insert(job.id.clone(), flags.clone());
        q.children.insert(job.id.clone(), child_slot.clone());
    }

    let args = match ytdlp::build_download_args(&app, &job) {
        Ok(args) => args,
        Err(err) => {
            finish(&app, &job.id, JobStatus::Failed, None, Some(err));
            return;
        }
    };

    if let Err(err) = std::fs::create_dir_all(&job.options.output_dir) {
        finish(
            &app,
            &job.id,
            JobStatus::Failed,
            None,
            Some(format!("Cannot create output folder: {err}")),
        );
        return;
    }

    let spawned = ytdlp::spawn_ytdlp(&app, args);
    let (mut rx, child) = match spawned {
        Ok(pair) => pair,
        Err(err) => {
            finish(&app, &job.id, JobStatus::Failed, None, Some(err));
            return;
        }
    };
    *child_slot.lock() = Some(child);

    let mut splitter = LineSplitter::new();
    let mut output_path = None;
    let mut last_err = String::new();
    let mut exit_code = 1;

    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(bytes)
            | tauri_plugin_shell::process::CommandEvent::Stderr(bytes) => {
                for line in splitter.push(&bytes) {
                    if let Some(path) = ytdlp::parse_destination(&line) {
                        output_path = Some(path);
                    }
                    if let Some((percent, speed, eta)) = ytdlp::parse_progress(&line) {
                        update_progress(&app, &job.id, percent, speed, eta);
                    }
                    if line.starts_with("ERROR:") || line.contains("ERROR:") {
                        last_err = line.clone();
                    }
                }
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                exit_code = payload.code.unwrap_or(1);
            }
            tauri_plugin_shell::process::CommandEvent::Error(err) => {
                last_err = err;
            }
            _ => {}
        }
    }

    let (cancelled, paused) = (
        flags.cancel.load(Ordering::SeqCst),
        flags.pause.load(Ordering::SeqCst),
    );
    if cancelled {
        finish(&app, &job.id, JobStatus::Cancelled, output_path, None);
        return;
    }
    if paused {
        set_status(&app, &job.id, JobStatus::Paused);
        return;
    }
    if exit_code == 0 {
        persist_history(&app, &job, output_path.clone());
        notify_done(&app, &job.title);
        finish(&app, &job.id, JobStatus::Completed, output_path, None);
    } else {
        let msg = if last_err.is_empty() {
            format!("yt-dlp exited with code {exit_code}")
        } else {
            last_err
        };
        finish(&app, &job.id, JobStatus::Failed, output_path, Some(msg));
    }
}

fn update_progress(
    app: &AppHandle,
    id: &str,
    percent: f64,
    speed: Option<String>,
    eta: Option<String>,
) {
    let state = app.state::<crate::AppState>();
    let mut q = state.queue.lock();
    if let Some(job) = q.jobs.iter_mut().find(|j| j.id == id) {
        job.progress = percent;
        job.speed = speed;
        job.eta = eta;
    }
    let jobs = q.jobs.clone();
    drop(q);
    let _ = app.emit("queue:update", jobs);
}

fn set_status(app: &AppHandle, id: &str, status: JobStatus) {
    let state = app.state::<crate::AppState>();
    let mut q = state.queue.lock();
    if let Some(job) = q.jobs.iter_mut().find(|j| j.id == id) {
        job.status = status;
    }
    q.children.remove(id);
    emit_locked(app, &q.jobs);
}

fn finish(
    app: &AppHandle,
    id: &str,
    status: JobStatus,
    output_path: Option<String>,
    error: Option<String>,
) {
    let state = app.state::<crate::AppState>();
    let mut q = state.queue.lock();
    if let Some(job) = q.jobs.iter_mut().find(|j| j.id == id) {
        job.status = status.clone();
        job.output_path = output_path;
        job.error = error;
        if status == JobStatus::Completed {
            job.progress = 100.0;
        }
    }
    q.children.remove(id);
    q.flags.remove(id);
    emit_locked(app, &q.jobs);
}

fn emit_locked(app: &AppHandle, jobs: &[Job]) {
    let _ = app.emit("queue:update", jobs);
}

fn persist_history(app: &AppHandle, job: &Job, output_path: Option<String>) {
    let item = HistoryItem {
        id: Uuid::new_v4().to_string(),
        video_id: job.video_id.clone(),
        title: job.title.clone(),
        channel: job.channel.clone(),
        thumbnail: job.thumbnail.clone(),
        url: job.url.clone(),
        format_label: Some(job.format.label.clone()),
        filepath: output_path,
        created_at: Utc::now().to_rfc3339(),
    };
    let state = app.state::<crate::AppState>();
    let db = state.db.lock();
    let _ = db::insert_history(&db, &item);
    drop(db);
    let _ = app.emit("history:update", ());
}

fn notify_done(app: &AppHandle, title: &str) {
    let _ = app
        .notification()
        .builder()
        .title("Vidora")
        .body(format!("Finished · {title}"))
        .show();
}

pub fn enqueue(app: &AppHandle, mut job: Job) {
    let state = app.state::<crate::AppState>();
    let mut q = state.queue.lock();
    if job.options.output_dir.is_empty() {
        if let Ok(settings) = db::load_settings(&state.db.lock()) {
            job.options.output_dir = settings.output_dir;
        }
    }
    q.jobs.push(job);
    emit_locked(app, &q.jobs);
}

pub fn pause_job(app: &AppHandle, id: &str) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    let q = state.queue.lock();
    let Some(job) = q.jobs.iter().find(|j| j.id == id) else {
        return Err("Job not found".into());
    };
    if job.status != JobStatus::Running {
        return Err("Job is not running".into());
    }
    if let Some(flags) = q.flags.get(id) {
        flags.pause.store(true, Ordering::SeqCst);
    }
    kill_child(&q, id);
    Ok(())
}

pub fn resume_job(app: &AppHandle, id: &str) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    let mut q = state.queue.lock();
    let Some(job) = q.jobs.iter_mut().find(|j| j.id == id) else {
        return Err("Job not found".into());
    };
    if job.status != JobStatus::Paused && job.status != JobStatus::Failed {
        return Err("Job cannot be resumed".into());
    }
    job.status = JobStatus::Queued;
    job.error = None;
    emit_locked(app, &q.jobs);
    Ok(())
}

pub fn cancel_job(app: &AppHandle, id: &str) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    let mut q = state.queue.lock();
    let Some(job) = q.jobs.iter_mut().find(|j| j.id == id) else {
        return Err("Job not found".into());
    };
    match job.status {
        JobStatus::Queued => {
            job.status = JobStatus::Cancelled;
        }
        JobStatus::Running => {
            if let Some(flags) = q.flags.get(id) {
                flags.cancel.store(true, Ordering::SeqCst);
            }
            kill_child(&q, id);
        }
        JobStatus::Paused => {
            job.status = JobStatus::Cancelled;
        }
        _ => return Err("Job cannot be cancelled".into()),
    }
    emit_locked(app, &q.jobs);
    Ok(())
}

pub fn retry_job(app: &AppHandle, id: &str) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    let mut q = state.queue.lock();
    let Some(job) = q.jobs.iter_mut().find(|j| j.id == id) else {
        return Err("Job not found".into());
    };
    if job.status != JobStatus::Failed && job.status != JobStatus::Cancelled {
        return Err("Only failed or cancelled jobs can be retried".into());
    }
    job.status = JobStatus::Queued;
    job.progress = 0.0;
    job.error = None;
    emit_locked(app, &q.jobs);
    Ok(())
}

pub fn reorder(app: &AppHandle, from: usize, to: usize) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    let mut q = state.queue.lock();
    if from >= q.jobs.len() || to >= q.jobs.len() {
        return Err("Invalid index".into());
    }
    let job = q.jobs.remove(from);
    q.jobs.insert(to, job);
    emit_locked(app, &q.jobs);
    Ok(())
}

pub fn apply_settings(app: &AppHandle, settings: &Settings) {
    let state = app.state::<crate::AppState>();
    state.queue.lock().concurrency = settings.concurrency.max(1).min(4);
}

fn kill_child(q: &QueueState, id: &str) {
    if let Some(slot) = q.children.get(id) {
        if let Some(child) = slot.lock().take() {
            let _ = child.kill();
        }
    }
}
