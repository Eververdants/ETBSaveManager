use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    // 获取LOCALAPPDATA环境变量
    let local_appdata = match env::var("LOCALAPPDATA") {
        Ok(path) => path,
        Err(_) => {
            // 如果无法获取LOCALAPPDATA，使用默认构建
            tauri_build::build();
            return;
        }
    };
    
    // 检查GPU配置文件
    let config_dir = PathBuf::from(local_appdata).join("ETBSaveManager");
    let config_file = config_dir.join("gpu_config.json");
    
    // 默认启用GPU加速的参数
    let mut browser_args = "--disable-gpu-sandbox --disable-software-rasterizer --enable-gpu-rasterization --force-gpu-rasterization".to_string();
    
    // 如果配置文件存在，读取配置
    if config_file.exists() {
        if let Ok(content) = fs::read_to_string(&config_file) {
            if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(disabled) = config.get("gpuAccelerationDisabled").and_then(|v| v.as_bool()) {
                    if disabled {
                        // 如果禁用了GPU加速，修改参数
                        browser_args = "--disable-gpu --disable-gpu-sandbox --disable-software-rasterizer".to_string();
                    }
                }
            }
        }
    }
    
    // 设置环境变量，供tauri_build使用
    env::set_var("TAURI_BROWSER_ARGS", browser_args);
    
    // 调用tauri_build
    tauri_build::build()
}
