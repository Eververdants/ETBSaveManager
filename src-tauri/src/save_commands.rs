use crate::cli_handlers;
use crate::common::{
    add_save_to_mainsave, extract_archive_name, get_save_games_dir, get_visible_saves_set,
    remove_save_from_mainsave, validate_save_games_path,
};
use crate::error::AppResult;
use crate::feedback_commands;
use crate::get_file_path;
use crate::new_save;
use crate::player_data;
use crate::save_editor;
use crate::save_utils;
use crate::save_utils::SaveFileInfo;
use rayon::prelude::*;
use serde_json::{json, Value};
use std::borrow::Cow;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Instant;
use tauri::State;

#[tauri::command]
pub async fn load_all_saves(
    log_state: State<'_, feedback_commands::BackendLogState>,
) -> AppResult<Vec<SaveFileInfo>> {
    let start_time = Instant::now();

    // 并行获取文件列表和可见存档集合
    let (paths_result, visible_saves_result) = rayon::join(
        || get_file_path::list_save_paths(),
        || get_visible_saves_set(),
    );

    let paths = paths_result?;
    let visible_saves = Arc::new(visible_saves_result?);
    let path_count = paths.len();

    // 使用 rayon 并行处理所有存档文件
    let results: Vec<SaveFileInfo> = paths
        .into_par_iter()
        .enumerate()
        .filter_map(|(i, path)| process_save_file(i, &path, &visible_saves))
        .collect();

    let elapsed = start_time.elapsed();
    log_state.add_log(
        "info",
        &format!(
            "load_all_saves: {}/{} saves, took {:.2}ms",
            results.len(),
            path_count,
            elapsed.as_secs_f64() * 1000.0
        ),
    );

    Ok(results)
}

/// 处理单个存档文件（优化版）
#[inline]
fn process_save_file(
    index: usize,
    path: &PathBuf,
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
pub fn delete_file(file_path: String) -> AppResult<()> {
    let path = Path::new(&file_path);
    let filename = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid file path")?;

    if !filename.to_lowercase().ends_with(".sav") {
        return Err("Only .sav save files can be deleted".to_string().into());
    }

    validate_save_games_path(path)?;

    fs::remove_file(&file_path)
        .map_err(|e| format!("删除文件失败: {}", e))?;

    // 从 MAINSAVE 中移除记录（失败不影响主操作）
    let _ = remove_save_from_mainsave(extract_archive_name(filename));

    Ok(())
}

#[tauri::command]
pub fn open_save_games_folder() -> AppResult<()> {
    use std::process::Command;

    let save_games_path = get_save_games_dir()?;

    if !save_games_path.exists() {
        return Err(format!("Save directory does not exist: {}", save_games_path.display()).into());
    }

    #[cfg(target_os = "windows")]
    {
        // Windows needs backslash paths
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
}

#[tauri::command]
pub fn handle_file(
    file_path: String,
    action: Option<String>,
    _archive_name: Option<String>,
) -> AppResult<String> {
    // 处理读取 MAINSAVE 文件的特殊请求
    if action.as_deref() == Some("read") && file_path == "MAINSAVE.sav" {
        let visible_saves: Vec<String> = get_visible_saves_set()?.into_iter().collect();
        return Ok(serde_json::to_string(&visible_saves)?);
    }

    let file_path = PathBuf::from(&file_path);
    if !file_path.exists() {
        return Err("文件不存在".to_string().into());
    }

    validate_save_games_path(&file_path)?;

    let file_name = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("无效的文件名")?;
    let archive_name = extract_archive_name(file_name);

    // 获取当前可见性状态并切换
    let visible_saves = get_visible_saves_set().unwrap_or_default();
    let is_visible = visible_saves.contains(archive_name);

    if is_visible {
        remove_save_from_mainsave(archive_name)?;
    } else {
        add_save_to_mainsave(archive_name)?;
    }

    if action.as_deref() == Some("toggle_visibility") {
        return Ok(json!({"success": true}).to_string());
    }

    Ok(file_path.to_str().unwrap_or_default().to_string())
}

#[tauri::command]
pub fn get_player_data(file_path: String) -> AppResult<Value> {
    let path = Path::new(&file_path);
    validate_save_games_path(path)?;
    let save = cli_handlers::parse_sav_file(path)?;
    let save_json = serde_json::to_value(&save)?;

    let (ids, sanities, inventories) = player_data::extract_player_data(&save_json);

    Ok(json!({
        "ids": ids,
        "sanities": sanities,
        "inventories": inventories
    }))
}

#[tauri::command]
pub fn unlock_all_hub_doors(file_path: String) -> AppResult<String> {
    validate_save_games_path(Path::new(&file_path))?;
    Ok(save_editor::unlock_all_hub_doors(&file_path)?)
}

#[tauri::command]
pub fn handle_edit_save(json_input: Value) -> AppResult<String> {
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
    Ok(save_editor::edit_save_file(&json_value, output_dir)? )
}

#[tauri::command]
pub fn convert_sav_to_json(file_path: String) -> AppResult<Value> {
    let path = Path::new(&file_path);
    validate_save_games_path(path)?;
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path).into());
    }

    let save = cli_handlers::parse_sav_file(path)?;
    let save_json = serde_json::to_value(&save).map_err(|e| format!("Failed to convert to JSON: {}", e))?;
    let json_string = serde_json::to_string_pretty(&save_json)
        .map_err(|e| format!("JSON格式化失败: {}", e))?;

    Ok(json!({
        "success": true,
        "json": json_string
    }))
}

#[tauri::command]
pub fn convert_json_to_sav(json_content: String, output_path: String) -> AppResult<Value> {
    use std::io::{BufWriter, Write};

    let out_path = Path::new(&output_path);
    validate_save_games_path(out_path)?;
    if !output_path.to_lowercase().ends_with(".sav") {
        return Err("Output file must be .sav".to_string().into());
    }

    // Verify output directory exists
    if let Some(parent) = Path::new(&output_path).parent() {
        if !parent.exists() {
            return Err(format!("Output directory does not exist: {}", parent.display()).into());
        }
    }

    // Parse JSON content
    let json_value: Value = serde_json::from_str(&json_content)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    // Validate JSON structure
    if json_value.get("root").is_none() {
        return Err("JSON data missing required root field".to_string().into());
    }

    // Rebuild Save object from JSON
    let save: uesave::Save = serde_json::from_value(json_value)
        .map_err(|e| format!("Failed to rebuild Save object from JSON: {}", e))?;

    // Create output file (using buffered write)
    let file = fs::File::create(&output_path).map_err(|e| format!("Failed to create output file: {}", e))?;
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
}

#[tauri::command]
pub fn ensure_dir_exists(path: String) -> AppResult<()> {
    let path = Path::new(&path);
    validate_save_games_path(path)?;

    if !path.exists() {
        fs::create_dir_all(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn handle_new_save(save_data: new_save::SaveData) -> AppResult<()> {
    Ok(new_save::create_new_save(save_data)?)
}
