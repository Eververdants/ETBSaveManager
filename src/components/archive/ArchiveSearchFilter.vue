<template>
  <div class="archive-search-filter">
    <div class="search-filter-wrapper">
      <!-- 一体化搜索筛选区域 -->
      <transition name="search-filter" appear :duration="{ enter: 400, leave: 300 }" @before-enter="beforeEnter"
        @enter="enter" @leave="leave">
        <div class="unified-search-filter" v-show="showComponent">
          <!-- 搜索区域 -->
          <div class="search-section">
            <div class="search-input-group">
              <font-awesome-icon icon="fa-solid fa-search" class="search-icon" />
              <input v-model="searchQuery" type="text" :placeholder="$t('archiveSearch.searchPlaceholder')"
                class="search-input" />
              <transition name="clear-btn" mode="out-in">
                <button v-if="searchQuery" @click="clearSearch" class="clear-btn" key="clear-btn">
                  <font-awesome-icon icon="fa-solid fa-times" />
                </button>
              </transition>
            </div>
          </div>

          <!-- 筛选区域 -->
          <div class="filter-section">
            <div class="filter-grid">
              <div class="filter-item">
                <label class="filter-label">{{
                  $t("archiveSearch.archiveDifficulty")
                }}</label>
                <CustomDropdown v-model="selectedArchiveDifficulty" :options="difficultyOptions"
                  :placeholder="$t('archiveSearch.archiveDifficulty')" @change="handleFilterChange" />
              </div>

              <div class="filter-item">
                <label class="filter-label">{{
                  $t("archiveSearch.actualDifficulty")
                }}</label>
                <CustomDropdown v-model="selectedActualDifficulty" :options="difficultyOptions"
                  :placeholder="$t('archiveSearch.actualDifficulty')" @change="handleFilterChange" />
              </div>

              <div class="filter-item">
                <label class="filter-label">{{
                  $t("archiveSearch.visibility")
                }}</label>
                <CustomDropdown v-model="selectedVisibility" :options="visibilityOptions"
                  :placeholder="$t('archiveSearch.visibility')" @change="handleFilterChange" />
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import CustomDropdown from "../ui/CustomDropdown.vue";
import { safeModifyBodyStyles, protectFloatingButtonPosition } from "../../utils/floatingButtonProtection.js";

const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  archives: { type: Array, default: () => [] },
  initialFilters: {
    type: Object,
    default: () => ({
      searchQuery: "",
      selectedArchiveDifficulty: "",
      selectedActualDifficulty: "",
      selectedVisibility: "",
    }),
  },
  animationDelay: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
});

const emit = defineEmits(["filtered", "filters-changed"]);

const useSearchState = (initialFiltersGetter) => {
  const filters = typeof initialFiltersGetter === 'function' ? initialFiltersGetter() : initialFiltersGetter;
  const searchQuery = ref(filters?.value?.searchQuery || filters?.searchQuery || "");
  const selectedArchiveDifficulty = ref(filters?.value?.selectedArchiveDifficulty || filters?.selectedArchiveDifficulty || "");
  const selectedActualDifficulty = ref(filters?.value?.selectedActualDifficulty || filters?.selectedActualDifficulty || "");
  const selectedVisibility = ref(filters?.value?.selectedVisibility || filters?.selectedVisibility || "");

  return { searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility };
};

const useFilterOptions = (t) => {
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

  return { difficultyOptions, visibilityOptions };
};

const useFilterState = (searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility) => {
  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value ||
      selectedArchiveDifficulty.value ||
      selectedActualDifficulty.value ||
      selectedVisibility.value
    );
  });

  return { hasActiveFilters };
};

const useArchiveFilter = (archivesGetter, searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility) => {
  const filteredArchives = computed(() => {
    const archivesSource = typeof archivesGetter === 'function' ? archivesGetter() : archivesGetter;
    const archivesArray = archivesSource?.value || archivesSource;
    if (!archivesArray || archivesArray.length === 0) return [];
    let filtered = archivesArray;

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter((archive) => archive.name.toLowerCase().includes(query));
    }

    if (selectedArchiveDifficulty.value) {
      filtered = filtered.filter((archive) => archive.archiveDifficulty === selectedArchiveDifficulty.value);
    }

    if (selectedActualDifficulty.value) {
      filtered = filtered.filter((archive) => archive.actualDifficulty === selectedActualDifficulty.value);
    }

    if (selectedVisibility.value) {
      const isVisible = selectedVisibility.value === "visible";
      filtered = filtered.filter((archive) => archive.isVisible === isVisible);
    }

    return filtered;
  });

  return { filteredArchives };
};

const useFilterActions = (emit, filteredArchives) => {
  const emitFiltersChanged = () => {
    emit("filters-changed", {
      searchQuery: searchQuery.value,
      selectedArchiveDifficulty: selectedArchiveDifficulty.value,
      selectedActualDifficulty: selectedActualDifficulty.value,
      selectedVisibility: selectedVisibility.value,
    });
  };

  const handleSearchChange = () => {
    nextTick(() => {
      emit("filtered", filteredArchives.value);
      emitFiltersChanged();
    });
  };

  const handleFilterChange = () => {
    emit("filtered", filteredArchives.value);
    emitFiltersChanged();
  };

  const clearSearch = () => {
    searchQuery.value = "";
    emit("filtered", filteredArchives.value);
    emitFiltersChanged();
  };

  const clearAllFilters = () => {
    searchQuery.value = "";
    selectedArchiveDifficulty.value = "";
    selectedActualDifficulty.value = "";
    selectedVisibility.value = "";
    emit("filtered", filteredArchives.value);
    emitFiltersChanged();
  };

  return { handleSearchChange, handleFilterChange, clearSearch, clearAllFilters, emitFiltersChanged };
};

const useVisibilityHandler = (visibleGetter) => {
  const showComponent = ref(true);

  watch(
    () => {
      const visible = typeof visibleGetter === 'function' ? visibleGetter() : visibleGetter;
      return visible?.value || visible;
    },
    (newVal) => {
      showComponent.value = newVal;
      const mainContent = document.querySelector(".main-content");
      const archiveListContainer = document.querySelector(".archive-list-container");

      if (newVal) {
        if (mainContent) {
          mainContent.dataset.scrollY = mainContent.scrollTop;
          mainContent.style.overflow = "hidden";
        }
        if (archiveListContainer) {
          archiveListContainer.dataset.scrollY = archiveListContainer.scrollTop;
          archiveListContainer.style.overflow = "hidden";
        }

        const currentScrollY = window.scrollY;
        safeModifyBodyStyles({ overflow: "hidden", position: "fixed", top: `-${currentScrollY}px`, width: "100%", height: "100vh" });
      } else {
        if (mainContent) {
          mainContent.style.overflow = "";
          if (mainContent.dataset.scrollY) {
            mainContent.scrollTo({ top: parseInt(mainContent.dataset.scrollY), behavior: "smooth" });
          }
        }
        if (archiveListContainer) {
          archiveListContainer.style.overflow = "";
          if (archiveListContainer.dataset.scrollY) {
            archiveListContainer.scrollTo({ top: parseInt(archiveListContainer.dataset.scrollY), behavior: "smooth" });
          }
        }

        safeModifyBodyStyles({ overflow: "", position: "", top: "", width: "", height: "auto" });
        protectFloatingButtonPosition();

        const scrollY = document.body.style.top;
        if (scrollY) {
          window.scrollTo({ top: parseInt(scrollY || "0") * -1, behavior: "smooth" });
        }
      }
    },
    { immediate: true }
  );

  return { showComponent };
};

const useAnimationControls = () => {
  const beforeEnter = (el) => {
    el.style.willChange = "opacity, transform";
    el.style.opacity = "0";
    el.style.transform = "translateY(-15px)";
  };

  const enter = (el, done) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        setTimeout(() => {
          el.style.transition = "";
          el.style.willChange = "";
          done();
        }, 300);
      });
    });
  };

  const leave = (el, done) => {
    el.style.willChange = "opacity, transform";
    el.style.transition = "opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)";
    el.style.opacity = "0";
    el.style.transform = "translateY(-8px)";
    setTimeout(() => {
      el.style.transition = "";
      el.style.willChange = "";
      done();
    }, 250);
  };

  return { beforeEnter, enter, leave };
};

const { searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility } = useSearchState(() => props.initialFilters);
const { difficultyOptions, visibilityOptions } = useFilterOptions(t);
const { hasActiveFilters } = useFilterState(searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility);
const { filteredArchives } = useArchiveFilter(() => props.archives, searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility);
const { handleSearchChange, handleFilterChange, clearSearch, clearAllFilters } = useFilterActions(emit, filteredArchives);
const { showComponent } = useVisibilityHandler(() => props.visible);
const { beforeEnter, enter, leave } = useAnimationControls();

watch(searchQuery, handleSearchChange);

watch(
  () => props.initialFilters,
  (newFilters) => {
    if (!newFilters) return;
    searchQuery.value = newFilters.searchQuery || "";
    selectedArchiveDifficulty.value = newFilters.selectedArchiveDifficulty || "";
    selectedActualDifficulty.value = newFilters.selectedActualDifficulty || "";
    selectedVisibility.value = newFilters.selectedVisibility || "";
  },
  { deep: true }
);

watch(
  () => props.archives,
  (newArchives) => {
    if (newArchives && newArchives.length > 0) {
      emit("filtered", filteredArchives.value);
    }
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    if (props.archives.length > 0) {
      emit("filtered", filteredArchives.value);
    }
  });
});

onUnmounted(() => {
  const scrollY = document.body.style.top;
  safeModifyBodyStyles(() => {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.height = "auto";
  });
  protectFloatingButtonPosition();
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
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
  background: var(--glass-bg, rgba(30, 30, 30, 0.95));
  border-radius: 16px;
  padding: 20px;
  border: var(--card-border, 1px solid rgba(255, 255, 255, 0.1));
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
  border-radius: 12px;
  background: var(--bg-secondary, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #ffffff);
  font-size: 15px;
  outline: none;
  height: 48px;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: var(--bg-secondary-hover, rgba(255, 255, 255, 0.15));
}

.search-input::placeholder {
  color: var(--text-secondary, #888);
  opacity: 0.8;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #666);
  font-size: 16px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  box-sizing: border-box;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 18%;
  background: transparent;
  border: none;
  color: var(--text-secondary, #666);
  cursor: pointer;
  padding: 0;
  border-radius: 6px;
  transition: all 0.2s ease;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-top: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.clear-btn:hover {
  color: var(--error-color, #ff6b6b);
  background: rgba(255, 107, 107, 0.1);
  overflow: hidden;
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
  color: var(--text-secondary, #888);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

/* 搜索筛选区域过渡动画 - 首次加载优化 */
.search-filter-enter-active {
  will-change: opacity, transform;
  transition: opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-filter-leave-active {
  will-change: opacity, transform;
  transition: opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-filter-enter-from {
  opacity: 0;
  transform: translateY(-15px);
}

.search-filter-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 搜索图标动画 - 微妙效果 */
.search-icon {
  transition: opacity 0.2s ease-out 0.1s, transform 0.2s ease-out 0.1s;
}

/* 搜索输入框动画 - 微妙效果 */
.search-input {
  transition: opacity 0.2s ease-out 0.15s, transform 0.2s ease-out 0.15s;
}

/* 筛选区域动画 - 微妙效果 */
.filter-section {
  transition: opacity 0.2s ease-out 0.2s, transform 0.2s ease-out 0.2s;
}

/* 筛选项目动画 - 微妙效果 */
.filter-item {
  transition: opacity 0.15s ease-out 0.25s, transform 0.15s ease-out 0.25s;
}

.filter-item:nth-child(3) {
  animation-delay: 0.7s;
}

.filter-item:nth-child(4) {
  animation-delay: 0.8s;
}

@keyframes itemFadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
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
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-item:hover {
  transform: translateY(-1px);
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  }

  .search-section {
    padding-bottom: 12px;
  }

  .filter-section {
    padding-top: 12px;
  }
}
</style>
