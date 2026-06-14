import { ref, computed, watch, onUnmounted, nextTick } from "vue";
import type { Ref } from "vue";

interface ScrollSnapshot {
  top: number;
  left: number;
}

interface PerformSearchOptions {
  scrollToCurrent?: boolean;
}

interface GlobalSearchPanelReturn {
  query: Ref<string>;
  matchCase: Ref<boolean>;
  matches: Ref<HTMLElement[]>;
  currentMatchIndex: Ref<number>;
  captureScrollSnapshot: () => void;
  restoreScrollSnapshot: () => void;
  clearHighlights: () => void;
  performSearch: (options?: PerformSearchOptions) => void;
  scheduleSearch: () => void;
  findNext: () => void;
  findPrevious: () => void;
  focusInput: (inputRef: Ref<{ focus: () => void; select: () => void } | null> | null, selectAll?: boolean) => void;
  cleanup: () => void;
}

export function useGlobalSearchPanel(): GlobalSearchPanelReturn {
  const query = ref("");
  const matchCase = ref(false);
  const matches = ref<HTMLElement[]>([]);
  const currentMatchIndex = ref(-1);
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  let scrollSnapshot: ScrollSnapshot | null = null;

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

  const performSearch = ({ scrollToCurrent = false } = {}): void => {
    const root = getSearchRoot();
    if (!root) return;
    clearHighlights();
    const keyword = query.value.trim();
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
  };

  const scheduleSearch = (): void => {
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
    captureScrollSnapshot,
    restoreScrollSnapshot,
    clearHighlights,
    performSearch,
    scheduleSearch,
    findNext,
    findPrevious,
    focusInput,
    cleanup,
  };
}
