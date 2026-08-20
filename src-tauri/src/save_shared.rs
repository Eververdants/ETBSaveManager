//! Shared utilities between save_editor and new_save
//!
//! Extracted duplicated constants and functions to a single source of truth.

use uesave::{
    FGuid, Properties, Property, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyType, Save, StructType, StructValue, ValueVec,
};

/// Inventory slot count
pub const INVENTORY_SLOTS: usize = 12;
/// Inventory property name
pub const INVENTORY_PROP_NAME: &str = "Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4";
/// Sanity property name
pub const SANITY_PROP_NAME: &str = "Sanity_6_A5AFAB454F51CC63745A669BD7E629F6";

/// LevelsCompleted struct field names
pub const DISPLAY_NAME_FIELD: &str = "DisplayName_24_E62A59304187EE5783D725B3DCDE520C";
pub const HAS_COMPLETED_FIELD: &str = "HasCompleted_4_EA1ED1B4409DB7F46F5846B1CB695EF3";
pub const HAS_UNLOCKED_HUB_FIELD: &str = "HasUnlockedHub_21_7FD307464C90A6868642B3AEBCDA508D";
pub const LEVEL_NAME_FIELD: &str = "LevelName_8_4C45C1AA462CC6194F50ADAADFB106A8";
pub const TIME_FIELD: &str = "Time_2_59B2BD3A4F00EEBB9DEECCA10EEA1022";
pub const WORLD_FIELD: &str = "World_14_07F9F91140BC22FA10EDBA9F6EED48E9";

/// Item ID to English name mapping table
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

/// Map item ID to English name
pub fn map_item_id_to_name(id: i32) -> &'static str {
    ITEM_MAP
        .iter()
        .find(|(item_id, _)| *item_id == id)
        .map(|(_, name)| *name)
        .unwrap_or("None")
}

/// Helper function: find property by name (ignoring type ID)
pub fn get_property_by_name_mut<'a>(
    properties: &'a mut Properties,
    name: &str,
) -> Option<&'a mut Property> {
    properties
        .0
        .iter_mut()
        .find(|(key, _)| key.1 == name)
        .map(|(_, prop)| prop)
}

/// Helper: record a schema for a top-level property (0.7 stores tags in Save.schemas)
pub fn record_root_schema(save: &mut Save, name: &str, tag: PropertyTagPartial) {
    save.schemas.record(name.to_string(), tag);
}

/// Helper: record a schema for a nested property path (parent.child)
pub fn record_nested_schema(save: &mut Save, parent: &str, child: &str, tag: PropertyTagPartial) {
    save.schemas.record(format!("{}.{}", parent, child), tag);
}

/// Create inventory property (Name array with 12 slots)
pub fn create_inventory_property(items: Vec<String>) -> Property {
    Property::Array(ValueVec::Name(items))
}

/// Create sanity property (Float, clamped 0–100)
pub fn create_sanity_property(sanity: f32) -> Property {
    Property::Float(uesave::Float(sanity.clamp(0.0, 100.0)))
}

/// Create default World property
///
/// Structure: S_WorldCommon { Items: [], SanityLevel: 100.0 }
/// Records schemas under `prefix` (e.g. "LevelsCompleted") for 0.7 write-back.
pub fn create_default_world_property(save: &mut Save, prefix: &str) -> Property {
    let world_key = format!("{}.{}", prefix, WORLD_FIELD);
    let items_key = format!(
        "{}.{}",
        world_key, "Items_19_783746F14C74611D03643BB2DF689058"
    );
    let sanity_key = format!(
        "{}.{}",
        world_key, "SanityLevel_16_3DCC15864CC44BF25D86A09EED0B2065"
    );

    // World struct schema
    save.schemas.record(
        world_key.clone(),
        struct_tag(StructType::Struct(Some("S_WorldCommon".to_string()))),
    );
    // Items array (empty) - array of S_DroppedItem structs
    save.schemas.record(
        items_key,
        array_struct_tag(StructType::Struct(Some("S_DroppedItem".to_string()))),
    );
    // SanityLevel float
    save.schemas.record(
        sanity_key,
        PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
        },
    );

    create_default_world_property_no_schema()
}

/// Create default World property without recording schemas.
/// Caller must ensure schemas are recorded separately (e.g. via create_default_world_property).
pub fn create_default_world_property_no_schema() -> Property {
    let mut world_inner_props = Properties::default();

    // Items array (empty)
    let items_prop = Property::Array(ValueVec::Struct(vec![]));
    world_inner_props.0.insert(
        PropertyKey(0, "Items_19_783746F14C74611D03643BB2DF689058".to_string()),
        items_prop,
    );

    // SanityLevel
    let sanity_prop = Property::Float(uesave::Float(100.0));
    world_inner_props.0.insert(
        PropertyKey(
            0,
            "SanityLevel_16_3DCC15864CC44BF25D86A09EED0B2065".to_string(),
        ),
        sanity_prop,
    );

    Property::Struct(StructValue::Struct(world_inner_props))
}

/// Modify CurrentLevel_0.Name field value.
///
/// - If the field exists and is a `Name` type, its value is updated.
/// - If it exists but is NOT a `Name` type, an error is logged and `false` is returned.
/// - If it does not exist, a new `CurrentLevel_0` Name property is created (recovery).
pub fn modify_current_level(save: &mut Save, new_level_name: String) -> bool {
    let key = PropertyKey(0, "CurrentLevel".to_string());

    if let Some(current_level_prop) = save.root.properties.0.get_mut(&key) {
        match current_level_prop {
            Property::Name(ref mut name) => {
                *name = new_level_name.clone();
                tracing::info!("CurrentLevel_0 modified to: {}", name);
                true
            }
            other => {
                tracing::error!(
                    "CurrentLevel_0 type error, expected Name, got {:?}",
                    other
                );
                false
            }
        }
    } else {
        tracing::warn!("CurrentLevel_0 field not found, creating a new one...");

        record_root_schema(
            save,
            "CurrentLevel",
            PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Other(PropertyType::NameProperty),
            },
        );
        save.root
            .properties
            .0
            .insert(key, Property::Name(new_level_name.clone()));
        tracing::info!(
            "Created new CurrentLevel_0 field with value: {}",
            new_level_name
        );
        true
    }
}

/// Update difficulty settings
///
/// Removes all existing Difficulty fields, then creates a new one
/// if the difficulty is not "Normal".
pub fn update_difficulty(save: &mut Save, difficulty: &str) {
    tracing::info!("Processing difficulty settings: {}", difficulty);

    // Delete all difficulty fields
    let difficulty_keys: Vec<(u32, String)> = save
        .root
        .properties
        .0
        .keys()
        .filter(|key| key.1.starts_with("Difficulty"))
        .map(|key| (key.0, key.1.clone()))
        .collect();

    for (id, name) in difficulty_keys {
        tracing::info!("Removing difficulty field: {}", name);
        save.root.properties.0.shift_remove(&PropertyKey(id, name));
    }

    // If not Normal difficulty, create a new difficulty field
    if difficulty != "Normal" {
        let label = match difficulty {
            "Easy" => "E_Difficulty::NewEnumerator0",
            "Hard" => "E_Difficulty::NewEnumerator1",
            "Nightmare" => "E_Difficulty::NewEnumerator2",
            _ => {
                tracing::warn!(
                    "Unknown difficulty value '{}', using default",
                    difficulty
                );
                "E_Difficulty::NewEnumerator0"
            }
        };

        record_root_schema(
            save,
            "Difficulty",
            PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Byte(Some("E_Difficulty".to_string())),
            },
        );
        save.root.properties.0.insert(
            PropertyKey(0, "Difficulty".to_string()),
            Property::Byte(uesave::Byte::Label(label.to_string())),
        );
        tracing::info!("Created difficulty field: {}", label);
    } else {
        tracing::debug!("Skipping difficulty field creation (Normal difficulty)");
    }
}

/// Helper: schema for a StructProperty tag
pub fn struct_tag(struct_type: StructType) -> PropertyTagPartial {
    PropertyTagPartial {
        id: None,
        data: PropertyTagDataPartial::Struct {
            struct_type,
            id: FGuid::nil(),
        },
    }
}

/// Helper: schema for an Array of structs tag
pub fn array_struct_tag(struct_type: StructType) -> PropertyTagPartial {
    PropertyTagPartial {
        id: None,
        data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Struct {
            struct_type,
            id: FGuid::nil(),
        })),
    }
}

/// Helper: schema for an Array of scalar tag
pub fn array_scalar_tag(inner: PropertyTagDataPartial) -> PropertyTagPartial {
    PropertyTagPartial {
        id: None,
        data: PropertyTagDataPartial::Array(Box::new(inner)),
    }
}
