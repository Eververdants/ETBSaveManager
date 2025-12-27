mod cli_handlers;
mod common;
mod encryption;
mod get_file_path;
mod gpu_settings;
mod new_save;
mod player_data;
mod save_editor;
mod save_utils;
mod steam_api;

use common::{
    add_save_to_mainsave, extract_archive_name, get_save_games_dir, get_visible_saves_set,
    remove_save_from_mainsave,
};
use encryption::*;
use rayon::prelude::*;
use save_utils::SaveFileInfo;
use serde_json::{json, Value};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Instant;

#[tauri::command]
async fn load_all_saves() -> Result<Vec<SaveFileInfo>, String> {
    let start_time = Instant::now();

    // 并行获取文件列表和可见存档集合
    let (paths_result, visible_saves_result) = rayon::join(
        || get_file_path::list_save_paths(),
        || get_visible_saves_set(),
    );

    let paths = paths_result?;
    let visible_saves = Arc::new(visible_saves_result?);

    let path_count = paths.len();
    println!(
        "=== load_all_saves: 共 {} 个存档，开始并行加载 ===",
        path_count
    );

    // 使用 rayon 并行处理所有存档文件
    let results: Vec<Option<SaveFileInfo>> = paths
        .into_par_iter()
        .enumerate()
        .map(|(i, path)| {
            // 解析存档文件
            let save = match cli_handlers::parse_sav_file(&path) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("跳过存档 {}: {}", path.display(), e);
                    return None;
                }
            };

            // 转换为 JSON 并提取信息
            let save_json = match serde_json::to_value(&save) {
                Ok(j) => j,
                Err(e) => {
                    eprintln!("JSON转换失败 {}: {}", path.display(), e);
                    return None;
                }
            };

            let current_level = cli_handlers::extract_current_level(&save_json);
            let actual_difficulty = cli_handlers::extract_difficulty_label(&save_json);

            let date = match cli_handlers::get_modified_date(&path) {
                Ok(d) => d,
                Err(e) => {
                    eprintln!("获取日期失败 {}: {}", path.display(), e);
                    return None;
                }
            };

            let file_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown");
            let save_name = extract_archive_name(file_name);
            let is_visible = visible_saves.contains(save_name);

            match save_utils::build_save_info(
                (i + 1) as u32,
                &path,
                current_level,
                actual_difficulty,
                date,
            ) {
                Ok(mut info) => {
                    info.is_visible = Some(is_visible);
                    Some(info)
                }
                Err(e) => {
                    eprintln!("跳过存档 {}: {}", path.display(), e);
                    None
                }
            }
        })
        .collect();

    // 过滤掉 None 值
    let result: Vec<SaveFileInfo> = results.into_iter().flatten().collect();

    let elapsed = start_time.elapsed();
    println!(
        "=== load_all_saves 完成: 成功加载 {}/{} 个存档，耗时 {:.2}ms ===",
        result.len(),
        path_count,
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(result)
}

#[tauri::command]
fn delete_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    let filename = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("无效的文件路径")?;

    fs::remove_file(&file_path).map_err(|e| format!("删除文件失败: {}", e))?;
    println!("✅ 已删除文件: {}", file_path);

    // 从 MAINSAVE 中移除记录（失败不影响主操作）
    let archive_name = extract_archive_name(filename);
    if let Err(e) = remove_save_from_mainsave(archive_name) {
        println!("⚠️ 更新 MAINSAVE 失败: {}", e);
    }

    Ok(())
}

#[tauri::command]
fn open_save_games_folder() -> Result<(), String> {
    use std::process::Command;

    let save_games_path = get_save_games_dir()?;

    println!("尝试打开存档文件夹: {}", save_games_path.display());

    if !save_games_path.exists() {
        return Err(format!("存档目录不存在: {}", save_games_path.display()));
    }

    #[cfg(target_os = "windows")]
    {
        // 使用 explorer /e,<path> 格式确保以资源管理器模式打开指定文件夹
        let path_str = save_games_path.to_str().ok_or("路径包含无效字符")?;

        Command::new("explorer")
            .args(["/e,", path_str])
            .spawn()
            .map_err(|e| format!("无法打开文件夹: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    Command::new("open")
        .arg(&save_games_path)
        .spawn()
        .map_err(|e| format!("无法打开文件夹: {}", e))?;

    #[cfg(target_os = "linux")]
    Command::new("xdg-open")
        .arg(&save_games_path)
        .spawn()
        .map_err(|e| format!("无法打开文件夹: {}", e))?;

    Ok(())
}

#[tauri::command]
fn handle_file(
    file_path: String,
    action: Option<String>,
    _archive_name: Option<String>,
) -> Result<String, String> {
    // 处理读取 MAINSAVE 文件的特殊请求
    if action.as_deref() == Some("read") && file_path == "MAINSAVE.sav" {
        let visible_saves: Vec<String> = get_visible_saves_set()?.into_iter().collect();
        return serde_json::to_string(&visible_saves).map_err(|e| e.to_string());
    }

    let file_path = PathBuf::from(&file_path);
    if !file_path.exists() {
        return Err("文件不存在".to_string());
    }

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
    let save_data = json_input
        .get("saveData")
        .ok_or("Missing 'saveData' in input")?;

    let output_dir = save_data
        .get("outputDir")
        .and_then(|v| v.as_str())
        .ok_or("Missing or invalid 'outputDir' in saveData")?;

    let json_data = save_data
        .get("jsonData")
        .and_then(|v| v.as_object())
        .ok_or("Missing or invalid 'jsonData' in saveData")?;

    // 将 serde_json::Map 转换为 serde_json::Value::Object
    let json_value = serde_json::Value::Object(json_data.clone());

    save_editor::edit_save_file(&json_value, output_dir)
}

#[tauri::command]
fn convert_sav_to_json(file_path: String) -> Result<Value, String> {
    use std::path::Path;

    println!("🔄 开始转换sav文件到JSON: {}", file_path);

    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    // 复用优化后的 parse_sav_file 函数
    let save = cli_handlers::parse_sav_file(path)?;

    // 转换为JSON值
    let save_json = serde_json::to_value(&save).map_err(|e| format!("转换为JSON失败: {}", e))?;

    // 使用pretty格式输出，便于阅读和编辑
    let json_string =
        serde_json::to_string_pretty(&save_json).map_err(|e| format!("JSON格式化失败: {}", e))?;

    println!("✅ sav文件成功转换为JSON，长度: {}字符", json_string.len());

    // 返回包含json字段的对象，符合前端期望
    Ok(json!({
        "success": true,
        "json": json_string
    }))
}

#[tauri::command]
fn convert_json_to_sav(json_content: String, output_path: String) -> Result<Value, String> {
    use std::fs::File;
    use std::io::{BufWriter, Write};
    use std::path::Path;

    println!("🔄 开始将JSON转换回sav文件: {}", output_path);

    // 验证输出目录是否存在
    if let Some(parent) = Path::new(&output_path).parent() {
        if !parent.exists() {
            return Err(format!("输出目录不存在: {}", parent.display()));
        }
    }

    // 解析JSON内容
    let json_value: serde_json::Value =
        serde_json::from_str(&json_content).map_err(|e| format!("JSON解析失败: {}", e))?;

    // 验证JSON结构是否包含必要的root字段
    if !json_value.get("root").is_some() {
        return Err("JSON数据缺少必要的root字段".to_string());
    }

    // 从JSON重建Save对象 - 使用serde_json::from_value
    let save: uesave::Save = serde_json::from_value(json_value.clone())
        .map_err(|e| format!("从JSON重建Save对象失败: {}", e))?;

    // 创建输出文件
    let file = File::create(&output_path).map_err(|e| format!("创建输出文件失败: {}", e))?;
    let mut writer = BufWriter::new(file);

    // 写入sav文件 - 使用与save_editor相同的方式
    save.write(&mut writer)
        .map_err(|e| format!("写入sav文件失败: {:?}", e))?;

    // 确保数据完全写入磁盘
    writer
        .flush()
        .map_err(|e| format!("刷新缓冲区失败: {}", e))?;

    println!("✅ JSON数据成功转换并保存到sav文件: {}", output_path);

    // 返回包含success字段的对象，符合前端期望
    Ok(json!({
        "success": true,
        "message": "JSON数据成功转换并保存到sav文件"
    }))
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

#[tauri::command]
fn handle_new_save(save_data: new_save::SaveData) -> Result<(), String> {
    new_save::create_new_save(save_data)
}

#[tauri::command]
fn restart_app(app: tauri::AppHandle) -> Result<(), String> {
    // 使用Tauri 2.0的API重启应用
    app.restart();
}

#[tauri::command]
fn set_window_title(title: String, window: tauri::Window) {
    window
        .set_title(&title)
        .expect("Failed to set window title");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 获取GPU加速设置
    let browser_args = gpu_settings::get_browser_args();
    let args_string = browser_args.join(" ");
    println!("应用GPU加速设置: {}", args_string);

    // 构建Tauri应用
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
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
            ensure_dir_exists,
            handle_new_save,
            open_save_games_folder,
            gpu_settings::get_gpu_acceleration_status,
            gpu_settings::set_gpu_acceleration,
            restart_app,
            convert_sav_to_json,
            convert_json_to_sav,
            steam_api::encrypt_steam_api_key,
            steam_api::decrypt_steam_api_key,
            steam_api::save_steam_api_key,
            steam_api::test_steam_api_key,
            steam_api::clear_steam_cache,
            steam_api::get_steam_cache_count,
            steam_api::get_all_steam_cache_entries,
            steam_api::cleanup_expired_steam_cache,
            steam_api::get_steam_usernames_command,
            set_window_title
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
