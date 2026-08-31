/**
 * 配置继承解析 — 三层优先级：个人设置 > 智能规则 > 统一配置 > 默认值
 * （对应 master useConfigResolver 的纯函数部分）
 */
import { FEATURES } from "../constants";
import type {
  ArchiveConfig,
  DifficultyLevel,
  ResolvedConfig,
  SmartRules,
  UniformConfig,
} from "../types";

export const DEFAULT_CONFIG: {
  level: null;
  difficulty: DifficultyLevel;
  actualDifficulty: DifficultyLevel;
  inventoryTemplate: null;
} = {
  level: null,
  difficulty: "normal",
  actualDifficulty: "normal",
  inventoryTemplate: null,
};

export function createDefaultUniformConfig(): UniformConfig {
  return {
    level: { enabled: false, value: null },
    difficulty: { enabled: false, value: null },
    actualDifficulty: { enabled: false, value: null },
    inventory: { enabled: false, templateName: null },
  };
}

export function createDefaultSmartRules(): SmartRules {
  return {
    autoAssignLevel: true,
    autoDetectDifficulty: true,
    autoRenameDuplicates: true,
  };
}

function resolveLevel(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  smartRules: SmartRules,
  source: ResolvedConfig["source"]
): string | null {
  if (archive.level !== null && archive.level !== undefined && archive.level !== "") {
    source.level = "individual";
    return archive.level;
  }
  if (smartRules.autoAssignLevel && archive.parsedInfo?.levelValue) {
    source.level = "smart";
    return archive.parsedInfo.levelValue;
  }
  if (uniformConfig.level.enabled && uniformConfig.level.value !== null) {
    source.level = "uniform";
    return uniformConfig.level.value;
  }
  source.level = "default";
  return DEFAULT_CONFIG.level;
}

function resolveDifficultyValue(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  smartRules: SmartRules,
  source: ResolvedConfig["source"]
): DifficultyLevel {
  if (archive.difficulty !== null && archive.difficulty !== undefined) {
    source.difficulty = "individual";
    return archive.difficulty;
  }
  if (smartRules.autoDetectDifficulty && archive.parsedInfo?.difficultyValue) {
    source.difficulty = "smart";
    return archive.parsedInfo.difficultyValue as DifficultyLevel;
  }
  if (uniformConfig.difficulty.enabled && uniformConfig.difficulty.value !== null) {
    source.difficulty = "uniform";
    return uniformConfig.difficulty.value;
  }
  source.difficulty = "default";
  return DEFAULT_CONFIG.difficulty;
}

function resolveActualDifficultyValue(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  smartRules: SmartRules,
  source: ResolvedConfig["source"]
): DifficultyLevel {
  // 难度合并启用时，实际难度始终镜像存档难度
  if (FEATURES.MERGE_DIFFICULTY) {
    return resolveDifficultyValue(archive, uniformConfig, smartRules, source);
  }
  if (archive.actualDifficulty !== null && archive.actualDifficulty !== undefined) {
    source.actualDifficulty = "individual";
    return archive.actualDifficulty;
  }
  if (smartRules.autoDetectDifficulty && archive.parsedInfo?.difficultyValue) {
    source.actualDifficulty = "smart";
    return archive.parsedInfo.difficultyValue as DifficultyLevel;
  }
  if (uniformConfig.actualDifficulty.enabled && uniformConfig.actualDifficulty.value !== null) {
    source.actualDifficulty = "uniform";
    return uniformConfig.actualDifficulty.value;
  }
  source.actualDifficulty = "default";
  return DEFAULT_CONFIG.actualDifficulty;
}

function resolveInventory(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  source: ResolvedConfig["source"]
): string | null {
  if (archive.inventoryTemplate !== null && archive.inventoryTemplate !== undefined) {
    source.inventory = "individual";
    return archive.inventoryTemplate;
  }
  if (uniformConfig.inventory.enabled && uniformConfig.inventory.templateName !== null) {
    source.inventory = "uniform";
    return uniformConfig.inventory.templateName;
  }
  source.inventory = "default";
  return DEFAULT_CONFIG.inventoryTemplate;
}

/** 解析单个存档的最终配置 */
export function resolve(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  smartRules: SmartRules
): ResolvedConfig {
  const source: ResolvedConfig["source"] = {
    level: "default",
    difficulty: "default",
    actualDifficulty: "default",
    inventory: "default",
  };
  return {
    level: resolveLevel(archive, uniformConfig, smartRules, source),
    difficulty: resolveDifficultyValue(archive, uniformConfig, smartRules, source),
    actualDifficulty: resolveActualDifficultyValue(archive, uniformConfig, smartRules, source),
    inventoryTemplate: resolveInventory(archive, uniformConfig, source),
    source,
  };
}

export function hasIndividualSettings(archive: ArchiveConfig): boolean {
  return (
    archive.level !== null ||
    archive.difficulty !== null ||
    archive.actualDifficulty !== null ||
    archive.inventoryTemplate !== null
  );
}
