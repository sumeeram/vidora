use crate::paths::app_data_dir;
use crate::types::{FavoriteItem, HistoryItem, Settings};
use rusqlite::{params, Connection, OptionalExtension};
use tauri::AppHandle;

pub fn open(app: &AppHandle, default_output: &str) -> Result<Connection, String> {
    let dir = app_data_dir(app)?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("vidora.db");
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            video_id TEXT,
            title TEXT NOT NULL,
            channel TEXT,
            thumbnail TEXT,
            url TEXT NOT NULL,
            format_label TEXT,
            filepath TEXT,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS favorites (
            id TEXT PRIMARY KEY,
            video_id TEXT,
            title TEXT NOT NULL,
            channel TEXT,
            thumbnail TEXT,
            url TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        ",
    )
    .map_err(|e| e.to_string())?;

    if get_setting(&conn, "app").is_none() {
        let settings = Settings::with_output_dir(default_output.to_string());
        save_settings(&conn, &settings)?;
    }
    Ok(conn)
}

pub fn get_setting(conn: &Connection, key: &str) -> Option<String> {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        [key],
        |row| row.get(0),
    )
    .optional()
    .ok()
    .flatten()
}

pub fn load_settings(conn: &Connection) -> Result<Settings, String> {
    let raw = get_setting(conn, "app").ok_or_else(|| "settings missing".to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

pub fn save_settings(conn: &Connection, settings: &Settings) -> Result<(), String> {
    let raw = serde_json::to_string(settings).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings(key, value) VALUES('app', ?1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [raw],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn insert_history(conn: &Connection, item: &HistoryItem) -> Result<(), String> {
    conn.execute(
        "INSERT INTO history(id, video_id, title, channel, thumbnail, url, format_label, filepath, created_at)
         VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            item.id,
            item.video_id,
            item.title,
            item.channel,
            item.thumbnail,
            item.url,
            item.format_label,
            item.filepath,
            item.created_at
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_history(conn: &Connection) -> Result<Vec<HistoryItem>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, video_id, title, channel, thumbnail, url, format_label, filepath, created_at
             FROM history ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(HistoryItem {
                id: row.get(0)?,
                video_id: row.get(1)?,
                title: row.get(2)?,
                channel: row.get(3)?,
                thumbnail: row.get(4)?,
                url: row.get(5)?,
                format_label: row.get(6)?,
                filepath: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn clear_history(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM history", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_favorites(conn: &Connection) -> Result<Vec<FavoriteItem>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, video_id, title, channel, thumbnail, url, created_at
             FROM favorites ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(FavoriteItem {
                id: row.get(0)?,
                video_id: row.get(1)?,
                title: row.get(2)?,
                channel: row.get(3)?,
                thumbnail: row.get(4)?,
                url: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn find_favorite(conn: &Connection, url: &str, video_id: Option<&str>) -> Result<Option<String>, String> {
    if let Some(id) = video_id {
        let found = conn
            .query_row(
                "SELECT id FROM favorites WHERE video_id = ?1 LIMIT 1",
                [id],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;
        if found.is_some() {
            return Ok(found);
        }
    }
    conn.query_row(
        "SELECT id FROM favorites WHERE url = ?1 LIMIT 1",
        [url],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|e| e.to_string())
}

pub fn insert_favorite(conn: &Connection, item: &FavoriteItem) -> Result<(), String> {
    conn.execute(
        "INSERT INTO favorites(id, video_id, title, channel, thumbnail, url, created_at)
         VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            item.id,
            item.video_id,
            item.title,
            item.channel,
            item.thumbnail,
            item.url,
            item.created_at
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_favorite(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM favorites WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
