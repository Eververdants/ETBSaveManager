//! File path module - Save file scanning
//! Optimized version: Reduce regex overhead, use fast path checking

use crate::common::get_save_games_dir;
use crate::error::AppResult;
use rayon::prelude::*;
use std::ffi::OsStr;
use std::path::PathBuf;
use walkdir::WalkDir;

#[inline]
fn starts_with_ascii_case_insensitive(s: &str, prefix: &str) -> bool {
    s.get(..prefix.len())
        .is_some_and(|head| head.eq_ignore_ascii_case(prefix))
}

#[inline]
fn ends_with_ascii_case_insensitive(s: &str, suffix: &str) -> bool {
    if s.len() < suffix.len() {
        return false;
    }
    let start = s.len() - suffix.len();
    s.get(start..)
        .is_some_and(|tail| tail.eq_ignore_ascii_case(suffix))
}

#[inline]
fn strip_suffix_ascii_case_insensitive<'a>(s: &'a str, suffix: &str) -> Option<&'a str> {
    if !ends_with_ascii_case_insensitive(s, suffix) {
        return None;
    }
    let end = s.len() - suffix.len();
    s.get(..end)
}

/// Quick check if filename could be a save file (avoids regex overhead)
#[inline]
fn is_potential_save_file(name: &str) -> bool {
    (starts_with_ascii_case_insensitive(name, "MULTIPLAYER_")
        || starts_with_ascii_case_insensitive(name, "SINGLEPLAYER_"))
        && ends_with_ascii_case_insensitive(name, ".sav")
}

/// Validate save filename format (simplified version, no regex)
#[inline]
fn validate_save_filename(name: &str) -> bool {
    // Check extension
    let without_ext = match strip_suffix_ascii_case_insensitive(name, ".sav") {
        Some(s) => s,
        None => return false,
    };

    // Check difficulty suffix
    let valid_difficulties = ["_easy", "_normal", "_hard", "_nightmare"];
    let has_valid_difficulty = valid_difficulties
        .iter()
        .any(|d| ends_with_ascii_case_insensitive(without_ext, d))
        || without_ext
            .chars()
            .last()
            .map_or(false, |c| c.is_ascii_digit());

    if !has_valid_difficulty {
        return false;
    }

    // Check prefix
    starts_with_ascii_case_insensitive(without_ext, "multiplayer_")
        || starts_with_ascii_case_insensitive(without_ext, "singleplayer_")
}

/// List all save file paths (optimized version)
pub fn list_save_paths() -> AppResult<Vec<PathBuf>> {
    let base_dir = get_save_games_dir()?;

    if !base_dir.exists() {
        return Err("Save directory not found".to_string().into());
    }

    // Pre-allocate capacity (assuming average 50 saves)
    let mut entries = Vec::with_capacity(100);

    // Single-threaded collection (WalkDir itself doesn't support parallel)
    for entry in WalkDir::new(&base_dir)
        .max_depth(2)
        .into_iter()
        .filter_map(Result::ok)
    {
        let path = entry.into_path();
        if path.is_file() {
            if let Some(name) = path.file_name().and_then(OsStr::to_str) {
                // Fast path check
                if is_potential_save_file(name) {
                    entries.push(path);
                }
            }
        }
    }

    // Parallel validation of filename format
    let saves: Vec<PathBuf> = entries
        .into_par_iter()
        .filter(|path| {
            path.file_name()
                .and_then(OsStr::to_str)
                .map_or(false, validate_save_filename)
        })
        .collect();

    Ok(saves)
}
