mod cli_handlers;
mod encryption;
mod get_file_path;
mod player_data;
mod save_utils;
mod save_editor;

use encryption::*;
use save_utils::SaveFileInfo;
use serde_json::{json, Value};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

#[tauri::command]
async fn load_all_saves() -> Result<Vec<SaveFileInfo>, String> {
    let paths = get_file_path::list_save_paths()?;
    let mut result = Vec::new();

    for (i, path) in paths.iter().enumerate() {
        // 解析存档文件并获取 Save 对象
        let save = cli_handlers::parse_sav_file(path)?; // 返回可能是 Save 结构体

        let save_json = serde_json::to_value(&save).map_err(|e| e.to_string())?;

        // 提取所需字段
        let current_level = cli_handlers::extract_current_level(&save_json);

        let actual_difficulty = cli_handlers::extract_difficulty_label(&save_json); // 现在接受 &Value

        let date = cli_handlers::get_modified_date(path)?;

        // 构建保存信息
        let info = save_utils::build_save_info(
            (i + 1) as u32,
            path,
            current_level,
            actual_difficulty,
            date,
        );
        result.push(info);
    }

    Ok(result)
}

#[tauri::command]
fn delete_file(file_path: String) -> Result<(), String> {
    match fs::remove_file(&file_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to delete file: {}", e)),
    }
}

// 工具函数：判断一个路径是否是某个目录或其子目录内的路径
fn is_subdirectory_of(child: &Path, parent: &Path) -> bool {
    if let Ok(canonical_child) = fs::canonicalize(child) {
        if let Ok(canonical_parent) = fs::canonicalize(parent) {
            return canonical_child.starts_with(canonical_parent);
        }
    }
    false
}

#[tauri::command]
fn handle_file(file_path: String) -> Result<String, String> {
    println!("Received file path: {}", file_path);

    // 定义基础路径
    let local_appdata = env::var("LOCALAPPDATA").map_err(|e| e.to_string())?;
    let base_dir = PathBuf::from(local_appdata).join("EscapeTheBackrooms/Saved/SaveGames");

    // 确保基础目录存在
    if !base_dir.exists() {
        return Err("Base directory does not exist".to_string());
    }

    // 创建 HiddenFiles 文件夹（如果不存在）
    let hidden_dir = base_dir.join("HiddenFiles");
    if !hidden_dir.exists() {
        fs::create_dir(&hidden_dir).map_err(|e| format!("Failed to create HiddenFiles: {}", e))?;
    }

    // 用户传入的文件路径
    let file_path = PathBuf::from(file_path);
    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }

    // 获取文件所在目录
    let file_parent = file_path.parent().ok_or("Invalid file path")?;

    // 检查文件是否位于其子目录中
    if is_subdirectory_of(file_parent, &hidden_dir) {
        let file_name = file_path.file_name().ok_or("Invalid file name")?;
        let dest_path = base_dir.join(file_name);

        // 如果目标已存在同名文件，先删除它（可选）
        if dest_path.exists() {
            fs::remove_file(&dest_path)
                .map_err(|e| format!("Failed to remove existing file: {}", e))?;
        }

        fs::rename(&file_path, &dest_path)
            .map_err(|e| format!("Failed to move file to base_dir: {}", e))?;

        Ok(dest_path.to_str().unwrap().to_string())
    } else {
        println!("Moving file to HiddenFiles...");
        // 否则移动到 HiddenFiles
        let file_name = file_path.file_name().ok_or("Invalid file name")?;
        let dest_path = hidden_dir.join(file_name);

        // 如果目标已存在同名文件，先删除它（可选）
        if dest_path.exists() {
            fs::remove_file(&dest_path)
                .map_err(|e| format!("Failed to remove existing file: {}", e))?;
        }

        fs::rename(&file_path, &dest_path).map_err(|e| format!("Failed to move file: {}", e))?;

        Ok(dest_path.to_str().unwrap().to_string())
    }
}

#[tauri::command]
fn init_config_command(password: String, custom_dir: Option<String>) -> Result<(), String> {
    init_config(&password, custom_dir.as_deref())
}

#[tauri::command]
fn load_master_key_command(custom_dir: Option<String>) -> Result<[u8; 32], String> {
    let key = encryption::load_master_key(custom_dir.as_deref())?;
    Ok(*key)
}

#[tauri::command]
fn encrypt_file_command(
    master_key: [u8; 32],
    input_path: String,
    output_path: String,
) -> Result<(), String> {
    encryption::encrypt_file(&master_key, &input_path, &output_path)
}

#[tauri::command]
fn decrypt_file_command(
    master_key: [u8; 32],
    input_path: String,
    output_path: String,
) -> Result<(), String> {
    encryption::decrypt_file(&master_key, &input_path, &output_path)
}

#[tauri::command]
fn clear_saved_password_command() -> Result<(), String> {
    encryption::clear_saved_password()
}

#[tauri::command]
fn get_player_data(file_path: String) -> Result<Value, String> {
    let path = Path::new(&file_path); // 将 String 转换为 &Path
    let save = cli_handlers::parse_sav_file(path)?; // 传入 &Path 参数
    let save_json = serde_json::to_value(&save).map_err(|e| e.to_string())?;

    let (ids, sanities, inventories) = player_data::extract_player_data(&save_json);

    // 构造返回的 JSON 对象
    Ok(json!({
        "ids": ids,
        "sanities": sanities,
        "inventories": inventories
    }))
}

#[tauri::command]
fn handle_edit_save(json_input: Value) -> Result<String, String> {
    let save_data = json_input.get("saveData")
        .ok_or("Missing 'saveData' in input")?;

    let output_dir = save_data.get("outputDir")
        .and_then(|v| v.as_str())
        .ok_or("Missing or invalid 'outputDir' in saveData")?;

    let json_data = save_data.get("jsonData")
        .and_then(|v| v.as_object())
        .ok_or("Missing or invalid 'jsonData' in saveData")?;

    // 将 serde_json::Map 转换为 serde_json::Value::Object
    let json_value = serde_json::Value::Object(json_data.clone());

    save_editor::edit_save_file(&json_value, output_dir)
}

#[tauri::command]
fn get_local_appdata() -> Result<String, String> {
    env::var("LOCALAPPDATA").map_err(|e| e.to_string())
}

#[tauri::command]
fn ensure_dir_exists(path: String) -> Result<(), String> {
    if !Path::new(&path).exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_all_saves,
            delete_file,
            handle_file,
            init_config_command,
            load_master_key_command,
            encrypt_file_command,
            decrypt_file_command,
            clear_saved_password_command,
            get_player_data,
            handle_edit_save,
            get_local_appdata,
            ensure_dir_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
