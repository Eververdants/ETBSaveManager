mod cli_handlers;
mod common;
mod error;
mod encryption;
mod feedback_commands;
mod feedback_queue;
mod get_file_path;
mod gpu_settings;
mod crypto_commands;
mod save_commands;
mod system_commands;
mod new_save;
mod player_data;
mod save_editor;
mod save_utils;
mod steam_api;
mod system_info;
mod theme_commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 获取GPU加速设置
    let browser_args = gpu_settings::get_browser_args();
    let args_string = browser_args.join(" ");
    println!("应用GPU加速设置: {}", args_string);

    // 初始化反馈系统状态
    let feedback_state = feedback_commands::FeedbackState::new();
    let backend_log_state = feedback_commands::BackendLogState::new();

    // 构建Tauri应用
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .manage(feedback_state)
        .manage(backend_log_state)
        .setup(|app| {
            // 初始化反馈队列数据库
            let app_data_dir = app.path().app_data_dir();
            println!("App data dir result: {:?}", app_data_dir);

            match app_data_dir {
                Ok(dir) => {
                    println!("Initializing feedback queue in: {:?}", dir);
                    // 确保目录存在
                    if !dir.exists() {
                        if let Err(e) = std::fs::create_dir_all(&dir) {
                            println!("Warning: Failed to create app data dir: {}", e);
                        }
                    }

                    let state = app.state::<feedback_commands::FeedbackState>();
                    if let Err(e) = state.init(&dir) {
                        println!("Warning: Failed to initialize feedback queue: {}", e);
                    } else {
                        println!("Feedback queue initialized successfully");
                    }
                }
                Err(e) => {
                    println!("Warning: Could not get app data dir: {}", e);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_commands::load_all_saves,
            save_commands::delete_file,
            save_commands::handle_file,
            crypto_commands::init_config_command,
            crypto_commands::load_master_key_command,
            crypto_commands::encrypt_file_command,
            crypto_commands::decrypt_file_command,
            crypto_commands::clear_saved_password_command,
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
            steam_api::encrypt_steam_api_key,
            steam_api::decrypt_steam_api_key,
            steam_api::save_steam_api_key,
            steam_api::test_steam_api_key,
            steam_api::clear_steam_cache,
            steam_api::get_steam_cache_count,
            steam_api::get_all_steam_cache_entries,
            steam_api::cleanup_expired_steam_cache,
            steam_api::get_steam_usernames_command,
            system_commands::set_window_title,
            feedback_commands::submit_feedback,
            feedback_commands::send_feedback,
            feedback_commands::get_feedback_history,
            feedback_commands::retry_feedback,
            feedback_commands::delete_feedback,
            feedback_commands::get_system_info,
            feedback_commands::get_backend_logs,
            feedback_commands::add_backend_log,
            theme_commands::save_custom_theme,
            theme_commands::load_custom_themes,
            theme_commands::delete_custom_theme,
            theme_commands::get_theme_config,
            theme_commands::set_active_theme,
            theme_commands::export_theme_to_file,
            theme_commands::import_theme_from_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
