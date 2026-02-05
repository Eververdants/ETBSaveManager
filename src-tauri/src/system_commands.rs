use std::env;
use crate::error::AppResult;
use tauri::Window;

#[tauri::command]
pub fn get_local_appdata() -> AppResult<String> {
    Ok(env::var("LOCALAPPDATA")?)
}

#[tauri::command]
pub fn restart_app(app: tauri::AppHandle) {
    app.restart();
}

#[tauri::command]
pub fn set_window_title(title: String, window: Window) {
    window
        .set_title(&title)
        .expect("Failed to set window title");
}
