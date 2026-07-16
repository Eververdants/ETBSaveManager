import { describe, it, expect, vi } from "vitest";
import { getLevelName, useLevelUtils } from "../levelUtils";

// Mock vue-i18n
vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        "LevelName_Display.Level0": "Level 0",
        "LevelName_Display.TheHub": "The Hub",
        "LevelName_Display.Poolrooms": "Level 37 - The Poolrooms",
        "LevelName_Display.LevelFun": "Level Fun",
        "LevelName_Display.TheEnd": "The End",
      };
      return translations[key] ?? key;
    },
    te: (key: string): boolean => {
      const existingKeys: string[] = [
        "LevelName_Display.Level0",
        "LevelName_Display.TheHub",
        "LevelName_Display.Poolrooms",
        "LevelName_Display.LevelFun",
        "LevelName_Display.TheEnd",
      ];
      return existingKeys.includes(key);
    },
  }),
}));

// =============================================================================
// getLevelName (standalone)
// =============================================================================
describe("getLevelName (standalone)", () => {
  it("returns the raw key unchanged", () => {
    expect(getLevelName("Level0")).toBe("Level0");
    expect(getLevelName("TheHub")).toBe("TheHub");
    expect(getLevelName("Poolrooms")).toBe("Poolrooms");
    expect(getLevelName("NonExistent")).toBe("NonExistent");
    expect(getLevelName("")).toBe("");
  });
});

// =============================================================================
// useLevelUtils (composable)
// =============================================================================
describe("useLevelUtils", () => {
  it("returns correctly structured result", () => {
    const utils = useLevelUtils();
    expect(utils).toHaveProperty("getLevelName");
    expect(typeof utils.getLevelName).toBe("function");
  });

  it("returns translated level name when translation key exists", () => {
    const { getLevelName } = useLevelUtils();
    expect(getLevelName("Level0")).toBe("Level 0");
    expect(getLevelName("TheHub")).toBe("The Hub");
    expect(getLevelName("Poolrooms")).toBe("Level 37 - The Poolrooms");
    expect(getLevelName("LevelFun")).toBe("Level Fun");
    expect(getLevelName("TheEnd")).toBe("The End");
  });

  it("falls back to raw key when translation does not exist", () => {
    const { getLevelName } = useLevelUtils();
    expect(getLevelName("NonExistentKey")).toBe("NonExistentKey");
    expect(getLevelName("")).toBe("");
    expect(getLevelName("__invalid__")).toBe("__invalid__");
  });

  it("returns raw key for level keys the codebase uses but mock has no translation", () => {
    const { getLevelName } = useLevelUtils();
    // These are real level keys from ENDING_LEVELS that our mock doesn't cover
    expect(getLevelName("Bunker")).toBe("Bunker");
    expect(getLevelName("Level922")).toBe("Level922");
    expect(getLevelName("Level94")).toBe("Level94");
  });

  it("returns translated results consistently across multiple calls", () => {
    const { getLevelName } = useLevelUtils();
    // First call
    expect(getLevelName("Level0")).toBe("Level 0");
    // Second call with same key
    expect(getLevelName("Level0")).toBe("Level 0");
    // Call with different key
    expect(getLevelName("TheHub")).toBe("The Hub");
    // Verify first key is still correct
    expect(getLevelName("Level0")).toBe("Level 0");
  });
});
