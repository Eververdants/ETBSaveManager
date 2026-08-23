//! Mod management: UE4SS and Nightmare Save Unlocker (NSU).
//!
//! Handles game-path validation, release resolution from GitHub, download +
//! extraction into the game's Win64 directory, `mods.txt` bookkeeping and
//! clean uninstalls (dependent mods are removed before UE4SS itself).

use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard, OnceLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

// ─── Constants ───────────────────────────────────────────────────────────────

const UE4SS_REPO: &str = "EscapeTheBackroomsCommunity/UE4SS";
const UE4SS_RECOMMENDED_TAG: &str = "1.3.0";
const NSU_REPO: &str = "Eververdants/NightmareSaveUnlocker";
const GITHUB_API: &str = "https://api.github.com";
const USER_AGENT: &str = concat!("ETB-Save-Manager/", env!("CARGO_PKG_VERSION"));

/// Mod folders shipped with stock UE4SS. Anything else under `Mods/` is a
/// third-party mod and is treated as dependent on UE4SS.
const STOCK_UE4SS_MOD_DIRS: &[&str] = &[
    "BPML_GenericFunctions",
    "BPModLoaderMod",
    "CheatManagerEnablerMod",
    "ConsoleCommandsMod",
    "ConsoleEnablerMod",
    "ConsoleKeybindsMod",
    "ETBCommandsMod",
    "Keybinds",
    "LineTraceMod",
    "shared",
];

/// Proxy-loader DLLs UE4SS releases have been known to ship. Only deleted
/// when recorded in the install manifest, or (fallback) when no manifest
/// exists and they sit directly in Win64.
const KNOWN_LOADER_DLLS: &[&str] = &["dwmapi.dll", "version.dll", "winhttp.dll", "xinput1_3.dll"];

const MANIFEST_FILE: &str = ".etb-sm-manifest.json";
const MODS_TXT: &str = "mods.txt";
const NSU_MOD_NAME: &str = "NightmareSaveUnlocker";
const PROGRESS_EVENT: &str = "mod-install-progress";

// ─── Helper: blocking work on the tokio pool ────────────────────────────────

/// Helper: run a blocking closure via tokio::task::spawn_blocking,
/// mapping the join error into an AppResult.
async fn run_blocking<F, T>(f: F) -> AppResult<T>
where
    F: FnOnce() -> AppResult<T> + Send + 'static,
    T: Send + 'static,
{
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|e| format!("Task was cancelled: {}", e))?
}

// ─── Error helpers ───────────────────────────────────────────────────────────

/// Build a validation error carrying a stable machine-readable reason code
/// (the frontend maps codes to localized messages).
fn validation(reason: &str) -> AppError {
    AppError::Validation(reason.to_string())
}

// ─── Path layout ─────────────────────────────────────────────────────────────

/// `<game_root>/EscapeTheBackrooms/Binaries/Win64`
fn win64_dir(game_root: &Path) -> PathBuf {
    game_root
        .join("EscapeTheBackrooms")
        .join("Binaries")
        .join("Win64")
}

/// `<win64>/ue4ss/Mods`
fn ue4ss_mods_dir(win64: &Path) -> PathBuf {
    win64.join("ue4ss").join("Mods")
}

/// A real game root must contain the shipping executable inside the expected
/// layout. This is the single source of truth for path validation.
fn is_valid_game_root(root: &Path) -> bool {
    root.join("EscapeTheBackrooms")
        .join("Binaries")
        .join("Win64")
        .join("Backrooms-Win64-Shipping.exe")
        .is_file()
}

/// Generate candidate roots from a user-selected folder: the folder itself,
/// its `EscapeTheBackrooms` child (users sometimes select `steamapps/common`),
/// and up to three ancestors. First valid candidate wins.
fn find_canonical_root(selected: &Path) -> Option<PathBuf> {
    let mut candidates: Vec<PathBuf> = Vec::new();
    candidates.push(selected.to_path_buf());
    candidates.push(selected.join("EscapeTheBackrooms"));

    let mut ancestor = selected.parent();
    for _ in 0..3 {
        match ancestor {
            Some(a) => {
                candidates.push(a.to_path_buf());
                ancestor = a.parent();
            }
            None => break,
        }
    }

    // Dedup while preserving order
    let mut seen = std::collections::HashSet::new();
    candidates
        .into_iter()
        .filter(|c| seen.insert(c.clone()))
        .find(|c| is_valid_game_root(c))
}

// ─── Validation command ──────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct GamePathInfo {
    pub valid: bool,
    pub canonical_root: Option<String>,
    pub win64_dir: Option<String>,
    pub reason: String,
}

/// Validate a user-selected game folder. Accepts the game root itself, its
/// parent (`steamapps/common`) or an inner folder, and returns the canonical
/// root plus derived Win64 directory when valid.
#[tauri::command]
pub async fn validate_game_path(path: String) -> AppResult<GamePathInfo> {
    run_blocking(move || {
        let selected = PathBuf::from(&path);
        if !selected.exists() {
            return Ok(GamePathInfo {
                valid: false,
                canonical_root: None,
                win64_dir: None,
                reason: "path-not-found".to_string(),
            });
        }

        match find_canonical_root(&selected) {
            Some(root) => {
                let win64 = win64_dir(&root);
                Ok(GamePathInfo {
                    valid: true,
                    canonical_root: Some(path_to_string(&root)),
                    win64_dir: Some(path_to_string(&win64)),
                    reason: String::new(),
                })
            }
            None => Ok(GamePathInfo {
                valid: false,
                canonical_root: None,
                win64_dir: None,
                reason: "not-a-game-root".to_string(),
            }),
        }
    })
    .await
}

/// Convert a path to a string with forward slashes normalized to backslashes
/// on Windows for consistent display.
fn path_to_string(path: &Path) -> String {
    #[cfg(target_os = "windows")]
    {
        path.to_string_lossy().replace('/', "\\")
    }
    #[cfg(not(target_os = "windows"))]
    {
        path.to_string_lossy().to_string()
    }
}

// ─── Auto-detection ──────────────────────────────────────────────────────────

/// Read a single REG_SZ value via `reg query`. Splits on the `REG_SZ` marker
/// so values containing spaces (e.g. "C:\Program Files (x86)\Steam") survive.
#[cfg(target_os = "windows")]
fn read_registry_value(location: &str, value_name: &str) -> Option<String> {
    let output = std::process::Command::new("reg")
        .args(["query", location, "/v", value_name])
        .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        if let Some(idx) = line.find("REG_SZ") {
            let value = line[idx + "REG_SZ".len()..].trim();
            if !value.is_empty() {
                return Some(value.to_string());
            }
        }
    }
    None
}

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt as _;

/// Extract every `"path"  ".."` entry from Steam's libraryfolders.vdf.
#[cfg(target_os = "windows")]
fn steam_library_paths(steam_root: &Path) -> Vec<PathBuf> {
    let mut result = Vec::new();
    let vdf = steam_root.join("steamapps").join("libraryfolders.vdf");
    let Ok(text) = fs::read_to_string(vdf) else {
        return result;
    };
    for line in text.lines() {
        let Some(pos) = line.find("\"path\"") else {
            continue;
        };
        let rest = line[pos + "\"path\"".len()..].trim();
        // rest looks like `"D:\\Applications\\Steam"` possibly with trailing comments
        if let Some(raw) = rest.strip_prefix('"') {
            if let Some(end) = raw.find('"') {
                let unescaped = raw[..end].replace("\\\\", "\\");
                result.push(PathBuf::from(unescaped));
            }
        }
    }
    result
}

/// All known Steam library roots on this machine (registry + default path).
#[cfg(target_os = "windows")]
fn steam_roots() -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    let mut push_unique = |p: PathBuf| {
        if !roots.contains(&p) {
            roots.push(p);
        }
    };

    for location in [
        r"HKCU\Software\Valve\Steam",
        r"HKLM\SOFTWARE\WOW6432Node\Valve\Steam",
    ] {
        let name = if location.starts_with("HKCU") {
            "SteamPath"
        } else {
            "InstallPath"
        };
        if let Some(v) = read_registry_value(location, name) {
            push_unique(PathBuf::from(v));
        }
    }
    push_unique(PathBuf::from(r"C:\Program Files (x86)\Steam"));
    roots
}

/// Probe each Steam library for the game; returns the canonical game root
/// when found.
#[cfg(target_os = "windows")]
fn probe_steam_libraries() -> Option<String> {
    for root in steam_roots() {
        for lib in steam_library_paths(&root)
            .into_iter()
            .chain(std::iter::once(root.clone()))
        {
            let candidate = lib
                .join("steamapps")
                .join("common")
                .join("EscapeTheBackrooms");
            if is_valid_game_root(&candidate) {
                return Some(path_to_string(&candidate));
            }
        }
    }
    None
}

#[tauri::command]
pub async fn detect_game_path() -> AppResult<Option<String>> {
    run_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            Ok(probe_steam_libraries())
        }
        #[cfg(not(target_os = "windows"))]
        {
            Ok(None)
        }
    })
    .await
}

// ─── Status ──────────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct ModsStatus {
    pub ue4ss_installed: bool,
    pub ue4ss_version: Option<String>,
    pub ue4ss_channel: Option<String>,
    /// True when UE4SS was installed by this app (manifest present).
    pub ue4ss_managed: bool,
    pub nsu_installed: bool,
    pub nsu_enabled: bool,
    pub nsu_version: Option<String>,
    /// Third-party mod folders under ue4ss/Mods (dependent on UE4SS).
    pub dependent_mods: Vec<String>,
    pub win64_dir: String,
}

#[derive(Serialize, Deserialize)]
struct InstallManifest {
    tool: String,
    mod_name: String,
    version: String,
    channel: Option<String>,
    /// Files copied into the game, relative to their install base.
    files: Vec<String>,
}

fn read_manifest(path: &Path) -> Option<InstallManifest> {
    let data = fs::read_to_string(path).ok()?;
    serde_json::from_str(&data).ok()
}

/// Read the current install state of both mods from the filesystem.
#[tauri::command]
pub async fn get_mods_status(game_root: String) -> AppResult<ModsStatus> {
    run_blocking(move || {
        let root = PathBuf::from(&game_root);
        let win64 = win64_dir(&root);
        let mods_dir = ue4ss_mods_dir(&win64);

        let ue4ss_core = win64.join("UE4SS.dll").is_file() || win64.join("dwmapi.dll").is_file();
        let ue4ss_installed = ue4ss_core || win64.join("ue4ss").is_dir();
        let ue4ss_manifest = read_manifest(&win64.join("ue4ss").join(MANIFEST_FILE));

        let nsu_dir = mods_dir.join(NSU_MOD_NAME);
        let nsu_installed = nsu_dir.join("Scripts").join("main.lua").is_file();
        let nsu_manifest = read_manifest(&nsu_dir.join(MANIFEST_FILE));
        let nsu_enabled =
            nsu_installed && read_mods_txt_value(&mods_dir, NSU_MOD_NAME).unwrap_or(0) == 1;

        Ok(ModsStatus {
            ue4ss_installed,
            ue4ss_version: ue4ss_manifest.as_ref().map(|m| m.version.clone()),
            ue4ss_channel: ue4ss_manifest.as_ref().and_then(|m| m.channel.clone()),
            ue4ss_managed: ue4ss_manifest.is_some(),
            nsu_installed,
            nsu_enabled,
            nsu_version: nsu_manifest.as_ref().map(|m| m.version.clone()),
            dependent_mods: list_dependent_mods(&mods_dir),
            win64_dir: path_to_string(&win64),
        })
    })
    .await
}

/// Third-party mod folders under the UE4SS Mods directory (i.e. folders not
/// shipped with stock UE4SS).
fn list_dependent_mods(mods_dir: &Path) -> Vec<String> {
    let mut result = Vec::new();
    let Ok(entries) = fs::read_dir(mods_dir) else {
        return result;
    };
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if entry.path().is_dir() && !STOCK_UE4SS_MOD_DIRS.contains(&name.as_str()) {
            result.push(name);
        }
    }
    result.sort();
    result
}

// ─── mods.txt editing ────────────────────────────────────────────────────────

/// Process-wide lock guarding the read-modify-write span of update_mods_txt.
static MODS_TXT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn mods_txt_lock() -> MutexGuard<'static, ()> {
    MODS_TXT_LOCK
        .get_or_init(|| Mutex::new(()))
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// Read the enabled value (0/1) for `mod_name` from mods.txt, if present.
fn read_mods_txt_value(mods_dir: &Path, mod_name: &str) -> Option<i32> {
    let text = fs::read_to_string(mods_dir.join(MODS_TXT)).ok()?;
    parse_mods_line(&text, mod_name)
}

/// Extract the 0/1 value of a mod's line from mods.txt content.
fn parse_mods_line(text: &str, mod_name: &str) -> Option<i32> {
    for line in text.lines() {
        let Some((name, value)) = line.split_once(':') else {
            continue;
        };
        if name.trim().eq_ignore_ascii_case(mod_name) {
            return value.trim().parse::<i32>().ok();
        }
    }
    None
}

/// Insert, replace or remove (`value = None`) the entry for `mod_name` in
/// mods.txt. Other lines and their order are preserved.
///
/// Read-modify-write is serialized process-wide so concurrent commands
/// (e.g. a toggle racing an uninstall) cannot interleave and lose updates.
fn update_mods_txt(mods_dir: &Path, mod_name: &str, value: Option<bool>) -> AppResult<()> {
    let _guard = mods_txt_lock();
    let path = mods_dir.join(MODS_TXT);
    let original = if path.exists() {
        fs::read_to_string(&path)?
    } else {
        String::new()
    };

    let newline = if original.contains("\r\n") {
        "\r\n"
    } else {
        "\n"
    };
    let mut replaced = false;
    let mut out_lines: Vec<String> = Vec::new();

    for line in original.lines() {
        let is_target = match line.split_once(':') {
            Some((name, _)) => name.trim().eq_ignore_ascii_case(mod_name),
            None => false,
        };
        if is_target {
            replaced = true;
            if let Some(enabled) = value {
                out_lines.push(format!("{} : {}", mod_name, if enabled { 1 } else { 0 }));
            }
            // Removal: drop the line entirely
        } else {
            out_lines.push(line.to_string());
        }
    }

    if !replaced {
        if let Some(enabled) = value {
            // Trim trailing empty lines before appending so we don't stack blanks
            while out_lines
                .last()
                .map(|l| l.trim().is_empty())
                .unwrap_or(false)
            {
                out_lines.pop();
            }
            out_lines.push(format!("{} : {}", mod_name, if enabled { 1 } else { 0 }));
        } else {
            // Nothing to remove and nothing to add; leave file untouched
            return Ok(());
        }
    }

    let mut output = out_lines.join(newline);
    if !output.is_empty() {
        output.push_str(newline);
    }
    fs::create_dir_all(mods_dir)?;
    fs::write(&path, output)?;
    Ok(())
}

// ─── GitHub release resolution + download ────────────────────────────────────

#[derive(serde::Deserialize)]
struct GhAsset {
    name: String,
    browser_download_url: String,
    id: u64,
}

#[derive(serde::Deserialize)]
struct GhRelease {
    tag_name: String,
    #[serde(default)]
    draft: bool,
    assets: Vec<GhAsset>,
}

fn github_client() -> AppResult<reqwest::blocking::Client> {
    reqwest::blocking::Client::builder()
        .user_agent(USER_AGENT)
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|e| AppError::General(format!("Failed to build HTTP client: {}", e)))
}

/// Resolve a release (fixed tag or latest stable) and pick the matching zip
/// asset. Skips `zDEV-` dev builds. Returns `(version, download_url)`.
fn resolve_release(
    client: &reqwest::blocking::Client,
    repo: &str,
    tag: &str,
    asset_prefix: &str,
) -> AppResult<(String, String, u64)> {
    // /releases/latest resolves the newest stable release;
    // a named tag must go through /releases/tags/{tag}
    let url = if tag == "latest" {
        format!("{}/repos/{}/releases/latest", GITHUB_API, repo)
    } else {
        format!("{}/repos/{}/releases/tags/{}", GITHUB_API, repo, tag)
    };
    let release: GhRelease = client
        .get(&url)
        .header("Accept", "application/vnd.github+json")
        .send()
        .map_err(|e| format!("GitHub request failed: {}", e))?
        .error_for_status()
        .map_err(|e| format!("GitHub release not found: {}", e))?
        .json()
        .map_err(|e| format!("Failed to parse GitHub response: {}", e))?;

    if release.draft {
        return Err(format!("Release {} is a draft", release.tag_name).into());
    }

    let asset = release
        .assets
        .iter()
        .find(|a| {
            a.name.starts_with(asset_prefix)
                && a.name.ends_with(".zip")
                && !a.name.starts_with("zDEV-")
        })
        .ok_or_else(|| {
            format!(
                "No suitable zip asset found in release {}",
                release.tag_name
            )
        })?;

    Ok((
        release.tag_name.trim_start_matches('v').to_string(),
        asset.browser_download_url.clone(),
        asset.id,
    ))
}

/// Progress payload emitted to the frontend during install.
#[derive(Serialize, Clone)]
struct InstallProgress<'a> {
    mod_name: &'a str,
    phase: &'a str,
    percent: u8,
}

fn emit_progress(app: &AppHandle, mod_name: &str, phase: &str, percent: u8) {
    let _ = app.emit(
        PROGRESS_EVENT,
        InstallProgress {
            mod_name,
            phase,
            percent,
        },
    );
}

/// Reader wrapper that emits download progress events while streaming bytes.
struct ProgressReader<R> {
    inner: R,
    read_so_far: u64,
    total: u64,
    last_percent: u8,
    app: AppHandle,
    mod_name: String,
}

impl<R: Read> Read for ProgressReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let n = self.inner.read(buf)?;
        self.read_so_far += n as u64;
        let percent = if self.total > 0 {
            ((self.read_so_far as f64 / self.total as f64) * 100.0).min(99.0) as u8
        } else {
            0
        };
        // Emit at most once per percent change to avoid event spam
        if percent > self.last_percent {
            self.last_percent = percent;
            emit_progress(&self.app, &self.mod_name, "download", percent);
        }
        Ok(n)
    }
}

/// Download the first reachable URL in `urls` into `dest`. Each URL gets up
/// to three resumable-less retries with progress events. The fallback list
/// matters because on some networks the release CDN
/// (objects.githubusercontent.com) is unreachable while api.github.com is.
fn download_file(app: &AppHandle, urls: &[String], dest: &Path, mod_name: &str) -> AppResult<()> {
    let client = github_client()?;
    let part_path = dest.with_extension("part");

    let mut last_err = String::new();
    for url in urls {
        for attempt in 0..3 {
            if attempt > 0 {
                tracing::warn!(
                    "Download attempt {} failed ({}), retrying",
                    attempt,
                    last_err
                );
                emit_progress(app, mod_name, "download", 0);
                std::thread::sleep(Duration::from_secs(2));
            } else {
                tracing::info!("Downloading from {}", url);
            }

            let result = (|| -> AppResult<()> {
                let resp = client
                    .get(url)
                    .header("Accept", "application/octet-stream")
                    .send()
                    .map_err(|e| format!("Download failed: {}", e))?
                    .error_for_status()
                    .map_err(|e| format!("Download rejected: {}", e))?;

                let total = resp.content_length().unwrap_or(0);
                let mut reader = ProgressReader {
                    inner: resp,
                    read_so_far: 0,
                    total,
                    last_percent: 0,
                    app: app.clone(),
                    mod_name: mod_name.to_string(),
                };

                let mut file = fs::File::create(&part_path)?;
                std::io::copy(&mut reader, &mut file)
                    .map_err(|e| format!("Download interrupted: {}", e))?;
                file.sync_all().ok();
                drop(file);

                // Sanity check: zip magic "PK"
                let mut magic = [0u8; 2];
                let mut check = fs::File::open(&part_path)?;
                check.read_exact(&mut magic)?;
                if &magic != b"PK" {
                    return Err("Downloaded file is not a valid zip archive".into());
                }

                fs::rename(&part_path, dest)?;
                emit_progress(app, mod_name, "download", 100);
                Ok(())
            })();

            match result {
                Ok(()) => return Ok(()),
                Err(e) => {
                    last_err = e.to_string();
                    let _ = fs::remove_file(&part_path);
                }
            }
        }
    }

    Err(last_err.into())
}

// ─── Extraction ──────────────────────────────────────────────────────────────

/// Extract a zip archive into `staging`, sanitizing entry names (reject
/// absolute paths and `..` traversal; normalize backslashes).
fn extract_zip(zip_path: &Path, staging: &Path) -> AppResult<usize> {
    let file = fs::File::open(zip_path)?;
    let mut archive =
        zip::ZipArchive::new(file).map_err(|e| format!("Failed to open archive: {}", e))?;

    let count = archive.len();
    for i in 0..count {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| AppError::Parse(format!("Failed to read zip entry {}: {}", i, e)))?;
        let raw_name = entry.name().replace('\\', "/");
        if raw_name.starts_with('/') || raw_name.contains(':') {
            continue; // absolute path, skip
        }
        let rel = PathBuf::from(&raw_name);
        if rel
            .components()
            .any(|c| matches!(c, std::path::Component::ParentDir))
        {
            tracing::warn!("Skipping unsafe zip entry: {}", raw_name);
            continue;
        }
        let out_path = staging.join(&rel);

        if entry.is_dir() {
            fs::create_dir_all(&out_path)?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut out_file = fs::File::create(&out_path)?;
            std::io::copy(&mut entry, &mut out_file)?;
        }
    }
    Ok(count)
}

/// Find the deepest-first file matching any marker name inside `root`.
fn find_marker(root: &Path, markers: &[&str]) -> Option<PathBuf> {
    let mut best: Option<(usize, PathBuf)> = None;
    for entry in WalkDir::new(root).max_depth(6).into_iter().flatten() {
        if !entry.file_type().is_file() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if markers.iter().any(|m| m.eq_ignore_ascii_case(&name)) {
            let depth = entry.depth();
            if best.as_ref().map(|(d, _)| depth < *d).unwrap_or(true) {
                best = Some((depth, entry.path().to_path_buf()));
            }
        }
    }
    best.map(|(_, p)| p)
}

/// Locate the UE4SS install base inside an extracted tree. The base is the
/// directory that directly contains the loader DLL (`dwmapi.dll`) or the
/// core DLL (`UE4SS.dll`), whichever is found shallower.
fn find_ue4ss_base(staging: &Path) -> Option<PathBuf> {
    find_marker(staging, KNOWN_LOADER_DLLS).map(|p| {
        // dwmapi.dll at base root → parent is the base dir itself
        p.parent().unwrap_or(staging).to_path_buf()
    })
}

/// Recursively copy `src` into `dst`, collecting copied relative paths.
fn copy_tree(src: &Path, dst: &Path, collected: &mut Vec<String>) -> AppResult<()> {
    for entry in WalkDir::new(src)
        .min_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let rel = match entry.path().strip_prefix(src) {
            Ok(r) => r,
            Err(_) => continue,
        };
        let target = dst.join(rel);
        if entry.file_type().is_dir() {
            fs::create_dir_all(&target)?;
        } else if entry.file_type().is_file() {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(entry.path(), &target)
                .map_err(|e| format!("Failed to copy {}: {}", entry.path().display(), e))?;
            collected.push(rel.to_string_lossy().replace('\\', "/"));
        }
    }
    Ok(())
}

// ─── Install commands ────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct InstallResult {
    pub version: String,
    pub channel: Option<String>,
}

fn ensure_game_root(game_root: &str) -> AppResult<PathBuf> {
    let root = PathBuf::from(game_root);
    if !is_valid_game_root(&root) {
        return Err(validation("invalid-game-root"));
    }
    Ok(root)
}

/// Install (or upgrade/reinstall) UE4SS into `<game_root>/EscapeTheBackrooms/Binaries/Win64`.
///
/// `channel` is `"recommended"` (fixed known-good tag) or `"latest"`
/// (resolved from GitHub at install time).
#[tauri::command]
pub async fn install_ue4ss(
    app: AppHandle,
    game_root: String,
    channel: String,
) -> AppResult<InstallResult> {
    run_blocking(move || {
        let root = ensure_game_root(&game_root)?;
        let win64 = win64_dir(&root);
        let resolved_channel = if channel == "recommended" {
            "recommended"
        } else {
            "latest"
        };

        emit_progress(&app, "ue4ss", "resolve", 0);
        let client = github_client()?;
        let tag = if resolved_channel == "recommended" {
            UE4SS_RECOMMENDED_TAG
        } else {
            "latest"
        };
        let (version, url, asset_id) = resolve_release(&client, UE4SS_REPO, tag, "UE4SS_")?;
        let urls = vec![
            url.clone(),
            format!(
                "{}/repos/{}/releases/assets/{}",
                GITHUB_API, UE4SS_REPO, asset_id
            ),
        ];
        tracing::info!(
            "Installing UE4SS {} ({}) from {}",
            version,
            resolved_channel,
            url
        );

        // Stage in temp, then move into place
        let staging = std::env::temp_dir().join(format!("etb-sm-ue4ss-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(staging.join("zip"))?;
        fs::create_dir_all(staging.join("x"))?;

        let result = (|| -> AppResult<InstallResult> {
            let zip_path = staging.join("zip").join("ue4ss.zip");
            download_file(&app, &urls, &zip_path, "ue4ss")?;

            emit_progress(&app, "ue4ss", "extract", 0);
            extract_zip(&zip_path, &staging.join("x"))?;

            let base = find_ue4ss_base(&staging.join("x"))
                .ok_or_else(|| validation("ue4ss-layout-unrecognized"))?;

            fs::create_dir_all(&win64)?;
            let mut files = Vec::new();
            copy_tree(&base, &win64, &mut files)?;

            // Write manifest so uninstall can remove exactly what we placed
            let manifest = InstallManifest {
                tool: "etb-save-manager".to_string(),
                mod_name: "UE4SS".to_string(),
                version: version.clone(),
                channel: Some(resolved_channel.to_string()),
                files,
            };
            let ue4ss_dir = win64.join("ue4ss");
            fs::create_dir_all(&ue4ss_dir)?;
            fs::write(
                ue4ss_dir.join(MANIFEST_FILE),
                serde_json::to_vec_pretty(&manifest)?,
            )?;

            emit_progress(&app, "ue4ss", "done", 100);
            Ok(InstallResult {
                version,
                channel: Some(resolved_channel.to_string()),
            })
        })();

        fs::remove_dir_all(&staging).ok();
        result
    })
    .await
}

/// Install Nightmare Save Unlocker into `<win64>/ue4ss/Mods/NightmareSaveUnlocker`
/// and enable it in mods.txt. Requires UE4SS to be installed first.
#[tauri::command]
pub async fn install_nsu(app: AppHandle, game_root: String) -> AppResult<InstallResult> {
    run_blocking(move || {
        let root = ensure_game_root(&game_root)?;
        let win64 = win64_dir(&root);
        let mods_dir = ue4ss_mods_dir(&win64);

        // NSU is a UE4SS lua mod — it cannot run without UE4SS
        if !win64.join("ue4ss").is_dir()
            && !win64.join("UE4SS.dll").is_file()
            && !win64.join("dwmapi.dll").is_file()
        {
            return Err(validation("ue4ss-not-installed"));
        }

        emit_progress(&app, "nsu", "resolve", 0);
        let client = github_client()?;
        let (version, url, asset_id) =
            resolve_release(&client, NSU_REPO, "latest", "NightmareSaveUnlocker-")?;
        let urls = vec![
            url.clone(),
            format!(
                "{}/repos/{}/releases/assets/{}",
                GITHUB_API, NSU_REPO, asset_id
            ),
        ];
        tracing::info!("Installing NSU {} from {}", version, url);

        let staging = std::env::temp_dir().join(format!("etb-sm-nsu-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(staging.join("zip"))?;
        fs::create_dir_all(staging.join("x"))?;

        let result = (|| -> AppResult<InstallResult> {
            let zip_path = staging.join("zip").join("nsu.zip");
            download_file(&app, &urls, &zip_path, "nsu")?;

            emit_progress(&app, "nsu", "extract", 0);
            extract_zip(&zip_path, &staging.join("x"))?;

            // The mod folder is whichever directory contains Scripts/main.lua;
            // it is always installed under the canonical name NightmareSaveUnlocker.
            let main_lua = find_marker(&staging.join("x"), &["main.lua"])
                .ok_or_else(|| validation("nsu-layout-unrecognized"))?;
            let base = main_lua
                .parent()
                .and_then(|scripts| scripts.parent())
                .ok_or_else(|| validation("nsu-layout-unrecognized"))?;

            let target = mods_dir.join(NSU_MOD_NAME);
            fs::create_dir_all(&target)?;
            let mut files = Vec::new();
            copy_tree(base, &target, &mut files)?;

            let manifest = InstallManifest {
                tool: "etb-save-manager".to_string(),
                mod_name: NSU_MOD_NAME.to_string(),
                version: version.clone(),
                channel: None,
                files,
            };
            fs::write(
                target.join(MANIFEST_FILE),
                serde_json::to_vec_pretty(&manifest)?,
            )?;

            // Enable in mods.txt
            update_mods_txt(&mods_dir, NSU_MOD_NAME, Some(true))?;

            emit_progress(&app, "nsu", "done", 100);
            Ok(InstallResult {
                version,
                channel: None,
            })
        })();

        fs::remove_dir_all(&staging).ok();
        result
    })
    .await
}

/// Enable or disable Nightmare Save Unlocker by rewriting its mods.txt line.
#[tauri::command]
pub async fn set_nsu_enabled(game_root: String, enabled: bool) -> AppResult<()> {
    run_blocking(move || {
        let root = ensure_game_root(&game_root)?;
        let mods_dir = ue4ss_mods_dir(&win64_dir(&root));
        let nsu_dir = mods_dir.join(NSU_MOD_NAME);
        if !nsu_dir.is_dir() {
            return Err(validation("nsu-not-installed"));
        }
        update_mods_txt(&mods_dir, NSU_MOD_NAME, Some(enabled))
    })
    .await
}

// ─── Uninstall commands ──────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct UninstallReport {
    /// Third-party mods that were removed together with UE4SS.
    pub removed_dependent_mods: Vec<String>,
}

/// Map an IO error into a friendly message (game running → file locks).
fn io_err(context: &str, e: std::io::Error) -> AppError {
    if e.kind() == std::io::ErrorKind::PermissionDenied {
        AppError::Validation(format!("{}: permission-denied", context))
    } else {
        AppError::Io(format!("{}: {}", context, e))
    }
}

/// Delete a directory tree if it exists.
fn remove_dir_if_exists(path: &Path) -> AppResult<bool> {
    if path.exists() {
        fs::remove_dir_all(path)
            .map_err(|e| io_err(&format!("Failed to remove {}", path.display()), e))?;
        return Ok(true);
    }
    Ok(false)
}

/// Uninstall Nightmare Save Unlocker: remove the mod folder and its mods.txt
/// entry. Leaves UE4SS itself untouched.
#[tauri::command]
pub async fn uninstall_nsu(game_root: String) -> AppResult<()> {
    run_blocking(move || {
        let root = ensure_game_root(&game_root)?;
        let mods_dir = ue4ss_mods_dir(&win64_dir(&root));
        let nsu_dir = mods_dir.join(NSU_MOD_NAME);

        let dir_removed = remove_dir_if_exists(&nsu_dir)?;
        let had_line = read_mods_txt_value(&mods_dir, NSU_MOD_NAME).is_some();
        if had_line {
            update_mods_txt(&mods_dir, NSU_MOD_NAME, None)?;
        }

        if !dir_removed && !had_line {
            return Err(validation("nsu-not-installed"));
        }
        tracing::info!("NSU uninstalled from {}", mods_dir.display());
        Ok(())
    })
    .await
}

/// Uninstall UE4SS. Dependent third-party mods under `ue4ss/Mods` are removed
/// FIRST, then the UE4SS core (loader DLLs + `ue4ss` directory).
#[tauri::command]
pub async fn uninstall_ue4ss(game_root: String) -> AppResult<UninstallReport> {
    run_blocking(move || {
        let root = ensure_game_root(&game_root)?;
        let win64 = win64_dir(&root);
        let ue4ss_dir = win64.join("ue4ss");
        let mods_dir = ue4ss_mods_dir(&win64);

        let installed = ue4ss_dir.is_dir()
            || win64.join("UE4SS.dll").is_file()
            || win64.join("dwmapi.dll").is_file();
        if !installed {
            return Err(validation("ue4ss-not-installed"));
        }

        // 1. Remove dependent mods before removing UE4SS itself
        let dependent = list_dependent_mods(&mods_dir);
        for name in &dependent {
            remove_dir_if_exists(&mods_dir.join(name))?;
            tracing::info!("Removed dependent mod '{}'", name);
        }

        // 2. Remove files recorded in the install manifest (exact cleanup),
        //    falling back to known loader artifacts when no manifest exists.
        let manifest = read_manifest(&ue4ss_dir.join(MANIFEST_FILE));
        match &manifest {
            Some(m) => {
                for rel in &m.files {
                    let path = win64.join(rel.replace('/', "\\"));
                    if path.is_file() {
                        fs::remove_file(&path).map_err(|e| {
                            io_err(&format!("Failed to remove {}", path.display()), e)
                        })?;
                    }
                }
                // Loader DLLs live at Win64 root but are recorded relative to
                // the copy base; sweep the known names there as well.
                for dll in KNOWN_LOADER_DLLS {
                    let p = win64.join(dll);
                    if p.is_file() {
                        fs::remove_file(&p).ok();
                    }
                }
            }
            None => {
                // Pre-existing install not managed by this app: heuristic cleanup
                for dll in KNOWN_LOADER_DLLS {
                    let p = win64.join(dll);
                    if p.is_file() {
                        fs::remove_file(&p)
                            .map_err(|e| io_err(&format!("Failed to remove {}", p.display()), e))?;
                    }
                }
            }
        }

        // 3. Remove the whole ue4ss directory (settings, cache, Mods leftovers)
        remove_dir_if_exists(&ue4ss_dir)?;

        tracing::info!("UE4SS uninstalled; dependent mods removed: {:?}", dependent);
        Ok(UninstallReport {
            removed_dependent_mods: dependent,
        })
    })
    .await
}

/// Open the game's Win64 mod directory in the system file explorer.
/// Implemented backend-side so it does not depend on opener-plugin ACL
/// permissions.
#[tauri::command]
pub async fn open_mods_folder(game_root: String) -> AppResult<()> {
    run_blocking(move || {
        let root = ensure_game_root(&game_root)?;
        let win64 = win64_dir(&root);
        if !win64.exists() {
            return Err(format!("Directory does not exist: {}", win64.display()).into());
        }

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt as _;
            std::process::Command::new("explorer")
                .arg(win64.to_str().ok_or("Path contains invalid characters")?)
                .creation_flags(0x0800_0000)
                .spawn()
                .map_err(|e| format!("Failed to open folder: {}", e))?;
        }

        #[cfg(target_os = "macos")]
        std::process::Command::new("open")
            .arg(&win64)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;

        #[cfg(target_os = "linux")]
        std::process::Command::new("xdg-open")
            .arg(&win64)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;

        Ok(())
    })
    .await
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    fn temp_mods_dir(tag: &str) -> PathBuf {
        static COUNTER: AtomicU32 = AtomicU32::new(0);
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir =
            std::env::temp_dir().join(format!("etb-sm-test-{}-{}-{}", tag, std::process::id(), n));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn parse_line_reads_value() {
        assert_eq!(
            parse_mods_line("NightmareSaveUnlocker : 1\n", "NightmareSaveUnlocker"),
            Some(1)
        );
        assert_eq!(
            parse_mods_line("NightmareSaveUnlocker : 0\r\n", "NightmareSaveUnlocker"),
            Some(0)
        );
        // Case-insensitive mod-name match, arbitrary spacing
        assert_eq!(
            parse_mods_line("nightmaresaveunlocker:1", NSU_MOD_NAME),
            Some(1)
        );
        assert_eq!(parse_mods_line("OtherMod : 1\n", NSU_MOD_NAME), None);
        assert_eq!(
            parse_mods_line("NightmareSaveUnlocker :\n", NSU_MOD_NAME),
            None
        );
        assert_eq!(parse_mods_line("", NSU_MOD_NAME), None);
    }

    #[test]
    fn upsert_preserves_other_lines_and_crlf() {
        let dir = temp_mods_dir("upsert");
        let path = dir.join(MODS_TXT);
        fs::write(&path, "BPModLoaderMod : 1\r\nConsoleEnablerMod : 0\r\n").unwrap();

        update_mods_txt(&dir, NSU_MOD_NAME, Some(true)).unwrap();

        let text = fs::read_to_string(&path).unwrap();
        let lines: Vec<&str> = text.lines().collect();
        assert_eq!(lines[0], "BPModLoaderMod : 1");
        assert_eq!(lines[1], "ConsoleEnablerMod : 0");
        assert_eq!(lines[2], "NightmareSaveUnlocker : 1");
        assert!(text.contains("\r\n"), "CRLF style should be preserved");
        assert_eq!(parse_mods_line(&text, NSU_MOD_NAME), Some(1));
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn replace_is_case_insensitive_and_dedups() {
        let dir = temp_mods_dir("replace");
        let path = dir.join(MODS_TXT);
        fs::write(&path, "A : 1\nnightmaresaveunlocker : 0\nB : 1").unwrap();

        update_mods_txt(&dir, NSU_MOD_NAME, Some(true)).unwrap();
        let text = fs::read_to_string(&path).unwrap();

        assert_eq!(
            text.lines()
                .filter(|l| l
                    .to_lowercase()
                    .contains(NSU_MOD_NAME.to_lowercase().as_str()))
                .count(),
            1
        );
        assert!(text.contains("NightmareSaveUnlocker : 1"));
        assert!(text.starts_with("A : 1"));
        assert!(text.ends_with("B : 1") || text.ends_with("B : 1\n"));
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn remove_drops_only_target_line() {
        let dir = temp_mods_dir("remove");
        let path = dir.join(MODS_TXT);
        fs::write(&path, "A : 1\nNightmareSaveUnlocker : 0\nB : 1\n").unwrap();

        update_mods_txt(&dir, NSU_MOD_NAME, None).unwrap();
        let text = fs::read_to_string(&path).unwrap();

        assert_eq!(text.lines().collect::<Vec<_>>(), vec!["A : 1", "B : 1"]);
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn append_handles_missing_trailing_newline() {
        let dir = temp_mods_dir("append");
        let path = dir.join(MODS_TXT);
        fs::write(&path, "A : 1").unwrap(); // no trailing newline

        update_mods_txt(&dir, NSU_MOD_NAME, Some(false)).unwrap();
        let text = fs::read_to_string(&path).unwrap();

        assert_eq!(parse_mods_line(&text, NSU_MOD_NAME), Some(0));
        assert!(text.contains("A : 1"));
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn create_writes_fresh_file_when_absent() {
        let dir = temp_mods_dir("create");

        update_mods_txt(&dir, NSU_MOD_NAME, Some(true)).unwrap();
        let text = fs::read_to_string(dir.join(MODS_TXT)).unwrap();
        assert_eq!(text.trim_end(), "NightmareSaveUnlocker : 1");

        update_mods_txt(&dir, NSU_MOD_NAME, None).unwrap();
        assert!(
            !dir.join(MODS_TXT).exists()
                || fs::read_to_string(dir.join(MODS_TXT))
                    .unwrap()
                    .trim()
                    .is_empty()
        );
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn dependent_mods_excludes_stock_dirs() {
        let dir = temp_mods_dir("deps");
        for name in ["shared", "BPModLoaderMod", "MyCoolMod"] {
            fs::create_dir_all(dir.join(name)).unwrap();
        }
        fs::File::create(dir.join(MODS_TXT)).unwrap(); // files are not mods

        let deps = list_dependent_mods(&dir);
        assert_eq!(deps, vec!["MyCoolMod".to_string()]);
        fs::remove_dir_all(&dir).ok();
    }
}
