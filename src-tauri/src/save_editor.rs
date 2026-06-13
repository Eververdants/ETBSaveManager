use crate::common::{add_save_to_mainsave, extract_archive_name, validate_save_games_path};
use crate::error::AppResult;
use crate::save_shared;
use serde_json::Value as JsonValue;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter};
use std::path::Path;
use uesave::{
    Properties, Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyType, PropertyValue, Save, StructType, StructValue, ValueArray, ValueVec,
};
use uuid;

/// Modify CurrentLevel_0.Name field value
pub fn modify_current_level(save: &mut Save, new_level_name: String) -> bool {
    let key = PropertyKey(0, "CurrentLevel".to_string());

    if let Some(current_level_prop) = save.root.properties.0.get_mut(&key) {
        match &mut current_level_prop.inner {
            PropertyInner::Name(ref mut name) => {
                *name = new_level_name.clone();
                println!("✅ CurrentLevel_0 modified to: {}", name);
                true
            }
            other => {
                eprintln!("❌ CurrentLevel_0 type error, expected Name, got {:?}", other);
                false
            }
        }
    } else {
        println!("⚠️ CurrentLevel_0 field not found, creating a new one...");

        let new_current_level = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::NameProperty),
            },
            inner: PropertyInner::Name(new_level_name.clone()),
        };

        save.root.properties.0.insert(key, new_current_level);
        println!(
            "✅ Created new CurrentLevel_0 field with value: {}",
            new_level_name
        );
        true
    }
}

/// Handle special logic for Pipes level
fn process_pipes_level(save: &mut Save, level: &str) -> String {
    let unlocked_fun_key = PropertyKey(0, "UnlockedFun".to_string());

    match level {
        "Pipes1" => {
            println!("🔄 Pipes1 detected, changing to Pipes and deleting UnlockedFun_0");
            if save.root.properties.0.contains_key(&unlocked_fun_key) {
                save.root.properties.0.shift_remove(&unlocked_fun_key);
                println!("🗑️ Deleted UnlockedFun_0 field");
            }
            "Pipes".to_string()
        }
        "Pipes2" => {
            println!("🔄 Pipes2 detected, changing to Pipes and creating UnlockedFun_0");
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
            println!("✅ Created UnlockedFun_0 field");
            "Pipes".to_string()
        }
        _ => level.to_string(),
    }
}

/// Extract inventory items from JSON data
fn extract_inventory_items(json_data: &JsonValue, steam_id: &str) -> Vec<String> {
    let mut items = Vec::with_capacity(save_shared::INVENTORY_SLOTS);

    if let Some(inventory) = json_data["playerInventory"][steam_id].as_array() {
        for item_value in inventory.iter().take(save_shared::INVENTORY_SLOTS) {
            let item_id = item_value["item"]["id"].as_i64().unwrap_or(-1) as i32;
            items.push(save_shared::map_item_id_to_name(item_id).to_string());
        }
    }

    // Ensure exactly 12 slots
    items.resize(save_shared::INVENTORY_SLOTS, "None".to_string());
    items
}

/// Update existing player data
fn update_player_data(player_struct: &mut Properties, steam_id: &str, json_data: &JsonValue) {
    // Modify inventory
    if let Some(inventory_prop) =
        save_shared::get_property_by_name_mut(player_struct, save_shared::INVENTORY_PROP_NAME)
    {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Name(ref mut str_values))) =
            &mut inventory_prop.inner
        {
            *str_values = extract_inventory_items(json_data, steam_id);
        }
    }

    // Modify sanity
    if let Some(sanity_prop) =
        save_shared::get_property_by_name_mut(player_struct, save_shared::SANITY_PROP_NAME)
    {
        if let PropertyInner::Float(ref mut val) = sanity_prop.inner {
            let new_sanity = json_data["playerSanity"][steam_id]
                .as_f64()
                .map(|v| v as f32)
                .unwrap_or(100.0);
            *val = new_sanity.clamp(0.0, 100.0);
        }
    }
}

/// Create new player data struct
fn create_new_player_struct(steam_id: &str, json_data: &JsonValue) -> Properties {
    println!("🆕 Creating new player data struct: {}", steam_id);
    let mut properties = Properties::default();

    let inventory_items = extract_inventory_items(json_data, steam_id);
    println!("✅ Final inventory items: {:?}", inventory_items);

    let sanity_value = json_data["playerSanity"][steam_id]
        .as_f64()
        .map(|v| v as f32)
        .unwrap_or(100.0)
        .clamp(0.0, 100.0);

    properties.0.insert(
        PropertyKey(0, save_shared::INVENTORY_PROP_NAME.to_string()),
        save_shared::create_inventory_property(inventory_items),
    );
    properties.0.insert(
        PropertyKey(0, save_shared::SANITY_PROP_NAME.to_string()),
        save_shared::create_sanity_property(sanity_value),
    );

    properties
}

pub fn edit_save_file(json_data: &JsonValue, output_dir: &str) -> AppResult<String> {
    println!("🔧 Processing save file...");

    let original_path = json_data["path"]
        .as_str()
        .ok_or("Missing path in JSON data")?
        .to_string();

    validate_save_games_path(Path::new(&original_path))?;
    validate_save_games_path(Path::new(output_dir))?;

    // Extract required fields
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

    // Ensure difficulty starts with uppercase letter
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

    validate_save_games_path(&output_path)?;

    println!("📂 Reading original save file: {:?}", original_path);

    let file = File::open(&original_path).map_err(|e| format!("Failed to open save file: {}", e))?;
    let mut reader = BufReader::new(file);
    let mut save = Save::read(&mut reader).map_err(|e| format!("Failed to parse save: {:?}", e))?;

    // Handle Pipes level
    let processed_level = process_pipes_level(&mut save, current_level);

    // Modify CurrentLevel
    if modify_current_level(&mut save, processed_level.clone()) {
        println!("✅ Current level name modified to: {}", processed_level);
    }

    // Update difficulty
    save_shared::update_difficulty(&mut save, actual_difficulty);

    // Process player data
    process_player_data(&mut save, json_data)?;

    // Delete original save file
    if Path::new(&original_path).exists() {
        fs::remove_file(&original_path).map_err(|e| format!("Failed to delete old file: {}", e))?;
        println!("🗑️ Deleted original save file");
    }

    // Write new file
    let file = File::create(&output_path).map_err(|e| format!("Failed to create output file: {}", e))?;
    let mut writer = BufWriter::new(file);
    save.write(&mut writer)
        .map_err(|e| format!("Failed to write save: {:?}", e))?;

    println!("💾 Save saved to: {:?}", output_path);

    // Update MAINSAVE.sav
    let archive_name = extract_archive_name(&new_filename);
    add_save_to_mainsave(archive_name)?;

    Ok(output_path.to_str().unwrap_or("Invalid path").to_string())
}

/// Process player data
fn process_player_data(save: &mut Save, json_data: &JsonValue) -> AppResult<()> {
    let player_data_key = PropertyKey(0, "PlayerData".to_string());

    // Collect all Steam IDs that need processing
    let mut steam_ids_to_process: Vec<String> = Vec::new();

    // Collect from existing data
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

    // Add new Steam IDs from frontend data
    if let Some(player_inventory) = json_data["playerInventory"].as_object() {
        for steam_id in player_inventory.keys() {
            let trimmed_id = steam_id.trim();
            if !steam_ids_to_process
                .iter()
                .any(|id| id.trim() == trimmed_id)
            {
                steam_ids_to_process.push(trimmed_id.to_string());
                println!("🆕 Found new Steam ID: '{}'", trimmed_id);
            }
        }
    }

    // Process player data
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
                        println!("➕ Creating new player data: {}", steam_id);
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
        // Create new PlayerData_0 field
        create_player_data_field(save, &steam_ids_to_process, json_data);
    }

    Ok(())
}

/// Create PlayerData field
fn create_player_data_field(save: &mut Save, steam_ids: &[String], json_data: &JsonValue) {
    println!("⚠️ PlayerData_0 field not found, creating...");

    let mut map_value = Vec::new();
    let ids_to_use = if steam_ids.is_empty() {
        vec!["76561199536995340".to_string()] // Default Steam ID
    } else {
        steam_ids.to_vec()
    };

    for steam_id in ids_to_use {
        println!("🆕 Creating new player data: {}", steam_id);
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
    println!("✅ Successfully created PlayerData_0 field");
}

/// Level list for unlocking hub doors (excluding unnecessary levels)
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

/// Create a single level struct
fn create_level_struct(display_name: &str, level_name: &str) -> StructValue {
    let mut level_props = Properties::default();

    // DisplayName
    level_props.0.insert(
        PropertyKey(0, save_shared::DISPLAY_NAME_FIELD.to_string()),
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
        PropertyKey(0, save_shared::HAS_COMPLETED_FIELD.to_string()),
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
        PropertyKey(0, save_shared::HAS_UNLOCKED_HUB_FIELD.to_string()),
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
        PropertyKey(0, save_shared::LEVEL_NAME_FIELD.to_string()),
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
        PropertyKey(0, save_shared::TIME_FIELD.to_string()),
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
        PropertyKey(0, save_shared::WORLD_FIELD.to_string()),
        save_shared::create_default_world_property(),
    );

    StructValue::Struct(level_props)
}

/// Create default LevelsCompleted_0 property (empty array)
fn create_default_levels_completed_property() -> Property {
    let levels_completed_id = uuid::Uuid::parse_str("06e675d4-4bbd-2e16-2f43-dbb447d5d692")
        .unwrap_or_else(|_| uuid::Uuid::nil());

    Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Struct {
                struct_type: StructType::Struct(Some("S_LevelStats".to_string())),
                id: uuid::Uuid::nil(),
            })),
        },
        inner: PropertyInner::Array(ValueArray::Struct {
            id: Some(levels_completed_id),
            struct_type: StructType::Struct(Some("S_LevelStats".to_string())),
            type_: PropertyType::StructProperty,
            value: vec![],
        }),
    }
}

/// Unlock all hub doors
/// Reads LevelsCompleted_0 in the save, fills up to ALL_LEVELS count, and sets all Bool values to true
pub fn unlock_all_hub_doors(file_path: &str) -> AppResult<String> {
    println!("🔓 Unlocking all hub doors: {}", file_path);

    validate_save_games_path(Path::new(file_path))?;

    let file = File::open(file_path).map_err(|e| format!("Failed to open save file: {}", e))?;
    let mut reader = BufReader::new(file);
    let mut save = Save::read(&mut reader).map_err(|e| format!("Failed to parse save: {:?}", e))?;

    let levels_completed_key = PropertyKey(0, "LevelsCompleted".to_string());

    // Create default structure when LevelsCompleted_0 does not exist
    if !save.root.properties.0.contains_key(&levels_completed_key) {
        println!("⚠️ LevelsCompleted_0 field not found, automatically creating default structure...");
        save.root.properties.0.insert(
            PropertyKey(0, "LevelsCompleted".to_string()),
            create_default_levels_completed_property(),
        );
    }

    // Rebuild default structure if LevelsCompleted_0 format is invalid, preventing unlock flow interruption
    let is_valid_levels_completed = matches!(
        save.root.properties.0.get(&levels_completed_key).map(|prop| &prop.inner),
        Some(PropertyInner::Array(ValueArray::Struct { .. }))
    );
    if !is_valid_levels_completed {
        println!("⚠️ LevelsCompleted_0 format is incorrect, rebuilding default structure...");
        save.root.properties.0.insert(
            PropertyKey(0, "LevelsCompleted".to_string()),
            create_default_levels_completed_property(),
        );
    }

    // Get existing LevelsCompleted_0
    let levels_completed_prop = save
        .root
        .properties
        .0
        .get_mut(&levels_completed_key)
        .ok_or("Failed to create LevelsCompleted_0 field")?;

    if let PropertyInner::Array(ValueArray::Struct {
        id: _,
        struct_type: _,
        type_: _,
        value,
    }) = &mut levels_completed_prop.inner
    {
        println!(
            "📊 Current level count: {}, target count: {}",
            value.len(),
            HUB_DOOR_LEVELS.len()
        );

        // Collect existing LevelNames
        let mut existing_levels: std::collections::HashSet<String> =
            std::collections::HashSet::new();

        for level_struct in value.iter_mut() {
            if let StructValue::Struct(props) = level_struct {
                // Get LevelName
                if let Some(level_name_prop) =
                    props.0.iter().find(|(k, _)| k.1.starts_with("LevelName"))
                {
                    if let PropertyInner::Name(name) = &level_name_prop.1.inner {
                        existing_levels.insert(name.clone());
                    }
                }

                // Set all Bool values to true
                for (_, prop) in props.0.iter_mut() {
                    if let PropertyInner::Bool(ref mut b) = prop.inner {
                        *b = true;
                    }
                }
            }
        }

        println!("📝 Existing levels: {:?}", existing_levels);

        // Add missing levels
        for (display_name, level_name) in HUB_DOOR_LEVELS.iter() {
            if !existing_levels.contains(*level_name) {
                println!("➕ Adding missing level: {} ({})", display_name, level_name);
                value.push(create_level_struct(display_name, level_name));
            }
        }

        println!("✅ Level count after processing: {}", value.len());
    } else {
        return Err("LevelsCompleted_0 format is incorrect".to_string().into());
    }

    // Write back to file
    let file = File::create(file_path).map_err(|e| format!("Failed to create output file: {}", e))?;
    let mut writer = BufWriter::new(file);
    save.write(&mut writer)
        .map_err(|e| format!("Failed to write save: {:?}", e))?;

    println!("💾 Hub door unlocking complete, save saved");
    Ok("Hub doors unlocked successfully".to_string())
}
