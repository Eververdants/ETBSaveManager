//! 存档文件夹（整理分组）持久化 — 应用配置目录 archive_folders.json
//!
//! 文件夹是应用层的组织视图：folders 存分组定义，assignments 以存档
//! 文件路径（小写归一）为键记录归属，不触碰游戏存档文件本身。

use crate::common::get_app_config_dir;
use crate::error::AppResult;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

const FOLDERS_FILE: &str = "archive_folders.json";

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveFolderFile {
    #[serde(default)]
    pub folders: Vec<ArchiveFolderEntry>,
    /// 存档文件路径（小写）→ 文件夹 id
    #[serde(default)]
    pub assignments: HashMap<String, String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveFolderEntry {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub created_at: i64,
    #[serde(default)]
    pub parent_id: Option<String>,
}

fn config_path() -> AppResult<std::path::PathBuf> {
    Ok(get_app_config_dir()?.join(FOLDERS_FILE))
}

/// 读取文件夹配置；文件不存在或损坏时返回空配置（首次使用零开销）
#[tauri::command]
pub fn load_archive_folders() -> AppResult<ArchiveFolderFile> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(ArchiveFolderFile::default());
    }

    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read archive folders: {}", e))?;
    let data: ArchiveFolderFile = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse archive folders: {}", e))?;

    tracing::info!(
        "Loaded archive folders: {} folders, {} assignments",
        data.folders.len(),
        data.assignments.len()
    );
    Ok(data)
}

/// 整体覆写保存文件夹配置
#[tauri::command]
pub fn save_archive_folders(data: ArchiveFolderFile) -> AppResult<()> {
    let path = config_path()?;
    if let Some(dir) = path.parent() {
        if !dir.exists() {
            fs::create_dir_all(dir).map_err(|e| format!("Failed to create config directory: {}", e))?;
        }
    }

    let content = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize archive folders: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to write archive folders: {}", e))?;

    tracing::debug!(
        "Saved archive folders: {} folders, {} assignments",
        data.folders.len(),
        data.assignments.len()
    );
    Ok(())
}
