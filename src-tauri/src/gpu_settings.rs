use crate::common::get_app_config_dir;
use serde_json::Value;
use std::fs;

/// 获取当前GPU加速设置状态
#[tauri::command]
pub fn get_gpu_acceleration_status() -> Result<bool, String> {
    let config_file = get_app_config_dir()?.join("gpu_config.json");

    if config_file.exists() {
        let content =
            fs::read_to_string(&config_file).map_err(|e| format!("读取GPU配置失败: {}", e))?;

        let config: Value =
            serde_json::from_str(&content).map_err(|e| format!("解析GPU配置失败: {}", e))?;

        Ok(config
            .get("gpuAccelerationDisabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(false))
    } else {
        Ok(false)
    }
}

/// 设置GPU加速状态
/// 返回是否需要重启应用才能生效
#[tauri::command]
pub fn set_gpu_acceleration(disabled: bool) -> Result<bool, String> {
    let config_dir = get_app_config_dir()?;
    let config_file = config_dir.join("gpu_config.json");

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }

    // 检查是否有配置变更
    let current_status = get_gpu_acceleration_status().unwrap_or(false);
    let needs_restart = current_status != disabled;

    let config = serde_json::json!({ "gpuAccelerationDisabled": disabled });
    let content =
        serde_json::to_string_pretty(&config).map_err(|e| format!("序列化配置失败: {}", e))?;

    fs::write(&config_file, content).map_err(|e| format!("写入GPU配置失败: {}", e))?;

    println!(
        "✅ GPU加速设置已更新: disabled={}, needs_restart={}",
        disabled, needs_restart
    );

    Ok(needs_restart)
}

/// 获取适用于当前GPU加速设置的浏览器参数
pub fn get_browser_args() -> Vec<String> {
    let disabled = get_gpu_acceleration_status().unwrap_or(false);

    if disabled {
        vec![
            "--disable-gpu".to_string(),
            "--disable-gpu-sandbox".to_string(),
            "--disable-software-rasterizer".to_string(),
        ]
    } else {
        vec![
            "--disable-gpu-sandbox".to_string(),
            "--disable-software-rasterizer".to_string(),
            "--enable-gpu-rasterization".to_string(),
            "--force-gpu-rasterization".to_string(),
        ]
    }
}
