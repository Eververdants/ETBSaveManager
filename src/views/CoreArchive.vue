<template>
  <div class="core-archive-container">
    <!-- 主要内容区域 -->
    <div class="content-area">
      <!-- 存档可视性管理 -->
      <div class="feature-section">
        <div class="section-header-row" @click="isVisibilityExpanded = !isVisibilityExpanded">
          <div class="section-header">
            <font-awesome-icon 
              :icon="['fas', isVisibilityExpanded ? 'chevron-down' : 'chevron-right']" 
              class="collapse-icon"
            />
            存档可视性管理
          </div>
          <button 
            v-if="isVisibilityExpanded"
            class="view-toggle-btn" 
            @click.stop="toggleViewMode" 
            :title="viewMode === 'dual' ? '切换到列表视图' : '切换到双栏视图'"
          >
            <font-awesome-icon :icon="viewMode === 'dual' ? 'fa-solid fa-list' : 'fa-solid fa-columns'" />
          </button>
        </div>

        <!-- 可折叠内容 -->
        <transition name="expand">
          <div v-show="isVisibilityExpanded" class="visibility-content">
            <!-- 统计卡片 -->
            <div class="stats-cards">
              <div class="stat-card">
                <div class="stat-icon">
                  <font-awesome-icon :icon="['fas', 'folder']" />
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ archiveStats.total }}</div>
                  <div class="stat-label">总存档</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon visible">
                  <font-awesome-icon :icon="['fas', 'eye']" />
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ archiveStats.visible }}</div>
                  <div class="stat-label">可见</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon hidden">
                  <font-awesome-icon :icon="['fas', 'eye-slash']" />
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ archiveStats.hidden }}</div>
                  <div class="stat-label">隐藏</div>
                </div>
              </div>
            </div>

            <!-- 操作按钮组 -->
            <div class="action-bar">
              <div class="action-buttons">
                <button class="action-btn primary" @click="showAllArchives">
                  <font-awesome-icon :icon="['fas', 'eye']" />
                  全部显示
                </button>
                <button class="action-btn secondary" @click="hideAllArchives">
                  <font-awesome-icon :icon="['fas', 'eye-slash']" />
                  全部隐藏
                </button>
                <button class="action-btn tertiary" @click="invertVisibility">
                  <font-awesome-icon :icon="['fas', 'exchange-alt']" />
                  反转可视性
                </button>
              </div>
              <div class="search-box">
                <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="搜索存档..."
                  class="search-input"
                />
              </div>
            </div>

            <!-- 存档列表 - 双栏视图 -->
            <div v-if="viewMode === 'dual'" class="dual-pane-view">
              <div class="pane visible-pane">
                <div class="pane-header">
                  <font-awesome-icon :icon="['fas', 'eye']" />
                  可见存档 ({{ visibleArchives.length }})
                </div>
                <div class="archive-list">
                  <div 
                    v-for="archive in visibleArchives" 
                    :key="archive.id"
                    :data-archive-id="archive.id"
                    class="archive-item"
                    @click="toggleArchiveVisibility(archive)"
                  >
                    <div class="archive-icon">
                      <font-awesome-icon :icon="['fas', 'folder']" />
                    </div>
                    <div class="archive-details">
                      <div class="archive-name">{{ archive.name }}</div>
                      <div class="archive-meta">
                        <span class="level-tag">{{ getLevelName(archive.currentLevel) }}</span>
                        <span class="difficulty-tag" :class="`difficulty-${archive.archiveDifficulty}`">
                          {{ getDifficultyText(archive.archiveDifficulty) }}
                        </span>
                      </div>
                    </div>
                    <div class="archive-action">
                      <font-awesome-icon :icon="['fas', 'arrow-right']" />
                    </div>
                  </div>
                  <div v-if="visibleArchives.length === 0" class="empty-message">
                    暂无可见存档
                  </div>
                </div>
              </div>

              <div class="pane hidden-pane">
                <div class="pane-header">
                  <font-awesome-icon :icon="['fas', 'eye-slash']" />
                  隐藏存档 ({{ hiddenArchives.length }})
                </div>
                <div class="archive-list">
                  <div 
                    v-for="archive in hiddenArchives" 
                    :key="archive.id"
                    :data-archive-id="archive.id"
                    class="archive-item"
                    @click="toggleArchiveVisibility(archive)"
                  >
                    <div class="archive-action">
                      <font-awesome-icon :icon="['fas', 'arrow-left']" />
                    </div>
                    <div class="archive-details">
                      <div class="archive-name">{{ archive.name }}</div>
                      <div class="archive-meta">
                        <span class="level-tag">{{ getLevelName(archive.currentLevel) }}</span>
                        <span class="difficulty-tag" :class="`difficulty-${archive.archiveDifficulty}`">
                          {{ getDifficultyText(archive.archiveDifficulty) }}
                        </span>
                      </div>
                    </div>
                    <div class="archive-icon">
                      <font-awesome-icon :icon="['fas', 'folder']" />
                    </div>
                  </div>
                  <div v-if="hiddenArchives.length === 0" class="empty-message">
                    暂无隐藏存档
                  </div>
                </div>
              </div>
            </div>

            <!-- 存档列表 - 单列视图 -->
            <div v-else class="list-view">
              <div class="archive-list-single">
                <div 
                  v-for="archive in filteredArchives" 
                  :key="archive.id"
                  :data-archive-id="archive.id"
                  class="archive-item-single"
                >
                  <div class="archive-icon">
                    <font-awesome-icon :icon="['fas', 'folder']" />
                  </div>
                  <div class="archive-details">
                    <div class="archive-name">{{ archive.name }}</div>
                    <div class="archive-meta">
                      <span class="level-tag">{{ getLevelName(archive.currentLevel) }}</span>
                      <span class="difficulty-tag" :class="`difficulty-${archive.archiveDifficulty}`">
                        {{ getDifficultyText(archive.archiveDifficulty) }}
                      </span>
                    </div>
                  </div>
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      :checked="archive.isVisible"
                      @change="toggleArchiveVisibility(archive)"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div v-if="filteredArchives.length === 0" class="empty-message">
                  {{ searchQuery ? '未找到匹配的存档' : '暂无存档' }}
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 功能区域 -->
      <div class="feature-section">
        <div class="section-header">{{ $t("sidebar.featureOptions") }}</div>
        
        <!-- 经验值调整 -->
        <div class="experience-control">
          <div class="control-header">
            <div class="control-icon">
              <font-awesome-icon :icon="['fas', 'star']" />
            </div>
            <div class="control-info">
              <h3>经验值调整</h3>
              <p>调整玩家经验值（0 - 1,000,000,000）</p>
            </div>
          </div>
          
          <div class="control-body">
            <!-- 数值输入框 -->
            <div class="input-group">
              <label>当前经验值</label>
              <input 
                type="number" 
                v-model.number="experience" 
                @input="handleExperienceInput"
                min="0" 
                max="1000000000"
                class="experience-input"
                placeholder="输入经验值"
              />
            </div>
            
            <!-- 滑条 -->
            <div class="slider-group">
              <input 
                type="range" 
                v-model.number="experience" 
                @input="handleExperienceSlider"
                min="0" 
                max="1000000000"
                step="1000"
                class="experience-slider"
              />
              <div class="slider-labels">
                <span>0</span>
                <span>{{ formatNumber(experience) }}</span>
                <span>1,000,000,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import storage from "../services/storageService";
import { useArchiveData } from "../composables/useArchiveData";
import { useToast } from "../composables/useToast";

export default {
  name: "CoreArchive",
  setup() {
    const { t, te } = useI18n({ useScope: "global" });
    const toast = useToast();
    const archiveData = useArchiveData();
    const { archives, initializeArchives, updateArchiveVisibility } = archiveData;

    // 数据状态
    const experience = ref(0);
    const searchQuery = ref("");
    const viewMode = ref("auto"); // 'auto', 'list', 'dual'
    const containerWidth = ref(0);
    const isVisibilityExpanded = ref(false); // 可视性管理展开状态

    // 计算属性
    const archiveStats = computed(() => ({
      total: archives.value.length,
      visible: archives.value.filter((a) => a.isVisible).length,
      hidden: archives.value.filter((a) => !a.isVisible).length,
    }));

    const filteredArchives = computed(() => {
      if (!searchQuery.value) return archives.value;
      const query = searchQuery.value.toLowerCase();
      return archives.value.filter(
        (archive) =>
          archive.name.toLowerCase().includes(query) ||
          getLevelName(archive.currentLevel).toLowerCase().includes(query)
      );
    });

    const visibleArchives = computed(() => {
      return filteredArchives.value.filter((a) => a.isVisible);
    });

    const hiddenArchives = computed(() => {
      return filteredArchives.value.filter((a) => !a.isVisible);
    });

    // 响应式视图模式
    const actualViewMode = computed(() => {
      if (viewMode.value === "list") return "list";
      if (viewMode.value === "dual") return "dual";
      // auto 模式：宽度 >= 900px 使用双栏，否则使用列表
      return containerWidth.value >= 900 ? "dual" : "list";
    });

    // 方法
    const getLevelName = (levelKey) => {
      const translationKey = `LevelName_Display.${levelKey}`;
      return te(translationKey) ? t(translationKey) : levelKey;
    };

    const getDifficultyText = (difficultyKey) => {
      const translationKey = `createArchive.difficultyLevels.${difficultyKey}`;
      return te(translationKey) ? t(translationKey) : difficultyKey;
    };

    const toggleViewMode = () => {
      if (viewMode.value === "auto") {
        viewMode.value = actualViewMode.value === "dual" ? "list" : "dual";
      } else if (viewMode.value === "list") {
        viewMode.value = "dual";
      } else {
        viewMode.value = "list";
      }
      storage.setItem("coreArchiveViewMode", viewMode.value);
    };

    const toggleArchiveVisibility = async (archive) => {
      const originalVisibility = archive.isVisible;
      
      // 添加动画类
      const archiveElement = document.querySelector(`[data-archive-id="${archive.id}"]`);
      if (archiveElement) {
        archiveElement.classList.add('visibility-transitioning');
      }
      
      // 乐观更新UI
      updateArchiveVisibility(archive.id, !originalVisibility);

      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("handle_file", {
          filePath: archive.path,
          action: "toggle_visibility",
          archiveName: archive.name,
        });
        
        // 动画完成后移除类
        setTimeout(() => {
          if (archiveElement) {
            archiveElement.classList.remove('visibility-transitioning');
          }
        }, 300);
        
        toast.showSuccess(
          !originalVisibility ? `已显示存档：${archive.name}` : `已隐藏存档：${archive.name}`
        );
      } catch (error) {
        console.error("切换可视性失败:", error);
        // 回滚UI更新
        updateArchiveVisibility(archive.id, originalVisibility);
        if (archiveElement) {
          archiveElement.classList.remove('visibility-transitioning');
        }
        toast.showError("操作失败，请重试");
      }
    };

    const showAllArchives = async () => {
      const hiddenCount = archiveStats.value.hidden;
      if (hiddenCount === 0) {
        toast.showInfo("所有存档已经是可见状态");
        return;
      }

      try {
        const { invoke } = await import("@tauri-apps/api/core");
        
        // 只对隐藏的存档调用 toggle
        const hiddenArchivesList = archives.value.filter(a => !a.isVisible);
        
        // 添加动画类
        hiddenArchivesList.forEach(archive => {
          const element = document.querySelector(`[data-archive-id="${archive.id}"]`);
          if (element) {
            element.classList.add('visibility-transitioning');
          }
        });
        
        for (const archive of hiddenArchivesList) {
          await invoke("handle_file", {
            filePath: archive.path,
            action: "toggle_visibility",
            archiveName: archive.name,
          });
        }
        
        // 等待动画完成后重新加载
        setTimeout(async () => {
          await initializeArchives();
          toast.showSuccess(`已显示 ${hiddenCount} 个存档`);
        }, 300);
      } catch (error) {
        console.error("批量显示失败:", error);
        await initializeArchives();
        toast.showError("操作失败，请重试");
      }
    };

    const hideAllArchives = async () => {
      const visibleCount = archiveStats.value.visible;
      if (visibleCount === 0) {
        toast.showInfo("所有存档已经是隐藏状态");
        return;
      }

      try {
        const { invoke } = await import("@tauri-apps/api/core");
        
        // 只对可见的存档调用 toggle
        const visibleArchivesList = archives.value.filter(a => a.isVisible);
        
        // 添加动画类
        visibleArchivesList.forEach(archive => {
          const element = document.querySelector(`[data-archive-id="${archive.id}"]`);
          if (element) {
            element.classList.add('visibility-transitioning');
          }
        });
        
        for (const archive of visibleArchivesList) {
          await invoke("handle_file", {
            filePath: archive.path,
            action: "toggle_visibility",
            archiveName: archive.name,
          });
        }
        
        // 等待动画完成后重新加载
        setTimeout(async () => {
          await initializeArchives();
          toast.showSuccess(`已隐藏 ${visibleCount} 个存档`);
        }, 300);
      } catch (error) {
        console.error("批量隐藏失败:", error);
        await initializeArchives();
        toast.showError("操作失败，请重试");
      }
    };

    const invertVisibility = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        
        // 添加动画类到所有存档
        archives.value.forEach(archive => {
          const element = document.querySelector(`[data-archive-id="${archive.id}"]`);
          if (element) {
            element.classList.add('visibility-transitioning');
          }
        });
        
        // 对所有存档调用 toggle，后端会自动根据 MAINSAVE.sav 的状态切换
        for (const archive of archives.value) {
          await invoke("handle_file", {
            filePath: archive.path,
            action: "toggle_visibility",
            archiveName: archive.name,
          });
        }
        
        // 等待动画完成后重新加载
        setTimeout(async () => {
          await initializeArchives();
          toast.showSuccess("已反转所有存档的可视性");
        }, 300);
      } catch (error) {
        console.error("反转可视性失败:", error);
        await initializeArchives();
        toast.showError("操作失败，请重试");
      }
    };

    const handleExperienceInput = (event) => {
      let value = parseInt(event.target.value) || 0;
      if (value < 0) value = 0;
      if (value > 1000000000) value = 1000000000;
      experience.value = value;
    };

    const handleExperienceSlider = (event) => {
      experience.value = parseInt(event.target.value) || 0;
    };

    const formatNumber = (num) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const updateContainerWidth = () => {
      const container = document.querySelector(".core-archive-container");
      if (container) {
        containerWidth.value = container.clientWidth;
      }
    };

    // 生命周期
    onMounted(async () => {
      // 初始化存档数据
      await initializeArchives();

      // 恢复经验值
      const savedExperience = storage.getItem("coreArchiveExperience");
      if (savedExperience !== null) {
        experience.value = parseInt(savedExperience) || 0;
      }

      // 恢复视图模式
      const savedViewMode = storage.getItem("coreArchiveViewMode");
      if (savedViewMode) {
        viewMode.value = savedViewMode;
      }

      // 恢复展开状态
      const savedExpanded = storage.getItem("coreArchiveVisibilityExpanded");
      if (savedExpanded !== null) {
        isVisibilityExpanded.value = savedExpanded;
      }

      // 监听窗口大小变化
      updateContainerWidth();
      window.addEventListener("resize", updateContainerWidth);
    });

    // 监听经验值变化
    watch(experience, (newValue) => {
      storage.setItem("coreArchiveExperience", newValue);
    });

    // 监听展开状态变化
    watch(isVisibilityExpanded, (newValue) => {
      storage.setItem("coreArchiveVisibilityExpanded", newValue);
    });

    return {
      experience,
      searchQuery,
      viewMode: actualViewMode,
      archives,
      archiveStats,
      filteredArchives,
      visibleArchives,
      hiddenArchives,
      isVisibilityExpanded,
      getLevelName,
      getDifficultyText,
      toggleViewMode,
      toggleArchiveVisibility,
      showAllArchives,
      hideAllArchives,
      invertVisibility,
      handleExperienceInput,
      handleExperienceSlider,
      formatNumber,
    };
  },
};
</script>

<style scoped>
.core-archive-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 内容区域 */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 分区标题行 */
.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.section-header-row:hover {
  opacity: 0.8;
}

/* 分区标题 */
.section-header {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  padding-bottom: 6px;
  border-bottom: 2px solid var(--accent-color, #007aff);
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

/* 可折叠内容 */
.visibility-content {
  overflow: hidden;
}

/* 展开/收起动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 2000px;
  opacity: 1;
  margin-top: 0;
}

/* 视图切换按钮 */
.view-toggle-btn {
  padding: 8px 12px;
  background: var(--bg-secondary, #f8f9fa);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: var(--radius-md, 12px);
  color: var(--text-secondary, #3a3a3c);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.view-toggle-btn:hover {
  background: var(--accent-color, #007aff);
  color: white;
  border-color: var(--accent-color, #007aff);
}

/* 功能区域样式 */
.feature-section {
  background: var(--card-bg, #ffffff);
  border-radius: var(--radius-lg, 16px);
  padding: 24px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  margin-top: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-color, #007aff);
  color: white;
  border-radius: var(--radius-md, 12px);
  font-size: 18px;
}

.stat-icon.visible {
  background: #34c759;
}

.stat-icon.hidden {
  background: #8e8e93;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #1c1c1e);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary, #3a3a3c);
}

/* 操作栏 */
.action-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: var(--radius-md, 12px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn.primary {
  background: #34c759;
  color: white;
  border-color: #34c759;
}

.action-btn.primary:hover {
  background: #2fb350;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

.action-btn.secondary {
  background: #8e8e93;
  color: white;
  border-color: #8e8e93;
}

.action-btn.secondary:hover {
  background: #7c7c81;
  box-shadow: 0 4px 12px rgba(142, 142, 147, 0.3);
}

.action-btn.tertiary {
  background: var(--accent-color, #007aff);
  color: white;
  border-color: var(--accent-color, #007aff);
}

.action-btn.tertiary:hover {
  background: #0051d5;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

/* 搜索框 */
.search-box {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary, #8e8e93);
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: var(--radius-md, 12px);
  background: var(--bg-secondary, #f8f9fa);
  color: var(--text-primary, #1c1c1e);
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color, #007aff);
  background: var(--card-bg, #ffffff);
}

/* 双栏视图 */
.dual-pane-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: 400px;
}

.pane {
  background: var(--bg-secondary, #f8f9fa);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pane-header {
  padding: 12px 16px;
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.visible-pane .pane-header {
  color: #34c759;
}

.hidden-pane .pane-header {
  color: #8e8e93;
}

.archive-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* 存档项移动动画 */
.archive-item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 双栏视图中的箭头动画 */
.archive-action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #8e8e93);
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.archive-item:hover .archive-action {
  color: var(--accent-color, #007aff);
  transform: scale(1.2);
}

.visible-pane .archive-item:hover .archive-action {
  animation: arrowBounceRight 0.6s ease-in-out infinite;
}

.hidden-pane .archive-item:hover .archive-action {
  animation: arrowBounceLeft 0.6s ease-in-out infinite;
}

@keyframes arrowBounceRight {
  0%, 100% {
    transform: translateX(0) scale(1.2);
  }
  50% {
    transform: translateX(4px) scale(1.2);
  }
}

@keyframes arrowBounceLeft {
  0%, 100% {
    transform: translateX(0) scale(1.2);
  }
  50% {
    transform: translateX(-4px) scale(1.2);
  }
}

.archive-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--card-bg, #ffffff);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.archive-item:hover {
  background: var(--bg-secondary, #f8f9fa);
  border-color: var(--accent-color, #007aff);
  transform: translateX(4px);
}

.hidden-pane .archive-item:hover {
  transform: translateX(-4px);
}

/* 可视性切换动画 */
.archive-item.visibility-transitioning,
.archive-item-single.visibility-transitioning {
  animation: visibilityPulse 0.3s ease-in-out;
}

@keyframes visibilityPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.98);
    opacity: 0.7;
    background: var(--accent-color, #007aff);
    border-color: var(--accent-color, #007aff);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.archive-item.visibility-transitioning .archive-name,
.archive-item-single.visibility-transitioning .archive-name {
  animation: textFade 0.3s ease-in-out;
}

@keyframes textFade {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
    color: white;
  }
  100% {
    opacity: 1;
  }
}

.archive-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-color, #007aff);
  color: white;
  border-radius: var(--radius-sm, 8px);
  font-size: 16px;
  flex-shrink: 0;
}

.archive-details {
  flex: 1;
  min-width: 0;
}

.archive-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.archive-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.level-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-tertiary, #e5e5ea);
  color: var(--text-secondary, #3a3a3c);
  border-radius: 4px;
}

.difficulty-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.difficulty-easy {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.difficulty-normal {
  background: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}

.difficulty-hard {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.difficulty-nightmare {
  background: rgba(175, 82, 222, 0.15);
  color: #af52de;
}

.archive-action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #8e8e93);
  font-size: 14px;
  flex-shrink: 0;
}

/* 单列视图 */
.list-view {
  min-height: 400px;
}

.archive-list-single {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.archive-item-single {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  transition: all 0.2s ease;
}

.archive-item-single:hover {
  background: var(--card-bg, #ffffff);
  border-color: var(--accent-color, #007aff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Toggle Switch 动画增强 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #8e8e93;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-slider::before {
  content: "";
  position: absolute;
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background: #34c759;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-switch:hover .toggle-slider {
  box-shadow: 0 0 0 4px rgba(52, 199, 89, 0.1);
}

/* 切换时的脉冲效果 */
.toggle-switch input:checked + .toggle-slider::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: #34c759;
  animation: togglePulse 0.3s ease-out;
  pointer-events: none;
}

@keyframes togglePulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* 空消息 */
.empty-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-tertiary, #8e8e93);
  font-size: 14px;
}

/* 经验值控制样式 */
.experience-control {
  background: var(--surface-color, #ffffff);
  border-radius: var(--radius-md, 12px);
  padding: 20px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  margin-top: 12px;
}

.control-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.control-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-color, #007aff);
  color: white;
  border-radius: var(--radius-md, 12px);
  font-size: 20px;
}

.control-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0 0 4px 0;
}

.control-info p {
  font-size: 14px;
  color: var(--text-secondary, #3a3a3c);
  margin: 0;
}

.control-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 输入框组 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #1c1c1e);
}

.experience-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: var(--radius-md, 12px);
  background: var(--bg-secondary, #f8f9fa);
  color: var(--text-primary, #1c1c1e);
  transition: all 0.2s ease;
}

.experience-input::-webkit-outer-spin-button,
.experience-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.experience-input[type=number] {
  -moz-appearance: textfield;
}

.experience-input:focus {
  outline: none;
  border-color: var(--accent-color, #007aff);
  background: var(--card-bg, #ffffff);
}

/* 滑条组 */
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.experience-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-tertiary, #e5e5ea);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.experience-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color, #007aff);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease;
}

.experience-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.5);
}

.experience-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color, #007aff);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease;
}

.experience-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.5);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary, #3a3a3c);
  padding: 0 4px;
}

.slider-labels span:nth-child(2) {
  font-weight: 600;
  color: var(--accent-color, #007aff);
  font-size: 14px;
}

/* 暗色主题适配 */
[data-theme="dark"] .feature-section {
  background: var(--card-bg, #2c2c2e);
}

[data-theme="dark"] .experience-control {
  background: var(--surface-color, #2c2c2e);
}

[data-theme="dark"] .experience-input {
  background: var(--bg-tertiary, #3a3a3c);
  border-color: var(--border-color, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #ffffff);
}

[data-theme="dark"] .experience-input:focus {
  background: var(--card-bg, #2c2c2e);
}

/* 响应式 */
@media (max-width: 900px) {
  .dual-pane-view {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .core-archive-container {
    padding: 16px;
  }

  .feature-section {
    padding: 16px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    width: 100%;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .section-header {
    font-size: 16px;
  }

  .stat-value {
    font-size: 20px;
  }

  .archive-item,
  .archive-item-single {
    padding: 10px;
  }

  .archive-name {
    font-size: 13px;
  }
}
</style>
