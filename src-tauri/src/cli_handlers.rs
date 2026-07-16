//! CLI handlers module - Save file parsing and metadata extraction
//! Optimized version: Using Cow to reduce string allocations, optimized file read strategy

use crate::error::AppResult;
use chrono::{DateTime, Local};
use memmap2::Mmap;
use std::borrow::Cow;
use std::fs::File;
use std::io::{Cursor, Read};
use std::path::Path;
use uesave::{Property, PropertyInner, Save};

/// Small file threshold (32KB), read directly below this
const SMALL_FILE_THRESHOLD: u64 = 32768;
/// Medium file threshold (512KB), use pre-allocated buffer between thresholds
const MEDIUM_FILE_THRESHOLD: u64 = 524288;

/// Parse .sav file into a Save object (three-tier file size strategy)
pub fn parse_sav_file(path: &Path) -> AppResult<Save> {
    let file = File::open(path).map_err(|e| format!("打开文件失败: {}", e))?;
    let file_size = file
        .metadata()
        .map_err(|e| format!("获取文件元信息失败: {}", e))?
        .len();

    // Small files: read directly into stack buffer
    if file_size < SMALL_FILE_THRESHOLD {
        let mut file = file;
        let mut buffer = Vec::with_capacity(file_size as usize);
        file.read_to_end(&mut buffer)
            .map_err(|e| format!("读取文件内容失败: {}", e))?;
        return Ok(
            Save::read(&mut Cursor::new(&buffer)).map_err(|e| format!("解析存档失败: {:?}", e))?
        );
    }

    // Medium files: pre-allocate buffer of exact size
    if file_size < MEDIUM_FILE_THRESHOLD {
        let mut file = file;
        let mut buffer = vec![0u8; file_size as usize];
        file.read_exact(&mut buffer)
            .map_err(|e| format!("读取文件内容失败: {}", e))?;
        return Ok(
            Save::read(&mut Cursor::new(&buffer)).map_err(|e| format!("解析存档失败: {:?}", e))?
        );
    }

    // Large files: use memory mapping
    // SAFETY: The file is not mutated during the mapping lifetime, and the returned Save owns a copy of the data via Cursor.
    let mmap = unsafe { Mmap::map(&file) }.map_err(|e| format!("内存映射失败: {}", e))?;
    Ok(Save::read(&mut Cursor::new(&mmap[..])).map_err(|e| format!("解析存档失败: {:?}", e))?)
}

/// Get file last modified date in "YYYY-MM-DD" format
#[inline]
pub fn get_modified_date(path: &Path) -> AppResult<String> {
    let modified = path
        .metadata()
        .and_then(|m| m.modified())
        .map_err(|e| format!("获取修改时间失败: {}", e))?;
    let datetime: DateTime<Local> = DateTime::from(modified);
    Ok(datetime.format("%Y-%m-%d").to_string())
}

/// Helper function: find property by name (ignoring type ID)
#[inline]
fn get_property_by_name<'a>(save: &'a Save, name: &str) -> Option<&'a Property> {
    save.root
        .properties
        .0
        .iter()
        .find(|(key, _)| key.1 == name)
        .map(|(_, prop)| prop)
}

/// Extract CurrentLevel_0.Name field value, and determine Pipes1/Pipes2 based on UnlockedFun_0
#[inline]
pub fn extract_current_level(save: &Save) -> String {
    let current_level = get_property_by_name(save, "CurrentLevel")
        .and_then(|prop| match &prop.inner {
            PropertyInner::Name(level) => Some(level.as_str()),
            _ => None,
        })
        .unwrap_or("Level0");

    if current_level == "Pipes" {
        let is_unlocked = get_property_by_name(save, "UnlockedFun")
            .and_then(|prop| match &prop.inner {
                PropertyInner::Bool(value) => Some(*value),
                _ => None,
            })
            .unwrap_or(false);
        if is_unlocked {
            "Pipes2".to_string()
        } else {
            "Pipes1".to_string()
        }
    } else {
        current_level.to_string()
    }
}

/// Extract Difficulty_0.Byte.Label and map difficulty level
/// Returns Cow to avoid allocation of static strings
#[inline]
pub fn extract_difficulty_label(save: &Save) -> Cow<'static, str> {
    let difficulty_label =
        get_property_by_name(save, "Difficulty").and_then(|prop| match &prop.inner {
            PropertyInner::Byte(uesave::Byte::Label(label)) => Some(label.as_str()),
            _ => None,
        });

    match difficulty_label {
        Some(s) if s.contains("NewEnumerator0") => Cow::Borrowed("Easy"),
        Some(s) if s.contains("NewEnumerator1") => Cow::Borrowed("Hard"),
        Some(s) if s.contains("NewEnumerator2") => Cow::Borrowed("Nightmare"),
        _ => Cow::Borrowed("Normal"),
    }
}
