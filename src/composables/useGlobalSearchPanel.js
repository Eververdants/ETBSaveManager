import { ref, computed, watch, onUnmounted, nextTick } from "vue";

export function useGlobalSearchPanel() {
  const query = ref("");
  const matchCase = ref(false);
  const matches = ref([]);
  const currentMatchIndex = ref(-1);
  let searchTimer = null;
  let scrollSnapshot = null;

  const getSearchRoot = () => document.querySelector(".main-content");

  const captureScrollSnapshot = () => {
    const root = getSearchRoot();
    if (!root) {
      scrollSnapshot = null;
      return;
    }
    scrollSnapshot = { top: root.scrollTop, left: root.scrollLeft };
  };

  const restoreScrollSnapshot = () => {
    const root = getSearchRoot();
    if (!root || !scrollSnapshot) return;
    root.scrollTo({ top: scrollSnapshot.top, left: scrollSnapshot.left, behavior: "auto" });
    scrollSnapshot = null;
  };

  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const shouldSkipTextNode = (node) => {
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

  const clearHighlights = () => {
    const root = getSearchRoot();
    if (root) {
      const marks = root.querySelectorAll("mark.global-find-mark");
      marks.forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent || "")));
      root.normalize();
    }
    matches.value = [];
    currentMatchIndex.value = -1;
  };

  const scrollActiveMatchIntoView = (activeMatch) => {
    const root = getSearchRoot();
    if (!root || !activeMatch) return;
    const rootRect = root.getBoundingClientRect();
    const matchRect = activeMatch.getBoundingClientRect();
    const absoluteTop = matchRect.top - rootRect.top + root.scrollTop;
    const centeredTop = absoluteTop - root.clientHeight / 2 + matchRect.height / 2;
    root.scrollTo({ top: Math.max(0, centeredTop), behavior: "smooth" });
  };

  const activateCurrentMatch = (scroll = true) => {
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

  const performSearch = ({ scrollToCurrent = false } = {}) => {
    const root = getSearchRoot();
    if (!root) return;
    clearHighlights();
    const keyword = query.value.trim();
    if (!keyword) return;
    const regex = new RegExp(escapeRegExp(keyword), matchCase.value ? "g" : "gi");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node = walker.nextNode();
    while (node) {
      if (!shouldSkipTextNode(node)) textNodes.push(node);
      node = walker.nextNode();
    }
    const found = [];
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

  const scheduleSearch = () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => performSearch(), 120);
  };

  const findNext = () => {
    if (!query.value.trim()) {
      focusInput(false);
      return;
    }
    if (!matches.value.length) {
      performSearch({ scrollToCurrent: true });
      return;
    }
    currentMatchIndex.value = (currentMatchIndex.value + 1) % matches.value.length;
    activateCurrentMatch(true);
  };

  const findPrevious = () => {
    if (!query.value.trim()) {
      focusInput(false);
      return;
    }
    if (!matches.value.length) {
      performSearch({ scrollToCurrent: true });
      return;
    }
    currentMatchIndex.value = (currentMatchIndex.value - 1 + matches.value.length) % matches.value.length;
    activateCurrentMatch(true);
  };

  const focusInput = (inputRef, selectAll = true) => {
    nextTick(() => {
      const input = inputRef?.value;
      if (!input) return;
      input.focus();
      if (selectAll) input.select();
    });
  };

  const cleanup = () => {
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
