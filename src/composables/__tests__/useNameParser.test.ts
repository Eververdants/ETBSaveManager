import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  parseName,
  parseNames,
  parseMultiple,
  parseCSV,
  parseCSVLine,
  detectDelimiter,
  expandRange,
  cleanValue,
  isCommentLine,
  isHeaderRow,
  mapColumns,
} from "../../utils/nameParser";
import type { ParsedNameInfo, ParseResult } from "../../types";

// =============================================================================
// detectDelimiter
// =============================================================================
describe("detectDelimiter", () => {
  it("returns 'none' for empty input", () => {
    expect(detectDelimiter("")).toBe("none");
    expect(detectDelimiter(null as unknown as string)).toBe("none");
    expect(detectDelimiter(undefined as unknown as string)).toBe("none");
  });

  it("detects tab delimiter", () => {
    expect(detectDelimiter("a\tb")).toBe("tab");
    expect(detectDelimiter("存档1\t噩梦")).toBe("tab");
  });

  it("detects comma delimiter", () => {
    expect(detectDelimiter("a,b,c")).toBe("comma");
  });

  it("detects semicolon delimiter", () => {
    expect(detectDelimiter("a;b;c")).toBe("semicolon");
  });

  it("gives tab priority over comma", () => {
    expect(detectDelimiter("a\tb,c")).toBe("tab");
  });

  it("returns 'none' for plain text without delimiters", () => {
    expect(detectDelimiter("just a regular name")).toBe("none");
  });
});

// =============================================================================
// parseCSVLine
// =============================================================================
describe("parseCSVLine", () => {
  it("splits basic CSV", () => {
    expect(parseCSVLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields with commas inside", () => {
    expect(parseCSVLine('a,"b,c",d')).toEqual(["a", "b,c", "d"]);
  });

  it("handles double-quote escaping", () => {
    expect(parseCSVLine('a,"""quoted""",c')).toEqual(["a", '"quoted"', "c"]);
  });

  it("trims whitespace around fields", () => {
    expect(parseCSVLine("  a , b , c  ")).toEqual(["a", "b", "c"]);
  });

  it("handles tab delimiter", () => {
    expect(parseCSVLine("a\tb\tc", "\t")).toEqual(["a", "b", "c"]);
  });

  it("handles semicolon delimiter", () => {
    expect(parseCSVLine("a;b;c", ";")).toEqual(["a", "b", "c"]);
  });

  it("handles empty fields", () => {
    expect(parseCSVLine("a,,c")).toEqual(["a", "", "c"]);
  });

  it("handles single field", () => {
    expect(parseCSVLine("just a name")).toEqual(["just a name"]);
  });
});

// =============================================================================
// cleanValue
// =============================================================================
describe("cleanValue", () => {
  it("returns null for empty/null/undefined input", () => {
    expect(cleanValue("")).toBeNull();
    expect(cleanValue(null as unknown as string)).toBeNull();
    expect(cleanValue(undefined as unknown as string)).toBeNull();
    expect(cleanValue("   ")).toBeNull();
  });

  it("returns null for placeholder values", () => {
    expect(cleanValue("-")).toBeNull();
    expect(cleanValue("null")).toBeNull();
    expect(cleanValue("NULL")).toBeNull();
  });

  it("strips surrounding quotes", () => {
    expect(cleanValue('"easy"')).toBe("easy");
    expect(cleanValue("'normal'")).toBe("normal");
  });

  it("returns trimmed value for normal input", () => {
    expect(cleanValue("  hard  ")).toBe("hard");
    expect(cleanValue("nightmare")).toBe("nightmare");
  });
});

// =============================================================================
// isCommentLine
// =============================================================================
describe("isCommentLine", () => {
  it("detects # comments", () => {
    expect(isCommentLine("# this is a comment")).toBe(true);
    expect(isCommentLine("  # indented comment")).toBe(true);
  });

  it("detects // comments", () => {
    expect(isCommentLine("// comment")).toBe(true);
    expect(isCommentLine("  // indented")).toBe(true);
  });

  it("returns false for normal text", () => {
    expect(isCommentLine("normal line")).toBe(false);
    expect(isCommentLine("")).toBe(false);
  });
});

// =============================================================================
// isHeaderRow
// =============================================================================
describe("isHeaderRow", () => {
  it("detects header row matching aliases", () => {
    expect(isHeaderRow(["存档名称", "难度"])).toBe(true);
    expect(isHeaderRow(["name", "level"])).toBe(true);
  });

  it("returns false for data rows", () => {
    expect(isHeaderRow(["save_01", "hard"])).toBe(false);
  });
});

// =============================================================================
// mapColumns
// =============================================================================
describe("mapColumns", () => {
  it("maps Chinese headers", () => {
    expect(mapColumns(["存档名称", "层级线路", "存档难度"])).toEqual({
      name: 0,
      level: 1,
      difficulty: 2,
    });
  });

  it("maps English headers", () => {
    expect(mapColumns(["name", "level", "difficulty"])).toEqual({
      name: 0,
      level: 1,
      difficulty: 2,
    });
  });

  it("defaults first column to name when no name column found", () => {
    expect(mapColumns(["level", "difficulty"])).toEqual({
      name: 0,
      level: 0,
      difficulty: 1,
    });
  });

  it("handles partial mapping", () => {
    expect(mapColumns(["存档名称", "backpack"])).toEqual({
      name: 0,
      backpack: 1,
    });
  });
});

// =============================================================================
// expandRange
// =============================================================================
describe("expandRange", () => {
  it("expands numeric range", () => {
    expect(expandRange("save_{1-3}")).toEqual(["save_1", "save_2", "save_3"]);
  });

  it("expands zero-padded numeric range", () => {
    expect(expandRange("save_[001-003]")).toEqual(["save_001", "save_002", "save_003"]);
  });

  it("expands letter range", () => {
    expect(expandRange("_{A-C}")).toEqual(["_A", "_B", "_C"]);
  });

  it("handles descending ranges", () => {
    expect(expandRange("_{5-1}")).toEqual(["_1", "_2", "_3", "_4", "_5"]);
  });

  it("handles single item (no range marker)", () => {
    expect(expandRange("save_01")).toEqual(["save_01"]);
  });

  it("limits expansion to 1000 items for large ranges", () => {
    const result = expandRange("save_{1-5000}");
    expect(result).toHaveLength(1000);
    expect(result[0]).toBe("save_1");
    expect(result[999]).toBe("save_1000");
  });

  it("handles empty template", () => {
    expect(expandRange("")).toEqual([""]);
  });

  it("handles letter range descending", () => {
    expect(expandRange("_{Z-X}")).toEqual(["_X", "_Y", "_Z"]);
  });

  it("expands single letter range", () => {
    expect(expandRange("_{A-A}")).toEqual(["_A"]);
  });

  it("handles range at start of template", () => {
    expect(expandRange("{1-3}_save")).toEqual(["1_save", "2_save", "3_save"]);
  });
});

// =============================================================================
// parseName — core name parser
// =============================================================================
describe("parseName", () => {
  it("returns empty result for null/undefined input", () => {
    const result = parseName(null as unknown as string);
    expect(result.index).toBeNull();
    expect(result.highlights).toEqual([]);
  });

  it("returns empty result for non-string input", () => {
    expect(parseName(123 as unknown as string).originalName).toBe(123);
    expect(parseName({} as unknown as string).highlights).toEqual([]);
  });

  it("extracts numeric index from end of name", () => {
    const result = parseName("save_01");
    expect(result.index).toBe(1);
    expect(result.highlights).toHaveLength(1);
    // "save_01" = 7 chars; "_01" matches at position 4, ends at 7
    expect(result.highlights[0]).toMatchObject({
      type: "index",
      color: "blue",
      start: 4,
      end: 7,
    });
  });

  it("extracts index without leading separator", () => {
    const result = parseName("archive42");
    expect(result.index).toBe(42);
    expect(result.highlights[0].start).toBe(7);
  });

  it("recognizes Chinese level keywords (主线)", () => {
    const result = parseName("主线_01");
    expect(result.levelKeyword).toBe("主线");
    expect(result.levelValue).toBe("main");
  });

  it("recognizes Chinese level keywords (支线1)", () => {
    const result = parseName("支线1_test");
    expect(result.levelKeyword).toBe("支线1");
    expect(result.levelValue).toBe("branch1");
  });

  it("recognizes English level keywords (main)", () => {
    const result = parseName("main_save");
    expect(result.levelKeyword).toBe("main");
    expect(result.levelValue).toBe("main");
  });

  it("recognizes Chinese difficulty keywords", () => {
    const result = parseName("save_噩梦");
    expect(result.difficultyKeyword).toBe("噩梦");
    expect(result.difficultyValue).toBe("nightmare");
  });

  it("recognizes English difficulty keywords", () => {
    const result = parseName("save_hard");
    expect(result.difficultyKeyword).toBe("hard");
    expect(result.difficultyValue).toBe("hard");
  });

  it("recognizes backpack keywords", () => {
    const result = parseName("save_豪华包");
    expect(result.backpackKeyword).toBe("豪华包");
    expect(result.backpackValue).toBe("deluxe");
  });

  it("parses complete name with level, difficulty and index", () => {
    const result = parseName("主线_普通_01");
    expect(result.levelValue).toBe("main");
    expect(result.difficultyValue).toBe("normal");
    expect(result.index).toBe(1);
    // Expect 3 highlights: level, difficulty, index
    expect(result.highlights).toHaveLength(3);
  });

  it("sorts highlights by start position", () => {
    const result = parseName("分支_主线_噩梦_42");
    const starts = result.highlights.map((h) => h.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("matches longer level keywords first (支线3 before 支线)", () => {
    const result = parseName("支线3_save");
    expect(result.levelKeyword).toBe("支线3");
    expect(result.levelValue).toBe("branch3");
  });

  it("matches longer difficulty keywords first (BOSS before boss)", () => {
    const result = parseName("BOSS_run");
    expect(result.difficultyKeyword).toBe("BOSS");
    expect(result.difficultyValue).toBe("nightmare");
  });

  it("returns empty result for empty string", () => {
    const result = parseName("");
    expect(result.index).toBeNull();
    expect(result.highlights).toEqual([]);
  });
});

// =============================================================================
// parseNames — array parser
// =============================================================================
describe("parseNames", () => {
  it("returns empty array for non-array input", () => {
    expect(parseNames(null as unknown as string[])).toEqual([]);
    expect(parseNames("string" as unknown as string[])).toEqual([]);
    expect(parseNames(undefined as unknown as string[])).toEqual([]);
  });

  it("parses each name in the array", () => {
    const results = parseNames(["save_01", "主线_test"]);
    expect(results).toHaveLength(2);
    expect(results[0].index).toBe(1);
    expect(results[1].levelValue).toBe("main");
  });

  it("filters out empty entries", () => {
    expect(parseNames(["a", "", "b", "  "])).toHaveLength(2);
  });
});

// =============================================================================
// parseMultiple — multi-line input parser
// =============================================================================
describe("parseMultiple", () => {
  it("returns empty result for null/undefined input", () => {
    expect(parseMultiple(null as unknown as string).records).toEqual([]);
    expect(parseMultiple(undefined as unknown as string).records).toEqual([]);
  });

  it("parses simple line-separated names", () => {
    const result: ParseResult = parseMultiple("主线_01\n支线1_02");
    expect(result.records).toHaveLength(2);
    expect(result.records[0].name).toBe("主线_01");
    expect(result.records[1].name).toBe("支线1_02");
  });

  it("detects CSV headers and maps columns", () => {
    const input = "name,difficulty\n存档1,hard\n存档2,nightmare";
    const result: ParseResult = parseMultiple(input);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].difficulty).toBe("hard");
    expect(result.records[1].difficulty).toBe("nightmare");
  });

  it("expands range markers in names", () => {
    const input = "save_{1-3}";
    const result: ParseResult = parseMultiple(input);
    expect(result.records).toHaveLength(3);
    expect(result.records[0].name).toBe("save_1");
    expect(result.records[2].name).toBe("save_3");
  });

  it("detects and reports duplicate names", () => {
    const result: ParseResult = parseMultiple("save_01\nsave_01");
    expect(result.stats.duplicates).toBe(1);
  });

  it("skips comment lines", () => {
    const input = "# this is a comment\n主线_01\n// another comment\n支线1_02";
    const result: ParseResult = parseMultiple(input);
    expect(result.records).toHaveLength(2);
  });

  it("skips empty lines", () => {
    const input = "save_01\n\n\nsave_02";
    const result: ParseResult = parseMultiple(input);
    expect(result.records).toHaveLength(2);
  });

  it("generates error when no valid data found", () => {
    const result: ParseResult = parseMultiple("# only comments");
    expect(result.records).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("parses with Chinese CSV headers", () => {
    const input = "存档名称,存档难度\n主线_01,hard";
    const result: ParseResult = parseMultiple(input);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].difficulty).toBe("hard");
  });

  it("handles tab-delimited CSV", () => {
    const input = "name\tdifficulty\nsave_01\thard";
    const result: ParseResult = parseMultiple(input);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].difficulty).toBe("hard");
  });
});

// =============================================================================
// parseCSV — alias for parseMultiple
// =============================================================================
describe("parseCSV", () => {
  it("delegates to parseMultiple", () => {
    const result: ParseResult = parseCSV("name,level\nsave_01,main");
    expect(result.records).toHaveLength(1);
    expect(result.records[0].name).toBe("save_01");
  });
});

// =============================================================================
// Property-based tests (fast-check)
// =============================================================================
describe("property-based: parseName invariants", () => {
  it("always returns an object with the expected shape", () => {
    fc.assert(
      fc.property(fc.string(), (name: string) => {
        const result: ParsedNameInfo = parseName(name);
        expect(result).toHaveProperty("originalName");
        expect(result).toHaveProperty("index");
        expect(result).toHaveProperty("levelKeyword");
        expect(result).toHaveProperty("difficultyKeyword");
        expect(result).toHaveProperty("highlights");
        // Highlights should always be sorted by start position
        for (let i = 1; i < result.highlights.length; i++) {
          expect(result.highlights[i].start).toBeGreaterThanOrEqual(result.highlights[i - 1].start);
        }
      }),
    );
  });

  it("highlights never overlap", () => {
    fc.assert(
      fc.property(fc.string(), (name: string) => {
        const result: ParsedNameInfo = parseName(name);
        for (let i = 1; i < result.highlights.length; i++) {
          expect(result.highlights[i].start).toBeGreaterThanOrEqual(result.highlights[i - 1].end);
        }
      }),
    );
  });
});

describe("property-based: expandRange invariants", () => {
  it("always returns at least one result", () => {
    fc.assert(
      fc.property(fc.string(), (template: string) => {
        const result: string[] = expandRange(template);
        expect(result.length).toBeGreaterThanOrEqual(1);
      }),
    );
  });
});

describe("property-based: parseCSVLine invariants", () => {
  it("preserves field count regardless of content", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ maxLength: 5 }).filter((s: string) => !s.includes(",") && !s.includes('"')),
          { minLength: 1, maxLength: 10 },
        ),
        (fields: string[]) => {
          const line = fields.join(",");
          const result: string[] = parseCSVLine(line);
          expect(result).toHaveLength(fields.length);
        },
      ),
    );
  });
});

describe("property-based: detectDelimiter invariants", () => {
  it("never returns undefined or empty string", () => {
    fc.assert(
      fc.property(fc.string(), (line: string) => {
        const result = detectDelimiter(line);
        expect(["tab", "comma", "semicolon", "none"]).toContain(result);
      }),
    );
  });
});
