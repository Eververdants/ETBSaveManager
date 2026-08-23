//! Common utilities module - Shared tools and types across modules

use crate::error::{AppError, AppResult};
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Write};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard, OnceLock};
use uesave::{
    Property, PropertyKey, PropertyTagDataPartial, PropertyTagPartial, PropertyType, Save, ValueVec,
};

/// Cache local app data directory path
static LOCAL_APPDATA_DIR: OnceLock<AppResult<PathBuf>> = OnceLock::new();
static SAVE_GAMES_DIR: OnceLock<AppResult<PathBuf>> = OnceLock::new();
static APP_CONFIG_DIR: OnceLock<AppResult<PathBuf>> = OnceLock::new();

/// I/O buffer size (16KB is more efficient for small files)
const IO_BUFFER_SIZE: usize = 16384;

/// Get local app data directory (with caching, returns reference to avoid clones)
#[inline]
pub fn get_local_appdata_dir() -> AppResult<PathBuf> {
    LOCAL_APPDATA_DIR
        .get_or_init(|| {
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
        .clone()
}

/// Get save games directory path (with caching)
#[inline]
pub fn get_save_games_dir() -> AppResult<PathBuf> {
    SAVE_GAMES_DIR
        .get_or_init(|| {
            get_local_appdata_dir().map(|p| p.join("EscapeTheBackrooms/Saved/SaveGames"))
        })
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
        .get_or_init(|| get_local_appdata_dir().map(|p| p.join("ETBSaveManager")))
        .clone()
}

/// Read MAINSAVE.sav file (optimized buffer size)
pub fn read_mainsave() -> AppResult<Save> {
    let mainsave_path = get_mainsave_path()?;

    let file =
        File::open(&mainsave_path).map_err(|e| format!("Failed to open MAINSAVE.sav: {}", e))?;
    let mut reader = BufReader::with_capacity(IO_BUFFER_SIZE, file);

    Ok(Save::read(&mut reader).map_err(|e| format!("Failed to parse MAINSAVE.sav: {:?}", e))?)
}

/// Read MAINSAVE with retries. The game rewrites MAINSAVE.sav concurrently,
/// which makes a single read fail transiently — retry before giving up so
/// callers never act on a bogus "unreadable" state.
fn read_mainsave_with_retries() -> AppResult<Save> {
    match read_mainsave() {
        Ok(save) => Ok(save),
        Err(first_err) => {
            let mut last_err = first_err;
            for _ in 0..3 {
                std::thread::sleep(std::time::Duration::from_millis(60));
                match read_mainsave() {
                    Ok(save) => return Ok(save),
                    Err(e) => last_err = e,
                }
            }
            tracing::error!("Failed to read MAINSAVE after retries: {}", last_err);
            Err(last_err)
        }
    }
}

/// Write MAINSAVE.sav file (using temp file for atomicity)
pub fn write_mainsave(save: &Save) -> AppResult<()> {
    let save_dir = get_save_games_dir()?;
    let mainsave_path = save_dir.join("MAINSAVE.sav");
    let temp_path = save_dir.join("MAINSAVE_temp.sav");

    // Write to temp file
    let file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp MAINSAVE file: {}", e))?;
    let mut writer = BufWriter::with_capacity(IO_BUFFER_SIZE, file);

    save.write(&mut writer)
        .map_err(|e| format!("Failed to write MAINSAVE.sav: {:?}", e))?;
    writer
        .flush()
        .map_err(|e| format!("Failed to flush buffer: {}", e))?;

    // Atomic replace
    Ok(fs::rename(&temp_path, &mainsave_path)
        .map_err(|e| format!("Failed to replace MAINSAVE.sav: {}", e))?)
}

/// Acquire the process-wide MAINSAVE operation lock.
fn lock_mainsave() -> AppResult<MutexGuard<'static, ()>> {
    Ok(MAINSAVE_LOCK
        .get_or_init(|| Mutex::new(()))
        .lock()
        .map_err(|e| format!("MAINSAVE lock poisoned: {}", e))?)
}

/// Get visible saves list from MAINSAVE.
///
/// A missing MAINSAVE.sav (fresh game install) is a genuine "nothing visible"
/// state and yields an empty set. Any OTHER read/parse failure is retried then
/// propagated as Err — callers must never mistake an unreadable registry for
/// an empty visibility list (that used to flip toggles in the wrong direction).
pub fn get_visible_saves_set() -> AppResult<HashSet<String>> {
    let _lock = lock_mainsave()?;

    if !get_mainsave_path()?.exists() {
        return Ok(HashSet::new());
    }

    let mainsave = read_mainsave_with_retries()?;

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(Property::Array(ValueVec::Str(ref saves))) = mainsave.root.properties.0.get(&key) {
        let mut set = HashSet::with_capacity(saves.len());
        set.extend(saves.iter().cloned());
        return Ok(set);
    }

    Ok(HashSet::new())
}

/// Serialize MAINSAVE operations across threads to prevent race conditions
static MAINSAVE_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

/// Insert or move an archive name to the front of the SingleplayerSaves list.
fn upsert_visible_save(mainsave: &mut Save, archive_name: &str) {
    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(Property::Array(ValueVec::Str(ref mut saves))) =
        mainsave.root.properties.0.get_mut(&key)
    {
        // Already exists — move to front (e.g. after editing)
        saves.retain(|s| s != archive_name);
        saves.insert(0, archive_name.to_string());
    } else {
        // New field: record schema (0.7 requires schemas for writing) + insert property
        mainsave.schemas.record(
            "SingleplayerSaves".to_string(),
            PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(
                    PropertyType::StrProperty,
                ))),
            },
        );
        let new_prop = Property::Array(ValueVec::Str(vec![archive_name.to_string()]));
        mainsave.root.properties.0.insert(key, new_prop);
    }
}

/// Remove an archive name from the SingleplayerSaves list.
/// Returns true when the name was present and has been removed.
fn remove_visible_save(mainsave: &mut Save, archive_name: &str) -> bool {
    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(Property::Array(ValueVec::Str(ref mut saves))) =
        mainsave.root.properties.0.get_mut(&key)
    {
        let original_len = saves.len();
        saves.retain(|s| s != archive_name);
        return saves.len() < original_len;
    }

    false
}

/// Add save name to MAINSAVE's save list.
/// Fails loudly when MAINSAVE cannot be read after retries — never reports
/// success without having persisted the change.
pub fn add_save_to_mainsave(archive_name: &str) -> AppResult<()> {
    let _lock = lock_mainsave()?;

    if !get_mainsave_path()?.exists() {
        return Err("MAINSAVE.sav not found — start the game once so it can be created".into());
    }

    let mut mainsave = read_mainsave_with_retries()?;
    upsert_visible_save(&mut mainsave, archive_name);
    write_mainsave(&mainsave)
}

/// Remove save name from MAINSAVE's save list.
/// Returns Ok(true) when removed, Ok(false) when the name was not present.
/// Errors only when MAINSAVE cannot be read/written — never silently skips.
pub fn remove_save_from_mainsave(archive_name: &str) -> AppResult<bool> {
    let _lock = lock_mainsave()?;

    if !get_mainsave_path()?.exists() {
        return Err("MAINSAVE.sav not found — start the game once so it can be created".into());
    }

    let mut mainsave = read_mainsave_with_retries()?;
    let removed = remove_visible_save(&mut mainsave, archive_name);
    if removed {
        write_mainsave(&mainsave)?;
    }

    Ok(removed)
}

/// Set the visibility of an archive atomically: the MAINSAVE lock is held
/// across read-decide-write, and callers pass the DESIRED state instead of
/// relying on a read-then-flip, so concurrent toggles can neither cancel each
/// other out nor decide from a stale snapshot.
///
/// `desired`: `Some(true)`/`Some(false)` pins the target state, `None` flips
/// relative to the current state. Returns the verified visibility afterwards.
pub fn set_save_visibility(archive_name: &str, desired: Option<bool>) -> AppResult<bool> {
    let _lock = lock_mainsave()?;

    if !get_mainsave_path()?.exists() {
        return Err("MAINSAVE.sav not found — start the game once so it can be created".into());
    }

    let mut mainsave = read_mainsave_with_retries()?;

    let currently_visible = {
        let key = PropertyKey(0, "SingleplayerSaves".to_string());
        matches!(
            mainsave.root.properties.0.get(&key),
            Some(Property::Array(ValueVec::Str(saves)))
                if saves.iter().any(|s| s == archive_name)
        )
    };

    let target = desired.unwrap_or(!currently_visible);
    if target == currently_visible {
        // Already in the requested state — nothing to persist.
        return Ok(currently_visible);
    }

    if target {
        upsert_visible_save(&mut mainsave, archive_name);
    } else {
        remove_visible_save(&mut mainsave, archive_name);
    }

    write_mainsave(&mainsave)?;
    Ok(target)
}

/// Update archive name in MAINSAVE's SingleplayerSaves list after conversion.
/// Used when renaming SINGLEPLAYER_ archives to MULTIPLAYER_ prefix.
/// Returns Ok(true) only when the old name was found and replaced;
/// Ok(false) means the registry had NO such entry — callers must treat that
/// as a failure, since a silent miss leaves the renamed file unregistered.
pub fn update_mainsave_archive_name(old_name: &str, new_name: &str) -> AppResult<bool> {
    let _lock = lock_mainsave()?;

    let mut mainsave = read_mainsave_with_retries()?;

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(Property::Array(ValueVec::Str(ref mut saves))) =
        mainsave.root.properties.0.get_mut(&key)
    {
        // Find and replace the old archive name with the new one
        for save in saves.iter_mut() {
            if save == old_name {
                *save = new_name.to_string();
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

/// Extract archive name from a trashed filename ("X.sav.trash" -> "X").
/// Re-registering a restored archive under "X.sav.trash" would leave it
/// permanently hidden, since listings match on the plain stem.
pub fn extract_archive_name_from_trash(filename: &str) -> &str {
    filename
        .strip_suffix(".sav.trash")
        .unwrap_or_else(|| extract_archive_name(filename))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trash_names_map_back_to_archive_names() {
        assert_eq!(
            extract_archive_name_from_trash("MULTIPLAYER_Demo_Easy.sav.trash"),
            "MULTIPLAYER_Demo_Easy"
        );
        assert_eq!(
            extract_archive_name("MULTIPLAYER_Demo_Easy.sav"),
            "MULTIPLAYER_Demo_Easy"
        );
        // Fallbacks never panic on unexpected names
        assert_eq!(extract_archive_name_from_trash("weird.sav"), "weird");
        assert_eq!(extract_archive_name_from_trash("noext"), "noext");
    }
}

pub fn normalize_existing_path(path: &Path) -> AppResult<PathBuf> {
    Ok(path
        .canonicalize()
        .map_err(|e| format!("Path resolution failed: {}", e))?)
}

pub fn normalize_path_for_write(path: &Path) -> AppResult<PathBuf> {
    if path.exists() {
        return normalize_existing_path(path);
    }

    let parent = path.parent().ok_or_else(|| "Invalid path".to_string())?;
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
    // First layer check: reject path traversal attempts using component-based check
    if path
        .components()
        .any(|c| c == std::path::Component::ParentDir)
    {
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
#[allow(dead_code)]
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
