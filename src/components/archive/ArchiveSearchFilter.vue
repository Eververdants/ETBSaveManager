<template>
  <div class="archive-search-filter">
    <div class="search-filter-wrapper">
      <div v-squircle="44" class="unified-search-filter">
        <!-- 搜索区域 -->
        <div class="search-section">
          <div class="search-input-group">
            <font-awesome-icon icon="fa-solid fa-search" class="search-icon" />
            <input
ref="searchInputRef" v-model="searchQueryModel" v-squircle:pill
              type="text" :placeholder="$t('archiveSearch.searchPlaceholder')" class="search-input"
              @focus="showSuggestions = true" @blur="onSearchBlur" />
            <transition name="clear-btn" mode="out-in">
              <button v-if="searchQueryModel" key="clear-btn" class="clear-btn" @click="clearSearch">
                <font-awesome-icon icon="fa-solid fa-times" />
              </button>
            </transition>
          </div>

          <!-- 搜索建议面板 -->
          <transition name="suggestions-fade">
            <div
v-if="showSuggestions && (suggestionList.length > 0 || searchHistoryList.length > 0)"
              class="search-suggestions" @mousedown.prevent>
              <!-- 搜索建议 -->
              <div v-if="suggestionList.length > 0 && searchQueryModel" class="suggestions-group">
                <div class="suggestions-label">{{ $t("archiveSearch.suggestions") }}</div>
                <div
v-for="suggestion in suggestionList" :key="suggestion.id" class="suggestion-item"
                  @mousedown.prevent="selectSuggestion(suggestion.name)">
                  <font-awesome-icon icon="fa-solid fa-file" class="suggestion-icon" />
                  <span class="suggestion-text">{{ suggestion.name }}</span>
                </div>
              </div>
              <!-- 搜索历史 -->
              <div v-if="searchHistoryList.length > 0" class="suggestions-group">
                <div class="suggestions-label suggestions-label-row">
                  <span>{{ $t("archiveSearch.searchHistory") }}</span>
                  <button class="clear-history-btn" @mousedown.prevent="clearSearchHistory">
                    {{ $t("archiveSearch.clearHistory") }}
                  </button>
                </div>
                <div
v-for="(historyItem, idx) in searchHistoryList" :key="'h-' + idx"
                  class="suggestion-item history-item" @mousedown.prevent="selectSuggestion(historyItem)">
                  <font-awesome-icon icon="fa-solid fa-clock" class="suggestion-icon" />
                  <span class="suggestion-text">{{ historyItem }}</span>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 筛选区域 -->
        <div class="filter-section">
          <div class="filter-grid">
            <div class="filter-item">
              <label class="filter-label">{{ $t("archiveSearch.archiveDifficulty") }}</label>
              <CustomDropdown
:model-value="selectedArchiveDifficultyModel" :options="difficultyOptions"
                :placeholder="$t('archiveSearch.archiveDifficulty')"
                @update:model-value="$emit('update:selectedArchiveDifficulty', $event)" />
            </div>

            <div v-if="!FEATURES.MERGE_DIFFICULTY" class="filter-item">
              <label class="filter-label">{{ $t("archiveSearch.actualDifficulty") }}</label>
              <CustomDropdown
:model-value="selectedActualDifficultyModel" :options="difficultyOptions"
                :placeholder="$t('archiveSearch.actualDifficulty')"
                @update:model-value="$emit('update:selectedActualDifficulty', $event)" />
            </div>

            <div class="filter-item">
              <label class="filter-label">{{ $t("archiveSearch.visibility") }}</label>
              <CustomDropdown
:model-value="selectedVisibilityModel" :options="visibilityOptions"
                :placeholder="$t('archiveSearch.visibility')"
                @update:model-value="$emit('update:selectedVisibility', $event)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, type PropType } from "vue";
import { useI18n } from "vue-i18n";
import CustomDropdown from "../ui/CustomDropdown.vue";
import type { ArchiveData } from "@/types";
import {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory as clearHistoryStorage,
} from "@/composables/useArchiveSearchFilter";
import { FEATURES } from "@/config/features";

const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  searchQuery: { type: String, default: "" },
  selectedArchiveDifficulty: { type: String, default: "" },
  selectedActualDifficulty: { type: String, default: "" },
  selectedVisibility: { type: String, default: "" },
  searchSuggestions: { type: Array as PropType<ArchiveData[]>, default: () => [] },
});

const emit = defineEmits([
  "update:searchQuery",
  "update:selectedArchiveDifficulty",
  "update:selectedActualDifficulty",
  "update:selectedVisibility",
  "close",
]);

// 搜索建议与历史
const searchInputRef = ref<HTMLInputElement | null>(null);
const showSuggestions = ref(false);
const searchHistoryList = ref(getSearchHistory());
const suggestionList = computed(() => props.searchSuggestions || []);

// Local v-model proxies
const searchQueryModel = computed({
  get: () => props.searchQuery,
  set: (val: string) => emit("update:searchQuery", val),
});
const selectedArchiveDifficultyModel = computed({
  get: () => props.selectedArchiveDifficulty,
  set: (val: string) => emit("update:selectedArchiveDifficulty", val),
});
const selectedActualDifficultyModel = computed({
  get: () => props.selectedActualDifficulty,
  set: (val: string) => emit("update:selectedActualDifficulty", val),
});
const selectedVisibilityModel = computed({
  get: () => props.selectedVisibility,
  set: (val: string) => emit("update:selectedVisibility", val),
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.stopPropagation();
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

const difficultyOptions = computed(() => [
  { value: "", label: t("archiveSearch.allDifficulties") },
  { value: "easy", label: t("createArchive.difficultyLevels.easy") },
  { value: "normal", label: t("createArchive.difficultyLevels.normal") },
  { value: "hard", label: t("createArchive.difficultyLevels.hard") },
  { value: "nightmare", label: t("createArchive.difficultyLevels.nightmare") },
]);

const visibilityOptions = computed(() => [
  { value: "", label: t("archiveSearch.allVisibilities") },
  { value: "visible", label: t("archiveSearch.visible") },
  { value: "hidden", label: t("archiveSearch.hidden") },
]);

const clearSearch = () => {
  searchQueryModel.value = "";
  showSuggestions.value = false;
};

const onSearchBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
  if (props.searchQuery) {
    addSearchHistory(props.searchQuery);
    searchHistoryList.value = getSearchHistory();
  }
};

const selectSuggestion = (text: string) => {
  searchQueryModel.value = text;
  showSuggestions.value = false;
  addSearchHistory(text);
  searchHistoryList.value = getSearchHistory();
  nextTick(() => searchInputRef.value?.focus());
};

const clearSearchHistory = () => {
  clearHistoryStorage();
  searchHistoryList.value = [];
};

// 输入防抖：150ms 后保存搜索历史
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQueryModel, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null;
    if (props.searchQuery) {
      addSearchHistory(props.searchQuery);
      searchHistoryList.value = getSearchHistory();
    }
  }, 150);
});

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
  if (props.searchQuery) {
    addSearchHistory(props.searchQuery);
  }
});
</script>

<style scoped>
.archive-search-filter {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0;
  height: auto;
  max-height: 80vh;
  overflow-y: auto;
  box-sizing: border-box;
  /* 移除固定定位，因为父容器search-overlay已经是固定定位 */
  /* 强制硬件加速 */
  backface-visibility: hidden;
  perspective: 1000;
  transform: translateZ(0);
}

.search-filter-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

/* 一体化搜索筛选区域 - 移除性能消耗大的效果 */
.unified-search-filter {
  display: flex;
  flex-direction: column;
  /* 改为垂直布局，适应小屏幕 */
  gap: 16px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.95));
  border-radius: var(--radius-xl);
  padding: 24px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  box-shadow: var(--shadow-xl, 0 8px 32px rgba(0, 0, 0, 0.15));
  z-index: 100;
  width: 100%;
  max-width: 800px;
  max-height: 70vh;
  overflow-y: auto;
  box-sizing: border-box;
  margin: 0 auto;
  /* 确保在移动设备上也能正确滚动 */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 搜索区域 */
.search-section {
  width: 100%;
}

.search-input-group {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 48px 12px 44px;
  border: none;
  border-radius: var(--radius-xl);
  background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  height: 48px;
  box-sizing: border-box;
  box-shadow: var(--shadow-sm, inset 0 1px 3px rgba(0, 0, 0, 0.1));
  transition:
    background 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input:focus {
  outline: none;
  box-shadow:
    0 0 0 3px var(--accent-alpha, rgba(59, 130, 246, 0.2)),
    var(--shadow-sm, inset 0 1px 3px rgba(0, 0, 0, 0.1));
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 1;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 16px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.search-input:focus+.search-icon,
.search-input-group:focus-within .search-icon {
  opacity: 1;
  color: var(--accent, #3b82f6);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  background: var(--bg-secondary, rgba(0, 0, 0, 0.06));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  border-radius: var(--radius-md);
  transition:
    background 0.3s ease,
    color 0.3s ease,
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-top: -15px;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1));
}

.clear-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.clear-btn:active {
  transform: scale(0.95);
}

/* 筛选区域 */
.filter-section {
  width: 100%;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
  flex: 1;
}

.filter-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  padding: 4px 10px;
  background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
  border-radius: var(--radius-xs);
  display: inline-block;
  transition:
    background 0.3s ease,
    color 0.3s ease;
}

/* 搜索输入框焦点动画 */
.search-input-group {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input-group:focus-within {
  transform: scale(1.02);
}

/* 清除按钮动画 */
.clear-btn {
  animation: clearBtnAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-btn-enter-active {
  animation: clearBtnAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.clear-btn-leave-active {
  animation: clearBtnDisappear 0.2s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes clearBtnAppear {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes clearBtnDisappear {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* 筛选标签动画 */
.filter-label {
  animation: labelSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes labelSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }

  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 筛选项目动画 */
.filter-item {
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s ease;
  border-radius: var(--radius-md);
  padding: 4px;
}

.filter-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.filter-item:active {
  transform: translateY(0);
}

/* 搜索建议面板 */
.search-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--card-bg, rgba(255, 255, 255, 0.98));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 200;
  max-height: 300px;
  overflow-y: auto;
  backdrop-filter: blur(20px);
}

.suggestions-group {
  padding: 8px;
}

.suggestions-group+.suggestions-group {
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
}

.suggestions-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 6px 10px;
}

.suggestions-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-history-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 11px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  transition: background 0.2s ease;
}

.clear-history-btn:hover {
  background: rgba(var(--accent-color-rgb), 0.1);
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease;
}

.suggestion-item:hover {
  background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
}

.suggestion-icon {
  font-size: 12px;
  color: var(--text-tertiary);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.suggestion-text {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestions-fade-enter-active,
.suggestions-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.suggestions-fade-enter-from,
.suggestions-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 搜索结果高亮 */
:deep(.search-highlight) {
  background: rgba(var(--accent-color-rgb), 0.2);
  color: var(--accent-color);
  border-radius: var(--radius-xs);
  padding: 0 3px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .unified-search-filter {
    flex-direction: column;
    min-width: auto;
    max-width: 600px;
  }

  .search-section {
    flex: none;
    width: 100%;
    padding-right: 0;
    padding-bottom: 16px;
    border-right: none;
    border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
  }

  .filter-section {
    padding-left: 0;
    padding-top: 16px;
    width: 100%;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .filter-item {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .search-filter-wrapper {
    padding: 0 16px;
  }

  .unified-search-filter {
    padding: 12px 16px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .search-input {
    font-size: 14px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .unified-search-filter {
    margin: 0 10px;
    padding: 16px 12px;
  }

  .search-section {
    padding-bottom: 12px;
  }

  .filter-section {
    padding-top: 12px;
  }

  .filter-grid {
    gap: 12px;
  }

  .filter-item {
    min-width: auto;
  }
}
</style>
