use crate::common::get_save_games_dir;
use rayon::prelude::*;
use regex::Regex;
use std::path::PathBuf;
use std::sync::OnceLock;
use walkdir::WalkDir;

/// 存档文件名正则表达式（编译一次，全局复用）
const SAVE_FILE_PATTERN: &str =
    r"(?i)^(MULTIPLAYER|SINGLEPLAYER)_(.+?)_(Easy|Normal|Hard|Nightmare|\d+)\.sav$";

/// 缓存编译后的正则表达式
static SAVE_FILE_REGEX: OnceLock<Regex> = OnceLock::new();

#[inline]
fn get_save_file_regex() -> &'static Regex {
    SAVE_FILE_REGEX.get_or_init(|| Regex::new(SAVE_FILE_PATTERN).expect("正则表达式编译失败"))
}

/// 列出所有存档文件路径
pub fn list_save_paths() -> Result<Vec<PathBuf>, String> {
    let base_dir = get_save_games_dir()?;

    if !base_dir.exists() {
        return Err("未找到存档目录".to_string());
    }

    let re = get_save_file_regex();

    // 先收集所有目录条目，然后并行过滤
    let entries: Vec<_> = WalkDir::new(&base_dir)
        .max_depth(2)
        .into_iter()
        .filter_map(Result::ok)
        .collect();

    // 并行过滤匹配的存档文件
    let saves: Vec<PathBuf> = entries
        .into_par_iter()
        .filter_map(|entry| {
            let path = entry.into_path();
            if !path.is_file() {
                return None;
            }
            let name = path.file_name()?.to_str()?;
            if re.is_match(name) {
                Some(path)
            } else {
                None
            }
        })
        .collect();

    println!("=== 扫描完成: 共 {} 个存档 ===", saves.len());
    Ok(saves)
}
