/**
 * 存档名称解析 — 从单个名称中识别序号 / 关卡 / 难度 / 背包关键字
 *
 * 注：此前本文件还包含一整套批量 CSV 解析（parseMultiple / expandRange /
 * parseCSVLine / detectDelimiter / mapColumns / COLUMN_ALIASES …），
 * 全仓零引用且所引用的 docs/SMART_INPUT_STANDARD.md 并不存在，
 * 已按 AGENTS.md「无死代码」移除。
 */
import type { ParsedNameInfo } from "../types";

// ============ 关键字映射配置（仅本文件使用，不对外导出）============

/** 关卡关键字（按长度降序匹配，优先命中更长的词） */
const LEVEL_KEYWORDS: Record<string, string> = {
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

/** 难度关键字 */
const DIFFICULTY_KEYWORDS: Record<string, string> = {
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

/** 背包关键字 */
const BACKPACK_KEYWORDS: Record<string, string> = {
  新手包: "starter",
  标准包: "standard",
  豪华包: "deluxe",
  至尊包: "ultimate",
  starter: "starter",
  standard: "standard",
  deluxe: "deluxe",
  ultimate: "ultimate",
};

/** 尾部序号（可选 _ 或 - 前缀） */
const INDEX_PATTERN: RegExp = /[_-]?(\d{1,4})$/;

/** 在名称中查找首个命中的关键字，返回 [关键字, 起始位置, 映射值] */
function findKeyword(
  name: string,
  keywords: Record<string, string>
): { keyword: string; value: string; start: number; length: number } | null {
  const sorted = Object.keys(keywords).sort((a, b) => b.length - a.length);
  for (const keyword of sorted) {
    const start = name.indexOf(keyword);
    if (start !== -1) {
      return { keyword, value: keywords[keyword], start, length: keyword.length };
    }
  }
  return null;
}

/**
 * 解析单个存档名称，识别序号与关键字
 * @returns ParsedNameInfo（含高亮区间，按起始位置升序）
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
    result.highlights.push({
      start: name.length - indexMatch[0].length,
      end: name.length,
      type: "index",
      color: "blue",
    });
  }

  const level = findKeyword(name, LEVEL_KEYWORDS);
  if (level) {
    result.levelKeyword = level.keyword;
    result.levelValue = level.value;
    result.highlights.push({
      start: level.start,
      end: level.start + level.length,
      type: "level",
      color: "orange",
    });
  }

  const difficulty = findKeyword(name, DIFFICULTY_KEYWORDS);
  if (difficulty) {
    result.difficultyKeyword = difficulty.keyword;
    result.difficultyValue = difficulty.value;
    result.highlights.push({
      start: difficulty.start,
      end: difficulty.start + difficulty.length,
      type: "difficulty",
      color: "orange",
    });
  }

  const backpack = findKeyword(name, BACKPACK_KEYWORDS);
  if (backpack) {
    result.backpackKeyword = backpack.keyword;
    result.backpackValue = backpack.value;
  }

  result.highlights.sort((a, b) => a.start - b.start);

  return result;
}
