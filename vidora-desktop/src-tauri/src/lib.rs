mod commands;
mod db;
mod paths;
mod queue;
mod types;
mod ytdlp;

use parking_lot::Mutex;
use rusqlite::Connection;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub queue: Mutex<queue::QueueState>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let output = paths::default_output_dir(app.handle());
            let _ = std::fs::create_dir_all(&output);
            let conn = db::open(app.handle(), &output.to_string_lossy())
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
            let settings = db::load_settings(&conn).unwrap_or_else(|_| {
                types::Settings::with_output_dir(output.to_string_lossy().to_string())
            });
            let mut queue_state = queue::QueueState::default();
            queue_state.concurrency = settings.concurrency.clamp(1, 4);
            app.manage(AppState {
                db: Mutex::new(conn),
                queue: Mutex::new(queue_state),
            });
            queue::spawn_scheduler(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::sidecar_status,
            commands::fetch_info,
            commands::enqueue,
            commands::enqueue_batch,
            commands::get_queue,
            commands::pause_job,
            commands::resume_job,
            commands::cancel_job,
            commands::retry_job,
            commands::reorder_queue,
            commands::get_history,
            commands::clear_history,
            commands::get_favorites,
            commands::toggle_favorite,
            commands::is_favorite,
            commands::update_ytdlp,
            commands::reveal_path,
            commands::open_path,
            commands::default_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running Vidora");
}
