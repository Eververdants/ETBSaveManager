import { ref, computed } from 'vue'

/**
 * 配置继承解析器 composable
 * 实现三层继承逻辑：个别设置 > 智能规则 > 统一配置 > 默认值
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
 * @property {Object} source - 配置来源追踪
 * @property {ConfigSource} source.level
 * @property {ConfigSource} source.difficulty
 * @property {ConfigSource} source.actualDifficulty
 * @property {ConfigSource} source.inventory
 */

// 默认配置值
const DEFAULT_CONFIG = {
  level: null,
  difficulty: 'normal',
  actualDifficulty: 'normal',
  inventoryTemplate: null
}

/**
 * 创建默认的统一配置
 * @returns {UniformConfig}
 */
export function createDefaultUniformConfig() {
  return {
    level: {
      enabled: false,
      value: null
    },
    difficulty: {
      enabled: false,
      value: null
    },
    actualDifficulty: {
      enabled: false,
      value: null
    },
    inventory: {
      enabled: false,
      templateName: null
    }
  }
}

/**
 * 创建默认的智能规则
 * @returns {SmartRules}
 */
export function createDefaultSmartRules() {
  return {
    autoAssignLevel: true,
    autoDetectDifficulty: true,
    autoRenameDuplicates: true
  }
}

/**
 * 解析单个存档的最终配置
 * 继承优先级：个别设置 > 智能规则 > 统一配置 > 默认值
 * 
 * @param {ArchiveConfig} archive - 存档配置
 * @param {UniformConfig} uniformConfig - 统一配置
 * @param {SmartRules} smartRules - 智能规则
 * @returns {ResolvedConfig} 解析后的最终配置
 */
export function resolve(archive, uniformConfig, smartRules) {
  const result = {
    level: null,
    difficulty: DEFAULT_CONFIG.difficulty,
    actualDifficulty: DEFAULT_CONFIG.actualDifficulty,
    inventoryTemplate: DEFAULT_CONFIG.inventoryTemplate,
    source: {
      level: 'default',
      difficulty: 'default',
      actualDifficulty: 'default',
      inventory: 'default'
    }
  }

  // 解析层级
  result.level = resolveLevel(archive, uniformConfig, smartRules, result.source)
  
  // 解析难度
  result.difficulty = resolveDifficulty(archive, uniformConfig, smartRules, result.source)
  
  // 解析实际难度
  result.actualDifficulty = resolveActualDifficulty(archive, uniformConfig, smartRules, result.source)
  
  // 解析背包模板
  result.inventoryTemplate = resolveInventory(archive, uniformConfig, result.source)

  return result
}

/**
 * 解析层级配置
 * @param {ArchiveConfig} archive
 * @param {UniformConfig} uniformConfig
 * @param {SmartRules} smartRules
 * @param {Object} source - 来源追踪对象（会被修改）
 * @returns {string | null}
 */
function resolveLevel(archive, uniformConfig, smartRules, source) {
  // 1. 个别设置优先
  if (archive.level !== null && archive.level !== undefined && archive.level !== '') {
    source.level = 'individual'
    return archive.level
  }

  // 2. 智能规则
  if (smartRules.autoAssignLevel && archive.parsedInfo?.levelValue) {
    source.level = 'smart'
    return archive.parsedInfo.levelValue
  }

  // 3. 统一配置
  if (uniformConfig.level.enabled && uniformConfig.level.value !== null) {
    source.level = 'uniform'
    return uniformConfig.level.value
  }

  // 4. 默认值
  source.level = 'default'
  return DEFAULT_CONFIG.level
}

/**
 * 解析难度配置
 * @param {ArchiveConfig} archive
 * @param {UniformConfig} uniformConfig
 * @param {SmartRules} smartRules
 * @param {Object} source
 * @returns {DifficultyLevel}
 */
function resolveDifficulty(archive, uniformConfig, smartRules, source) {
  // 1. 个别设置优先
  if (archive.difficulty !== null && archive.difficulty !== undefined) {
    source.difficulty = 'individual'
    return archive.difficulty
  }

  // 2. 智能规则
  if (smartRules.autoDetectDifficulty && archive.parsedInfo?.difficultyValue) {
    source.difficulty = 'smart'
    return archive.parsedInfo.difficultyValue
  }

  // 3. 统一配置
  if (uniformConfig.difficulty.enabled && uniformConfig.difficulty.value !== null) {
    source.difficulty = 'uniform'
    return uniformConfig.difficulty.value
  }

  // 4. 默认值
  source.difficulty = 'default'
  return DEFAULT_CONFIG.difficulty
}

/**
 * 解析实际难度配置
 * @param {ArchiveConfig} archive
 * @param {UniformConfig} uniformConfig
 * @param {SmartRules} smartRules
 * @param {Object} source
 * @returns {DifficultyLevel}
 */
function resolveActualDifficulty(archive, uniformConfig, smartRules, source) {
  // 1. 个别设置优先
  if (archive.actualDifficulty !== null && archive.actualDifficulty !== undefined) {
    source.actualDifficulty = 'individual'
    return archive.actualDifficulty
  }

  // 2. 智能规则（实际难度也使用难度关键词）
  if (smartRules.autoDetectDifficulty && archive.parsedInfo?.difficultyValue) {
    source.actualDifficulty = 'smart'
    return archive.parsedInfo.difficultyValue
  }

  // 3. 统一配置
  if (uniformConfig.actualDifficulty.enabled && uniformConfig.actualDifficulty.value !== null) {
    source.actualDifficulty = 'uniform'
    return uniformConfig.actualDifficulty.value
  }

  // 4. 默认值
  source.actualDifficulty = 'default'
  return DEFAULT_CONFIG.actualDifficulty
}

/**
 * 解析背包模板配置
 * @param {ArchiveConfig} archive
 * @param {UniformConfig} uniformConfig
 * @param {Object} source
 * @returns {string | null}
 */
function resolveInventory(archive, uniformConfig, source) {
  // 1. 个别设置优先
  if (archive.inventoryTemplate !== null && archive.inventoryTemplate !== undefined) {
    source.inventory = 'individual'
    return archive.inventoryTemplate
  }

  // 2. 统一配置（背包没有智能规则）
  if (uniformConfig.inventory.enabled && uniformConfig.inventory.templateName !== null) {
    source.inventory = 'uniform'
    return uniformConfig.inventory.templateName
  }

  // 3. 默认值
  source.inventory = 'default'
  return DEFAULT_CONFIG.inventoryTemplate
}

/**
 * 批量解析多个存档的配置
 * @param {ArchiveConfig[]} archives
 * @param {UniformConfig} uniformConfig
 * @param {SmartRules} smartRules
 * @returns {Map<string, ResolvedConfig>} 以存档ID为键的配置映射
 */
export function resolveAll(archives, uniformConfig, smartRules) {
  const results = new Map()
  
  for (const archive of archives) {
    results.set(archive.id, resolve(archive, uniformConfig, smartRules))
  }
  
  return results
}

/**
 * 检查存档是否有个别设置
 * @param {ArchiveConfig} archive
 * @returns {boolean}
 */
export function hasIndividualSettings(archive) {
  return (
    archive.level !== null ||
    archive.difficulty !== null ||
    archive.actualDifficulty !== null ||
    archive.inventoryTemplate !== null
  )
}

/**
 * 配置继承解析器 composable
 * @returns {Object}
 */
export function useConfigResolver() {
  // 统一配置
  const uniformConfig = ref(createDefaultUniformConfig())
  
  // 智能规则
  const smartRules = ref(createDefaultSmartRules())

  /**
   * 解析单个存档配置
   * @param {ArchiveConfig} archive
   * @returns {ResolvedConfig}
   */
  const resolveArchive = (archive) => {
    return resolve(archive, uniformConfig.value, smartRules.value)
  }

  /**
   * 批量解析存档配置
   * @param {ArchiveConfig[]} archives
   * @returns {Map<string, ResolvedConfig>}
   */
  const resolveArchives = (archives) => {
    return resolveAll(archives, uniformConfig.value, smartRules.value)
  }

  /**
   * 更新统一配置
   * @param {Partial<UniformConfig>} updates
   */
  const updateUniformConfig = (updates) => {
    uniformConfig.value = { ...uniformConfig.value, ...updates }
  }

  /**
   * 更新智能规则
   * @param {Partial<SmartRules>} updates
   */
  const updateSmartRules = (updates) => {
    smartRules.value = { ...smartRules.value, ...updates }
  }

  /**
   * 重置为默认配置
   */
  const resetConfig = () => {
    uniformConfig.value = createDefaultUniformConfig()
    smartRules.value = createDefaultSmartRules()
  }

  return {
    // 状态
    uniformConfig,
    smartRules,
    
    // 方法
    resolveArchive,
    resolveArchives,
    updateUniformConfig,
    updateSmartRules,
    resetConfig,
    
    // 导出纯函数
    resolve,
    resolveAll,
    hasIndividualSettings,
    createDefaultUniformConfig,
    createDefaultSmartRules
  }
}

// 导出常量
export { DEFAULT_CONFIG }
