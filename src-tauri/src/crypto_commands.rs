use crate::encryption;
use crate::error::AppResult;

#[tauri::command]
pub fn init_config_command(password: String, custom_dir: Option<String>) -> AppResult<()> {
    Ok(encryption::init_config(&password, custom_dir.as_deref())?)
}

#[tauri::command]
pub fn load_master_key_command(custom_dir: Option<String>) -> AppResult<[u8; 32]> {
    let key = encryption::load_master_key(custom_dir.as_deref())?;
    Ok(*key)
}

#[tauri::command]
pub fn encrypt_file_command(
    master_key: [u8; 32],
    input_path: String,
    output_path: String,
) -> AppResult<()> {
    Ok(encryption::encrypt_file(&master_key, &input_path, &output_path)?)
}

#[tauri::command]
pub fn decrypt_file_command(
    master_key: [u8; 32],
    input_path: String,
    output_path: String,
) -> AppResult<()> {
    Ok(encryption::decrypt_file(&master_key, &input_path, &output_path)?)
}

#[tauri::command]
pub fn clear_saved_password_command() -> AppResult<()> {
    Ok(encryption::clear_saved_password()?)
}
