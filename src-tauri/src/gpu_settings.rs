use crate::common::get_app_config_dir;
use crate::error::AppResult;
use serde_json::Value;
use std::fs;

/// Browser arguments when GPU acceleration is enabled
const GPU_ENABLED_ARGS: &[&str] = &[
    "--disable-software-rasterizer",
    "--enable-gpu-rasterization",
    "--force-gpu-rasterization",
];

/// Browser arguments when GPU acceleration is disabled
const GPU_DISABLED_ARGS: &[&str] = &[
    "--disable-gpu",
    "--disable-software-rasterizer",
];

/// Get current GPU acceleration setting status
#[tauri::command]
pub fn get_gpu_acceleration_status() -> AppResult<bool> {
    let config_file = get_app_config_dir()?.join("gpu_config.json");

    if !config_file.exists() {
        return Ok(false);
    }

    let content =
        fs::read_to_string(&config_file).map_err(|e| format!("Failed to read GPU config: {}", e))?;

    let config: Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse GPU config: {}", e))?;

    Ok(config
        .get("gpuAccelerationDisabled")
        .and_then(Value::as_bool)
        .unwrap_or(false))
}

/// Set GPU acceleration state
/// Returns whether app restart is required for changes to take effect
#[tauri::command]
pub fn set_gpu_acceleration(disabled: bool) -> AppResult<bool> {
    let config_dir = get_app_config_dir()?;
    let config_file = config_dir.join("gpu_config.json");

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    // Check if configuration has changed
    let current_status = get_gpu_acceleration_status().unwrap_or(false);
    let needs_restart = current_status != disabled;

    let config = serde_json::json!({ "gpuAccelerationDisabled": disabled });
    let content =
        serde_json::to_string_pretty(&config).map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_file, content).map_err(|e| format!("Failed to write GPU config: {}", e))?;

    println!(
        "✅ GPU acceleration settings updated: disabled={}, needs_restart={}",
        disabled, needs_restart
    );

    Ok(needs_restart)
}

/// Get browser arguments for current GPU acceleration setting
pub fn get_browser_args() -> Vec<String> {
    let disabled = get_gpu_acceleration_status().unwrap_or(false);

    let args = if disabled {
        GPU_DISABLED_ARGS
    } else {
        GPU_ENABLED_ARGS
    };

    args.iter().map(|s| s.to_string()).collect()
}
