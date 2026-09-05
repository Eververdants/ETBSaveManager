/**
 * 存档领域类型
 *
 * 命名约定（与 Rust 后端一致）：
 * - Wire 类型（Tauri 命令返回）使用 snake_case 字段，字段名与 Rust 序列化完全一致
 * - UI 类型（ArchiveData 等）使用 camelCase，由映射层从 Wire 类型转换
 */

// ============================================
// 名称解析（utils/nameParser 使用）
// ============================================

export interface NameHighlight {
  start: number;
  end: number;
  type: "index" | "level" | "difficulty";
  color: "blue" | "orange";
}

export interface ParsedNameInfo {
  originalName: string;
  index: number | null;
  levelKeyword: string | null;
  levelValue: string | null;
  difficultyKeyword: string | null;
  difficultyValue: string | null;
  backpackKeyword: string | null;
  backpackValue: string | null;
  highlights: NameHighlight[];
}

// 注：ParsedRecord / ParseResult 曾在此定义，属已移除的批量 CSV 解析（utils/nameParser），
// 全仓零引用，按 AGENTS.md「无死代码」一并移除。

// ============================================
// 存档（Wire 类型 — snake_case，与 Rust 对齐）
// ============================================

/** load_all_saves 返回的存档条目 */
export interface SaveItem {
  id?: number;
  name?: string;
  display_name?: string | null;
  current_level?: string;
  mode?: string;
  difficulty?: string;
  actual_difficulty?: string;
  is_visible?: boolean;
  path?: string;
  date?: string;
}

/** load_save_metadata 返回的元数据条目 */
export interface SaveFileMeta {
  id: number;
  name: string;
  display_name?: string | null;
  difficulty: string;
  mode: string;
  date: string;
  hidden: boolean;
  path: string;
  is_visible: boolean;
  file_size: number;
}

/** load_save_details_batch 返回的详情条目 */
export interface SaveFileDetail {
  path: string;
  current_level: string;
  actual_difficulty: string;
}

// ============================================
// 存档文件夹（应用层整理分组，archive_folders.json）
// ============================================

/** 单个整理文件夹 */
export interface ArchiveFolder {
  id: string;
  name: string;
  createdAt: number;
  /** 父文件夹 id；根目录文件夹为 null（wire 可缺省） */
  parentId?: string | null;
}

/** 文件夹持久化文件：分组定义 + 存档归属（存档文件路径小写 → 文件夹 id） */
export interface ArchiveFolderFile {
  folders: ArchiveFolder[];
  assignments: Record<string, string>;
}

// ============================================
// 存档（UI 类型 — camelCase）
// ============================================

export interface ArchiveData {
  id: number;
  name: string;
  displayName?: string | null;
  currentLevel: string;
  gameMode: string;
  archiveDifficulty: string;
  actualDifficulty: string;
  isVisible: boolean;
  path: string;
  date: string;
}

// ============================================
// 创建存档
// ============================================

/** 玩家条目（handle_new_save / handle_edit_save 的 wire 格式） */
export interface SavePlayerEntry {
  /** 纯 steam id；若在已有存档中存在完整键（steamId_+_|EOS）则复用完整键 */
  steam_id: string;
  /** 物品 id 数组（数字） */
  inventory: number[];
  sanity: number;
}

/** handle_new_save 的参数 — 字段为 snake_case，与 Rust SaveData 结构完全一致（无别名） */
export interface CreateArchiveOptions {
  archive_name: string;
  level: string;
  game_mode: string;
  difficulty: string;
  actual_difficulty: string;
  players: SavePlayerEntry[];
  basic_archive: Record<string, unknown>;
  main_ending: boolean;
  meg_unlocked: boolean;
}

export type DifficultyLevel = "easy" | "normal" | "hard" | "nightmare";

export type ConfigSource = "individual" | "smart" | "uniform" | "default";

export interface UniformConfig {
  level: { enabled: boolean; value: string | null };
  difficulty: { enabled: boolean; value: DifficultyLevel | null };
  actualDifficulty: { enabled: boolean; value: DifficultyLevel | null };
  inventory: { enabled: boolean; templateName: string | null };
}

export interface SmartRules {
  autoAssignLevel: boolean;
  autoDetectDifficulty: boolean;
  autoRenameDuplicates: boolean;
}

/** 快速创建的单条存档配置（权威定义，编辑器/校验共用） */
export interface ArchiveConfig {
  id: string;
  name: string;
  parsedInfo: ParsedNameInfo;
  level: string | null;
  difficulty: DifficultyLevel | null;
  actualDifficulty: DifficultyLevel | null;
  inventoryTemplate: string | null;
  finalLevel: string | null;
  finalDifficulty: DifficultyLevel | null;
  finalActualDifficulty: DifficultyLevel | null;
  finalInventory: unknown[];
  hasIndividualSettings: boolean;
  validationErrors: string[];
}

export interface ResolvedConfig {
  level: string | null;
  difficulty: DifficultyLevel;
  actualDifficulty: DifficultyLevel;
  inventoryTemplate: string | null;
  source: {
    level: ConfigSource;
    difficulty: ConfigSource;
    actualDifficulty: ConfigSource;
    inventory: ConfigSource;
  };
}

export interface ValidationError {
  archiveId: string;
  field: string;
  message: string;
  type: "empty_name" | "missing_level" | "duplicate_name";
}

export interface ValidationWarning {
  archiveId: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface QuickCreateBatchResult {
  success: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
  lastCreatedName?: string | null;
}

// ============================================
// 玩家
// ============================================

/** get_player_data 返回 */
export interface PlayerData {
  ids: string[];
  sanities: Record<string, number>;
  inventories: Record<string, string[]>;
}

/** steamId → 完整玩家键（steamId_+_|EOS） */
export interface PlayerIdMapping {
  [steamId: string]: string;
}

export interface PlayerTransformOptions {
  inventoryTemplate?: string[];
  sanity?: number;
}

// ============================================
// 撤销 / 删除结果
// ============================================

export interface UndoAction {
  description: string;
  undo: () => Promise<void>;
  redo?: () => Promise<void>;
}

export interface BatchDeleteResult {
  success: string[];
  failed: Array<{ id: string; error: unknown }>;
}

// ============================================
// 模组
// ============================================

/** validate_game_path 返回 — reason 为稳定错误码，由 i18n 映射 */
export interface GamePathInfo {
  valid: boolean;
  canonical_root: string | null;
  win64_dir: string | null;
  reason: string;
}

/** get_mods_status 返回 */
export interface ModsStatus {
  ue4ss_installed: boolean;
  ue4ss_version: string | null;
  ue4ss_channel: string | null;
  ue4ss_managed: boolean;
  nsu_installed: boolean;
  nsu_enabled: boolean;
  nsu_version: string | null;
  dependent_mods: string[];
  win64_dir: string;
}

export interface InstallResult {
  version: string;
  channel: string | null;
}

/** mod-install-progress 事件负载 */
export interface ModInstallProgress {
  mod_name: "ue4ss" | "nsu";
  phase: "resolve" | "download" | "extract" | "done";
  percent: number;
}

export type Ue4ssChannel = "recommended" | "latest";

export interface UninstallReport {
  removed_dependent_mods: string[];
}

// ============================================
// 更新
// ============================================

export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
  downloadUrl: string;
  directDownloadUrl: string;
  prerelease: boolean;
  shouldUpdate: boolean;
  source: string;
}

export interface UpdateSourceConfig {
  name: string;
  description: string;
  apiUrl: string;
  releasesUrl: string;
  enabled: boolean;
}
