use crate::common::get_app_config_dir;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tokio::time::{sleep, Duration};

// Steam API响应结构
#[derive(Debug, Deserialize)]
struct SteamApiResponse {
    response: SteamPlayerResponse,
}

#[derive(Debug, Deserialize)]
struct SteamPlayerResponse {
    players: Vec<SteamPlayer>,
}

#[derive(Debug, Deserialize)]
struct SteamPlayer {
    steamid: String,
    personaname: String,
}

// 缓存条目结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CacheEntry {
    pub username: String,
    pub call_count: u32,
    pub last_updated: u64,
}

// 缓存管理器
pub struct SteamCacheManager {
    cache_path: PathBuf,
    cache: HashMap<String, CacheEntry>,
    call_count: u32,
}

impl SteamCacheManager {
    pub fn new() -> Result<Self, String> {
        let cache_dir = get_app_config_dir()?.join("steam_cache");

        if !cache_dir.exists() {
            fs::create_dir_all(&cache_dir).map_err(|e| format!("创建缓存目录失败: {}", e))?;
        }

        let cache_path = cache_dir.join("steam_usernames.json");
        let mut manager = Self {
            cache_path,
            cache: HashMap::new(),
            call_count: 0,
        };

        manager.load_cache()?;
        Ok(manager)
    }

    // 从文件加载缓存
    fn load_cache(&mut self) -> Result<(), String> {
        if !self.cache_path.exists() {
            return Ok(());
        }

        let cache_content =
            fs::read_to_string(&self.cache_path).map_err(|e| format!("读取缓存文件失败: {}", e))?;

        let cache_data: serde_json::Value =
            serde_json::from_str(&cache_content).map_err(|e| format!("解析缓存文件失败: {}", e))?;

        // 加载缓存条目
        if let Some(entries) = cache_data.get("entries").and_then(|v| v.as_object()) {
            for (steam_id, entry_data) in entries {
                if let Ok(entry) = serde_json::from_value::<CacheEntry>(entry_data.clone()) {
                    self.cache.insert(steam_id.clone(), entry);
                }
            }
        }

        // 加载调用计数
        if let Some(count) = cache_data.get("call_count").and_then(|v| v.as_u64()) {
            self.call_count = count as u32;
        }

        println!(
            "已加载Steam缓存，包含{}个条目，调用次数: {}",
            self.cache.len(),
            self.call_count
        );
        Ok(())
    }

    // 保存缓存到文件
    fn save_cache(&self) -> Result<(), String> {
        let mut cache_data = serde_json::Map::new();

        // 转换缓存条目
        let mut entries = serde_json::Map::new();
        for (steam_id, entry) in &self.cache {
            entries.insert(steam_id.clone(), serde_json::to_value(entry).unwrap());
        }
        cache_data.insert("entries".to_string(), serde_json::Value::Object(entries));

        // 保存调用计数
        cache_data.insert(
            "call_count".to_string(),
            serde_json::Value::Number(serde_json::Number::from(self.call_count)),
        );

        let cache_json = serde_json::to_string_pretty(&cache_data)
            .map_err(|e| format!("序列化缓存失败: {}", e))?;

        fs::write(&self.cache_path, cache_json).map_err(|e| format!("写入缓存文件失败: {}", e))?;

        Ok(())
    }

    // 获取缓存条目数量
    pub fn get_cache_size(&self) -> usize {
        self.cache.len()
    }

    // 获取缓存中的用户名（检查是否过期）
    pub fn get_cached_username(&mut self, steam_id: &str) -> Option<String> {
        if let Some(entry) = self.cache.get_mut(steam_id) {
            // 检查缓存是否过期（30天）
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();

            // 30天 = 30 * 24 * 60 * 60 = 2592000秒
            if now - entry.last_updated > 2592000 {
                // 缓存已过期，移除该条目
                println!("缓存已过期，移除Steam ID: {}", steam_id);
                self.cache.remove(steam_id);
                return None;
            }

            // 缓存未过期，增加调用次数（但不增加全局调用计数）
            entry.call_count += 1;
            let username = entry.username.clone();

            // 只有在调用计数达到阈值时才保存，避免频繁写入
            if entry.call_count % 10 == 0 {
                if let Err(e) = self.save_cache() {
                    eprintln!("保存缓存失败: {}", e);
                }
            }

            println!("从缓存获取Steam用户名: {} -> {}", steam_id, username);
            return Some(username);
        }
        None
    }

    // 获取所有缓存条目（用于查看缓存）
    pub fn get_all_cache_entries(&self) -> Vec<(String, CacheEntry)> {
        self.cache
            .iter()
            .map(|(id, entry)| (id.clone(), entry.clone()))
            .collect()
    }

    // 清理过期的缓存条目
    pub fn cleanup_expired_cache(&mut self) -> usize {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let initial_count = self.cache.len();
        println!("开始清理过期缓存，当前缓存条目数: {}", initial_count);

        // 收集过期的缓存条目
        let expired_ids: Vec<String> = self
            .cache
            .iter()
            .filter(|(_, entry)| {
                let is_expired = now - entry.last_updated > 2592000; // 30天
                if is_expired {
                    println!(
                        "发现过期缓存: {} (最后更新: {}秒前)",
                        entry.username,
                        now - entry.last_updated
                    );
                }
                is_expired
            })
            .map(|(id, _)| id.clone())
            .collect();

        // 删除过期的缓存条目
        for id in expired_ids {
            self.cache.remove(&id);
        }

        let removed_count = initial_count - self.cache.len();

        if removed_count > 0 {
            println!(
                "清理了{}个过期的缓存条目，剩余{}个条目",
                removed_count,
                self.cache.len()
            );
            // 保存更新后的缓存
            if let Err(e) = self.save_cache() {
                eprintln!("保存缓存失败: {}", e);
            }
        } else {
            println!("没有发现过期的缓存条目");
        }

        removed_count
    }

    // 更新缓存中的用户名
    pub fn update_cache(&mut self, steam_id: &str, username: String) {
        let entry = CacheEntry {
            username,
            call_count: 1,
            last_updated: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        self.cache.insert(steam_id.to_string(), entry);
        self.call_count += 1;

        // 检查是否需要执行智能清理（基于缓存条目数量）
        if self.cache.len() > 50 {
            self.smart_cleanup();
        }

        // 保存缓存
        if let Err(e) = self.save_cache() {
            eprintln!("保存缓存失败: {}", e);
        }
    }

    // 智能清理缓存
    fn smart_cleanup(&mut self) {
        let initial_count = self.cache.len();
        println!("执行智能清理，当前缓存条目数: {}", initial_count);

        // 找出调用次数少于3次的条目
        let to_remove: Vec<String> = self
            .cache
            .iter()
            .filter(|(_, entry)| entry.call_count < 3)
            .map(|(steam_id, _)| steam_id.clone())
            .collect();

        let removed_count = to_remove.len();

        // 删除这些条目
        for steam_id in to_remove {
            self.cache.remove(&steam_id);
        }

        let final_count = self.cache.len();
        println!(
            "智能清理完成，删除了{}个条目，剩余{}个条目",
            removed_count, final_count
        );
    }

    // 清空所有缓存
    pub fn clear_cache(&mut self) -> Result<(), String> {
        self.cache.clear();
        self.call_count = 0;
        self.save_cache()
    }
}

// 获取Steam用户名
pub async fn get_steam_usernames(
    steam_ids: Vec<String>,
    api_key: String,
) -> Result<HashMap<String, String>, String> {
    if steam_ids.is_empty() {
        return Ok(HashMap::new());
    }

    // 验证Steam ID格式
    for steam_id in &steam_ids {
        // Steam ID必须是17位数字
        if steam_id.len() != 17 || !steam_id.chars().all(|c| c.is_ascii_digit()) {
            return Err(format!("无效的Steam ID格式: {}", steam_id));
        }
    }

    println!(
        "开始获取Steam用户名，请求的Steam ID数量: {}",
        steam_ids.len()
    );
    for (i, steam_id) in steam_ids.iter().enumerate() {
        println!("  请求 {}: {}", i + 1, steam_id);
    }

    // 创建缓存管理器
    let mut cache_manager = SteamCacheManager::new()?;

    println!("当前缓存状态: {} 个条目", cache_manager.get_cache_size());

    // 自动清理过期的缓存条目
    let removed_count = cache_manager.cleanup_expired_cache();
    if removed_count > 0 {
        println!("清理了 {} 个过期的缓存条目", removed_count);
    }

    // 检查缓存中已有的用户名
    let mut result = HashMap::new();
    let mut uncached_ids = Vec::new();

    for steam_id in &steam_ids {
        if let Some(username) = cache_manager.get_cached_username(steam_id) {
            result.insert(steam_id.clone(), username);
            println!(
                "从缓存获取: {} -> {}",
                steam_id,
                result.get(steam_id).unwrap()
            );
        } else {
            uncached_ids.push(steam_id.clone());
            println!("缓存未命中，需要API查询: {}", steam_id);
        }
    }

    // 如果所有ID都在缓存中，直接返回结果
    if uncached_ids.is_empty() {
        println!("所有Steam ID都从缓存获取，无需调用API");
        return Ok(result);
    }

    println!("需要通过API获取的用户名数量: {}", uncached_ids.len());

    // 分批处理未缓存的ID（每批最多100个）
    let chunks: Vec<_> = uncached_ids.chunks(100).collect();

    for (i, chunk) in chunks.iter().enumerate() {
        println!("正在处理第 {} 批，{} 个Steam ID", i + 1, chunk.len());
        let chunk_result = fetch_steam_usernames_batch(chunk, &api_key).await?;

        // 更新缓存和结果
        for (steam_id, username) in chunk_result {
            result.insert(steam_id.clone(), username.clone());
            cache_manager.update_cache(&steam_id, username.clone());
            println!("从API获取并缓存: {} -> {}", steam_id, username);
        }

        // 如果不是最后一批，添加延迟以避免API限制
        if i < chunks.len() - 1 {
            sleep(Duration::from_millis(1000)).await;
        }
    }

    println!("Steam用户名获取完成，总计获取 {} 个用户", result.len());
    Ok(result)
}

// 批量获取Steam用户名
async fn fetch_steam_usernames_batch(
    steam_ids: &[String],
    api_key: &str,
) -> Result<HashMap<String, String>, String> {
    let url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/";

    let client = reqwest::Client::new();
    let params = [("key", api_key), ("steamids", &steam_ids.join(","))];

    let response = client
        .get(url)
        .query(&params)
        .timeout(Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("请求Steam API失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Steam API返回错误状态码: {}", response.status()));
    }

    let api_response: SteamApiResponse = response
        .json()
        .await
        .map_err(|e| format!("解析Steam API响应失败: {}", e))?;

    let mut result = HashMap::new();
    for player in api_response.response.players {
        result.insert(player.steamid, player.personaname);
    }

    Ok(result)
}

// 加密Steam API密钥
#[tauri::command]
pub async fn encrypt_steam_api_key(api_key: String) -> Result<String, String> {
    use crate::encryption;

    // 生成随机密钥
    let mut key = [0u8; 32];
    use rand::RngCore;
    rand::thread_rng().fill_bytes(&mut key);

    // 加密API密钥
    let encrypted = encryption::encrypt_data(&key, api_key.as_bytes())?;

    // 将密钥和加密数据组合
    let combined = format!("{}:{}", hex::encode(key), hex::encode(encrypted));

    Ok(combined)
}

// 解密Steam API密钥
#[tauri::command]
pub async fn decrypt_steam_api_key(encrypted_key: String) -> Result<String, String> {
    use crate::encryption;

    // 分离密钥和加密数据
    let parts: Vec<&str> = encrypted_key.split(':').collect();
    if parts.len() != 2 {
        return Err("无效的加密密钥格式".to_string());
    }

    let key = hex::decode(parts[0]).map_err(|e| format!("解码密钥失败: {}", e))?;
    let encrypted_data = hex::decode(parts[1]).map_err(|e| format!("解码加密数据失败: {}", e))?;

    // 确保密钥长度正确
    if key.len() != 32 {
        return Err("无效的密钥长度".to_string());
    }
    let mut key_array = [0u8; 32];
    key_array.copy_from_slice(&key);

    // 解密API密钥
    let decrypted = encryption::decrypt_data(&key_array, &encrypted_data)?;

    // 将Vec<u8>转换为String
    let api_key =
        String::from_utf8(decrypted).map_err(|e| format!("转换解密数据为字符串失败: {}", e))?;

    Ok(api_key)
}

// 清空Steam缓存
#[tauri::command]
pub async fn clear_steam_cache() -> Result<(), String> {
    let mut cache_manager = SteamCacheManager::new()?;
    cache_manager.clear_cache()?;
    Ok(())
}

// 获取Steam缓存条目数量
#[tauri::command]
pub async fn get_steam_cache_count() -> Result<usize, String> {
    let cache_manager = SteamCacheManager::new()?;
    Ok(cache_manager.get_cache_size())
}

// 获取所有Steam缓存条目
#[tauri::command]
pub async fn get_all_steam_cache_entries() -> Result<Vec<(String, String, u64, u32)>, String> {
    let cache_manager = SteamCacheManager::new()?;
    let entries = cache_manager.get_all_cache_entries();

    // 转换为更友好的格式：(steam_id, username, last_updated, call_count)
    let result: Vec<(String, String, u64, u32)> = entries
        .into_iter()
        .map(|(id, entry)| (id, entry.username, entry.last_updated, entry.call_count))
        .collect();

    Ok(result)
}

// 手动清理过期的Steam缓存条目
#[tauri::command]
pub async fn cleanup_expired_steam_cache() -> Result<usize, String> {
    let mut cache_manager = SteamCacheManager::new()?;
    let removed_count = cache_manager.cleanup_expired_cache();
    Ok(removed_count)
}

// 测试Steam API密钥是否有效
#[tauri::command]
pub async fn test_steam_api_key(
    api_key: String,
    steam_id: String,
) -> Result<HashMap<String, String>, String> {
    // 直接使用传入的API密钥进行测试
    get_steam_usernames(vec![steam_id], api_key).await
}

// 获取Steam用户名（供前端调用）
#[tauri::command]
pub async fn get_steam_usernames_command(
    steam_ids: Vec<String>,
) -> Result<HashMap<String, String>, String> {
    let config_path = get_app_config_dir()?.join("config.json");

    if !config_path.exists() {
        return Err("Steam API密钥未配置".to_string());
    }

    let config_content =
        fs::read_to_string(&config_path).map_err(|e| format!("读取配置文件失败: {}", e))?;

    let config: serde_json::Value =
        serde_json::from_str(&config_content).map_err(|e| format!("解析配置文件失败: {}", e))?;

    let encrypted_api_key = config
        .get("steamApiKey")
        .and_then(|v| v.as_str())
        .ok_or("Steam API密钥未配置")?;

    let api_key = decrypt_steam_api_key(encrypted_api_key.to_string()).await?;
    get_steam_usernames(steam_ids, api_key).await
}

// 保存Steam API密钥到配置文件
#[tauri::command]
pub async fn save_steam_api_key(api_key: String) -> Result<(), String> {
    let config_dir = get_app_config_dir()?;
    let config_path = config_dir.join("config.json");

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }

    let mut config = if config_path.exists() {
        let content =
            fs::read_to_string(&config_path).map_err(|e| format!("读取配置文件失败: {}", e))?;
        serde_json::from_str(&content).map_err(|e| format!("解析配置文件失败: {}", e))?
    } else {
        serde_json::Value::Object(serde_json::Map::new())
    };

    let encrypted_api_key = encrypt_steam_api_key(api_key).await?;

    if let Some(obj) = config.as_object_mut() {
        obj.insert(
            "steamApiKey".to_string(),
            serde_json::Value::String(encrypted_api_key),
        );
    }

    let config_json =
        serde_json::to_string_pretty(&config).map_err(|e| format!("序列化配置失败: {}", e))?;

    fs::write(&config_path, config_json).map_err(|e| format!("写入配置文件失败: {}", e))?;

    Ok(())
}
