use crate::common::{
    add_save_to_mainsave, extract_archive_name, remove_save_from_mainsave, validate_save_games_path,
};
use crate::error::AppResult;
use crate::save_shared;
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Write};
use std::path::Path;
use uesave::{
    FGuid, Properties, Property, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyType, Save, StructType, StructValue, ValueVec,
};

/// Handle special logic for Pipes level
fn process_pipes_level(save: &mut Save, level: &str) -> String {
    let unlocked_fun_key = PropertyKey(0, "UnlockedFun".to_string());

    match level {
        "Pipes1" => {
            tracing::info!("Pipes1 detected, changing to Pipes and deleting UnlockedFun_0");
            if save.root.properties.0.contains_key(&unlocked_fun_key) {
                save.root.properties.0.shift_remove(&unlocked_fun_key);
                tracing::info!("Deleted UnlockedFun_0 field");
            }
            "Pipes".to_string()
        }
        "Pipes2" => {
            tracing::info!("Pipes2 detected, changing to Pipes and creating UnlockedFun_0");
            save_shared::record_root_schema(
                save,
                "UnlockedFun",
                PropertyTagPartial {
                    id: None,
                    data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
                },
            );
            save.root
                .properties
                .0
                .insert(unlocked_fun_key, Property::Bool(true));
            tracing::info!("Created UnlockedFun_0 field");
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
    if let Some(Property::Array(ValueVec::Name(ref mut str_values))) =
        save_shared::get_property_by_name_mut(player_struct, save_shared::INVENTORY_PROP_NAME)
    {
        *str_values = extract_inventory_items(json_data, steam_id);
    }

    // Modify sanity
    if let Some(Property::Float(ref mut val)) =
        save_shared::get_property_by_name_mut(player_struct, save_shared::SANITY_PROP_NAME)
    {
        let new_sanity = json_data["playerSanity"][steam_id]
            .as_f64()
            .map(|v| v as f32)
            .unwrap_or(100.0);
        *val = uesave::Float(new_sanity.clamp(0.0, 100.0));
    }
}

/// Create new player data struct
fn create_new_player_struct(steam_id: &str, json_data: &JsonValue) -> Properties {
    tracing::info!("Creating new player data struct: {}", steam_id);
    let mut properties = Properties::default();

    let inventory_items = extract_inventory_items(json_data, steam_id);
    tracing::debug!("Final inventory items: {:?}", inventory_items);

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

/// Record schemas for the PlayerData map and its nested player struct fields
fn record_player_data_schemas(save: &mut Save) {
    save.schemas.record(
        "PlayerData".to_string(),
        PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Map {
                key_type: Box::new(PropertyTagDataPartial::Other(PropertyType::StrProperty)),
                value_type: Box::new(PropertyTagDataPartial::Struct {
                    struct_type: StructType::Struct(None),
                    id: FGuid::nil(),
                }),
            },
        },
    );
    save.schemas.record(
        format!("PlayerData.{}", save_shared::INVENTORY_PROP_NAME),
        save_shared::array_scalar_tag(PropertyTagDataPartial::Other(PropertyType::NameProperty)),
    );
    save.schemas.record(
        format!("PlayerData.{}", save_shared::SANITY_PROP_NAME),
        PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
        },
    );
}

pub fn edit_save_file(json_data: &JsonValue, output_dir: &str) -> AppResult<String> {
    tracing::info!("Processing save file...");

    let original_path = json_data["path"]
        .as_str()
        .ok_or("Missing path in JSON data")?
        .to_string();

    validate_save_games_path(Path::new(&original_path))?;
    validate_save_games_path(Path::new(output_dir))?;

    // Remember old archive name for MAINSAVE cleanup if name changes
    let old_archive_name: Option<String> = Path::new(&original_path)
        .file_name()
        .and_then(|n| n.to_str())
        .map(extract_archive_name)
        .map(|s| s.to_string());

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

    tracing::info!("Reading original save file: {:?}", original_path);

    let file =
        File::open(&original_path).map_err(|e| format!("Failed to open save file: {}", e))?;
    let mut reader = BufReader::with_capacity(16384, file);
    let mut save = Save::read(&mut reader).map_err(|e| format!("Failed to parse save: {:?}", e))?;

    // Auto-merge duplicate PlayerData entries for the same player
    // (bare id + EOS-suffixed key + all-zeros key from older app versions coexist;
    // the game never consolidates them, so we clean up before processing)
    let merged = merge_player_data(&mut save);
    if merged > 0 {
        tracing::info!("Auto-merged {} duplicate player entry(ies)", merged);
    }

    // Handle Pipes level
    let processed_level = process_pipes_level(&mut save, current_level);

    // Modify CurrentLevel
    if save_shared::modify_current_level(&mut save, processed_level.clone()) {
        tracing::info!("Current level name modified to: {}", processed_level);
    }

    // Update difficulty
    save_shared::update_difficulty(&mut save, actual_difficulty);

    // Process player data
    process_player_data(&mut save, json_data)?;

    // Write to temp file first to avoid data loss on crash
    let temp_path = output_path.with_extension("sav.tmp");
    {
        let file =
            File::create(&temp_path).map_err(|e| format!("Failed to create temp file: {}", e))?;
        let mut writer = BufWriter::new(file);
        save.write(&mut writer)
            .map_err(|e| format!("Failed to write save: {:?}", e))?;
        writer
            .flush()
            .map_err(|e| format!("Failed to flush buffer: {}", e))?;
    }

    // Atomically rename temp to target path
    fs::rename(&temp_path, &output_path)
        .map_err(|e| format!("Failed to rename temp file: {}", e))?;

    // Delete original save file only if it differs from output path
    // (rename already overwrites output_path when they are the same)
    let original_path = Path::new(&original_path);
    if original_path != output_path && original_path.exists() {
        fs::remove_file(original_path).map_err(|e| format!("Failed to delete old file: {}", e))?;
        tracing::info!("Deleted original save file");
    }

    tracing::info!("Save saved to: {:?}", output_path);

    // Update MAINSAVE.sav
    let archive_name = extract_archive_name(&new_filename);

    // Remove old MAINSAVE entry if the archive name changed (rename / difficulty change)
    if let Some(ref old_name) = old_archive_name {
        if old_name != archive_name {
            let _ = remove_save_from_mainsave(old_name);
        }
    }

    add_save_to_mainsave(archive_name)?;

    Ok(output_path.to_str().unwrap_or("Invalid path").to_string())
}

/// Pure player id: strip the `_+_|<suffix>` (online) or `-<15 chars>` (offline) part.
fn pure_player_id(key: &str) -> String {
    if let Some(idx) = key.find("_+_|") {
        key[..idx].to_string()
    } else if let Some(idx) = key.find('-') {
        key[..idx].to_string()
    } else {
        key.to_string()
    }
}

/// A player entry carries real data when sanity != default 100 or any inventory slot is filled.
fn entry_has_real_data(value: &Property) -> bool {
    if let Property::Struct(StructValue::Struct(props)) = value {
        for (_, prop) in props.0.iter() {
            match prop {
                Property::Float(f) => {
                    if (f.0 - 100.0).abs() > 0.001 {
                        return true;
                    }
                }
                Property::Array(ValueVec::Name(names))
                    if names.iter().any(|n| n.as_str() != "None") =>
                {
                    return true;
                }
                _ => {}
            }
        }
    }
    false
}

/// Whether the key carries a real EOS account id suffix (32 hex, not the all-zeros
/// placeholder an earlier app version wrote).
fn is_real_eos_key(key: &str) -> bool {
    if let Some(idx) = key.find("_+_|") {
        let suffix = &key[idx + 4..];
        suffix.len() == 32 && suffix != "00000000000000000000000000000000"
    } else {
        false
    }
}

/// Read the save's current level name (e.g. "Level5"), or "" when absent.
fn save_current_level(save: &Save) -> String {
    if let Some(Property::Name(name)) = save
        .root
        .properties
        .0
        .get(&PropertyKey(0, "CurrentLevel".to_string()))
    {
        name.clone()
    } else {
        String::new()
    }
}

/// Read the save's difficulty label. "Normal" when no Difficulty field exists.
/// Easy saves store `E_Difficulty::NewEnumerator0`, so that exact label is the
/// easy-mode signal used by the backpack >12 merge rules.
fn save_difficulty(save: &Save) -> String {
    for (key, prop) in save.root.properties.0.iter() {
        if !key.1.starts_with("Difficulty") {
            continue;
        }
        if let Property::Byte(uesave::Byte::Label(label)) = prop {
            return label.clone();
        }
    }
    "Normal".to_string()
}

/// The 12-slot inventory array of a player entry value, or None if absent.
fn entry_inventory(value: &Property) -> Option<Vec<String>> {
    let Property::Struct(StructValue::Struct(props)) = value else {
        return None;
    };
    for (key, prop) in props.0.iter() {
        if key.1 == save_shared::INVENTORY_PROP_NAME {
            if let Property::Array(ValueVec::Name(names)) = prop {
                return Some(names.clone());
            }
        }
    }
    None
}

/// Number of filled (non-"None") slots in an inventory array.
fn inventory_count(items: &[String]) -> usize {
    items
        .iter()
        .filter(|i| i.as_str() != "None" && !i.is_empty())
        .count()
}

/// Keep at most `keep` occurrences of `category`, preserving order.
fn keep_at_most(pool: &mut Vec<String>, category: &str, keep: usize) {
    let mut seen = 0usize;
    pool.retain(|i| {
        if i.as_str() == category {
            seen += 1;
            seen <= keep
        } else {
            true
        }
    });
}

/// Delete items in `priority` order (index 0 deleted first) until `pool.len() <= limit`.
/// `"*"` in the priority list means "any item not named elsewhere and not protected".
/// Items in `protected` are never deleted by the fallthrough.
fn drop_by_priority(
    pool: Vec<String>,
    limit: usize,
    priority: &[&str],
    protected: &[&str],
) -> Vec<String> {
    let mut pool = pool;
    let named: std::collections::HashSet<&str> = priority.iter().copied().collect();
    for &cat in priority {
        while pool.len() > limit {
            let idx = if cat == "*" {
                pool.iter().position(|it| {
                    !protected.contains(&it.as_str()) && !named.contains(it.as_str())
                })
            } else {
                pool.iter().position(|it| it.as_str() == cat)
            };
            match idx {
                Some(i) => {
                    pool.remove(i);
                }
                None => break,
            }
        }
        if pool.len() <= limit {
            break;
        }
    }
    // Last resort: drop any non-protected item.
    while pool.len() > limit {
        match pool
            .iter()
            .enumerate()
            .position(|(_, it)| !protected.contains(&it.as_str()))
        {
            Some(i) => {
                pool.remove(i);
            }
            None => break,
        }
    }
    pool
}

/// Arrange the merged pool (≤12 items) into 12 slots.
///
/// Rules:
/// - Flashlight → main hand; extra flashlights go last.
/// - Almond water (non-concentrated) → main/off hands; extras in sequence.
/// - Other items fill the remaining slots in original order.
/// - No gaps: everything compacts forward.
fn arrange_inventory_under_12(pool: Vec<String>) -> Vec<String> {
    let mut flashlights: Vec<String> = Vec::new();
    let mut almond_waters: Vec<String> = Vec::new();
    let mut others: Vec<String> = Vec::new();
    for item in pool {
        match item.as_str() {
            "Flashlight" => flashlights.push(item),
            "AlmondWater" => almond_waters.push(item),
            _ => others.push(item),
        }
    }

    let mut result: Vec<String> = vec!["None".to_string(); save_shared::INVENTORY_SLOTS];
    let mut oi = 0usize;
    let mut ai = 0usize;
    let mut fi = 0usize;

    // Main hand: flashlight > almond water > first other item.
    if fi < flashlights.len() {
        result[0] = flashlights[fi].clone();
        fi += 1;
    } else if ai < almond_waters.len() {
        result[0] = almond_waters[ai].clone();
        ai += 1;
    } else if oi < others.len() {
        result[0] = others[oi].clone();
        oi += 1;
    }

    // Hand slots 1..=2 get almond water (its "主手与副手" placement).
    let mut idx = 1usize;
    while idx < 3 && ai < almond_waters.len() {
        result[idx] = almond_waters[ai].clone();
        ai += 1;
        idx += 1;
    }

    // Remaining slots: other items, then extra almond water, then extra flashlights.
    while idx < save_shared::INVENTORY_SLOTS {
        if oi < others.len() {
            result[idx] = others[oi].clone();
            oi += 1;
        } else if ai < almond_waters.len() {
            result[idx] = almond_waters[ai].clone();
            ai += 1;
        } else if fi < flashlights.len() {
            result[idx] = flashlights[fi].clone();
            fi += 1;
        } else {
            break;
        }
        idx += 1;
    }

    result
}

/// Trim a merged pool (>12 items) down to ≤12 following the over-capacity rules.
fn trim_inventory_over_12(mut pool: Vec<String>, level: &str, difficulty: &str) -> Vec<String> {
    // 1. Keep a single flashlight (main hand), drop the extras.
    let flashlights = pool.iter().filter(|i| i.as_str() == "Flashlight").count();
    if flashlights > 1 {
        let mut dropped = 0usize;
        pool.retain(|i| {
            if i.as_str() == "Flashlight" && dropped < flashlights - 1 {
                dropped += 1;
                false
            } else {
                true
            }
        });
    }

    let has_almond = pool.iter().any(|i| i.as_str() == "AlmondWater");
    if has_almond && pool.len() > save_shared::INVENTORY_SLOTS {
        let is_easy = difficulty == "E_Difficulty::NewEnumerator0";
        if is_easy {
            // Easy: delete (prefer almond water, then anything) until ≤12.
            pool = drop_by_priority(
                pool,
                save_shared::INVENTORY_SLOTS,
                &["AlmondWater", "*"],
                &[],
            );
        } else {
            // Juice present → almond water : juice = 3:1, combined total ≤ 8.
            let has_juice = pool.iter().any(|i| i.as_str() == "Juice");
            if has_juice {
                let juice = pool.iter().filter(|i| i.as_str() == "Juice").count();
                let almond = pool.iter().filter(|i| i.as_str() == "AlmondWater").count();
                let keep_juice = juice.min(2);
                let keep_almond = almond.min(3 * keep_juice);
                keep_at_most(&mut pool, "Juice", keep_juice);
                keep_at_most(&mut pool, "AlmondWater", keep_almond);
            }

            // Other items still present and over capacity → level-specific rules.
            if pool.len() > save_shared::INVENTORY_SLOTS {
                match level {
                    "Level5" if pool.iter().any(|i| i.as_str() == "MothJelly") => {
                        pool = drop_by_priority(
                            pool,
                            save_shared::INVENTORY_SLOTS,
                            &["*", "Juice", "AlmondWater", "BugSpray", "Flashlight"],
                            &["MothJelly"],
                        );
                    }
                    "Level9" if pool.iter().any(|i| i.as_str() == "AlmondConcentrate") => {
                        pool = drop_by_priority(
                            pool,
                            save_shared::INVENTORY_SLOTS,
                            &["*", "Juice", "AlmondWater", "Flashlight"],
                            &["AlmondConcentrate"],
                        );
                    }
                    "Level974" if pool.iter().any(|i| i.as_str() == "Toy") => {
                        pool = drop_by_priority(
                            pool,
                            save_shared::INVENTORY_SLOTS,
                            &["*", "Juice", "AlmondWater", "Flashlight"],
                            &["Toy"],
                        );
                    }
                    _ => {
                        // No matching rule: trim almond water first, then anything.
                        pool = drop_by_priority(
                            pool,
                            save_shared::INVENTORY_SLOTS,
                            &["AlmondWater", "*"],
                            &[],
                        );
                    }
                }
            }
        }
    }

    // Final safety: drop arbitrary items until ≤12.
    while pool.len() > save_shared::INVENTORY_SLOTS {
        pool.pop();
    }
    pool
}

/// Arrange a ≤12 pool that came from the over-capacity trim: flashlight → main hand,
/// everything else fills the remaining slots in original order (no gaps).
fn arrange_inventory_over_12(pool: Vec<String>) -> Vec<String> {
    let mut result: Vec<String> = vec!["None".to_string(); save_shared::INVENTORY_SLOTS];
    let mut placed_main = false;
    let mut others: Vec<String> = Vec::new();
    for item in pool {
        if item.as_str() == "Flashlight" && !placed_main {
            result[0] = item;
            placed_main = true;
        } else {
            others.push(item);
        }
    }
    let mut idx = if placed_main { 1 } else { 0 };
    for item in others {
        if idx >= save_shared::INVENTORY_SLOTS {
            break;
        }
        result[idx] = item;
        idx += 1;
    }
    result
}

/// Merge duplicate PlayerData entries for the same player.
///
/// A player can appear under several keys in a save: a bare steam id, the correct
/// EOS-suffixed key, and — from an earlier app version — an all-zeros suffix key.
/// The game never consolidates these.
///
/// When both a pure steam-id entry AND an EOS-suffixed entry carry backpack data,
/// the two backpacks are merged into one (per the game's slot rules), the merged
/// inventory is written into the EOS entry, and the pure entry is dropped. When
/// only one entry has real data, the single best entry is kept (real EOS key breaks
/// ties). Returns how many entries were dropped.
fn merge_player_data(save: &mut Save) -> usize {
    // Read level/difficulty before taking the mutable borrow of the PlayerData map.
    let current_level = save_current_level(save);
    let difficulty = save_difficulty(save);

    let player_data_key = PropertyKey(0, "PlayerData".to_string());
    let Some(Property::Map(entries)) = save.root.properties.0.get_mut(&player_data_key) else {
        return 0;
    };

    // Group entry indices by pure player id
    let mut groups: HashMap<String, Vec<usize>> = HashMap::new();
    for (i, entry) in entries.iter().enumerate() {
        if let Property::Str(key) = &entry.key {
            groups.entry(pure_player_id(key)).or_default().push(i);
        }
    }

    let mut remove: Vec<usize> = Vec::new();
    for indices in groups.values() {
        if indices.len() < 2 {
            continue;
        }

        // Entries that actually carry inventory data.
        let data_entries: Vec<&usize> = indices
            .iter()
            .filter(|&&i| {
                entry_inventory(&entries[i].value)
                    .map(|inv| inventory_count(&inv) > 0)
                    .unwrap_or(false)
            })
            .collect();

        if data_entries.len() >= 2 {
            // Merge all filled backpacks (pure + EOS) into one.
            let mut pool: Vec<String> = Vec::new();
            for &i in indices {
                if let Some(inv) = entry_inventory(&entries[i].value) {
                    pool.extend(
                        inv.into_iter()
                            .filter(|x| x.as_str() != "None" && !x.is_empty()),
                    );
                }
            }
            let merged = if pool.len() <= save_shared::INVENTORY_SLOTS {
                arrange_inventory_under_12(pool)
            } else {
                arrange_inventory_over_12(trim_inventory_over_12(pool, &current_level, &difficulty))
            };

            // Survivor: real EOS-suffixed key preferred, else highest score.
            let survivor = match indices
                .iter()
                .find(|&&i| matches!(&entries[i].key, Property::Str(k) if is_real_eos_key(k)))
            {
                Some(&i) => i,
                None => *indices
                    .iter()
                    .max_by_key(|&&i| {
                        (if entry_has_real_data(&entries[i].value) {
                            10
                        } else {
                            0
                        }) + (if matches!(&entries[i].key, Property::Str(k) if k.contains("_+_|")) {
                            1
                        } else {
                            0
                        })
                    })
                    .unwrap(),
            };

            // Write the merged inventory into the survivor entry.
            if let Property::Struct(StructValue::Struct(props)) = &mut entries[survivor].value {
                if let Some(Property::Array(ValueVec::Name(names))) =
                    save_shared::get_property_by_name_mut(props, save_shared::INVENTORY_PROP_NAME)
                {
                    *names = merged;
                } else {
                    props.0.insert(
                        PropertyKey(0, save_shared::INVENTORY_PROP_NAME.to_string()),
                        save_shared::create_inventory_property(merged),
                    );
                }
            }

            tracing::info!(
                "Merged {} player entries into key '{}'",
                indices.len(),
                match &entries[survivor].key {
                    Property::Str(k) => k.clone(),
                    _ => "?".to_string(),
                }
            );
            for &i in indices {
                if i != survivor {
                    remove.push(i);
                }
            }
            continue;
        }

        // Only one entry has real data — keep the single best (existing behavior).
        // Score: real data dominates, real EOS key breaks ties
        let score = |i: &usize| {
            let data = if entry_has_real_data(&entries[*i].value) {
                10
            } else {
                0
            };
            let eos = if let Property::Str(k) = &entries[*i].key {
                if is_real_eos_key(k) {
                    1
                } else {
                    0
                }
            } else {
                0
            };
            data + eos
        };
        let best = *indices.iter().max_by_key(|&i| score(i)).unwrap();
        for &i in indices {
            if i != best {
                remove.push(i);
            }
        }
    }

    remove.sort_unstable();
    for &i in remove.iter().rev() {
        entries.remove(i);
    }
    remove.len()
}

/// Process player data
fn process_player_data(save: &mut Save, json_data: &JsonValue) -> AppResult<()> {
    let player_data_key = PropertyKey(0, "PlayerData".to_string());

    // Collect Steam IDs from frontend data (source of truth)
    let mut steam_ids_from_frontend: Vec<String> = Vec::new();
    if let Some(player_inventory) = json_data["playerInventory"].as_object() {
        for steam_id in player_inventory.keys() {
            let trimmed_id = steam_id.trim().to_string();
            if !trimmed_id.is_empty() && !steam_ids_from_frontend.iter().any(|id| id == &trimmed_id)
            {
                steam_ids_from_frontend.push(trimmed_id);
            }
        }
    }

    // Record schemas for PlayerData (idempotent — harmless to do up front)
    record_player_data_schemas(save);

    if let Some(player_data_prop) = save.root.properties.0.get_mut(&player_data_key) {
        if let Property::Map(ref mut map_value) = player_data_prop {
            // Remove players that are no longer in the frontend data
            map_value.retain(|entry| match &entry.key {
                Property::Str(s) => {
                    let keep = steam_ids_from_frontend.iter().any(|id| id == s.trim());
                    if !keep {
                        tracing::info!("Removed deleted player: {}", s);
                    }
                    keep
                }
                _ => true,
            });

            // Update or create players from frontend data
            for steam_id in &steam_ids_from_frontend {
                let player_entry = map_value.iter_mut().find(
                    |entry| matches!(&entry.key, Property::Str(s) if s.trim() == steam_id.trim()),
                );

                match player_entry {
                    Some(entry) => {
                        if let Property::Struct(StructValue::Struct(ref mut player_struct)) =
                            &mut entry.value
                        {
                            update_player_data(player_struct, steam_id, json_data);
                        }
                    }
                    None => {
                        tracing::info!("Creating new player data: {}", steam_id);
                        let new_player_struct = create_new_player_struct(steam_id, json_data);
                        map_value.push(uesave::MapEntry {
                            key: Property::Str(steam_id.clone()),
                            value: Property::Struct(StructValue::Struct(new_player_struct)),
                        });
                    }
                }
            }

            // No players left after deletion — remove the whole field to avoid empty/ghost records
            if map_value.is_empty() {
                tracing::info!("All players removed, deleting PlayerData_0 field");
                save.root.properties.0.shift_remove(&player_data_key);
            }
        }
    } else if !steam_ids_from_frontend.is_empty() {
        // Create new PlayerData_0 field
        create_player_data_field(save, &steam_ids_from_frontend, json_data);
    }

    Ok(())
}

/// Create PlayerData field
fn create_player_data_field(save: &mut Save, steam_ids: &[String], json_data: &JsonValue) {
    if steam_ids.is_empty() {
        tracing::warn!("No player data provided, skipping PlayerData_0 creation");
        return;
    }

    tracing::info!("PlayerData_0 field not found, creating...");

    record_player_data_schemas(save);

    let mut map_value = Vec::new();

    for steam_id in steam_ids.iter() {
        tracing::info!("Creating new player data: {}", steam_id);
        let new_player_struct = create_new_player_struct(steam_id, json_data);
        map_value.push(uesave::MapEntry {
            key: Property::Str(steam_id.clone()),
            value: Property::Struct(StructValue::Struct(new_player_struct)),
        });
    }

    let player_data_prop = Property::Map(map_value);

    save.root
        .properties
        .0
        .insert(PropertyKey(0, "PlayerData".to_string()), player_data_prop);
    tracing::info!("Successfully created PlayerData_0 field");
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

/// Record schemas for a LevelsCompleted struct element's fields
fn record_level_struct_schemas(save: &mut Save) {
    let parent = "LevelsCompleted";
    save.schemas.record(
        format!("{}.{}", parent, save_shared::DISPLAY_NAME_FIELD),
        PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::StrProperty),
        },
    );
    save.schemas.record(
        format!("{}.{}", parent, save_shared::HAS_COMPLETED_FIELD),
        PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
        },
    );
    save.schemas.record(
        format!("{}.{}", parent, save_shared::HAS_UNLOCKED_HUB_FIELD),
        PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::BoolProperty),
        },
    );
    save.schemas.record(
        format!("{}.{}", parent, save_shared::LEVEL_NAME_FIELD),
        PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::NameProperty),
        },
    );
    save.schemas.record(
        format!("{}.{}", parent, save_shared::TIME_FIELD),
        PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
        },
    );
    // World struct + nested Items/SanityLevel schemas
    save_shared::create_default_world_property(save, parent);
}

/// Create a single level struct (schemas are recorded by record_level_struct_schemas)
fn create_level_struct(display_name: &str, level_name: &str) -> StructValue {
    let mut level_props = Properties::default();

    // DisplayName
    level_props.0.insert(
        PropertyKey(0, save_shared::DISPLAY_NAME_FIELD.to_string()),
        Property::Str(display_name.to_string()),
    );

    // HasCompleted - true
    level_props.0.insert(
        PropertyKey(0, save_shared::HAS_COMPLETED_FIELD.to_string()),
        Property::Bool(true),
    );

    // HasUnlockedHub - true
    level_props.0.insert(
        PropertyKey(0, save_shared::HAS_UNLOCKED_HUB_FIELD.to_string()),
        Property::Bool(true),
    );

    // LevelName
    level_props.0.insert(
        PropertyKey(0, save_shared::LEVEL_NAME_FIELD.to_string()),
        Property::Name(level_name.to_string()),
    );

    // Time
    level_props.0.insert(
        PropertyKey(0, save_shared::TIME_FIELD.to_string()),
        Property::Float(uesave::Float(-1.0)),
    );

    // World
    level_props.0.insert(
        PropertyKey(0, save_shared::WORLD_FIELD.to_string()),
        save_shared::create_default_world_property_no_schema(),
    );

    StructValue::Struct(level_props)
}

/// Create default LevelsCompleted_0 property (empty array)
fn create_default_levels_completed_property(save: &mut Save) -> Property {
    save.schemas.record(
        "LevelsCompleted".to_string(),
        save_shared::array_struct_tag(StructType::Struct(Some("S_LevelStats".to_string()))),
    );
    record_level_struct_schemas(save);

    Property::Array(ValueVec::Struct(vec![]))
}

/// Unlock all hub doors
/// Reads LevelsCompleted_0 in the save, fills up to ALL_LEVELS count, and sets all Bool values to true
pub fn unlock_all_hub_doors(file_path: &str) -> AppResult<String> {
    tracing::info!("Unlocking all hub doors: {}", file_path);

    validate_save_games_path(Path::new(file_path))?;

    let file = File::open(file_path).map_err(|e| format!("Failed to open save file: {}", e))?;
    let mut reader = BufReader::with_capacity(16384, file);
    let mut save = Save::read(&mut reader).map_err(|e| format!("Failed to parse save: {:?}", e))?;

    let levels_completed_key = PropertyKey(0, "LevelsCompleted".to_string());

    // Create default structure when LevelsCompleted_0 does not exist
    if !save.root.properties.0.contains_key(&levels_completed_key) {
        tracing::warn!(
            "LevelsCompleted_0 field not found, automatically creating default structure..."
        );
        let default_prop = create_default_levels_completed_property(&mut save);
        save.root
            .properties
            .0
            .insert(PropertyKey(0, "LevelsCompleted".to_string()), default_prop);
    }

    // Rebuild default structure if LevelsCompleted_0 format is invalid, preventing unlock flow interruption
    let is_valid_levels_completed = matches!(
        save.root.properties.0.get(&levels_completed_key),
        Some(Property::Array(ValueVec::Struct { .. }))
    );
    if !is_valid_levels_completed {
        tracing::warn!("LevelsCompleted_0 format is incorrect, rebuilding default structure...");
        let default_prop = create_default_levels_completed_property(&mut save);
        save.root
            .properties
            .0
            .insert(PropertyKey(0, "LevelsCompleted".to_string()), default_prop);
    }

    // Record schemas for level struct fields up front (idempotent)
    record_level_struct_schemas(&mut save);

    // Get existing LevelsCompleted_0
    let levels_completed_prop = save
        .root
        .properties
        .0
        .get_mut(&levels_completed_key)
        .ok_or("Failed to create LevelsCompleted_0 field")?;

    if let Property::Array(ValueVec::Struct(value)) = levels_completed_prop {
        tracing::info!(
            "Current level count: {}, target count: {}",
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
                    if let Property::Name(name) = &level_name_prop.1 {
                        existing_levels.insert(name.clone());
                    }
                }

                // Set all Bool values to true
                for (_, prop) in props.0.iter_mut() {
                    if let Property::Bool(ref mut b) = prop {
                        *b = true;
                    }
                }
            }
        }

        tracing::debug!("Existing levels: {:?}", existing_levels);

        // Add missing levels
        for (display_name, level_name) in HUB_DOOR_LEVELS.iter() {
            if !existing_levels.contains(*level_name) {
                tracing::info!("Adding missing level: {} ({})", display_name, level_name);
                value.push(create_level_struct(display_name, level_name));
            }
        }

        tracing::info!("Level count after processing: {}", value.len());
    } else {
        return Err("LevelsCompleted_0 format is incorrect".to_string().into());
    }

    // Write back to file
    let file =
        File::create(file_path).map_err(|e| format!("Failed to create output file: {}", e))?;
    let mut writer = BufWriter::new(file);
    save.write(&mut writer)
        .map_err(|e| format!("Failed to write save: {:?}", e))?;
    writer
        .flush()
        .map_err(|e| format!("Failed to flush buffer: {}", e))?;

    tracing::info!("Hub door unlocking complete, save saved");
    Ok("Hub doors unlocked successfully".to_string())
}
