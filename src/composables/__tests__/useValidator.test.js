import { describe, it, expect } from "vitest";
import {
  isEmptyName,
  findDuplicateNames,
  validateArchive,
  validate,
  getArchiveErrors,
  getArchiveWarnings,
  hasArchiveErrors,
  getValidationStats,
} from "../useValidator.js";

// =============================================================================
// isEmptyName
// =============================================================================
describe("isEmptyName", () => {
  it("returns true for null/undefined", () => {
    expect(isEmptyName(null)).toBe(true);
    expect(isEmptyName(undefined)).toBe(true);
  });

  it("returns true for empty string", () => {
    expect(isEmptyName("")).toBe(true);
  });

  it("returns true for whitespace-only string", () => {
    expect(isEmptyName("   ")).toBe(true);
    expect(isEmptyName("\t\n")).toBe(true);
  });

  it("returns true for non-string types", () => {
    expect(isEmptyName(0)).toBe(true);
    expect(isEmptyName({})).toBe(true);
    expect(isEmptyName([])).toBe(true);
  });

  it("returns false for valid name", () => {
    expect(isEmptyName("save_01")).toBe(false);
    expect(isEmptyName("主线_噩梦")).toBe(false);
  });
});

// =============================================================================
// findDuplicateNames
// =============================================================================
describe("findDuplicateNames", () => {
  it("returns empty map when no duplicates", () => {
    const archives = [
      { id: "1", name: "save_01" },
      { id: "2", name: "save_02" },
    ];
    const result = findDuplicateNames(archives);
    expect(result.size).toBe(0);
  });

  it("detects duplicate names", () => {
    const archives = [
      { id: "1", name: "save_01" },
      { id: "2", name: "save_01" },
      { id: "3", name: "save_02" },
    ];
    const result = findDuplicateNames(archives);
    expect(result.size).toBe(1);
    expect(result.has("save_01")).toBe(true);
    expect(result.get("save_01")).toEqual(["1", "2"]);
  });

  it("is case-insensitive", () => {
    const archives = [
      { id: "1", name: "Save_01" },
      { id: "2", name: "save_01" },
    ];
    const result = findDuplicateNames(archives);
    expect(result.size).toBe(1);
  });

  it("skips archives with empty names", () => {
    const archives = [
      { id: "1", name: "" },
      { id: "2", name: "" },
    ];
    const result = findDuplicateNames(archives);
    expect(result.size).toBe(0);
  });

  it("returns empty map for empty array", () => {
    expect(findDuplicateNames([]).size).toBe(0);
  });
});

// =============================================================================
// validateArchive
// =============================================================================
describe("validateArchive", () => {
  it("returns errors for empty name", () => {
    const archive = { id: "1", name: "", finalLevel: "main" };
    const { errors, warnings } = validateArchive(archive);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      archiveId: "1",
      field: "name",
      type: "empty_name",
    });
  });

  it("returns errors for missing level", () => {
    const archive = { id: "1", name: "save_01", finalLevel: null };
    const { errors } = validateArchive(archive);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      archiveId: "1",
      field: "level",
      type: "missing_level",
    });
  });

  it("returns warning for duplicate id", () => {
    const archive = { id: "1", name: "save_01", finalLevel: "main" };
    const { errors, warnings } = validateArchive(archive, new Set(["1"]));
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(1);
  });

  it("returns no errors/warnings for valid archive", () => {
    const archive = { id: "1", name: "save_01", finalLevel: "main" };
    const { errors, warnings } = validateArchive(archive);
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it("returns both errors and warnings when applicable", () => {
    const archive = { id: "1", name: "", finalLevel: null };
    const { errors, warnings } = validateArchive(archive, new Set(["1"]));
    expect(errors).toHaveLength(2);
    expect(warnings).toHaveLength(1);
  });
});

// =============================================================================
// validate
// =============================================================================
describe("validate", () => {
  it("returns valid result for empty array", () => {
    const result = validate([]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns valid result for non-array input", () => {
    expect(validate(null).isValid).toBe(true);
    expect(validate(undefined).isValid).toBe(true);
  });

  it("detects errors across multiple archives", () => {
    const archives = [
      { id: "1", name: "", finalLevel: "main" },
      { id: "2", name: "save_02", finalLevel: null },
    ];
    const result = validate(archives);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it("detects duplicates and reports warnings", () => {
    const archives = [
      { id: "1", name: "save_01", finalLevel: "main" },
      { id: "2", name: "save_01", finalLevel: "branch1" },
    ];
    const result = validate(archives);
    expect(result.warnings).toHaveLength(2); // 1 per duplicate archive
  });

  it("passes valid archives", () => {
    const archives = [
      { id: "1", name: "save_01", finalLevel: "main" },
      { id: "2", name: "save_02", finalLevel: "branch1" },
    ];
    const result = validate(archives);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

// =============================================================================
// getArchiveErrors / getArchiveWarnings / hasArchiveErrors / getValidationStats
// =============================================================================
describe("archive error helpers", () => {
  const validationResult = {
    isValid: false,
    errors: [
      { archiveId: "1", field: "name", message: "Name empty", type: "empty_name" },
      { archiveId: "1", field: "level", message: "Level missing", type: "missing_level" },
      { archiveId: "2", field: "name", message: "Name empty", type: "empty_name" },
    ],
    warnings: [{ archiveId: "1", message: "Duplicate name" }],
  };

  describe("getArchiveErrors", () => {
    it("filters errors by archive ID", () => {
      expect(getArchiveErrors(validationResult, "1")).toHaveLength(2);
      expect(getArchiveErrors(validationResult, "2")).toHaveLength(1);
    });

    it("returns empty array for archive with no errors", () => {
      expect(getArchiveErrors(validationResult, "999")).toEqual([]);
    });
  });

  describe("getArchiveWarnings", () => {
    it("filters warnings by archive ID", () => {
      expect(getArchiveWarnings(validationResult, "1")).toHaveLength(1);
    });

    it("returns empty array for archive with no warnings", () => {
      expect(getArchiveWarnings(validationResult, "2")).toEqual([]);
    });
  });

  describe("hasArchiveErrors", () => {
    it("returns true when archive has errors", () => {
      expect(hasArchiveErrors(validationResult, "1")).toBe(true);
    });

    it("returns false when archive has no errors", () => {
      expect(hasArchiveErrors(validationResult, "999")).toBe(false);
    });
  });

  describe("getValidationStats", () => {
    it("counts errors, warnings, and affected archives", () => {
      const stats = getValidationStats(validationResult);
      expect(stats.errorCount).toBe(3);
      expect(stats.warningCount).toBe(1);
      expect(stats.affectedArchives).toBe(2);
    });

    it("returns zeroes for empty result", () => {
      const empty = { isValid: true, errors: [], warnings: [] };
      const stats = getValidationStats(empty);
      expect(stats.errorCount).toBe(0);
      expect(stats.warningCount).toBe(0);
      expect(stats.affectedArchives).toBe(0);
    });
  });
});
