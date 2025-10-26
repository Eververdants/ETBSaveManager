use std::fs;
use std::io::{BufWriter, Write, BufReader};

use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uesave::{
    Properties, Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyType, Save, StructType, StructValue, ValueArray, ValueVec,
};
use uuid;
use crate::save_editor::map_item_id_to_name;

#[derive(Debug, Deserialize, Serialize)]
pub struct SaveData {
    pub archive_name: String,
    pub level: String,
    pub game_mode: String,
    pub difficulty: String,
    pub actual_difficulty: String,
    pub players: Vec<PlayerData>,
    pub basic_archive: JsonValue, // 前端传来的完整 BasicArchive.json 内容
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PlayerData {
    pub steam_id: String,
    pub inventory: Vec<i32>, // 改为数字ID
}

pub fn create_new_save(save_data: SaveData) -> Result<(), String> {
    println!("📦 接收到新建存档请求：");
    println!("  存档名: {}", save_data.archive_name);
    println!("  层级: {}", save_data.level);
    println!("  游戏模式: {}", save_data.game_mode);
    println!("  存档难度: {}", save_data.difficulty);
    println!("  实际难度: {}", save_data.actual_difficulty);
    println!("  玩家数量: {}", save_data.players.len());

    // 处理层级映射（Pipes1/Pipes2 -> Pipes）
    let processed_level = match save_data.level.as_str() {
        "Pipes1" | "Pipes2" => "Pipes".to_string(),
        _ => save_data.level.clone(),
    };

    // 生成文件名后缀（多人模式也使用难度）
    let file_suffix = save_data.difficulty.clone();

    // 1. 构建目标路径
    let app_data_dir = get_local_appdata_dir()?;
    let save_dir = app_data_dir.join("EscapeTheBackrooms/Saved/SaveGames");

    if !save_dir.exists() {
        fs::create_dir_all(&save_dir).map_err(|e| format!("创建保存目录失败: {}", e))?;
    }

    // 强制设置为多人模式
    let file_name = format!(
        "{}_{}_{}.sav",
        "MULTIPLAYER".to_string(), // 始终设置为多人模式
        save_data.archive_name,
        file_suffix
    );
    let save_path = save_dir.join(&file_name);

    println!("📂 目标存档路径: {:?}", save_path);

    // 2. 从前端传来的 BasicArchive.json 构造 Save 对象
    let mut save = parse_json_to_save(&save_data.basic_archive)?;

    // 3. 修改 CurrentLevel 字段
    if processed_level == "Level0" {
        remove_current_level(&mut save);
        println!("✅ Level0 检测到，已移除 CurrentLevel_0 整个字段");
    } else {
        modify_current_level(&mut save, processed_level.clone());
    }

    // 4. 处理 Pipes1/Pipes2 的 UnlockedFun_0 字段
    match save_data.level.as_str() {
        "Pipes1" => {
            // 删除 UnlockedFun_0 字段
            let unlocked_fun_key = PropertyKey(0, "UnlockedFun".to_string());
            if save.root.properties.0.contains_key(&unlocked_fun_key) {
                save.root.properties.0.shift_remove(&unlocked_fun_key);
                println!("🗑️ 已删除 UnlockedFun_0 字段 (Pipes1)");
            }
        }
        "Pipes2" => {
            // 创建 UnlockedFun_0 字段，设置为 true
            let unlocked_fun_prop = Property {
                tag: PropertyTagPartial {
                    id: None,
                    data: PropertyTagDataPartial::Other(uesave::PropertyType::BoolProperty),
                },
                inner: PropertyInner::Bool(true),
            };
            let unlocked_fun_key = PropertyKey(0, "UnlockedFun".to_string());
            save.root.properties.0.insert(unlocked_fun_key, unlocked_fun_prop);
            println!("✅ 已创建 UnlockedFun_0 字段，值为 true (Pipes2)");
        }
        _ => {}
    }

    // 5. 修改难度设置
    update_difficulty(&mut save, &save_data.actual_difficulty);

    // 5. 更新玩家数据（如果有玩家信息）
    if !save_data.players.is_empty() {
        update_player_data(&mut save, &save_data.players)?;
    }

    // 6. 写出为 .sav 文件
    let file = fs::File::create(&save_path).map_err(|e| format!("创建输出文件失败: {}", e))?;
    let mut writer = BufWriter::new(file);
    save.write(&mut writer)
        .map_err(|e| format!("写入存档失败: {:?}", e))?;
    writer
        .flush()
        .map_err(|e| format!("刷新缓冲区失败: {}", e))?;

    println!("💾 存档已成功保存至: {:?}", save_path);

    // 7. 更新 MAINSAVE.sav 文件
    update_mainsave_sav(&save_data, &file_name)?;

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

// 更新玩家数据
fn update_player_data(save: &mut Save, players: &[PlayerData]) -> Result<(), String> {
    if players.is_empty() {
        return Ok(());
    }

    println!("👥 开始处理玩家数据...");

    // 创建 PlayerData_0 Map
    let mut map_entries = Vec::new();

    for player in players {
        // 创建背包物品列表
        let mut inventory_items = Vec::new();
        for item_id in player.inventory.iter().take(12) {
            // 将数字ID转换为物品名称
            let item_name = map_item_id_to_name(*item_id);
            inventory_items.push(item_name.to_string());
        }
        // 确保正好12个物品
        while inventory_items.len() < 12 {
            inventory_items.push("None".to_string());
        }

        // 创建玩家结构体属性
        let mut player_struct_properties = Properties::default();

        // Sanity 属性
        let sanity_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
            },
            inner: PropertyInner::Float(100.0), // 默认理智值
        };

        // Inventory 属性
        let inventory_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(PropertyType::NameProperty))),
            },
            inner: PropertyInner::Array(ValueArray::Base(ValueVec::Name(inventory_items))),
        };

        // 插入玩家属性 - 使用与 test3.json 完全匹配的字段名
        player_struct_properties.0.insert(
            PropertyKey(0, "Sanity_6_A5AFAB454F51CC63745A669BD7E629F6".to_string()),
            sanity_prop,
        );
        player_struct_properties.0.insert(
            PropertyKey(0, "Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4".to_string()),
            inventory_prop,
        );

        // 创建 Map Entry
        let map_entry = uesave::MapEntry {
            key: uesave::PropertyValue::Str(player.steam_id.clone()),
            value: uesave::PropertyValue::Struct(StructValue::Struct(player_struct_properties)),
        };

        map_entries.push(map_entry);
    }

    // 创建 PlayerData_0 属性
    let player_data_prop = Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Map {
                key_type: Box::new(PropertyTagDataPartial::Other(PropertyType::StrProperty)),
                value_type: Box::new(PropertyTagDataPartial::Struct {
                    struct_type: StructType::Struct(None),
                    id: uuid::Uuid::nil(),
                }),
            },
        },
        inner: PropertyInner::Map(map_entries),
    };

    save.root.properties.0.insert(PropertyKey(0, "PlayerData".to_string()), player_data_prop);
    println!("✅ 已创建 PlayerData_0 Map");

    Ok(())
}

// 更新 MAINSAVE.sav 文件，添加新创建的存档名称到 SingleplayerSaves 列表
fn update_mainsave_sav(_save_data: &SaveData, new_save_filename: &str) -> Result<(), String> {
    println!("🔄 正在更新 MAINSAVE.sav 文件...");
    
    // 获取存档目录
    let save_dir = get_local_appdata_dir()?.join("EscapeTheBackrooms/Saved/SaveGames");
    let mainsave_path = save_dir.join("MAINSAVE.sav");
    
    if !mainsave_path.exists() {
        println!("⚠️ MAINSAVE.sav 不存在，跳过更新");
        return Ok(());
    }
    
    // 使用 uesave 读取 MAINSAVE.sav 文件
    let file = fs::File::open(&mainsave_path)
        .map_err(|e| format!("打开 MAINSAVE.sav 文件失败: {}", e))?;
    let mut reader = BufReader::new(file);
    
    let mut mainsave = Save::read(&mut reader)
        .map_err(|e| format!("解析 MAINSAVE.sav 文件失败: {:?}", e))?;
    
    // 获取存档名称（不带 .sav 后缀）
    let archive_name = new_save_filename.trim_end_matches(".sav");
    println!("📄 要添加的存档名称: {}", archive_name);
    
    // 查找 SingleplayerSaves_0 字段
    let singleplayer_saves_key = PropertyKey(0, "SingleplayerSaves".to_string());
    
    if let Some(singleplayer_saves_prop) = mainsave.root.properties.0.get_mut(&singleplayer_saves_key) {
        // 获取现有的 Str 数组
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut existing_saves))) = &mut singleplayer_saves_prop.inner {
            // 检查是否已存在相同的存档名称
            if !existing_saves.contains(&archive_name.to_string()) {
                // 添加新的存档名称到列表
                existing_saves.push(archive_name.to_string());
                println!("✅ 已添加存档名称到 SingleplayerSaves 列表: {}", archive_name);
            } else {
                println!("ℹ️ 存档名称已存在于 SingleplayerSaves 列表中: {}", archive_name);
            }
        } else {
            return Err("SingleplayerSaves_0 字段结构不符合预期".to_string());
        }
    } else {
        // 如果 SingleplayerSaves_0 字段不存在，创建它
        let saves_list = vec![archive_name.to_string()];
        
        let new_singleplayer_saves = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(PropertyType::StrProperty))),
            },
            inner: PropertyInner::Array(ValueArray::Base(ValueVec::Str(saves_list))),
        };
        
        mainsave.root.properties.0.insert(singleplayer_saves_key, new_singleplayer_saves);
        println!("✅ 已创建新的 SingleplayerSaves_0 字段并添加存档名称: {}", archive_name);
    }
    
    // 保存修改后的 MAINSAVE.sav 文件
    let temp_path = save_dir.join("MAINSAVE_temp.sav");
    let file = fs::File::create(&temp_path)
        .map_err(|e| format!("创建临时 MAINSAVE 文件失败: {}", e))?;
    let mut writer = BufWriter::new(file);
    
    mainsave.write(&mut writer)
        .map_err(|e| format!("写入 MAINSAVE.sav 文件失败: {:?}", e))?;
    writer.flush()
        .map_err(|e| format!("刷新缓冲区失败: {}", e))?;
    
    // 替换原始文件
    fs::rename(&temp_path, &mainsave_path)
        .map_err(|e| format!("替换 MAINSAVE.sav 文件失败: {}", e))?;
    
    println!("✅ MAINSAVE.sav 文件更新完成");
    Ok(())
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
