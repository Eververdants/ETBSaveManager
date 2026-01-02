// Theme Commands Module
// Handles custom theme file operations for the theme system

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Maximum number of custom themes allowed
const MAX_CUSTOM_THEMES: usize = 10;

/// Maximum import file size in bytes (10KB)
const MAX_IMPORT_SIZE: u64 = 10 * 1024;

/// Current export format version
const CURRENT_EXPORT_VERSION: u32 = 1;

/// Theme colors structure containing all CSS variable values
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeColors {
    // Background layers
    pub bg: String,
    pub bg_primary: String,
    pub bg_secondary: String,
    pub bg_tertiary: String,
    pub bg_elevated: String,

    // Text layers
    pub text: String,
    pub text_primary: String,
    pub text_secondary: String,
    pub text_tertiary: String,

    // Primary colors
    pub primary: String,
    pub primary_hover: String,
    pub accent_color: String,
    pub accent_hover: String,

    // Border/divider
    pub border_color: String,
    pub divider_color: String,

    // Sidebar
    pub sidebar_bg: String,
    pub sidebar_text_color: String,
    pub sidebar_hover_bg: String,
    pub sidebar_active_bg: String,
    pub sidebar_active_color: String,

    // Card
    pub card_bg: String,
    pub card_shadow: String,
    pub card_border: String,

    // Scrollbar
    pub scrollbar_track: String,
    pub scrollbar_thumb: String,
    pub scrollbar_thumb_hover: String,
}

impl Default for ThemeColors {
    fn default() -> Self {
        Self {
            bg: "#ffffff".to_string(),
            bg_primary: "#f8f9fa".to_string(),
            bg_secondary: "#f1f3f4".to_string(),
            bg_tertiary: "#e8eaed".to_string(),
            bg_elevated: "#ffffff".to_string(),
            text: "#202124".to_string(),
            text_primary: "#202124".to_string(),
            text_secondary: "#5f6368".to_string(),
            text_tertiary: "#80868b".to_string(),
            primary: "#1a73e8".to_string(),
            primary_hover: "#1557b0".to_string(),
            accent_color: "#1a73e8".to_string(),
            accent_hover: "#1557b0".to_string(),
            border_color: "#dadce0".to_string(),
            divider_color: "#e8eaed".to_string(),
            sidebar_bg: "#f8f9fa".to_string(),
            sidebar_text_color: "#202124".to_string(),
            sidebar_hover_bg: "#e8eaed".to_string(),
            sidebar_active_bg: "#e8f0fe".to_string(),
            sidebar_active_color: "#1a73e8".to_string(),
            card_bg: "#ffffff".to_string(),
            card_shadow: "rgba(0, 0, 0, 0.1)".to_string(),
            card_border: "#dadce0".to_string(),
            scrollbar_track: "#f1f3f4".to_string(),
            scrollbar_thumb: "#dadce0".to_string(),
            scrollbar_thumb_hover: "#bdc1c6".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomTheme {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub theme_type: String,
    pub colors: ThemeColors,
    pub version: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ThemeConfig {
    pub version: u32,
    pub active_theme_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeExportData {
    pub export_version: u32,
    pub exported_at: u64,
    pub theme: CustomTheme,
}

// ============================================================================
// Security Validation Functions
// ============================================================================

fn validate_theme_id(theme_id: &str) -> Result<(), String> {
    if theme_id.is_empty() || theme_id.len() > 64 {
        return Err("Theme ID must be 1-64 characters".to_string());
    }
    if !theme_id
        .chars()
        .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Theme ID contains invalid characters".to_string());
    }
    Ok(())
}

fn validate_path_security(path: &PathBuf, allowed_base: &PathBuf) -> Result<(), String> {
    let path_str = path.to_string_lossy();
    if path_str.contains("..") {
        return Err("Path traversal attack detected".to_string());
    }
    if path.exists() {
        let canonical_path = path
            .canonicalize()
            .map_err(|e| format!("Invalid path: {}", e))?;
        let canonical_base = allowed_base
            .canonicalize()
            .map_err(|e| format!("Invalid base path: {}", e))?;
        if !canonical_path.starts_with(&canonical_base) {
            return Err("Path traversal attack detected".to_string());
        }
    }
    Ok(())
}

fn validate_color(color: &str) -> Result<(), String> {
    let color = color.trim();

    // Hex format
    if color.starts_with('#') {
        let hex = &color[1..];
        if (hex.len() == 3 || hex.len() == 6 || hex.len() == 8)
            && hex.chars().all(|c| c.is_ascii_hexdigit())
        {
            return Ok(());
        }
        return Err(format!("Invalid hex color format: {}", color));
    }

    // RGB format
    if color.starts_with("rgb(") && color.ends_with(')') {
        let inner = &color[4..color.len() - 1];
        let parts: Vec<&str> = inner.split(',').collect();
        if parts.len() == 3 && parts.iter().all(|p| p.trim().parse::<u8>().is_ok()) {
            return Ok(());
        }
        return Err(format!("Invalid RGB format: {}", color));
    }

    // RGBA format
    if color.starts_with("rgba(") && color.ends_with(')') {
        let inner = &color[5..color.len() - 1];
        let parts: Vec<&str> = inner.split(',').collect();
        if parts.len() == 4 {
            let rgb_ok = parts[..3].iter().all(|p| p.trim().parse::<u8>().is_ok());
            let alpha_ok = parts[3]
                .trim()
                .parse::<f32>()
                .map(|v| (0.0..=1.0).contains(&v))
                .unwrap_or(false);
            if rgb_ok && alpha_ok {
                return Ok(());
            }
        }
        return Err(format!("Invalid RGBA format: {}", color));
    }

    Err(format!("Unsupported color format: {}", color))
}

fn validate_theme_colors(colors: &ThemeColors) -> Result<(), String> {
    let fields = [
        ("bg", &colors.bg),
        ("bgPrimary", &colors.bg_primary),
        ("bgSecondary", &colors.bg_secondary),
        ("bgTertiary", &colors.bg_tertiary),
        ("bgElevated", &colors.bg_elevated),
        ("text", &colors.text),
        ("textPrimary", &colors.text_primary),
        ("textSecondary", &colors.text_secondary),
        ("textTertiary", &colors.text_tertiary),
        ("primary", &colors.primary),
        ("primaryHover", &colors.primary_hover),
        ("accentColor", &colors.accent_color),
        ("accentHover", &colors.accent_hover),
        ("borderColor", &colors.border_color),
        ("dividerColor", &colors.divider_color),
        ("sidebarBg", &colors.sidebar_bg),
        ("sidebarTextColor", &colors.sidebar_text_color),
        ("sidebarHoverBg", &colors.sidebar_hover_bg),
        ("sidebarActiveBg", &colors.sidebar_active_bg),
        ("sidebarActiveColor", &colors.sidebar_active_color),
        ("cardBg", &colors.card_bg),
        ("cardShadow", &colors.card_shadow),
        ("cardBorder", &colors.card_border),
        ("scrollbarTrack", &colors.scrollbar_track),
        ("scrollbarThumb", &colors.scrollbar_thumb),
        ("scrollbarThumbHover", &colors.scrollbar_thumb_hover),
    ];
    for (name, value) in fields {
        validate_color(value).map_err(|e| format!("Invalid color for '{}': {}", name, e))?;
    }
    Ok(())
}

fn validate_import_security(data: &serde_json::Value) -> Result<(), String> {
    fn check_object(obj: &serde_json::Value, path: &str) -> Result<(), String> {
        if let Some(map) = obj.as_object() {
            for (key, value) in map {
                if key == "__proto__" || key == "constructor" || key == "prototype" {
                    return Err(format!(
                        "Security violation: dangerous key '{}' at {}",
                        key, path
                    ));
                }
                let new_path = if path.is_empty() {
                    key.clone()
                } else {
                    format!("{}.{}", path, key)
                };
                check_object(value, &new_path)?;
            }
        }
        Ok(())
    }
    check_object(data, "")
}

// ============================================================================
// Helper Functions
// ============================================================================

fn get_themes_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let themes_dir = app_data_dir.join("themes");
    if !themes_dir.exists() {
        fs::create_dir_all(&themes_dir)
            .map_err(|e| format!("Failed to create themes directory: {}", e))?;
    }
    Ok(themes_dir)
}

fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }
    Ok(app_data_dir.join("theme-config.json"))
}

fn get_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

// ============================================================================
// Tauri Commands - CRUD Operations
// ============================================================================

#[tauri::command]
pub async fn save_custom_theme(app: AppHandle, theme: CustomTheme) -> Result<(), String> {
    validate_theme_id(&theme.id)?;
    if theme.name.trim().is_empty() {
        return Err("Theme name cannot be empty".to_string());
    }
    validate_theme_colors(&theme.colors)?;

    let themes_dir = get_themes_dir(&app)?;
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let theme_path = themes_dir.join(format!("{}.json", theme.id));

    if !theme_path.exists() {
        let existing = load_custom_themes(app.clone()).await?;
        if existing.len() >= MAX_CUSTOM_THEMES {
            return Err(format!(
                "Maximum {} custom themes reached. Delete one first.",
                MAX_CUSTOM_THEMES
            ));
        }
    }

    validate_path_security(&theme_path, &app_data_dir)?;

    let mut theme_to_save = theme;
    let now = get_timestamp();
    if theme_to_save.created_at.is_none() {
        theme_to_save.created_at = Some(now);
    }
    theme_to_save.updated_at = Some(now);
    theme_to_save.theme_type = "custom".to_string();

    let json = serde_json::to_string_pretty(&theme_to_save)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&theme_path, json).map_err(|e| format!("Failed to save: {}", e))?;
    println!("Theme saved: {}", theme_to_save.name);
    Ok(())
}

#[tauri::command]
pub async fn load_custom_themes(app: AppHandle) -> Result<Vec<CustomTheme>, String> {
    let themes_dir = get_themes_dir(&app)?;
    let mut themes = Vec::new();
    let entries =
        fs::read_dir(&themes_dir).map_err(|e| format!("Failed to read themes dir: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map_or(false, |ext| ext == "json") {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(theme) = serde_json::from_str::<CustomTheme>(&content) {
                    themes.push(theme);
                }
            }
        }
    }
    themes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(themes)
}

#[tauri::command]
pub async fn delete_custom_theme(app: AppHandle, theme_id: String) -> Result<bool, String> {
    validate_theme_id(&theme_id)?;
    let themes_dir = get_themes_dir(&app)?;
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let theme_path = themes_dir.join(format!("{}.json", theme_id));
    validate_path_security(&theme_path, &app_data_dir)?;

    if !theme_path.exists() {
        return Ok(false);
    }
    fs::remove_file(&theme_path).map_err(|e| format!("Failed to delete: {}", e))?;

    let config = get_theme_config(app.clone()).await?;
    if config.active_theme_id.as_deref() == Some(&theme_id) {
        set_active_theme(app, "light".to_string()).await?;
    }
    println!("Theme deleted: {}", theme_id);
    Ok(true)
}

#[tauri::command]
pub async fn get_theme_config(app: AppHandle) -> Result<ThemeConfig, String> {
    let config_path = get_config_path(&app)?;
    if !config_path.exists() {
        return Ok(ThemeConfig::default());
    }
    let content =
        fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;
    serde_json::from_str(&content).map_err(|_| "Config file corrupted".to_string())
}

#[tauri::command]
pub async fn set_active_theme(app: AppHandle, theme_id: String) -> Result<(), String> {
    let config_path = get_config_path(&app)?;
    let config = ThemeConfig {
        version: 1,
        active_theme_id: Some(theme_id.clone()),
    };
    let json =
        serde_json::to_string_pretty(&config).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&config_path, json).map_err(|e| format!("Failed to save config: {}", e))?;
    println!("Active theme: {}", theme_id);
    Ok(())
}

// ============================================================================
// Tauri Commands - Import/Export Operations
// ============================================================================

#[tauri::command]
pub async fn export_theme_to_file(
    app: AppHandle,
    theme_id: String,
    path: String,
) -> Result<(), String> {
    validate_theme_id(&theme_id)?;
    let themes_dir = get_themes_dir(&app)?;
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let theme_path = themes_dir.join(format!("{}.json", theme_id));
    validate_path_security(&theme_path, &app_data_dir)?;

    if !theme_path.exists() {
        return Err(format!("Theme not found: {}", theme_id));
    }

    let content = fs::read_to_string(&theme_path).map_err(|e| format!("Failed to read: {}", e))?;
    let theme: CustomTheme =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse: {}", e))?;

    let export_data = ThemeExportData {
        export_version: CURRENT_EXPORT_VERSION,
        exported_at: get_timestamp(),
        theme,
    };
    let export_json = serde_json::to_string_pretty(&export_data)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, export_json).map_err(|e| format!("Failed to write: {}", e))?;
    println!("Theme exported to: {}", path);
    Ok(())
}

#[tauri::command]
pub async fn import_theme_from_file(app: AppHandle, path: String) -> Result<CustomTheme, String> {
    let file_path = PathBuf::from(&path);
    if !file_path.exists() {
        return Err("Import file not found".to_string());
    }

    let metadata =
        fs::metadata(&file_path).map_err(|e| format!("Failed to read file info: {}", e))?;
    if metadata.len() > MAX_IMPORT_SIZE {
        return Err(format!("File too large. Max {}KB", MAX_IMPORT_SIZE / 1024));
    }

    let content = fs::read_to_string(&file_path).map_err(|e| format!("Failed to read: {}", e))?;
    let json_value: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Invalid JSON: {}", e))?;
    validate_import_security(&json_value)?;

    let mut export_data: ThemeExportData =
        serde_json::from_value(json_value).map_err(|e| format!("Invalid theme format: {}", e))?;

    if export_data.export_version < CURRENT_EXPORT_VERSION {
        export_data = migrate_theme_data(export_data);
    }

    validate_theme_id(&export_data.theme.id)?;
    if export_data.theme.name.trim().is_empty() {
        return Err("Imported theme has empty name".to_string());
    }
    validate_theme_colors(&export_data.theme.colors)?;

    let new_id = format!(
        "{}-imported-{}",
        export_data.theme.id,
        get_timestamp() % 10000
    );
    let mut imported = export_data.theme;
    imported.id = new_id;
    imported.created_at = Some(get_timestamp());
    imported.updated_at = Some(get_timestamp());

    save_custom_theme(app, imported.clone()).await?;
    println!("Theme imported: {}", imported.name);
    Ok(imported)
}

fn migrate_theme_data(mut data: ThemeExportData) -> ThemeExportData {
    let defaults = ThemeColors::default();
    let c = &mut data.theme.colors;

    if c.bg.is_empty() {
        c.bg = defaults.bg;
    }
    if c.bg_primary.is_empty() {
        c.bg_primary = defaults.bg_primary;
    }
    if c.bg_secondary.is_empty() {
        c.bg_secondary = defaults.bg_secondary;
    }
    if c.bg_tertiary.is_empty() {
        c.bg_tertiary = defaults.bg_tertiary;
    }
    if c.bg_elevated.is_empty() {
        c.bg_elevated = defaults.bg_elevated;
    }
    if c.text.is_empty() {
        c.text = defaults.text;
    }
    if c.text_primary.is_empty() {
        c.text_primary = defaults.text_primary;
    }
    if c.text_secondary.is_empty() {
        c.text_secondary = defaults.text_secondary;
    }
    if c.text_tertiary.is_empty() {
        c.text_tertiary = defaults.text_tertiary;
    }
    if c.primary.is_empty() {
        c.primary = defaults.primary;
    }
    if c.primary_hover.is_empty() {
        c.primary_hover = defaults.primary_hover;
    }
    if c.accent_color.is_empty() {
        c.accent_color = defaults.accent_color;
    }
    if c.accent_hover.is_empty() {
        c.accent_hover = defaults.accent_hover;
    }
    if c.border_color.is_empty() {
        c.border_color = defaults.border_color;
    }
    if c.divider_color.is_empty() {
        c.divider_color = defaults.divider_color;
    }
    if c.sidebar_bg.is_empty() {
        c.sidebar_bg = defaults.sidebar_bg;
    }
    if c.sidebar_text_color.is_empty() {
        c.sidebar_text_color = defaults.sidebar_text_color;
    }
    if c.sidebar_hover_bg.is_empty() {
        c.sidebar_hover_bg = defaults.sidebar_hover_bg;
    }
    if c.sidebar_active_bg.is_empty() {
        c.sidebar_active_bg = defaults.sidebar_active_bg;
    }
    if c.sidebar_active_color.is_empty() {
        c.sidebar_active_color = defaults.sidebar_active_color;
    }
    if c.card_bg.is_empty() {
        c.card_bg = defaults.card_bg;
    }
    if c.card_shadow.is_empty() {
        c.card_shadow = defaults.card_shadow;
    }
    if c.card_border.is_empty() {
        c.card_border = defaults.card_border;
    }
    if c.scrollbar_track.is_empty() {
        c.scrollbar_track = defaults.scrollbar_track;
    }
    if c.scrollbar_thumb.is_empty() {
        c.scrollbar_thumb = defaults.scrollbar_thumb;
    }
    if c.scrollbar_thumb_hover.is_empty() {
        c.scrollbar_thumb_hover = defaults.scrollbar_thumb_hover;
    }

    data.export_version = CURRENT_EXPORT_VERSION;
    data
}
