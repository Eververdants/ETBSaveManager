use serde_json::Value;
use std::fs;
use std::path::PathBuf;

/// 获取当前GPU加速设置状态
#[tauri::command]
pub fn get_gpu_acceleration_status() -> Result<bool, String> {
    // 从配置文件读取GPU加速状态
    let config_dir = get_config_dir()?;
    let config_file = config_dir.join("gpu_config.json");
    
    if config_file.exists() {
        let content = fs::read_to_string(&config_file)
            .map_err(|e| format!("Failed to read GPU config: {}", e))?;
        
        let config: Value = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse GPU config: {}", e))?;
        
        // 默认启用GPU加速，除非明确设置为禁用
        let disabled = config.get("gpuAccelerationDisabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
            
        Ok(disabled)
    } else {
        // 如果配置文件不存在，默认启用GPU加速
        Ok(false)
    }
}

/// 设置GPU加速状态
#[tauri::command]
pub fn set_gpu_acceleration(disabled: bool) -> Result<(), String> {
    // 保存配置到文件
    let config_dir = get_config_dir()?;
    let config_file = config_dir.join("gpu_config.json");
    
    // 确保配置目录存在
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }
    
    // 创建配置对象
    let config = serde_json::json!({
        "gpuAccelerationDisabled": disabled
    });
    
    // 写入配置文件
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_file, content)
        .map_err(|e| format!("Failed to write GPU config: {}", e))?;
    
    // 返回成功消息，前端将处理显示
    Ok(())
}

/// 获取配置目录路径
fn get_config_dir() -> Result<PathBuf, String> {
    let local_appdata = std::env::var("LOCALAPPDATA")
        .map_err(|e| format!("Failed to get LOCALAPPDATA: {}", e))?;
    
    let config_dir = PathBuf::from(local_appdata)
        .join("ETBSaveManager");
    
    Ok(config_dir)
}

/// 获取适用于当前GPU加速设置的浏览器参数
pub fn get_browser_args() -> Vec<String> {
    // 默认启用GPU加速的参数
    let mut args = vec![
        "--disable-gpu-sandbox".to_string(),
        "--disable-software-rasterizer".to_string(),
        "--enable-gpu-rasterization".to_string(),
        "--force-gpu-rasterization".to_string(),
    ];
    
    // 检查是否禁用了GPU加速
    if let Ok(disabled) = get_gpu_acceleration_status() {
        if disabled {
            // 如果禁用了GPU加速，修改参数
            args = vec![
                "--disable-gpu".to_string(),
                "--disable-gpu-sandbox".to_string(),
                "--disable-software-rasterizer".to_string(),
            ];
        }
    }
    
    args
}