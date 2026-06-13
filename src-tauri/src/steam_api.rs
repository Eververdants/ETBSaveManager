use crate::common::get_app_config_dir;
use crate::error::AppError;
use crate::error::AppResult;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use tokio::time::{sleep, Duration};
use zeroize::Zeroizing;

/// Cache expiration time (30 days, in seconds)
const CACHE_EXPIRY_SECONDS: u64 = 30 * 24 * 60 * 60;
/// Smart cleanup threshold
const SMART_CLEANUP_THRESHOLD: usize = 50;
/// Minimum call count (entries below this will be cleaned up)
const MIN_CALL_COUNT: u32 = 3;
/// API request timeout (seconds)
const API_TIMEOUT_SECONDS: u64 = 10;
/// Batch delay (milliseconds)
const BATCH_DELAY_MS: u64 = 1000;
/// Maximum Steam IDs per batch
const MAX_BATCH_SIZE: usize = 100;
static STEAM_HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

// Steam API response structure
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

// Cache entry structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CacheEntry {
    pub username: String,
    pub call_count: u32,
    pub last_updated: u64,
}

#[derive(Debug, Deserialize)]
struct SteamCacheFile {
    #[serde(default)]
    entries: HashMap<String, CacheEntry>,
    #[serde(default)]
    call_count: u32,
}

#[derive(Serialize)]
struct SteamCacheFileRef<'a> {
    entries: &'a HashMap<String, CacheEntry>,
    call_count: u32,
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

/// Get current timestamp (inline optimized)
#[inline(always)]
fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[inline]
fn steam_http_client() -> &'static reqwest::Client {
    STEAM_HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(Duration::from_secs(API_TIMEOUT_SECONDS))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new())
    })
}

// Cache manager
pub struct SteamCacheManager {
    cache_path: PathBuf,
    cache: HashMap<String, CacheEntry>,
    call_count: u32,
    dirty: bool, // Track whether save is needed
}

impl SteamCacheManager {
    pub fn new() -> AppResult<Self> {
        let cache_dir = get_app_config_dir()?.join("steam_cache");

        if !cache_dir.exists() {
            fs::create_dir_all(&cache_dir).map_err(|e| format!("Failed to create cache directory: {}", e))?;
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

    /// Load cache from file
    fn load_cache(&mut self) -> AppResult<()> {
        if !self.cache_path.exists() {
            return Ok(());
        }

        let cache_content =
            fs::read_to_string(&self.cache_path).map_err(|e| format!("Failed to read cache file: {}", e))?;

        let cache_data: SteamCacheFile =
            serde_json::from_str(&cache_content).map_err(|e| format!("Failed to parse cache file: {}", e))?;

        self.cache = cache_data.entries;
        self.call_count = cache_data.call_count;

        Ok(())
    }

    /// Save cache to file (only when dirty)
    fn save_cache(&mut self) -> AppResult<()> {
        if !self.dirty {
            return Ok(());
        }

        let cache_data = SteamCacheFileRef {
            entries: &self.cache,
            call_count: self.call_count,
        };

        let cache_json = serde_json::to_string(&cache_data) // No pretty print to reduce file size
            .map_err(|e| format!("Failed to serialize cache: {}", e))?;

        fs::write(&self.cache_path, cache_json).map_err(|e| format!("Failed to write cache file: {}", e))?;
        self.dirty = false;

        Ok(())
    }

    /// Get cache entry count
    #[inline]
    pub fn get_cache_size(&self) -> usize {
        self.cache.len()
    }

    /// Get cached username (check if expired)
    pub fn get_cached_username(&mut self, steam_id: &str) -> Option<String> {
        let entry = self.cache.get_mut(steam_id)?;

        if entry.is_expired() {
            // Expired entries are not auto-deleted, handled by manual cleanup command
            return None;
        }

        entry.call_count += 1;
        let username = entry.username.clone();

        // Save every 20 calls
        if entry.call_count % 20 == 0 {
            self.dirty = true;
        }

        Some(username)
    }

    /// Get all cache entries
    pub fn get_all_cache_entries(&self) -> Vec<(String, CacheEntry)> {
        self.cache
            .iter()
            .map(|(id, entry)| (id.clone(), entry.clone()))
            .collect()
    }

    /// Clean up expired cache entries
    pub fn cleanup_expired_cache(&mut self) -> usize {
        let initial_count = self.cache.len();
        self.cache.retain(|_, entry| !entry.is_expired());
        let removed_count = initial_count - self.cache.len();

        if removed_count > 0 {
            self.dirty = true;
        }

        removed_count
    }

    /// Update username in cache
    pub fn update_cache(&mut self, steam_id: &str, username: String) {
        self.cache
            .insert(steam_id.to_string(), CacheEntry::new(username));
        self.call_count += 1;
        self.dirty = true;

        // Check if smart cleanup is needed
        if self.cache.len() > SMART_CLEANUP_THRESHOLD {
            self.smart_cleanup();
        }
    }

    /// Smart cache cleanup
    fn smart_cleanup(&mut self) {
        let initial_count = self.cache.len();
        self.cache
            .retain(|_, entry| entry.call_count >= MIN_CALL_COUNT);

        if self.cache.len() < initial_count {
            self.dirty = true;
        }
    }

    /// Clear all cache
    pub fn clear_cache(&mut self) -> AppResult<()> {
        self.cache.clear();
        self.call_count = 0;
        self.dirty = true;
        self.save_cache()
    }

    /// Delete a single cache entry
    pub fn delete_cache_entry(&mut self, steam_id: &str) -> AppResult<bool> {
        let removed = self.cache.remove(steam_id).is_some();
        if removed {
            self.dirty = true;
            self.save_cache()?;
        }
        Ok(removed)
    }

    pub fn flush(&mut self) -> AppResult<()> {
        self.save_cache()
    }
}

pub struct SteamCacheState {
    manager: Mutex<Option<SteamCacheManager>>,
}

impl SteamCacheState {
    pub fn new() -> Self {
        Self {
            manager: Mutex::new(None),
        }
    }

    pub fn init(&self) -> AppResult<()> {
        let manager = SteamCacheManager::new()?;
        let mut guard = self.manager.lock().map_err(|e| AppError::General(format!("Steam cache lock error: {}", e)))?;
        *guard = Some(manager);
        Ok(())
    }

    pub fn with_manager<F, R>(&self, f: F) -> AppResult<R>
    where
        F: FnOnce(&mut SteamCacheManager) -> AppResult<R>,
    {
        let mut guard = self.manager.lock().map_err(|e| AppError::General(format!("Steam cache lock error: {}", e)))?;
        let manager = guard.as_mut().ok_or_else(|| AppError::General("Steam cache not initialized".to_string()))?;
        f(manager)
    }
}

impl Default for SteamCacheState {
    fn default() -> Self {
        Self::new()
    }
}

/// Validate Steam ID format (optimized version)
#[inline]
fn validate_steam_id(steam_id: &str) -> bool {
    steam_id.len() == 17 && steam_id.bytes().all(|b| b.is_ascii_digit())
}

/// Get Steam usernames (optimized version)
pub async fn get_steam_usernames(
    steam_ids: Vec<String>,
    api_key: String,
    cache_state: &SteamCacheState,
) -> AppResult<HashMap<String, String>> {
    if steam_ids.is_empty() {
        return Ok(HashMap::new());
    }

    // Validate Steam ID format
    for steam_id in &steam_ids {
        if !validate_steam_id(steam_id) {
            return Err(format!("Invalid Steam ID format: {}", steam_id).into());
        }
    }

    let steam_id_count = steam_ids.len();
    let (mut result, uncached_ids) = cache_state.with_manager(move |cache_manager| {
        // Separate cached and uncached IDs
        let mut result = HashMap::with_capacity(steam_id_count);
        let mut uncached_ids = Vec::with_capacity(steam_id_count);

        for steam_id in steam_ids {
            if let Some(username) = cache_manager.get_cached_username(&steam_id) {
                result.insert(steam_id, username);
            } else {
                uncached_ids.push(steam_id);
            }
        }

        // Batch flush hit counts and cleanup results
        cache_manager.flush()?;

        Ok((result, uncached_ids))
    })?;

    // If all IDs are in cache, return directly
    if uncached_ids.is_empty() {
        return Ok(result);
    }

    // Process uncached IDs in batches
    let mut fetched_pairs = Vec::with_capacity(uncached_ids.len());
    let chunk_count = uncached_ids.len().div_ceil(MAX_BATCH_SIZE);
    for (i, chunk) in uncached_ids.chunks(MAX_BATCH_SIZE).enumerate() {
        let chunk_result = fetch_steam_usernames_batch(chunk, &api_key).await?;

        for (steam_id, username) in chunk_result {
            result.insert(steam_id.clone(), username.clone());
            fetched_pairs.push((steam_id, username));
        }

        // Delay between batches (last batch doesn't need it)
        if i + 1 < chunk_count {
            sleep(Duration::from_millis(BATCH_DELAY_MS)).await;
        }
    }

    cache_state.with_manager(move |cache_manager| {
        for (steam_id, username) in fetched_pairs {
            cache_manager.update_cache(&steam_id, username);
        }
        cache_manager.flush()
    })?;

    Ok(result)
}

/// Batch fetch Steam usernames
async fn fetch_steam_usernames_batch(
    steam_ids: &[String],
    api_key: &str,
) -> AppResult<HashMap<String, String>> {
    let url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/";

    let params = [("key", api_key), ("steamids", &steam_ids.join(","))];

    let response = steam_http_client()
        .get(url)
        .query(&params)
        .send()
        .await
        .map_err(|e| format!("Steam API request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Steam API returned error status code: {}", response.status()).into());
    }

    let api_response: SteamApiResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Steam API response: {}", e))?;

    Ok(api_response
        .response
        .players
        .into_iter()
        .map(|p| (p.steamid, p.personaname))
        .collect())
}

/// Store encrypted Steam API key using system credential manager
/// More secure than plaintext JSON files, utilizes OS-level credential protection
const KEYRING_SERVICE_STEAM: &str = "etbsavemanager-steam-api";
const KEYRING_ACCOUNT_STEAM_KEY: &str = "steam-api-key";

fn read_encrypted_steam_api_key_from_config() -> AppResult<String> {
    use keyring::Entry;

    let entry = Entry::new(KEYRING_SERVICE_STEAM, KEYRING_ACCOUNT_STEAM_KEY)
        .map_err(|e| AppError::General(format!("Failed to create credential entry: {}", e)))?;

    Ok(entry
        .get_password()
        .map_err(|e| AppError::General(format!("Failed to read Steam API key: {}", e)))?)
}

fn write_encrypted_steam_api_key_to_config(encrypted_api_key: String) -> AppResult<()> {
    use keyring::Entry;

    let entry = Entry::new(KEYRING_SERVICE_STEAM, KEYRING_ACCOUNT_STEAM_KEY)
        .map_err(|e| AppError::General(format!("Failed to create credential entry: {}", e)))?;

    Ok(entry
        .set_password(&encrypted_api_key)
        .map_err(|e| AppError::General(format!("Failed to save Steam API key: {}", e)))?)
}

// ==================== Tauri Commands ====================

#[tauri::command]
pub async fn encrypt_steam_api_key(api_key: String) -> AppResult<String> {
    use crate::encryption;
    use rand::RngCore;

    let mut raw_key = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut raw_key);

    let key = Zeroizing::new(raw_key);
    let encrypted = encryption::encrypt_data(&key, api_key.as_bytes())?;
    Ok(format!("{}:{}", hex::encode(&*key), hex::encode(encrypted)))
}

#[tauri::command]
pub async fn decrypt_steam_api_key(encrypted_key: String) -> AppResult<String> {
    use crate::encryption;

    let (key_hex, encrypted_data_hex) = encrypted_key
        .split_once(':')
        .ok_or_else(|| AppError::General("Invalid encrypted key format".to_string()))?;

    let key = hex::decode(key_hex).map_err(|e| format!("Failed to decode key: {}", e))?;
    let encrypted_data =
        hex::decode(encrypted_data_hex).map_err(|e| format!("Failed to decode encrypted data: {}", e))?;

    if key.len() != 32 {
        return Err("Invalid key length".to_string().into());
    }

    let mut key_array = [0u8; 32];
    key_array.copy_from_slice(&key);

    let key = Zeroizing::new(key_array);
    let decrypted = encryption::decrypt_data(&key, &encrypted_data)?;
    Ok(String::from_utf8(decrypted)
        .map_err(|e| format!("Failed to convert decrypted data to string: {}", e))?)
}

#[tauri::command]
pub async fn clear_steam_cache(cache_state: State<'_, SteamCacheState>) -> AppResult<()> {
    cache_state.with_manager(|manager| manager.clear_cache())
}

#[tauri::command]
pub async fn get_steam_cache_count(cache_state: State<'_, SteamCacheState>) -> AppResult<usize> {
    cache_state.with_manager(|manager| Ok(manager.get_cache_size()))
}

#[tauri::command]
pub async fn get_all_steam_cache_entries(
    cache_state: State<'_, SteamCacheState>,
) -> AppResult<Vec<(String, String, u64, u32)>> {
    cache_state.with_manager(|manager| {
        Ok(manager
            .get_all_cache_entries()
            .into_iter()
            .map(|(id, entry)| (id, entry.username, entry.last_updated, entry.call_count))
            .collect())
    })
}

#[tauri::command]
pub async fn cleanup_expired_steam_cache(
    cache_state: State<'_, SteamCacheState>,
) -> AppResult<usize> {
    cache_state.with_manager(|manager| {
        let removed = manager.cleanup_expired_cache();
        manager.flush()?;
        Ok(removed)
    })
}

#[tauri::command]
pub async fn test_steam_api_key(
    api_key: String,
    steam_id: String,
    cache_state: State<'_, SteamCacheState>,
) -> AppResult<HashMap<String, String>> {
    get_steam_usernames(vec![steam_id], api_key, &cache_state).await
}

#[tauri::command]
pub async fn get_steam_usernames_command(
    steam_ids: Vec<String>,
    cache_state: State<'_, SteamCacheState>,
) -> AppResult<HashMap<String, String>> {
    let encrypted_api_key = tokio::task::spawn_blocking(read_encrypted_steam_api_key_from_config)
        .await
        .map_err(|e| AppError::General(format!("Failed to read Steam config task: {}", e)))??;

    let api_key = decrypt_steam_api_key(encrypted_api_key).await?;
    get_steam_usernames(steam_ids, api_key, &cache_state).await
}

#[tauri::command]
pub async fn save_steam_api_key(api_key: String) -> AppResult<()> {
    let encrypted_api_key = encrypt_steam_api_key(api_key).await?;
    tokio::task::spawn_blocking(move || {
        write_encrypted_steam_api_key_to_config(encrypted_api_key)
    })
    .await
    .map_err(|e| AppError::General(format!("Failed to save Steam config task: {}", e)))?
}

#[tauri::command]
pub async fn delete_steam_cache_entry(
    steam_id: String,
    cache_state: State<'_, SteamCacheState>,
) -> AppResult<bool> {
    cache_state.with_manager(|manager| manager.delete_cache_entry(&steam_id))
}

#[tauri::command]
pub async fn batch_refresh_steam_cache_entries(
    steam_ids: Vec<String>,
    cache_state: State<'_, SteamCacheState>,
) -> AppResult<HashMap<String, String>> {
    let encrypted_api_key = tokio::task::spawn_blocking(read_encrypted_steam_api_key_from_config)
        .await
        .map_err(|e| AppError::General(format!("Failed to read Steam config task: {}", e)))??;

    let api_key = decrypt_steam_api_key(encrypted_api_key).await?;
    get_steam_usernames(steam_ids, api_key, &cache_state).await
}
