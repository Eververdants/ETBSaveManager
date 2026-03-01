<template>
  <Teleport to="body">
    <transition name="global-find-panel">
      <section v-if="visible" class="global-search-panel" @keydown.stop>
        <div class="search-row">
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" class="search-icon" />
          <input
            ref="inputRef"
            v-model="query"
            class="search-input"
            type="text"
            :placeholder="uiText.placeholder"
            @keydown.enter.prevent="handleEnter"
            @keydown.esc.prevent="closePanel"
          />
          <button
            class="icon-btn match-case-btn"
            :class="{ active: matchCase }"
            type="button"
            :title="uiText.matchCase"
            @click="toggleMatchCase"
          >
            Aa
          </button>
          <button class="icon-btn close-btn" type="button" :title="uiText.close" @click="closePanel">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <div class="toolbar-row">
          <span class="result-text">{{ resultText }}</span>
          <div class="action-group">
            <button class="nav-btn" type="button" :disabled="!matches.length" :title="uiText.previous" @click="findPrevious">
              <font-awesome-icon icon="fa-solid fa-chevron-up" />
            </button>
            <button class="nav-btn" type="button" :disabled="!matches.length" :title="uiText.next" @click="findNext">
              <font-awesome-icon icon="fa-solid fa-chevron-down" />
            </button>
          </div>
        </div>
      </section>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);

const inputRef = ref(null);
const query = ref("");
const matchCase = ref(false);
const matches = ref([]);
const currentMatchIndex = ref(-1);
let searchTimer = null;
let scrollSnapshot = null;

const { locale } = useI18n({ useScope: "global" });

const uiText = computed(() => {
  const normalized = String(locale.value || "").toLowerCase();

  if (normalized.startsWith("en")) {
    return {
      placeholder: "Find in current page",
      hint: "Type to search",
      noResult: "No matches",
      matchCase: "Match case",
      previous: "Previous result",
      next: "Next result",
      close: "Close",
    };
  }

  if (normalized.startsWith("zh-tw")) {
    return {
      placeholder: "在目前頁面搜尋",
      hint: "輸入關鍵字開始搜尋",
      noResult: "找不到符合項",
      matchCase: "區分大小寫",
      previous: "上一個結果",
      next: "下一個結果",
      close: "關閉",
    };
  }

  return {
    placeholder: "在当前页面查找",
    hint: "输入关键词开始查找",
    noResult: "未找到匹配项",
    matchCase: "区分大小写",
    previous: "上一条结果",
    next: "下一条结果",
    close: "关闭",
  };
});

const resultText = computed(() => {
  if (!query.value.trim()) {
    return uiText.value.hint;
  }

  if (!matches.value.length) {
    return uiText.value.noResult;
  }

  return `${currentMatchIndex.value + 1} / ${matches.value.length}`;
});

const getSearchRoot = () => {
  return document.querySelector(".main-content");
};

const captureScrollSnapshot = () => {
  const root = getSearchRoot();
  if (!root) {
    scrollSnapshot = null;
    return;
  }
  scrollSnapshot = {
    top: root.scrollTop,
    left: root.scrollLeft,
  };
};

const restoreScrollSnapshot = () => {
  const root = getSearchRoot();
  if (!root || !scrollSnapshot) return;

  root.scrollTo({
    top: scrollSnapshot.top,
    left: scrollSnapshot.left,
    behavior: "auto",
  });
  scrollSnapshot = null;
};

const escapeRegExp = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const shouldSkipTextNode = (node) => {
  const text = node?.nodeValue || "";
  if (!text.trim()) return true;

  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest(".global-search-panel, .sidebar, .titlebar")) return true;

  const blockedTags = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "OPTION",
    "BUTTON",
  ]);
  if (blockedTags.has(parent.tagName)) return true;
  if (parent.closest("[contenteditable='true']")) return true;

  return false;
};

const clearHighlights = () => {
  const root = getSearchRoot();
  if (root) {
    const marks = root.querySelectorAll("mark.global-find-mark");
    marks.forEach((mark) => {
      mark.replaceWith(document.createTextNode(mark.textContent || ""));
    });
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

  root.scrollTo({
    top: Math.max(0, centeredTop),
    behavior: "smooth",
  });
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

  if (scroll) {
    scrollActiveMatchIntoView(activeMatch);
  }
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
    if (!shouldSkipTextNode(node)) {
      textNodes.push(node);
    }
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

      if (start > lastIndex) {
        fragment.appendChild(document.createTextNode(sourceText.slice(lastIndex, start)));
      }

      const mark = document.createElement("mark");
      mark.className = "global-find-mark";
      mark.textContent = sourceText.slice(start, end);
      fragment.appendChild(mark);
      found.push(mark);

      lastIndex = end;
      if (matched[0].length === 0) {
        regex.lastIndex += 1;
      }
      matched = regex.exec(sourceText);
    }

    if (lastIndex < sourceText.length) {
      fragment.appendChild(document.createTextNode(sourceText.slice(lastIndex)));
    }

    textNode.replaceWith(fragment);
  });

  matches.value = found;
  if (found.length) {
    currentMatchIndex.value = 0;
    activateCurrentMatch(scrollToCurrent);
  }
};

const scheduleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    performSearch();
  }, 120);
};

const focusInput = (selectAll = true) => {
  nextTick(() => {
    if (!inputRef.value) return;
    inputRef.value.focus();
    if (selectAll) {
      inputRef.value.select();
    }
  });
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

  currentMatchIndex.value =
    (currentMatchIndex.value - 1 + matches.value.length) % matches.value.length;
  activateCurrentMatch(true);
};

const handleEnter = (event) => {
  if (event.shiftKey) {
    findPrevious();
    return;
  }
  findNext();
};

const toggleMatchCase = () => {
  matchCase.value = !matchCase.value;
};

const closePanel = () => {
  emit("close");
};

watch([query, matchCase], () => {
  if (!props.visible) return;
  scheduleSearch();
});

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      captureScrollSnapshot();
      await nextTick();
      focusInput();
      if (query.value.trim()) {
        scheduleSearch();
      }
      return;
    }

    clearHighlights();
    restoreScrollSnapshot();
  }
);

onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  clearHighlights();
  restoreScrollSnapshot();
});

defineExpose({
  focusInput,
  findNext,
  findPrevious,
});
</script>

<style scoped>
.global-search-panel {
  position: fixed;
  top: 46px;
  right: 20px;
  width: min(420px, calc(100vw - 24px));
  z-index: 10001;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  color: var(--text-secondary);
  font-size: 14px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 8px;
  height: 34px;
  padding: 0 10px;
  outline: none;
  min-width: 0;
}

.search-input:focus {
  border-color: var(--primary-color);
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.result-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn,
.nav-btn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.icon-btn:hover,
.nav-btn:hover {
  background: var(--bg-tertiary, var(--bg-secondary));
  border-color: var(--primary-color);
}

.icon-btn.active {
  background: color-mix(in srgb, var(--primary-color) 20%, transparent);
  border-color: var(--primary-color);
}

.icon-btn:disabled,
.nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.close-btn {
  margin-left: auto;
}

.match-case-btn {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.global-find-panel-enter-active,
.global-find-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.global-find-panel-enter-from,
.global-find-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.99);
}

@media (max-width: 768px) {
  .global-search-panel {
    top: 44px;
    right: 8px;
    width: calc(100vw - 16px);
  }
}

:global(mark.global-find-mark) {
  background: color-mix(in srgb, #ffd25f 65%, transparent);
  color: inherit;
  border-radius: 3px;
  padding: 0 1px;
}

:global(mark.global-find-mark.active) {
  background: color-mix(in srgb, #ff8f6b 70%, transparent);
}
</style>
