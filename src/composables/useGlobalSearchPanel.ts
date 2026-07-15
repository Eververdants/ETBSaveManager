import { ref, computed, nextTick } from "vue";
import type { Ref } from "vue";

interface ScrollSnapshot {
  top: number;
  left: number;
}

interface PerformSearchOptions {
  scrollToCurrent?: boolean;
}

export interface AdvancedQuery {
  raw: string;
  name?: string;
  level?: string;
  difficulty?: string;
  text: string; // remaining plain text after stripping advanced prefixes
}

interface GlobalSearchPanelReturn {
  query: Ref<string>;
  matchCase: Ref<boolean>;
  matches: Ref<HTMLElement[]>;
  currentMatchIndex: Ref<number>;
  searchHistory: Ref<string[]>;
  advancedQuery: Ref<AdvancedQuery | null>;
  showHistory: Ref<boolean>;
  captureScrollSnapshot: () => void;
  restoreScrollSnapshot: () => void;
  clearHighlights: () => void;
  performSearch: (options?: PerformSearchOptions) => void;
  scheduleSearch: () => void;
  findNext: () => void;
  findPrevious: () => void;
  focusInput: (inputRef: Ref<{ focus: () => void; select: () => void } | null> | null, selectAll?: boolean) => void;
  selectHistoryItem: (item: string) => void;
  clearHistory: () => void;
  cleanup: () => void;
}

const HISTORY_KEY = "global-search-history";
const MAX_HISTORY = 20;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_HISTORY);
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

function saveHistory(history: string[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // ignore storage errors
  }
}

/**
 * Parse advanced query syntax:
 *   name:xxx      — filter by archive name
 *   level:xxx     — filter by level
 *   difficulty:hard — filter by difficulty
 *   plain text    — regular text search
 */
function parseAdvancedQuery(raw: string): AdvancedQuery | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const result: AdvancedQuery = { raw: trimmed, text: "" };
  const parts: string[] = [];
  let remaining = trimmed;

  // Match prefixes: name:xxx, level:xxx, difficulty:xxx
  const prefixRegex = /^(name|level|difficulty):(\S+)\s*/;
  let match: RegExpExecArray | null;
  const regex = new RegExp(prefixRegex.source, "g");
  while ((match = regex.exec(remaining)) !== null) {
    const key = match[1] as "name" | "level" | "difficulty";
    const value = match[2];
    if (key === "name") result.name = value;
    else if (key === "level") result.level = value;
    else if (key === "difficulty") result.difficulty = value;
    parts.push(match[0]);
    regex.lastIndex = 0;
  }

  // Remove matched prefixes from the remaining text
  for (const p of parts) {
    remaining = remaining.replace(p, "").trim();
  }

  result.text = remaining;
  return result;
}

export function useGlobalSearchPanel(): GlobalSearchPanelReturn {
  const query = ref("");
  const matchCase = ref(false);
  const matches = ref<HTMLElement[]>([]);
  const currentMatchIndex = ref(-1);
  const searchHistory = ref<string[]>(loadHistory());
  const showHistory = ref(false);
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  let scrollSnapshot: ScrollSnapshot | null = null;

  const advancedQuery = computed<AdvancedQuery | null>(() => {
    const q = query.value.trim();
    if (!q || q.length < 3) return null;
    return parseAdvancedQuery(q);
  });

  const getSearchRoot = (): Element | null => document.querySelector(".main-content");

  const captureScrollSnapshot = (): void => {
    const root = getSearchRoot();
    if (!root) {
      scrollSnapshot = null;
      return;
    }
    scrollSnapshot = { top: root.scrollTop, left: root.scrollLeft };
  };

  const restoreScrollSnapshot = (): void => {
    const root = getSearchRoot();
    if (!root || !scrollSnapshot) return;
    root.scrollTo({ top: scrollSnapshot.top, left: scrollSnapshot.left, behavior: "auto" });
    scrollSnapshot = null;
  };

  const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const shouldSkipTextNode = (node: Text): boolean => {
    const text = node?.nodeValue || "";
    if (!text.trim()) return true;
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest(".global-search-panel, .sidebar, .titlebar")) return true;
    const blockedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON"]);
    if (blockedTags.has(parent.tagName)) return true;
    if (parent.closest("[contenteditable='true']")) return true;
    return false;
  };

  const clearHighlights = (): void => {
    const root = getSearchRoot();
    if (root) {
      const marks = root.querySelectorAll("mark.global-find-mark");
      marks.forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent || "")));
      root.normalize();
    }
    matches.value = [];
    currentMatchIndex.value = -1;
  };

  const scrollActiveMatchIntoView = (activeMatch: HTMLElement): void => {
    const root = getSearchRoot();
    if (!root || !activeMatch) return;
    const rootRect = root.getBoundingClientRect();
    const matchRect = activeMatch.getBoundingClientRect();
    const absoluteTop = matchRect.top - rootRect.top + root.scrollTop;
    const centeredTop = absoluteTop - root.clientHeight / 2 + matchRect.height / 2;
    root.scrollTo({ top: Math.max(0, centeredTop), behavior: "smooth" });
  };

  const activateCurrentMatch = (scroll: boolean = true): void => {
    matches.value = matches.value.filter((el) => el.isConnected);
    matches.value.forEach((el) => el.classList.remove("active"));
    if (!matches.value.length) {
      currentMatchIndex.value = -1;
      return;
    }
    if (currentMatchIndex.value < 0 || currentMatchIndex.value >= matches.value.length) {
      currentMatchIndex.value = 0;
    }
    const activeMatch = matches.value[currentMatchIndex.value];
    if (!activeMatch) return;
    activeMatch.classList.add("active");
    if (scroll) scrollActiveMatchIntoView(activeMatch);
  };

  /** Get the effective search text: for advanced queries, use the text portion */
  const getEffectiveSearchText = (): string => {
    const adv = advancedQuery.value;
    if (adv) return adv.text || adv.raw;
    return query.value.trim();
  };

  const performSearch = ({ scrollToCurrent = false } = {}): void => {
    const root = getSearchRoot();
    if (!root) return;
    clearHighlights();
    const keyword = getEffectiveSearchText();
    if (!keyword) return;
    const regex = new RegExp(escapeRegExp(keyword), matchCase.value ? "g" : "gi");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node = walker.nextNode();
    while (node) {
      if (!shouldSkipTextNode(node as Text)) textNodes.push(node as Text);
      node = walker.nextNode();
    }
    const found: HTMLElement[] = [];
    textNodes.forEach((textNode) => {
      const sourceText = textNode.nodeValue || "";
      regex.lastIndex = 0;
      let matched = regex.exec(sourceText);
      if (!matched) return;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      while (matched) {
        const start = matched.index;
        const end = start + matched[0].length;
        if (start > lastIndex) fragment.appendChild(document.createTextNode(sourceText.slice(lastIndex, start)));
        const mark = document.createElement("mark");
        mark.className = "global-find-mark";
        mark.textContent = sourceText.slice(start, end);
        fragment.appendChild(mark);
        found.push(mark);
        lastIndex = end;
        if (matched[0].length === 0) regex.lastIndex += 1;
        matched = regex.exec(sourceText);
      }
      if (lastIndex < sourceText.length) fragment.appendChild(document.createTextNode(sourceText.slice(lastIndex)));
      textNode.replaceWith(fragment);
    });
    matches.value = found;
    if (found.length) {
      currentMatchIndex.value = 0;
      activateCurrentMatch(scrollToCurrent);
    }

    // Save to history when search has actual results or meaningful query
    const trimmed = query.value.trim();
    if (trimmed && trimmed.length >= 2) {
      addToHistory(trimmed);
    }
  };

  const addToHistory = (item: string): void => {
    // Remove if exists (move to top), then prepend
    const existing = searchHistory.value.indexOf(item);
    if (existing > -1) {
      searchHistory.value.splice(existing, 1);
    }
    searchHistory.value.unshift(item);
    if (searchHistory.value.length > MAX_HISTORY) {
      searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY);
    }
    saveHistory(searchHistory.value);
  };

  const scheduleSearch = (): void => {
    showHistory.value = false;
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => performSearch(), 120);
  };

  const findNext = (): void => {
    if (!query.value.trim()) {
      focusInput(null, false);
      return;
    }
    if (!matches.value.length) {
      performSearch({ scrollToCurrent: true });
      return;
    }
    currentMatchIndex.value = (currentMatchIndex.value + 1) % matches.value.length;
    activateCurrentMatch(true);
  };

  const findPrevious = (): void => {
    if (!query.value.trim()) {
      focusInput(null, false);
      return;
    }
    if (!matches.value.length) {
      performSearch({ scrollToCurrent: true });
      return;
    }
    currentMatchIndex.value = (currentMatchIndex.value - 1 + matches.value.length) % matches.value.length;
    activateCurrentMatch(true);
  };

  const focusInput = (
    inputRef: Ref<{ focus: () => void; select: () => void } | null> | null,
    selectAll: boolean = true,
  ): void => {
    nextTick(() => {
      const input = inputRef?.value;
      if (!input) return;
      input.focus();
      if (selectAll) input.select();
    });
  };

  /** Select a history item as the current query */
  const selectHistoryItem = (item: string): void => {
    query.value = item;
    showHistory.value = false;
    scheduleSearch();
  };

  /** Clear all search history */
  const clearHistory = (): void => {
    searchHistory.value = [];
    saveHistory([]);
  };

  const cleanup = (): void => {
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    clearHighlights();
    restoreScrollSnapshot();
  };

  return {
    query,
    matchCase,
    matches,
    currentMatchIndex,
    searchHistory,
    advancedQuery,
    showHistory,
    captureScrollSnapshot,
    restoreScrollSnapshot,
    clearHighlights,
    performSearch,
    scheduleSearch,
    findNext,
    findPrevious,
    focusInput,
    selectHistoryItem,
    clearHistory,
    cleanup,
  };
}
