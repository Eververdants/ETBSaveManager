use crate::common::{add_save_to_mainsave, extract_archive_name, get_local_appdata_dir};
use crate::save_editor::map_item_id_to_name;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::fs;
use std::io::{BufWriter, Write};
use uesave::{
    Properties, Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyType, Save, StructType, StructValue, ValueArray, ValueVec,
};
use uuid;

/// Main storyline level data: (DisplayName, LevelName)
/// Arranged by game progress order - first 17 of endingLevelsData[0]
const MAIN_STORYLINE_LEVELS: &[(&str, &str)] = &[
    ("Level 0", "Level0"),
    ("Habitable Zone", "TopFloor"),
    ("Habitable Zone", "MiddleFloor"),
    ("Habitable Zone", "GarageLevel2"),
    ("Habitable Zone", "BottomFloor"),
    ("The Hub", "TheHub"),
    ("Pipe Dreams", "Pipes1"),
    ("Electrical Station", "ElectricalStation"),
    ("Abandoned Office", "Office"),
    ("Terror Hotel", "Hotel"),
    ("Terror Hotel", "Floor3"),
    ("Terror Hotel", "BoilerRoom"),
    ("Pipe Dreams", "Pipes2"),
    ("Level Fun", "LevelFun"),
    ("The Poolrooms", "Poolrooms"),
    ("Run for your Life!", "LevelRun"),
    ("The End", "TheEnd"),
];

/// 全部层级数据（endingLevelsData[0] 的完整列表）：(DisplayName, LevelName)
/// 用于支线剧情时生成全部层级
pub const ALL_LEVELS: &[(&str, &str)] = &[
    ("Level 0", "Level0"),
    ("Habitable Zone", "TopFloor"),
    ("Habitable Zone", "MiddleFloor"),
    ("Habitable Zone", "GarageLevel2"),
    ("Habitable Zone", "BottomFloor"),
    ("The Hub", "TheHub"),
    ("Pipe Dreams", "Pipes1"),
    ("Electrical Station", "ElectricalStation"),
    ("Abandoned Office", "Office"),
    ("Terror Hotel", "Hotel"),
    ("Terror Hotel", "Floor3"),
    ("Terror Hotel", "BoilerRoom"),
    ("Pipe Dreams", "Pipes2"),
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
    ("The Poolrooms Expanded", "WaterPark_Level01_P"),
    ("The Poolrooms Expanded", "WaterPark_Level02_P"),
    ("The Poolrooms Expanded", "WaterPark_Level03_P"),
    ("Level Fun Expanded", "LevelFun_Expanded"),
    ("Level Fun Expanded", "Zone1_Modified"),
    ("Level Fun Expanded", "Zone2_Modified"),
    ("Level Fun Expanded", "Zone3_Baked"),
    ("Level Fun Expanded", "Zone4"),
    ("Level 52", "Level52"),
    ("Level 55.1", "TunnelLevel"),
];

/// Inventory slot count
const INVENTORY_SLOTS: usize = 12;
/// Inventory property name
const INVENTORY_PROP_NAME: &str = "Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4";
/// Sanity property name
const SANITY_PROP_NAME: &str = "Sanity_6_A5AFAB454F51CC63745A669BD7E629F6";

/// LevelsCompleted struct field names
const DISPLAY_NAME_FIELD: &str = "DisplayName_24_E62A59304187EE5783D725B3DCDE520C";
const HAS_COMPLETED_FIELD: &str = "HasCompleted_4_EA1ED1B4409DB7F46F5846B1CB695EF3";
const HAS_UNLOCKED_HUB_FIELD: &str = "HasUnlockedHub_21_7FD307464C90A6868642B3AEBCDA508D";
const LEVEL_NAME_FIELD: &str = "LevelName_8_4C45C1AA462CC6194F50ADAADFB106A8";
const TIME_FIELD: &str = "Time_2_59B2BD3A4F00EEBB9DEECCA10EEA1022";
const WORLD_FIELD: &str = "World_14_07F9F91140BC22FA10EDBA9F6EED48E9";

#[derive(Debug, Deserialize, Serialize)]
pub struct SaveData {
    pub archive_name: String,
    pub level: String,
    pub game_mode: String,
    pub difficulty: String,
    pub actual_difficulty: String,
    pub players: Vec<PlayerData>,
    pub basic_archive: JsonValue,
    pub main_ending: bool,
    pub meg_unlocked: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PlayerData {
    pub steam_id: String,
    pub inventory: Vec<i32>,
    pub sanity: f32,
}

pub fn create_new_save(save_data: SaveData) -> Result<(), String> {
    println!("📦 Received new save request:");
    println!("  Archive name: {}", save_data.archive_name);
    println!("  Level: {}", save_data.level);
    println!("  Game mode: {}", save_data.game_mode);
    println!("  Archive difficulty: {}", save_data.difficulty);
    println!("  Actual difficulty: {}", save_data.actual_difficulty);
    println!("  Player count: {}", save_data.players.len());
    println!("  Is main ending: {}", !save_data.main_ending);

    // 检查存档名称是否包含下划线
    if save_data.archive_name.contains('_') {
        return Err("存档名称不能包含下划线".to_string());
    }

    // Process level mapping
    let processed_level = match save_data.level.as_str() {
        "Pipes1" | "Pipes2" => "Pipes".to_string(),
        _ => save_data.level.clone(),
    };

    // Build target path
    let app_data_dir = get_local_appdata_dir()?;
    let save_dir = app_data_dir.join("EscapeTheBackrooms/Saved/SaveGames");

    if !save_dir.exists() {
        fs::create_dir_all(&save_dir).map_err(|e| format!("Failed to create save directory: {}", e))?;
    }

    let file_name = format!(
        "MULTIPLAYER_{}_{}.sav",
        save_data.archive_name, save_data.difficulty
    );
    let save_path = save_dir.join(&file_name);

    println!("📂 Target save path: {:?}", save_path);

    // Construct Save object from BasicArchive.json
    let mut save: Save = serde_json::from_value(save_data.basic_archive.clone()).map_err(|e| {
        format!(
            "Failed to convert JSON to Save: {:?}, JSON content: {}",
            e,
            save_data.basic_archive.to_string()
        )
    })?;

    // Modify CurrentLevel field
    if processed_level == "Level0" {
        remove_current_level(&mut save);
    } else {
        modify_current_level(&mut save, processed_level.clone());
    }

    // Handle Pipes UnlockedFun_0 field
    handle_pipes_unlocked_fun(&mut save, &save_data.level);

    // Update difficulty settings
    update_difficulty(&mut save, &save_data.actual_difficulty);

    // Handle MainEnding parameter
    update_bool_property(&mut save, "HasCompletedMainEnding", save_data.main_ending)?;

    // Handle MEG status
    update_meg_status(&mut save, save_data.meg_unlocked)?;

    // Generate LevelsCompleted_0 data
    // main_ending being true means side story (non-main ending) is selected
    generate_levels_completed(&mut save, &save_data.level, save_data.main_ending)?;

    // Update player data
    if !save_data.players.is_empty() {
        update_player_data(&mut save, &save_data.players)?;
    }

    // Write as .sav file
    let file = fs::File::create(&save_path).map_err(|e| format!("Failed to create output file: {}", e))?;
    let mut writer = BufWriter::new(file);
    save.write(&mut writer)
        .map_err(|e| format!("Failed to write save: {:?}", e))?;
    writer
        .flush()
        .map_err(|e| format!("Failed to flush buffer: {}", e))?;

    println!("💾 Save successfully saved to: {:?}", save_path);

    // Update MAINSAVE.sav file
    let archive_name = extract_archive_name(&file_name);
    add_save_to_mainsave(archive_name)?;

    Ok(())
}

/// Modify CurrentLevel_0.Name field value
pub fn modify_current_level(save: &mut Save, new_level_name: String) -> bool {
    let key = PropertyKey(0, "CurrentLevel".to_string());

    if let Some(current_level_prop) = save.root.properties.0.get_mut(&key) {
        if let PropertyInner::Name(ref mut name) = &mut current_level_prop.inner {
            *name = new_level_name.clone();
            println!("✅ CurrentLevel_0 modified to: {}", name);
            return true;
        }
        eprintln!("❌ CurrentLevel_0 type error");
        return false;
    }

    eprintln!("❌ CurrentLevel_0 field not found");
    false
}

/// 删除 CurrentLevel_0 整个字段
pub fn remove_current_level(save: &mut Save) -> bool {
    let key = PropertyKey(0, "CurrentLevel".to_string());

    if save.root.properties.0.shift_remove(&key).is_some() {
        println!("✅ CurrentLevel_0 已被完全移除");
        true
    } else {
        eprintln!("❌ 未找到 CurrentLevel_0 字段");
        false
    }
}

/// Handle Pipes UnlockedFun_0 field
fn handle_pipes_unlocked_fun(save: &mut Save, level: &str) {
    let unlocked_fun_key = PropertyKey(0, "UnlockedFun".to_string());

    match level {
        "Pipes1" => {
            if save
                .root
                .properties
                .0
                .shift_remove(&unlocked_fun_key)
                .is_some()
            {
                println!("🗑️ Deleted UnlockedFun_0 field (Pipes1)");
            }
        }
        "Pipes2" => {
            let prop = Property {
                tag: PropertyTagPartial {
                    id: None,
                    data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
                },
                inner: PropertyInner::Bool(true),
            };
            save.root.properties.0.insert(unlocked_fun_key, prop);
            println!("✅ Created UnlockedFun_0 field with value true (Pipes2)");
        }
        _ => {}
    }
}

/// Update difficulty field
pub fn update_difficulty(save: &mut Save, difficulty: &str) {
    // Remove old Difficulty fields
    let difficulty_keys: Vec<(u32, String)> = save
        .root
        .properties
        .0
        .keys()
        .filter(|key| key.1.starts_with("Difficulty"))
        .map(|key| (key.0, key.1.clone()))
        .collect();

    for (id, name) in difficulty_keys {
        save.root.properties.0.shift_remove(&PropertyKey(id, name));
    }

    // If not Normal difficulty, add new Difficulty field
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

        save.root
            .properties
            .0
            .insert(PropertyKey(0, "Difficulty".to_string()), prop);
        println!("✅ 已添加新难度字段: {}", label);
    } else {
        println!("➖ 跳过难度字段修改（Normal 难度）");
    }
}

/// 更新布尔属性
fn update_bool_property(save: &mut Save, name: &str, value: bool) -> Result<(), String> {
    let prop = Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
        },
        inner: PropertyInner::Bool(value),
    };

    save.root
        .properties
        .0
        .insert(PropertyKey(0, name.to_string()), prop);

    println!("✅ 已设置{}字段为{}", name, value);
    Ok(())
}

/// 更新 MEG 状态字段
fn update_meg_status(save: &mut Save, meg_unlocked: bool) -> Result<(), String> {
    let meg_fields = ["IsMEGUnlocked", "IsMEGPowerOn", "IsMEGSecurityUnlocked"];

    for field in &meg_fields {
        update_bool_property(save, field, meg_unlocked)?;
    }

    if meg_unlocked {
        println!("✅ MEG 相关字段已设置为 true（MEG已解锁）");
    } else {
        println!("✅ MEG 相关字段已设置为 false（MEG已锁定）");
    }

    Ok(())
}

/// 创建默认的 World 属性
/// 结构：S_WorldCommon { Items: [], SanityLevel: 100.0 }
fn create_default_world_property() -> Property {
    // 创建内部结构的属性
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

    // 创建外层 World 属性
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

/// 根据选择的层级生成 LevelsCompleted_0 数据
///
/// 逻辑：
/// - 如果 is_side_storyline 为 false（主线结局），根据层级位置生成记录
///   - 第1个到第n-1个：HasCompleted=true, HasUnlockedHub=true
///   - 第n个（当前层级）：HasCompleted=false, HasUnlockedHub=false
/// - 如果 is_side_storyline 为 true（支线结局），生成全部层级，全部设为已完成
fn generate_levels_completed(
    save: &mut Save,
    level: &str,
    is_side_storyline: bool,
) -> Result<(), String> {
    println!(
        "🎮 开始生成 LevelsCompleted_0 数据，目标层级: {}, 是否支线结局: {}",
        level, is_side_storyline
    );

    let levels_to_generate: Vec<(&str, &str, bool)>; // (display_name, level_name, is_completed)

    if is_side_storyline {
        // 支线结局：生成全部层级，全部设为已完成
        println!(
            "📍 检测到支线结局，将生成全部 {} 个层级，全部设为已完成",
            ALL_LEVELS.len()
        );
        levels_to_generate = ALL_LEVELS
            .iter()
            .map(|(display, level_name)| (*display, *level_name, true))
            .collect();
    } else {
        // 主线结局：根据层级位置生成记录
        // 查找层级在主线中的位置（只检查前17个主线层级）
        let main_index = MAIN_STORYLINE_LEVELS.iter().position(|(_, l)| *l == level);

        if let Some(index) = main_index {
            // 主线层级：生成从第1个到选择层级的所有记录
            println!("📍 检测到主线层级，索引: {}", index);
            levels_to_generate = MAIN_STORYLINE_LEVELS[..=index]
                .iter()
                .enumerate()
                .map(|(i, (display, level_name))| {
                    let is_completed = i < index; // 最后一个（当前层级）未完成
                    (*display, *level_name, is_completed)
                })
                .collect();
        } else {
            // 在主线结局下选择了非主线层级（如支线层级）
            // 查找在 ALL_LEVELS 中的位置
            let all_index = ALL_LEVELS.iter().position(|(_, l)| *l == level);

            if let Some(index) = all_index {
                println!("📍 检测到非主线层级（主线结局模式），索引: {}", index);
                levels_to_generate = ALL_LEVELS[..=index]
                    .iter()
                    .enumerate()
                    .map(|(i, (display, level_name))| {
                        let is_completed = i < index; // 最后一个（当前层级）未完成
                        (*display, *level_name, is_completed)
                    })
                    .collect();
            } else {
                // 未知层级，只生成 Level0
                println!("⚠️ 未知层级 {}，使用默认配置", level);
                levels_to_generate = vec![("Level 0", "Level0", false)];
            }
        }
    }

    println!("📝 将生成 {} 个层级记录", levels_to_generate.len());

    // 获取现有的 LevelsCompleted_0 作为模板
    let levels_completed_key = PropertyKey(0, "LevelsCompleted".to_string());

    // 从现有数据中获取模板结构信息（只需要 id, struct_type, type_）
    let template_struct = if let Some(prop) = save.root.properties.0.get(&levels_completed_key) {
        if let PropertyInner::Array(ValueArray::Struct {
            id,
            struct_type,
            type_,
            value: _,
        }) = &prop.inner
        {
            Some((id.clone(), struct_type.clone(), type_.clone()))
        } else {
            None
        }
    } else {
        None
    };

    let (struct_id, struct_type, type_name) =
        template_struct.ok_or("无法获取 LevelsCompleted 模板结构")?;

    // 生成新的层级记录
    let mut new_values: Vec<StructValue> = Vec::new();

    for (display_name, level_name, is_completed) in levels_to_generate {
        let mut level_props = Properties::default();

        // DisplayName
        let display_name_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::StrProperty),
            },
            inner: PropertyInner::Str(display_name.to_string()),
        };
        level_props.0.insert(
            PropertyKey(0, DISPLAY_NAME_FIELD.to_string()),
            display_name_prop,
        );

        // HasCompleted
        let has_completed_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
            },
            inner: PropertyInner::Bool(is_completed),
        };
        level_props.0.insert(
            PropertyKey(0, HAS_COMPLETED_FIELD.to_string()),
            has_completed_prop,
        );

        // HasUnlockedHub
        let has_unlocked_hub_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
            },
            inner: PropertyInner::Bool(is_completed),
        };
        level_props.0.insert(
            PropertyKey(0, HAS_UNLOCKED_HUB_FIELD.to_string()),
            has_unlocked_hub_prop,
        );

        // LevelName
        let level_name_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::NameProperty),
            },
            inner: PropertyInner::Name(level_name.to_string()),
        };
        level_props.0.insert(
            PropertyKey(0, LEVEL_NAME_FIELD.to_string()),
            level_name_prop,
        );

        // Time
        let time_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
            },
            inner: PropertyInner::Float(-1.0),
        };
        level_props
            .0
            .insert(PropertyKey(0, TIME_FIELD.to_string()), time_prop);

        // World - 创建默认的 World 结构
        let world_prop = create_default_world_property();
        level_props
            .0
            .insert(PropertyKey(0, WORLD_FIELD.to_string()), world_prop);

        new_values.push(StructValue::Struct(level_props));
        println!(
            "  ✅ 添加层级: {} ({}) - 已完成: {}",
            display_name, level_name, is_completed
        );
    }

    // 创建新的 LevelsCompleted_0 属性
    // struct_id 是 Option<Uuid>，需要提供一个默认值
    let final_struct_id = struct_id.unwrap_or_else(uuid::Uuid::nil);

    let new_levels_completed = Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Struct {
                struct_type: struct_type.clone(),
                id: final_struct_id,
            })),
        },
        inner: PropertyInner::Array(ValueArray::Struct {
            id: struct_id,
            struct_type: struct_type,
            type_: type_name,
            value: new_values,
        }),
    };

    // 替换原有的 LevelsCompleted_0
    save.root
        .properties
        .0
        .insert(levels_completed_key, new_levels_completed);

    println!("✅ LevelsCompleted_0 已更新");
    Ok(())
}

/// 更新玩家数据
fn update_player_data(save: &mut Save, players: &[PlayerData]) -> Result<(), String> {
    if players.is_empty() {
        return Ok(());
    }

    println!("👥 开始处理玩家数据...");

    let map_entries: Vec<_> = players
        .iter()
        .map(|player| {
            // 创建背包物品列表
            let mut inventory_items: Vec<String> = player
                .inventory
                .iter()
                .take(INVENTORY_SLOTS)
                .map(|&id| map_item_id_to_name(id).to_string())
                .collect();

            inventory_items.resize(INVENTORY_SLOTS, "None".to_string());

            // 创建玩家结构体属性
            let mut player_struct_properties = Properties::default();

            // Sanity 属性
            let sanity_prop = Property {
                tag: PropertyTagPartial {
                    id: None,
                    data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
                },
                inner: PropertyInner::Float(player.sanity.clamp(0.0, 100.0)),
            };

            // Inventory 属性
            let inventory_prop = Property {
                tag: PropertyTagPartial {
                    id: None,
                    data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(
                        PropertyType::NameProperty,
                    ))),
                },
                inner: PropertyInner::Array(ValueArray::Base(ValueVec::Name(inventory_items))),
            };

            player_struct_properties
                .0
                .insert(PropertyKey(0, SANITY_PROP_NAME.to_string()), sanity_prop);
            player_struct_properties.0.insert(
                PropertyKey(0, INVENTORY_PROP_NAME.to_string()),
                inventory_prop,
            );

            uesave::MapEntry {
                key: uesave::PropertyValue::Str(player.steam_id.clone()),
                value: uesave::PropertyValue::Struct(StructValue::Struct(player_struct_properties)),
            }
        })
        .collect();

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

    save.root
        .properties
        .0
        .insert(PropertyKey(0, "PlayerData".to_string()), player_data_prop);
    println!("✅ 已创建 PlayerData_0 Map");

    Ok(())
}
