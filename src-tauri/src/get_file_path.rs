use std::path::PathBuf;
use std::env;
use regex::Regex;
use walkdir::WalkDir;

pub fn list_save_paths() -> Result<Vec<PathBuf>, String> {
    let mut saves = Vec::new();

    // 获取 %LOCALAPPDATA%\EscapeTheBackrooms\Saved\SaveGames\
    let local_appdata = env::var("LOCALAPPDATA").map_err(|e| e.to_string())?;
    let base_dir = PathBuf::from(local_appdata).join("EscapeTheBackrooms/Saved/SaveGames");

    if !base_dir.exists() {
        return Err("未找到存档目录".to_string());
    }

    let re = Regex::new(r"(?i)^(MULTIPLAYER|SINGLEPLAYER)_(.+?)_(Easy|Normal|Hard|Nightmare|\d+)\.sav$")
        .map_err(|e| e.to_string())?;

    // 递归遍历所有子目录
    for entry in WalkDir::new(base_dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.into_path();
        if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
            if re.is_match(name) {
                saves.push(path);
            }
        }
    }

    Ok(saves)
}