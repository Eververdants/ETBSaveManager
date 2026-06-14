// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";

// Polyfill localStorage for test environment (needed by storageService migration)
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    get length(): number {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  } as Storage;
}

import { getItem, setItem, removeItem, clear, keys, isInitialized, initStorage, flush } from "../storageService";

// The storage module has module-level state (cache object).
// Since imports are cached, we test the exported functions.
// setItem/getItem work synchronously on the in-memory cache.

// Mock @tauri-apps/plugin-fs globally
vi.mock("@tauri-apps/plugin-fs", () => ({
  BaseDirectory: { AppData: "AppData" },
  exists: vi.fn().mockResolvedValue(true),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readTextFile: vi.fn().mockResolvedValue("{}"),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
}));

describe("storageService", () => {
  beforeEach(() => {
    clear();
  });

  // =========================================================================
  // getItem / setItem
  // =========================================================================
  describe("getItem", () => {
    it("returns default value when key does not exist", () => {
      expect(getItem("nonexistent")).toBeNull();
      expect(getItem("nonexistent", "default")).toBe("default");
    });

    it("returns stored value after setItem", () => {
      setItem("theme", "dark");
      expect(getItem("theme")).toBe("dark");
    });

    it("stores and retrieves different types", () => {
      setItem("stringKey", "value");
      setItem("numberKey", 42);
      setItem("boolKey", true);
      setItem("objectKey", { a: 1, b: 2 });

      expect(getItem("stringKey")).toBe("value");
      expect(getItem("numberKey")).toBe(42);
      expect(getItem("boolKey")).toBe(true);
      expect(getItem("objectKey")).toEqual({ a: 1, b: 2 });
    });

    it("overwrites existing key", () => {
      setItem("key", "first");
      setItem("key", "second");
      expect(getItem("key")).toBe("second");
    });
  });

  // =========================================================================
  // removeItem
  // =========================================================================
  describe("removeItem", () => {
    it("removes a stored key", () => {
      setItem("key", "value");
      removeItem("key");
      expect(getItem("key")).toBeNull();
    });

    it("does nothing when key does not exist", () => {
      expect(() => removeItem("nonexistent")).not.toThrow();
    });
  });

  // =========================================================================
  // clear
  // =========================================================================
  describe("clear", () => {
    it("removes all stored keys", () => {
      setItem("key1", "value1");
      setItem("key2", "value2");
      clear();
      expect(getItem("key1")).toBeNull();
      expect(getItem("key2")).toBeNull();
    });

    it("removes all internal keys after clear", () => {
      setItem("a", 1);
      setItem("b", 2);
      clear();
      expect(keys()).toEqual([]);
    });
  });

  // =========================================================================
  // keys
  // =========================================================================
  describe("keys", () => {
    it("returns empty array when no keys stored", () => {
      expect(keys()).toEqual([]);
    });

    it("returns all stored keys", () => {
      setItem("theme", "dark");
      setItem("language", "zh-CN");
      expect(keys()).toEqual(expect.arrayContaining(["theme", "language"]));
    });

    it("does not include internal keys (starting with _)", () => {
      setItem("visible", true);
      // Internal keys like _migrated are filtered out
      const allKeys = keys();
      expect(allKeys.every((k) => !k.startsWith("_"))).toBe(true);
    });
  });

  // =========================================================================
  // isInitialized
  // =========================================================================
  describe("isInitialized", () => {
    it("returns false before init", () => {
      expect(isInitialized()).toBe(false);
    });
  });

  // =========================================================================
  // flush / initStorage
  // =========================================================================
  describe("flush", () => {
    it("is callable and does not throw", async () => {
      setItem("key", "value");
      await expect(flush()).resolves.toBeUndefined();
    });
  });

  describe("initStorage", () => {
    it("returns a promise and completes", async () => {
      await expect(initStorage()).resolves.toBeUndefined();
    });
  });
});
