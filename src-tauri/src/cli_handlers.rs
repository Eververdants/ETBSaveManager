//! CLI 处理模块 - 存档文件解析和元数据提取
//! 优化版本：使用 Cow 减少字符串分配，优化文件读取策略

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

/// 解析 .sav 文件为 Save 对象（三级文件大小策略）
pub fn parse_sav_file(path: &Path) -> Result<Save, String> {
    let file = File::open(path).map_err(|e| format!("打开文件失败: {}", e))?;
    let file_size = file
        .metadata()
        .map_err(|e| format!("获取文件元信息失败: {}", e))?
        .len();

    // 小文件：直接读取到栈上缓冲区
    if file_size < SMALL_FILE_THRESHOLD {
        let mut file = file;
        let mut buffer = Vec::with_capacity(file_size as usize);
        file.read_to_end(&mut buffer)
            .map_err(|e| format!("读取文件内容失败: {}", e))?;
        return Save::read(&mut Cursor::new(&buffer)).map_err(|e| format!("解析存档失败: {:?}", e));
    }

    // 中等文件：预分配精确大小的缓冲区
    if file_size < MEDIUM_FILE_THRESHOLD {
        let mut file = file;
        let mut buffer = vec![0u8; file_size as usize];
        file.read_exact(&mut buffer)
            .map_err(|e| format!("读取文件内容失败: {}", e))?;
        return Save::read(&mut Cursor::new(&buffer)).map_err(|e| format!("解析存档失败: {:?}", e));
    }

    // 大文件：使用内存映射
    let mmap = unsafe { Mmap::map(&file) }.map_err(|e| format!("内存映射失败: {}", e))?;
    Save::read(&mut Cursor::new(&mmap[..])).map_err(|e| format!("解析存档失败: {:?}", e))
}

/// 获取文件最后修改时间，格式为 "YYYY-MM-DD"
#[inline]
pub fn get_modified_date(path: &Path) -> Result<String, String> {
    let modified = path
        .metadata()
        .and_then(|m| m.modified())
        .map_err(|e| format!("获取修改时间失败: {}", e))?;
    let datetime: DateTime<Local> = DateTime::from(modified);
    Ok(datetime.format("%Y-%m-%d").to_string())
}

/// 辅助函数：按名称查找属性（忽略类型 ID）
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
    let difficulty_label = get_property_by_name(save, "Difficulty").and_then(|prop| match &prop.inner {
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
