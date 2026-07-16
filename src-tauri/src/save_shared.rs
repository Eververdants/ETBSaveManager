//! Shared utilities between save_editor and new_save
//!
//! Extracted duplicated constants and functions to a single source of truth.

use uesave::{
    Properties, Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial,
    PropertyType, Save, StructType, StructValue, ValueArray, ValueVec,
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

/// Create inventory property (Name array with 12 slots)
pub fn create_inventory_property(items: Vec<String>) -> Property {
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

/// Create sanity property (Float, clamped 0–100)
pub fn create_sanity_property(sanity: f32) -> Property {
    Property {
        tag: PropertyTagPartial {
            id: None,
            data: PropertyTagDataPartial::Other(PropertyType::FloatProperty),
        },
        inner: PropertyInner::Float(sanity.clamp(0.0, 100.0)),
    }
}

/// Create default World property
///
/// Structure: S_WorldCommon { Items: [], SanityLevel: 100.0 }
pub fn create_default_world_property() -> Property {
    let mut world_inner_props = Properties::default();

    // Items array (empty)
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

/// Modify CurrentLevel_0.Name field value.
///
/// - If the field exists and is a `Name` type, its value is updated.
/// - If it exists but is NOT a `Name` type, an error is logged and `false` is returned.
/// - If it does not exist, a new `CurrentLevel_0` Name property is created (recovery).
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
                eprintln!(
                    "❌ CurrentLevel_0 type error, expected Name, got {:?}",
                    other
                );
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

/// Update difficulty settings
///
/// Removes all existing Difficulty fields, then creates a new one
/// if the difficulty is not "Normal".
pub fn update_difficulty(save: &mut Save, difficulty: &str) {
    println!("⚙️ Processing difficulty settings: {}", difficulty);

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
        println!("🗑️ Removing difficulty field: {}", name);
        save.root.properties.0.shift_remove(&PropertyKey(id, name));
    }

    // If not Normal difficulty, create a new difficulty field
    if difficulty != "Normal" {
        let label = match difficulty {
            "Easy" => "E_Difficulty::NewEnumerator0",
            "Hard" => "E_Difficulty::NewEnumerator1",
            "Nightmare" => "E_Difficulty::NewEnumerator2",
            _ => {
                println!(
                    "⚠️ Unknown difficulty value '{}', using default",
                    difficulty
                );
                "E_Difficulty::NewEnumerator0"
            }
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
        println!("✅ Created difficulty field: {}", label);
    } else {
        println!("➖ Skipping difficulty field creation (Normal difficulty)");
    }
}
