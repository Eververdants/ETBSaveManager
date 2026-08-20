//! Save loader module - Handles save file loading operations
//! Extracted from save_commands.rs for better modularity

use crate::cli_handlers;
use crate::common::{extract_archive_name, get_visible_saves_set};
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

    // Parallel fetch file list and visible saves set
    let (paths_result, visible_saves_result) =
        rayon::join(get_file_path::list_save_paths, get_visible_saves_set);

    let paths = paths_result?;
    let visible_saves = Arc::new(visible_saves_result?);
    let path_count = paths.len();

    // Use rayon to process all save files in parallel
    let results: Vec<SaveFileInfo> = paths
        .into_par_iter()
        .enumerate()
        .filter_map(|(i, path)| process_save_file(i, &path, &visible_saves))
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

    let (paths_result, visible_saves_result) =
        rayon::join(get_file_path::list_save_paths, get_visible_saves_set);

    let paths = paths_result?;
    let visible_saves = Arc::new(visible_saves_result?);

    let results: Vec<SaveFileMeta> = paths
        .into_par_iter()
        .enumerate()
        .filter_map(|(i, path)| {
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            let archive_name = extract_archive_name(file_name);
            let date = cli_handlers::get_modified_date(&path).unwrap_or_default();
            let is_visible = visible_saves.contains(archive_name);

            save_utils::build_save_meta(i as u32, &path, date, is_visible).ok()
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

    let (paths_result, visible_saves_result) =
        rayon::join(get_file_path::list_save_paths, get_visible_saves_set);

    let paths = paths_result?;
    let visible_saves = visible_saves_result?;
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
        let is_visible = visible_saves.contains(archive_name);

        if let Ok(meta) = save_utils::build_save_meta(global_idx, path, date, is_visible) {
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
                let actual_difficulty = cli_handlers::extract_difficulty_label(&save).into_owned();
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
) -> Option<SaveFileInfo> {
    let file_name = path.file_name().and_then(|n| n.to_str())?;
    let archive_name = extract_archive_name(file_name);
    let date = cli_handlers::get_modified_date(path).unwrap_or_default();
    let is_visible = visible_saves.contains(archive_name);

    // Skip parsing .sav if not visible (performance optimization)
    if !is_visible {
        return save_utils::build_save_file_info(
            index as u32,
            path,
            archive_name,
            date,
            None,
            None,
            is_visible,
        )
        .ok();
    }

    // Parse .sav file for visible saves
    cli_handlers::parse_sav_file(path).ok().and_then(|save| {
        let current_level = cli_handlers::extract_current_level(&save);
        let actual_difficulty = cli_handlers::extract_difficulty_label(&save).into_owned();
        save_utils::build_save_file_info(
            index as u32,
            path,
            archive_name,
            date,
            Some(current_level),
            Some(actual_difficulty),
            is_visible,
        )
        .ok()
    })
}
