//! 文件路径模块 - 存档文件扫描
//! 优化版本：减少正则匹配开销，使用快速路径检查

use crate::common::get_save_games_dir;
use rayon::prelude::*;
use std::ffi::OsStr;
use std::path::PathBuf;
use walkdir::WalkDir;

/// 快速检查文件名是否可能是存档文件（避免正则开销）
#[inline]
fn is_potential_save_file(name: &str) -> bool {
    let name_upper = name.to_uppercase();
    (name_upper.starts_with("MULTIPLAYER_") || name_upper.starts_with("SINGLEPLAYER_"))
        && name.ends_with(".sav")
}

/// 验证存档文件名格式（简化版，不使用正则）
#[inline]
fn validate_save_filename(name: &str) -> bool {
    let name_lower = name.to_lowercase();

    // 检查后缀
    let without_ext = match name_lower.strip_suffix(".sav") {
        Some(s) => s,
        None => return false,
    };

    // 检查难度后缀
    let valid_difficulties = ["_easy", "_normal", "_hard", "_nightmare"];
    let has_valid_difficulty = valid_difficulties.iter().any(|d| without_ext.ends_with(d))
        || without_ext
            .chars()
            .last()
            .map_or(false, |c| c.is_ascii_digit());

    if !has_valid_difficulty {
        return false;
    }

    // 检查前缀
    without_ext.starts_with("multiplayer_") || without_ext.starts_with("singleplayer_")
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
