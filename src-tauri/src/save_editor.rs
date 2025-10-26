use serde_json::Value as JsonValue;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Write};
use std::path::Path;
use uesave::{
    Properties, Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyType, PropertyValue, Save, StructValue, ValueArray, ValueVec,
};use uuid;
// 获取本地应用数据目录的函数
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

// 物品ID到英文名的映射表
pub fn map_item_id_to_name(id: i32) -> &'static str {
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
        24 => "Knife",
        25 => "Toy",
        _ => "None",
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

/// 修改 CurrentLevel_0.Name 字段值，如果没有找到则创建新的
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
        println!("⚠️ 未找到 CurrentLevel_0 字段，正在创建新的...");
        
        // 创建新的 CurrentLevel_0 字段，使用正确的NameProperty结构
        let new_current_level = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::NameProperty),
            },
            inner: PropertyInner::Name(new_level_name.clone()),
        };
        
        let current_level_key = PropertyKey(0, "CurrentLevel".to_string());
        save.root.properties.0.insert(current_level_key, new_current_level);
        
        println!("✅ 已创建新的 CurrentLevel_0 字段，值为: {}", new_level_name);
        true
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

    let difficulty = json_data["difficulty"]
        .as_str()
        .ok_or("Invalid difficulty")?
        .to_string();

    // 确保难度首字母大写
    let capitalized_difficulty = difficulty[..1].to_uppercase() + &difficulty[1..];
    let new_filename = format!("{}_{}_{}.sav", mode.to_uppercase(), name, capitalized_difficulty);
    let output_path = Path::new(output_dir).join(&new_filename);

    println!("📂 正在读取原始存档文件: {:?}", original_path);

    let file = File::open(&original_path).map_err(|e| format!("打开存档文件失败: {}", e))?;
    let mut reader = BufReader::new(file);

    let mut save = Save::read(&mut reader).map_err(|e| format!("解析存档失败: {:?}", e))?;

    // === 处理Pipes1和Pipes2的特殊逻辑 ===
    let processed_level = if current_level == "Pipes1" {
        println!("🔄 检测到Pipes1，修改为Pipes并删除UnlockedFun_0");
        // 删除UnlockedFun_0字段
        let unlocked_fun_key = PropertyKey(0, "UnlockedFun".to_string());
        if save.root.properties.0.contains_key(&unlocked_fun_key) {
            save.root.properties.0.shift_remove(&unlocked_fun_key);
            println!("🗑️ 已删除UnlockedFun_0字段");
        }
        "Pipes".to_string()
    } else if current_level == "Pipes2" {
        println!("🔄 检测到Pipes2，修改为Pipes并创建UnlockedFun_0");
        // 创建UnlockedFun_0字段
        let unlocked_fun_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
            },
            inner: PropertyInner::Bool(true),
        };
        let unlocked_fun_key = PropertyKey(0, "UnlockedFun".to_string());
        save.root.properties.0.insert(unlocked_fun_key, unlocked_fun_prop);
        println!("✅ 已创建UnlockedFun_0字段");
        "Pipes".to_string()
    } else {
        current_level.to_string()
    };

    // === 修改 CurrentLevel_0.Name 字段 ===
    let success = modify_current_level(&mut save, processed_level.clone());
    if success {
        println!("✅ 当前关卡名称已修改为: {}", processed_level);
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

    println!("🔍 实际传入的难度值: '{}'", actual_difficulty);
    
    // 如果不是Normal难度，则创建新的难度字段
    if actual_difficulty != "Normal" {
        println!("🆕 创建新的难度字段");

        // 创建难度枚举对应的标签值
        let difficulty_label = match actual_difficulty.as_str() {
            "Easy" => "E_Difficulty::NewEnumerator0".to_string(),
            "Hard" => "E_Difficulty::NewEnumerator1".to_string(),
            "Nightmare" => "E_Difficulty::NewEnumerator2".to_string(),
            _ => {
                println!("⚠️ 未知难度值，使用默认: {}", actual_difficulty);
                "E_Difficulty::NewEnumerator0".to_string()
            }
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

    // 查找或创建 PlayerData_0 属性
    let player_data_key = PropertyKey(0, "PlayerData".to_string());
    
    if let Some(player_data_prop) = save.root.properties.0.get_mut(&player_data_key) {
        println!("🎯 成功找到 PlayerData_0 字段");

        // 确认它是 Map 类型
        if let PropertyInner::Map(ref mut map_value) = &mut player_data_prop.inner {
            println!(
                "🗺️ PlayerData_0 是 Map 类型，包含 {} 个条目",
                map_value.len()
            );

            // 收集需要处理的所有Steam ID（包括现有和新增的）
            let mut steam_ids_to_process = Vec::new();
            
            // 首先收集现有的Steam ID
            for entry in map_value.iter() {
                if let PropertyValue::Str(s) = &entry.key {
                    if !s.is_empty() {
                        steam_ids_to_process.push(s.to_string());
                    }
                }
            }
            
            // 然后检查前端传来的Steam ID，添加不存在的
            if let Some(player_inventory) = json_data["playerInventory"].as_object() {
                for steam_id in player_inventory.keys() {
                    let trimmed_id = steam_id.trim();
                    if !steam_ids_to_process.iter().any(|id| id.trim() == trimmed_id) {
                        steam_ids_to_process.push(trimmed_id.to_string());
                        println!("🆕 发现新增Steam ID: '{}'", trimmed_id);
                    }
                }
            }

            // 处理每个Steam ID
            for steam_id in steam_ids_to_process {
                println!("🆔 处理玩家 Steam ID: '{}'", steam_id);
                println!("📦 该Steam ID对应的背包数据: {:?}", json_data["playerInventory"][&steam_id]);
                
                // 查找或创建玩家条目
                let player_entry = map_value.iter_mut().find(|entry| {
                    if let PropertyValue::Str(s) = &entry.key {
                        s.trim() == steam_id.trim()
                    } else {
                        false
                    }
                });

                match player_entry {
                    Some(entry) => {
                        // 更新现有玩家
                        if let PropertyValue::Struct(StructValue::Struct(ref mut player_struct)) = &mut entry.value {
                            update_player_data(player_struct, &steam_id, json_data);
                        }
                    }
                    None => {
                        // 创建新玩家
                        println!("➕ 创建新玩家数据: {}", steam_id);
                        let new_player_struct = create_new_player_struct(&steam_id, json_data);
                        map_value.push(uesave::MapEntry {
                            key: PropertyValue::Str(steam_id.clone()),
                            value: PropertyValue::Struct(StructValue::Struct(new_player_struct)),
                        });
                    }
                }
            }
        } else {
            println!("❌ PlayerData_0 不是 Map 类型");
        }
    } else {
        println!("⚠️ 没有找到 PlayerData_0 字段，正在创建...");
        
        // 创建新的 PlayerData_0 字段
        let mut map_value = Vec::new();
        
        // 收集所有需要处理的Steam ID
        let mut steam_ids_to_process = Vec::new();
        
        // 检查前端传来的Steam ID
        if let Some(player_inventory) = json_data["playerInventory"].as_object() {
            for steam_id in player_inventory.keys() {
                steam_ids_to_process.push(steam_id.trim().to_string());
            }
        }
        
        // 如果没有Steam ID，添加一个默认的
        if steam_ids_to_process.is_empty() {
            steam_ids_to_process.push("76561199536995340".to_string()); // 默认Steam ID
        }

        // 为每个Steam ID创建玩家数据
        for steam_id in steam_ids_to_process {
            println!("🆕 创建新玩家数据: {}", steam_id);
            let new_player_struct = create_new_player_struct(&steam_id, json_data);
            map_value.push(uesave::MapEntry {
                key: PropertyValue::Str(steam_id.clone()),
                value: PropertyValue::Struct(StructValue::Struct(new_player_struct)),
            });
        }

        // 创建 PlayerData_0 属性
        let player_data_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Map {
                    key_type: Box::new(PropertyTagDataPartial::Other(PropertyType::StrProperty)),
                    value_type: Box::new(PropertyTagDataPartial::Struct {
                        struct_type: uesave::StructType::Struct(None),
                        id: uuid::Uuid::nil(),
                    }),
                },
            },
            inner: PropertyInner::Map(map_value),
        };

        save.root.properties.0.insert(player_data_key, player_data_prop);
        println!("✅ 已成功创建 PlayerData_0 字段");
    }

    // 辅助函数：更新现有玩家数据
    fn update_player_data(player_struct: &mut Properties, steam_id: &str, json_data: &JsonValue) {
        // === 修改背包 ===
        println!("🔍 正在查找背包属性: Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4_0");
        if let Some(inventory_prop) = get_property_by_name_mut(
            player_struct,
            "Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4",
        ) {
            if let PropertyInner::Array(ValueArray::Base(ref mut value_vec)) = &mut inventory_prop.inner {
                if let ValueVec::Name(ref mut str_values) = value_vec {
                    str_values.clear();
                    if let Some(items) = json_data["playerInventory"][steam_id].as_array() {
                        for item_value in items.iter().take(12) {
                            let item_id = item_value["item"]["id"].as_i64().unwrap_or(-1) as i32;
                            let item_name = map_item_id_to_name(item_id);
                            str_values.push(item_name.to_string());
                        }
                    }
                    // 确保有12个槽位
                    while str_values.len() < 12 {
                        str_values.push("None".to_string());
                    }
                }
            }
        }

        // === 修改理智值 ===
        println!("🧠 正在查找理智值属性: Sanity_6_A5AFAB454F51CC63745A669BD7E629F6_0");
        if let Some(sanity_prop) = get_property_by_name_mut(
            player_struct,
            "Sanity_6_A5AFAB454F51CC63745A669BD7E629F6",
        ) {
            if let PropertyInner::Float(ref mut val) = sanity_prop.inner {
                let new_sanity = json_data["playerSanity"][steam_id]
                    .as_f64()
                    .map(|v| v as f32)
                    .unwrap_or(100.0); // 默认值
                *val = new_sanity.clamp(0.0, 100.0);
            }
        }
    }

    // 辅助函数：创建新玩家数据结构
    fn create_new_player_struct(steam_id: &str, json_data: &JsonValue) -> Properties {
        println!("🆕 开始创建新玩家数据结构: {}", steam_id);
        let mut properties = Properties::default();

        // 创建背包属性
        let mut inventory_items = Vec::new();
        if let Some(items) = json_data["playerInventory"][steam_id].as_array() {
            println!("📦 找到背包数据，物品数量: {}", items.len());
            for (i, item_value) in items.iter().take(12).enumerate() {
                let item_id = item_value["item"]["id"].as_i64().unwrap_or(-1) as i32;
                let item_name = map_item_id_to_name(item_id);
                println!("🎒 槽位 {}: ID={}, 名称={}", i, item_id, item_name);
                inventory_items.push(item_name.to_string());
            }
        } else {
            println!("⚠️ 未找到背包数据，填充12个空槽位");
            // 填充12个空槽位
            inventory_items.resize(12, "None".to_string());
        }
        
        // 确保正好12个槽位
        inventory_items.truncate(12);
        while inventory_items.len() < 12 {
            inventory_items.push("None".to_string());
        }
        
        println!("✅ 最终背包物品: {:?}", inventory_items);

        let inventory_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(PropertyType::NameProperty))),
            },
            inner: PropertyInner::Array(ValueArray::Base(ValueVec::Name(inventory_items))),
        };

        // 创建理智值属性
        let sanity_value = json_data["playerSanity"][steam_id]
            .as_f64()
            .map(|v| v as f32)
            .unwrap_or(100.0)
            .clamp(0.0, 100.0);

        let sanity_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
            },
            inner: PropertyInner::Float(sanity_value),
        };

        // 插入属性 - 使用正确的属性名称格式（与test3.json完全一致）
        properties.0.insert(
            PropertyKey(0, "Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4".to_string()),
            inventory_prop,
        );
        properties.0.insert(
            PropertyKey(0, "Sanity_6_A5AFAB454F51CC63745A669BD7E629F6".to_string()),
            sanity_prop,
        );

        properties
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

    // 更新 MAINSAVE.sav 文件
    update_mainsave_after_edit(&new_filename)?;

    // ✅ 直接返回新文件路径，不移动文件
    Ok(output_path.to_str().unwrap_or("Invalid path").to_string())
}

// 编辑存档后更新 MAINSAVE.sav 文件
fn update_mainsave_after_edit(new_filename: &str) -> Result<(), String> {
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
    let archive_name = new_filename.trim_end_matches(".sav");
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

// 隐藏存档 - 从 MAINSAVE.sav 文件的 SingleplayerSaves 列表中移除存档名称
pub fn hide_archive_in_mainsave(filename_to_hide: &str) -> Result<(), String> {
    println!("👻 正在从 MAINSAVE.sav 文件中隐藏存档: {}", filename_to_hide);
    
    // 获取存档目录
    let save_dir = get_local_appdata_dir()?.join("EscapeTheBackrooms/Saved/SaveGames");
    let mainsave_path = save_dir.join("MAINSAVE.sav");
    
    if !mainsave_path.exists() {
        println!("⚠️ MAINSAVE.sav 不存在，跳过隐藏操作");
        return Ok(());
    }
    
    // 使用 uesave 读取 MAINSAVE.sav 文件
    let file = fs::File::open(&mainsave_path)
        .map_err(|e| format!("打开 MAINSAVE.sav 文件失败: {}", e))?;
    let mut reader = BufReader::new(file);
    
    let mut mainsave = Save::read(&mut reader)
        .map_err(|e| format!("解析 MAINSAVE.sav 文件失败: {:?}", e))?;
    
    // 获取要隐藏的存档名称（不带 .sav 后缀）
    let archive_name_to_hide = filename_to_hide.trim_end_matches(".sav");
    println!("📄 要隐藏的存档名称: {}", archive_name_to_hide);
    
    // 查找 SingleplayerSaves 字段
    let singleplayer_saves_key = PropertyKey(0, "SingleplayerSaves".to_string());
    
    let mut found_and_removed = false;
    
    if let Some(singleplayer_saves_prop) = mainsave.root.properties.0.get_mut(&singleplayer_saves_key) {
        // 获取现有的 Str 数组
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut existing_saves))) = &mut singleplayer_saves_prop.inner {
            // 查找并删除指定的存档名称
            let original_len = existing_saves.len();
            existing_saves.retain(|save_name| save_name != archive_name_to_hide);
            
            if existing_saves.len() < original_len {
                found_and_removed = true;
                println!("✅ 已从 SingleplayerSaves 列表中隐藏: {}", archive_name_to_hide);
                println!("📋 当前SingleplayerSaves列表: {:?}", existing_saves);
            } else {
                println!("ℹ️ 未在 SingleplayerSaves 列表中找到: {}", archive_name_to_hide);
            }
        } else {
            return Err("SingleplayerSaves 字段结构不符合预期".to_string());
        }
    } else {
        println!("ℹ️ SingleplayerSaves 字段不存在，无需隐藏");
        return Ok(());
    }
    
    // 只有在实际隐藏了存档记录的情况下才保存文件
    if found_and_removed {
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
        
        println!("✅ MAINSAVE.sav 文件更新完成（已隐藏存档）");
    }
    
    Ok(())
}

// 显示存档 - 向 MAINSAVE.sav 文件的 SingleplayerSaves 列表中添加存档名称
pub fn show_archive_in_mainsave(filename_to_show: &str) -> Result<(), String> {
    println!("👁️ 正在向 MAINSAVE.sav 文件中显示存档: {}", filename_to_show);
    
    // 获取存档目录
    let save_dir = get_local_appdata_dir()?.join("EscapeTheBackrooms/Saved/SaveGames");
    let mainsave_path = save_dir.join("MAINSAVE.sav");
    
    if !mainsave_path.exists() {
        println!("⚠️ MAINSAVE.sav 不存在，跳过显示操作");
        return Ok(());
    }
    
    // 使用 uesave 读取 MAINSAVE.sav 文件
    let file = fs::File::open(&mainsave_path)
        .map_err(|e| format!("打开 MAINSAVE.sav 文件失败: {}", e))?;
    let mut reader = BufReader::new(file);
    
    let mut mainsave = Save::read(&mut reader)
        .map_err(|e| format!("解析 MAINSAVE.sav 文件失败: {:?}", e))?;
    
    // 获取要显示的存档名称（不带 .sav 后缀）
    let archive_name_to_show = filename_to_show.trim_end_matches(".sav");
    println!("📄 要显示的存档名称: {}", archive_name_to_show);
    
    // 查找 SingleplayerSaves 字段
    let singleplayer_saves_key = PropertyKey(0, "SingleplayerSaves".to_string());
    
    if let Some(singleplayer_saves_prop) = mainsave.root.properties.0.get_mut(&singleplayer_saves_key) {
        // 获取现有的 Str 数组
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut existing_saves))) = &mut singleplayer_saves_prop.inner {
            // 检查是否已存在相同的存档名称
            if !existing_saves.contains(&archive_name_to_show.to_string()) {
                // 添加新的存档名称到列表
            existing_saves.push(archive_name_to_show.to_string());
            println!("✅ 已添加存档名称到 SingleplayerSaves 列表: {}", archive_name_to_show);
            println!("📋 当前SingleplayerSaves列表: {:?}", existing_saves);
            } else {
                println!("ℹ️ 存档名称已存在于 SingleplayerSaves 列表中: {}", archive_name_to_show);
            }
        } else {
            return Err("SingleplayerSaves 字段结构不符合预期".to_string());
        }
    } else {
        // 如果 SingleplayerSaves 字段不存在，创建它
        let saves_list = vec![archive_name_to_show.to_string()];
        
        let new_singleplayer_saves = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(PropertyType::StrProperty))),
            },
            inner: PropertyInner::Array(ValueArray::Base(ValueVec::Str(saves_list))),
        };
        
        mainsave.root.properties.0.insert(singleplayer_saves_key, new_singleplayer_saves);
        println!("✅ 已创建新的 SingleplayerSaves 字段并添加存档名称: {}", archive_name_to_show);
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
    
    println!("✅ MAINSAVE.sav 文件更新完成（已显示存档）");
    Ok(())
}

// 删除存档后更新 MAINSAVE.sav 文件（从列表中移除）
pub fn update_mainsave_after_delete(filename_to_remove: &str) -> Result<(), String> {
    println!("🗑️ 正在从 MAINSAVE.sav 文件中删除存档记录...");
    
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
    
    // 获取要删除的存档名称（不带 .sav 后缀）
    let archive_name_to_remove = filename_to_remove.trim_end_matches(".sav");
    println!("📄 要删除的存档名称: {}", archive_name_to_remove);
    
    // 查找 SingleplayerSaves 字段
    let singleplayer_saves_key = PropertyKey(0, "SingleplayerSaves".to_string());
    
    let mut found_and_removed = false;
    
    if let Some(singleplayer_saves_prop) = mainsave.root.properties.0.get_mut(&singleplayer_saves_key) {
        // 获取现有的 Str 数组
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut existing_saves))) = &mut singleplayer_saves_prop.inner {
            // 查找并删除指定的存档名称
            let original_len = existing_saves.len();
            existing_saves.retain(|save_name| save_name != archive_name_to_remove);
            
            if existing_saves.len() < original_len {
                found_and_removed = true;
                println!("✅ 已从 SingleplayerSaves 列表中删除: {}", archive_name_to_remove);
            } else {
                println!("ℹ️ 未在 SingleplayerSaves 列表中找到: {}", archive_name_to_remove);
            }
        } else {
            return Err("SingleplayerSaves 字段结构不符合预期".to_string());
        }
    } else {
        println!("ℹ️ SingleplayerSaves 字段不存在，无需删除");
        return Ok(());
    }
    
    // 只有在实际删除了存档记录的情况下才保存文件
    if found_and_removed {
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
        
        println!("✅ MAINSAVE.sav 文件更新完成（已删除存档记录）");
    }
    
    Ok(())
}
