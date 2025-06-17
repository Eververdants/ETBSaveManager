use chrono::{DateTime, Local};
use uesave::Save;
use serde_json::Value;
use std::path::Path;
use std::fs::{File};
use std::io::{Read, Cursor};

/// 解析 .sav 文件为 Save 对象
pub fn parse_sav_file(path: &Path) -> Result<Save, String> {
    let mut file = File::open(path).map_err(|e| format!("打开文件失败: {}", e))?;

    // 读取整个文件到内存中
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("读取文件内容失败: {}", e))?;

    // 使用 Cursor 将内存数据包装成一个 Read 实现
    let mut reader = Cursor::new(&buffer);

    // 使用 uesave::Save::read 来解析存档文件
    let save = Save::read(&mut reader).map_err(|e| format!("解析存档失败: {:?}", e))?;

    Ok(save)
}

/// 获取文件最后修改时间，格式为 "YYYY-MM-DD"
pub fn get_modified_date(path: &Path) -> Result<String, String> {
    let metadata = std::fs::metadata(path).map_err(|e| format!("获取文件元信息失败: {}", e))?;
    let modified = metadata.modified().map_err(|e| format!("获取修改时间失败: {}", e))?;
    let datetime: DateTime<Local> = DateTime::from(modified);
    Ok(datetime.format("%Y-%m-%d").to_string())
}

/// 提取 CurrentLevel_0.Name 字段值（使用类似 JSON 的嵌套访问风格） 
pub fn extract_current_level(json: &Value) -> String {
    json["root"]["properties"]["CurrentLevel_0"]["Name"]
        .as_str()
        .map(|s| s.to_string())
        .unwrap_or_else(|| "Level 0".to_string())
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