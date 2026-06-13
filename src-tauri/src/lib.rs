mod cli_handlers;
mod common;
mod error;
mod get_file_path;
mod gpu_settings;
mod save_commands;
mod system_commands;
mod new_save;
mod player_data;
mod save_editor;
mod save_shared;
mod save_utils;
mod theme_commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Get GPU acceleration settings
    let browser_args = gpu_settings::get_browser_args();
    let args_string = browser_args.join(" ");
    println!("Applying GPU acceleration settings: {}", args_string);

    // Build Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            save_commands::load_all_saves,
            save_commands::delete_file,
            save_commands::handle_file,
            save_commands::get_player_data,
            save_commands::unlock_all_hub_doors,
            save_commands::handle_edit_save,
            system_commands::get_local_appdata,
            save_commands::ensure_dir_exists,
            save_commands::handle_new_save,
            save_commands::open_save_games_folder,
            gpu_settings::get_gpu_acceleration_status,
            gpu_settings::set_gpu_acceleration,
            system_commands::restart_app,
            save_commands::convert_sav_to_json,
            save_commands::convert_json_to_sav,
            system_commands::set_window_title,
            theme_commands::get_theme_config,
            theme_commands::set_active_theme
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
