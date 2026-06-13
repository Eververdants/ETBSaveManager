//! Player data module - Extract player information from saves
//! Optimized version: Pre-allocate capacity, reduce string allocations

use serde_json::Value;

/// JSON path constants (avoid repeated string allocations)
const PLAYER_DATA_PATH: &str = "/root/properties/PlayerData_0/Map";
const SANITY_PATH: &str = "/value/Struct/Struct/Sanity_6_A5AFAB454F51CC63745A669BD7E629F6_0/Float";
const INVENTORY_PATH: &str =
    "/value/Struct/Struct/Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4_0/Array/Base/Name";

/// Extract player data from save JSON (optimized version)
pub fn extract_player_data(save_json: &Value) -> (Vec<String>, Vec<f64>, Vec<Vec<String>>) {
    let map = match save_json
        .pointer(PLAYER_DATA_PATH)
        .and_then(Value::as_array)
    {
        Some(m) if !m.is_empty() => m,
        _ => return (Vec::new(), Vec::new(), Vec::new()),
    };

    // Pre-allocate capacity
    let capacity = map.len();
    let mut ids = Vec::with_capacity(capacity);
    let mut sanities = Vec::with_capacity(capacity);
    let mut inventories = Vec::with_capacity(capacity);

    for item in map {
        // Extract player ID
        let id = match item.pointer("/key/Str").and_then(Value::as_str) {
            Some(s) => s.to_string(),
            None => continue,
        };

        // Filter out invalid player IDs
        if id == "ERROR, BAD UNIQUE NET ID" {
            continue;
        }

        // Extract sanity value
        let sanity = item
            .pointer(SANITY_PATH)
            .and_then(Value::as_f64)
            .unwrap_or(0.0);

        // Extract inventory (pre-allocate 12 slots)
        let inventory = item
            .pointer(INVENTORY_PATH)
            .and_then(Value::as_array)
            .map(|arr| {
                let mut inv = Vec::with_capacity(12);
                for name in arr.iter().take(12) {
                    inv.push(name.as_str().unwrap_or("None").to_string());
                }
                inv
            })
            .unwrap_or_default();

        ids.push(id);
        sanities.push(sanity);
        inventories.push(inventory);
    }

    (ids, sanities, inventories)
}
