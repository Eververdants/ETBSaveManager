/**
 * 存档列表过滤 Hook — 搜索 / 难度 / 可见性过滤 + 搜索建议 + 历史记录
 * （对应 master useArchiveSearchFilter 的 useArchiveList）
 *
 * 过滤条件持久化到 sessionStorage，返回编辑页后仍保留。
 */
import { useEffect, useMemo, useState } from "react";

import type { ArchiveData } from "../../../types";

const FILTER_STORAGE_KEY = "archive-list-filters";
const SEARCH_HISTORY_KEY = "archive-search-history";
const MAX_HISTORY = 5;

export function getSearchHistory(): string[] {
  try {
    const raw = sessionStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  if (!query.trim()) return;
  try {
    const history = getSearchHistory().filter((h) => h !== query.trim());
    history.unshift(query.trim());
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    sessionStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* ignore */
  }
}

export function clearSearchHistory(): void {
  try {
    sessionStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

interface SavedFilters {
  searchQuery?: string;
  selectedArchiveDifficulty?: string;
  selectedActualDifficulty?: string;
  selectedVisibility?: string;
}

function loadSavedFilters(): SavedFilters {
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedFilters) : {};
  } catch {
    return {};
  }
}

function applyFilters(
  archives: ArchiveData[],
  searchQuery: string,
  archiveDifficulty: string,
  actualDifficulty: string,
  visibility: string
): ArchiveData[] {
  let filtered = archives;
  if (filtered.length === 0) return [];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((archive) => {
      // 文件名与 MAINSAVE 显示名都能命中
      const nameMatch =
        archive.name.toLowerCase().includes(query) ||
        (archive.displayName?.toLowerCase().includes(query) ?? false);
      const levelMatch = archive.currentLevel?.toLowerCase().includes(query) ?? false;
      const diffMatch = archive.archiveDifficulty?.toLowerCase().includes(query) ?? false;
      const actualDiffMatch = archive.actualDifficulty?.toLowerCase().includes(query) ?? false;
      const modeMatch = archive.gameMode?.toLowerCase().includes(query) ?? false;
      return nameMatch || levelMatch || diffMatch || actualDiffMatch || modeMatch;
    });
  }

  if (archiveDifficulty) {
    filtered = filtered.filter((a) => a.archiveDifficulty === archiveDifficulty);
  }
  if (actualDifficulty) {
    filtered = filtered.filter((a) => a.actualDifficulty === actualDifficulty);
  }
  if (visibility) {
    const isVisible = visibility === "visible";
    filtered = filtered.filter((a) => a.isVisible === isVisible);
  }

  return filtered;
}

function applySuggestions(archives: ArchiveData[], searchQuery: string): ArchiveData[] {
  if (!searchQuery || archives.length === 0) return [];
  const query = searchQuery.toLowerCase();
  return archives
    .filter((a) => {
      const nameMatch =
        a.name.toLowerCase().includes(query) ||
        (a.displayName?.toLowerCase().includes(query) ?? false);
      const levelMatch = a.currentLevel?.toLowerCase().includes(query) ?? false;
      return nameMatch || levelMatch;
    })
    .slice(0, 3);
}

export function useArchiveList(archives: ArchiveData[]) {
  const saved = useMemo(loadSavedFilters, []);

  const [searchQuery, setSearchQuery] = useState(saved.searchQuery || "");
  const [archiveDifficulty, setArchiveDifficulty] = useState(saved.selectedArchiveDifficulty || "");
  const [actualDifficulty, setActualDifficulty] = useState(saved.selectedActualDifficulty || "");
  const [visibility, setVisibility] = useState(saved.selectedVisibility || "");
  // 60ms 防抖：避免千条存档时逐字符过滤卡顿
  const [debouncedQuery, setDebouncedQuery] = useState(saved.searchQuery || "");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), searchQuery ? 60 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 过滤条件持久化
  useEffect(() => {
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({
          searchQuery,
          selectedArchiveDifficulty: archiveDifficulty,
          selectedActualDifficulty: actualDifficulty,
          selectedVisibility: visibility,
        })
      );
    } catch {
      /* ignore */
    }
  }, [searchQuery, archiveDifficulty, actualDifficulty, visibility]);

  const displayArchives = useMemo(
    () => applyFilters(archives, debouncedQuery, archiveDifficulty, actualDifficulty, visibility),
    [archives, debouncedQuery, archiveDifficulty, actualDifficulty, visibility]
  );

  const searchSuggestions = useMemo(
    () => applySuggestions(archives, debouncedQuery),
    [archives, debouncedQuery]
  );

  const hasActiveFilters = Boolean(
    searchQuery || archiveDifficulty || actualDifficulty || visibility
  );

  const resetFilters = () => {
    setSearchQuery("");
    setArchiveDifficulty("");
    setActualDifficulty("");
    setVisibility("");
    try {
      sessionStorage.removeItem(FILTER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return {
    displayArchives,
    searchQuery,
    setSearchQuery,
    archiveDifficulty,
    setArchiveDifficulty,
    actualDifficulty,
    setActualDifficulty,
    visibility,
    setVisibility,
    searchSuggestions,
    hasActiveFilters,
    resetFilters,
  };
}
