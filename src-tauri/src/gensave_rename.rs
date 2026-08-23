//! GENSAVE display-name sync: rename auto-generated archives on disk to match
//! the display name the player chose in-game.
//!
//! The game always creates slot names shaped `MULTIPLAYER_GENSAVE{N}_{difficulty}`,
//! while an optional user-chosen display name lives in
//! `MAINSAVE.sav → SaveDisplayNamesLookup` (a `Map<full slot name, display>`).
//! A folder full of `GENSAVE7` / `GENSAVE8` files tells an archive-manager user
//! nothing about which save is which.
//!
//! This module closes that gap: when a visible MULTIPLAYER archive's base name
//! is `GENSAVE{digits}` and the lookup holds a non-empty display name that is
//! not already the base name, the `.sav` file is renamed to
//! `MULTIPLAYER_{sanitized display}_{difficulty}.sav` and MAINSAVE
//! (`SingleplayerSaves` entry + lookup key) is updated in one locked critical
//! section per rename. The lookup VALUE is preserved byte-for-byte so what the
//! game displays never drifts from what the player typed, even when
//! sanitization alters the filename spelling.
//!
//! Empty display values are left alone (game convention: empty == "unnamed"),
//! and a rename whose target filename already exists is skipped with a warning
//! rather than inventing suffixed variants.

use crate::common::{
    get_save_games_dir, lock_mainsave, read_mainsave_with_retries, write_mainsave,
};
use crate::display_name::{self, base_archive_name, get_display_names};
use std::path::{Path, PathBuf};
use uesave::{Property, PropertyKey, ValueVec};

/// One pending archive rename derived from the naming table.
struct RenamePlan {
    old_path: PathBuf,
    new_path: PathBuf,
    old_slot: String,
    new_slot: String,
}

/// Difficulty suffix of an auto-generated GENSAVE slot:
/// `MULTIPLAYER_GENSAVE25_Hard` -> `Hard`. Returns `None` for anything that is
/// not exactly `MULTIPLAYER_GENSAVE<digits>_<non-empty difficulty>`.
fn gensave_difficulty(slot: &str) -> Option<&str> {
    let rest = slot.strip_prefix("MULTIPLAYER_")?;
    let (middle, difficulty) = rest.rsplit_once('_')?;
    if difficulty.is_empty() || !middle.starts_with("GENSAVE") {
        return None;
    }
    let digits = &middle["GENSAVE".len()..];
    (!digits.is_empty() && digits.bytes().all(|b| b.is_ascii_digit())).then_some(difficulty)
}

/// Sanitize a display name into a safe filename component. Allowed characters
/// mirror `new_save.rs`'s archive-name validation (alphanumeric plus
/// `-`, `_`, `(`, `)`, space); every other character collapses to a single `_`.
/// Returns `None` when nothing usable remains.
fn sanitize_display_component(raw: &str) -> Option<String> {
    let mut out = String::with_capacity(raw.len());
    let mut last_was_sub = raw.is_empty();
    for c in raw.trim().chars() {
        if c.is_alphanumeric() || matches!(c, '-' | '_' | '(' | ')' | ' ') {
            out.push(c);
            last_was_sub = false;
        } else if !last_was_sub {
            out.push('_');
            last_was_sub = true;
        }
    }
    let trimmed = out.trim_end().to_string();
    (!trimmed.is_empty()).then_some(trimmed)
}

/// Build rename plans from MAINSAVE state. Skips entries whose display value
/// is empty (game convention: "unnamed"), whose sanitized display already
/// matches the current base, or whose target file exists on disk.
fn plan_renames(save_dir: &Path, mainsave: &uesave::Save) -> Vec<RenamePlan> {
    let names = get_display_names(mainsave);
    let vis_key = PropertyKey(0, display_name::SINGLEPLAYER_SAVES_KEY.to_string());
    let saves = match mainsave.root.properties.0.get(&vis_key) {
        Some(Property::Array(ValueVec::Str(s))) => s,
        _ => return Vec::new(),
    };

    let mut taken: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut plans = Vec::new();

    for old_slot in saves.iter() {
        let Some(difficulty) = gensave_difficulty(old_slot) else {
            continue;
        };
        let Some(display_raw) = names.get(old_slot) else {
            continue;
        };
        let display = display_raw.trim();
        if display.is_empty() {
            continue;
        }
        let Some(sanitized) = sanitize_display_component(display) else {
            continue;
        };
        if base_archive_name(old_slot).eq_ignore_ascii_case(&sanitized) {
            continue;
        }

        let new_slot = format!("MULTIPLAYER_{sanitized}_{difficulty}");
        let new_path = save_dir.join(format!("{new_slot}.sav"));
        if new_path.exists() {
            tracing::warn!("GENSAVE rename: target exists — skipping '{old_slot}'");
            continue;
        }
        if !taken.insert(new_slot.to_lowercase()) {
            tracing::warn!("GENSAVE rename: target collides — skipping '{old_slot}'");
            continue;
        }

        plans.push(RenamePlan {
            old_path: save_dir.join(format!("{old_slot}.sav")),
            new_path,
            old_slot: old_slot.clone(),
            new_slot,
        });
    }

    plans
}

/// Sync one archive in MAINSAVE: replace the SingleplayerSaves entry and move
/// the SaveDisplayNamesLookup key. Returns Err when the old slot is missing
/// from SingleplayerSaves.
fn sync_registry(
    mainsave: &mut uesave::Save,
    old_slot: &str,
    new_slot: &str,
) -> crate::error::AppResult<()> {
    let key = PropertyKey(0, display_name::SINGLEPLAYER_SAVES_KEY.to_string());
    let mut found = false;

    if let Some(Property::Array(ValueVec::Str(saves))) = mainsave.root.properties.0.get_mut(&key) {
        for s in saves.iter_mut() {
            if s == old_slot {
                *s = new_slot.to_string();
                found = true;
                break;
            }
        }
    }

    if !found {
        return Err(format!("MAINSAVE has no SingleplayerSaves entry for '{old_slot}'").into());
    }

    display_name::move_display_entry(mainsave, old_slot, new_slot);
    Ok(())
}

/// Entry point called from save_loader on every load. Renames visible
/// GENSAVE archives to their in-game display names, updating MAINSAVE
/// atomically. Returns the number of archives successfully renamed.
/// All errors are logged, never propagated.
pub fn sync_gensave_filenames() -> usize {
    let save_dir = match get_save_games_dir() {
        Ok(d) => d,
        Err(_) => return 0,
    };

    // Phase 1: plan under lock (read MAINSAVE once).
    let plans = {
        let Ok(_guard) = lock_mainsave() else {
            return 0;
        };
        let Ok(mainsave) = read_mainsave_with_retries() else {
            return 0;
        };
        plan_renames(&save_dir, &mainsave)
    };

    if plans.is_empty() {
        return 0;
    }

    tracing::info!(
        "Renaming {} GENSAVE archive(s) to their in-game display names",
        plans.len()
    );

    // Phase 2: perform file renames, collecting successes.
    let mut done: Vec<(String, String, String, String)> = Vec::new(); // (old_path, new_path, old_slot, new_slot)
    for p in &plans {
        if !p.old_path.exists() {
            tracing::debug!(
                "GENSAVE rename: source not on disk — skipping '{}'",
                p.old_slot
            );
            continue;
        }
        match std::fs::rename(&p.old_path, &p.new_path) {
            Ok(()) => {
                done.push((
                    p.old_path.to_string_lossy().into_owned(),
                    p.new_path.to_string_lossy().into_owned(),
                    p.old_slot.clone(),
                    p.new_slot.clone(),
                ));
            }
            Err(e) => {
                tracing::error!(
                    "GENSAVE rename: {} → {} failed: {e}",
                    p.old_slot,
                    p.new_slot
                );
            }
        }
    }

    if done.is_empty() {
        return 0;
    }

    // Phase 3: single locked MAINSAVE write for all successful renames.
    // On any failure, revert every file rename (same contract as
    // convert_singleplayer_archives).
    let write_result: crate::error::AppResult<()> = {
        let Ok(_guard) = lock_mainsave() else {
            tracing::error!("GENSAVE rename: lock poisoned — reverting all");
            for (old_p, new_p, _, _) in &done {
                let _ = std::fs::rename(new_p, old_p);
            }
            return 0;
        };
        let mut mainsave = match read_mainsave_with_retries() {
            Ok(m) => m,
            Err(_) => {
                tracing::error!("GENSAVE rename: read failed — reverting all");
                for (old_p, new_p, _, _) in &done {
                    let _ = std::fs::rename(new_p, old_p);
                }
                return 0;
            }
        };

        for (_, _, old_slot, new_slot) in &done {
            if let Err(e) = sync_registry(&mut mainsave, old_slot, new_slot) {
                tracing::error!(
                    "GENSAVE rename: registry sync failed for '{old_slot}': {e} — reverting all"
                );
                for (old_p, new_p, _, _) in &done {
                    let _ = std::fs::rename(new_p, old_p);
                }
                return 0;
            }
        }

        write_mainsave(&mainsave)
    };

    if let Err(e) = write_result {
        tracing::error!("GENSAVE rename: MAINSAVE write failed: {e} — reverting file renames");
        for (old_p, new_p, _, _) in &done {
            if let Err(revert_e) = std::fs::rename(new_p, old_p) {
                tracing::error!("GENSAVE rename: revert failed: {revert_e}");
            }
        }
        return 0;
    }

    for (_, _, old_slot, new_slot) in &done {
        tracing::info!("GENSAVE rename: {old_slot} → {new_slot}");
    }

    done.len()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::display_name::{DISPLAY_NAMES_KEY, SINGLEPLAYER_SAVES_KEY};

    fn empty_save() -> uesave::Save {
        let json = r#"{
            "header":{"magic":1196343156,"save_game_version":3,
              "package_version":{"ue4":522,"ue5":null},
              "engine_version_major":4,"engine_version_minor":27,
              "engine_version_patch":2,"engine_version_build":0,
              "engine_version":"","custom_version":null},
            "schemas":{"schemas":{}},
            "root":{"save_game_type":"","properties":{}},
            "extra":[]
        }"#;
        serde_json::from_str(json).unwrap()
    }

    fn upsert_visible(save: &mut uesave::Save, name: &str) {
        let key = PropertyKey(0, SINGLEPLAYER_SAVES_KEY.to_string());
        match save.root.properties.0.get_mut(&key) {
            Some(Property::Array(ValueVec::Str(saves))) => {
                saves.push(name.to_string());
            }
            _ => {
                save.schemas.record(
                    SINGLEPLAYER_SAVES_KEY.to_string(),
                    uesave::PropertyTagPartial {
                        id: None,
                        data: uesave::PropertyTagDataPartial::Array(Box::new(
                            uesave::PropertyTagDataPartial::Other(
                                uesave::PropertyType::StrProperty,
                            ),
                        )),
                    },
                );
                save.root
                    .properties
                    .0
                    .insert(key, Property::Array(ValueVec::Str(vec![name.to_string()])));
            }
        }
    }

    fn insert_entry(save: &mut uesave::Save, slot: &str, value: &str) {
        let map_key = PropertyKey(0, DISPLAY_NAMES_KEY.to_string());
        if let Some(Property::Map(entries)) = save.root.properties.0.get_mut(&map_key) {
            entries.push(uesave::MapEntry {
                key: Property::Str(slot.to_string()),
                value: Property::Str(value.to_string()),
            });
        }
    }

    #[test]
    fn gensave_difficulty_parses_valid_slots() {
        assert_eq!(
            gensave_difficulty("MULTIPLAYER_GENSAVE7_Hard"),
            Some("Hard")
        );
        assert_eq!(
            gensave_difficulty("MULTIPLAYER_GENSAVE12_Nightmare"),
            Some("Nightmare")
        );
    }

    #[test]
    fn gensave_difficulty_rejects_non_gensave() {
        assert_eq!(gensave_difficulty("MULTIPLAYER_dllhook_Hard"), None);
        assert_eq!(gensave_difficulty("MULTIPLAYER_GENSAVEXX_Hard"), None);
        assert_eq!(gensave_difficulty("MULTIPLAYER_GENSAVE_Hard"), None);
        assert_eq!(gensave_difficulty("SINGLEPLAYER_GENSAVE7_Hard"), None);
        assert_eq!(gensave_difficulty("GENSAVE7_Hard"), None);
        assert_eq!(gensave_difficulty("weird"), None);
    }

    #[test]
    fn sanitize_preserves_allowed_chars() {
        assert_eq!(
            sanitize_display_component("dllhook"),
            Some("dllhook".into())
        );
        assert_eq!(
            sanitize_display_component("my save (1)"),
            Some("my save (1)".into())
        );
    }

    #[test]
    fn sanitize_replaces_forbidden_chars() {
        assert_eq!(
            sanitize_display_component("bad/name*here"),
            Some("bad_name_here".into())
        );
    }

    #[test]
    fn sanitize_collapse_consecutive_forbidden() {
        assert_eq!(sanitize_display_component("a///b"), Some("a_b".into()));
    }

    #[test]
    fn sanitize_empty_rejected() {
        assert_eq!(sanitize_display_component(""), None);
        assert_eq!(sanitize_display_component("///"), Some("_".into()));
        assert_eq!(sanitize_display_component("   "), None);
    }

    #[test]
    fn plan_skips_empty_display() {
        let mut save = empty_save();
        display_name::ensure_map_property(&mut save);
        upsert_visible(&mut save, "MULTIPLAYER_GENSAVE1_Hard");
        insert_entry(&mut save, "MULTIPLAYER_GENSAVE1_Hard", "");
        assert!(plan_renames(Path::new("/tmp"), &save).is_empty());
    }

    #[test]
    fn plan_skips_identity() {
        let mut save = empty_save();
        display_name::ensure_map_property(&mut save);
        upsert_visible(&mut save, "MULTIPLAYER_GENSAVE7_Hard");
        insert_entry(&mut save, "MULTIPLAYER_GENSAVE7_Hard", "GENSAVE7");
        assert!(plan_renames(Path::new("/tmp"), &save).is_empty());
    }

    #[test]
    fn plan_produces_rename_for_custom_name() {
        let mut save = empty_save();
        display_name::ensure_map_property(&mut save);
        upsert_visible(&mut save, "MULTIPLAYER_GENSAVE25_Hard");
        insert_entry(&mut save, "MULTIPLAYER_GENSAVE25_Hard", "dllhook");

        let plans = plan_renames(Path::new("/tmp"), &save);
        assert_eq!(plans.len(), 1);
        assert_eq!(plans[0].old_slot, "MULTIPLAYER_GENSAVE25_Hard");
        assert_eq!(plans[0].new_slot, "MULTIPLAYER_dllhook_Hard");
    }
}
