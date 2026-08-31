/**
 * 存档配置校验 — 名称 / 层级 / 重复名（对应 master useValidator 的纯函数部分）
 */
import type { ArchiveConfig, ValidationResult } from "../types";

export function isEmptyName(name: string): boolean {
  return !name || typeof name !== "string" || name.trim() === "";
}

/** 重名 → id 列表 */
export function findDuplicateNames(archives: ArchiveConfig[]): Map<string, string[]> {
  const nameMap = new Map<string, string[]>();
  const duplicates = new Map<string, string[]>();

  for (const archive of archives) {
    const name = archive.name?.trim().toLowerCase();
    if (!name) continue;
    if (!nameMap.has(name)) nameMap.set(name, []);
    nameMap.get(name)!.push(archive.id);
  }

  for (const [name, ids] of nameMap) {
    if (ids.length > 1) duplicates.set(name, ids);
  }

  return duplicates;
}

function validateSingle(
  archive: ArchiveConfig,
  duplicateIds: Set<string>
): { errors: ValidationResult["errors"]; warnings: ValidationResult["warnings"] } {
  const errors: ValidationResult["errors"] = [];
  const warnings: ValidationResult["warnings"] = [];

  if (isEmptyName(archive.name)) {
    errors.push({ archiveId: archive.id, field: "name", message: "存档名称不能为空", type: "empty_name" });
  }
  if (archive.finalLevel === null || archive.finalLevel === undefined) {
    errors.push({ archiveId: archive.id, field: "level", message: "请指定层级", type: "missing_level" });
  }
  if (duplicateIds.has(archive.id)) {
    warnings.push({ archiveId: archive.id, message: "存在重复的存档名称" });
  }

  return { errors, warnings };
}

export function validate(archives: ArchiveConfig[]): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };
  if (!Array.isArray(archives) || archives.length === 0) return result;

  const duplicates = findDuplicateNames(archives);
  const duplicateIds = new Set<string>();
  for (const ids of duplicates.values()) {
    for (const id of ids) duplicateIds.add(id);
  }

  for (const archive of archives) {
    const { errors, warnings } = validateSingle(archive, duplicateIds);
    result.errors.push(...errors);
    result.warnings.push(...warnings);
  }

  result.isValid = result.errors.length === 0;
  return result;
}
