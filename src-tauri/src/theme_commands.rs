// Theme Commands Module (simplified)
// Only keeps active theme config persistence for built-in theme switching

use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};

use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ThemeConfig {
    pub version: u32,
    pub active_theme_id: Option<String>,
}

fn get_config_path(app: &AppHandle) -> AppResult<std::path::PathBuf> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }
    Ok(app_data_dir.join("theme-config.json"))
}

#[tauri::command]
pub async fn get_theme_config(app: AppHandle) -> AppResult<ThemeConfig> {
    let config_path = get_config_path(&app)?;
    if !config_path.exists() {
        return Ok(ThemeConfig::default());
    }
    let content =
        fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;
    Ok(serde_json::from_str(&content).map_err(|_| "Config file corrupted".to_string())?)
}

#[tauri::command]
pub async fn set_active_theme(app: AppHandle, theme_id: String) -> AppResult<()> {
    let config_path = get_config_path(&app)?;
    let config = ThemeConfig {
        version: 1,
        active_theme_id: Some(theme_id.clone()),
    };
    let json =
        serde_json::to_string_pretty(&config).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&config_path, json).map_err(|e| format!("Failed to save config: {}", e))?;
    println!("Active theme: {}", theme_id);
    Ok(())
}
