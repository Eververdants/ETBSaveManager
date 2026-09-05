/**
 * Name parser types
 * Types for parsing archive filenames into structured data.
 */

/** Highlights within a parsed name (for UI rendering) */
export interface NameHighlight {
  start: number;
  end: number;
  type: "index" | "level" | "difficulty";
  color: "blue" | "orange";
}

/** Parsed components of a single archive name */
export interface ParsedNameInfo {
  originalName: string;
  index: number | null;
  levelKeyword: string | null;
  levelValue: string | null;
  difficultyKeyword: string | null;
  difficultyValue: string | null;
  backpackKeyword: string | null;
  backpackValue: string | null;
  highlights: NameHighlight[];
}

/** A single parsed record with resolved values */
export interface ParsedRecord {
  name: string;
  level: string | null;
  difficulty: string | null;
  actualDifficulty: string | null;
  backpack: string | null;
  parsed: ParsedNameInfo;
  warnings: string[];
}

/** Result of parsing multiple names */
export interface ParseResult {
  records: ParsedRecord[];
  errors: string[];
  warnings: string[];
  info: string[];
  stats: {
    total: number;
    levelDetected: number;
    difficultyDetected: number;
    duplicates: number;
  };
}
