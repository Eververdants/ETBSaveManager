//! Player data module - Extract player information from saves
//! Directly traverses the uesave 0.7 Rust structure (no JSON round-trip).

use crate::save_shared::{INVENTORY_PROP_NAME, SANITY_PROP_NAME};
use uesave::{Property, Save, StructValue, ValueVec};

/// Extract player data from a parsed Save
pub fn extract_player_data(save: &Save) -> (Vec<String>, Vec<f64>, Vec<Vec<String>>) {
    let mut ids = Vec::new();
    let mut sanities = Vec::new();
    let mut inventories = Vec::new();

    let Some(player_data_prop) = save
        .root
        .properties
        .0
        .iter()
        .find(|(key, _)| key.1 == "PlayerData")
        .map(|(_, prop)| prop)
    else {
        return (ids, sanities, inventories);
    };

    let Property::Map(entries) = player_data_prop else {
        return (ids, sanities, inventories);
    };

    for entry in entries {
        // Extract player ID (Map key is a Str property)
        let Property::Str(id) = &entry.key else {
            continue;
        };

        // Filter out invalid player IDs
        if id == "ERROR, BAD UNIQUE NET ID" {
            continue;
        }

        // Extract struct properties (Map value is a Struct)
        let Property::Struct(StructValue::Struct(props)) = &entry.value else {
            continue;
        };

        // Extract sanity value
        let sanity = props
            .0
            .iter()
            .find(|(key, _)| key.1 == SANITY_PROP_NAME)
            .and_then(|(_, prop)| match prop {
                Property::Float(v) => Some(v.0 as f64),
                _ => None,
            })
            .unwrap_or(0.0);

        // Extract inventory (up to 12 slots)
        let inventory = props
            .0
            .iter()
            .find(|(key, _)| key.1 == INVENTORY_PROP_NAME)
            .and_then(|(_, prop)| match prop {
                Property::Array(ValueVec::Name(names)) => {
                    Some(names.iter().take(12).cloned().collect::<Vec<_>>())
                }
                _ => None,
            })
            .unwrap_or_default();

        ids.push(id.clone());
        sanities.push(sanity);
        inventories.push(inventory);
    }

    (ids, sanities, inventories)
}
