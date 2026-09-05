/**
 * Archive domain types
 * Shared types for archive data, configuration, and validation.
 */

import type { ParsedNameInfo } from "./parser";

/** Difficulty levels supported by the game */
export type DifficultyLevel = "easy" | "normal" | "hard" | "nightmare";

/** Source of a resolved config value */
export type ConfigSource = "individual" | "smart" | "uniform" | "default";

/** Main archive data structure used across the app */
export interface ArchiveData {
  id: number;
  name: string;
  /** Display name from MAINSAVE's SaveDisplayNamesLookup (what the game shows). */
  displayName?: string | null;
  currentLevel: string;
  gameMode: string;
  archiveDifficulty: string;
  actualDifficulty: string;
  isVisible: boolean;
  path: string;
  date: string;
}

/** Archive configuration for batch/quick create flows */
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

/** Uniform config applied to all archives in batch create */
export interface UniformConfig {
  level: { enabled: boolean; value: string | null };
  difficulty: { enabled: boolean; value: DifficultyLevel | null };
  actualDifficulty: { enabled: boolean; value: DifficultyLevel | null };
  inventory: { enabled: boolean; templateName: string | null };
}

/** Smart rules for auto-configuring archives */
export interface SmartRules {
  autoAssignLevel: boolean;
  autoDetectDifficulty: boolean;
  autoRenameDuplicates: boolean;
}

/** Resolved config for a single archive (after applying uniform/smart/individual) */
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

/** Validation error for an archive */
export interface ValidationError {
  archiveId: string;
  field: string;
  message: string;
  type: "empty_name" | "missing_level" | "duplicate_name";
}

/** Validation warning for an archive */
export interface ValidationWarning {
  archiveId: string;
  message: string;
}

/** Result of validating a batch of archives */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/** Result of a batch quick-create operation */
export interface QuickCreateBatchResult {
  success: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
  lastCreatedName?: string | null;
}

/** Result of a batch delete operation */
export interface BatchDeleteResult {
  success: string[];
  failed: Array<{ id: string; error: unknown }>;
}
