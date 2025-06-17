use std::path::{Path, PathBuf};
use serde::Serialize;

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
) -> SaveFileInfo {
    let file_name = path.file_name().unwrap().to_str().unwrap();

    let re = regex::Regex::new(r"^(MULTIPLAYER|SINGLEPLAYER)_(.+?)_(Easy|Normal|Hard|Nightmare|\d+)\.sav$").unwrap();
    let caps = re.captures(file_name).unwrap();

    let mode_raw = caps.get(1).unwrap().as_str();
    let name = caps.get(2).unwrap().as_str();
    let difficulty_raw = caps.get(3).unwrap().as_str();

    let mode = match mode_raw {
        "MULTIPLAYER" => "多人模式",
        "SINGLEPLAYER" => "单人模式",
        _ => "未知模式",
    }.to_string();

    let difficulty = match difficulty_raw.to_lowercase().as_str() {
        "easy" => "简单难度",
        "normal" => "普通难度",
        "hard" => "困难难度",
        "nightmare" => "噩梦难度",
        _ => "普通难度",
    }.to_string();

    let difficulty_class = match difficulty_raw.to_lowercase().as_str() {
        "easy" => "Easy",
        "normal" => "Normal",
        "hard" => "Hard",
        "nightmare" => "Nightmare",
        _ => "Normal",
    }.to_string();

    // 获取 SaveGames 根目录
    let base_dir = std::env::var("LOCALAPPDATA")
        .map(|local_appdata| PathBuf::from(local_appdata)
        .join("EscapeTheBackrooms\\Saved\\SaveGames"))
        .ok()
        .filter(|dir| dir.exists());

    let hidden = path.parent() != base_dir.as_ref().map(|p: &PathBuf| p.as_path());

    SaveFileInfo {
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
    }
}