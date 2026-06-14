/**
 * Pure name parsing utilities
 * Extracted from useNameParser composable for better separation of concerns
 *
 * @see docs/SMART_INPUT_STANDARD.md
 */

import type { ParsedNameInfo, ParseResult, ParsedRecord } from "../types";

// ============ Keyword mapping configuration ============

// Level keyword mappings (sorted by length descending to prioritize longer matches)
export const LEVEL_KEYWORDS: Record<string, string> = {
  支线5: "branch5",
  支线4: "branch4",
  支线3: "branch3",
  支线2: "branch2",
  支线1: "branch1",
  主线A: "main",
  主线: "main",
  branch5: "branch5",
  branch4: "branch4",
  branch3: "branch3",
  branch2: "branch2",
  branch1: "branch1",
  main: "main",
};

// Difficulty keyword mappings
export const DIFFICULTY_KEYWORDS: Record<string, string> = {
  nightmare: "nightmare",
  噩梦: "nightmare",
  BOSS: "nightmare",
  Boss: "nightmare",
  boss: "nightmare",
  困难: "hard",
  hard: "hard",
  Hard: "hard",
  普通: "normal",
  normal: "normal",
  Normal: "normal",
  简单: "easy",
  easy: "easy",
  Easy: "easy",
};

// Backpack keyword mappings
export const BACKPACK_KEYWORDS: Record<string, string> = {
  新手包: "starter",
  标准包: "standard",
  豪华包: "deluxe",
  至尊包: "ultimate",
  starter: "starter",
  standard: "standard",
  deluxe: "deluxe",
  ultimate: "ultimate",
};

// CSV column name alias mappings
export const COLUMN_ALIASES: Record<string, string[]> = {
  name: ["存档名称", "name", "名称", "存档名", "title", "Name", "NAME"],
  level: ["层级线路", "level", "层级", "线路", "关卡", "route", "Level", "LEVEL"],
  difficulty: ["存档难度", "difficulty", "难度", "diff", "Difficulty", "DIFFICULTY"],
  actualDifficulty: ["实际难度", "realDifficulty", "真实难度", "actual", "ActualDifficulty"],
  backpack: ["背包配置", "backpack", "背包", "物品", "inventory", "Backpack", "BACKPACK"],
};

// Index regex - matches trailing digits (optional prefix _ or -)
export const INDEX_PATTERN: RegExp = /[_-]?(\d{1,4})$/;

// Range expansion regex - matches {1-50} or [001-100] or {A-Z}
export const RANGE_PATTERN: RegExp = /[{[](\d+|[A-Za-z])-(\d+|[A-Za-z])[}\]]/g;

// ============ Utility functions ============

/**
 * Detect delimiter type
 * @param {string} line - Single line of text
 * @returns {'tab' | 'comma' | 'semicolon' | 'none'}
 */
export function detectDelimiter(line: string): "tab" | "comma" | "semicolon" | "none" {
  if (!line) return "none";

  if (line.includes("\t")) return "tab";
  if (line.includes(",")) return "comma";
  if (line.includes(";")) return "semicolon";
  return "none";
}

/**
 * Parse a CSV line (supports quoted escaping)
 * @param {string} line - CSV line
 * @param {string} delimiter - Delimiter
 * @returns {string[]}
 */
export function parseCSVLine(line: string, delimiter: string = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Clean a single value
 * @param {string} value
 * @returns {string | null}
 */
export function cleanValue(value: string): string | null {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") {
    return null;
  }

  return trimmed.replace(/^["']|["']$/g, "");
}

/**
 * Check if a line is a comment line
 * @param {string} line
 * @returns {boolean}
 */
export function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("#") || trimmed.startsWith("//");
}

/**
 * Check if a row is a header row
 * @param {string[]} fields
 * @returns {boolean}
 */
export function isHeaderRow(fields: string[]): boolean {
  const allAliases = Object.values(COLUMN_ALIASES).flat();
  const matchCount = fields.filter((f) => allAliases.some((alias) => alias.toLowerCase() === f.toLowerCase())).length;
  return matchCount >= 1;
}

/**
 * Map column names to standard fields
 * @param {string[]} headers
 * @returns {Object<string, number>}
 */
export function mapColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      if (aliases.some((alias) => alias.toLowerCase() === header)) {
        mapping[field] = i;
        break;
      }
    }
  }

  if (mapping.name === undefined && headers.length > 0) {
    mapping.name = 0;
  }

  return mapping;
}

/**
 * Expand index range
 * @param {string} template - Template containing range markers, e.g. "save_{1-5}"
 * @returns {string[]}
 */
export function expandRange(template: string): string[] {
  const results: string[] = [];
  const match = template.match(RANGE_PATTERN);

  if (!match) {
    return [template];
  }

  const rangeMatch = template.match(/[{[](\d+|[A-Za-z])-(\d+|[A-Za-z])[}\]]/);
  if (!rangeMatch) return [template];

  const [fullMatch, start, end] = rangeMatch;
  const prefix = template.slice(0, rangeMatch.index);
  const suffix = template.slice(rangeMatch.index! + fullMatch.length);

  if (/^\d+$/.test(start) && /^\d+$/.test(end)) {
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    const padLength = start.length;

    const min = Math.min(startNum, endNum);
    const max = Math.max(startNum, endNum);

    if (max - min > 1000) {
      console.warn("Range too large, limiting to 1000");
      for (let i = min; i <= min + 999; i++) {
        results.push(prefix + String(i).padStart(padLength, "0") + suffix);
      }
    } else {
      for (let i = min; i <= max; i++) {
        results.push(prefix + String(i).padStart(padLength, "0") + suffix);
      }
    }
  } else if (/^[A-Za-z]$/.test(start) && /^[A-Za-z]$/.test(end)) {
    const startCode = start.charCodeAt(0);
    const endCode = end.charCodeAt(0);

    const min = Math.min(startCode, endCode);
    const max = Math.max(startCode, endCode);

    for (let i = min; i <= max; i++) {
      results.push(prefix + String.fromCharCode(i) + suffix);
    }
  }

  return results.length > 0 ? results : [template];
}

// ============ Core parsing functions ============

/**
 * @typedef {Object} NameHighlight
 * @property {number} start - Highlight start position
 * @property {number} end - Highlight end position
 * @property {'index' | 'level' | 'difficulty'} type - Highlight type
 * @property {'blue' | 'orange'} color - Highlight color
 */

/**
 * @typedef {Object} ParsedNameInfo
 * @property {string} originalName - Original name
 * @property {number | null} index - Recognized index
 * @property {string | null} levelKeyword - Recognized level keyword
 * @property {string | null} levelValue - Level value
 * @property {string | null} difficultyKeyword - Recognized difficulty keyword
 * @property {string | null} difficultyValue - Difficulty value
 * @property {string | null} backpackKeyword - Recognized backpack keyword
 * @property {string | null} backpackValue - Backpack value
 * @property {NameHighlight[]} highlights - Highlight region list
 */

/**
 * Parse a single name, recognizing keywords and index
 * @param {string} name - Archive name
 * @returns {ParsedNameInfo}
 */
export function parseName(name: string): ParsedNameInfo {
  const result: ParsedNameInfo = {
    originalName: name,
    index: null,
    levelKeyword: null,
    levelValue: null,
    difficultyKeyword: null,
    difficultyValue: null,
    backpackKeyword: null,
    backpackValue: null,
    highlights: [],
  };

  if (!name || typeof name !== "string") {
    return result;
  }

  const indexMatch = name.match(INDEX_PATTERN);
  if (indexMatch) {
    result.index = parseInt(indexMatch[1], 10);
    const fullMatch = indexMatch[0];
    const startPos = name.length - fullMatch.length;
    result.highlights.push({
      start: startPos,
      end: name.length,
      type: "index",
      color: "blue",
    });
  }

  const sortedLevelKeywords = Object.keys(LEVEL_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedLevelKeywords) {
    const keywordIndex = name.indexOf(keyword);
    if (keywordIndex !== -1) {
      result.levelKeyword = keyword;
      result.levelValue = LEVEL_KEYWORDS[keyword];
      result.highlights.push({
        start: keywordIndex,
        end: keywordIndex + keyword.length,
        type: "level",
        color: "orange",
      });
      break;
    }
  }

  const sortedDifficultyKeywords = Object.keys(DIFFICULTY_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedDifficultyKeywords) {
    const keywordIndex = name.indexOf(keyword);
    if (keywordIndex !== -1) {
      result.difficultyKeyword = keyword;
      result.difficultyValue = DIFFICULTY_KEYWORDS[keyword];
      result.highlights.push({
        start: keywordIndex,
        end: keywordIndex + keyword.length,
        type: "difficulty",
        color: "orange",
      });
      break;
    }
  }

  const sortedBackpackKeywords = Object.keys(BACKPACK_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedBackpackKeywords) {
    const keywordIndex = name.indexOf(keyword);
    if (keywordIndex !== -1) {
      result.backpackKeyword = keyword;
      result.backpackValue = BACKPACK_KEYWORDS[keyword];
      break;
    }
  }

  result.highlights.sort((a, b) => a.start - b.start);

  return result;
}

/**
 * @typedef {Object} ParsedRecord
 * @property {string} name - Archive name
 * @property {string | null} level - Level
 * @property {string | null} difficulty - Difficulty
 * @property {string | null} actualDifficulty - Actual difficulty
 * @property {string | null} backpack - Backpack configuration
 * @property {ParsedNameInfo} parsed - Name parsing result
 * @property {string[]} warnings - Warning messages
 */

/**
 * @typedef {Object} ParseResult
 * @property {ParsedRecord[]} records - Parsed records
 * @property {string[]} errors - Error messages
 * @property {string[]} warnings - Warning messages
 * @property {string[]} info - Info messages
 * @property {Object} stats - Statistics
 */

/**
 * Parse multi-line input (auto-detect format)
 * @param {string} input - Multi-line text input
 * @returns {ParseResult}
 */
export function parseMultiple(input: string): ParseResult {
  const result: ParseResult = {
    records: [],
    errors: [],
    warnings: [],
    info: [],
    stats: {
      total: 0,
      levelDetected: 0,
      difficultyDetected: 0,
      duplicates: 0,
    },
  };

  if (!input || typeof input !== "string") {
    return result;
  }

  const lines = input.split(/\r?\n/);

  let hasHeader = false;
  let columnMapping: Record<string, number> = { name: 0 };
  let delimiter: "tab" | "comma" | "semicolon" | "none" = "none";

  let firstDataLineIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !isCommentLine(line)) {
      delimiter = detectDelimiter(line);
      const fields: string[] =
        delimiter !== "none"
          ? parseCSVLine(line, delimiter === "tab" ? "\t" : delimiter === "semicolon" ? ";" : ",")
          : [line];

      if (isHeaderRow(fields)) {
        hasHeader = true;
        columnMapping = mapColumns(fields);
        firstDataLineIndex = i + 1;
        result.info.push(`Detected header row, auto-mapping column names`);
      } else {
        firstDataLineIndex = i;
      }
      break;
    }
    firstDataLineIndex = i + 1;
  }

  const seenNames = new Set<string>();

  for (let i = firstDataLineIndex; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine || isCommentLine(trimmedLine)) {
      continue;
    }

    const delimiterChar = delimiter === "tab" ? "\t" : delimiter === "semicolon" ? ";" : ",";
    const fields: string[] = delimiter !== "none" ? parseCSVLine(trimmedLine, delimiterChar) : [trimmedLine];

    const name = cleanValue(fields[columnMapping.name]) as string | null;
    if (!name) continue;

    const expandedNames = expandRange(name);

    for (const expandedName of expandedNames) {
      if (seenNames.has(expandedName)) {
        result.stats.duplicates++;
        result.warnings.push(`存档名称重复: ${expandedName}`);
        continue;
      }
      seenNames.add(expandedName);

      const parsed = parseName(expandedName);

      const record: ParsedRecord = {
        name: expandedName,
        level: cleanValue(fields[columnMapping.level]) || null,
        difficulty: cleanValue(fields[columnMapping.difficulty]) || null,
        actualDifficulty: cleanValue(fields[columnMapping.actualDifficulty]) || null,
        backpack: cleanValue(fields[columnMapping.backpack]) || null,
        parsed,
        warnings: [],
      };

      if (!record.level && parsed.levelValue) {
        record.level = parsed.levelValue;
      }
      if (!record.difficulty && parsed.difficultyValue) {
        record.difficulty = parsed.difficultyValue;
      }
      if (!record.backpack && parsed.backpackValue) {
        record.backpack = parsed.backpackValue;
      }

      if (parsed.levelKeyword) result.stats.levelDetected++;
      if (parsed.difficultyKeyword) result.stats.difficultyDetected++;

      result.records.push(record);
    }
  }

  result.stats.total = result.records.length;

  if (result.records.length === 0) {
    result.errors.push("未找到有效数据");
  } else {
    result.info.push(`成功识别 ${result.records.length} 个存档`);
  }

  if (result.stats.duplicates > 0) {
    result.warnings.push(`${result.stats.duplicates} 个存档名称重复已跳过`);
  }

  return result;
}

/**
 * Parse CSV file content
 * @param {string} content - CSV file content
 * @returns {ParseResult}
 */
export function parseCSV(content: string): ParseResult {
  return parseMultiple(content);
}

/**
 * Parse an array of names
 * @param {string[]} names - Array of names
 * @returns {ParsedNameInfo[]}
 */
export function parseNames(names: string[]): ParsedNameInfo[] {
  if (!Array.isArray(names)) {
    return [];
  }

  return names
    .filter((name): name is string => typeof name === "string" && !!name.trim())
    .map((name) => parseName(name.trim()));
}
