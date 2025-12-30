<template>
  <div class="archive-search-filter">
    <div class="search-filter-wrapper">
      <!-- 一体化搜索筛选区域 -->
      <transition
        name="search-filter"
        appear
        :duration="{ enter: 400, leave: 300 }"
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave"
      >
        <div class="unified-search-filter" v-show="showComponent">
          <!-- 搜索区域 -->
          <div class="search-section">
            <div class="search-input-group">
              <font-awesome-icon
                icon="fa-solid fa-search"
                class="search-icon"
              />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="$t('archiveSearch.searchPlaceholder')"
                class="search-input"
              />
              <transition name="clear-btn" mode="out-in">
                <button
                  v-if="searchQuery"
                  @click="clearSearch"
                  class="clear-btn"
                  key="clear-btn"
                >
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
                <CustomDropdown
                  v-model="selectedArchiveDifficulty"
                  :options="difficultyOptions"
                  :placeholder="$t('archiveSearch.archiveDifficulty')"
                  @change="handleFilterChange"
                />
              </div>

              <div class="filter-item">
                <label class="filter-label">{{
                  $t("archiveSearch.actualDifficulty")
                }}</label>
                <CustomDropdown
                  v-model="selectedActualDifficulty"
                  :options="difficultyOptions"
                  :placeholder="$t('archiveSearch.actualDifficulty')"
                  @change="handleFilterChange"
                />
              </div>

              <div class="filter-item">
                <label class="filter-label">{{
                  $t("archiveSearch.visibility")
                }}</label>
                <CustomDropdown
                  v-model="selectedVisibility"
                  :options="visibilityOptions"
                  :placeholder="$t('archiveSearch.visibility')"
                  @change="handleFilterChange"
                />
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
import CustomDropdown from "./CustomDropdown.vue";
import {
  safeModifyBodyStyles,
  protectFloatingButtonPosition,
} from "../utils/floatingButtonProtection.js";

const { t } = useI18n({ useScope: "global" });

// Props
// 控制组件显示状态
const showComponent = ref(true);

const props = defineProps({
  archives: {
    type: Array,
    default: () => [],
  },
  initialFilters: {
    type: Object,
    default: () => ({
      searchQuery: "",
      selectedArchiveDifficulty: "",
      selectedActualDifficulty: "",
      selectedVisibility: "",
    }),
  },
  // 新增：控制动画延迟
  animationDelay: {
    type: Number,
    default: 0,
  },
  // 新增：控制组件可见性
  visible: {
    type: Boolean,
    default: true,
  },
});

// 监听visible prop变化
watch(
  () => props.visible,
  (newVal) => {
    showComponent.value = newVal;

    // 获取主内容容器
    const mainContent = document.querySelector(".main-content");
    const archiveListContainer = document.querySelector(
      ".archive-list-container"
    );

    // 当组件显示时，阻止背景滚动但不改变滚动位置
    if (newVal) {
      // 保存当前滚动位置但不改变它
      if (mainContent) {
        mainContent.dataset.scrollY = mainContent.scrollTop;
        mainContent.style.overflow = "hidden";
      }

      if (archiveListContainer) {
        archiveListContainer.dataset.scrollY = archiveListContainer.scrollTop;
        archiveListContainer.style.overflow = "hidden";
      }

      // 使用全局保护工具安全修改body样式，但保持当前滚动位置
      const currentScrollY = window.scrollY;
      safeModifyBodyStyles({
        overflow: "hidden",
        position: "fixed",
        top: `-${currentScrollY}px`,
        width: "100%",
        height: "100vh",
      });

      // 移除设置组件固定定位的代码，因为父容器search-overlay已经是固定定位
    } else {
      // 恢复滚动位置
      if (mainContent) {
        mainContent.style.overflow = "";
        if (mainContent.dataset.scrollY) {
          // 使用平滑滚动恢复位置
          const scrollPosition = parseInt(mainContent.dataset.scrollY);
          mainContent.scrollTo({
            top: scrollPosition,
            behavior: "smooth",
          });
        }
      }

      if (archiveListContainer) {
        archiveListContainer.style.overflow = "";
        if (archiveListContainer.dataset.scrollY) {
          // 使用平滑滚动恢复位置
          const scrollPosition = parseInt(archiveListContainer.dataset.scrollY);
          archiveListContainer.scrollTo({
            top: scrollPosition,
            behavior: "smooth",
          });
        }
      }

      // 使用全局保护工具安全修改body样式
      safeModifyBodyStyles({
        overflow: "",
        position: "",
        top: "",
        width: "",
        height: "auto",
      });

      // 使用全局保护工具确保浮动按钮位置正确
      protectFloatingButtonPosition();

      const scrollY = document.body.style.top;
      if (scrollY) {
        window.scrollTo({
          top: parseInt(scrollY || "0") * -1,
          behavior: "smooth",
        });
      }
    }
  },
  { immediate: true }
); // 添加immediate选项确保在组件创建时就执行

// Emits
const emit = defineEmits(["filtered", "filters-changed"]);

// 响应式数据 - 使用initialFilters初始化
const searchQuery = ref(props.initialFilters.searchQuery || "");
const selectedArchiveDifficulty = ref(
  props.initialFilters.selectedArchiveDifficulty || ""
);
const selectedActualDifficulty = ref(
  props.initialFilters.selectedActualDifficulty || ""
);
const selectedVisibility = ref(props.initialFilters.selectedVisibility || "");

// 监听搜索查询变化，实现在输入时立即筛选
watch(searchQuery, () => {
  // 使用 nextTick 确保在 DOM 更新后执行筛选
  nextTick(() => {
    handleSearchChange();
  });
});

// 监听initialFilters变化，确保父组件更新筛选条件时子组件能正确响应
watch(
  () => props.initialFilters,
  (newFilters) => {
    searchQuery.value = newFilters.searchQuery || "";
    selectedArchiveDifficulty.value =
      newFilters.selectedArchiveDifficulty || "";
    selectedActualDifficulty.value = newFilters.selectedActualDifficulty || "";
    selectedVisibility.value = newFilters.selectedVisibility || "";
  },
  { deep: true }
);

// 选项数据
const gameModeOptions = computed(() => [
  { value: "", label: t("archiveSearch.allModes") },
  { value: "singleplayer", label: t("createArchive.gameModes.singleplayer") },
  { value: "multiplayer", label: t("createArchive.gameModes.multiplayer") },
]);

// 选项数据
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

// 计算属性
const hasActiveFilters = computed(() => {
  return (
    searchQuery.value ||
    selectedArchiveDifficulty.value ||
    selectedActualDifficulty.value ||
    selectedVisibility.value
  );
});

// 过滤逻辑
const filteredArchives = computed(() => {
  if (!props.archives || props.archives.length === 0) return [];

  let filtered = props.archives;

  // 按名称搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((archive) =>
      archive.name.toLowerCase().includes(query)
    );
  }

  // 按存档难度筛选
  if (selectedArchiveDifficulty.value) {
    filtered = filtered.filter(
      (archive) => archive.archiveDifficulty === selectedArchiveDifficulty.value
    );
  }

  // 按实际难度筛选
  if (selectedActualDifficulty.value) {
    filtered = filtered.filter(
      (archive) => archive.actualDifficulty === selectedActualDifficulty.value
    );
  }

  // 按可见性筛选
  if (selectedVisibility.value) {
    const isVisible = selectedVisibility.value === "visible";
    filtered = filtered.filter((archive) => archive.isVisible === isVisible);
  }

  return filtered;
});

// 方法
const handleSearchChange = () => {
  emit("filtered", filteredArchives.value);
  emitFiltersChanged();
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

// 清除所有筛选条件
const clearAllFilters = () => {
  searchQuery.value = "";
  selectedArchiveDifficulty.value = "";
  selectedActualDifficulty.value = "";
  selectedVisibility.value = "";
  emit("filtered", filteredArchives.value);
  emitFiltersChanged();
};

const emitFiltersChanged = () => {
  emit("filters-changed", {
    searchQuery: searchQuery.value,
    selectedArchiveDifficulty: selectedArchiveDifficulty.value,
    selectedActualDifficulty: selectedActualDifficulty.value,
    selectedVisibility: selectedVisibility.value,
  });
};

// 监听数据变化 - 仅当存档数据变化时重新筛选，不重置筛选条件
watch(
  () => props.archives,
  (newArchives) => {
    // 只有在有数据且不是初始加载状态时才发出筛选事件
    if (newArchives && newArchives.length > 0) {
      emit("filtered", filteredArchives.value);
    }
  },
  { deep: true }
);

// 初始化 - 延迟执行，确保父组件数据加载完成
onMounted(() => {
  // 使用 nextTick 确保 DOM 更新完成后再初始化
  nextTick(() => {
    if (props.archives.length > 0) {
      emit("filtered", filteredArchives.value);
    }
  });
});

// 组件卸载时恢复背景滚动
onUnmounted(() => {
  // 恢复滚动位置
  const scrollY = document.body.style.top;

  // 使用全局保护工具安全修改body样式
  safeModifyBodyStyles(() => {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.height = "auto"; // 改为auto而不是空字符串
  });

  // 使用全局保护工具确保浮动按钮位置正确
  protectFloatingButtonPosition();

  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  }
});

// 动画控制方法 - 首次加载优化
const beforeEnter = (el) => {
  // 使用 will-change 提前告知浏览器优化
  el.style.willChange = "opacity, transform";
  el.style.opacity = "0";
  el.style.transform = "translateY(-15px)";
};

const enter = (el, done) => {
  // 双重 RAF 确保浏览器完全准备好
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transition =
        "opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";

      // 动画完成后清理
      setTimeout(() => {
        el.style.transition = "";
        el.style.willChange = "";
        done();
      }, 300);
    });
  });
};

const leave = (el, done) => {
  // 退场时也使用 will-change 优化
  el.style.willChange = "opacity, transform";
  el.style.transition =
    "opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)";
  el.style.opacity = "0";
  el.style.transform = "translateY(-8px)";

  // 动画完成后清理
  setTimeout(() => {
    el.style.transition = "";
    el.style.willChange = "";
    done();
  }, 250);
};
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
  flex-direction: column; /* 改为垂直布局，适应小屏幕 */
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
