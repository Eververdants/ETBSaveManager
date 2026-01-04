use crate::common::get_app_config_dir;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::time::{sleep, Duration};

/// 缓存过期时间（30天，单位：秒）
const CACHE_EXPIRY_SECONDS: u64 = 30 * 24 * 60 * 60;
/// 智能清理阈值
const SMART_CLEANUP_THRESHOLD: usize = 50;
/// 最小调用次数（低于此值的条目会被清理）
const MIN_CALL_COUNT: u32 = 3;
/// API 请求超时时间
const API_TIMEOUT_SECONDS: u64 = 10;
/// 批次间延迟（毫秒）
const BATCH_DELAY_MS: u64 = 1000;
/// 每批最大 Steam ID 数量
const MAX_BATCH_SIZE: usize = 100;

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

impl CacheEntry {
    #[inline]
    fn new(username: String) -> Self {
        Self {
            username,
            call_count: 1,
            last_updated: current_timestamp(),
        }
    }

    #[inline]
    fn is_expired(&self) -> bool {
        current_timestamp() - self.last_updated > CACHE_EXPIRY_SECONDS
    }
}

/// 获取当前时间戳（内联优化）
#[inline(always)]
fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// 缓存管理器
pub struct SteamCacheManager {
    cache_path: PathBuf,
    cache: HashMap<String, CacheEntry>,
    call_count: u32,
    dirty: bool, // 追踪是否需要保存
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
            cache: HashMap::with_capacity(64),
            call_count: 0,
            dirty: false,
        };

        manager.load_cache()?;
        Ok(manager)
    }

    /// 从文件加载缓存
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
            self.cache.reserve(entries.len());
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

        Ok(())
    }

    /// 保存缓存到文件（仅在 dirty 时保存）
    fn save_cache(&mut self) -> Result<(), String> {
        if !self.dirty {
            return Ok(());
        }

        let entries: serde_json::Map<String, serde_json::Value> = self
            .cache
            .iter()
            .filter_map(|(steam_id, entry)| {
                serde_json::to_value(entry)
                    .ok()
                    .map(|v| (steam_id.clone(), v))
            })
            .collect();

        let cache_data = serde_json::json!({
            "entries": entries,
            "call_count": self.call_count
        });

        let cache_json = serde_json::to_string(&cache_data) // 不使用 pretty，减少文件大小
            .map_err(|e| format!("序列化缓存失败: {}", e))?;

        fs::write(&self.cache_path, cache_json).map_err(|e| format!("写入缓存文件失败: {}", e))?;
        self.dirty = false;

        Ok(())
    }

    /// 获取缓存条目数量
    #[inline]
    pub fn get_cache_size(&self) -> usize {
        self.cache.len()
    }

    /// 获取缓存中的用户名（检查是否过期）
    pub fn get_cached_username(&mut self, steam_id: &str) -> Option<String> {
        let entry = self.cache.get_mut(steam_id)?;

        if entry.is_expired() {
            self.cache.remove(steam_id);
            self.dirty = true;
            return None;
        }

        entry.call_count += 1;
        let username = entry.username.clone();

        // 每20次调用保存一次
        if entry.call_count % 20 == 0 {
            self.dirty = true;
            let _ = self.save_cache();
        }

        Some(username)
    }

    /// 获取所有缓存条目
    pub fn get_all_cache_entries(&self) -> Vec<(String, CacheEntry)> {
        self.cache
            .iter()
            .map(|(id, entry)| (id.clone(), entry.clone()))
            .collect()
    }

    /// 清理过期的缓存条目
    pub fn cleanup_expired_cache(&mut self) -> usize {
        let initial_count = self.cache.len();
        self.cache.retain(|_, entry| !entry.is_expired());
        let removed_count = initial_count - self.cache.len();

        if removed_count > 0 {
            self.dirty = true;
            let _ = self.save_cache();
        }

        removed_count
    }

    /// 更新缓存中的用户名
    pub fn update_cache(&mut self, steam_id: &str, username: String) {
        self.cache
            .insert(steam_id.to_string(), CacheEntry::new(username));
        self.call_count += 1;
        self.dirty = true;

        // 检查是否需要执行智能清理
        if self.cache.len() > SMART_CLEANUP_THRESHOLD {
            self.smart_cleanup();
        }

        let _ = self.save_cache();
    }

    /// 智能清理缓存
    fn smart_cleanup(&mut self) {
        let initial_count = self.cache.len();
        self.cache
            .retain(|_, entry| entry.call_count >= MIN_CALL_COUNT);

        if self.cache.len() < initial_count {
            self.dirty = true;
        }
    }

    /// 清空所有缓存
    pub fn clear_cache(&mut self) -> Result<(), String> {
        self.cache.clear();
        self.call_count = 0;
        self.dirty = true;
        self.save_cache()
    }
}

/// 验证 Steam ID 格式（优化版）
#[inline]
fn validate_steam_id(steam_id: &str) -> bool {
    steam_id.len() == 17 && steam_id.bytes().all(|b| b.is_ascii_digit())
}

/// 获取Steam用户名（优化版）
pub async fn get_steam_usernames(
    steam_ids: Vec<String>,
    api_key: String,
) -> Result<HashMap<String, String>, String> {
    if steam_ids.is_empty() {
        return Ok(HashMap::new());
    }

    // 验证Steam ID格式
    for steam_id in &steam_ids {
        if !validate_steam_id(steam_id) {
            return Err(format!("无效的Steam ID格式: {}", steam_id));
        }
    }

    let mut cache_manager = SteamCacheManager::new()?;

    // 自动清理过期的缓存条目
    cache_manager.cleanup_expired_cache();

    // 分离缓存命中和未命中的 ID
    let mut result = HashMap::with_capacity(steam_ids.len());
    let mut uncached_ids = Vec::new();

    for steam_id in &steam_ids {
        if let Some(username) = cache_manager.get_cached_username(steam_id) {
            result.insert(steam_id.clone(), username);
        } else {
            uncached_ids.push(steam_id.clone());
        }
    }

    // 如果所有ID都在缓存中，直接返回
    if uncached_ids.is_empty() {
        return Ok(result);
    }

    // 分批处理未缓存的ID
    let chunks: Vec<_> = uncached_ids.chunks(MAX_BATCH_SIZE).collect();
    let chunk_count = chunks.len();

    for (i, chunk) in chunks.into_iter().enumerate() {
        let chunk_result = fetch_steam_usernames_batch(chunk, &api_key).await?;

        for (steam_id, username) in chunk_result {
            result.insert(steam_id.clone(), username.clone());
            cache_manager.update_cache(&steam_id, username);
        }

        // 批次间延迟（最后一批不需要）
        if i < chunk_count - 1 {
            sleep(Duration::from_millis(BATCH_DELAY_MS)).await;
        }
    }

    Ok(result)
}

/// 批量获取Steam用户名
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
        .timeout(Duration::from_secs(API_TIMEOUT_SECONDS))
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

    Ok(api_response
        .response
        .players
        .into_iter()
        .map(|p| (p.steamid, p.personaname))
        .collect())
}

// ==================== Tauri Commands ====================

#[tauri::command]
pub async fn encrypt_steam_api_key(api_key: String) -> Result<String, String> {
    use crate::encryption;
    use rand::RngCore;

    let mut key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut key);

    let encrypted = encryption::encrypt_data(&key, api_key.as_bytes())?;
    Ok(format!("{}:{}", hex::encode(key), hex::encode(encrypted)))
}

#[tauri::command]
pub async fn decrypt_steam_api_key(encrypted_key: String) -> Result<String, String> {
    use crate::encryption;

    let parts: Vec<&str> = encrypted_key.split(':').collect();
    if parts.len() != 2 {
        return Err("无效的加密密钥格式".to_string());
    }

    let key = hex::decode(parts[0]).map_err(|e| format!("解码密钥失败: {}", e))?;
    let encrypted_data = hex::decode(parts[1]).map_err(|e| format!("解码加密数据失败: {}", e))?;

    if key.len() != 32 {
        return Err("无效的密钥长度".to_string());
    }

    let mut key_array = [0u8; 32];
    key_array.copy_from_slice(&key);

    let decrypted = encryption::decrypt_data(&key_array, &encrypted_data)?;
    String::from_utf8(decrypted).map_err(|e| format!("转换解密数据为字符串失败: {}", e))
}

#[tauri::command]
pub async fn clear_steam_cache() -> Result<(), String> {
    SteamCacheManager::new()?.clear_cache()
}

#[tauri::command]
pub async fn get_steam_cache_count() -> Result<usize, String> {
    Ok(SteamCacheManager::new()?.get_cache_size())
}

#[tauri::command]
pub async fn get_all_steam_cache_entries() -> Result<Vec<(String, String, u64, u32)>, String> {
    let cache_manager = SteamCacheManager::new()?;
    Ok(cache_manager
        .get_all_cache_entries()
        .into_iter()
        .map(|(id, entry)| (id, entry.username, entry.last_updated, entry.call_count))
        .collect())
}

#[tauri::command]
pub async fn cleanup_expired_steam_cache() -> Result<usize, String> {
    Ok(SteamCacheManager::new()?.cleanup_expired_cache())
}

#[tauri::command]
pub async fn test_steam_api_key(
    api_key: String,
    steam_id: String,
) -> Result<HashMap<String, String>, String> {
    get_steam_usernames(vec![steam_id], api_key).await
}

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

#[tauri::command]
pub async fn save_steam_api_key(api_key: String) -> Result<(), String> {
    let config_dir = get_app_config_dir()?;
    let config_path = config_dir.join("config.json");

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }

    let mut config: serde_json::Value = if config_path.exists() {
        let content =
            fs::read_to_string(&config_path).map_err(|e| format!("读取配置文件失败: {}", e))?;
        serde_json::from_str(&content).map_err(|e| format!("解析配置文件失败: {}", e))?
    } else {
        serde_json::json!({})
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
