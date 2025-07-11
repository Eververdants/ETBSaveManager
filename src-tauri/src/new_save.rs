use std::fs;
use std::io::{BufWriter, Write};

use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::time::{SystemTime, UNIX_EPOCH};
use uesave::{
    Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial, Save,
};

#[derive(Debug, Deserialize, Serialize)]
pub struct SaveData {
    pub actual_difficulty: String,
    pub difficulty: String,
    pub level_key: String,
    pub mode: String,
    pub name: String,
    pub json_data: JsonValue, // 前端传来的完整 JSON 存档内容
}

pub fn create_new_save(save_data: SaveData) -> Result<(), String> {
    println!("📦 接收到新建存档请求：");
    println!("  模式: {}", save_data.mode);
    println!("  存档名: {}", save_data.name);
    println!("  难度: {}", save_data.difficulty);

    let difficulty = if save_data.mode == "Singleplayer" {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("无法获取时间戳: {}", e))?
            .as_secs()
            .to_string()
    } else {
        save_data.difficulty.clone() // 直接克隆字符串
    };

    // ✅ 修改 level_key 的逻辑
    let processed_level_key = match save_data.level_key.as_str() {
        "Pipes1" | "Pipes2" => "Pipes".to_string(),
        _ => save_data.level_key,
    };

    println!("  目标关卡: {}", processed_level_key);

    // 1. 构建目标路径
    let app_data_dir = get_local_appdata_dir()?;
    let save_dir = app_data_dir.join("EscapeTheBackrooms/Saved/SaveGames");

    if !save_dir.exists() {
        fs::create_dir_all(&save_dir).map_err(|e| format!("创建保存目录失败: {}", e))?;
    }

    let file_name = format!(
        "{}_{}_{}.sav",
        save_data.mode.to_uppercase(),
        save_data.name,
        difficulty
    );
    let save_path = save_dir.join(file_name);

    println!("📂 目标存档路径: {:?}", save_path);

    // 2. 从 JSON 构造 Save 对象
    let mut save = parse_json_to_save(&save_data.json_data)?;

    // 3. 修改 CurrentLevel（新增逻辑）
    if processed_level_key == "Level0" {
        remove_current_level(&mut save);
        println!("✅ Level0 检测到，已移除 CurrentLevel_0 整个字段");
    } else {
        modify_current_level(&mut save, processed_level_key); // 使用处理后的 level_key
    }

    // 4. 修改难度设置
    update_difficulty(&mut save, &save_data.actual_difficulty);

    // 5. 写出为 .sav 文件
    let file = fs::File::create(&save_path).map_err(|e| format!("创建输出文件失败: {}", e))?;
    let mut writer = BufWriter::new(file);
    save.write(&mut writer)
        .map_err(|e| format!("写入存档失败: {:?}", e))?;
    writer
        .flush()
        .map_err(|e| format!("刷新缓冲区失败: {}", e))?;

    println!("💾 存档已成功保存至: {:?}", save_path);

    Ok(())
}

// 将 JSON 转换为 Save
fn parse_json_to_save(json: &JsonValue) -> Result<Save, String> {
    // 这里你可以用 serde_json::from_value 构造 Save 对象
    let save: Save = serde_json::from_value(json.clone()).map_err(|e| {
        format!(
            "JSON 转换为 Save 失败: {:?}, JSON 内容: {}",
            e,
            json.to_string()
        )
    })?;
    Ok(save)
}

// 修改 CurrentLevel_0.Name 字段值
pub fn modify_current_level(save: &mut Save, new_level_name: String) -> bool {
    if let Some(current_level_prop) = save
        .root
        .properties
        .0
        .get_mut(&PropertyKey(0, "CurrentLevel".to_string()))
    {
        match &mut current_level_prop.inner {
            PropertyInner::Name(ref mut name) => {
                *name = new_level_name.clone();
                println!("✅ CurrentLevel_0 已修改为: {}", name);
                true
            }
            other => {
                eprintln!("❌ CurrentLevel_0 类型错误，期望 Name，实际是 {:?}", other);
                false
            }
        }
    } else {
        eprintln!("❌ 未找到 CurrentLevel_0 字段");
        false
    }
}

// 删除 CurrentLevel_0 整个字段
pub fn remove_current_level(save: &mut Save) -> bool {
    let key_to_remove = PropertyKey(0, "CurrentLevel".to_string());

    if save.root.properties.0.contains_key(&key_to_remove) {
        save.root.properties.0.shift_remove(&key_to_remove);
        println!("✅ CurrentLevel_0 已被完全移除");
        true
    } else {
        eprintln!("❌ 未找到 CurrentLevel_0 字段");
        false
    }
}

// 更新难度字段
pub fn update_difficulty(save: &mut Save, difficulty: &str) {
    // 删除旧的 Difficulty 字段
    let difficulty_keys: Vec<PropertyKey> = save
        .root
        .properties
        .0
        .iter()
        .filter(|(key, _)| key.1.starts_with("Difficulty"))
        .map(|(key, _)| PropertyKey(key.0, key.1.clone()))
        .collect();

    for key in difficulty_keys {
        save.root.properties.0.shift_remove(&key);
    }

    // 如果不是 Normal 难度，则添加新的 Difficulty 字段
    if difficulty != "Normal" {
        let label = match difficulty {
            "Easy" => "E_Difficulty::NewEnumerator0",
            "Hard" => "E_Difficulty::NewEnumerator1",
            "Nightmare" => "E_Difficulty::NewEnumerator2",
            _ => "E_Difficulty::NewEnumerator0",
        };

        let prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Byte(Some("E_Difficulty".to_string())),
            },
            inner: PropertyInner::Byte(uesave::Byte::Label(label.to_string())),
        };

        let key = PropertyKey(0, "Difficulty".to_string());
        save.root.properties.0.insert(key, prop);
        println!("✅ 已添加新难度字段: {}", label);
    } else {
        println!("➖ 跳过难度字段修改（Normal 难度）");
    }
}

fn get_local_appdata_dir() -> Result<std::path::PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        let local_appdata =
            std::env::var("LOCALAPPDATA").map_err(|e| format!("获取 LOCALAPPDATA 失败: {}", e))?;
        Ok(std::path::PathBuf::from(local_appdata))
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("仅支持 Windows 系统".to_string())
    }
}
