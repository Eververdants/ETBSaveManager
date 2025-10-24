mod cli_handlers;
mod encryption;
mod get_file_path;
mod new_save;
mod player_data;
mod save_editor;
mod save_utils;

use encryption::*;
use save_utils::SaveFileInfo;
use serde_json::{json, Value};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

// 辅助函数：获取MAINSAVE中的可见存档列表
fn get_visible_saves_list() -> Result<std::collections::HashSet<String>, String> {
    use std::env;
    use std::fs;
    use std::io::BufReader;
    use std::path::PathBuf;
    use uesave::{PropertyKey, Save};

    // 获取MAINSAVE文件的完整路径
    let local_appdata = env::var("LOCALAPPDATA").map_err(|e| e.to_string())?;
    let mainsave_path =
        PathBuf::from(local_appdata).join("EscapeTheBackrooms/Saved/SaveGames/MAINSAVE.sav");

    if !mainsave_path.exists() {
        println!("MAINSAVE.sav 文件不存在: {:?}，将返回空列表", mainsave_path);
        return Ok(std::collections::HashSet::new());
    }

    // 读取并解析MAINSAVE文件
    match fs::File::open(&mainsave_path) {
        Ok(file) => {
            let mut reader = BufReader::new(file);
            match Save::read(&mut reader) {
                Ok(mainsave) => {
                    // 查找 SingleplayerSaves 字段
                    let singleplayer_saves_key = PropertyKey(0, "SingleplayerSaves".to_string());
                    if let Some(singleplayer_saves_prop) =
                        mainsave.root.properties.0.get(&singleplayer_saves_key)
                    {
                        if let uesave::PropertyInner::Array(uesave::ValueArray::Base(
                            uesave::ValueVec::Str(ref existing_saves),
                        )) = &singleplayer_saves_prop.inner
                        {
                            // 返回可见的存档名称集合
                            Ok(existing_saves
                                .iter()
                                .cloned()
                                .collect::<std::collections::HashSet<String>>())
                        } else {
                            println!("MAINSAVE.sav 中 SingleplayerSaves 字段格式不正确");
                            Ok(std::collections::HashSet::new())
                        }
                    } else {
                        println!("MAINSAVE.sav 中未找到 SingleplayerSaves 字段");
                        Ok(std::collections::HashSet::new())
                    }
                }
                Err(e) => {
                    println!("解析 MAINSAVE.sav 失败: {:?}，将返回空列表", e);
                    Ok(std::collections::HashSet::new())
                }
            }
        }
        Err(e) => {
            println!("打开 MAINSAVE.sav 失败: {}，将返回空列表", e);
            Ok(std::collections::HashSet::new())
        }
    }
}

#[tauri::command]
async fn load_all_saves() -> Result<Vec<SaveFileInfo>, String> {
    let paths = get_file_path::list_save_paths()?;

    // 调试输出：显示识别到的所有存档路径
    println!("=== load_all_saves 调试信息 ===");
    println!("通过文件列表识别到的符合要求的存档路径:");
    for (i, path) in paths.iter().enumerate() {
        println!("  [{}] {}", i + 1, path.display());
    }
    println!("共识别到 {} 个存档", paths.len());

    // 获取可见存档列表
    let visible_saves = get_visible_saves_list()?;
    println!("MAINSAVE中的可见存档列表: {:?}", visible_saves);

    let mut result = Vec::new();

    for (i, path) in paths.iter().enumerate() {
        // 尝试解析每个存档文件，失败时跳过
        match cli_handlers::parse_sav_file(path) {
            Ok(save) => {
                let save_json = serde_json::to_value(&save).map_err(|e| e.to_string())?;

                // 提取所需字段
                let current_level = cli_handlers::extract_current_level(&save_json);
                let actual_difficulty = cli_handlers::extract_difficulty_label(&save_json);
                let date = cli_handlers::get_modified_date(path)?;

                // 获取存档名称（不含路径）
                let file_name = path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or("unknown");
                let save_name_without_ext = file_name.trim_end_matches(".sav");

                // 判断存档是否可见
                let is_visible = visible_saves.contains(&save_name_without_ext.to_string());
                println!(
                    "存档 {} 的可见性: {} (在MAINSAVE列表中: {})",
                    save_name_without_ext,
                    is_visible,
                    visible_saves.contains(&save_name_without_ext.to_string())
                );

                // 构建保存信息
                match save_utils::build_save_info(
                    (i + 1) as u32,
                    path,
                    current_level,
                    actual_difficulty,
                    date,
                ) {
                    Ok(mut info) => {
                        // 设置可见性状态
                        info.is_visible = Some(is_visible);
                        result.push(info);
                    }
                    Err(e) => {
                        eprintln!("跳过存档 {}: 构建信息失败 - {}", path.display(), e);
                    }
                }
            }
            Err(e) => {
                eprintln!("跳过存档 {}: 解析失败 - {}", path.display(), e);
                // 继续处理下一个存档
            }
        }
    }

    Ok(result)
}

#[tauri::command]
fn delete_file(file_path: String) -> Result<(), String> {
    // 获取文件名（用于更新MAINSAVE）
    let path = Path::new(&file_path);
    let filename = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or("无效的文件路径")?;

    // 删除文件
    match fs::remove_file(&file_path) {
        Ok(_) => {
            println!("✅ 已删除文件: {}", file_path);

            // 更新 MAINSAVE.sav 文件（从列表中移除存档记录）
            match save_editor::update_mainsave_after_delete(filename) {
                Ok(_) => {
                    println!("✅ 已更新 MAINSAVE.sav 文件，移除存档记录: {}", filename);
                    Ok(())
                }
                Err(e) => {
                    println!("⚠️ 更新 MAINSAVE.sav 文件失败: {}，但文件已删除", e);
                    // 即使更新MAINSAVE失败，也返回成功，因为主要操作（删除文件）已完成
                    Ok(())
                }
            }
        }
        Err(e) => Err(format!("Failed to delete file: {}", e)),
    }
}

#[tauri::command]
fn open_save_games_folder() -> Result<(), String> {
    use std::env;
    use std::path::PathBuf;
    use std::process::Command;

    let local_appdata = env::var("LOCALAPPDATA").map_err(|e| e.to_string())?;
    let save_games_path = PathBuf::from(local_appdata).join("EscapeTheBackrooms\\Saved\\SaveGames");

    println!("尝试打开文件夹: {}", save_games_path.display());

    if !save_games_path.exists() {
        println!("存档目录不存在: {}", save_games_path.display());
        return Err(format!("存档目录不存在: {}", save_games_path.display()));
    }

    // 使用系统默认文件管理器打开目录
    let path_str = save_games_path.to_str().ok_or("无效路径")?;
    println!("正在打开路径: {}", path_str);

    #[cfg(target_os = "windows")]
    {
        let result = Command::new("explorer")
            .arg(path_str)
            .spawn()
            .map_err(|e| format!("无法打开文件夹: {}", e))?;
        println!("Windows Explorer启动成功: {:?}", result);
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path_str)
            .spawn()
            .map_err(|e| format!("无法打开文件夹: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(path_str)
            .spawn()
            .map_err(|e| format!("无法打开文件夹: {}", e))?;
    }

    Ok(())
}

// 注意：is_subdirectory_of 函数已移除，存档可见性现在基于 MAINSAVE 列表判断

#[tauri::command]
fn handle_file(
    file_path: String,
    action: Option<String>,
    archive_name: Option<String>,
) -> Result<String, String> {
    println!(
        "Received file path: {}, action: {:?}, archive_name: {:?}",
        file_path, action, archive_name
    );

    // 处理读取MAINSAVE文件的特殊请求
    if action == Some("read".to_string()) && file_path == "MAINSAVE.sav" {
        // 获取MAINSAVE文件的完整路径
        let local_appdata = env::var("LOCALAPPDATA").map_err(|e| e.to_string())?;
        let mainsave_path =
            PathBuf::from(local_appdata).join("EscapeTheBackrooms/Saved/SaveGames/MAINSAVE.sav");

        if !mainsave_path.exists() {
            println!("MAINSAVE.sav 文件不存在: {:?}", mainsave_path);
            return Err("MAINSAVE file does not exist".to_string());
        }

        // 读取并解析MAINSAVE文件
        use std::fs;
        use std::io::BufReader;
        use uesave::{PropertyKey, Save};

        match fs::File::open(&mainsave_path) {
            Ok(file) => {
                let mut reader = BufReader::new(file);
                match Save::read(&mut reader) {
                    Ok(mainsave) => {
                        // 查找 SingleplayerSaves 字段
                        let singleplayer_saves_key =
                            PropertyKey(0, "SingleplayerSaves".to_string());
                        if let Some(singleplayer_saves_prop) =
                            mainsave.root.properties.0.get(&singleplayer_saves_key)
                        {
                            if let uesave::PropertyInner::Array(uesave::ValueArray::Base(
                                uesave::ValueVec::Str(ref existing_saves),
                            )) = &singleplayer_saves_prop.inner
                            {
                                // 返回可见的存档列表
                                let visible_saves: Vec<String> =
                                    existing_saves.iter().cloned().collect();
                                return Ok(serde_json::to_string(&visible_saves)
                                    .map_err(|e| e.to_string())?);
                            }
                        }
                        // 如果没有找到SingleplayerSaves字段，返回空数组
                        return Ok(serde_json::to_string(&Vec::<String>::new())
                            .map_err(|e| e.to_string())?);
                    }
                    Err(e) => {
                        println!("解析 MAINSAVE.sav 失败: {:?}", e);
                        return Err(format!("Failed to parse MAINSAVE: {}", e));
                    }
                }
            }
            Err(e) => {
                println!("打开 MAINSAVE.sav 失败: {}", e);
                return Err(format!("Failed to open MAINSAVE: {}", e));
            }
        }
    }

    // 用户传入的文件路径
    let file_path = PathBuf::from(file_path);
    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }

    // 获取文件名（用于MAINSAVE更新）
    let file_name = file_path
        .file_name()
        .ok_or("Invalid file name")?
        .to_str()
        .ok_or("Invalid file name encoding")?;

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

    // 获取文件所在目录（不再用于可见性判断，但保留用于其他用途）
    let _file_parent = file_path.parent().ok_or("Invalid file path")?;

    // 处理切换可见性请求
    if action == Some("toggle_visibility".to_string()) {
        // 检查当前存档是否在 MAINSAVE 列表中
        let visible_saves = get_visible_saves_list().unwrap_or_default();
        let archive_name = file_name.trim_end_matches(".sav");
        
        if visible_saves.contains(&archive_name.to_string()) {
            println!("🔄 隐藏存档 - 存档当前在 MAINSAVE 列表中，需要从列表移除");

            // 从 MAINSAVE.sav 文件的存档列表中移除
            match save_editor::hide_archive_in_mainsave(file_name) {
                Ok(_) => println!("✅ 成功从 MAINSAVE 列表中移除存档: {}", file_name),
                Err(e) => {
                    println!("⚠️ 从 MAINSAVE 列表中移除存档失败: {}", e);
                    return Err(format!("Failed to hide archive from MAINSAVE: {}", e));
                }
            }

            // 返回成功状态
            return Ok(json!({"success": true}).to_string());
        } else {
            println!("🔄 显示存档 - 存档当前不在 MAINSAVE 列表中，需要添加到列表");

            // 添加到 MAINSAVE.sav 文件的存档列表中
            match save_editor::show_archive_in_mainsave(file_name) {
                Ok(_) => println!("✅ 成功添加存档到 MAINSAVE 列表: {}", file_name),
                Err(e) => {
                    println!("⚠️ 添加存档到 MAINSAVE 列表失败: {}", e);
                    return Err(format!("Failed to show archive in MAINSAVE: {}", e));
                }
            }

            // 返回成功状态
            return Ok(json!({"success": true}).to_string());
        }
    }

    // 处理旧的显示/隐藏逻辑（向后兼容）
    // 检查当前存档是否在 MAINSAVE 列表中
    let visible_saves = get_visible_saves_list().unwrap_or_default();
    let archive_name = file_name.trim_end_matches(".sav");
    
    if visible_saves.contains(&archive_name.to_string()) {
        println!("🔄 隐藏存档 - 存档当前在 MAINSAVE 列表中，需要从列表移除");

        // 从 MAINSAVE.sav 文件的存档列表中移除
        match save_editor::hide_archive_in_mainsave(file_name) {
            Ok(_) => println!("✅ 成功从 MAINSAVE 列表中移除存档: {}", file_name),
            Err(e) => println!("⚠️ 从 MAINSAVE 列表中移除存档失败: {}", e),
        }

        // 返回原始文件路径（文件位置不变）
        Ok(file_path.to_str().unwrap().to_string())
    } else {
        println!("🔄 显示存档 - 存档当前不在 MAINSAVE 列表中，需要添加到列表");

        // 添加到 MAINSAVE.sav 文件的存档列表中
        match save_editor::show_archive_in_mainsave(file_name) {
            Ok(_) => println!("✅ 成功添加存档到 MAINSAVE 列表: {}", file_name),
            Err(e) => println!("⚠️ 添加存档到 MAINSAVE 列表失败: {}", e),
        }

        // 返回原始文件路径（文件位置不变）
        Ok(file_path.to_str().unwrap().to_string())
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
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
            open_save_games_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
