use serde_json::Value;

/// 玩家数据提取结果
pub struct PlayerDataResult {
    pub ids: Vec<String>,
    pub sanities: Vec<f64>,
    pub inventories: Vec<Vec<String>>,
}

/// 从存档 JSON 中提取玩家数据
pub fn extract_player_data(save_json: &Value) -> (Vec<String>, Vec<f64>, Vec<Vec<String>>) {
    let result = extract_player_data_internal(save_json);

    // 打印到控制台
    println!("Player IDs: {:?}", result.ids);
    println!("Player Sanities: {:?}", result.sanities);
    println!("Player Inventories: {:?}", result.inventories);

    (result.ids, result.sanities, result.inventories)
}

fn extract_player_data_internal(save_json: &Value) -> PlayerDataResult {
    let mut result = PlayerDataResult {
        ids: Vec::new(),
        sanities: Vec::new(),
        inventories: Vec::new(),
    };

    let map = match save_json
        .pointer("/root/properties/PlayerData_0/Map")
        .and_then(Value::as_array)
    {
        Some(m) => m,
        None => {
            println!("Map not found or not an array");
            return result;
        }
    };

    for item in map {
        // 提取 key.Str
        let player_id = item
            .pointer("/key/Str")
            .and_then(Value::as_str)
            .map(String::from);

        let Some(id) = player_id else {
            println!("Skipping invalid entry: missing player ID");
            continue;
        };

        // 提取 Sanity
        let sanity = item
            .pointer("/value/Struct/Struct/Sanity_6_A5AFAB454F51CC63745A669BD7E629F6_0/Float")
            .and_then(Value::as_f64)
            .unwrap_or(0.0);

        // 提取 Inventory 的 Name 列表
        let inventory: Vec<String> = item
            .pointer("/value/Struct/Struct/Inventory_12_EFA3897B4BF0E95A13FE30BACF8B1DB4_0/Array/Base/Name")
            .and_then(Value::as_array)
            .map(|arr| {
                arr.iter()
                    .map(|name| name.as_str().unwrap_or("None").to_string())
                    .collect()
            })
            .unwrap_or_default();

        result.ids.push(id);
        result.sanities.push(sanity);
        result.inventories.push(inventory);
    }

    result
}
