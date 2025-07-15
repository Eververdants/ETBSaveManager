<template>
  <div>
    <!-- Material Design FAB -->
    <div
      class="search-fab"
      @click="openSearch"
      ref="searchFabRef"
      v-show="!isSearchOpen"
    >
      <i class="fas fa-search"></i>
    </div>

    <!-- Fullscreen Search Modal -->
    <div class="search-modal" ref="searchModalRef">
      <div class="search-container" ref="searchContainerRef">
        <div class="search-header">
          <h2 class="search-title">搜索与筛选</h2>
          <button class="close-btn" @click="closeSearch" ref="closeBtnRef">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="search-content">
          <div class="input-group">
            <i class="fas fa-search input-icon"></i>
            <input
              type="text"
              class="search-field"
              placeholder="输入存档名称..."
              v-model="searchQuery"
              @keyup.enter="performSearch"
            />
          </div>

          <div class="filters-grid">
            <MD_Dropdown
              v-model="difficultyFilter"
              :options="difficultyOptions"
              defaultText="全部难度"
              label="难度"
            />
            <MD_Dropdown
              v-model="modeFilter"
              :options="modeOptions"
              defaultText="全部模式"
              label="模式"
            />
            <MD_Dropdown
              v-model="statusFilter"
              :options="statusOptions"
              defaultText="全部状态"
              label="状态"
            />
            <MD_Dropdown
              v-model="sortBy"
              :options="sortOptions"
              defaultText="默认排序"
              label="排序"
            />
          </div>
        </div>

        <div class="search-actions">
          <button class="action-btn reset-btn" @click="resetFilters">
            重置
          </button>
          <button class="action-btn search-btn" @click="performSearch">
            应用筛选
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import gsap from "gsap";
import MD_Dropdown from "./MD_Dropdown.vue";

const searchQuery = ref("");
const difficultyFilter = ref("");
const modeFilter = ref("");
const statusFilter = ref("");
const sortBy = ref("default");
const isSearchOpen = ref(false);
const emit = defineEmits(["search"]);

const difficultyOptions = ref([
  { label: "全部难度", value: "" },
  { label: "简单难度", value: "Easy" },
  { label: "普通难度", value: "Normal" },
  { label: "困难难度", value: "Hard" },
  { label: "噩梦难度", value: "Nightmare" },
]);

const modeOptions = ref([
  { label: "全部模式", value: "" },
  { label: "单人模式", value: "Singleplayer" },
  { label: "多人模式", value: "Multiplayer" },
]);

const statusOptions = ref([
  { label: "全部状态", value: "" },
  { label: "可见状态", value: "visible" },
  { label: "隐藏状态", value: "hidden" },
]);

const sortOptions = ref([
  { label: "默认排序", value: "default" },
  { label: "创建日期", value: "date" },
  { label: "名称排序", value: "name" },
  { label: "难度排序", value: "difficulty" },
]);

const searchFabRef = ref(null);
const searchModalRef = ref(null);
const searchContainerRef = ref(null);
const closeBtnRef = ref(null);
let openTimeline = null;
let closeTimeline = null;

onMounted(() => {
  gsap.set(searchModalRef.value, { display: "none" });
});

const openSearch = () => {
  if (isSearchOpen.value) return;
  isSearchOpen.value = true;

  if (closeTimeline) closeTimeline.kill();

  // 强制重置动画元素的状态，防止二次进入时元素消失
  const animatedChildren = searchContainerRef.value.querySelectorAll(
    ".search-content > *, .filters-grid > *"
  );
  gsap.set(animatedChildren, { clearProps: "all" });


  openTimeline = gsap.timeline({
    onComplete: () => {
      openTimeline = null;
    },
  });

  const fabRect = searchFabRef.value.getBoundingClientRect();
  const originX = fabRect.left + fabRect.width / 2;
  const originY = fabRect.top + fabRect.height / 2;

  openTimeline
    .set(searchModalRef.value, { display: "flex" })
    .to(searchFabRef.value, {
      scale: 0,
      duration: 0.3,
      ease: "power2.inOut",
    })
    .fromTo(
      searchModalRef.value,
      {
        clipPath: `circle(0% at ${originX}px ${originY}px)`,
      },
      {
        clipPath: "circle(100% at center center)",
        duration: 0.6,
        ease: "power2.inOut",
      },
      "-=0.2"
    )
    .from(
      ".search-content > *, .filters-grid > *",
      {
        y: 20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.05,
      },
      "-=0.3"
    );
};

const closeSearch = () => {
  if (!isSearchOpen.value) return;

  if (openTimeline) openTimeline.kill();

  closeTimeline = gsap.timeline({
    onComplete: () => {
      isSearchOpen.value = false;
      gsap.set(searchModalRef.value, { display: "none" });
      closeTimeline = null;
    },
  });

  const fabRect = searchFabRef.value.getBoundingClientRect();
  const originX = fabRect.left + fabRect.width / 2;
  const originY = fabRect.top + fabRect.height / 2;

  closeTimeline
    .to(".search-content > *, .filters-grid > *", {
      y: 20,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      stagger: 0.05,
    })
    .to(
      searchModalRef.value,
      {
        clipPath: `circle(0% at ${originX}px ${originY}px)`,
        duration: 0.6,
        ease: "power2.inOut",
      },
      "-=0.1"
    )
    .to(
      searchFabRef.value,
      {
        scale: 1,
        duration: 0.3,
        ease: "power2.inOut",
      },
      "-=0.4"
    );
};

const resetFilters = () => {
  searchQuery.value = "";
  difficultyFilter.value = "";
  modeFilter.value = "";
  statusFilter.value = "";
  sortBy.value = "default";
  performSearch();
};

const performSearch = () => {
  emit("search", {
    query: searchQuery.value,
    difficulty: difficultyFilter.value,
    mode: modeFilter.value,
    status: statusFilter.value,
    sortBy: sortBy.value,
  });
  closeSearch();
};
</script>

<style scoped>
/* Floating Action Button (FAB) */
.search-fab {
  position: fixed;
  right: 40px;
  bottom: 40px;
  width: 64px;
  height: 64px;
  background-color: var(--search-fab-bg);
  color: var(--search-fab-icon);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--search-fab-shadow);
  cursor: pointer;
  z-index: 1000;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out,
    background-color 0.2s ease;
}

.search-fab:hover {
  transform: translateY(-4px);
  box-shadow: var(--search-fab-shadow-hover);
}

.search-fab i {
  font-size: 24px;
}

/* Fullscreen Search Modal */
.search-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--search-surface);
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: center;
  clip-path: circle(0% at right bottom);
}

.search-container {
  width: 100%;
  max-width: 700px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--search-text-primary);
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: var(--search-close-icon);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background-color: var(--search-close-icon-hover-bg);
}

.close-btn i {
  font-size: 20px;
}

/* Search Content */
.search-content {
  margin-bottom: 24px;
}

.input-group {
  position: relative;
  margin-bottom: 24px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--search-text-secondary);
  font-size: 18px;
}

.search-field {
  width: 100%;
  padding: 16px 16px 16px 48px;
  font-size: 1.1rem;
  background-color: var(--search-input-bg);
  color: var(--search-text-primary);
  border: 1px solid var(--search-input-border);
  border-radius: 8px;
  transition: border-color 0.2s ease;
}

.search-field:focus {
  outline: none;
  border-color: var(--search-input-border-focus);
}

/* Filters */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* Actions */
.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: none;
}

.reset-btn {
  background-color: transparent;
  color: var(--search-button-secondary-text);
}

.reset-btn:hover {
  background-color: var(--search-close-icon-hover-bg);
}

.search-btn {
  background-color: var(--search-button-primary-bg);
  color: var(--search-button-primary-text);
}

.search-btn:hover {
  opacity: 0.9;
}
</style>
