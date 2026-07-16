import { describe, it, expect, beforeEach, vi } from "vitest";
import { highlightMatch, getSearchHistory, addSearchHistory, clearSearchHistory } from "../useArchiveSearchFilter";

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(globalThis, "sessionStorage", { value: sessionStorageMock });

describe("highlightMatch", () => {
  it("returns original text when query is empty", () => {
    expect(highlightMatch("Hello World", "")).toBe("Hello World");
  });

  it("returns original text when text is empty", () => {
    expect(highlightMatch("", "query")).toBe("");
  });

  it("returns original text when both are empty", () => {
    expect(highlightMatch("", "")).toBe("");
  });

  it("highlights matching text case-insensitively", () => {
    const result = highlightMatch("Hello World", "world");
    expect(result).toBe('Hello <mark class="search-highlight">World</mark>');
  });

  it("highlights multiple occurrences", () => {
    const result = highlightMatch("abc abc abc", "abc");
    expect(result).toBe(
      '<mark class="search-highlight">abc</mark> <mark class="search-highlight">abc</mark> <mark class="search-highlight">abc</mark>',
    );
  });

  it("escapes regex special characters in query", () => {
    const result = highlightMatch("price is $10.00", "$10.00");
    expect(result).toContain('<mark class="search-highlight">$10.00</mark>');
  });

  it("handles query with parentheses", () => {
    const result = highlightMatch("test (value)", "(value)");
    expect(result).toContain('<mark class="search-highlight">(value)</mark>');
  });

  it("returns original text for null/undefined inputs", () => {
    expect(highlightMatch(null as unknown as string, "q")).toBeFalsy();
    expect(highlightMatch(undefined as unknown as string, "q")).toBeFalsy();
  });
});

describe("Search history", () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("getSearchHistory", () => {
    it("returns empty array when no history exists", () => {
      sessionStorageMock.getItem.mockReturnValue(undefined as unknown as string);
      expect(getSearchHistory()).toEqual([]);
    });

    it("returns parsed history from sessionStorage", () => {
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(["test", "query"]));
      expect(getSearchHistory()).toEqual(["test", "query"]);
    });

    it("returns empty array on parse error", () => {
      sessionStorageMock.getItem.mockReturnValue("invalid json");
      expect(getSearchHistory()).toEqual([]);
    });
  });

  describe("addSearchHistory", () => {
    it("adds a new query to history", () => {
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      addSearchHistory("new query");
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith("archive-search-history", JSON.stringify(["new query"]));
    });

    it("does not add empty query", () => {
      addSearchHistory("");
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("does not add whitespace-only query", () => {
      addSearchHistory("   ");
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("removes duplicate and adds to front", () => {
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(["old", "existing"]));
      addSearchHistory("existing");
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        "archive-search-history",
        JSON.stringify(["existing", "old"]),
      );
    });

    it("limits history to 5 items", () => {
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(["a", "b", "c", "d", "e"]));
      addSearchHistory("f");
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        "archive-search-history",
        JSON.stringify(["f", "a", "b", "c", "d"]),
      );
    });

    it("trims whitespace from query", () => {
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      addSearchHistory("  trimmed  ");
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith("archive-search-history", JSON.stringify(["trimmed"]));
    });
  });

  describe("clearSearchHistory", () => {
    it("removes history from sessionStorage", () => {
      clearSearchHistory();
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("archive-search-history");
    });
  });
});

describe("useArchiveList", () => {
  // Minimal reactivity setup — ref/computed from Vue work in node.
  type ArchiveData = {
    id: number;
    name: string;
    currentLevel: string;
    gameMode: string;
    archiveDifficulty: string;
    actualDifficulty: string;
    isVisible: boolean;
    path: string;
    date: string;
  };

  const createArchive = (overrides: Partial<ArchiveData> = {}): ArchiveData => ({
    id: 1,
    name: "Test",
    currentLevel: "Level0",
    gameMode: "multiplayer",
    archiveDifficulty: "normal",
    actualDifficulty: "normal",
    isVisible: true,
    path: "/test",
    date: "2024-01-01T00:00:00.000Z",
    ...overrides,
  });

  it("returns all archives when no filters are set", async () => {
    const { ref } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([createArchive({ id: 1 }), createArchive({ id: 2 })]);
    const { displayArchives } = useArchiveList(archives);
    expect(displayArchives.value).toHaveLength(2);
  });

  it("filters by search query across name, level, difficulty, mode", async () => {
    const { ref, nextTick } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([createArchive({ id: 1, name: "Alpha Save" }), createArchive({ id: 2, name: "Beta Save" })]);
    const list = useArchiveList(archives);
    list.searchQuery.value = "alpha";
    await nextTick();
    expect(list.displayArchives.value).toHaveLength(1);
    expect(list.displayArchives.value[0].id).toBe(1);
  });

  it("filters by archive difficulty", async () => {
    const { ref, nextTick } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([
      createArchive({ id: 1, archiveDifficulty: "easy" }),
      createArchive({ id: 2, archiveDifficulty: "hard" }),
    ]);
    const list = useArchiveList(archives);
    list.selectedArchiveDifficulty.value = "hard";
    await nextTick();
    expect(list.displayArchives.value).toHaveLength(1);
    expect(list.displayArchives.value[0].id).toBe(2);
  });

  it("filters by visibility", async () => {
    const { ref, nextTick } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([createArchive({ id: 1, isVisible: true }), createArchive({ id: 2, isVisible: false })]);
    const list = useArchiveList(archives);
    list.selectedVisibility.value = "hidden";
    await nextTick();
    expect(list.displayArchives.value).toHaveLength(1);
    expect(list.displayArchives.value[0].isVisible).toBe(false);
  });

  it("combines multiple filters", async () => {
    const { ref, nextTick } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([
      createArchive({ id: 1, name: "Save A", archiveDifficulty: "easy", isVisible: true }),
      createArchive({ id: 2, name: "Save B", archiveDifficulty: "hard", isVisible: true }),
      createArchive({ id: 3, name: "Save C", archiveDifficulty: "easy", isVisible: false }),
    ]);
    const list = useArchiveList(archives);
    list.selectedArchiveDifficulty.value = "easy";
    list.selectedVisibility.value = "visible";
    await nextTick();
    expect(list.displayArchives.value).toHaveLength(1);
    expect(list.displayArchives.value[0].id).toBe(1);
  });

  it("resetFilters clears all filters", async () => {
    const { ref } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([createArchive({ id: 1 })]);
    const list = useArchiveList(archives);
    list.searchQuery.value = "test";
    list.selectedArchiveDifficulty.value = "hard";
    list.resetFilters();
    expect(list.searchQuery.value).toBe("");
    expect(list.selectedArchiveDifficulty.value).toBe("");
    expect(list.hasActiveFilters.value).toBe(false);
  });

  it("hasActiveFilters is false when no filters set", async () => {
    const { ref } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([createArchive()]);
    const list = useArchiveList(archives);
    expect(list.hasActiveFilters.value).toBe(false);
  });

  it("hasActiveFilters is true when search query is set", async () => {
    const { ref } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([createArchive()]);
    const list = useArchiveList(archives);
    list.searchQuery.value = "test";
    expect(list.hasActiveFilters.value).toBe(true);
  });

  it("provides search suggestions", async () => {
    const { ref, nextTick } = await import("vue");
    const { useArchiveList } = await import("../useArchiveSearchFilter");
    const archives = ref([createArchive({ id: 1, name: "Alpha Save" }), createArchive({ id: 2, name: "Beta Save" })]);
    const list = useArchiveList(archives);
    expect(list.searchSuggestions.value).toHaveLength(0);
    list.searchQuery.value = "alpha";
    await nextTick();
    expect(list.searchSuggestions.value).toHaveLength(1);
    expect(list.searchSuggestions.value[0].id).toBe(1);
  });
});
