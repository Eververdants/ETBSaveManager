//! Save loader module - Handles save file loading operations
//! Extracted from save_commands.rs for better modularity

use crate::cli_handlers;
use std::fs;

/// Result of a SINGLEPLAYER_ to MULTIPLAYER_ archive conversion.
///
/// Only the count is consumed today (load_save_metadata logs it), but the
/// struct is kept public with its fields for diagnostics and future callers;
/// silence the dead-code lint explicitly rather than deleting context.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ConversionResult {
    /// Original filename (e.g., "SINGLEPLAYER_ArchiveName_Normal.sav")
    pub original: String,
    /// Converted filename (e.g., "MULTIPLAYER_ArchiveName_Normal.sav")
    pub converted: String,
    /// Whether the conversion was successful
    pub success: bool,
}

/// Convert SINGLEPLAYER_ prefixed filename to MULTIPLAYER_ prefix.
/// Preserves the archive name and difficulty suffix.
///
/// # Examples
///
/// ```text
/// convert_filename("SINGLEPLAYER_ArchiveName_Normal.sav")
/// // Returns: Some("MULTIPLAYER_ArchiveName_Normal.sav")
/// ```
fn convert_filename(original: &str) -> Option<String> {
    if original.starts_with("SINGLEPLAYER_") {
        Some(original.replace("SINGLEPLAYER_", "MULTIPLAYER_"))
    } else {
        None
    }
}

/// Scan SaveGames directory and convert any SINGLEPLAYER_ prefixed files
/// to MULTIPLAYER_ prefix. Returns the list of conversion results.
///
/// This function is called at the start of `load_save_metadata` to ensure
/// all archives are unified under the MULTIPLAYER_ prefix.
///
/// # Arguments
/// * `save_dir` - Path to the SaveGames directory
///
/// # Returns
/// A vector of `ConversionResult` indicating the outcome of each conversion attempt.
///
/// # Error Handling
/// - Individual file conversion errors are logged but do NOT block processing of other files
/// - The function continues processing even if some conversions fail
///
/// # Requirements
/// - Requirements 3.1, 3.2, 3.4, 3.5
pub fn convert_singleplayer_archives(save_dir: &Path) -> Vec<ConversionResult> {
    let mut conversions = Vec::new();

    // Read all entries in the SaveGames directory
    let entries = match fs::read_dir(save_dir) {
        Ok(entries) => entries,
        Err(e) => {
            tracing::error!("Failed to read SaveGames directory: {}", e);
            return conversions;
        }
    };

    for entry in entries.flatten() {
        let path = entry.path();

        // Only process .sav files
        if path.extension().and_then(|ext| ext.to_str()) != Some("sav") {
            continue;
        }

        // Get the filename as string
        let filename = match path.file_name().and_then(|n| n.to_str()) {
            Some(name) => name,
            None => continue,
        };

        // Filter files starting with "SINGLEPLAYER_"
        if !filename.starts_with("SINGLEPLAYER_") {
            continue;
        }

        // Convert the filename
        let new_filename = match convert_filename(filename) {
            Some(name) => name,
            None => {
                // This shouldn't happen since we already checked the prefix,
                // but handle it gracefully
                tracing::warn!("convert_filename returned None for: {}", filename);
                continue;
            }
        };

        let new_path = save_dir.join(&new_filename);

        // fs::rename replaces existing destinations on Windows
        // (MOVEFILE_REPLACE_EXISTING), so converting over an already-present
        // MULTIPLAYER_ twin would silently destroy the newer save (e.g. an
        // old SINGLEPLAYER_ backup restored next to it). Skip instead,
        // mirroring plan_renames in gensave_rename.rs.
        if new_path.exists() {
            tracing::warn!("Conversion: target exists — skipping '{}'", filename);
            conversions.push(ConversionResult {
                original: filename.to_string(),
                converted: new_filename,
                success: false,
            });
            continue;
        }

        // Perform the rename operation
        match fs::rename(&path, &new_path) {
            Ok(()) => {
                // Update MAINSAVE.sav's SingleplayerSaves list. The registry
                // stores bare stems (no ".sav"), and a missed/failed update
                // would leave the renamed file permanently unregistered (listed
                // hidden forever) — so treat both as failure and REVERT the file
                // rename, keeping disk and registry consistent. The conversion
                // is retried on the next load.
                let registry_result = crate::common::update_mainsave_archive_name(
                    crate::common::extract_archive_name(filename),
                    crate::common::extract_archive_name(&new_filename),
                );

                match registry_result {
                    Ok(true) => {
                        tracing::info!("Converted archive: {} -> {}", filename, new_filename);
                        conversions.push(ConversionResult {
                            original: filename.to_string(),
                            converted: new_filename,
                            success: true,
                        });
                    }
                    Ok(false) => {
                        tracing::error!(
                            "MAINSAVE has no entry for '{}' — reverting rename",
                            filename
                        );
                        if let Err(revert_err) = fs::rename(&new_path, &path) {
                            tracing::error!(
                                "Failed to revert rename of {}: {}",
                                filename,
                                revert_err
                            );
                        }
                        conversions.push(ConversionResult {
                            original: filename.to_string(),
                            converted: new_filename,
                            success: false,
                        });
                    }
                    Err(e) => {
                        tracing::error!("Failed to update MAINSAVE for {}: {}", filename, e);
                        if let Err(revert_err) = fs::rename(&new_path, &path) {
                            tracing::error!(
                                "Failed to revert rename of {}: {}",
                                filename,
                                revert_err
                            );
                        }
                        conversions.push(ConversionResult {
                            original: filename.to_string(),
                            converted: new_filename,
                            success: false,
                        });
                    }
                }
            }
            Err(e) => {
                tracing::error!("Failed to convert {}: {}", filename, e);
                conversions.push(ConversionResult {
                    original: filename.to_string(),
                    converted: new_filename,
                    success: false,
                });
                // Continue processing other files (Requirement 3.4)
            }
        }
    }

    conversions
}

use crate::common::extract_archive_name;
use crate::error::AppResult;
use crate::get_file_path;
use crate::save_utils;
use crate::save_utils::{SaveFileDetail, SaveFileInfo, SaveFileMeta};
use rayon::prelude::*;
use std::collections::HashSet;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Load all save files with full parsing
#[tauri::command]
pub async fn load_all_saves() -> AppResult<Vec<SaveFileInfo>> {
    let start_time = Instant::now();

    // Parallel fetch file list and visible saves set (+ display names;
    // this also backfills missing SaveDisplayNamesLookup entries).

    // Phase 0b: Rename GENSAVE archives to their in-game display names.
    let gensave_count = crate::gensave_rename::sync_gensave_filenames();
    if gensave_count > 0 {
        tracing::info!(
            "Renamed {} GENSAVE archives to display names",
            gensave_count
        );
    }

    let (paths_result, visible_saves_result) = rayon::join(
        get_file_path::list_save_paths,
        crate::common::get_visible_saves_with_display_names,
    );

    let paths = paths_result?;
    let (visible_set, display_names) = visible_saves_result?;
    let visible_saves = Arc::new(visible_set);
    let path_count = paths.len();

    // Use rayon to process all save files in parallel
    let results: Vec<SaveFileInfo> = paths
        .into_par_iter()
        .enumerate()
        .filter_map(|(i, path)| process_save_file(i, &path, &visible_saves, Some(&display_names)))
        .collect();

    let elapsed = start_time.elapsed();
    tracing::info!(
        "load_all_saves: {}/{} saves, took {:.2}ms",
        results.len(),
        path_count,
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(results)
}

/// Phase 1 of incremental loading: return only filename-derived metadata,
/// no .sav file parsing. Extremely fast even for 1000+ files.
#[tauri::command]
pub async fn load_save_metadata() -> AppResult<Vec<SaveFileMeta>> {
    let start_time = Instant::now();

    // Phase 0: Convert any SINGLEPLAYER_ archives to MULTIPLAYER_
    let save_dir = crate::common::get_save_games_dir()?;
    let conversions = convert_singleplayer_archives(&save_dir);
    if !conversions.is_empty() {
        tracing::info!("Converted {} singleplayer archives", conversions.len());
    }

    // Phase 0b: Rename GENSAVE archives to their in-game display names.
    let gensave_count = crate::gensave_rename::sync_gensave_filenames();
    if gensave_count > 0 {
        tracing::info!(
            "Renamed {} GENSAVE archives to display names",
            gensave_count
        );
    }

    let (paths_result, visible_saves_result) = rayon::join(
        get_file_path::list_save_paths,
        crate::common::get_visible_saves_with_display_names,
    );

    let paths = paths_result?;
    let (visible_set, display_names) = visible_saves_result?;

    let results: Vec<SaveFileMeta> = paths
        .into_par_iter()
        .enumerate()
        .filter_map(|(i, path)| {
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            let archive_name = extract_archive_name(file_name);
            let date = cli_handlers::get_modified_date(&path).unwrap_or_default();
            let is_visible = visible_set.contains(archive_name);

            save_utils::build_save_meta(
                i as u32,
                &path,
                date,
                is_visible,
                display_names.get(archive_name).cloned(),
            )
            .ok()
        })
        .collect();

    let elapsed = start_time.elapsed();
    tracing::info!(
        "load_save_metadata: {} saves, took {:.2}ms",
        results.len(),
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(results)
}

/// Paginated metadata loading for progressive scroll.
/// Returns a page of SaveFileMeta starting from the given `offset`,
/// so the frontend can progressively fetch archives as the user scrolls.
/// Returns SaveFileMetaPage with the total count so the frontend knows when the list ends.
#[tauri::command]
pub async fn load_save_metadata_page(
    offset: u32,
    limit: u32,
) -> AppResult<save_utils::SaveFileMetaPage> {
    let start_time = Instant::now();

    let (paths_result, visible_saves_result) = rayon::join(
        get_file_path::list_save_paths,
        crate::common::get_visible_saves_with_display_names,
    );

    let paths = paths_result?;
    let (visible_set, display_names) = visible_saves_result?;
    let total = paths.len() as u32;

    // Clamp to valid range
    let start = offset.min(total) as usize;
    let end = (offset + limit).min(total) as usize;
    let page_paths = &paths[start..end];

    let mut results: Vec<SaveFileMeta> = Vec::with_capacity(page_paths.len());
    for (rel_i, path) in page_paths.iter().enumerate() {
        let global_idx = (start + rel_i) as u32;
        let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        let archive_name = extract_archive_name(file_name);
        let date = cli_handlers::get_modified_date(path).unwrap_or_default();
        let is_visible = visible_set.contains(archive_name);

        if let Ok(meta) = save_utils::build_save_meta(
            global_idx,
            path,
            date,
            is_visible,
            display_names.get(archive_name).cloned(),
        ) {
            results.push(meta);
        }
    }

    let elapsed = start_time.elapsed();
    tracing::info!(
        "load_save_metadata_page(offset={}, limit={}): {} items of {}, took {:.2}ms",
        offset,
        limit,
        results.len(),
        total,
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(save_utils::SaveFileMetaPage {
        items: results,
        total,
        offset,
        has_more: end < total as usize,
    })
}

/// Phase 2 of incremental loading: parse specific .sav files in batch
/// to get current_level and actual_difficulty.
#[tauri::command]
pub async fn load_save_details_batch(paths: Vec<String>) -> AppResult<Vec<SaveFileDetail>> {
    let start_time = Instant::now();
    let count = paths.len();

    let results: Vec<SaveFileDetail> = paths
        .into_par_iter()
        .filter_map(|path| {
            let p = Path::new(&path);
            cli_handlers::parse_sav_file(p).ok().map(|save| {
                let current_level = cli_handlers::extract_current_level(&save);
                let actual_difficulty =
                    cli_handlers::extract_difficulty_label(&save).map(|c| c.into_owned());
                SaveFileDetail {
                    path,
                    current_level,
                    actual_difficulty,
                }
            })
        })
        .collect();

    let elapsed = start_time.elapsed();
    tracing::info!(
        "load_save_details_batch: {}/{}, took {:.2}ms",
        results.len(),
        count,
        elapsed.as_secs_f64() * 1000.0
    );

    Ok(results)
}

/// Process a single save file (optimized version)
#[inline]
fn process_save_file(
    index: usize,
    path: &Path,
    visible_saves: &Arc<HashSet<String>>,
    display_names: Option<&std::collections::HashMap<String, String>>,
) -> Option<SaveFileInfo> {
    let file_name = path.file_name().and_then(|n| n.to_str())?;
    let archive_name = extract_archive_name(file_name);
    let date = cli_handlers::get_modified_date(path).unwrap_or_default();
    let is_visible = visible_saves.contains(archive_name);
    let display_name = display_names.and_then(|m| m.get(archive_name).cloned());

    // Skip parsing .sav if not visible (performance optimization)
    if !is_visible {
        return save_utils::build_save_file_info(
            index as u32,
            path,
            date,
            None,
            None,
            is_visible,
            display_name,
        )
        .ok();
    }

    // Parse .sav file for visible saves
    cli_handlers::parse_sav_file(path).ok().and_then(|save| {
        let current_level = cli_handlers::extract_current_level(&save);
        let actual_difficulty =
            cli_handlers::extract_difficulty_label(&save).map(|c| c.into_owned());
        save_utils::build_save_file_info(
            index as u32,
            path,
            date,
            Some(current_level),
            actual_difficulty,
            is_visible,
            display_name,
        )
        .ok()
    })
}
