use crate::common::{add_save_to_mainsave, extract_archive_name, get_local_appdata_dir};
use crate::error::AppResult;
use crate::save_shared;
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

/// All level data (complete list from endingLevelsData[0]): (DisplayName, LevelName)
/// Used for generating all levels in side storyline
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

pub fn create_new_save(save_data: SaveData) -> AppResult<()> {
    println!("📦 Received new save request:");
    println!("  Archive name: {}", save_data.archive_name);
    println!("  Level: {}", save_data.level);
    println!("  Game mode: {}", save_data.game_mode);
    println!("  Archive difficulty: {}", save_data.difficulty);
    println!("  Actual difficulty: {}", save_data.actual_difficulty);
    println!("  Player count: {}", save_data.players.len());
    println!("  Is main ending: {}", !save_data.main_ending);

    // Validate archive_name: must not be empty, only alphanumeric, hyphens, and spaces
    if save_data.archive_name.trim().is_empty() {
        return Err("Save name cannot be empty".to_string().into());
    }
    if !save_data.archive_name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == ' ') {
        return Err("Save name can only contain letters, numbers, hyphens, and spaces".to_string().into());
    }

    // Sanitize difficulty: only allow alphanumeric characters
    let sanitized_difficulty: String = save_data.difficulty.chars()
        .filter(|c| c.is_alphanumeric())
        .collect();
    if sanitized_difficulty.is_empty() {
        return Err("Difficulty must contain at least one alphanumeric character".to_string().into());
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
        save_data.archive_name, sanitized_difficulty
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
    save_shared::update_difficulty(&mut save, &save_data.actual_difficulty);

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

/// Delete the entire CurrentLevel_0 field
pub fn remove_current_level(save: &mut Save) -> bool {
    let key = PropertyKey(0, "CurrentLevel".to_string());

    if save.root.properties.0.shift_remove(&key).is_some() {
        println!("✅ CurrentLevel_0 has been completely removed");
        true
    } else {
        eprintln!("❌ CurrentLevel_0 field not found");
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

/// Update boolean property
fn update_bool_property(save: &mut Save, name: &str, value: bool) -> AppResult<()> {
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

    println!("✅ Set {} field to {}", name, value);
    Ok(())
}

/// Update MEG status field
fn update_meg_status(save: &mut Save, meg_unlocked: bool) -> AppResult<()> {
    let meg_fields = ["IsMEGUnlocked", "IsMEGPowerOn", "IsMEGSecurityUnlocked"];

    for field in &meg_fields {
        update_bool_property(save, field, meg_unlocked)?;
    }

    if meg_unlocked {
        println!("✅ MEG related fields set to true (MEG unlocked)");
    } else {
        println!("✅ MEG related fields set to false (MEG locked)");
    }

    Ok(())
}

/// Generate LevelsCompleted_0 data based on selected level
///
/// Logic:
/// - If is_side_storyline is false (main ending), generate records based on level position
///   - 1st to (n-1)th: HasCompleted=true, HasUnlockedHub=true
///   - nth (current level): HasCompleted=false, HasUnlockedHub=false
/// - If is_side_storyline is true (side ending), generate all levels, all set as completed
fn generate_levels_completed(
    save: &mut Save,
    level: &str,
    is_side_storyline: bool,
) -> AppResult<()> {
    println!(
        "🎮 Generating LevelsCompleted_0 data, target level: {}, side storyline: {}",
        level, is_side_storyline
    );

    let levels_to_generate: Vec<(&str, &str, bool)>; // (display_name, level_name, is_completed)

    if is_side_storyline {
        // Side storyline: generate all levels, all set as completed
        println!(
            "📍 Side storyline detected, generating all {} levels, all set as completed",
            ALL_LEVELS.len()
        );
        levels_to_generate = ALL_LEVELS
            .iter()
            .map(|(display, level_name)| (*display, *level_name, true))
            .collect();
    } else {
        // Main storyline: generate records based on level position
        // Find the level position in the main storyline (only check first 17 main storyline levels)
        let main_index = MAIN_STORYLINE_LEVELS.iter().position(|(_, l)| *l == level);

        if let Some(index) = main_index {
            // Main storyline level: generate from 1st to selected level
            println!("📍 Main storyline level detected, index: {}", index);
            levels_to_generate = MAIN_STORYLINE_LEVELS[..=index]
                .iter()
                .enumerate()
                .map(|(i, (display, level_name))| {
                    let is_completed = i < index; // Last one (current level) is not completed
                    (*display, *level_name, is_completed)
                })
                .collect();
        } else {
            // In main ending mode, a non-main storyline level was selected (e.g., side level)
            // Find position in ALL_LEVELS
            let all_index = ALL_LEVELS.iter().position(|(_, l)| *l == level);

            if let Some(index) = all_index {
                println!("📍 Non-main storyline level detected (main ending mode), index: {}", index);
                levels_to_generate = ALL_LEVELS[..=index]
                    .iter()
                    .enumerate()
                    .map(|(i, (display, level_name))| {
                        let is_completed = i < index; // Last one (current level) is not completed
                        (*display, *level_name, is_completed)
                    })
                    .collect();
            } else {
                // Unknown level, only generate Level0
                println!("⚠️ Unknown level {}, using default configuration", level);
                levels_to_generate = vec![("Level 0", "Level0", false)];
            }
        }
    }

    println!("📝 Will generate {} level records", levels_to_generate.len());

    // Get existing LevelsCompleted_0 as template
    let levels_completed_key = PropertyKey(0, "LevelsCompleted".to_string());

    // Get template structure info from existing data (only need id, struct_type, type_)
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
        template_struct.ok_or("Failed to get LevelsCompleted template structure")?;

    // Generate new level records
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
            PropertyKey(0, save_shared::DISPLAY_NAME_FIELD.to_string()),
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
            PropertyKey(0, save_shared::HAS_COMPLETED_FIELD.to_string()),
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
            PropertyKey(0, save_shared::HAS_UNLOCKED_HUB_FIELD.to_string()),
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
            PropertyKey(0, save_shared::LEVEL_NAME_FIELD.to_string()),
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
            .insert(PropertyKey(0, save_shared::TIME_FIELD.to_string()), time_prop);

        // World - Create default World structure
        let world_prop = save_shared::create_default_world_property();
        level_props
            .0
            .insert(PropertyKey(0, save_shared::WORLD_FIELD.to_string()), world_prop);

        new_values.push(StructValue::Struct(level_props));
        println!(
            "  ✅ Added level: {} ({}) - Completed: {}",
            display_name, level_name, is_completed
        );
    }

    // Create new LevelsCompleted_0 property
    // struct_id is Option<Uuid>, provide a default value if needed
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

    // Replace the original LevelsCompleted_0
    save.root
        .properties
        .0
        .insert(levels_completed_key, new_levels_completed);

    println!("✅ LevelsCompleted_0 has been updated");
    Ok(())
}

/// Update player data
fn update_player_data(save: &mut Save, players: &[PlayerData]) -> AppResult<()> {
    if players.is_empty() {
        return Ok(());
    }

    println!("👥 Processing player data...");

    let map_entries: Vec<_> = players
        .iter()
        .map(|player| {
            // Create inventory items list
            let mut inventory_items: Vec<String> = player
                .inventory
                .iter()
                .take(save_shared::INVENTORY_SLOTS)
                .map(|&id| save_shared::map_item_id_to_name(id).to_string())
                .collect();

            inventory_items.resize(save_shared::INVENTORY_SLOTS, "None".to_string());

            // Create player struct properties
            let mut player_struct_properties = Properties::default();

            // Sanity property
            let sanity_prop = Property {
                tag: PropertyTagPartial {
                    id: None,
                    data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
                },
                inner: PropertyInner::Float(player.sanity.clamp(0.0, 100.0)),
            };

            // Inventory property
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
                .insert(PropertyKey(0, save_shared::SANITY_PROP_NAME.to_string()), sanity_prop);
            player_struct_properties.0.insert(
                PropertyKey(0, save_shared::INVENTORY_PROP_NAME.to_string()),
                inventory_prop,
            );

            uesave::MapEntry {
                key: uesave::PropertyValue::Str(player.steam_id.clone()),
                value: uesave::PropertyValue::Struct(StructValue::Struct(player_struct_properties)),
            }
        })
        .collect();

    // Create PlayerData_0 property
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
    println!("✅ PlayerData_0 Map created");

    Ok(())
}
