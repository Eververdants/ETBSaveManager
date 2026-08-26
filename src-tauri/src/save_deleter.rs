//! Save deleter module - Handles file deletion, restoration, and visibility operations
//! Extracted from save_commands.rs for better modularity

use crate::common::{
    add_save_to_mainsave, extract_archive_name, extract_archive_name_from_trash,
    get_save_games_dir, get_visible_saves_set, remove_save_from_mainsave, set_save_visibility,
    validate_save_games_path,
};
use crate::error::AppResult;
use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Helper: run a blocking closure via tokio::task::spawn_blocking,
/// mapping the join error into an AppResult.
async fn run_blocking<F, T>(f: F) -> AppResult<T>
where
    F: FnOnce() -> AppResult<T> + Send + 'static,
    T: Send + 'static,
{
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|e| format!("Task was cancelled: {}", e))?
}

/// Permanently delete a save file.
/// Removes from MAINSAVE records.
#[tauri::command]
pub async fn delete_file(file_path: String) -> AppResult<()> {
    run_blocking(move || {
        let path = Path::new(&file_path);
        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid file path")?;

        if !filename.to_lowercase().ends_with(".sav") {
            return Err("Only .sav save files can be deleted".to_string().into());
        }

        validate_save_games_path(path)?;

        fs::remove_file(&file_path).map_err(|e| format!("Failed to delete file: {}", e))?;

        // Remove from MAINSAVE records (best-effort: the file removal above is what
        // actually deletes the archive — listings are directory-driven, so a stale
        // entry is harmless. Failing here would report failure after the fact.)
        if let Err(e) = remove_save_from_mainsave(extract_archive_name(filename)) {
            tracing::warn!("Failed to clean '{}' from MAINSAVE: {}", filename, e);
        }

        Ok(())
    })
    .await
}

/// Soft-deleted archives live in this subfolder of SaveGames instead of
/// cluttering the game's own directory. Same volume → renames stay atomic;
/// inside SaveGames → containment validation still passes and undo survives
/// reboots (unlike the OS temp dir, which may be cleaned at any time).
const TRASH_SUBDIR: &str = "temp";

/// Trash location for an archive: `<SaveGames>/temp/<name>.sav.trash`.
fn new_trash_path(original_sav_path: &Path) -> AppResult<PathBuf> {
    let filename = original_sav_path.file_name().ok_or("Invalid file path")?;
    Ok(get_save_games_dir()?
        .join(TRASH_SUBDIR)
        .join(filename)
        .with_extension("sav.trash"))
}

/// Legacy pre-upgrade location: `.sav.trash` next to the original file.
fn legacy_trash_path(original_sav_path: &Path) -> PathBuf {
    original_sav_path.with_extension("sav.trash")
}

/// Move any root-level `.sav.trash` files from earlier versions into the
/// temp subfolder. Best-effort; called during metadata load.
pub fn migrate_legacy_trash() {
    let Ok(save_dir) = get_save_games_dir() else {
        return;
    };
    let Ok(entries) = fs::read_dir(&save_dir) else {
        return;
    };
    let trash_dir = save_dir.join(TRASH_SUBDIR);
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("trash") {
            continue;
        }
        let Some(filename) = path.file_name() else {
            continue;
        };
        if fs::create_dir_all(&trash_dir).is_err() {
            return;
        }
        match fs::rename(&path, trash_dir.join(filename)) {
            Ok(()) => tracing::info!("Migrated legacy trash file: {}", filename.to_string_lossy()),
            Err(e) => tracing::warn!(
                "Failed to migrate trash file '{}': {}",
                filename.to_string_lossy(),
                e
            ),
        }
    }
}

/// Soft-delete: rename .sav → temp/<name>.sav.trash so it can be restored later.
/// Removes from MAINSAVE records.
#[tauri::command]
pub async fn soft_delete_file(file_path: String) -> AppResult<()> {
    run_blocking(move || {
        let path = Path::new(&file_path);
        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid file path")?;

        if !filename.to_lowercase().ends_with(".sav") {
            return Err("Only .sav save files can be soft-deleted"
                .to_string()
                .into());
        }

        validate_save_games_path(path)?;

        let trash_path = new_trash_path(path)?;
        if let Some(parent) = trash_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create trash folder: {}", e))?;
        }

        // Move to trash (rename). An existing trashed copy of the same name is
        // replaced — recycle-bin semantics, only the newest deletion is kept.
        fs::rename(path, &trash_path)
            .map_err(|e| format!("Failed to move file to trash: {}", e))?;

        // Remove from MAINSAVE records (best-effort — see delete_file. Failing
        // here AFTER the rename would report failure while the archive IS
        // trashed, and would skip registering the undo action on the frontend.)
        if let Err(e) = remove_save_from_mainsave(extract_archive_name(filename)) {
            tracing::warn!(
                "Failed to clean '{}' from MAINSAVE after trash: {}",
                filename,
                e
            );
        }

        Ok(())
    })
    .await
}

/// Restore a soft-deleted file: rename temp/<name>.sav.trash → <name>.sav.
/// Falls back to the legacy root-level location from older versions.
/// Adds back to MAINSAVE records.
#[tauri::command]
pub async fn restore_file(file_path: String) -> AppResult<()> {
    run_blocking(move || {
        let path = Path::new(&file_path);

        // New layout first, then the pre-upgrade root-level .sav.trash.
        let mut trash_path = new_trash_path(path)?;
        if !trash_path.exists() {
            trash_path = legacy_trash_path(path);
        }

        validate_save_games_path(&trash_path)?;

        if !trash_path.exists() {
            return Err(format!("Trash file not found: {}", trash_path.display()).into());
        }

        let filename = trash_path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid trash file path")?;

        // Restore (rename back)
        fs::rename(&trash_path, path).map_err(|e| format!("Failed to restore file: {}", e))?;

        // Validate restored path
        validate_save_games_path(path)?;

        // Add back to MAINSAVE records. The trash filename ends in ".sav.trash",
        // so the plain ".sav" stripper would register the archive under a name
        // that never matches a listing — leaving restored archives hidden.
        // Best-effort (mirrors soft_delete_file): the rename above already put
        // the .sav back, and failing here would report failure after the fact.
        if let Err(e) = add_save_to_mainsave(extract_archive_name_from_trash(filename)) {
            tracing::warn!("Failed to re-register '{}' in MAINSAVE: {}", filename, e);
        }

        Ok(())
    })
    .await
}

/// Permanently delete a trashed file (.sav.trash).
/// Called after the undo window expires.
#[tauri::command]
pub async fn permanent_delete_file(file_path: String) -> AppResult<()> {
    run_blocking(move || {
        let path = Path::new(&file_path);
        // Remove both layouts if present (new temp/ folder + legacy root).
        for trash_path in [new_trash_path(path)?, legacy_trash_path(path)] {
            validate_save_games_path(&trash_path)?;
            if trash_path.exists() {
                fs::remove_file(&trash_path)
                    .map_err(|e| format!("Failed to delete trash file: {}", e))?;
            }
        }
        Ok(())
    })
    .await
}

/// Open the save games folder in the system file explorer.
#[tauri::command]
pub async fn open_save_games_folder() -> AppResult<()> {
    run_blocking(move || {
        let save_games_path = get_save_games_dir()?;

        if !save_games_path.exists() {
            return Err(format!(
                "Save directory does not exist: {}",
                save_games_path.display()
            )
            .into());
        }

        #[cfg(target_os = "windows")]
        {
            let path_str = save_games_path
                .to_str()
                .ok_or("Path contains invalid characters")?
                .replace('/', "\\");
            Command::new("explorer")
                .arg(&path_str)
                .spawn()
                .map_err(|e| format!("Failed to open folder: {}", e))?;
        }

        #[cfg(target_os = "macos")]
        Command::new("open")
            .arg(&save_games_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;

        #[cfg(target_os = "linux")]
        Command::new("xdg-open")
            .arg(&save_games_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;

        Ok(())
    })
    .await
}

/// Handle file operations: toggle/set visibility, read MAINSAVE.
///
/// The visibility mutation is atomic and returns the VERIFIED end state
/// (`isVisible`) so the frontend can reconcile its UI against what is actually
/// on disk instead of trusting an optimistic flip.
#[tauri::command]
pub async fn handle_file(
    file_path: String,
    action: Option<String>,
    _archive_name: Option<String>,
    visible: Option<bool>,
) -> AppResult<String> {
    run_blocking(move || {
        // Handle special request to read MAINSAVE file
        if action.as_deref() == Some("read") && file_path == "MAINSAVE.sav" {
            let visible_saves: Vec<String> = get_visible_saves_set()?.into_iter().collect();
            let response = json!({
                "success": true,
                "data": {
                    "SingleplayerSaves": visible_saves
                }
            });
            return Ok(response.to_string());
        }

        let file_path = PathBuf::from(&file_path);
        if !file_path.exists() {
            return Err("File does not exist".to_string().into());
        }

        validate_save_games_path(&file_path)?;

        match action.as_deref() {
            Some("toggle_visibility") => {
                let file_name = file_path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .ok_or("Invalid filename")?;
                let archive_name = extract_archive_name(file_name);

                // `visible` pins the desired state (idempotent, race-free);
                // None falls back to a relative flip.
                let is_visible = set_save_visibility(archive_name, visible)?;

                tracing::info!(
                    "visibility for '{}' is now {}",
                    archive_name,
                    if is_visible { "visible" } else { "hidden" }
                );

                Ok(json!({"success": true, "isVisible": is_visible}).to_string())
            }
            // Unknown/no action: return the resolved path without mutating
            // anything. (Previously ANY unrecognized action fell through into
            // a visibility toggle.)
            _ => Ok(file_path.to_str().unwrap_or_default().to_string()),
        }
    })
    .await
}
