use crate::cli_handlers;
use crate::common::{
    add_save_to_mainsave, extract_archive_name, get_app_config_dir, get_save_games_dir,
    get_visible_saves_set, remove_save_from_mainsave, validate_save_games_path,
};
use crate::error::AppResult;
use crate::get_file_path;
use crate::new_save;
use crate::player_data;
use crate::save_editor;
use crate::save_utils;
use crate::save_utils::{SaveFileDetail, SaveFileInfo, SaveFileMeta};
use rayon::prelude::*;
use serde_json::{json, Value};
use std::borrow::Cow;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Instant;

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

#[tauri::command]
pub async fn load_all_saves() -> AppResult<Vec<SaveFileInfo>> {
    let start_time = Instant::now();

    // Parallel fetch file list and visible saves set
    let (paths_result, visible_saves_result) =
        rayon::join(get_file_path::list_save_paths, get_visible_saves_set);

    let paths = paths_result?;
    let visible_saves = Arc::new(visible_saves_result?);
    let path_count = paths.len();

    // Use rayon to process all save files in parallel
    let results: Vec<SaveFileInfo> = paths
        .into_par_iter()
        .enumerate()
        .filter_map(|(i, path)| process_save_file(i, &path, &visible_saves))
        .collect();

    let elapsed = start_time.elapsed();
    println!(
        "load_all_saves: {}/{} saves, took {:.2}ms",
        results.len(),
        path_count,
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(results)
}

/// Phase 1 of incremental loading: return only filename-derived metadata,
/// no .sav file parsing. Extremely fast even for 1000+ files.
#[tauri::command]
pub async fn load_save_metadata() -> AppResult<Vec<SaveFileMeta>> {
    let start_time = Instant::now();

    let (paths_result, visible_saves_result) =
        rayon::join(get_file_path::list_save_paths, get_visible_saves_set);

    let paths = paths_result?;
    let visible_saves = Arc::new(visible_saves_result?);

    let results: Vec<SaveFileMeta> = paths
        .into_par_iter()
        .enumerate()
        .filter_map(|(i, path)| {
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            let archive_name = extract_archive_name(file_name);
            let date = cli_handlers::get_modified_date(&path).unwrap_or_default();
            let is_visible = visible_saves.contains(archive_name);

            save_utils::build_save_meta(i as u32, &path, date, is_visible).ok()
        })
        .collect();

    let elapsed = start_time.elapsed();
    println!(
        "load_save_metadata: {} saves, took {:.2}ms",
        results.len(),
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(results)
}

/// Paginated version of load_save_metadata — loads only `limit` items at the
/// given `offset`, so the frontend can progressively fetch archives as the
/// user scrolls.  Returns SaveFileMetaPage with the total count so the
/// frontend knows when the list ends.
#[tauri::command]
pub async fn load_save_metadata_page(
    offset: u32,
    limit: u32,
) -> AppResult<save_utils::SaveFileMetaPage> {
    let start_time = Instant::now();

    let (paths_result, visible_saves_result) =
        rayon::join(get_file_path::list_save_paths, get_visible_saves_set);

    let paths = paths_result?;
    let visible_saves = visible_saves_result?;
    let total = paths.len() as u32;

    // Clamp to valid range
    let start = offset.min(total) as usize;
    let end = (offset + limit).min(total) as usize;
    let page_paths = &paths[start..end];

    let mut results: Vec<SaveFileMeta> = Vec::with_capacity(page_paths.len());
    for (rel_i, path) in page_paths.iter().enumerate() {
        let global_idx = (start + rel_i) as u32;
        let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        let archive_name = extract_archive_name(file_name);
        let date = cli_handlers::get_modified_date(path).unwrap_or_default();
        let is_visible = visible_saves.contains(archive_name);

        if let Ok(meta) = save_utils::build_save_meta(global_idx, path, date, is_visible) {
            results.push(meta);
        }
    }

    let elapsed = start_time.elapsed();
    println!(
        "load_save_metadata_page(offset={}, limit={}): {} items of {}, took {:.2}ms",
        offset,
        limit,
        results.len(),
        total,
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(save_utils::SaveFileMetaPage {
        items: results,
        total,
        offset,
        has_more: end < total as usize,
    })
}

/// Phase 2 of incremental loading: parse specific .sav files in batch
/// to get current_level and actual_difficulty.
#[tauri::command]
pub async fn load_save_details_batch(paths: Vec<String>) -> AppResult<Vec<SaveFileDetail>> {
    let start_time = Instant::now();
    let count = paths.len();

    let results: Vec<SaveFileDetail> = paths
        .into_par_iter()
        .filter_map(|path| {
            let p = Path::new(&path);
            cli_handlers::parse_sav_file(p).ok().map(|save| {
                let current_level = cli_handlers::extract_current_level(&save);
                let actual_difficulty = cli_handlers::extract_difficulty_label(&save).into_owned();
                SaveFileDetail {
                    path,
                    current_level,
                    actual_difficulty,
                }
            })
        })
        .collect();

    let elapsed = start_time.elapsed();
    println!(
        "load_save_details_batch: {}/{}, took {:.2}ms",
        results.len(),
        count,
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(results)
}

/// Process a single save file (optimized version)
#[inline]
fn process_save_file(
    index: usize,
    path: &Path,
    visible_saves: &std::collections::HashSet<String>,
) -> Option<SaveFileInfo> {
    let save = cli_handlers::parse_sav_file(path).ok()?;
    let current_level = cli_handlers::extract_current_level(&save);
    let actual_difficulty: Cow<'static, str> = cli_handlers::extract_difficulty_label(&save);
    let date = cli_handlers::get_modified_date(path).ok()?;

    let file_name = path.file_name()?.to_str()?;
    let save_name = extract_archive_name(file_name);
    let is_visible = visible_saves.contains(save_name);

    let mut info = save_utils::build_save_info(
        (index + 1) as u32,
        path,
        current_level,
        actual_difficulty.into_owned(),
        date,
    )
    .ok()?;

    info.is_visible = Some(is_visible);
    Some(info)
}

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

        // Remove from MAINSAVE records (failure does not affect main operation)
        let _ = remove_save_from_mainsave(extract_archive_name(filename));

        Ok(())
    })
    .await
}

/// Soft-delete: rename .sav → .sav.trash so it can be restored later.
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

        let trash_path = path.with_extension("sav.trash");

        // Move to trash (rename)
        fs::rename(path, &trash_path)
            .map_err(|e| format!("Failed to move file to trash: {}", e))?;

        // Remove from MAINSAVE records
        remove_save_from_mainsave(extract_archive_name(filename))?;

        Ok(())
    })
    .await
}

/// Restore a soft-deleted file: rename .sav.trash → .sav.
/// Adds back to MAINSAVE records.
#[tauri::command]
pub async fn restore_file(file_path: String) -> AppResult<()> {
    run_blocking(move || {
        let path = Path::new(&file_path);

        // The .trash path is the original path with .sav.trash extension
        let trash_path = path.with_extension("sav.trash");

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

        // Validate restored path
        validate_save_games_path(path)?;

        // Add back to MAINSAVE records
        add_save_to_mainsave(extract_archive_name(filename))?;

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
        let trash_path = path.with_extension("sav.trash");

        validate_save_games_path(&trash_path)?;

        if trash_path.exists() {
            fs::remove_file(&trash_path)
                .map_err(|e| format!("Failed to delete trash file: {}", e))?;
        }
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn open_save_games_folder() -> AppResult<()> {
    run_blocking(move || {
        use std::process::Command;

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

#[tauri::command]
pub async fn handle_file(
    file_path: String,
    action: Option<String>,
    _archive_name: Option<String>,
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

        let file_name = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid filename")?;
        let archive_name = extract_archive_name(file_name);

        // Get current visibility state and toggle
        let visible_saves = get_visible_saves_set()?;
        let is_visible = visible_saves.contains(archive_name);

        eprintln!(
            "[handle_file] toggling visibility for '{}' (currently {})",
            archive_name,
            if is_visible { "visible" } else { "hidden" }
        );

        if is_visible {
            let removed = remove_save_from_mainsave(archive_name)?;
            if !removed {
                eprintln!(
                    "[handle_file] WARNING: '{}' not found in MAINSAVE SingleplayerSaves",
                    archive_name
                );
            }
        } else {
            add_save_to_mainsave(archive_name)?;
        }

        if action.as_deref() == Some("toggle_visibility") {
            return Ok(json!({"success": true}).to_string());
        }

        Ok(file_path.to_str().unwrap_or_default().to_string())
    })
    .await
}

#[tauri::command]
pub async fn get_player_data(file_path: String) -> AppResult<Value> {
    run_blocking(move || {
        let path = Path::new(&file_path);
        validate_save_games_path(path)?;
        let save = cli_handlers::parse_sav_file(path)?;

        let (ids, sanities, inventories) = player_data::extract_player_data(&save);

        Ok(json!({
            "ids": ids,
            "sanities": sanities,
            "inventories": inventories
        }))
    })
    .await
}

/// Persistent cache of `steam id -> full PlayerData key` (`<steam id>_+_|<EOS PUID>`),
/// stored in the app config dir. Populated from existing saves so we don't have to
/// rescan every save on each lookup.
const PLAYER_ID_MAP_FILE: &str = "player_id_map.json";

fn player_id_map_path() -> AppResult<PathBuf> {
    Ok(get_app_config_dir()?.join(PLAYER_ID_MAP_FILE))
}

/// Load the cached player id map. Failures (missing/corrupt file) degrade to empty.
fn load_player_id_map() -> HashMap<String, String> {
    let Ok(path) = player_id_map_path() else {
        return HashMap::new();
    };
    let Ok(content) = fs::read_to_string(&path) else {
        return HashMap::new();
    };
    serde_json::from_str(&content).unwrap_or_default()
}

/// Persist the player id map (best-effort; a write failure only loses the cache).
fn save_player_id_map(map: &HashMap<String, String>) {
    let Ok(dir) = get_app_config_dir() else {
        return;
    };
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    let Ok(json) = serde_json::to_string_pretty(map) else {
        return;
    };
    let _ = fs::write(dir.join(PLAYER_ID_MAP_FILE), json);
}

/// Pure player id: strip the `_+_|<suffix>` (online) or `-<15 chars>` (offline) part.
fn pure_player_key(id: &str) -> String {
    if let Some(idx) = id.find("_+_|") {
        id[..idx].to_string()
    } else if let Some(idx) = id.find('-') {
        id[..idx].to_string()
    } else {
        id.to_string()
    }
}

/// Whether the key carries a real EOS account id suffix: 32 hex chars and not the
/// all-zeros placeholder an earlier app version wrote. The game ignores keys with a
/// placeholder EOS id, so a create flow must never reuse one.
fn is_real_eos_key(key: &str) -> bool {
    if let Some(idx) = key.find("_+_|") {
        let suffix = &key[idx + 4..];
        suffix.len() == 32 && suffix != "00000000000000000000000000000000"
    } else {
        false
    }
}

/// Resolve the full PlayerData key (`<steam id>_+_|<EOS PUID>`) for a player id.
///
/// A bare steam id is not a usable PlayerData key: the game only binds player data
/// to `<steam id>_+_|<EOS PUID>` keys, so a bare-key entry is silently ignored
/// in-game (empty backpack, sanity reset to 100). The EOS PUID is generated by
/// Epic's servers per account and cannot be synthesized, so it must be read back
/// from a save (or the local cache) that already contains it.
///
/// - When `player_id` already carries a real (non-placeholder) EOS suffix it is
///   returned unchanged.
/// - Otherwise the local cache is checked, then existing saves are scanned; any
///   discovery is persisted for next time.
/// - Returns `None` when no real EOS key can be found anywhere (e.g. a player
///   that has never been saved — the game has no PUID for it yet).
pub(crate) fn resolve_player_full_key(player_id: &str) -> Option<String> {
    // Already a real key — nothing to resolve.
    if is_real_eos_key(player_id) {
        return Some(player_id.to_string());
    }

    let mut map = load_player_id_map();
    // Cache hit must still pass the real-key check: older app versions persisted
    // all-zeros placeholders that the game ignores.
    if let Some(full) = map.get(player_id) {
        if is_real_eos_key(full) {
            return Some(full.clone());
        }
    }

    // Scan existing saves for a real EOS-suffixed entry belonging to this id.
    let mut discovered: Option<String> = None;
    if let Ok(save_games_dir) = get_save_games_dir() {
        if save_games_dir.exists() {
            let iter = walkdir::WalkDir::new(&save_games_dir)
                .max_depth(1)
                .into_iter()
                .filter_map(Result::ok)
                .filter(|e| e.file_type().is_file())
                .filter(|e| e.path().extension().is_some_and(|x| x == "sav"));

            'scan: for entry in iter {
                if let Ok(save) = cli_handlers::parse_sav_file(entry.path()) {
                    let (ids, _, _) = player_data::extract_player_data(&save);
                    for id in ids {
                        if is_real_eos_key(&id) && pure_player_key(&id) == player_id {
                            discovered = Some(id);
                            break 'scan;
                        }
                    }
                }
            }
        }
    }

    if let Some(full) = discovered {
        map.insert(player_id.to_string(), full.clone());
        save_player_id_map(&map);
        Some(full)
    } else {
        None
    }
}

/// Look up the full PlayerData key (`<steam id>_+_|<EOS PUID>`) for each requested
/// player. Checks the local cache first, then scans existing saves for missing ids and
/// updates the cache. The EOS PUID is generated by Epic's servers per account and cannot
/// be synthesized, so it must be read back from a save (or cache) that already contains it.
/// Returns a map: pure steam id -> full key (only for players found in saves/cache).
#[tauri::command]
pub async fn get_player_unique_ids(steam_ids: Vec<String>) -> AppResult<Value> {
    run_blocking(move || {
        let mut map = load_player_id_map();

        // Only scan saves for ids missing from the cache
        let missing: Vec<String> = steam_ids
            .iter()
            .filter(|id| !map.contains_key(*id))
            .cloned()
            .collect();

        let mut discovered: HashMap<String, String> = HashMap::new();
        if !missing.is_empty() {
            let save_games_dir = get_save_games_dir()?;
            if save_games_dir.exists() {
                let requested: HashSet<String> = missing.iter().cloned().collect();
                let iter = walkdir::WalkDir::new(&save_games_dir)
                    .max_depth(1)
                    .into_iter()
                    .filter_map(Result::ok)
                    .filter(|e| e.file_type().is_file())
                    .filter(|e| e.path().extension().is_some_and(|x| x == "sav"));

                for entry in iter {
                    let path = entry.path();
                    if let Ok(save) = cli_handlers::parse_sav_file(path) {
                        let (ids, _, _) = player_data::extract_player_data(&save);
                        for id in ids {
                            // Only cache entries with a real (non-placeholder) EOS suffix
                            if !is_real_eos_key(&id) {
                                continue;
                            }
                            let pure = pure_player_key(&id);
                            if requested.contains(&pure) && !discovered.contains_key(&pure) {
                                discovered.insert(pure, id);
                            }
                        }
                    }
                }
            }

            if !discovered.is_empty() {
                map.extend(discovered);
                save_player_id_map(&map);
            }
        }

        // Return only the requested ids that resolved to a full key with a real
        // EOS suffix. The local cache may still hold all-zeros placeholders written
        // by an older version, so re-validate every hit before handing it out.
        let result: HashMap<String, String> = steam_ids
            .into_iter()
            .filter_map(|id| {
                map.get(&id)
                    .filter(|full| is_real_eos_key(full))
                    .map(|full| (id, full.clone()))
            })
            .collect();

        Ok(json!({ "success": true, "map": result }))
    })
    .await
}

#[tauri::command]
pub async fn unlock_all_hub_doors(file_path: String) -> AppResult<String> {
    run_blocking(move || {
        validate_save_games_path(Path::new(&file_path))?;
        save_editor::unlock_all_hub_doors(&file_path)
    })
    .await
}

#[tauri::command]
pub async fn handle_edit_save(json_input: Value) -> AppResult<String> {
    run_blocking(move || {
        let save_data = json_input
            .get("saveData")
            .ok_or("Missing 'saveData' in input")?;

        let output_dir = save_data
            .get("outputDir")
            .and_then(Value::as_str)
            .ok_or("Missing or invalid 'outputDir' in saveData")?;

        validate_save_games_path(Path::new(output_dir))?;

        let json_data = save_data
            .get("jsonData")
            .and_then(Value::as_object)
            .ok_or("Missing or invalid 'jsonData' in saveData")?;

        let json_value = Value::Object(json_data.clone());
        save_editor::edit_save_file(&json_value, output_dir)
    })
    .await
}

#[tauri::command]
pub async fn convert_sav_to_json(file_path: String) -> AppResult<Value> {
    run_blocking(move || {
        let path = Path::new(&file_path);
        validate_save_games_path(path)?;
        if !path.exists() {
            return Err(format!("File does not exist: {}", file_path).into());
        }

        let save = cli_handlers::parse_sav_file(path)?;
        // NOTE (uesave 0.7): serialize directly to a string to preserve field order
        // (header → schemas → root → extra); serde_json::to_value would reorder keys
        // alphabetically (BTreeMap) and break Deserialize on the way back.
        let json_string = serde_json::to_string_pretty(&save)
            .map_err(|e| format!("JSON formatting failed: {}", e))?;

        Ok(json!({
            "success": true,
            "json": json_string
        }))
    })
    .await
}

#[tauri::command]
pub async fn convert_json_to_sav(json_content: String, output_path: String) -> AppResult<Value> {
    run_blocking(move || {
        use std::io::{BufWriter, Write};

        let out_path = Path::new(&output_path);
        validate_save_games_path(out_path)?;
        if !output_path.to_lowercase().ends_with(".sav") {
            return Err("Output file must be .sav".to_string().into());
        }

        // Verify output directory exists
        if let Some(parent) = Path::new(&output_path).parent() {
            if !parent.exists() {
                return Err(
                    format!("Output directory does not exist: {}", parent.display()).into(),
                );
            }
        }

        // Parse JSON content
        let json_value: Value = serde_json::from_str(&json_content)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        // Validate JSON structure
        if json_value.get("root").is_none() {
            return Err("JSON data missing required root field".to_string().into());
        }
        if json_value.get("schemas").is_none() {
            return Err(
                "JSON data missing required schemas field (regenerate with convert_sav_to_json)"
                    .to_string()
                    .into(),
            );
        }

        // Rebuild Save object from JSON string (preserves field order for uesave 0.7)
        let save: uesave::Save = serde_json::from_str(&json_content)
            .map_err(|e| format!("Failed to rebuild Save object from JSON: {}", e))?;

        // Create output file (using buffered write)
        let file = fs::File::create(&output_path)
            .map_err(|e| format!("Failed to create output file: {}", e))?;
        let mut writer = BufWriter::with_capacity(16384, file);

        save.write(&mut writer)
            .map_err(|e| format!("Failed to write sav file: {:?}", e))?;

        writer
            .flush()
            .map_err(|e| format!("Failed to flush buffer: {}", e))?;

        Ok(json!({
            "success": true,
            "message": "JSON data successfully converted and saved to sav file"
        }))
    })
    .await
}

#[tauri::command]
pub async fn ensure_dir_exists(path: String) -> AppResult<()> {
    run_blocking(move || {
        let path = Path::new(&path);
        validate_save_games_path(path)?;

        if !path.exists() {
            fs::create_dir_all(path).map_err(|e| e.to_string())?;
        }
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn handle_new_save(save_data: new_save::SaveData) -> AppResult<()> {
    run_blocking(move || new_save::create_new_save(save_data)).await
}
