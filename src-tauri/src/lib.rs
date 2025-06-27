mod cli_handlers;
mod get_file_path;
mod save_utils;

use save_utils::SaveFileInfo;
use std::fs;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_all_saves, delete_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
