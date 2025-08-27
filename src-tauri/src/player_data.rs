use serde_json::Value;

pub fn extract_player_data(save_json: &Value) -> (Vec<String>, Vec<f64>, Vec<Vec<String>>) {
    // 获取 Map 列表
    let map = save_json
        .pointer("/root/properties/PlayerData_0/Map")
        .and_then(|v| v.as_array());

    let mut player_ids = Vec::new();
    let mut player_sanities = Vec::new();
    let mut player_inventories = Vec::new();

    if let Some(map_items) = map {
        for item in map_items {
            // 提取 key.Str
            let player_id = item
                .get("key")
                .and_then(|k| k.get("Str"))
                .and_then(|s| s.as_str())
                .map(String::from);

            // 提取 Sanity
            let sanity = item
                .get("value")
                .and_then(|v| v.get("Struct"))
                .and_then(|s| s.get("Struct"))
                .and_then(|s| s.get("Sanity_6_A5AFAB454F51CC63745A669BD7E629F6_0"))
                .and_then(|s| s.get("Float"))
                .and_then(|f| f.as_f64());

            // 提取 Inventory 的 Name 列表
            let inventory = item
                .get("value")
                .and_then(|v| v.get("Struct"))
                .and_then(|s| s.get("Struct"))
                .and_then(|s| s.get("Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4_0"))
                .and_then(|i| i.get("Array"))
                .and_then(|a| a.get("Base"))
                .and_then(|b| b.get("Name"))
                .and_then(|n| n.as_array());

            if let Some(id) = player_id {
                player_ids.push(id);
                player_sanities.push(sanity.unwrap_or(0.0));
                let names = inventory
                    .unwrap_or(&vec![])
                    .iter()
                    .map(|name| name.as_str().unwrap_or("None").to_string())
                    .collect();
                player_inventories.push(names);
            } else {
                // 可选：记录警告日志等
                println!("Skipping invalid entry: missing player ID");
            }
        }
    } else {
        println!("Map not found or not an array");
    }

    // 打印到控制台
    println!("Player IDs: {:?}", player_ids);
    println!("Player Sanities: {:?}", player_sanities);
    println!("Player Inventories: {:?}", player_inventories);

    (player_ids, player_sanities, player_inventories)
}
