import { ref, computed } from "vue";

/**
 * Validator composable
 * Used to validate archive configuration completeness and correctness
 *
 * Requirements: 13.1, 13.2, 13.3
 */

/**
 * @typedef {'empty_name' | 'missing_level' | 'duplicate_name'} ValidationErrorType
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} archiveId - Archive ID
 * @property {string} field - Error field
 * @property {string} message - Error message
 * @property {ValidationErrorType} type - Error type
 */

/**
 * @typedef {Object} ValidationWarning
 * @property {string} archiveId - Archive ID
 * @property {string} message - Warning message
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {ValidationError[]} errors - Error list
 * @property {ValidationWarning[]} warnings - Warning list
 */

/**
 * @typedef {Object} ArchiveConfig
 * @property {string} id
 * @property {string} name
 * @property {string | null} finalLevel - Final resolved level
 */

/**
 * Check if name is empty
 * @param {string} name
 * @returns {boolean}
 */
export function isEmptyName(name) {
  return !name || typeof name !== "string" || name.trim() === "";
}

/**
 * Find duplicate names
 * @param {ArchiveConfig[]} archives
 * @returns {Map<string, string[]>} Map of name to duplicate archive ID list
 */
export function findDuplicateNames(archives) {
  const nameMap = new Map();
  const duplicates = new Map();

  for (const archive of archives) {
    const name = archive.name?.trim().toLowerCase();
    if (!name) continue;

    if (!nameMap.has(name)) {
      nameMap.set(name, []);
    }
    nameMap.get(name).push(archive.id);
  }

  for (const [name, ids] of nameMap) {
    if (ids.length > 1) {
      duplicates.set(name, ids);
    }
  }

  return duplicates;
}

/**
 * Validate a single archive
 * @param {ArchiveConfig} archive
 * @param {Set<string>} duplicateIds - Set of archive IDs with duplicate names
 * @returns {{ errors: ValidationError[], warnings: ValidationWarning[] }}
 */
export function validateArchive(archive, duplicateIds = new Set()) {
  const errors = [];
  const warnings = [];

  // 1. Check for empty name
  if (isEmptyName(archive.name)) {
    errors.push({
      archiveId: archive.id,
      field: "name",
      message: "存档名称不能为空",
      type: "empty_name",
    });
  }

  // 2. Check required fields - level
  if (archive.finalLevel === null || archive.finalLevel === undefined) {
    errors.push({
      archiveId: archive.id,
      field: "level",
      message: "请指定层级",
      type: "missing_level",
    });
  }

  // 3. Check for duplicate names (as warning)
  if (duplicateIds.has(archive.id)) {
    warnings.push({
      archiveId: archive.id,
      message: "存在重复的存档名称",
    });
  }

  return { errors, warnings };
}

/**
 * Validate all archives
 * @param {ArchiveConfig[]} archives
 * @returns {ValidationResult}
 */
export function validate(archives) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!Array.isArray(archives) || archives.length === 0) {
    return result;
  }

  // Find duplicate names
  const duplicates = findDuplicateNames(archives);
  const duplicateIds = new Set();
  for (const ids of duplicates.values()) {
    for (const id of ids) {
      duplicateIds.add(id);
    }
  }

  // Validate each archive
  for (const archive of archives) {
    const { errors, warnings } = validateArchive(archive, duplicateIds);
    result.errors.push(...errors);
    result.warnings.push(...warnings);
  }

  // If there are errors, validation fails
  result.isValid = result.errors.length === 0;

  return result;
}

/**
 * Get validation errors for an archive
 * @param {ValidationResult} validationResult
 * @param {string} archiveId
 * @returns {ValidationError[]}
 */
export function getArchiveErrors(validationResult, archiveId) {
  return validationResult.errors.filter((e) => e.archiveId === archiveId);
}

/**
 * Get validation warnings for an archive
 * @param {ValidationResult} validationResult
 * @param {string} archiveId
 * @returns {ValidationWarning[]}
 */
export function getArchiveWarnings(validationResult, archiveId) {
  return validationResult.warnings.filter((w) => w.archiveId === archiveId);
}

/**
 * Check if an archive has errors
 * @param {ValidationResult} validationResult
 * @param {string} archiveId
 * @returns {boolean}
 */
export function hasArchiveErrors(validationResult, archiveId) {
  return validationResult.errors.some((e) => e.archiveId === archiveId);
}

/**
 * Get validation statistics
 * @param {ValidationResult} validationResult
 * @returns {{ errorCount: number, warningCount: number, affectedArchives: number }}
 */
export function getValidationStats(validationResult) {
  const affectedArchiveIds = new Set([
    ...validationResult.errors.map((e) => e.archiveId),
    ...validationResult.warnings.map((w) => w.archiveId),
  ]);

  return {
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
    affectedArchives: affectedArchiveIds.size,
  };
}

/**
 * Validator composable
 * @returns {Object}
 */
export function useValidator() {
  // Validation result
  const validationResult = ref({
    isValid: true,
    errors: [],
    warnings: [],
  });

  /**
   * Validate archive list
   * @param {ArchiveConfig[]} archives
   * @returns {ValidationResult}
   */
  const validateArchives = (archives) => {
    validationResult.value = validate(archives);
    return validationResult.value;
  };

  /**
   * Clear validation result
   */
  const clearValidation = () => {
    validationResult.value = {
      isValid: true,
      errors: [],
      warnings: [],
    };
  };

  // Computed properties
  const isValid = computed(() => validationResult.value.isValid);
  const errorCount = computed(() => validationResult.value.errors.length);
  const warningCount = computed(() => validationResult.value.warnings.length);

  const stats = computed(() => getValidationStats(validationResult.value));

  /**
   * Get errors for a specific archive
   * @param {string} archiveId
   * @returns {ValidationError[]}
   */
  const getErrorsForArchive = (archiveId) => {
    return getArchiveErrors(validationResult.value, archiveId);
  };

  /**
   * Get warnings for a specific archive
   * @param {string} archiveId
   * @returns {ValidationWarning[]}
   */
  const getWarningsForArchive = (archiveId) => {
    return getArchiveWarnings(validationResult.value, archiveId);
  };

  /**
   * Check if a specific archive has errors
   * @param {string} archiveId
   * @returns {boolean}
   */
  const archiveHasErrors = (archiveId) => {
    return hasArchiveErrors(validationResult.value, archiveId);
  };

  return {
    // State
    validationResult,
    isValid,
    errorCount,
    warningCount,
    stats,

    // Methods
    validateArchives,
    clearValidation,
    getErrorsForArchive,
    getWarningsForArchive,
    archiveHasErrors,

    // Export pure functions
    validate,
    validateArchive,
    isEmptyName,
    findDuplicateNames,
    getArchiveErrors,
    getArchiveWarnings,
    hasArchiveErrors,
    getValidationStats,
  };
}
