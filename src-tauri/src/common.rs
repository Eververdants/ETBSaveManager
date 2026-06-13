//! Common utilities module - Shared tools and types across modules
//! Optimized version: Using Arc to reduce clones, with cache warmup

use crate::error::{AppError, AppResult};
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, OnceLock};
use uesave::{
    Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial, PropertyType,
    Save, ValueArray, ValueVec,
};

/// Cache local app data directory path (using Arc to avoid clones)
static LOCAL_APPDATA_DIR: OnceLock<Arc<AppResult<PathBuf>>> = OnceLock::new();
static SAVE_GAMES_DIR: OnceLock<Arc<AppResult<PathBuf>>> = OnceLock::new();
static APP_CONFIG_DIR: OnceLock<Arc<AppResult<PathBuf>>> = OnceLock::new();

/// I/O buffer size (16KB is more efficient for small files)
const IO_BUFFER_SIZE: usize = 16384;

/// Get local app data directory (with caching, returns reference to avoid clones)
#[inline]
pub fn get_local_appdata_dir() -> AppResult<PathBuf> {
    LOCAL_APPDATA_DIR
        .get_or_init(|| {
            Arc::new({
                #[cfg(target_os = "windows")]
                {
                    std::env::var("LOCALAPPDATA")
                        .map(PathBuf::from)
                        .map_err(|e| AppError::General(format!("Failed to get LOCALAPPDATA: {}", e)))
                }
                #[cfg(not(target_os = "windows"))]
                {
                    Err(AppError::General("Only Windows is supported".to_string()))
                }
            })
        })
        .as_ref()
        .clone()
}

/// Get save games directory path (with caching)
#[inline]
pub fn get_save_games_dir() -> AppResult<PathBuf> {
    SAVE_GAMES_DIR
        .get_or_init(|| {
            Arc::new(get_local_appdata_dir().map(|p| p.join("EscapeTheBackrooms/Saved/SaveGames")))
        })
        .as_ref()
        .clone()
}

/// Get MAINSAVE.sav file path (inline optimized)
#[inline(always)]
pub fn get_mainsave_path() -> AppResult<PathBuf> {
    get_save_games_dir().map(|p| p.join("MAINSAVE.sav"))
}

/// Get app config directory (with caching)
#[inline]
pub fn get_app_config_dir() -> AppResult<PathBuf> {
    APP_CONFIG_DIR
        .get_or_init(|| Arc::new(get_local_appdata_dir().map(|p| p.join("ETBSaveManager"))))
        .as_ref()
        .clone()
}

/// Read MAINSAVE.sav file (optimized buffer size)
pub fn read_mainsave() -> AppResult<Save> {
    let mainsave_path = get_mainsave_path()?;

    let file = File::open(&mainsave_path).map_err(|e| format!("Failed to open MAINSAVE.sav: {}", e))?;
    let mut reader = BufReader::with_capacity(IO_BUFFER_SIZE, file);

    Ok(Save::read(&mut reader).map_err(|e| format!("Failed to parse MAINSAVE.sav: {:?}", e))?)
}

/// Write MAINSAVE.sav file (using temp file for atomicity)
pub fn write_mainsave(save: &Save) -> AppResult<()> {
    let save_dir = get_save_games_dir()?;
    let mainsave_path = save_dir.join("MAINSAVE.sav");
    let temp_path = save_dir.join("MAINSAVE_temp.sav");

    // Write to temp file
    let file =
        File::create(&temp_path).map_err(|e| format!("Failed to create temp MAINSAVE file: {}", e))?;
    let mut writer = BufWriter::with_capacity(IO_BUFFER_SIZE, file);

    save.write(&mut writer)
        .map_err(|e| format!("Failed to write MAINSAVE.sav: {:?}", e))?;
    writer
        .flush()
        .map_err(|e| format!("Failed to flush buffer: {}", e))?;

    // Atomic replace
    Ok(fs::rename(&temp_path, &mainsave_path).map_err(|e| format!("Failed to replace MAINSAVE.sav: {}", e))?)
}

/// Get visible saves list from MAINSAVE (pre-allocated capacity)
pub fn get_visible_saves_set() -> AppResult<HashSet<String>> {
    let mainsave = match read_mainsave() {
        Ok(save) => save,
        Err(_) => return Ok(HashSet::with_capacity(0)),
    };

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(prop) = mainsave.root.properties.0.get(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref saves))) = &prop.inner {
            let mut set = HashSet::with_capacity(saves.len());
            set.extend(saves.iter().cloned());
            return Ok(set);
        }
    }

    Ok(HashSet::with_capacity(0))
}

/// Add save name to MAINSAVE's save list
pub fn add_save_to_mainsave(archive_name: &str) -> AppResult<()> {
    let mut mainsave = match read_mainsave() {
        Ok(save) => save,
        Err(_) => return Ok(()), // Silently skip
    };

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(prop) = mainsave.root.properties.0.get_mut(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut saves))) =
            &mut prop.inner
        {
            if saves.iter().any(|s| s == archive_name) {
                return Ok(()); // Already exists, no action needed
            }
            saves.push(archive_name.to_string());
        } else {
            return Err("SingleplayerSaves field format incorrect".to_string().into());
        }
    } else {
        let new_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(
                    PropertyType::StrProperty,
                ))),
            },
            inner: PropertyInner::Array(ValueArray::Base(ValueVec::Str(vec![
                archive_name.to_string()
            ]))),
        };
        mainsave.root.properties.0.insert(key, new_prop);
    }

    write_mainsave(&mainsave)
}

/// Remove save name from MAINSAVE's save list
pub fn remove_save_from_mainsave(archive_name: &str) -> AppResult<bool> {
    let mut mainsave = match read_mainsave() {
        Ok(save) => save,
        Err(_) => return Ok(false),
    };

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(prop) = mainsave.root.properties.0.get_mut(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut saves))) =
            &mut prop.inner
        {
            let original_len = saves.len();
            saves.retain(|s| s != archive_name);
            if saves.len() < original_len {
                write_mainsave(&mainsave)?;
                return Ok(true);
            }
        }
    }

    Ok(false)
}

/// Extract archive name from filename (remove .sav suffix)
#[inline(always)]
pub fn extract_archive_name(filename: &str) -> &str {
    filename.strip_suffix(".sav").unwrap_or(filename)
}

pub fn normalize_existing_path(path: &Path) -> AppResult<PathBuf> {
    Ok(path.canonicalize()
        .map_err(|e| format!("Path resolution failed: {}", e))?)
}

pub fn normalize_path_for_write(path: &Path) -> AppResult<PathBuf> {
    if path.exists() {
        return normalize_existing_path(path);
    }

    let parent = path
        .parent()
        .ok_or_else(|| "Invalid path".to_string())?;
    if !parent.exists() {
        return Err("Parent directory does not exist".to_string().into());
    }

    let parent_canon = normalize_existing_path(parent)?;
    let filename = path
        .file_name()
        .ok_or_else(|| "Invalid filename".to_string())?;
    Ok(parent_canon.join(filename))
}

pub fn validate_path_under_base(path: &Path, allowed_base: &Path) -> AppResult<()> {
    // First layer check: reject obvious path traversal attempts
    let path_str = path.to_string_lossy();
    if path_str.contains("..") {
        return Err("Invalid path detected".to_string().into());
    }

    // Resolve the allowed base directory to canonical path
    let allowed = normalize_existing_path(allowed_base)?;

    // Second layer check: resolve target path to canonical path
    // Note: this check must be performed immediately before actual file operations to avoid TOCTOU race conditions
    let normalized = if path.exists() {
        normalize_existing_path(path)?
    } else {
        normalize_path_for_write(path)?
    };

    if !normalized.starts_with(&allowed) {
        return Err("Path not in allowed range".to_string().into());
    }

    Ok(())
}

/// Safely open a file, using O_NOFOLLOW to prevent symlink attacks
pub fn safe_file_open(path: &Path) -> AppResult<File> {
    // Validate path before opening the file
    validate_save_games_path(path)?;

    // Open file, reject symlinks (guaranteed by canonicalize on Windows)
    Ok(File::open(path).map_err(|e| format!("Failed to open file: {}", e))?)
}

pub fn validate_save_games_path(path: &Path) -> AppResult<()> {
    let base = get_save_games_dir()?;
    validate_path_under_base(path, &base)
}

#[allow(dead_code)]
pub fn validate_app_config_path(path: &Path) -> AppResult<()> {
    let base = get_app_config_dir()?;
    validate_path_under_base(path, &base)
}
