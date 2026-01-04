//! CLI 处理模块 - 存档文件解析和元数据提取
//! 优化版本：使用 Cow 减少字符串分配，优化文件读取策略

use chrono::{DateTime, Local};
use memmap2::Mmap;
use serde_json::Value;
use std::borrow::Cow;
use std::fs::File;
use std::io::{Cursor, Read};
use std::path::Path;
use uesave::Save;

/// 小文件阈值（32KB），低于此值直接读取
const SMALL_FILE_THRESHOLD: u64 = 32768;
/// 中等文件阈值（512KB），介于两者之间使用预分配缓冲区
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

/// 提取 CurrentLevel_0.Name 字段值，并根据 UnlockedFun_0 判断 Pipes1/Pipes2
/// 使用 Cow 避免不必要的字符串分配
#[inline]
pub fn extract_current_level(json: &Value) -> String {
    let current_level = json
        .pointer("/root/properties/CurrentLevel_0/Name")
        .and_then(Value::as_str)
        .unwrap_or("Level0");

    if current_level == "Pipes" {
        let is_unlocked = json
            .pointer("/root/properties/UnlockedFun_0/Bool")
            .and_then(Value::as_bool)
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

/// 提取 Difficulty_0.Byte.Label 并映射难度等级
/// 返回 Cow 以避免静态字符串的分配
#[inline]
pub fn extract_difficulty_label(json: &Value) -> Cow<'static, str> {
    json.pointer("/root/properties/Difficulty_0/Byte/Label")
        .and_then(Value::as_str)
        .map(|s| {
            if s.contains("NewEnumerator0") {
                Cow::Borrowed("简单难度")
            } else if s.contains("NewEnumerator1") {
                Cow::Borrowed("困难难度")
            } else if s.contains("NewEnumerator2") {
                Cow::Borrowed("噩梦难度")
            } else {
                Cow::Borrowed("普通难度")
            }
        })
        .unwrap_or(Cow::Borrowed("普通难度"))
}
