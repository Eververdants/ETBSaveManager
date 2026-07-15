import { ref } from "vue";
import type { Ref } from "vue";
import type { DifficultyLevel, UniformConfig, SmartRules, ArchiveConfig, ResolvedConfig } from "@/types";

/**
 * Config inheritance resolver composable
 * Implements three-tier inheritance logic: individual settings > smart rules > uniform config > defaults
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

// Default config values
const DEFAULT_CONFIG: {
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

/**
 * Create default uniform config
 */
export function createDefaultUniformConfig(): UniformConfig {
  return {
    level: {
      enabled: false,
      value: null,
    },
    difficulty: {
      enabled: false,
      value: null,
    },
    actualDifficulty: {
      enabled: false,
      value: null,
    },
    inventory: {
      enabled: false,
      templateName: null,
    },
  };
}

/**
 * Create default smart rules
 */
export function createDefaultSmartRules(): SmartRules {
  return {
    autoAssignLevel: true,
    autoDetectDifficulty: true,
    autoRenameDuplicates: true,
  };
}

/**
 * Resolve the final configuration for a single archive
 * Inheritance priority: individual settings > smart rules > uniform config > defaults
 */
export function resolve(archive: ArchiveConfig, uniformConfig: UniformConfig, smartRules: SmartRules): ResolvedConfig {
  const result: ResolvedConfig = {
    level: null,
    difficulty: DEFAULT_CONFIG.difficulty,
    actualDifficulty: DEFAULT_CONFIG.actualDifficulty,
    inventoryTemplate: DEFAULT_CONFIG.inventoryTemplate,
    source: {
      level: "default",
      difficulty: "default",
      actualDifficulty: "default",
      inventory: "default",
    },
  };

  // Resolve level
  result.level = resolveLevel(archive, uniformConfig, smartRules, result.source);

  // Resolve difficulty
  result.difficulty = resolveDifficulty(archive, uniformConfig, smartRules, result.source);

  // Resolve actual difficulty
  result.actualDifficulty = resolveActualDifficulty(archive, uniformConfig, smartRules, result.source);

  // Resolve inventory template
  result.inventoryTemplate = resolveInventory(archive, uniformConfig, result.source);

  return result;
}

/**
 * Resolve level configuration
 */
function resolveLevel(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  smartRules: SmartRules,
  source: ResolvedConfig["source"],
): string | null {
  // 1. Individual settings take priority
  if (archive.level !== null && archive.level !== undefined && archive.level !== "") {
    source.level = "individual";
    return archive.level;
  }

  // 2. Smart rules
  if (smartRules.autoAssignLevel && archive.parsedInfo?.levelValue) {
    source.level = "smart";
    return archive.parsedInfo.levelValue;
  }

  // 3. Uniform config
  if (uniformConfig.level.enabled && uniformConfig.level.value !== null) {
    source.level = "uniform";
    return uniformConfig.level.value;
  }

  // 4. Default value
  source.level = "default";
  return DEFAULT_CONFIG.level;
}

/**
 * Resolve difficulty configuration
 */
function resolveDifficulty(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  smartRules: SmartRules,
  source: ResolvedConfig["source"],
): DifficultyLevel {
  // 1. Individual settings take priority
  if (archive.difficulty !== null && archive.difficulty !== undefined) {
    source.difficulty = "individual";
    return archive.difficulty;
  }

  // 2. Smart rules
  if (smartRules.autoDetectDifficulty && archive.parsedInfo?.difficultyValue) {
    source.difficulty = "smart";
    return archive.parsedInfo.difficultyValue as DifficultyLevel;
  }

  // 3. Uniform config
  if (uniformConfig.difficulty.enabled && uniformConfig.difficulty.value !== null) {
    source.difficulty = "uniform";
    return uniformConfig.difficulty.value;
  }

  // 4. Default value
  source.difficulty = "default";
  return DEFAULT_CONFIG.difficulty;
}

/**
 * Resolve actual difficulty configuration
 */
function resolveActualDifficulty(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  smartRules: SmartRules,
  source: ResolvedConfig["source"],
): DifficultyLevel {
  // 1. Individual settings take priority
  if (archive.actualDifficulty !== null && archive.actualDifficulty !== undefined) {
    source.actualDifficulty = "individual";
    return archive.actualDifficulty;
  }

  // 2. Smart rules (actual difficulty also uses difficulty keywords)
  if (smartRules.autoDetectDifficulty && archive.parsedInfo?.difficultyValue) {
    source.actualDifficulty = "smart";
    return archive.parsedInfo.difficultyValue as DifficultyLevel;
  }

  // 3. Uniform config
  if (uniformConfig.actualDifficulty.enabled && uniformConfig.actualDifficulty.value !== null) {
    source.actualDifficulty = "uniform";
    return uniformConfig.actualDifficulty.value;
  }

  // 4. Default value
  source.actualDifficulty = "default";
  return DEFAULT_CONFIG.actualDifficulty;
}

/**
 * Resolve inventory template configuration
 */
function resolveInventory(
  archive: ArchiveConfig,
  uniformConfig: UniformConfig,
  source: ResolvedConfig["source"],
): string | null {
  // 1. Individual settings take priority
  if (archive.inventoryTemplate !== null && archive.inventoryTemplate !== undefined) {
    source.inventory = "individual";
    return archive.inventoryTemplate;
  }

  // 2. Uniform config (no smart rules for inventory)
  if (uniformConfig.inventory.enabled && uniformConfig.inventory.templateName !== null) {
    source.inventory = "uniform";
    return uniformConfig.inventory.templateName;
  }

  // 3. Default value
  source.inventory = "default";
  return DEFAULT_CONFIG.inventoryTemplate;
}

/**
 * Batch resolve configurations for multiple archives
 */
export function resolveAll(
  archives: ArchiveConfig[],
  uniformConfig: UniformConfig,
  smartRules: SmartRules,
): Map<string, ResolvedConfig> {
  const results = new Map<string, ResolvedConfig>();

  for (const archive of archives) {
    results.set(archive.id, resolve(archive, uniformConfig, smartRules));
  }

  return results;
}

/**
 * Check if an archive has individual settings
 */
export function hasIndividualSettings(archive: ArchiveConfig): boolean {
  return (
    archive.level !== null ||
    archive.difficulty !== null ||
    archive.actualDifficulty !== null ||
    archive.inventoryTemplate !== null
  );
}

interface ConfigResolverReturn {
  uniformConfig: Ref<UniformConfig>;
  smartRules: Ref<SmartRules>;
  resolveArchive: (archive: ArchiveConfig) => ResolvedConfig;
  resolveArchives: (archives: ArchiveConfig[]) => Map<string, ResolvedConfig>;
  updateUniformConfig: (updates: Partial<UniformConfig>) => void;
  updateSmartRules: (updates: Partial<SmartRules>) => void;
  resetConfig: () => void;
  resolve: (archive: ArchiveConfig, uniformConfig: UniformConfig, smartRules: SmartRules) => ResolvedConfig;
  resolveAll: (
    archives: ArchiveConfig[],
    uniformConfig: UniformConfig,
    smartRules: SmartRules,
  ) => Map<string, ResolvedConfig>;
  hasIndividualSettings: (archive: ArchiveConfig) => boolean;
  createDefaultUniformConfig: () => UniformConfig;
  createDefaultSmartRules: () => SmartRules;
}

/**
 * Config inheritance resolver composable
 */
export function useConfigResolver(): ConfigResolverReturn {
  // Uniform config
  const uniformConfig = ref(createDefaultUniformConfig());

  // Smart rules
  const smartRules = ref(createDefaultSmartRules());

  /**
   * Resolve a single archive configuration
   */
  const resolveArchive = (archive: ArchiveConfig): ResolvedConfig => {
    return resolve(archive, uniformConfig.value, smartRules.value);
  };

  /**
   * Batch resolve archive configurations
   */
  const resolveArchives = (archives: ArchiveConfig[]): Map<string, ResolvedConfig> => {
    return resolveAll(archives, uniformConfig.value, smartRules.value);
  };

  /**
   * Update uniform configuration
   */
  const updateUniformConfig = (updates: Partial<UniformConfig>): void => {
    uniformConfig.value = { ...uniformConfig.value, ...updates };
  };

  /**
   * Update smart rules
   */
  const updateSmartRules = (updates: Partial<SmartRules>): void => {
    smartRules.value = { ...smartRules.value, ...updates };
  };

  /**
   * Reset to default configuration
   */
  const resetConfig = (): void => {
    uniformConfig.value = createDefaultUniformConfig();
    smartRules.value = createDefaultSmartRules();
  };

  return {
    // State
    uniformConfig,
    smartRules,

    // Methods
    resolveArchive,
    resolveArchives,
    updateUniformConfig,
    updateSmartRules,
    resetConfig,

    // Export pure functions
    resolve,
    resolveAll,
    hasIndividualSettings,
    createDefaultUniformConfig,
    createDefaultSmartRules,
  };
}

// Export constants
export { DEFAULT_CONFIG };
