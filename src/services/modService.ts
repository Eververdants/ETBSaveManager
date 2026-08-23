/**
 * Mod management service — frontend bridge to the Rust mod commands.
 *
 * Covers game-path validation, install/uninstall of UE4SS and Nightmare Save
 * Unlocker, and the NSU enable toggle in ue4ss/Mods/mods.txt.
 */
import { invoke } from "@tauri-apps/api/core";

/** storageService key holding the saved game root path (shared by the Mods page and NSU status checks). */
export const GAME_ROOT_KEY = "modsGameRoot";

/** Result of validate_game_path — reason is a stable code for i18n mapping. */
export interface GamePathInfo {
  valid: boolean;
  canonical_root: string | null;
  win64_dir: string | null;
  reason: string;
}

/** Full status of both mods, read from the game folder on demand. */
export interface ModsStatus {
  ue4ss_installed: boolean;
  ue4ss_version: string | null;
  /** "recommended" | "latest" when installed by this app. */
  ue4ss_channel: string | null;
  /** True when UE4SS was installed (and can be precisely removed) by this app. */
  ue4ss_managed: boolean;
  nsu_installed: boolean;
  nsu_enabled: boolean;
  nsu_version: string | null;
  /** Third-party mod folders that depend on UE4SS. */
  dependent_mods: string[];
  win64_dir: string;
}

export interface InstallResult {
  version: string;
  channel: string | null;
}

/** Emitted during installs; listen with Tauri `mod-install-progress`. */
export interface ModInstallProgress {
  mod_name: "ue4ss" | "nsu";
  phase: "resolve" | "download" | "extract" | "done";
  percent: number;
}

export type Ue4ssChannel = "recommended" | "latest";

export interface UninstallReport {
  removed_dependent_mods: string[];
}

export const modService = {
  /** Validate a selected folder; accepts the root, its parent or an inner dir. */
  validateGamePath(path: string): Promise<GamePathInfo> {
    return invoke("validate_game_path", { path });
  },

  /** Probe Steam libraries for the game install; null when not found. */
  detectGamePath(): Promise<string | null> {
    return invoke("detect_game_path");
  },

  getModsStatus(gameRoot: string): Promise<ModsStatus> {
    return invoke("get_mods_status", { gameRoot });
  },

  installUe4ss(gameRoot: string, channel: Ue4ssChannel): Promise<InstallResult> {
    return invoke("install_ue4ss", { gameRoot, channel });
  },

  installNsu(gameRoot: string): Promise<InstallResult> {
    return invoke("install_nsu", { gameRoot });
  },

  setNsuEnabled(gameRoot: string, enabled: boolean): Promise<void> {
    return invoke("set_nsu_enabled", { gameRoot, enabled });
  },

  uninstallNsu(gameRoot: string): Promise<void> {
    return invoke("uninstall_nsu", { gameRoot });
  },

  uninstallUe4ss(gameRoot: string): Promise<UninstallReport> {
    return invoke("uninstall_ue4ss", { gameRoot });
  },
};

export default modService;
