import { ref, computed } from 'vue'

/**
 * 验证器 composable
 * 用于验证存档配置的完整性和正确性
 * 
 * Requirements: 13.1, 13.2, 13.3
 */

/**
 * @typedef {'empty_name' | 'missing_level' | 'duplicate_name'} ValidationErrorType
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} archiveId - 存档ID
 * @property {string} field - 错误字段
 * @property {string} message - 错误消息
 * @property {ValidationErrorType} type - 错误类型
 */

/**
 * @typedef {Object} ValidationWarning
 * @property {string} archiveId - 存档ID
 * @property {string} message - 警告消息
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 是否通过验证
 * @property {ValidationError[]} errors - 错误列表
 * @property {ValidationWarning[]} warnings - 警告列表
 */

/**
 * @typedef {Object} ArchiveConfig
 * @property {string} id
 * @property {string} name
 * @property {string | null} finalLevel - 最终解析的层级
 */

/**
 * 检查名称是否为空
 * @param {string} name
 * @returns {boolean}
 */
export function isEmptyName(name) {
  return !name || typeof name !== 'string' || name.trim() === ''
}

/**
 * 查找重复名称
 * @param {ArchiveConfig[]} archives
 * @returns {Map<string, string[]>} 名称到重复存档ID列表的映射
 */
export function findDuplicateNames(archives) {
  const nameMap = new Map()
  const duplicates = new Map()

  for (const archive of archives) {
    const name = archive.name?.trim().toLowerCase()
    if (!name) continue

    if (!nameMap.has(name)) {
      nameMap.set(name, [])
    }
    nameMap.get(name).push(archive.id)
  }

  for (const [name, ids] of nameMap) {
    if (ids.length > 1) {
      duplicates.set(name, ids)
    }
  }

  return duplicates
}

/**
 * 验证单个存档
 * @param {ArchiveConfig} archive
 * @param {Set<string>} duplicateIds - 重复名称的存档ID集合
 * @returns {{ errors: ValidationError[], warnings: ValidationWarning[] }}
 */
export function validateArchive(archive, duplicateIds = new Set()) {
  const errors = []
  const warnings = []

  // 1. 检查空名称
  if (isEmptyName(archive.name)) {
    errors.push({
      archiveId: archive.id,
      field: 'name',
      message: '存档名称不能为空',
      type: 'empty_name'
    })
  }

  // 2. 检查必填字段 - 层级
  if (archive.finalLevel === null || archive.finalLevel === undefined) {
    errors.push({
      archiveId: archive.id,
      field: 'level',
      message: '请指定层级',
      type: 'missing_level'
    })
  }

  // 3. 检查重复名称（作为警告）
  if (duplicateIds.has(archive.id)) {
    warnings.push({
      archiveId: archive.id,
      message: '存在重复的存档名称'
    })
  }

  return { errors, warnings }
}

/**
 * 验证所有存档
 * @param {ArchiveConfig[]} archives
 * @returns {ValidationResult}
 */
export function validate(archives) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  }

  if (!Array.isArray(archives) || archives.length === 0) {
    return result
  }

  // 查找重复名称
  const duplicates = findDuplicateNames(archives)
  const duplicateIds = new Set()
  for (const ids of duplicates.values()) {
    for (const id of ids) {
      duplicateIds.add(id)
    }
  }

  // 验证每个存档
  for (const archive of archives) {
    const { errors, warnings } = validateArchive(archive, duplicateIds)
    result.errors.push(...errors)
    result.warnings.push(...warnings)
  }

  // 如果有错误，则验证不通过
  result.isValid = result.errors.length === 0

  return result
}

/**
 * 获取存档的验证错误
 * @param {ValidationResult} validationResult
 * @param {string} archiveId
 * @returns {ValidationError[]}
 */
export function getArchiveErrors(validationResult, archiveId) {
  return validationResult.errors.filter(e => e.archiveId === archiveId)
}

/**
 * 获取存档的验证警告
 * @param {ValidationResult} validationResult
 * @param {string} archiveId
 * @returns {ValidationWarning[]}
 */
export function getArchiveWarnings(validationResult, archiveId) {
  return validationResult.warnings.filter(w => w.archiveId === archiveId)
}

/**
 * 检查存档是否有错误
 * @param {ValidationResult} validationResult
 * @param {string} archiveId
 * @returns {boolean}
 */
export function hasArchiveErrors(validationResult, archiveId) {
  return validationResult.errors.some(e => e.archiveId === archiveId)
}

/**
 * 统计验证结果
 * @param {ValidationResult} validationResult
 * @returns {{ errorCount: number, warningCount: number, affectedArchives: number }}
 */
export function getValidationStats(validationResult) {
  const affectedArchiveIds = new Set([
    ...validationResult.errors.map(e => e.archiveId),
    ...validationResult.warnings.map(w => w.archiveId)
  ])

  return {
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
    affectedArchives: affectedArchiveIds.size
  }
}

/**
 * 验证器 composable
 * @returns {Object}
 */
export function useValidator() {
  // 验证结果
  const validationResult = ref({
    isValid: true,
    errors: [],
    warnings: []
  })

  /**
   * 验证存档列表
   * @param {ArchiveConfig[]} archives
   * @returns {ValidationResult}
   */
  const validateArchives = (archives) => {
    validationResult.value = validate(archives)
    return validationResult.value
  }

  /**
   * 清空验证结果
   */
  const clearValidation = () => {
    validationResult.value = {
      isValid: true,
      errors: [],
      warnings: []
    }
  }

  // 计算属性
  const isValid = computed(() => validationResult.value.isValid)
  const errorCount = computed(() => validationResult.value.errors.length)
  const warningCount = computed(() => validationResult.value.warnings.length)
  
  const stats = computed(() => getValidationStats(validationResult.value))

  /**
   * 获取指定存档的错误
   * @param {string} archiveId
   * @returns {ValidationError[]}
   */
  const getErrorsForArchive = (archiveId) => {
    return getArchiveErrors(validationResult.value, archiveId)
  }

  /**
   * 获取指定存档的警告
   * @param {string} archiveId
   * @returns {ValidationWarning[]}
   */
  const getWarningsForArchive = (archiveId) => {
    return getArchiveWarnings(validationResult.value, archiveId)
  }

  /**
   * 检查指定存档是否有错误
   * @param {string} archiveId
   * @returns {boolean}
   */
  const archiveHasErrors = (archiveId) => {
    return hasArchiveErrors(validationResult.value, archiveId)
  }

  return {
    // 状态
    validationResult,
    isValid,
    errorCount,
    warningCount,
    stats,
    
    // 方法
    validateArchives,
    clearValidation,
    getErrorsForArchive,
    getWarningsForArchive,
    archiveHasErrors,
    
    // 导出纯函数
    validate,
    validateArchive,
    isEmptyName,
    findDuplicateNames,
    getArchiveErrors,
    getArchiveWarnings,
    hasArchiveErrors,
    getValidationStats
  }
}
