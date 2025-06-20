<template>
  <div>
    <!-- 固定在右下角的搜索按钮 -->
    <div
      class="search-button"
      :class="{ 'light-mode': lightMode, active: isSearchOpen }"
      @click="toggleSearch"
      ref="searchButtonRef"
    >
      <i class="fas fa-search search-icon"></i>
      <div class="glass-edge"></div>
      <div class="glow-effect"></div>
    </div>

    <!-- 顶部搜索区域 -->
    <div
      class="search-container"
      :class="{ 'light-mode': lightMode, active: isSearchOpen }"
      ref="searchContainerRef"
    >
      <div class="search-header">
        <h2 class="search-title"><i class="fas fa-search"></i> 高级搜索</h2>
        <div
          class="close-btn"
          @click="closeSearch"
          @mouseenter="animateCloseBtnEnter"
          @mouseleave="animateCloseBtnLeave"
          ref="closeBtn"
        >
          <i class="fas fa-times"></i>
        </div>
      </div>

      <div class="search-input">
        <i class="fas fa-search search-field-icon"></i>
        <input
          type="text"
          class="search-field"
          placeholder="输入关键词搜索存档..."
          v-model="searchQuery"
          @keyup.enter="performSearch"
        />
      </div>

      <div class="filters-container">
        <div class="filter-group">
          <label class="filter-label">难度级别</label>
          <select class="filter-select" v-model="difficultyFilter">
            <option value="">全部难度</option>
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">游戏模式</label>
          <select class="filter-select" v-model="modeFilter">
            <option value="">全部模式</option>
            <option value="survival">生存模式</option>
            <option value="creative">创造模式</option>
            <option value="adventure">冒险模式</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">存档状态</label>
          <select class="filter-select" v-model="statusFilter">
            <option value="">全部状态</option>
            <option value="visible">可见</option>
            <option value="hidden">已隐藏</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">排序方式</label>
          <select class="filter-select" v-model="sortBy">
            <option value="date">创建日期</option>
            <option value="name">名称</option>
            <option value="difficulty">难度</option>
          </select>
        </div>
      </div>

      <div class="search-actions">
        <button class="action-btn reset-btn" @click="resetFilters">
          重置筛选
        </button>
        <button class="action-btn search-btn" @click="performSearch">
          搜索存档
        </button>
      </div>

      <div class="glass-edge"></div>
      <div class="glow-effect"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import gsap from "gsap"; // 确保已安装并导入 gsap

// 响应式数据
const lightMode = ref(false);
const searchQuery = ref("");
const difficultyFilter = ref("");
const modeFilter = ref("");
const statusFilter = ref("");
const sortBy = ref("date");
const isSearchOpen = ref(false);

const searchButtonRef = ref(null);
const searchContainerRef = ref(null);
const closeBtn = ref(null);

// 方法定义
const toggleSearch = () => {
  if (isSearchOpen.value) return;

  isSearchOpen.value = true;

  gsap.to(searchButtonRef.value, {
    rotate: 135,
    scale: 0.9,
    opacity: 0.8,
    duration: 0.5,
    ease: "back.out(1.7)",
  });

  gsap.to(searchButtonRef.value, {
    y: 200,
    opacity: 0,
    duration: 0.5,
    ease: "power2.in",
    delay: 0.1,
  });

  gsap.to(searchContainerRef.value, {
    top: "40px",
    opacity: 1,
    duration: 0.7,
    ease: "back.out(1.7)",
    delay: 0.2,
  });
};

const animateCloseBtnEnter = () => {
  gsap.to(closeBtn.value, {
    rotation: 90,
    scale: 0.85,
    backgroundColor: "rgba(255, 80, 100, 0.2)",
    color: "#ff5064",
    duration: 0.2,
    ease: "power2.out",
  });
};

const animateCloseBtnLeave = () => {
  gsap.to(closeBtn.value, {
    rotation: 0,
    scale: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#2d3748",
    duration: 0.2,
    ease: "power2.in",
  });
};

const closeSearch = () => {
  gsap.to(searchContainerRef.value, {
    top: "-100px",
    opacity: 0,
    duration: 0.5,
    ease: "power2.in",
  });

  gsap.to(searchButtonRef.value, {
    y: 0,
    opacity: 1,
    duration: 0.7,
    ease: "back.out(1.7)",
    delay: 0.1,
  });

  gsap.to(searchButtonRef.value, {
    rotate: 0,
    scale: 1,
    opacity: 1,
    duration: 0.6,
    ease: "elastic.out(1, 0.8)",
    delay: 0.2,
    onComplete: () => {
      isSearchOpen.value = false;
    },
  });
};

const resetFilters = () => {
  searchQuery.value = "";
  difficultyFilter.value = "";
  modeFilter.value = "";
  statusFilter.value = "";
  sortBy.value = "date";

  const filters = document.querySelectorAll(".filter-select");
  filters.forEach((filter) => {
    gsap.fromTo(
      filter,
      { backgroundColor: "rgba(255, 180, 70, 0.3)" },
      { backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.8 }
    );
  });
};

const performSearch = () => {
  gsap.fromTo(
    searchContainerRef.value,
    { boxShadow: "0 0 0 0 rgba(138, 158, 255, 0.5)" },
    {
      boxShadow: "0 0 0 10px rgba(138, 158, 255, 0)",
      duration: 0.6,
      ease: "power2.out",
    }
  );

  setTimeout(() => {
    alert(`执行搜索:
  关键词: ${searchQuery.value}
  难度: ${difficultyFilter.value || "全部"}
  模式: ${modeFilter.value || "全部"}
  状态: ${statusFilter.value || "全部"}
  排序: ${sortBy.value}`);
    closeSearch();
  }, 600);
};
</script>

<style scoped>
.light-mode {
  --Search-Search-glass-bg: rgba(255, 255, 255, 0.7);
  --Search-glass-border: rgba(0, 0, 0, 0.05);
  --Search-glow-color: #667eea;
  --Search-text-primary: #2d3748;
  --Search-text-secondary: #718096;
  --Search-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  --Search-inset-highlight: inset 0 1px 1px rgba(255, 255, 255, 0.8);
  --Search-inset-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.03);
}

/* 固定在右下角的搜索按钮 */
.search-button {
  position: fixed;
  right: 40px;
  bottom: 40px;
  width: 70px;
  height: 70px;
  background: var(--Search-Search-glass-bg);
  backdrop-filter: blur(16px);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--Search-shadow), var(--Search-inset-highlight),
    var(--Search-inset-shadow);
  border: 1px solid var(--Search-glass-border);
  cursor: pointer;
  z-index: 100;
  transition-property: background, transform, opacity;
  transition-duration: 0.25s;
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center;
}

.search-button:hover {
  transform: scale(1.1) rotate(10deg);
  background: rgba(138, 158, 255, 0.2);
}

.search-button.active {
  transform: scale(0.9) rotate(135deg);
  opacity: 0.8;
  background: rgba(255, 80, 100, 0.2);
}

.search-button.active:hover {
  transform: scale(1) rotate(135deg);
}

.search-icon {
  font-size: 28px;
  color: var(--Search-glow-color);
  transition: transform 0.4s ease;
}

/* 顶部搜索区域 */
.search-container {
  position: fixed;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 800px;
  background: var(--Search-Search-glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 25px;
  box-shadow: var(--Search-shadow), var(--Search-inset-highlight),
    var(--Search-inset-shadow);
  border: 1px solid var(--Search-glass-border);
  z-index: -99;
  display: flex;
  flex-direction: column;
  gap: 20px;
  opacity: 0;
}

.search-container.active {
  box-shadow: 0 0 30px rgba(138, 158, 255, 0.3);
  z-index: 99;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--Search-glass-border);
}

.search-title {
  font-size: 1.5rem;
  color: var(--Search-text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid var(--Search-glass-border);
  color: var(--Search-text-primary);
  cursor: pointer;
  transition: background-color 0.4s ease, transform 0.4s ease, color 0.4s ease;
}

/* 搜索输入框 */
.search-input {
  position: relative;
}

.search-field {
  width: 90%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 18px 20px 18px 60px;
  border: 1px solid var(--Search-glass-border);
  color: var(--Search-text-primary);
  font-size: 1.1rem;
  transition: var(--Search-transition);
}

.search-field:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--Search-glow-color);
}

.search-field-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  color: var(--Search-glow-color);
}

/* 筛选下拉框 */
.filters-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 0.9rem;
  color: var(--Search-text-secondary);
  margin-bottom: 8px;
  margin-left: 10px;
}

.filter-select {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 15px 20px;
  border: 1px solid var(--Search-glass-border);
  color: var(--Search-text-primary);
  font-size: 1rem;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a9eff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 20px center;
  background-size: 16px;
  transition: var(--Search-transition);
}

.filter-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--Search-glow-color);
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--Search-glass-border);
}

.action-btn {
  padding: 12px 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid var(--Search-glass-border);
  color: var(--Search-text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: var(--Search-transition);
}

.reset-btn:hover {
  background: rgba(255, 180, 70, 0.2);
  color: #ffb446;
}

.search-btn {
  background: rgba(70, 130, 255, 0.2);
  color: var(--Search-glow-color);
}

.search-btn:hover {
  background: rgba(70, 130, 255, 0.3);
}

/* 玻璃效果层 */
.glass-edge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  pointer-events: none;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
  z-index: -1;
}

.glow-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at center,
    rgba(138, 158, 255, 0.3) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: var(--Search-transition);
  pointer-events: none;
  z-index: -2;
}

.search-button:hover .glow-effect,
.search-container .glow-effect {
  opacity: 0.15;
}

.light-mode .glow-effect {
  background: radial-gradient(
    circle at center,
    rgba(102, 126, 234, 0.2) 0%,
    transparent 60%
  );
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-button {
    right: 20px;
    bottom: 20px;
    width: 60px;
    height: 60px;
  }

  .search-container {
    width: 95%;
    padding: 20px;
  }

  .filters-container {
    grid-template-columns: 1fr;
  }
}

/* 新增：背景装饰元素 */
.background-element {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  z-index: -1;
}

.bg-element-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #8a9eff, #c6a8ff);
  top: 10%;
  left: 10%;
  opacity: 0.15;
}

.bg-element-2 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #ff7eb3, #ff758c);
  bottom: 10%;
  right: 10%;
  opacity: 0.1;
}

.bg-element-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #6a9eff, #89f7fe);
  top: 50%;
  right: 20%;
  opacity: 0.1;
}
</style>
