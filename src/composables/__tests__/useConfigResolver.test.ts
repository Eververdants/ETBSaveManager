import { describe, it, expect } from "vitest";
import {
  createDefaultUniformConfig,
  createDefaultSmartRules,
  resolve,
  resolveAll,
  hasIndividualSettings,
  DEFAULT_CONFIG,
} from "../useConfigResolver";
import type { ArchiveConfig, UniformConfig, SmartRules, DifficultyLevel } from "../../types";

const createArchiveConfig = (overrides: Partial<ArchiveConfig> = {}): ArchiveConfig => ({
  id: "test-1",
  name: "Test Archive",
  parsedInfo: {
    originalName: "Test Archive",
    index: null,
    levelKeyword: null,
    levelValue: null,
    difficultyKeyword: null,
    difficultyValue: null,
    backpackKeyword: null,
    backpackValue: null,
    highlights: [],
  },
  level: null,
  difficulty: null,
  actualDifficulty: null,
  inventoryTemplate: null,
  finalLevel: null,
  finalDifficulty: null,
  finalActualDifficulty: null,
  finalInventory: [],
  hasIndividualSettings: false,
  validationErrors: [],
  ...overrides,
});

describe("createDefaultUniformConfig", () => {
  it("returns a config with all fields disabled", () => {
    const config = createDefaultUniformConfig();
    expect(config.level.enabled).toBe(false);
    expect(config.difficulty.enabled).toBe(false);
    expect(config.actualDifficulty.enabled).toBe(false);
    expect(config.inventory.enabled).toBe(false);
  });

  it("returns null values for all fields", () => {
    const config = createDefaultUniformConfig();
    expect(config.level.value).toBeNull();
    expect(config.difficulty.value).toBeNull();
    expect(config.actualDifficulty.value).toBeNull();
    expect(config.inventory.templateName).toBeNull();
  });
});

describe("createDefaultSmartRules", () => {
  it("returns all smart rules enabled by default", () => {
    const rules = createDefaultSmartRules();
    expect(rules.autoAssignLevel).toBe(true);
    expect(rules.autoDetectDifficulty).toBe(true);
    expect(rules.autoRenameDuplicates).toBe(true);
  });
});

describe("resolve", () => {
  const defaultUniform = createDefaultUniformConfig();
  const defaultSmart = createDefaultSmartRules();

  describe("level resolution", () => {
    it("uses individual level when set", () => {
      const archive = createArchiveConfig({ level: "CustomLevel" });
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.level).toBe("CustomLevel");
      expect(result.source.level).toBe("individual");
    });

    it("uses smart rule level when individual not set", () => {
      const archive = createArchiveConfig({
        parsedInfo: {
          originalName: "test",
          index: null,
          levelKeyword: "Level",
          levelValue: "SmartLevel",
          difficultyKeyword: null,
          difficultyValue: null,
          backpackKeyword: null,
          backpackValue: null,
          highlights: [],
        },
      });
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.level).toBe("SmartLevel");
      expect(result.source.level).toBe("smart");
    });

    it("uses uniform config level when smart rules disabled", () => {
      const archive = createArchiveConfig();
      const uniform: UniformConfig = {
        ...defaultUniform,
        level: { enabled: true, value: "UniformLevel" },
      };
      const smart: SmartRules = { ...defaultSmart, autoAssignLevel: false };
      const result = resolve(archive, uniform, smart);
      expect(result.level).toBe("UniformLevel");
      expect(result.source.level).toBe("uniform");
    });

    it("returns default level when nothing else applies", () => {
      const archive = createArchiveConfig();
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.level).toBe(DEFAULT_CONFIG.level);
      expect(result.source.level).toBe("default");
    });
  });

  describe("difficulty resolution", () => {
    it("uses individual difficulty when set", () => {
      const archive = createArchiveConfig({ difficulty: "hard" as DifficultyLevel });
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.difficulty).toBe("hard");
      expect(result.source.difficulty).toBe("individual");
    });

    it("uses smart rule difficulty when individual not set", () => {
      const archive = createArchiveConfig({
        parsedInfo: {
          originalName: "test",
          index: null,
          levelKeyword: null,
          levelValue: null,
          difficultyKeyword: "困难",
          difficultyValue: "hard",
          backpackKeyword: null,
          backpackValue: null,
          highlights: [],
        },
      });
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.difficulty).toBe("hard");
      expect(result.source.difficulty).toBe("smart");
    });

    it("uses uniform config difficulty", () => {
      const archive = createArchiveConfig();
      const uniform: UniformConfig = {
        ...defaultUniform,
        difficulty: { enabled: true, value: "nightmare" },
      };
      const result = resolve(archive, uniform, defaultSmart);
      expect(result.difficulty).toBe("nightmare");
      expect(result.source.difficulty).toBe("uniform");
    });

    it("returns default difficulty when nothing else applies", () => {
      const archive = createArchiveConfig();
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.difficulty).toBe("normal");
      expect(result.source.difficulty).toBe("default");
    });
  });

  describe("actual difficulty resolution", () => {
    it("uses individual actual difficulty when set", () => {
      const archive = createArchiveConfig({ actualDifficulty: "hard" as DifficultyLevel });
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.actualDifficulty).toBe("hard");
      expect(result.source.actualDifficulty).toBe("individual");
    });

    it("uses uniform config actual difficulty", () => {
      const archive = createArchiveConfig();
      const uniform: UniformConfig = {
        ...defaultUniform,
        actualDifficulty: { enabled: true, value: "easy" },
      };
      const result = resolve(archive, uniform, defaultSmart);
      expect(result.actualDifficulty).toBe("easy");
      expect(result.source.actualDifficulty).toBe("uniform");
    });
  });

  describe("inventory resolution", () => {
    it("uses individual inventory template when set", () => {
      const archive = createArchiveConfig({ inventoryTemplate: "MyTemplate" });
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.inventoryTemplate).toBe("MyTemplate");
      expect(result.source.inventory).toBe("individual");
    });

    it("uses uniform config inventory", () => {
      const archive = createArchiveConfig();
      const uniform: UniformConfig = {
        ...defaultUniform,
        inventory: { enabled: true, templateName: "UniformTemplate" },
      };
      const result = resolve(archive, uniform, defaultSmart);
      expect(result.inventoryTemplate).toBe("UniformTemplate");
      expect(result.source.inventory).toBe("uniform");
    });

    it("returns null inventory when nothing set", () => {
      const archive = createArchiveConfig();
      const result = resolve(archive, defaultUniform, defaultSmart);
      expect(result.inventoryTemplate).toBeNull();
      expect(result.source.inventory).toBe("default");
    });
  });
});

describe("resolveAll", () => {
  it("resolves multiple archives", () => {
    const archives = [
      createArchiveConfig({ id: "a1", level: "Level1" }),
      createArchiveConfig({ id: "a2", level: "Level2" }),
    ];
    const results = resolveAll(archives, createDefaultUniformConfig(), createDefaultSmartRules());
    expect(results.size).toBe(2);
    expect(results.get("a1")?.level).toBe("Level1");
    expect(results.get("a2")?.level).toBe("Level2");
  });

  it("returns empty map for empty input", () => {
    const results = resolveAll([], createDefaultUniformConfig(), createDefaultSmartRules());
    expect(results.size).toBe(0);
  });
});

describe("hasIndividualSettings", () => {
  it("returns false when all fields are null", () => {
    const archive = createArchiveConfig();
    expect(hasIndividualSettings(archive)).toBe(false);
  });

  it("returns true when level is set", () => {
    const archive = createArchiveConfig({ level: "Level1" });
    expect(hasIndividualSettings(archive)).toBe(true);
  });

  it("returns true when difficulty is set", () => {
    const archive = createArchiveConfig({ difficulty: "hard" as DifficultyLevel });
    expect(hasIndividualSettings(archive)).toBe(true);
  });

  it("returns true when actualDifficulty is set", () => {
    const archive = createArchiveConfig({ actualDifficulty: "easy" as DifficultyLevel });
    expect(hasIndividualSettings(archive)).toBe(true);
  });

  it("returns true when inventoryTemplate is set", () => {
    const archive = createArchiveConfig({ inventoryTemplate: "Template" });
    expect(hasIndividualSettings(archive)).toBe(true);
  });
});
