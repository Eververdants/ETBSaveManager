use serde_json::Value as JsonValue;
use std::env;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use uesave::{
    Properties, Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyValue, Save, StructValue, ValueArray, ValueVec,
};

// 物品ID到英文名的映射表
fn map_item_id_to_name(id: i32) -> &'static str {
    match id {
        1 => "AlmondConcentrate",
        2 => "BugSpray",
        3 => "Camera",
        4 => "AlmondWater",
        5 => "Chainsaw",
        6 => "DivingHelmet",
        7 => "EnergyBar",
        8 => "Firework",
        9 => "Flaregun",
        10 => "Flashlight",
        11 => "GlowstickBlue",
        12 => "GlowStick",
        13 => "GlowstickRed",
        14 => "GlowstickYellow",
        15 => "Juice",
        16 => "LiquidPain",
        17 => "Rope",
        18 => "LiDAR",
        19 => "Thermometer",
        20 => "Ticket",
        21 => "WalkieTalkie",
        22 => "MothJelly",
        23 => "Crowbar",
        _ => "None",
    }
}

fn is_subdirectory_of(child: &Path, parent: &Path) -> bool {
    if let (Ok(canonical_child), Ok(canonical_parent)) =
        (fs::canonicalize(child), fs::canonicalize(parent))
    {
        canonical_child.starts_with(canonical_parent)
    } else {
        false
    }
}

pub fn handle_file(file_path: String) -> Result<String, String> {
    println!("Received file path: {}", file_path);
    let local_appdata = env::var("LOCALAPPDATA").map_err(|e| e.to_string())?;
    let base_dir = PathBuf::from(local_appdata).join("EscapeTheBackrooms/Saved/SaveGames");
    if !base_dir.exists() {
        return Err("Base directory does not exist".to_string());
    }
    let hidden_dir = base_dir.join("HiddenFiles");
    if !hidden_dir.exists() {
        fs::create_dir_all(&hidden_dir)
            .map_err(|e| format!("Failed to create HiddenFiles: {}", e))?;
    }
    let file_path = PathBuf::from(file_path);
    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }
    let file_parent = file_path.parent().ok_or("Invalid file path")?;
    if is_subdirectory_of(file_parent, &hidden_dir) {
        let file_name = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid file name")?;
        let dest_path = base_dir.join(file_name);
        if dest_path.exists() {
            fs::remove_file(&dest_path)
                .map_err(|e| format!("Failed to remove existing file: {}", e))?;
        }
        fs::rename(&file_path, &dest_path)
            .map_err(|e| format!("Failed to move file to base_dir: {}", e))?;
        Ok(dest_path.to_str().unwrap_or("Invalid path").to_string())
    } else {
        println!("Moving file to HiddenFiles...");
        let file_name = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid file name")?;
        let dest_path = hidden_dir.join(file_name);
        if dest_path.exists() {
            fs::remove_file(&dest_path)
                .map_err(|e| format!("Failed to remove existing file: {}", e))?;
        }
        fs::rename(&file_path, &dest_path).map_err(|e| format!("Failed to move file: {}", e))?;
        Ok(dest_path.to_str().unwrap_or("Invalid path").to_string())
    }
}

// 辅助函数：按名称查找属性（忽略类型ID）
fn get_property_by_name_mut<'a>(
    properties: &'a mut Properties,
    name: &str,
) -> Option<&'a mut Property> {
    properties
        .0
        .iter_mut()
        .find(|(key, _)| key.1 == name)
        .map(|(_, prop)| prop)
}

/// 修改 CurrentLevel_0.Name 字段值（使用类似 JSON 的嵌套访问风格）
pub fn modify_current_level(save: &mut Save, new_level_name: String) -> bool {
    // 查找 root.properties 中的 CurrentLevel_0
    if let Some(current_level_prop) = save
        .root
        .properties
        .0
        .get_mut(&PropertyKey(0, "CurrentLevel".to_string()))
    {
        // 检查并修改为新的关卡名
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

pub fn edit_save_file(json_data: &JsonValue, output_dir: &str) -> Result<String, String> {
    println!("🔧 开始处理存档文件...");

    // 保存原始文件路径用于后续删除
    let original_path = json_data["path"]
        .as_str()
        .ok_or("Missing path in JSON data")?
        .to_string();

    // 提取必要的字段
    let name = json_data["name"]
        .as_str()
        .ok_or("Invalid name")?
        .to_string();
    let mode = json_data["mode"]
        .as_str()
        .ok_or("Invalid mode")?
        .to_string();
    let current_level = json_data["currentLevel"]
        .as_str()
        .ok_or("Invalid currentLevel")?
        .to_string();
    let actual_difficulty = json_data["actualDifficulty"]
        .as_str()
        .ok_or("Invalid actualDifficulty")?
        .to_string();

    let difficulty = if mode == "Singleplayer" {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("无法获取时间戳: {}", e))?
            .as_secs()
            .to_string()
    } else {
        json_data["difficulty"]
            .as_str()
            .ok_or("Invalid difficulty")?
            .to_string()
    };

    let new_filename = format!("{}_{}_{}.sav", mode.to_uppercase(), name, difficulty);
    let output_path = Path::new(output_dir).join(&new_filename);

    println!("📂 正在读取原始存档文件: {:?}", original_path);

    let file = File::open(&original_path).map_err(|e| format!("打开存档文件失败: {}", e))?;
    let mut reader = BufReader::new(file);

    let mut save = Save::read(&mut reader).map_err(|e| format!("解析存档失败: {:?}", e))?;

    // === 修改 CurrentLevel_0.Name 字段 ===
    let success = modify_current_level(&mut save, current_level.to_string());
    if success {
        println!("✅ 当前关卡名称已修改");
    } else {
        println!("❌ 修改失败，请检查结构是否匹配");
    }

    // === 重构难度处理逻辑 ===
    println!("⚙️ 开始处理难度设置: {}", actual_difficulty);

    // 收集需要删除的键
    let difficulty_keys: Vec<PropertyKey> = save
        .root
        .properties
        .0
        .iter()
        .filter(|(key, _)| key.1.starts_with("Difficulty"))
        .map(|(key, _)| PropertyKey(key.0, key.1.clone()))
        .collect();

    // 直接通过键删除
    for key in difficulty_keys {
        println!("🗑️ 删除难度字段: {}", key.1);
        save.root.properties.0.shift_remove(&key);
    }

    // 如果不是Normal难度，则创建新的难度字段
    if actual_difficulty != "Normal" {
        println!("🆕 创建新的难度字段");

        // 创建难度枚举对应的标签值
        let difficulty_label = match actual_difficulty.as_str() {
            "Easy" => "E_Difficulty::NewEnumerator0".to_string(),
            "Hard" => "E_Difficulty::NewEnumerator1".to_string(),
            "Nightmare" => "E_Difficulty::NewEnumerator2".to_string(),
            _ => "E_Difficulty::NewEnumerator0".to_string(), // 默认为Easy
        };

        // 创建难度属性（匹配原始结构）
        let difficulty_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                // 使用Byte类型
                data: PropertyTagDataPartial::Byte(Some("E_Difficulty".to_string())),
            },
            // 直接使用String作为Byte值
            inner: PropertyInner::Byte(uesave::Byte::Label(difficulty_label.clone())),
        };

        // 使用正确的键名Difficulty
        let difficulty_key = PropertyKey(0, "Difficulty".to_string());
        save.root
            .properties
            .0
            .insert(difficulty_key, difficulty_prop);
        println!("✅ 已创建难度字段: {}", difficulty_label);
    } else {
        println!("➖ 跳过难度字段创建（Normal难度）");
    }

    // 调试：打印根属性中的所有键
    println!("📜 根属性中的键:");
    for key in save.root.properties.0.keys() {
        println!("  - 类型: {}, 名称: {}", key.0, key.1);
    }

    // 查找 PlayerData_0 属性
    if let Some(player_data_prop) =
        get_property_by_name_mut(&mut save.root.properties, "PlayerData")
    {
        println!("🎯 成功找到 PlayerData_0 字段");

        // 确认它是 Map 类型
        if let PropertyInner::Map(ref mut map_value) = &mut player_data_prop.inner {
            println!(
                "🗺️ PlayerData_0 是 Map 类型，包含 {} 个条目",
                map_value.len()
            );

            for (i, entry) in map_value.iter_mut().enumerate() {
                println!("📍 处理 Map 条目 #{} 键: {:?}", i, entry.key);

                // 确保 value 是 Struct 类型
                if let PropertyValue::Struct(StructValue::Struct(ref mut player_struct)) =
                    &mut entry.value
                {
                    // 获取 Steam ID
                    let steam_id = match &entry.key {
                        PropertyValue::Str(s) => s.as_str(),
                        _ => {
                            println!("❌ 键不是字符串类型");
                            continue;
                        }
                    };

                    if steam_id.is_empty() {
                        println!("❌ 条目没有有效的 Steam ID");
                        continue;
                    }

                    println!("🆔 处理玩家 Steam ID: {}", steam_id);

                    // === 修改背包 ===
                    if let Some(inventory_prop) = get_property_by_name_mut(
                        player_struct,
                        "Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4",
                    ) {
                        println!("🎒 找到 Inventory 字段");

                        // 确认它是 Array 类型
                        if let PropertyInner::Array(ValueArray::Base(ref mut value_vec)) =
                            &mut inventory_prop.inner
                        {
                            if let ValueVec::Name(ref mut str_values) = value_vec {
                                // 清空原有背包内容
                                str_values.clear();

                                // 获取前端传来的物品列表
                                if let Some(items) =
                                    json_data["playerInventory"][steam_id].as_array()
                                {
                                    println!("📦 为该玩家找到 {} 个物品", items.len());

                                    for item_value in items.iter().take(12) {
                                        let item_id =
                                            item_value["item"]["id"].as_i64().unwrap_or(-1) as i32;
                                        let item_name = map_item_id_to_name(item_id);
                                        str_values.push(item_name.to_string());
                                        println!("🛍️ 添加物品: {}", item_name);
                                    }
                                } else {
                                    println!("⚠️ 没有为该玩家找到背包数据，跳过填充");
                                }
                            } else {
                                println!("❌ 背包数据不是 Name 类型");
                            }
                        } else {
                            println!("❌ 背包数据不是 Array 类型");
                        }
                    } else {
                        println!("❌ 在玩家数据中未找到背包字段");
                        // 打印玩家数据结构的所有键以帮助调试
                        println!("玩家数据结构中的键:");
                        for key in player_struct.0.keys() {
                            println!("  - 类型: {}, 名称: {}", key.0, key.1);
                        }
                    }

                    // === 修改理智值 ===
                    if let Some(sanity_prop) = get_property_by_name_mut(
                        player_struct,
                        "Sanity_6_A5AFAB454F51CC63745A669BD7E629F6",
                    ) {
                        println!("🧠 找到 Sanity 字段");

                        // 确认它是 Float 类型
                        if let PropertyInner::Float(ref mut val) = sanity_prop.inner {
                            // 获取前端传来的理智值
                            let new_sanity = json_data["playerSanity"][steam_id]
                                .as_f64()
                                .map(|v| v as f32) // 转换为f32
                                .unwrap_or_else(|| {
                                    println!("⚠️ 没有为该玩家找到理智值数据，保留原值: {}", *val);
                                    *val // 保留原值
                                });

                            *val = new_sanity;
                            println!("🧪 设置新理智值: {}", new_sanity);
                        } else {
                            println!("❌ Sanity 字段不是 Float 类型");
                        }
                    } else {
                        println!("❌ 在玩家数据中未找到 Sanity 字段");
                    }
                } else {
                    println!("❌ 玩家数据条目不是 Struct 类型");
                }
            }
        } else {
            println!("❌ PlayerData_0 不是 Map 类型");
            // 打印实际类型以帮助调试
            println!("PlayerData_0 的实际类型: {:?}", player_data_prop.inner);
        }
    } else {
        println!("❌ 没有找到 PlayerData_0 字段");
        // 打印根属性中的所有键以帮助调试
        println!("根属性中的键:");
        for key in save.root.properties.0.keys() {
            println!("  - 类型: {}, 名称: {}", key.0, key.1);
        }
    }

    // 删除原始存档文件（在写入新文件前删除）
    if Path::new(&original_path).exists() {
        fs::remove_file(&original_path).map_err(|e| format!("删除旧文件失败: {}", e))?;
        println!("🗑️ 已删除原存档文件");
    }

    // 写入新文件
    let file = File::create(&output_path).map_err(|e| format!("创建输出文件失败: {}", e))?;
    let mut writer = BufWriter::new(file);
    save.write(&mut writer)
        .map_err(|e| format!("写入存档失败: {:?}", e))?;

    println!("💾 存档已保存至: {:?}", output_path);

    // ✅ 移动文件到目标目录
    handle_file(output_path.to_str().unwrap_or("Invalid path").to_string())
}
