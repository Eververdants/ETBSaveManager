use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
pub struct SaveFileInfo {
    pub id: u32,
    pub name: String,
    pub difficulty: String,
    pub difficulty_class: String,
    pub actual_difficulty: String,
    pub mode: String,
    pub date: String,
    pub current_level: String,
    pub hidden: bool,
    pub path: String,
}

pub fn build_save_info(
    index: u32,
    path: &Path,
    current_level: String,
    actual_difficulty: String,
    date: String,
) -> Result<SaveFileInfo, String> {
    let file_name = path.file_name().unwrap().to_str().unwrap();

    let re = regex::Regex::new(
        r"^(MULTIPLAYER|SINGLEPLAYER)_(.+?)_(Easy|easy|Normal|normal|Hard|hard|Nightmare|nightmare|\d+)\.sav$",
    )
    .unwrap();

    let caps = re
        .captures(file_name)
        .ok_or_else(|| format!("文件名格式不匹配: {}", file_name))?;

    let mode_raw = caps.get(1).ok_or("无法提取游戏模式")?.as_str();
    let name = caps.get(2).ok_or("无法提取存档名称")?.as_str();
    let difficulty_raw = caps.get(3).ok_or("无法提取难度")?.as_str().to_lowercase();

    let mode = match mode_raw {
        "MULTIPLAYER" => "多人模式",
        "SINGLEPLAYER" => "单人模式",
        _ => "未知模式",
    }
    .to_string();

    let difficulty = match difficulty_raw.to_lowercase().as_str() {
        "easy" => "简单难度",
        "normal" => "普通难度",
        "hard" => "困难难度",
        "nightmare" => "噩梦难度",
        _ => "普通难度",
    }
    .to_string();

    let difficulty_class = match difficulty_raw.to_lowercase().as_str() {
        "easy" => "Easy",
        "normal" => "Normal",
        "hard" => "Hard",
        "nightmare" => "Nightmare",
        _ => "Normal",
    }
    .to_string();

    // 获取 SaveGames 根目录
    let base_dir = std::env::var("LOCALAPPDATA")
        .map(|local_appdata| {
            PathBuf::from(local_appdata).join("EscapeTheBackrooms\\Saved\\SaveGames")
        })
        .ok()
        .filter(|dir| dir.exists());

    let hidden = path.parent() != base_dir.as_ref().map(|p: &PathBuf| p.as_path());

    Ok(SaveFileInfo {
        id: index,
        name: name.to_string(),
        difficulty,
        difficulty_class,
        actual_difficulty,
        mode,
        date: date,
        current_level,
        hidden,
        path: path.to_str().unwrap().to_string(),
    })
}
