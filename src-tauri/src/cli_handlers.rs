use chrono::{DateTime, Local};
use memmap2::Mmap;
use serde_json::Value;
use std::fs::File;
use std::io::Cursor;
use std::path::Path;
use uesave::Save;

/// 解析 .sav 文件为 Save 对象（使用内存映射优化大文件读取）
pub fn parse_sav_file(path: &Path) -> Result<Save, String> {
    let file = File::open(path).map_err(|e| format!("打开文件失败: {}", e))?;

    // 获取文件大小，小文件直接读取，大文件使用内存映射
    let metadata = file
        .metadata()
        .map_err(|e| format!("获取文件元信息失败: {}", e))?;
    let file_size = metadata.len();

    // 小于 64KB 的文件直接读取，避免 mmap 开销
    if file_size < 65536 {
        use std::io::Read;
        let mut file = file;
        let mut buffer = Vec::with_capacity(file_size as usize);
        file.read_to_end(&mut buffer)
            .map_err(|e| format!("读取文件内容失败: {}", e))?;
        let mut reader = Cursor::new(&buffer);
        return Save::read(&mut reader).map_err(|e| format!("解析存档失败: {:?}", e));
    }

    // 大文件使用内存映射，避免额外的内存拷贝
    let mmap = unsafe { Mmap::map(&file) }.map_err(|e| format!("内存映射失败: {}", e))?;
    let mut reader = Cursor::new(&mmap[..]);
    Save::read(&mut reader).map_err(|e| format!("解析存档失败: {:?}", e))
}

/// 获取文件最后修改时间，格式为 "YYYY-MM-DD"
pub fn get_modified_date(path: &Path) -> Result<String, String> {
    let metadata = std::fs::metadata(path).map_err(|e| format!("获取文件元信息失败: {}", e))?;
    let modified = metadata
        .modified()
        .map_err(|e| format!("获取修改时间失败: {}", e))?;
    let datetime: DateTime<Local> = DateTime::from(modified);
    Ok(datetime.format("%Y-%m-%d").to_string())
}

/// 提取 CurrentLevel_0.Name 字段值，并根据 UnlockedFun_0 判断 Pipes1/Pipes2
pub fn extract_current_level(json: &Value) -> String {
    let current_level = json["root"]["properties"]["CurrentLevel_0"]["Name"]
        .as_str()
        .map(|s| s.to_string())
        .unwrap_or_else(|| "Level0".to_string());

    // 如果当前层级是 Pipes，检查 UnlockedFun_0
    if current_level == "Pipes" {
        let unlocked_fun = &json["root"]["properties"]["UnlockedFun_0"]["Bool"];

        match unlocked_fun {
            Value::Bool(true) => "Pipes2".to_string(),
            Value::Bool(false) => "Pipes1".to_string(),
            _ => "Pipes1".to_string(), // 如果没有 UnlockedFun_0，默认为 Pipes1
        }
    } else {
        current_level
    }
}

/// 提取 Difficulty_0.Byte.Label 并映射难度等级
pub fn extract_difficulty_label(json: &Value) -> String {
    json["root"]["properties"]["Difficulty_0"]["Byte"]["Label"]
        .as_str()
        .map(|s| {
            if s.contains("NewEnumerator0") {
                "简单难度"
            } else if s.contains("NewEnumerator1") {
                "困难难度"
            } else if s.contains("NewEnumerator2") {
                "噩梦难度"
            } else {
                "普通难度"
            }
        })
        .map(|s| s.to_string())
        .unwrap_or_else(|| "普通难度".to_string())
}
