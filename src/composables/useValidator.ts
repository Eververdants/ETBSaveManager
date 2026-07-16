import { ref, computed } from "vue";
import type { ValidationError, ValidationWarning, ValidationResult, ArchiveConfig } from "@/types";

/**
 * Validator composable
 * Used to validate archive configuration completeness and correctness
 *
 * Requirements: 13.1, 13.2, 13.3
 */

/**
 * Check if name is empty
 */
export function isEmptyName(name: string): boolean {
  return !name || typeof name !== "string" || name.trim() === "";
}

/**
 * Find duplicate names
 * @returns Map of name to duplicate archive ID list
 */
export function findDuplicateNames(archives: ArchiveConfig[]): Map<string, string[]> {
  const nameMap = new Map<string, string[]>();
  const duplicates = new Map<string, string[]>();

  for (const archive of archives) {
    const name = archive.name?.trim().toLowerCase();
    if (!name) continue;

    if (!nameMap.has(name)) {
      nameMap.set(name, []);
    }
    nameMap.get(name)!.push(archive.id);
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
 */
export function validateArchive(
  archive: ArchiveConfig,
  duplicateIds: Set<string> = new Set(),
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

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
 */
export function validate(archives: ArchiveConfig[]): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!Array.isArray(archives) || archives.length === 0) {
    return result;
  }

  // Find duplicate names
  const duplicates = findDuplicateNames(archives);
  const duplicateIds = new Set<string>();
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
 */
export function getArchiveErrors(validationResult: ValidationResult, archiveId: string): ValidationError[] {
  return validationResult.errors.filter((e) => e.archiveId === archiveId);
}

/**
 * Get validation warnings for an archive
 */
export function getArchiveWarnings(validationResult: ValidationResult, archiveId: string): ValidationWarning[] {
  return validationResult.warnings.filter((w) => w.archiveId === archiveId);
}

/**
 * Check if an archive has errors
 */
export function hasArchiveErrors(validationResult: ValidationResult, archiveId: string): boolean {
  return validationResult.errors.some((e) => e.archiveId === archiveId);
}

/**
 * Get validation statistics
 */
export function getValidationStats(validationResult: ValidationResult): {
  errorCount: number;
  warningCount: number;
  affectedArchives: number;
} {
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
 */
export function useValidator() {
  // Validation result
  const validationResult = ref<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  /**
   * Validate archive list
   */
  const validateArchives = (archives: ArchiveConfig[]): ValidationResult => {
    validationResult.value = validate(archives);
    return validationResult.value;
  };

  /**
   * Clear validation result
   */
  const clearValidation = (): void => {
    validationResult.value = {
      isValid: true,
      errors: [],
      warnings: [],
    };
  };

  // Computed properties
  const isValid = computed((): boolean => validationResult.value.isValid);
  const errorCount = computed((): number => validationResult.value.errors.length);
  const warningCount = computed((): number => validationResult.value.warnings.length);

  const stats = computed((): { errorCount: number; warningCount: number; affectedArchives: number } =>
    getValidationStats(validationResult.value),
  );

  /**
   * Get errors for a specific archive
   */
  const getErrorsForArchive = (archiveId: string): ValidationError[] => {
    return getArchiveErrors(validationResult.value, archiveId);
  };

  /**
   * Get warnings for a specific archive
   */
  const getWarningsForArchive = (archiveId: string): ValidationWarning[] => {
    return getArchiveWarnings(validationResult.value, archiveId);
  };

  /**
   * Check if a specific archive has errors
   */
  const archiveHasErrors = (archiveId: string): boolean => {
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
