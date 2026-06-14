import { describe, it, expect, beforeEach, vi } from "vitest";
import { useArchiveFilters } from "../useArchiveFilters";
import type { ArchiveData } from "../../types";

const createArchive = (overrides: Partial<ArchiveData> = {}): ArchiveData => ({
  id: 1,
  name: "Test Archive",
  currentLevel: "Level0",
  gameMode: "multiplayer",
  archiveDifficulty: "normal",
  actualDifficulty: "normal",
  isVisible: true,
  path: "/test/path",
  date: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("useArchiveFilters", () => {
  let filters: ReturnType<typeof useArchiveFilters>;

  beforeEach(() => {
    filters = useArchiveFilters();
  });

  describe("applyFiltersImmediate", () => {
    const archives = [
      createArchive({ id: 1, name: "Alpha Save", archiveDifficulty: "easy", isVisible: true }),
      createArchive({ id: 2, name: "Beta Save", archiveDifficulty: "hard", isVisible: false }),
      createArchive({ id: 3, name: "Gamma Save", archiveDifficulty: "normal", isVisible: true }),
    ];

    it("returns all archives when no filters applied", () => {
      const result = filters.applyFiltersImmediate(archives, {
        searchQuery: "",
        selectedGameMode: "",
        selectedArchiveDifficulty: "",
        selectedActualDifficulty: "",
        selectedVisibility: "",
      });
      expect(result).toHaveLength(3);
    });

    it("filters by search query", () => {
      const result = filters.applyFiltersImmediate(archives, {
        searchQuery: "alpha",
        selectedGameMode: "",
        selectedArchiveDifficulty: "",
        selectedActualDifficulty: "",
        selectedVisibility: "",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("search query is case-insensitive", () => {
      const result = filters.applyFiltersImmediate(archives, {
        searchQuery: "ALPHA",
        selectedGameMode: "",
        selectedArchiveDifficulty: "",
        selectedActualDifficulty: "",
        selectedVisibility: "",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("filters by archive difficulty", () => {
      const result = filters.applyFiltersImmediate(archives, {
        searchQuery: "",
        selectedGameMode: "",
        selectedArchiveDifficulty: "hard",
        selectedActualDifficulty: "",
        selectedVisibility: "",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("filters by actual difficulty", () => {
      const archives2 = [
        createArchive({ id: 1, name: "A", actualDifficulty: "easy" }),
        createArchive({ id: 2, name: "B", actualDifficulty: "hard" }),
      ];
      const result = filters.applyFiltersImmediate(archives2, {
        searchQuery: "",
        selectedGameMode: "",
        selectedArchiveDifficulty: "",
        selectedActualDifficulty: "easy",
        selectedVisibility: "",
      });
      expect(result).toHaveLength(1);
    });

    it("filters by visibility (visible)", () => {
      const result = filters.applyFiltersImmediate(archives, {
        searchQuery: "",
        selectedGameMode: "",
        selectedArchiveDifficulty: "",
        selectedActualDifficulty: "",
        selectedVisibility: "visible",
      });
      expect(result).toHaveLength(2);
      expect(result.every((a) => a.isVisible)).toBe(true);
    });

    it("filters by visibility (hidden)", () => {
      const result = filters.applyFiltersImmediate(archives, {
        searchQuery: "",
        selectedGameMode: "",
        selectedArchiveDifficulty: "",
        selectedActualDifficulty: "",
        selectedVisibility: "hidden",
      });
      expect(result).toHaveLength(1);
      expect(result[0].isVisible).toBe(false);
    });

    it("combines multiple filters", () => {
      const result = filters.applyFiltersImmediate(archives, {
        searchQuery: "save",
        selectedGameMode: "",
        selectedArchiveDifficulty: "easy",
        selectedActualDifficulty: "",
        selectedVisibility: "visible",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("returns empty array for null/empty archives", () => {
      expect(filters.applyFiltersImmediate([], { searchQuery: "a", selectedGameMode: "", selectedArchiveDifficulty: "", selectedActualDifficulty: "", selectedVisibility: "" })).toEqual([]);
    });
  });

  describe("hasActiveFilters", () => {
    it("is false when no filters are set", () => {
      expect(filters.hasActiveFilters.value).toBe(false);
    });

    it("is true when search query is set", () => {
      filters.updateFilters({
        searchQuery: "test",
        selectedGameMode: "",
        selectedArchiveDifficulty: "",
        selectedActualDifficulty: "",
        selectedVisibility: "",
      });
      expect(filters.hasActiveFilters.value).toBe(true);
    });

    it("is true when difficulty filter is set", () => {
      filters.updateFilters({
        searchQuery: "",
        selectedGameMode: "",
        selectedArchiveDifficulty: "hard",
        selectedActualDifficulty: "",
        selectedVisibility: "",
      });
      expect(filters.hasActiveFilters.value).toBe(true);
    });
  });

  describe("updateFilters", () => {
    it("updates the filter state", () => {
      filters.updateFilters({
        searchQuery: "new query",
        selectedGameMode: "",
        selectedArchiveDifficulty: "easy",
        selectedActualDifficulty: "",
        selectedVisibility: "",
      });
      expect(filters.lastSearchFilters.value.searchQuery).toBe("new query");
      expect(filters.lastSearchFilters.value.selectedArchiveDifficulty).toBe("easy");
    });
  });

  describe("resetFilters", () => {
    it("resets all filters to defaults", () => {
      filters.updateFilters({
        searchQuery: "test",
        selectedGameMode: "multiplayer",
        selectedArchiveDifficulty: "hard",
        selectedActualDifficulty: "easy",
        selectedVisibility: "visible",
      });
      filters.resetFilters();
      expect(filters.lastSearchFilters.value).toEqual({
        searchQuery: "",
        selectedGameMode: "",
        selectedArchiveDifficulty: "",
        selectedActualDifficulty: "",
        selectedVisibility: "",
      });
      expect(filters.hasActiveFilters.value).toBe(false);
    });
  });

  describe("debouncedApplyFilters", () => {
    it("calls callback with filtered results", () => {
      const archives = [createArchive({ id: 1, name: "Test" })];
      const callback = vi.fn();
      filters.debouncedApplyFilters(
        archives,
        { searchQuery: "", selectedGameMode: "", selectedArchiveDifficulty: "", selectedActualDifficulty: "", selectedVisibility: "" },
        callback,
      );
      expect(callback).toHaveBeenCalledWith(archives);
    });

    it("skips execution when called too quickly", () => {
      const archives = [createArchive({ id: 1, name: "Test" })];
      const callback = vi.fn();
      const emptyFilters = { searchQuery: "", selectedGameMode: "", selectedArchiveDifficulty: "", selectedActualDifficulty: "", selectedVisibility: "" };
      filters.debouncedApplyFilters(archives, emptyFilters, callback);
      // Second call within 250ms
      filters.debouncedApplyFilters(archives, emptyFilters, callback);
      // Callback should only be called once (first call)
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
