import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  highlightMatch,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} from "../useArchiveSearchFilter";

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
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        "archive-search-history",
        JSON.stringify(["new query"]),
      );
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
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        "archive-search-history",
        JSON.stringify(["trimmed"]),
      );
    });
  });

  describe("clearSearchHistory", () => {
    it("removes history from sessionStorage", () => {
      clearSearchHistory();
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("archive-search-history");
    });
  });
});
