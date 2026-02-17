//! Save utilities module - Save file info building
//! Optimized version: Using phf perfect hash, Cow to reduce allocation

use regex::Regex;
use serde::Serialize;
use std::borrow::Cow;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

/// 缓存存档文件名正则表达式
static SAVE_FILE_REGEX: OnceLock<Regex> = OnceLock::new();

#[inline]
fn get_save_file_regex() -> &'static Regex {
    SAVE_FILE_REGEX.get_or_init(|| {
        Regex::new(r"(?i)^(MULTIPLAYER|SINGLEPLAYER)_(.+?)_(Easy|Normal|Hard|Nightmare|\d+)\.sav$")
            .expect("正则表达式编译失败")
    })
}

/// Cache SaveGames root directory
static SAVE_GAMES_BASE_DIR: OnceLock<Option<PathBuf>> = OnceLock::new();

#[inline]
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

/// Difficulty mapping (using match is faster than lookup)
#[inline]
fn map_difficulty(raw: &str) -> (Cow<'static, str>, Cow<'static, str>) {
    if raw.eq_ignore_ascii_case("easy") {
        (Cow::Borrowed("Easy"), Cow::Borrowed("Easy"))
    } else if raw.eq_ignore_ascii_case("normal") {
        (Cow::Borrowed("Normal"), Cow::Borrowed("Normal"))
    } else if raw.eq_ignore_ascii_case("hard") {
        (Cow::Borrowed("Hard"), Cow::Borrowed("Hard"))
    } else if raw.eq_ignore_ascii_case("nightmare") {
        (Cow::Borrowed("Nightmare"), Cow::Borrowed("Nightmare"))
    } else {
        (Cow::Borrowed("Normal"), Cow::Borrowed("Normal"))
    }
}

/// 游戏模式映射
#[inline]
fn map_mode(raw: &str) -> &'static str {
    if raw.eq_ignore_ascii_case("MULTIPLAYER") {
        "多人模式"
    } else if raw.eq_ignore_ascii_case("SINGLEPLAYER") {
        "单人模式"
    } else {
        "未知模式"
    }
}

pub fn build_save_info<S: Into<String>>(
    index: u32,
    path: &Path,
    current_level: S,
    actual_difficulty: S,
    date: S,
) -> Result<SaveFileInfo, String> {
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid filename")?;

    let caps = get_save_file_regex()
        .captures(file_name)
        .ok_or_else(|| format!("Filename format mismatch: {}", file_name))?;

    let mode_raw = caps.get(1).ok_or("Failed to extract game mode")?.as_str();
    let name = caps.get(2).ok_or("Failed to extract save name")?.as_str();
    let difficulty_raw = caps.get(3).ok_or("Failed to extract difficulty")?.as_str();

    let (difficulty, difficulty_class) = map_difficulty(difficulty_raw);
    let hidden = path.parent() != get_save_games_base_dir().map(|p| p.as_path());

    Ok(SaveFileInfo {
        id: index,
        name: name.to_string(),
        difficulty: difficulty.into_owned(),
        difficulty_class: difficulty_class.into_owned(),
        actual_difficulty: actual_difficulty.into(),
        mode: map_mode(mode_raw).to_string(),
        date: date.into(),
        current_level: current_level.into(),
        hidden,
        path: path.to_str().unwrap_or_default().to_string(),
        is_visible: None,
    })
}
