<template>
  <div class="steam-cache-container">
    <div class="cache-content">
      <div class="cache-actions">
        <div class="cache-actions-left">
          <button class="back-btn" @click="goBack" :title="t('common.back')">
            <font-awesome-icon :icon="['fas', 'arrow-left']" />
          </button>

          <button
            class="cleanup-expired-btn"
            @click="cleanupExpiredCache"
            :disabled="isCleaning"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
            {{ t("settings.steamApi.cleanupExpired") }}
          </button>

          <!-- SteamID显示切换按钮 -->
          <button class="toggle-steamid-btn" @click="toggleSteamIdDisplay">
            <font-awesome-icon
              :icon="showRawSteamId ? ['fas', 'eye-slash'] : ['fas', 'eye']"
            />
            {{
              showRawSteamId
                ? t("settings.steamApi.hideRawSteamId")
                : t("settings.steamApi.showRawSteamId")
            }}
          </button>
        </div>

        <div class="cache-actions-right">
          <div class="cache-count-info">
            {{ t("settings.steamApi.cacheCount", { count: cacheCount }) }}
          </div>
        </div>
      </div>

      <!-- 搜索和过滤区域 -->
      <div class="search-filter-section">
        <div class="form-group">
          <label class="form-label">
            <font-awesome-icon :icon="['fas', 'search']" class="label-icon" />
            {{ t("settings.steamApi.search") }}
          </label>
          <div class="search-input-group">
            <input
              v-model="searchQuery"
              :placeholder="t('settings.steamApi.searchPlaceholder')"
              class="search-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <font-awesome-icon :icon="['fas', 'sort']" class="label-icon" />
            {{ t("settings.steamApi.sortByLabel") }}
          </label>
          <CustomDropdown
            v-model="sortBy"
            :options="[
              {
                value: 'lastUpdated',
                label: t('settings.steamApi.sortBy.lastUpdated'),
              },
              {
                value: 'username',
                label: t('settings.steamApi.sortBy.username'),
              },
              {
                value: 'callCount',
                label: t('settings.steamApi.sortBy.callCount'),
              },
              {
                value: 'steamId',
                label: t('settings.steamApi.sortBy.steamId'),
              },
            ]"
            :placeholder="t('settings.steamApi.sortBy.lastUpdated')"
            class="dropdown-control"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            <font-awesome-icon
              :icon="['fas', 'arrows-up-down']"
              class="label-icon"
            />
            {{ t("settings.steamApi.sortOrderLabel") }}
          </label>
          <CustomDropdown
            v-model="sortOrder"
            :options="[
              { value: 'desc', label: t('settings.steamApi.sortOrder.desc') },
              { value: 'asc', label: t('settings.steamApi.sortOrder.asc') },
            ]"
            :placeholder="t('settings.steamApi.sortOrder.desc')"
            class="dropdown-control"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            <font-awesome-icon :icon="['fas', 'hashtag']" class="label-icon" />
            {{ t("settings.steamApi.minCallCount") }}
          </label>
          <div class="number-input-wrapper">
            <input
              v-model.number="minCallCount"
              type="number"
              :placeholder="t('settings.steamApi.minCallCount')"
              class="filter-input"
              min="0"
            />
            <div class="number-spinner">
              <button
                type="button"
                class="spinner-btn spinner-up"
                @click="minCallCount = Math.max(0, (minCallCount || 0) + 1)"
                tabindex="-1"
              >
                <font-awesome-icon :icon="['fas', 'chevron-up']" />
              </button>
              <button
                type="button"
                class="spinner-btn spinner-down"
                @click="minCallCount = Math.max(0, (minCallCount || 0) - 1)"
                tabindex="-1"
              >
                <font-awesome-icon :icon="['fas', 'chevron-down']" />
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="opacity: 0; pointer-events: none"
            >占位</label
          >
          <button @click="clearFilters" class="clear-filters-btn">
            <font-awesome-icon :icon="['fas', 'times']" />
            {{ t("settings.steamApi.clearFilters") }}
          </button>
        </div>
      </div>

      <div class="cache-table-container">
        <table class="cache-table" v-if="(filteredEntries || []).length > 0">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="checkbox"
                />
              </th>
              <th>{{ t("settings.steamApi.cacheTable.steamId") }}</th>
              <th>{{ t("settings.steamApi.cacheTable.username") }}</th>
              <th>{{ t("settings.steamApi.cacheTable.lastUpdated") }}</th>
              <th>{{ t("settings.steamApi.cacheTable.callCount") }}</th>
              <th>{{ t("settings.steamApi.cacheTable.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in paginatedEntries || []" :key="entry.steamId">
              <td>
                <input
                  type="checkbox"
                  :checked="selectedEntries.has(entry.steamId)"
                  @change="toggleEntrySelection(entry.steamId)"
                  class="checkbox"
                />
              </td>
              <td class="steam-id-cell">{{ maskSteamId(entry.steamId) }}</td>
              <td>{{ entry.username }}</td>
              <td>{{ formatDate(entry.lastUpdated) }}</td>
              <td>{{ entry.callCount }}</td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    @click="showCacheDetail(entry)"
                    class="action-btn detail-btn"
                    :title="t('settings.steamApi.viewDetail')"
                  >
                    <font-awesome-icon :icon="['fas', 'info-circle']" />
                  </button>
                  <button
                    @click="deleteEntry(entry)"
                    class="action-btn delete-btn"
                    :title="t('settings.steamApi.deleteEntry')"
                    :disabled="isDeleting"
                  >
                    <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-cache-entries">
          {{ t("settings.steamApi.noCacheEntries") }}
        </div>
      </div>

      <!-- 批量操作工具栏 -->
      <div v-if="selectedEntries.size > 0" class="batch-actions-toolbar">
        <div class="batch-info">
          {{
            t("settings.steamApi.selectedCount", {
              count: selectedEntries.size,
            })
          }}
        </div>
        <div class="batch-buttons">
          <button
            @click="batchRefresh"
            class="batch-btn refresh-batch-btn"
            :disabled="isRefreshing"
          >
            <font-awesome-icon
              :icon="['fas', 'sync']"
              :class="{ 'fa-spin': isRefreshing }"
            />
            {{ t("settings.steamApi.batchRefresh") }}
          </button>
          <button
            @click="batchDelete"
            class="batch-btn delete-batch-btn"
            :disabled="isBatchDeleting"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
            {{ t("settings.steamApi.batchDelete") }}
          </button>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination-info">
          {{
            t("settings.steamApi.paginationInfo", {
              current: currentPage,
              total: totalPages,
              count: (filteredEntries || []).length,
            })
          }}
        </div>
        <div class="pagination-controls">
          <button
            @click="changePage(1)"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <font-awesome-icon :icon="['fas', 'angle-double-left']" />
          </button>
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <font-awesome-icon :icon="['fas', 'angle-left']" />
          </button>

          <span class="pagination-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              :class="['pagination-btn', { active: page === currentPage }]"
            >
              {{ page }}
            </button>
          </span>

          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <font-awesome-icon :icon="['fas', 'angle-right']" />
          </button>
          <button
            @click="changePage(totalPages)"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <font-awesome-icon :icon="['fas', 'angle-double-right']" />
          </button>
        </div>

        <div class="page-size-selector">
          <div class="form-group">
            <label class="form-label">
              <font-awesome-icon
                :icon="['fas', 'list-ol']"
                class="label-icon"
              />
              {{ t("settings.steamApi.pageSize") }}
            </label>
            <CustomDropdown
              v-model.number="pageSize"
              :options="[
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]"
              :placeholder="'10'"
              class="dropdown-control"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 成功提示消息 -->
    <div v-if="showSuccessMessage" class="success-message">
      {{ successMessage }}
    </div>

    <!-- 缓存详情弹窗 -->
    <Transition name="modal">
      <div
        v-if="showDetailModal && selectedCacheEntry"
        class="modal-overlay"
        @click="showDetailModal = false"
      >
        <div class="modal-content cache-detail-modal" @click.stop>
          <div class="modal-header">
            <h3>{{ t("settings.steamApi.cacheDetail") }}</h3>
            <button @click="showDetailModal = false" class="close-btn">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>

          <div class="modal-body">
            <div class="detail-item">
              <label>{{ t("settings.steamApi.cacheTable.steamId") }}:</label>
              <span class="steam-id-display">{{
                selectedCacheEntry.steamId
              }}</span>
            </div>
            <div class="detail-item">
              <label>{{ t("settings.steamApi.cacheTable.username") }}:</label>
              <span>{{ selectedCacheEntry.username }}</span>
            </div>
            <div class="detail-item">
              <label
                >{{ t("settings.steamApi.cacheTable.lastUpdated") }}:</label
              >
              <span>{{ formatDate(selectedCacheEntry.lastUpdated) }}</span>
            </div>
            <div class="detail-item">
              <label>{{ t("settings.steamApi.cacheTable.callCount") }}:</label>
              <span>{{ selectedCacheEntry.callCount }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showDetailModal = false" class="cancel-btn">
              {{ t("common.close") }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 操作确认对话框 -->
    <Transition name="modal">
      <div v-if="showConfirmDialog" class="modal-overlay" @click="cancelAction">
        <div class="modal-content confirm-dialog" @click.stop>
          <div class="modal-header">
            <h3>{{ confirmDialogConfig.title }}</h3>
          </div>

          <div class="modal-body">
            <p>{{ confirmDialogConfig.message }}</p>
          </div>

          <div class="modal-footer">
            <button @click="cancelAction" class="cancel-btn">
              {{ confirmDialogConfig.cancelText }}
            </button>
            <button @click="confirmAction" class="confirm-btn">
              {{ confirmDialogConfig.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "vue-i18n";
import { showError } from "../services/popupService";
import CustomDropdown from "../components/CustomDropdown.vue";

export default {
  name: "SteamCache",
  components: {
    CustomDropdown,
  },
  setup() {
    const { t } = useI18n();
    return { t };
  },
  data() {
    return {
      cacheEntries: [],
      cacheCount: 0,
      isCleaning: false,
      showSuccessMessage: false,
      successMessage: "",

      // 搜索和过滤相关数据
      searchQuery: "",
      sortBy: "lastUpdated",
      sortOrder: "desc",
      filterDateRange: { start: null, end: null },
      minCallCount: 0,

      // SteamID显示切换
      showRawSteamId: false,

      // 缓存管理
      selectedEntries: new Set(),
      isRefreshing: false,
      isDeleting: false,
      isBatchDeleting: false,

      // 缓存详情弹窗
      showDetailModal: false,
      selectedCacheEntry: null,

      // 分页相关
      currentPage: 1,
      pageSize: 10,

      // 加载状态
      isLoading: false,

      // 操作确认对话框
      showConfirmDialog: false,
      confirmDialogConfig: {
        title: "",
        message: "",
        confirmText: "",
        cancelText: "",
        onConfirm: null,
      },
    };
  },
  computed: {
    // 计算属性：过滤后的条目
    filteredEntries() {
      let filtered = [...(this.cacheEntries || [])];

      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (entry) =>
            (entry.steamId || "").toLowerCase().includes(query) ||
            (entry.username || "").toLowerCase().includes(query)
        );
      }

      // 最小调用次数过滤
      if (this.minCallCount > 0) {
        filtered = filtered.filter(
          (entry) => entry.callCount >= this.minCallCount
        );
      }

      // 日期范围过滤
      const dateRange = this.filterDateRange || { start: null, end: null };
      if (dateRange.start || dateRange.end) {
        filtered = filtered.filter((entry) => {
          const entryDate = new Date(entry.lastUpdated * 1000);
          const startDate = dateRange.start ? new Date(dateRange.start) : null;
          const endDate = dateRange.end ? new Date(dateRange.end) : null;

          if (startDate && entryDate < startDate) return false;
          if (endDate && entryDate > endDate) return false;
          return true;
        });
      }

      // 排序
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (this.sortBy) {
          case "steamId":
            aValue = a.steamId;
            bValue = b.steamId;
            break;
          case "username":
            aValue = a.username;
            bValue = b.username;
            break;
          case "callCount":
            aValue = a.callCount;
            bValue = b.callCount;
            break;
          case "lastUpdated":
          default:
            aValue = a.lastUpdated;
            bValue = b.lastUpdated;
            break;
        }

        if (this.sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return filtered;
    },

    // 计算属性：分页后的条目
    paginatedEntries() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return (this.filteredEntries || []).slice(start, end);
    },

    // 计算属性：总页数
    totalPages() {
      const totalEntries = this.filteredEntries?.length || 0;
      return Math.ceil(totalEntries / this.pageSize);
    },

    // 计算属性：可见的页码
    visiblePages() {
      const pages = [];
      const total = this.totalPages || 0;
      const current = this.currentPage;
      const maxVisible = 5;

      if (total <= 0) return pages;

      if (total <= maxVisible) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // 显示当前页附近的页码
        let start = Math.max(1, current - 2);
        let end = Math.min(total, current + 2);

        // 调整范围以确保显示5个页码
        if (current <= 3) {
          end = 5;
        } else if (current >= total - 2) {
          start = total - 4;
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }

      return pages;
    },

    // 计算属性：是否全选
    isAllSelected() {
      const entries = this.paginatedEntries || [];
      return (
        entries.length > 0 &&
        entries.every((entry) => this.selectedEntries.has(entry.steamId))
      );
    },
  },
  mounted() {
    this.loadCacheEntries();
  },
  methods: {
    // 返回上一页
    goBack() {
      this.$router.replace("/settings");
    },

    // 加载缓存条目
    async loadCacheEntries() {
      try {
        const entries = await invoke("get_all_steam_cache_entries");
        // 将后端返回的数组格式转换为前端需要的对象格式
        this.cacheEntries = entries.map(
          ([steamId, username, lastUpdated, callCount]) => ({
            steamId,
            username,
            lastUpdated,
            callCount,
          })
        );
        this.cacheCount = (this.cacheEntries || []).length;
      } catch (error) {
        console.error("获取缓存条目失败:", error);
        showError(this.t("settings.steamApi.cacheViewError", { error: error }));
      }
    },

    // 清理过期缓存
    async cleanupExpiredCache() {
      this.isCleaning = true;
      try {
        const count = await invoke("cleanup_expired_steam_cache");
        this.showSuccess(
          this.t("settings.steamApi.cleanupCompleted", { count })
        );
        // 重新加载缓存条目
        await this.loadCacheEntries();
      } catch (error) {
        console.error("清理过期缓存失败:", error);
        showError(this.t("settings.steamApi.cleanupError", { error: error }));
      } finally {
        this.isCleaning = false;
      }
    },

    // 显示成功消息
    showSuccess(message) {
      this.successMessage = message;
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    },

    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp) return this.t("common.unknown");
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    },

    // Steam ID显示处理（脱敏或原始）
    maskSteamId(steamId) {
      if (!steamId) return "";

      // 如果设置为显示原始SteamID，则返回完整ID
      if (this.showRawSteamId) {
        return steamId;
      }

      // Steam ID格式通常是7656119XXXXXXXXX (17位数字)
      if (steamId.length >= 8) {
        const start = steamId.substring(0, 4);
        const end = steamId.substring(steamId.length - 4);
        const middle = "*".repeat(steamId.length - 8);
        return start + middle + end;
      }
      // 如果长度不足8位，只显示前两位
      return steamId.substring(0, 2) + "*".repeat(steamId.length - 2);
    },

    // 切换SteamID显示模式
    toggleSteamIdDisplay() {
      this.showRawSteamId = !this.showRawSteamId;
      this.showSuccess(
        this.showRawSteamId
          ? this.t("settings.steamApi.showingRawSteamId")
          : this.t("settings.steamApi.hidingRawSteamId")
      );
    },

    // 搜索和过滤方法
    clearFilters() {
      this.searchQuery = "";
      this.sortBy = "lastUpdated";
      this.sortOrder = "desc";
      this.minCallCount = 0;
      this.filterDateRange = { start: null, end: null };
      this.currentPage = 1;
      this.showSuccess(this.t("settings.steamApi.filtersCleared"));
    },

    // 缓存管理增强功能
    toggleEntrySelection(steamId) {
      if (this.selectedEntries.has(steamId)) {
        this.selectedEntries.delete(steamId);
      } else {
        this.selectedEntries.add(steamId);
      }
    },

    toggleSelectAll() {
      const entries = this.paginatedEntries || [];
      if (this.isAllSelected) {
        // 取消全选
        entries.forEach((entry) => {
          this.selectedEntries.delete(entry.steamId);
        });
      } else {
        // 全选当前页
        entries.forEach((entry) => {
          this.selectedEntries.add(entry.steamId);
        });
      }
    },

    changePage(page) {
      const total = this.totalPages || 0;
      if (page >= 1 && page <= total) {
        this.currentPage = page;
      }
    },

    // 单个条目操作
    async refreshEntry(entry) {
      this.isRefreshing = true;
      try {
        await invoke("refresh_steam_cache_entry", { steamId: entry.steamId });
        this.showSuccess(
          this.t("settings.steamApi.entryRefreshed", {
            username: entry.username,
          })
        );
        await this.loadCacheEntries();
      } catch (error) {
        console.error("刷新缓存条目失败:", error);
        showError(this.t("settings.steamApi.refreshError", { error: error }));
      } finally {
        this.isRefreshing = false;
      }
    },

    async deleteEntry(entry) {
      this.confirmDialogConfig = {
        title: this.t("settings.steamApi.confirmDelete"),
        message: this.t("settings.steamApi.confirmDeleteMessage", {
          username: entry.username,
        }),
        confirmText: this.t("common.confirm"),
        cancelText: this.t("common.cancel"),
        onConfirm: async () => {
          await this.performDeleteEntry(entry.steamId);
        },
      };
      this.showConfirmDialog = true;
    },

    async performDeleteEntry(steamId) {
      this.isDeleting = true;
      try {
        await invoke("delete_steam_cache_entry", { steamId });
        this.selectedEntries.delete(steamId);
        this.showSuccess(this.t("settings.steamApi.entryDeleted"));
        await this.loadCacheEntries();
      } catch (error) {
        console.error("删除缓存条目失败:", error);
        showError(this.t("settings.steamApi.deleteError", { error: error }));
      } finally {
        this.isDeleting = false;
      }
    },

    // 批量操作
    async batchRefresh() {
      const steamIds = Array.from(this.selectedEntries);
      this.isRefreshing = true;
      try {
        await invoke("batch_refresh_steam_cache_entries", { steamIds });
        this.showSuccess(
          this.t("settings.steamApi.batchRefreshCompleted", {
            count: steamIds.length,
          })
        );
        await this.loadCacheEntries();
      } catch (error) {
        console.error("批量刷新失败:", error);
        showError(
          this.t("settings.steamApi.batchRefreshError", { error: error })
        );
      } finally {
        this.isRefreshing = false;
      }
    },

    async batchDelete() {
      const count = this.selectedEntries.size;
      this.confirmDialogConfig = {
        title: this.t("settings.steamApi.confirmBatchDelete"),
        message: this.t("settings.steamApi.confirmBatchDeleteMessage", {
          count,
        }),
        confirmText: this.t("common.confirm"),
        cancelText: this.t("common.cancel"),
        onConfirm: async () => {
          await this.performBatchDelete();
        },
      };
      this.showConfirmDialog = true;
    },

    async performBatchDelete() {
      const steamIds = Array.from(this.selectedEntries);
      this.isBatchDeleting = true;
      try {
        await invoke("batch_delete_steam_cache_entries", { steamIds });
        this.selectedEntries.clear();
        this.showSuccess(
          this.t("settings.steamApi.batchDeleteCompleted", {
            count: steamIds.length,
          })
        );
        await this.loadCacheEntries();
      } catch (error) {
        console.error("批量删除失败:", error);
        showError(
          this.t("settings.steamApi.batchDeleteError", { error: error })
        );
      } finally {
        this.isBatchDeleting = false;
      }
    },

    // 缓存详情弹窗
    showCacheDetail(entry) {
      this.selectedCacheEntry = entry;
      this.showDetailModal = true;
    },

    // 操作确认对话框
    confirmAction() {
      if (this.confirmDialogConfig.onConfirm) {
        this.confirmDialogConfig.onConfirm();
      }
      this.showConfirmDialog = false;
    },

    cancelAction() {
      this.showConfirmDialog = false;
    },
  },
};
</script>

<style scoped>
/* 磨砂玻璃效果基础样式 - 优化版 */
.steam-cache-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  padding-bottom: 30px;
  margin: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(250, 250, 252, 0.9) 50%,
    rgba(245, 247, 250, 0.85) 100%
  );
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  overflow: hidden;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.steam-cache-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.8) 50%,
    transparent 100%
  );
  pointer-events: none;
}

[data-theme="dark"] .steam-cache-container {
  background: linear-gradient(
    135deg,
    rgba(30, 30, 35, 0.95) 0%,
    rgba(25, 25, 30, 0.9) 50%,
    rgba(20, 20, 25, 0.85) 100%
  );
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
}

[data-theme="dark"] .steam-cache-container::before {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
}

/* 返回按钮 - 紧凑设计 */
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
}

.back-btn svg {
  font-size: 16px;
}

[data-theme="dark"] .back-btn {
  background: rgba(35, 35, 40, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  color: var(--primary);
  transform: translateX(-4px) scale(1.1);
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.2),
    0 4px 12px rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.3);
}

[data-theme="dark"] .back-btn:hover {
  background: rgba(40, 40, 45, 0.95);
  box-shadow: 0 8px 24px rgba(10, 132, 255, 0.25),
    0 4px 12px rgba(10, 132, 255, 0.15);
}

.back-btn:active {
  transform: translateX(-2px) scale(1.05);
  transition-duration: 0.1s;
}

/* 缓存内容区域 */
.cache-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* 缓存操作区域 - 磨砂玻璃卡片 */
.cache-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(250, 250, 255, 0.7) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.cache-actions::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

.cache-actions:hover::before {
  left: 100%;
}

.cache-actions:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

[data-theme="dark"] .cache-actions {
  background: linear-gradient(
    135deg,
    rgba(35, 35, 40, 0.9) 0%,
    rgba(30, 30, 35, 0.7) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .cache-actions::before {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
}

[data-theme="dark"] .cache-actions:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.cache-actions-left,
.cache-actions-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cache-actions-left {
  flex-wrap: wrap;
}

/* 清理过期缓存按钮 - 微交互优化 */
.cleanup-expired-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 59, 48, 0.9) 0%,
    rgba(255, 45, 85, 0.8) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.25),
    0 2px 4px rgba(255, 59, 48, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.cleanup-expired-btn::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.cleanup-expired-btn:hover::before {
  width: 300px;
  height: 300px;
}

.cleanup-expired-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 45, 85, 1) 0%,
    rgba(255, 59, 48, 0.95) 100%
  );
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 59, 48, 0.35),
    0 4px 8px rgba(255, 59, 48, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.cleanup-expired-btn:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
  transition-duration: 0.1s;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3),
    0 2px 4px rgba(255, 59, 48, 0.2);
}

.cleanup-expired-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  filter: grayscale(30%);
}

/* SteamID显示切换按钮 - 微交互优化 */
.toggle-steamid-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    rgba(0, 122, 255, 0.85) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25),
    0 2px 4px rgba(0, 122, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.toggle-steamid-btn::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.toggle-steamid-btn:hover::before {
  width: 300px;
  height: 300px;
}

.toggle-steamid-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(10, 132, 255, 1) 0%,
    var(--primary) 100%
  );
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.35),
    0 4px 8px rgba(0, 122, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.toggle-steamid-btn:active {
  transform: translateY(-1px) scale(0.98);
  transition-duration: 0.1s;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3),
    0 2px 4px rgba(0, 122, 255, 0.2);
}

/* 缓存计数信息 - 微交互优化 */
.cache-count-info {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  padding: 10px 18px;
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.08) 0%,
    rgba(0, 122, 255, 0.05) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cache-count-info:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.12) 0%,
    rgba(0, 122, 255, 0.08) 100%
  );
  border-color: rgba(0, 122, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .cache-count-info {
  color: var(--primary);
  background: linear-gradient(
    135deg,
    rgba(10, 132, 255, 0.15) 0%,
    rgba(10, 132, 255, 0.1) 100%
  );
  border: 1px solid rgba(10, 132, 255, 0.25);
}

/* 搜索和过滤区域 - 磨砂玻璃卡片 */
.search-filter-section {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(250, 250, 255, 0.65) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-filter-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

[data-theme="dark"] .search-filter-section {
  background: linear-gradient(
    135deg,
    rgba(35, 35, 40, 0.85) 0%,
    rgba(30, 30, 35, 0.65) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 160px;
  max-width: 220px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  user-select: none;
  transition: color 0.2s ease;
}

.form-group:hover .form-label {
  color: var(--primary);
}

.label-icon {
  font-size: 11px;
  color: var(--primary);
  opacity: 0.7;
  transition: all 0.3s ease;
}

.form-group:hover .label-icon {
  opacity: 1;
  transform: scale(1.1);
}

.search-input-group {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .search-input {
  background: rgba(40, 40, 45, 0.8);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.search-input:hover {
  border-color: rgba(0, 122, 255, 0.3);
  background: rgba(255, 255, 255, 0.95);
}

[data-theme="dark"] .search-input:hover {
  border-color: rgba(10, 132, 255, 0.3);
  background: rgba(45, 45, 50, 0.9);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1),
    0 4px 12px rgba(0, 122, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

[data-theme="dark"] .search-input:focus {
  background: rgba(45, 45, 50, 1);
  box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.15),
    0 4px 12px rgba(10, 132, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.search-input::placeholder {
  color: var(--text-tertiary);
  font-weight: 400;
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 12px;
}

/* 过滤选择器和输入框 - 微交互优化 */
.filter-select,
.filter-input {
  padding: 12px 16px;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 160px;
  height: 44px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

/* 数字输入框样式优化 */
.filter-input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.filter-input[type="number"]::-webkit-outer-spin-button,
.filter-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 自定义数字输入框容器 */
.number-input-wrapper {
  position: relative;
  width: 100%;
}

.number-input-wrapper .filter-input {
  width: 100%;
  padding-right: 36px;
}

/* 自定义数字箭头 */
.number-spinner {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spinner-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 18px;
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.08) 0%,
    rgba(0, 122, 255, 0.05) 100%
  );
  border: 1px solid rgba(0, 122, 255, 0.15);
  border-radius: 6px;
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-size: 10px;
  padding: 0;
}

.spinner-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.15) 0%,
    rgba(0, 122, 255, 0.1) 100%
  );
  border-color: rgba(0, 122, 255, 0.3);
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.spinner-btn:active {
  transform: scale(0.95);
  transition-duration: 0.1s;
}

[data-theme="dark"] .spinner-btn {
  background: linear-gradient(
    135deg,
    rgba(10, 132, 255, 0.15) 0%,
    rgba(10, 132, 255, 0.1) 100%
  );
  border: 1px solid rgba(10, 132, 255, 0.25);
}

[data-theme="dark"] .spinner-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(10, 132, 255, 0.25) 0%,
    rgba(10, 132, 255, 0.18) 100%
  );
  border-color: rgba(10, 132, 255, 0.4);
  box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
}

[data-theme="dark"] .filter-select,
[data-theme="dark"] .filter-input {
  background: rgba(40, 40, 45, 0.8);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.filter-select:hover,
.filter-input:hover {
  border-color: rgba(0, 122, 255, 0.3);
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

[data-theme="dark"] .filter-select:hover,
[data-theme="dark"] .filter-input:hover {
  border-color: rgba(10, 132, 255, 0.3);
  background: rgba(45, 45, 50, 0.95);
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1),
    0 4px 12px rgba(0, 122, 255, 0.15);
  transform: translateY(-1px);
}

[data-theme="dark"] .filter-select:focus,
[data-theme="dark"] .filter-input:focus {
  background: rgba(50, 50, 55, 1);
  box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.15),
    0 4px 12px rgba(10, 132, 255, 0.2);
}

.filter-input {
  min-width: 140px;
  cursor: text;
}

/* 清空过滤按钮 - 微交互优化 */
.clear-filters-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  height: 44px;
  box-sizing: border-box;
  white-space: nowrap;
}

[data-theme="dark"] .clear-filters-btn {
  background: rgba(45, 45, 50, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
}

.clear-filters-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-primary);
  border-color: rgba(0, 0, 0, 0.12);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .clear-filters-btn:hover {
  background: rgba(50, 50, 55, 0.9);
  border-color: rgba(255, 255, 255, 0.15);
}

/* 缓存表格容器 - 磨砂玻璃风格 */
.cache-table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(250, 250, 255, 0.75) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  min-height: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cache-table-container:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

[data-theme="dark"] .cache-table-container {
  background: linear-gradient(
    135deg,
    rgba(35, 35, 40, 0.9) 0%,
    rgba(30, 30, 35, 0.75) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* 缓存表格 */
.cache-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.cache-table th,
.cache-table td {
  padding: 16px 20px;
  text-align: left;
  transition: all 0.2s ease;
}

.cache-table th {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(250, 250, 255, 0.8) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid rgba(0, 122, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

[data-theme="dark"] .cache-table th {
  background: linear-gradient(
    135deg,
    rgba(40, 40, 45, 0.95) 0%,
    rgba(35, 35, 40, 0.8) 100%
  );
  border-bottom: 2px solid rgba(10, 132, 255, 0.2);
}

.cache-table td {
  color: var(--text-primary);
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .cache-table td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.cache-table tr:last-child td {
  border-bottom: none;
}

.cache-table tbody tr {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.cache-table tbody tr:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.08) 0%,
    rgba(0, 122, 255, 0.05) 100%
  );
  transform: translateX(4px);
  box-shadow: -4px 0 0 0 var(--primary), 0 2px 12px rgba(0, 122, 255, 0.12);
}

[data-theme="dark"] .cache-table tbody tr:hover {
  background: linear-gradient(
    135deg,
    rgba(10, 132, 255, 0.12) 0%,
    rgba(10, 132, 255, 0.08) 100%
  );
}

/* SteamID单元格 */
.steam-id-cell {
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: 0.5px;
}

/* 复选框 - 微交互优化 */
.checkbox {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 122, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(250, 250, 255, 0.6) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

[data-theme="dark"] .checkbox {
  border: 2px solid rgba(10, 132, 255, 0.4);
  background: linear-gradient(
    135deg,
    rgba(40, 40, 45, 0.8) 0%,
    rgba(35, 35, 40, 0.6) 100%
  );
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.checkbox:hover {
  border-color: var(--primary);
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .checkbox:hover {
  box-shadow: 0 4px 12px rgba(10, 132, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.checkbox:checked {
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    rgba(0, 122, 255, 0.85) 100%
  );
  border-color: var(--primary);
  animation: checkboxPulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

[data-theme="dark"] .checkbox:checked {
  background: linear-gradient(
    135deg,
    rgba(10, 132, 255, 1) 0%,
    rgba(10, 132, 255, 0.9) 100%
  );
  box-shadow: 0 4px 16px rgba(10, 132, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.checkbox:checked::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -60%) rotate(45deg);
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2.5px 2.5px 0;
  opacity: 0;
  animation: checkmarkAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s
    forwards;
}

@keyframes checkmarkAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -60%) rotate(45deg) scale(0);
  }

  100% {
    opacity: 1;
    transform: translate(-50%, -60%) rotate(45deg) scale(1);
  }
}

@keyframes checkboxPulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }
}

/* 操作单元格 */
.actions-cell {
  padding: 8px !important;
}

/* 操作按钮容器 */
.action-buttons {
  display: flex;
  gap: 4px;
}

/* 操作按钮 */
.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.action-btn:hover::before {
  width: 100px;
  height: 100px;
}

.detail-btn {
  background: linear-gradient(
    135deg,
    rgba(23, 162, 184, 0.9) 0%,
    rgba(19, 132, 150, 0.8) 100%
  );
  color: white;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.25);
}

.detail-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(19, 132, 150, 1) 0%,
    rgba(23, 162, 184, 0.95) 100%
  );
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 8px 20px rgba(23, 162, 184, 0.35);
}

.refresh-btn {
  background: linear-gradient(
    135deg,
    rgba(40, 167, 69, 0.9) 0%,
    rgba(33, 136, 56, 0.8) 100%
  );
  color: white;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.25);
}

.refresh-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(33, 136, 56, 1) 0%,
    rgba(40, 167, 69, 0.95) 100%
  );
  transform: translateY(-3px) scale(1.08) rotate(180deg);
  box-shadow: 0 8px 20px rgba(40, 167, 69, 0.35);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(30%);
}

.delete-btn {
  background: linear-gradient(
    135deg,
    rgba(255, 59, 48, 0.9) 0%,
    rgba(255, 45, 85, 0.8) 100%
  );
  color: white;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.25);
}

.delete-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 45, 85, 1) 0%,
    rgba(255, 59, 48, 0.95) 100%
  );
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 8px 20px rgba(255, 59, 48, 0.35);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(30%);
}

/* 无缓存条目提示 - 优化 */
.no-cache-entries {
  padding: 80px 40px;
  text-align: center;
  color: var(--text-tertiary);
  font-style: italic;
  font-size: 15px;
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.03) 0%,
    rgba(139, 92, 246, 0.03) 100%
  );
  border-radius: 16px;
  border: 2px dashed rgba(0, 122, 255, 0.2);
  transition: all 0.3s ease;
}

.no-cache-entries:hover {
  border-color: rgba(0, 122, 255, 0.3);
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.05) 0%,
    rgba(139, 92, 246, 0.05) 100%
  );
}

[data-theme="dark"] .no-cache-entries {
  background: linear-gradient(
    135deg,
    rgba(10, 132, 255, 0.05) 0%,
    rgba(139, 92, 246, 0.05) 100%
  );
  border-color: rgba(10, 132, 255, 0.25);
}

/* 成功消息 - 磨砂玻璃动画 */
.success-message {
  position: fixed;
  top: 80px;
  right: 24px;
  background: linear-gradient(
    135deg,
    rgba(52, 199, 89, 0.98) 0%,
    rgba(48, 209, 88, 0.95) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  color: white;
  padding: 16px 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(52, 199, 89, 0.35),
    0 4px 12px rgba(52, 199, 89, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  z-index: 10000;
  animation: successSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-weight: 600;
  font-size: 15px;
  min-width: 280px;
  max-width: 400px;
}

@keyframes successSlideIn {
  0% {
    opacity: 0;
    transform: translateX(100%) scale(0.8);
  }

  60% {
    transform: translateX(-10px) scale(1.05);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* 模态框样式 - 磨砂玻璃优化 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

/* Vue Transition 进场动画 */
.modal-enter-active {
  animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-active .modal-content {
  animation: modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Vue Transition 退场动画 */
.modal-leave-active {
  animation: modalFadeOut 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.modal-leave-active .modal-content {
  animation: modalSlideDown 0.25s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }

  to {
    opacity: 1;
    backdrop-filter: blur(12px) saturate(120%);
    -webkit-backdrop-filter: blur(12px) saturate(120%);
  }
}

@keyframes modalFadeOut {
  from {
    opacity: 1;
    backdrop-filter: blur(12px) saturate(120%);
    -webkit-backdrop-filter: blur(12px) saturate(120%);
  }

  to {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
}

@keyframes modalSlideUp {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.9);
  }

  60% {
    transform: translateY(-8px) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes modalSlideDown {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
}

.modal-content {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(250, 250, 255, 0.95) 100%
  );
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
}

[data-theme="dark"] .modal-content {
  background: linear-gradient(
    135deg,
    rgba(30, 30, 35, 0.98) 0%,
    rgba(25, 25, 30, 0.95) 100%
  );
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.modal-content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.8) 50%,
    transparent 100%
  );
  pointer-events: none;
}

.cache-detail-modal,
.system-stats-modal {
  width: 500px;
}

.confirm-dialog {
  width: 400px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(250, 250, 252, 0.4) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .modal-header {
  background: linear-gradient(
    135deg,
    rgba(35, 35, 40, 0.6) 0%,
    rgba(30, 30, 35, 0.4) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
  padding: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

[data-theme="dark"] .close-btn {
  background: rgba(45, 45, 50, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.close-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.9);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .close-btn:hover {
  background: rgba(50, 50, 55, 0.9);
}

.modal-body {
  padding: 28px;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(250, 250, 252, 0.4) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .modal-footer {
  background: linear-gradient(
    135deg,
    rgba(35, 35, 40, 0.6) 0%,
    rgba(30, 30, 35, 0.4) 100%
  );
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* 缓存详情弹窗样式 */
.detail-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--divider-color);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 120px;
  margin-right: 16px;
}

.steam-id-display {
  font-family: monospace;
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-all;
}

/* 系统监控面板样式 */
.stats-body {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  padding: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--divider-color);
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.most-active-users {
  padding: 20px;
  border-top: 1px solid var(--divider-color);
}

.most-active-users h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.most-active-users ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.most-active-users li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider-color);
}

.most-active-users li:last-child {
  border-bottom: none;
}

.most-active-users .username {
  font-weight: 500;
  color: var(--text-primary);
}

.most-active-users .call-count {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 确认对话框样式 */
.confirm-dialog .modal-body {
  text-align: center;
}

.confirm-dialog .modal-body p {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-primary);
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--divider-color);
}

.cancel-btn:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.confirm-btn {
  background: linear-gradient(
    135deg,
    rgba(220, 53, 69, 0.8),
    rgba(220, 53, 69, 0.6)
  );
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(220, 53, 69, 0.3);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
}

.confirm-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(200, 35, 51, 0.9),
    rgba(200, 35, 51, 0.7)
  );
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

/* 自定义下拉框样式增强 */
.dropdown-control {
  min-width: 140px;
  max-width: 160px;
  width: 160px;
}

.custom-dropdown {
  position: relative;
  width: 100%;
}

.custom-dropdown .dropdown-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--bg-primary);
  border: 1px solid var(--divider-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 36px;
  user-select: none;
  width: 100%;
  box-sizing: border-box;
}

.custom-dropdown .dropdown-display:hover {
  border-color: var(--accent-color);
  background-color: var(--bg-tertiary);
}

.custom-dropdown .dropdown-display.open {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
}

.custom-dropdown .dropdown-text {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-dropdown .dropdown-icon {
  font-size: 10px;
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
  margin-left: 8px;
}

.custom-dropdown .dropdown-icon.open {
  transform: rotate(180deg);
}

.custom-dropdown .dropdown-menu {
  background-color: var(--bg-secondary);
  border: 1px solid var(--divider-color);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  backdrop-filter: blur(20px);
  max-height: 200px;
  overflow-y: auto;
}

.custom-dropdown .dropdown-option {
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--text-primary);
  user-select: none;
}

.custom-dropdown .dropdown-option:hover {
  background-color: var(--bg-tertiary);
}

.custom-dropdown .dropdown-option.selected {
  background-color: var(--accent-color);
  color: white;
  font-weight: 600;
}

.custom-dropdown .dropdown-option:not(:last-child) {
  border-bottom: 1px solid var(--divider-color);
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 批量操作工具栏 - 磨砂玻璃风格 */
.batch-actions-toolbar {
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.12) 0%,
    rgba(0, 122, 255, 0.08) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 122, 255, 0.25);
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: slideInDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.15),
    0 2px 6px rgba(0, 122, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .batch-actions-toolbar {
  background: linear-gradient(
    135deg,
    rgba(10, 132, 255, 0.15) 0%,
    rgba(10, 132, 255, 0.1) 100%
  );
  border: 1px solid rgba(10, 132, 255, 0.3);
}

.batch-actions-toolbar::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

.batch-actions-toolbar:hover::before {
  left: 100%;
}

.batch-actions-toolbar:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 122, 255, 0.2),
    0 4px 12px rgba(0, 122, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.batch-info {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-buttons {
  display: flex;
  gap: 12px;
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.batch-btn::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.batch-btn:hover::before {
  width: 300px;
  height: 300px;
}

.refresh-batch-btn {
  background: linear-gradient(
    135deg,
    rgba(40, 167, 69, 0.9) 0%,
    rgba(33, 136, 56, 0.8) 100%
  );
  color: white;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.25);
}

.refresh-batch-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(33, 136, 56, 1) 0%,
    rgba(40, 167, 69, 0.95) 100%
  );
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(40, 167, 69, 0.35);
}

.delete-batch-btn {
  background: linear-gradient(
    135deg,
    rgba(255, 59, 48, 0.9) 0%,
    rgba(255, 45, 85, 0.8) 100%
  );
  color: white;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.25);
}

.delete-batch-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 45, 85, 1) 0%,
    rgba(255, 59, 48, 0.95) 100%
  );
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 59, 48, 0.35);
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(30%);
}

/* 分页控件 - 磨砂玻璃风格 */
.pagination-container {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(250, 250, 255, 0.65) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] .pagination-container {
  background: linear-gradient(
    135deg,
    rgba(35, 35, 40, 0.85) 0%,
    rgba(30, 30, 35, 0.65) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pagination-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.pagination-info {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn {
  width: 38px;
  height: 38px;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-secondary);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

[data-theme="dark"] .pagination-btn {
  background: rgba(40, 40, 45, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.95);
  color: var(--primary);
  border-color: rgba(0, 122, 255, 0.3);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
}

[data-theme="dark"] .pagination-btn:hover:not(:disabled) {
  background: rgba(45, 45, 50, 0.9);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.pagination-btn.active {
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    rgba(0, 122, 255, 0.85) 100%
  );
  color: white;
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.35),
    0 2px 4px rgba(0, 122, 255, 0.2);
  transform: scale(1.1);
}

.pagination-btn.active:hover {
  transform: translateY(-2px) scale(1.12);
}

.pagination-numbers {
  display: flex;
  gap: 6px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.page-size-selector .form-group {
  margin: 0;
  min-width: auto;
}

.page-size-selector .form-label {
  margin-bottom: 0;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .page-header {
    padding: 16px 20px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .cache-content {
    padding: 16px 20px;
  }

  .cache-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .cache-actions-left {
    flex-direction: column;
    gap: 10px;
  }

  .cache-actions-right {
    justify-content: center;
  }

  .search-filter-section {
    padding: 16px;
  }

  .search-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .form-group {
    min-width: unset;
    max-width: unset;
  }

  .cache-table-container {
    font-size: 13px;
    overflow-x: auto;
  }

  .cache-table {
    min-width: 600px;
  }

  .cache-table th,
  .cache-table td {
    padding: 10px 12px;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }

  .batch-actions-toolbar {
    flex-direction: column;
    gap: 16px;
    text-align: center;
    padding: 16px;
  }

  .batch-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }

  .pagination-container {
    flex-direction: column;
    gap: 16px;
    text-align: center;
    padding: 16px;
  }

  .pagination-controls {
    order: 2;
  }

  .page-size-selector {
    order: 1;
    justify-content: center;
  }

  .modal-content {
    width: 95vw !important;
    max-width: 95vw;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .detail-item label {
    min-width: unset;
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
  }

  .back-btn {
    align-self: flex-start;
  }

  .cache-content {
    padding: 12px 16px;
  }

  .search-input {
    font-size: 16px;
    /* 防止iOS缩放 */
  }

  .action-btn {
    width: 26px;
    height: 26px;
    font-size: 10px;
  }

  .batch-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  .pagination-btn {
    width: 34px;
    height: 34px;
    font-size: 13px;
  }
}
</style>
