use regex::Regex;
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

/// 缓存存档文件名正则表达式
static SAVE_FILE_REGEX: OnceLock<Regex> = OnceLock::new();

fn get_save_file_regex() -> &'static Regex {
    SAVE_FILE_REGEX.get_or_init(|| {
        Regex::new(
            r"^(MULTIPLAYER|SINGLEPLAYER)_(.+?)_(Easy|easy|Normal|normal|Hard|hard|Nightmare|nightmare|\d+)\.sav$",
        )
        .expect("正则表达式编译失败")
    })
}

/// 缓存 SaveGames 根目录
static SAVE_GAMES_BASE_DIR: OnceLock<Option<PathBuf>> = OnceLock::new();

fn get_save_games_base_dir() -> Option<&'static PathBuf> {
    SAVE_GAMES_BASE_DIR
        .get_or_init(|| {
            std::env::var("LOCALAPPDATA")
                .ok()
                .map(|local_appdata| {
                    PathBuf::from(local_appdata).join("EscapeTheBackrooms\\Saved\\SaveGames")
                })
                .filter(|dir| dir.exists())
        })
        .as_ref()
}

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
    pub is_visible: Option<bool>,
}

/// 难度映射表
const DIFFICULTY_DISPLAY: &[(&str, &str, &str)] = &[
    ("easy", "简单难度", "Easy"),
    ("normal", "普通难度", "Normal"),
    ("hard", "困难难度", "Hard"),
    ("nightmare", "噩梦难度", "Nightmare"),
];

pub fn build_save_info(
    index: u32,
    path: &Path,
    current_level: String,
    actual_difficulty: String,
    date: String,
) -> Result<SaveFileInfo, String> {
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("无效的文件名")?;

    let re = get_save_file_regex();
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

    // 使用映射表查找难度
    let (difficulty, difficulty_class) = DIFFICULTY_DISPLAY
        .iter()
        .find(|(key, _, _)| *key == difficulty_raw)
        .map(|(_, display, class)| (display.to_string(), class.to_string()))
        .unwrap_or_else(|| ("普通难度".to_string(), "Normal".to_string()));

    let hidden = path.parent() != get_save_games_base_dir().map(|p| p.as_path());

    Ok(SaveFileInfo {
        id: index,
        name: name.to_string(),
        difficulty,
        difficulty_class,
        actual_difficulty,
        mode,
        date,
        current_level,
        hidden,
        path: path.to_str().unwrap_or_default().to_string(),
        is_visible: None,
    })
}
