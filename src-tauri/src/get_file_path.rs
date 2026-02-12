//! 文件路径模块 - 存档文件扫描
//! 优化版本：减少正则匹配开销，使用快速路径检查

use crate::common::get_save_games_dir;
use rayon::prelude::*;
use std::ffi::OsStr;
use std::path::PathBuf;
use walkdir::WalkDir;

#[inline]
fn starts_with_ascii_case_insensitive(s: &str, prefix: &str) -> bool {
    s.get(..prefix.len())
        .is_some_and(|head| head.eq_ignore_ascii_case(prefix))
}

#[inline]
fn ends_with_ascii_case_insensitive(s: &str, suffix: &str) -> bool {
    if s.len() < suffix.len() {
        return false;
    }
    let start = s.len() - suffix.len();
    s.get(start..)
        .is_some_and(|tail| tail.eq_ignore_ascii_case(suffix))
}

#[inline]
fn strip_suffix_ascii_case_insensitive<'a>(s: &'a str, suffix: &str) -> Option<&'a str> {
    if !ends_with_ascii_case_insensitive(s, suffix) {
        return None;
    }
    let end = s.len() - suffix.len();
    s.get(..end)
}

/// 快速检查文件名是否可能是存档文件（避免正则开销）
#[inline]
fn is_potential_save_file(name: &str) -> bool {
    (starts_with_ascii_case_insensitive(name, "MULTIPLAYER_")
        || starts_with_ascii_case_insensitive(name, "SINGLEPLAYER_"))
        && ends_with_ascii_case_insensitive(name, ".sav")
}

/// 验证存档文件名格式（简化版，不使用正则）
#[inline]
fn validate_save_filename(name: &str) -> bool {
    // 检查后缀
    let without_ext = match strip_suffix_ascii_case_insensitive(name, ".sav") {
        Some(s) => s,
        None => return false,
    };

    // 检查难度后缀
    let valid_difficulties = ["_easy", "_normal", "_hard", "_nightmare"];
    let has_valid_difficulty = valid_difficulties
        .iter()
        .any(|d| ends_with_ascii_case_insensitive(without_ext, d))
        || without_ext
            .chars()
            .last()
            .map_or(false, |c| c.is_ascii_digit());

    if !has_valid_difficulty {
        return false;
    }

    // 检查前缀
    starts_with_ascii_case_insensitive(without_ext, "multiplayer_")
        || starts_with_ascii_case_insensitive(without_ext, "singleplayer_")
}

/// 列出所有存档文件路径（优化版）
pub fn list_save_paths() -> Result<Vec<PathBuf>, String> {
    let base_dir = get_save_games_dir()?;

    if !base_dir.exists() {
        return Err("未找到存档目录".to_string());
    }

    // 预分配容量（假设平均 50 个存档）
    let mut entries = Vec::with_capacity(100);

    // 单线程收集（WalkDir 本身不支持并行）
    for entry in WalkDir::new(&base_dir)
        .max_depth(2)
        .into_iter()
        .filter_map(Result::ok)
    {
        let path = entry.into_path();
        if path.is_file() {
            if let Some(name) = path.file_name().and_then(OsStr::to_str) {
                // 快速路径检查
                if is_potential_save_file(name) {
                    entries.push(path);
                }
            }
        }
    }

    // 并行验证文件名格式
    let saves: Vec<PathBuf> = entries
        .into_par_iter()
        .filter(|path| {
            path.file_name()
                .and_then(OsStr::to_str)
                .map_or(false, validate_save_filename)
        })
        .collect();

    Ok(saves)
}
