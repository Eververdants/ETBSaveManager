use crate::error::AppResult;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::password_hash::{PasswordHasher, SaltString};
use argon2::{Algorithm, Argon2, Params, Version};
use keyring::Entry;
use rand::rngs::OsRng;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use zeroize::Zeroizing;

const MASTER_KEY_LEN: usize = 32;
const CONFIG_FILE_NAME: &str = "secure_config.json";
const KEYRING_SERVICE: &str = "tauri_encryption_app";
const KEYRING_ACCOUNT: &str = "user_password";
const NONCE_LEN: usize = 12;

/// Argon2 parameter configuration
const ARGON2_MEMORY_COST: u32 = 19456;
const ARGON2_TIME_COST: u32 = 8;
const ARGON2_PARALLELISM: u32 = 1;
const ARGON2_OUTPUT_LEN: usize = 32;

#[derive(Serialize, Deserialize)]
struct EncryptedConfig {
    salt: Vec<u8>,
    nonce: Vec<u8>,
    encrypted_master_key: Vec<u8>,
}

/// Get config file path (can be specified by user)
fn get_config_path(custom_dir: Option<&str>) -> PathBuf {
    match custom_dir {
        Some(dir) => PathBuf::from(dir).join(CONFIG_FILE_NAME),
        None => dirs_next::config_dir()
            .expect("Failed to get config directory")
            .join(CONFIG_FILE_NAME),
    }
}

/// Create Argon2 instance (unified configuration)
fn create_argon2() -> Argon2<'static> {
    let params = Params::new(
        ARGON2_MEMORY_COST,
        ARGON2_TIME_COST,
        ARGON2_PARALLELISM,
        Some(ARGON2_OUTPUT_LEN),
    )
    .expect("Failed to create Argon2 params");
    Argon2::new(Algorithm::Argon2id, Version::V0x13, params)
}

/// Derive key from password
fn derive_key_from_password(password: &str, salt: &SaltString) -> AppResult<[u8; 32]> {
    let argon2 = create_argon2();
    let hash = argon2
        .hash_password(password.as_bytes(), salt)
        .map_err(|e| e.to_string())?;

    let binding = hash.hash.ok_or("Hash output is None")?;
    let derived = binding.as_bytes();

    let mut key = [0u8; 32];
    key.copy_from_slice(&derived[..32]);
    Ok(key)
}

/// Generate master key (using cryptographically secure random number generator)
fn generate_master_key() -> [u8; MASTER_KEY_LEN] {
    let mut key = [0u8; MASTER_KEY_LEN];
    OsRng.fill(&mut key);
    key
}

/// Encrypt master key with user password
fn encrypt_master_key(
    password: &str,
    master_key: &[u8; MASTER_KEY_LEN],
) -> AppResult<EncryptedConfig> {
    let salt = SaltString::generate(&mut OsRng);
    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill(&mut nonce_bytes);

    let derived_key = derive_key_from_password(password, &salt)?;
    let cipher = Aes256Gcm::new((&derived_key).into());
    let nonce = Nonce::from_slice(&nonce_bytes);

    let encrypted = cipher
        .encrypt(nonce, master_key.as_ref())
        .map_err(|e| e.to_string())?;

    Ok(EncryptedConfig {
        salt: salt.as_str().as_bytes().to_vec(),
        nonce: nonce_bytes.to_vec(),
        encrypted_master_key: encrypted,
    })
}

/// Decrypt master key
fn decrypt_master_key(
    password: &str,
    custom_dir: Option<&str>,
) -> AppResult<[u8; MASTER_KEY_LEN]> {
    let config_path = get_config_path(custom_dir);
    if !config_path.exists() {
        return Err("Config file does not exist, please initialize first".into());
    }

    let data = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let config: EncryptedConfig = serde_json::from_str(&data).map_err(|e| e.to_string())?;

    let salt = String::from_utf8_lossy(&config.salt);
    let salt_str = SaltString::from_b64(&salt).map_err(|e| format!("Invalid salt format: {:?}", e))?;

    let derived_key = derive_key_from_password(password, &salt_str)?;
    let cipher = Aes256Gcm::new_from_slice(&derived_key).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(&config.nonce);

    let decrypted = cipher
        .decrypt(nonce, config.encrypted_master_key.as_slice())
        .map_err(|e| format!("Decryption failed: {:?}", e))?;

    if decrypted.len() != MASTER_KEY_LEN {
        return Err("Invalid master key length".into());
    }

    let mut key = [0u8; MASTER_KEY_LEN];
    key.copy_from_slice(&decrypted);
    Ok(key)
}

/// Initialize configuration
pub fn init_config(password: &str, custom_dir: Option<&str>) -> AppResult<()> {
    let master_key = Zeroizing::new(generate_master_key());
    let config = encrypt_master_key(password, &master_key)?;

    let config_path = get_config_path(custom_dir);
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, json).map_err(|e| e.to_string())?;

    // Store in system credential manager
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())?;
    entry.set_password(password).map_err(|e| e.to_string())?;

    Ok(())
}

/// Load master key (automatically retrieves password from config file + system credentials)
pub fn load_master_key(
    custom_dir: Option<&str>,
) -> AppResult<Zeroizing<[u8; MASTER_KEY_LEN]>> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())?;
    let password = entry
        .get_password()
        .map_err(|e| format!("Failed to get password from credential manager: {:?}", e))?;
    decrypt_master_key(&password, custom_dir).map(Zeroizing::new)
}

/// Clear password from system credentials
pub fn clear_saved_password() -> AppResult<()> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())?;
    Ok(entry.set_password("").map_err(|e| e.to_string())?)
}

/// Encrypt file
pub fn encrypt_file(
    master_key: &[u8; MASTER_KEY_LEN],
    input_path: &str,
    output_path: &str,
) -> AppResult<()> {
    let plaintext = fs::read(input_path).map_err(|e| e.to_string())?;
    let ciphertext = encrypt_data(master_key, &plaintext)?;
    fs::write(output_path, ciphertext).map_err(|e| e.to_string())?;
    Ok(())
}

/// Decrypt file
pub fn decrypt_file(
    master_key: &[u8; MASTER_KEY_LEN],
    input_path: &str,
    output_path: &str,
) -> AppResult<()> {
    let ciphertext = fs::read(input_path).map_err(|e| e.to_string())?;
    let plaintext = decrypt_data(master_key, &ciphertext)?;
    fs::write(output_path, plaintext).map_err(|e| e.to_string())?;
    Ok(())
}

/// Encrypt data
pub fn encrypt_data(
    master_key: &[u8; MASTER_KEY_LEN],
    plaintext: &[u8],
) -> AppResult<Vec<u8>> {
    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill(&mut nonce_bytes);

    let cipher = Aes256Gcm::new(master_key.into());
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| e.to_string())?;

    let mut output = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    output.extend_from_slice(&nonce_bytes);
    output.extend_from_slice(&ciphertext);

    Ok(output)
}

/// Decrypt data
pub fn decrypt_data(
    master_key: &[u8; MASTER_KEY_LEN],
    ciphertext: &[u8],
) -> AppResult<Vec<u8>> {
    if ciphertext.len() < NONCE_LEN {
        return Err("Invalid encrypted data".into());
    }

    let (nonce_bytes, encrypted_data) = ciphertext.split_at(NONCE_LEN);
    let nonce = Nonce::from_slice(nonce_bytes);

    let cipher = Aes256Gcm::new(master_key.into());

    Ok(cipher
        .decrypt(nonce, encrypted_data)
        .map_err(|e| format!("Decryption failed: {:?}", e))?)
}
