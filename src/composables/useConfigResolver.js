import { ref, computed } from "vue";

/**
 * Config inheritance resolver composable
 * Implements three-tier inheritance logic: individual settings > smart rules > uniform config > defaults
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

/**
 * @typedef {'easy' | 'normal' | 'hard' | 'nightmare'} DifficultyLevel
 */

/**
 * @typedef {'individual' | 'smart' | 'uniform' | 'default'} ConfigSource
 */

/**
 * @typedef {Object} UniformConfig
 * @property {{ enabled: boolean, value: string | null }} level
 * @property {{ enabled: boolean, value: DifficultyLevel | null }} difficulty
 * @property {{ enabled: boolean, value: DifficultyLevel | null }} actualDifficulty
 * @property {{ enabled: boolean, templateName: string | null }} inventory
 */

/**
 * @typedef {Object} SmartRules
 * @property {boolean} autoAssignLevel
 * @property {boolean} autoDetectDifficulty
 * @property {boolean} autoRenameDuplicates
 */

/**
 * @typedef {Object} ArchiveConfig
 * @property {string} id
 * @property {string} name
 * @property {Object} parsedInfo
 * @property {string | null} level
 * @property {DifficultyLevel | null} difficulty
 * @property {DifficultyLevel | null} actualDifficulty
 * @property {string | null} inventoryTemplate
 */

/**
 * @typedef {Object} ResolvedConfig
 * @property {string} level
 * @property {DifficultyLevel} difficulty
 * @property {DifficultyLevel} actualDifficulty
 * @property {string | null} inventoryTemplate
 * @property {Object} source - Config source tracking
 * @property {ConfigSource} source.level
 * @property {ConfigSource} source.difficulty
 * @property {ConfigSource} source.actualDifficulty
 * @property {ConfigSource} source.inventory
 */

// Default config values
const DEFAULT_CONFIG = {
  level: null,
  difficulty: "normal",
  actualDifficulty: "normal",
  inventoryTemplate: null,
};

/**
 * Create default uniform config
 * @returns {UniformConfig}
 */
export function createDefaultUniformConfig() {
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
 * @returns {SmartRules}
 */
export function createDefaultSmartRules() {
  return {
    autoAssignLevel: true,
    autoDetectDifficulty: true,
    autoRenameDuplicates: true,
  };
}

/**
 * Resolve the final configuration for a single archive
 * Inheritance priority: individual settings > smart rules > uniform config > defaults
 *
 * @param {ArchiveConfig} archive - Archive configuration
 * @param {UniformConfig} uniformConfig - Uniform configuration
 * @param {SmartRules} smartRules - Smart rules
 * @returns {ResolvedConfig} Resolved final configuration
 */
export function resolve(archive, uniformConfig, smartRules) {
  const result = {
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
 * @param {ArchiveConfig} archive
 * @param {UniformConfig} uniformConfig
 * @param {SmartRules} smartRules
 * @param {Object} source - Source tracking object (will be modified)
 * @returns {string | null}
 */
function resolveLevel(archive, uniformConfig, smartRules, source) {
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
 * @param {ArchiveConfig} archive
 * @param {UniformConfig} uniformConfig
 * @param {SmartRules} smartRules
 * @param {Object} source
 * @returns {DifficultyLevel}
 */
function resolveDifficulty(archive, uniformConfig, smartRules, source) {
  // 1. Individual settings take priority
  if (archive.difficulty !== null && archive.difficulty !== undefined) {
    source.difficulty = "individual";
    return archive.difficulty;
  }

  // 2. Smart rules
  if (smartRules.autoDetectDifficulty && archive.parsedInfo?.difficultyValue) {
    source.difficulty = "smart";
    return archive.parsedInfo.difficultyValue;
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
 * @param {ArchiveConfig} archive
 * @param {UniformConfig} uniformConfig
 * @param {SmartRules} smartRules
 * @param {Object} source
 * @returns {DifficultyLevel}
 */
function resolveActualDifficulty(archive, uniformConfig, smartRules, source) {
  // 1. Individual settings take priority
  if (archive.actualDifficulty !== null && archive.actualDifficulty !== undefined) {
    source.actualDifficulty = "individual";
    return archive.actualDifficulty;
  }

  // 2. Smart rules (actual difficulty also uses difficulty keywords)
  if (smartRules.autoDetectDifficulty && archive.parsedInfo?.difficultyValue) {
    source.actualDifficulty = "smart";
    return archive.parsedInfo.difficultyValue;
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
 * @param {ArchiveConfig} archive
 * @param {UniformConfig} uniformConfig
 * @param {Object} source
 * @returns {string | null}
 */
function resolveInventory(archive, uniformConfig, source) {
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
 * @param {ArchiveConfig[]} archives
 * @param {UniformConfig} uniformConfig
 * @param {SmartRules} smartRules
 * @returns {Map<string, ResolvedConfig>} Configuration map keyed by archive ID
 */
export function resolveAll(archives, uniformConfig, smartRules) {
  const results = new Map();

  for (const archive of archives) {
    results.set(archive.id, resolve(archive, uniformConfig, smartRules));
  }

  return results;
}

/**
 * Check if an archive has individual settings
 * @param {ArchiveConfig} archive
 * @returns {boolean}
 */
export function hasIndividualSettings(archive) {
  return (
    archive.level !== null ||
    archive.difficulty !== null ||
    archive.actualDifficulty !== null ||
    archive.inventoryTemplate !== null
  );
}

/**
 * Config inheritance resolver composable
 * @returns {Object}
 */
export function useConfigResolver() {
  // Uniform config
  const uniformConfig = ref(createDefaultUniformConfig());

  // Smart rules
  const smartRules = ref(createDefaultSmartRules());

  /**
   * Resolve a single archive configuration
   * @param {ArchiveConfig} archive
   * @returns {ResolvedConfig}
   */
  const resolveArchive = (archive) => {
    return resolve(archive, uniformConfig.value, smartRules.value);
  };

  /**
   * Batch resolve archive configurations
   * @param {ArchiveConfig[]} archives
   * @returns {Map<string, ResolvedConfig>}
   */
  const resolveArchives = (archives) => {
    return resolveAll(archives, uniformConfig.value, smartRules.value);
  };

  /**
   * Update uniform configuration
   * @param {Partial<UniformConfig>} updates
   */
  const updateUniformConfig = (updates) => {
    uniformConfig.value = { ...uniformConfig.value, ...updates };
  };

  /**
   * Update smart rules
   * @param {Partial<SmartRules>} updates
   */
  const updateSmartRules = (updates) => {
    smartRules.value = { ...smartRules.value, ...updates };
  };

  /**
   * Reset to default configuration
   */
  const resetConfig = () => {
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
