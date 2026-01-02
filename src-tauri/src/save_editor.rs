use crate::common::{add_save_to_mainsave, extract_archive_name};
use serde_json::Value as JsonValue;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter};
use std::path::Path;
use uesave::{
    Properties, Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyType, PropertyValue, Save, StructType, StructValue, ValueArray, ValueVec,
};
use uuid;

/// 物品ID到英文名的映射表
const ITEM_MAP: &[(i32, &str)] = &[
    (1, "AlmondConcentrate"),
    (2, "BugSpray"),
    (3, "Camera"),
    (4, "AlmondWater"),
    (5, "Chainsaw"),
    (6, "DivingHelmet"),
    (7, "EnergyBar"),
    (8, "Firework"),
    (9, "Flaregun"),
    (10, "Flashlight"),
    (11, "GlowstickBlue"),
    (12, "GlowStick"),
    (13, "GlowstickRed"),
    (14, "GlowstickYellow"),
    (15, "Juice"),
    (16, "LiquidPain"),
    (17, "Rope"),
    (18, "LiDAR"),
    (19, "Thermometer"),
    (20, "Ticket"),
    (21, "WalkieTalkie"),
    (22, "MothJelly"),
    (23, "Crowbar"),
    (24, "Knife"),
    (25, "Toy"),
];

/// 物品ID到英文名的映射
pub fn map_item_id_to_name(id: i32) -> &'static str {
    ITEM_MAP
        .iter()
        .find(|(item_id, _)| *item_id == id)
        .map(|(_, name)| *name)
        .unwrap_or("None")
}

/// 背包属性名称
const INVENTORY_PROP_NAME: &str = "Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4";
/// 理智值属性名称
const SANITY_PROP_NAME: &str = "Sanity_6_A5AFAB454F51CC63745A669BD7E629F6";
/// 背包槽位数量
const INVENTORY_SLOTS: usize = 12;

/// 辅助函数：按名称查找属性（忽略类型ID）
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

/// 修改 CurrentLevel_0.Name 字段值
pub fn modify_current_level(save: &mut Save, new_level_name: String) -> bool {
    let key = PropertyKey(0, "CurrentLevel".to_string());

    if let Some(current_level_prop) = save.root.properties.0.get_mut(&key) {
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

        let new_current_level = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::NameProperty),
            },
            inner: PropertyInner::Name(new_level_name.clone()),
        };

        save.root.properties.0.insert(key, new_current_level);
        println!(
            "✅ 已创建新的 CurrentLevel_0 字段，值为: {}",
            new_level_name
        );
        true
    }
}

/// 处理 Pipes 层级的特殊逻辑
fn process_pipes_level(save: &mut Save, level: &str) -> String {
    let unlocked_fun_key = PropertyKey(0, "UnlockedFun".to_string());

    match level {
        "Pipes1" => {
            println!("🔄 检测到Pipes1，修改为Pipes并删除UnlockedFun_0");
            if save.root.properties.0.contains_key(&unlocked_fun_key) {
                save.root.properties.0.shift_remove(&unlocked_fun_key);
                println!("🗑️ 已删除UnlockedFun_0字段");
            }
            "Pipes".to_string()
        }
        "Pipes2" => {
            println!("🔄 检测到Pipes2，修改为Pipes并创建UnlockedFun_0");
            let unlocked_fun_prop = Property {
                tag: PropertyTagPartial {
                    id: None,
                    data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
                },
                inner: PropertyInner::Bool(true),
            };
            save.root
                .properties
                .0
                .insert(unlocked_fun_key, unlocked_fun_prop);
            println!("✅ 已创建UnlockedFun_0字段");
            "Pipes".to_string()
        }
        _ => level.to_string(),
    }
}

/// 更新难度设置
fn update_difficulty(save: &mut Save, actual_difficulty: &str) {
    println!("⚙️ 开始处理难度设置: {}", actual_difficulty);

    // 删除所有难度字段
    let difficulty_keys: Vec<(u32, String)> = save
        .root
        .properties
        .0
        .keys()
        .filter(|key| key.1.starts_with("Difficulty"))
        .map(|key| (key.0, key.1.clone()))
        .collect();

    for (id, name) in difficulty_keys {
        println!("🗑️ 删除难度字段: {}", name);
        save.root.properties.0.shift_remove(&PropertyKey(id, name));
    }

    // 如果不是Normal难度，创建新的难度字段
    if actual_difficulty != "Normal" {
        let difficulty_label = match actual_difficulty {
            "Easy" => "E_Difficulty::NewEnumerator0",
            "Hard" => "E_Difficulty::NewEnumerator1",
            "Nightmare" => "E_Difficulty::NewEnumerator2",
            _ => {
                println!("⚠️ 未知难度值，使用默认: {}", actual_difficulty);
                "E_Difficulty::NewEnumerator0"
            }
        };

        let difficulty_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Byte(Some("E_Difficulty".to_string())),
            },
            inner: PropertyInner::Byte(uesave::Byte::Label(difficulty_label.to_string())),
        };

        save.root
            .properties
            .0
            .insert(PropertyKey(0, "Difficulty".to_string()), difficulty_prop);
        println!("✅ 已创建难度字段: {}", difficulty_label);
    } else {
        println!("➖ 跳过难度字段创建（Normal难度）");
    }
}

/// 创建背包属性
fn create_inventory_property(items: Vec<String>) -> Property {
    Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(
                PropertyType::NameProperty,
            ))),
        },
        inner: PropertyInner::Array(ValueArray::Base(ValueVec::Name(items))),
    }
}

/// 创建理智值属性
fn create_sanity_property(sanity: f32) -> Property {
    Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
        },
        inner: PropertyInner::Float(sanity.clamp(0.0, 100.0)),
    }
}

/// 从 JSON 数据中提取背包物品
fn extract_inventory_items(json_data: &JsonValue, steam_id: &str) -> Vec<String> {
    let mut items = Vec::with_capacity(INVENTORY_SLOTS);

    if let Some(inventory) = json_data["playerInventory"][steam_id].as_array() {
        for item_value in inventory.iter().take(INVENTORY_SLOTS) {
            let item_id = item_value["item"]["id"].as_i64().unwrap_or(-1) as i32;
            items.push(map_item_id_to_name(item_id).to_string());
        }
    }

    // 确保正好12个槽位
    items.resize(INVENTORY_SLOTS, "None".to_string());
    items
}

/// 更新现有玩家数据
fn update_player_data(player_struct: &mut Properties, steam_id: &str, json_data: &JsonValue) {
    // 修改背包
    if let Some(inventory_prop) = get_property_by_name_mut(player_struct, INVENTORY_PROP_NAME) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Name(ref mut str_values))) =
            &mut inventory_prop.inner
        {
            *str_values = extract_inventory_items(json_data, steam_id);
        }
    }

    // 修改理智值
    if let Some(sanity_prop) = get_property_by_name_mut(player_struct, SANITY_PROP_NAME) {
        if let PropertyInner::Float(ref mut val) = sanity_prop.inner {
            let new_sanity = json_data["playerSanity"][steam_id]
                .as_f64()
                .map(|v| v as f32)
                .unwrap_or(100.0);
            *val = new_sanity.clamp(0.0, 100.0);
        }
    }
}

/// 创建新玩家数据结构
fn create_new_player_struct(steam_id: &str, json_data: &JsonValue) -> Properties {
    println!("🆕 开始创建新玩家数据结构: {}", steam_id);
    let mut properties = Properties::default();

    let inventory_items = extract_inventory_items(json_data, steam_id);
    println!("✅ 最终背包物品: {:?}", inventory_items);

    let sanity_value = json_data["playerSanity"][steam_id]
        .as_f64()
        .map(|v| v as f32)
        .unwrap_or(100.0)
        .clamp(0.0, 100.0);

    properties.0.insert(
        PropertyKey(0, INVENTORY_PROP_NAME.to_string()),
        create_inventory_property(inventory_items),
    );
    properties.0.insert(
        PropertyKey(0, SANITY_PROP_NAME.to_string()),
        create_sanity_property(sanity_value),
    );

    properties
}

pub fn edit_save_file(json_data: &JsonValue, output_dir: &str) -> Result<String, String> {
    println!("🔧 开始处理存档文件...");

    let original_path = json_data["path"]
        .as_str()
        .ok_or("Missing path in JSON data")?
        .to_string();

    // 提取必要的字段
    let name = json_data["name"].as_str().ok_or("Invalid name")?;
    let mode = json_data["mode"].as_str().ok_or("Invalid mode")?;
    let current_level = json_data["currentLevel"]
        .as_str()
        .ok_or("Invalid currentLevel")?;
    let actual_difficulty = json_data["actualDifficulty"]
        .as_str()
        .ok_or("Invalid actualDifficulty")?;
    let difficulty = json_data["difficulty"]
        .as_str()
        .ok_or("Invalid difficulty")?;

    // 确保难度首字母大写
    let capitalized_difficulty = {
        let mut chars = difficulty.chars();
        match chars.next() {
            Some(c) => c.to_uppercase().collect::<String>() + chars.as_str(),
            None => String::new(),
        }
    };

    let new_filename = format!(
        "{}_{}_{}.sav",
        mode.to_uppercase(),
        name,
        capitalized_difficulty
    );
    let output_path = Path::new(output_dir).join(&new_filename);

    println!("📂 正在读取原始存档文件: {:?}", original_path);

    let file = File::open(&original_path).map_err(|e| format!("打开存档文件失败: {}", e))?;
    let mut reader = BufReader::new(file);
    let mut save = Save::read(&mut reader).map_err(|e| format!("解析存档失败: {:?}", e))?;

    // 处理 Pipes 层级
    let processed_level = process_pipes_level(&mut save, current_level);

    // 修改 CurrentLevel
    if modify_current_level(&mut save, processed_level.clone()) {
        println!("✅ 当前关卡名称已修改为: {}", processed_level);
    }

    // 更新难度
    update_difficulty(&mut save, actual_difficulty);

    // 处理玩家数据
    process_player_data(&mut save, json_data)?;

    // 删除原始存档文件
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

    // 更新 MAINSAVE.sav
    let archive_name = extract_archive_name(&new_filename);
    add_save_to_mainsave(archive_name)?;

    Ok(output_path.to_str().unwrap_or("Invalid path").to_string())
}

/// 处理玩家数据
fn process_player_data(save: &mut Save, json_data: &JsonValue) -> Result<(), String> {
    let player_data_key = PropertyKey(0, "PlayerData".to_string());

    // 收集所有需要处理的 Steam ID
    let mut steam_ids_to_process: Vec<String> = Vec::new();

    // 从现有数据中收集
    if let Some(player_data_prop) = save.root.properties.0.get(&player_data_key) {
        if let PropertyInner::Map(ref map_value) = &player_data_prop.inner {
            for entry in map_value.iter() {
                if let PropertyValue::Str(s) = &entry.key {
                    if !s.is_empty() {
                        steam_ids_to_process.push(s.to_string());
                    }
                }
            }
        }
    }

    // 从前端数据中添加新的 Steam ID
    if let Some(player_inventory) = json_data["playerInventory"].as_object() {
        for steam_id in player_inventory.keys() {
            let trimmed_id = steam_id.trim();
            if !steam_ids_to_process
                .iter()
                .any(|id| id.trim() == trimmed_id)
            {
                steam_ids_to_process.push(trimmed_id.to_string());
                println!("🆕 发现新增Steam ID: '{}'", trimmed_id);
            }
        }
    }

    // 处理玩家数据
    if let Some(player_data_prop) = save.root.properties.0.get_mut(&player_data_key) {
        if let PropertyInner::Map(ref mut map_value) = &mut player_data_prop.inner {
            for steam_id in &steam_ids_to_process {
                let player_entry = map_value.iter_mut().find(|entry| {
                    matches!(&entry.key, PropertyValue::Str(s) if s.trim() == steam_id.trim())
                });

                match player_entry {
                    Some(entry) => {
                        if let PropertyValue::Struct(StructValue::Struct(ref mut player_struct)) =
                            &mut entry.value
                        {
                            update_player_data(player_struct, steam_id, json_data);
                        }
                    }
                    None => {
                        println!("➕ 创建新玩家数据: {}", steam_id);
                        let new_player_struct = create_new_player_struct(steam_id, json_data);
                        map_value.push(uesave::MapEntry {
                            key: PropertyValue::Str(steam_id.clone()),
                            value: PropertyValue::Struct(StructValue::Struct(new_player_struct)),
                        });
                    }
                }
            }
        }
    } else {
        // 创建新的 PlayerData_0 字段
        create_player_data_field(save, &steam_ids_to_process, json_data);
    }

    Ok(())
}

/// 创建 PlayerData 字段
fn create_player_data_field(save: &mut Save, steam_ids: &[String], json_data: &JsonValue) {
    println!("⚠️ 没有找到 PlayerData_0 字段，正在创建...");

    let mut map_value = Vec::new();
    let ids_to_use = if steam_ids.is_empty() {
        vec!["76561199536995340".to_string()] // 默认 Steam ID
    } else {
        steam_ids.to_vec()
    };

    for steam_id in ids_to_use {
        println!("🆕 创建新玩家数据: {}", steam_id);
        let new_player_struct = create_new_player_struct(&steam_id, json_data);
        map_value.push(uesave::MapEntry {
            key: PropertyValue::Str(steam_id),
            value: PropertyValue::Struct(StructValue::Struct(new_player_struct)),
        });
    }

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

    save.root
        .properties
        .0
        .insert(PropertyKey(0, "PlayerData".to_string()), player_data_prop);
    println!("✅ 已成功创建 PlayerData_0 字段");
}

/// LevelsCompleted 结构体字段名称
const DISPLAY_NAME_FIELD: &str = "DisplayName_24_E62A59304187EE5783D725B3DCDE520C";
const HAS_COMPLETED_FIELD: &str = "HasCompleted_4_EA1ED1B4409DB7F46F5846B1CB695EF3";
const HAS_UNLOCKED_HUB_FIELD: &str = "HasUnlockedHub_21_7FD307464C90A6868642B3AEBCDA508D";

/// 用于解锁枢纽门的层级列表（排除不需要的层级）
const HUB_DOOR_LEVELS: &[(&str, &str)] = &[
    ("Level 0", "Level0"),
    ("Habitable Zone", "TopFloor"),
    ("Habitable Zone", "MiddleFloor"),
    ("Habitable Zone", "GarageLevel2"),
    ("Habitable Zone", "BottomFloor"),
    ("The Hub", "TheHub"),
    ("Pipe Dreams", "Pipes"),
    ("Electrical Station", "ElectricalStation"),
    ("Abandoned Office", "Office"),
    ("Terror Hotel", "Hotel"),
    ("Terror Hotel", "Floor3"),
    ("Terror Hotel", "BoilerRoom"),
    ("Level Fun", "LevelFun"),
    ("The Poolrooms", "Poolrooms"),
    ("Run for your Life!", "LevelRun"),
    ("The End", "TheEnd"),
    ("Level 94", "Level94"),
    ("Level 94", "AnimatedKingdom"),
    ("Lights Out", "LightsOut"),
    ("Thalassophobia", "OceanMap"),
    ("Cave System", "CaveLevel"),
    ("Level 188", "Level05"),
    ("Level 9", "Level9"),
    ("Level 9", "AbandonedBase"),
    ("Level 10", "Level10"),
    ("Level 3999", "Level3999"),
    ("Level 0.2", "Level07"),
    ("Snackrooms", "Snackrooms"),
    ("Level !~!", "LevelDash"),
    ("Level 188 Expanded", "Level188_Expanded"),
    ("The Poolrooms Expanded", "Poolrooms_Expanded"),
    ("Level Fun Expanded", "LevelFun_Expanded"),
    ("Level 52", "Level52"),
    ("Level 55.1", "TunnelLevel"),
];
const LEVEL_NAME_FIELD: &str = "LevelName_8_4C45C1AA462CC6194F50ADAADFB106A8";
const TIME_FIELD: &str = "Time_2_59B2BD3A4F00EEBB9DEECCA10EEA1022";
const WORLD_FIELD: &str = "World_14_07F9F91140BC22FA10EDBA9F6EED48E9";

/// 创建默认的 World 属性
fn create_default_world_property() -> Property {
    let mut world_inner_props = Properties::default();

    // Items 数组（空）
    let items_prop = Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Struct {
                struct_type: StructType::Struct(Some("S_DroppedItem".to_string())),
                id: uuid::Uuid::nil(),
            })),
        },
        inner: PropertyInner::Array(ValueArray::Struct {
            id: Some(uuid::Uuid::nil()),
            struct_type: StructType::Struct(Some("S_DroppedItem".to_string())),
            type_: PropertyType::StructProperty,
            value: vec![],
        }),
    };
    world_inner_props.0.insert(
        PropertyKey(0, "Items_19_783746F14C74611D03643BB2DF689058".to_string()),
        items_prop,
    );

    // SanityLevel
    let sanity_prop = Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
        },
        inner: PropertyInner::Float(100.0),
    };
    world_inner_props.0.insert(
        PropertyKey(
            0,
            "SanityLevel_16_3DCC15864CC44BF25D86A09EED0B2065".to_string(),
        ),
        sanity_prop,
    );

    Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Struct {
                struct_type: StructType::Struct(Some("S_WorldCommon".to_string())),
                id: uuid::Uuid::nil(),
            },
        },
        inner: PropertyInner::Struct(StructValue::Struct(world_inner_props)),
    }
}

/// 创建单个层级的结构体
fn create_level_struct(display_name: &str, level_name: &str) -> StructValue {
    let mut level_props = Properties::default();

    // DisplayName
    level_props.0.insert(
        PropertyKey(0, DISPLAY_NAME_FIELD.to_string()),
        Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::StrProperty),
            },
            inner: PropertyInner::Str(display_name.to_string()),
        },
    );

    // HasCompleted - true
    level_props.0.insert(
        PropertyKey(0, HAS_COMPLETED_FIELD.to_string()),
        Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
            },
            inner: PropertyInner::Bool(true),
        },
    );

    // HasUnlockedHub - true
    level_props.0.insert(
        PropertyKey(0, HAS_UNLOCKED_HUB_FIELD.to_string()),
        Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
            },
            inner: PropertyInner::Bool(true),
        },
    );

    // LevelName
    level_props.0.insert(
        PropertyKey(0, LEVEL_NAME_FIELD.to_string()),
        Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::NameProperty),
            },
            inner: PropertyInner::Name(level_name.to_string()),
        },
    );

    // Time
    level_props.0.insert(
        PropertyKey(0, TIME_FIELD.to_string()),
        Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
            },
            inner: PropertyInner::Float(-1.0),
        },
    );

    // World
    level_props.0.insert(
        PropertyKey(0, WORLD_FIELD.to_string()),
        create_default_world_property(),
    );

    StructValue::Struct(level_props)
}

/// 解锁全部枢纽门
/// 读取存档中的 LevelsCompleted_0，补全到 ALL_LEVELS 的数量，并将所有 Bool 值设为 true
pub fn unlock_all_hub_doors(file_path: &str) -> Result<String, String> {
    println!("🔓 开始解锁全部枢纽门: {}", file_path);

    let file = File::open(file_path).map_err(|e| format!("打开存档文件失败: {}", e))?;
    let mut reader = BufReader::new(file);
    let mut save = Save::read(&mut reader).map_err(|e| format!("解析存档失败: {:?}", e))?;

    let levels_completed_key = PropertyKey(0, "LevelsCompleted".to_string());

    // 获取现有的 LevelsCompleted_0
    let levels_completed_prop = save
        .root
        .properties
        .0
        .get_mut(&levels_completed_key)
        .ok_or("未找到 LevelsCompleted_0 字段")?;

    if let PropertyInner::Array(ValueArray::Struct {
        id: _,
        struct_type: _,
        type_: _,
        value,
    }) = &mut levels_completed_prop.inner
    {
        println!(
            "📊 当前层级数量: {}, 目标数量: {}",
            value.len(),
            HUB_DOOR_LEVELS.len()
        );

        // 收集现有的 LevelName
        let mut existing_levels: std::collections::HashSet<String> =
            std::collections::HashSet::new();

        for level_struct in value.iter_mut() {
            if let StructValue::Struct(props) = level_struct {
                // 获取 LevelName
                if let Some(level_name_prop) =
                    props.0.iter().find(|(k, _)| k.1.starts_with("LevelName"))
                {
                    if let PropertyInner::Name(name) = &level_name_prop.1.inner {
                        existing_levels.insert(name.clone());
                    }
                }

                // 将所有 Bool 值设为 true
                for (_, prop) in props.0.iter_mut() {
                    if let PropertyInner::Bool(ref mut b) = prop.inner {
                        *b = true;
                    }
                }
            }
        }

        println!("📝 现有层级: {:?}", existing_levels);

        // 添加缺失的层级
        for (display_name, level_name) in HUB_DOOR_LEVELS.iter() {
            if !existing_levels.contains(*level_name) {
                println!("➕ 添加缺失层级: {} ({})", display_name, level_name);
                value.push(create_level_struct(display_name, level_name));
            }
        }

        println!("✅ 处理后层级数量: {}", value.len());
    } else {
        return Err("LevelsCompleted_0 格式不正确".to_string());
    }

    // 写回文件
    let file = File::create(file_path).map_err(|e| format!("创建输出文件失败: {}", e))?;
    let mut writer = BufWriter::new(file);
    save.write(&mut writer)
        .map_err(|e| format!("写入存档失败: {:?}", e))?;

    println!("💾 枢纽门解锁完成，存档已保存");
    Ok("解锁成功".to_string())
}
