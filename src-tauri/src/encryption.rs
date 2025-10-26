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

#[derive(Serialize, Deserialize)]
struct EncryptedConfig {
    salt: Vec<u8>,
    nonce: Vec<u8>,
    encrypted_master_key: Vec<u8>,
}

// 获取配置文件路径（可由用户指定）
fn get_config_path(custom_dir: Option<&str>) -> PathBuf {
    match custom_dir {
        Some(dir) => {
            let mut path = PathBuf::from(dir);
            path.push(CONFIG_FILE_NAME);
            path
        }
        None => {
            let mut path = dirs_next::config_dir().expect("无法获取配置目录");
            path.push(CONFIG_FILE_NAME);
            path
        }
    }
}

// 生成主密钥
fn generate_master_key() -> [u8; MASTER_KEY_LEN] {
    let mut key = [0u8; MASTER_KEY_LEN];
    rand::thread_rng().fill(&mut key);
    key
}

// 使用用户密码加密主密钥
fn encrypt_master_key(
    password: &str,
    master_key: &[u8; MASTER_KEY_LEN],
    _custom_dir: Option<&str>,
) -> Result<EncryptedConfig, String> {
    let salt = SaltString::generate(&mut OsRng);
    let mut nonce = [0u8; 12];
    OsRng.fill(&mut nonce);

    let params = Params::new(19456, 8, 1, Some(32)).unwrap(); // tag_len=32
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);

    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?;
    let binding = hash.hash.unwrap();
    let derived_key = &binding.as_bytes()[..32];
    let cipher = Aes256Gcm::new(derived_key.into());
    let nonce = Nonce::from_slice(&nonce);

    let encrypted = cipher
        .encrypt(nonce, master_key.as_ref())
        .map_err(|e| e.to_string())?;

    Ok(EncryptedConfig {
        salt: salt.as_str().as_bytes().to_vec(),
        nonce: nonce.to_vec(),
        encrypted_master_key: encrypted,
    })
}

// 解密主密钥
fn decrypt_master_key(
    password: &str,
    custom_dir: Option<&str>,
) -> Result<[u8; MASTER_KEY_LEN], String> {
    // 获取配置路径
    let config_path = get_config_path(custom_dir); // 假设 get_config_path 已定义
    if !config_path.exists() {
        return Err("配置文件不存在，请先初始化".into());
    }

    // 读取配置文件内容
    let data = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let config: EncryptedConfig = serde_json::from_str(&data).map_err(|e| e.to_string())?;

    // 解析 salt
    let salt = String::from_utf8_lossy(&config.salt);
    let salt_str = SaltString::from_b64(&salt).map_err(|e| format!("无效的 salt 格式: {:?}", e))?;

    // 构造 nonce
    let nonce = Nonce::from_slice(&config.nonce);

    // 设置 Argon2 参数
    let params = Params::new(19456, 8, 1, Some(32)).expect("Failed to create Params");
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    // 派生密钥
    let hash = argon2
        .hash_password(password.as_bytes(), &salt_str)
        .map_err(|e| e.to_string())?;
    let binding = hash.hash.unwrap();
    let derived_key = &binding.as_bytes()[..32];

    // 初始化 AES-GCM cipher
    let cipher = Aes256Gcm::new_from_slice(derived_key).map_err(|e| e.to_string())?;

    // 解密加密的主密钥
    let decrypted = cipher
        .decrypt(nonce, config.encrypted_master_key.as_slice())
        .map_err(|e| format!("解密失败: {:?}", e))?;

    // 验证长度
    if decrypted.len() != MASTER_KEY_LEN {
        return Err("主密钥长度错误".into());
    }

    // 转为 [u8; 32]
    let mut key = [0u8; MASTER_KEY_LEN];
    key.copy_from_slice(&decrypted[..MASTER_KEY_LEN]);

    Ok(key)
}

// 初始化配置
pub fn init_config(password: &str, custom_dir: Option<&str>) -> Result<(), String> {
    let master_key = Zeroizing::new(generate_master_key());
    let config = encrypt_master_key(password, &*master_key, custom_dir)?;

    let config_path = get_config_path(custom_dir);
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, json).map_err(|e| e.to_string())?;

    // 存入系统凭据管理器
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())?;
    entry.set_password(password).map_err(|e| e.to_string())?;

    Ok(())
}

// 加载主密钥（从配置文件 + 系统凭据中自动获取密码）
pub fn load_master_key(
    custom_dir: Option<&str>,
) -> Result<Zeroizing<[u8; MASTER_KEY_LEN]>, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())?;
    let password = entry
        .get_password()
        .map_err(|e| format!("无法从凭据管理器获取密码: {:?}", e))?;
    decrypt_master_key(&password, custom_dir).map(Zeroizing::new)
}

// 清除系统凭据中的密码
pub fn clear_saved_password() -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())?;
    entry.set_password("").map_err(|e| e.to_string())
}

// 加密文件
pub fn encrypt_file(
    master_key: &[u8; MASTER_KEY_LEN],
    input_path: &str,
    output_path: &str,
) -> Result<(), String> {
    let plaintext = fs::read(input_path).map_err(|e| e.to_string())?;
    let ciphertext = encrypt_data(master_key, &plaintext)?;
    fs::write(output_path, ciphertext).map_err(|e| e.to_string())?;
    Ok(())
}

// 解密文件
pub fn decrypt_file(
    master_key: &[u8; MASTER_KEY_LEN],
    input_path: &str,
    output_path: &str,
) -> Result<(), String> {
    let ciphertext = fs::read(input_path).map_err(|e| e.to_string())?;
    let plaintext = decrypt_data(master_key, &ciphertext)?;
    fs::write(output_path, plaintext).map_err(|e| e.to_string())?;
    Ok(())
}

// 辅助函数：加密数据
pub fn encrypt_data(master_key: &[u8; MASTER_KEY_LEN], plaintext: &[u8]) -> Result<Vec<u8>, String> {
    let mut rng = rand::thread_rng();
    let mut nonce = [0u8; 12];
    rng.fill(&mut nonce);

    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(master_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| e.to_string())?;

    let mut output = Vec::with_capacity(nonce.len() + ciphertext.len());
    output.extend_from_slice(nonce);
    output.extend_from_slice(&ciphertext);

    Ok(output)
}

pub fn decrypt_data(master_key: &[u8; MASTER_KEY_LEN], ciphertext: &[u8]) -> Result<Vec<u8>, String> {
    if ciphertext.len() < 12 {
        return Err("无效的加密数据".into());
    }

    let (nonce, encrypted_data) = ciphertext.split_at(12);
    let nonce = Nonce::from_slice(nonce);

    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(master_key);
    let cipher = Aes256Gcm::new(key);

    cipher
        .decrypt(nonce, encrypted_data)
        .map_err(|e| format!("解密失败: {:?}", e))
}
