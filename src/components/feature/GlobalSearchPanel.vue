<template>
  <Teleport to="body">
    <transition name="global-find-panel">
      <section v-show="visible" class="global-search-panel" @keydown.stop>
        <div class="search-row">
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" class="search-icon" />
          <input
            ref="inputRef"
            v-model="query"
            class="search-input"
            type="text"
            :placeholder="t('archiveSearch.searchPanel.placeholder')"
            @keydown.enter.prevent="handleEnter"
            @keydown.esc.prevent="closePanel"
            @focus="onInputFocus"
            @blur="onInputBlur"
            @keydown.down.prevent="highlightNextHistory"
            @keydown.up.prevent="highlightPrevHistory"
          />
          <button
            class="icon-btn match-case-btn"
            :class="{ active: matchCase }"
            type="button"
            :title="t('archiveSearch.searchPanel.matchCase')"
            @click="toggleMatchCase"
          >
            Aa
          </button>
          <button class="icon-btn close-btn" type="button" :title="t('common.close')" @click="closePanel">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Advanced query tags -->
        <div
          v-if="advancedQuery && (advancedQuery.name || advancedQuery.level || advancedQuery.difficulty)"
          class="advanced-tags"
        >
          <span v-if="advancedQuery.name" class="adv-tag adv-tag-name">
            <font-awesome-icon icon="fa-solid fa-tag" /> name:{{ advancedQuery.name }}
          </span>
          <span v-if="advancedQuery.level" class="adv-tag adv-tag-level">
            <font-awesome-icon icon="fa-solid fa-layer-group" /> level:{{ advancedQuery.level }}
          </span>
          <span v-if="advancedQuery.difficulty" class="adv-tag adv-tag-difficulty">
            <font-awesome-icon icon="fa-solid fa-gauge-high" /> difficulty:{{ advancedQuery.difficulty }}
          </span>
        </div>

        <!-- Search history -->
        <div v-if="showHistory && searchHistory.length > 0" class="search-history-dropdown" @mousedown.prevent>
          <div class="history-header">
            <span class="history-title">{{ t("archiveSearch.searchHistory") }}</span>
            <button class="history-clear-btn" type="button" @click="clearHistory">
              {{ t("archiveSearch.clearHistory") }}
            </button>
          </div>
          <div
            v-for="(item, idx) in filteredHistory"
            :key="idx"
            class="history-item"
            :class="{ 'history-item-highlighted': highlightedHistoryIdx === idx }"
            @mousedown.prevent="selectHistoryItem(item)"
          >
            <font-awesome-icon icon="fa-solid fa-clock-rotate-left" class="history-icon" />
            <span class="history-text">{{ item }}</span>
          </div>
        </div>

        <div class="toolbar-row">
          <span class="result-text">{{ resultText }}</span>
          <div class="action-group">
            <button
              class="nav-btn"
              type="button"
              :disabled="!matches.length"
              :title="t('archiveSearch.searchPanel.previous')"
              @click="findPrevious"
            >
              <font-awesome-icon icon="fa-solid fa-chevron-up" />
            </button>
            <button
              class="nav-btn"
              type="button"
              :disabled="!matches.length"
              :title="t('archiveSearch.searchPanel.next')"
              @click="findNext"
            >
              <font-awesome-icon icon="fa-solid fa-chevron-down" />
            </button>
          </div>
        </div>
      </section>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobalSearchPanel } from "@/composables/useGlobalSearchPanel";

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);

const inputRef = ref(null);
const visibleRef = toRef(props, "visible");
const highlightedHistoryIdx = ref(-1);

const { t } = useI18n({ useScope: "global" });
const {
  query,
  matchCase,
  matches,
  currentMatchIndex,
  advancedQuery,
  searchHistory,
  showHistory,
  captureScrollSnapshot,
  restoreScrollSnapshot,
  findNext,
  findPrevious,
  focusInput,
  cleanup,
  scheduleSearch,
  selectHistoryItem,
  clearHistory,
} = useGlobalSearchPanel();

const resultText = computed(() => {
  if (!query.value.trim()) return t("archiveSearch.searchPanel.hint");
  if (!matches.value.length) return t("archiveSearch.searchPanel.noResult");
  return `${currentMatchIndex.value + 1} / ${matches.value.length}`;
});

/** Filter history items that match the current query prefix */
const filteredHistory = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return searchHistory.value;
  return searchHistory.value.filter((item) => item.toLowerCase().includes(q));
});

const handleEnter = (event) => {
  // If history is shown and an item is highlighted, select it
  if (showHistory.value && highlightedHistoryIdx.value >= 0 && filteredHistory.value[highlightedHistoryIdx.value]) {
    selectHistoryItem(filteredHistory.value[highlightedHistoryIdx.value]);
    highlightedHistoryIdx.value = -1;
    return;
  }
  if (event.shiftKey) {
    findPrevious();
    return;
  }
  findNext();
};

const toggleMatchCase = () => {
  matchCase.value = !matchCase.value;
};
const closePanel = () => emit("close");
const exposeFocusInput = (selectAll = true) => {
  focusInput(inputRef, selectAll);
};

const onInputFocus = () => {
  if (searchHistory.value.length > 0) {
    showHistory.value = true;
  }
};

const onInputBlur = () => {
  // Delay hiding so click on history item registers
  setTimeout(() => {
    showHistory.value = false;
    highlightedHistoryIdx.value = -1;
  }, 200);
};

const highlightNextHistory = () => {
  if (!showHistory.value || !filteredHistory.value.length) return;
  highlightedHistoryIdx.value = (highlightedHistoryIdx.value + 1) % filteredHistory.value.length;
};

const highlightPrevHistory = () => {
  if (!showHistory.value || !filteredHistory.value.length) return;
  highlightedHistoryIdx.value =
    (highlightedHistoryIdx.value - 1 + filteredHistory.value.length) % filteredHistory.value.length;
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
      if (inputRef?.value) {
        focusInput(inputRef);
      }
      return;
    }
    restoreScrollSnapshot();
    showHistory.value = false;
    highlightedHistoryIdx.value = -1;
  },
);

onUnmounted(() => {
  cleanup();
});

defineExpose({ focusInput: exposeFocusInput, findNext, findPrevious });
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
  border-radius: var(--radius-md);
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
  border-radius: var(--radius-input);
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
  border-radius: var(--radius-button);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
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

/* ===== Advanced Query Tags ===== */
.advanced-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
}

.adv-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-tag);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.adv-tag svg {
  font-size: 10px;
}

.adv-tag-name {
  background: color-mix(in srgb, #3b82f6 15%, transparent);
  color: #3b82f6;
  border: 1px solid color-mix(in srgb, #3b82f6 30%, transparent);
}

.adv-tag-level {
  background: color-mix(in srgb, #8b5cf6 15%, transparent);
  color: #8b5cf6;
  border: 1px solid color-mix(in srgb, #8b5cf6 30%, transparent);
}

.adv-tag-difficulty {
  background: color-mix(in srgb, #f59e0b 15%, transparent);
  color: #f59e0b;
  border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
}

/* ===== Search History ===== */
.search-history-dropdown {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xs);
  background: var(--bg-secondary);
  max-height: 200px;
  overflow-y: auto;
  padding: 6px 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px 4px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 4px;
}

.history-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.history-clear-btn {
  background: none;
  border: none;
  font-size: 11px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-button);
}

.history-clear-btn:hover {
  color: var(--error-color, #ef4444);
  background: color-mix(in srgb, var(--error-color, #ef4444) 10%, transparent);
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background 0.15s ease;
}

.history-item:hover,
.history-item-highlighted {
  background: var(--bg-tertiary);
}

.history-icon {
  font-size: 11px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.history-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-find-panel-enter-active,
.global-find-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
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
  border-radius: var(--radius-xs);
  padding: 0 1px;
}

:global(mark.global-find-mark.active) {
  background: color-mix(in srgb, #ff8f6b 70%, transparent);
}
</style>
