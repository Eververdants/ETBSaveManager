<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div v-if="visible" class="inventory-item-selector" @click.self="close">
        <Transition name="modal-scale" appear>
          <div class="selector-modal" role="dialog" :aria-label="$t('inventory.selectItem')" aria-modal="true">
            <div class="modal-header">
              <h3>{{ $t("inventory.selectItem") }}</h3>
              <button class="close-btn" @click="close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>

            <div class="selector-body">
              <div class="modal-toolbar">
                <div class="search-input-wrap">
                  <span class="search-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="7" cy="7" r="4.75" stroke="currentColor" stroke-width="1.5" />
                      <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    </svg>
                  </span>
                  <input
                    ref="searchInputRef"
                    v-model="searchQuery"
                    type="text"
                    class="search-input"
                    :placeholder="$t('inventory.searchPlaceholder')"
                  />
                  <button
                    v-if="searchQuery"
                    class="clear-search"
                    type="button"
                    :aria-label="$t('inventory.clearSearch')"
                    @click="clearSearch"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <div class="toolbar-meta">
                  <span class="result-count">{{
                    $t("inventory.resultCount", {
                      count: filteredItems.length,
                      total: availableItems.length,
                    })
                  }}</span>
                  <span v-if="selectedItemLabel" class="selected-badge">{{
                    $t("inventory.currentSelection", { name: selectedItemLabel })
                  }}</span>
                  <button class="remove-btn" type="button" @click="selectItem(null)">
                    {{ $t("inventory.removeItem") }}
                  </button>
                </div>
              </div>

              <TransitionGroup v-if="filteredItems.length" name="item-appear" appear tag="div" class="items-grid">
                <div
                  v-for="item in filteredItems"
                  :key="item.id"
                  class="item-card"
                  :class="{ selected: selectedItem === item.id }"
                  @click="selectItem(item.id)"
                >
                  <div class="item-image-wrapper">
                    <LazyImage
                      :src="`/icons/ETB_UI/${item.image}`"
                      :alt="getItemName(item.id)"
                      image-class="item-image"
                    />
                  </div>
                  <span class="item-name">{{ getItemName(item.id) }}</span>
                </div>
              </TransitionGroup>
              <div v-else class="empty-state-wrapper">
                <div class="empty-state">
                  {{ $t("inventory.searchEmpty") }}
                </div>
                <div v-if="fuzzyResults.length" class="fuzzy-suggestions">
                  <p class="fuzzy-label">{{ $t("inventory.didYouMean") }}</p>
                  <div class="fuzzy-grid">
                    <div
                      v-for="result in fuzzyResults"
                      :key="result.item.id"
                      class="fuzzy-card"
                      :title="`${getItemName(result.item.id)} (${(result.score * 100).toFixed(0)}%)`"
                      @click="selectItem(result.item.id)"
                    >
                      <div class="fuzzy-image-wrapper">
                        <LazyImage
                          :src="`/icons/ETB_UI/${result.item.image}`"
                          :alt="getItemName(result.item.id)"
                          image-class="fuzzy-image"
                        />
                      </div>
                      <span class="fuzzy-name">{{ getItemName(result.item.id) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, nextTick, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useInventoryItemSelector } from "@/composables/useInventoryItemSelector";
import LazyImage from "../ui/LazyImage.vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  selectedItem: { type: String, default: null },
});

const emit = defineEmits(["update:visible", "select"]);

const { t, te } = useI18n({ useScope: "global" });

const getItemName = (itemId) => {
  const translationKey = `inventory.items.${itemId}`;
  return te(translationKey) ? t(translationKey) : itemId;
};

const visibleRef = toRef(props, "visible");
const {
  searchQuery,
  searchInputRef,
  availableItems,
  filteredItems,
  fuzzyResults,
  clearSearch,
  focusSearch,
  resetSearch,
} = useInventoryItemSelector(getItemName);

const selectedItemLabel = computed(() => {
  if (!props.selectedItem) return "";
  return getItemName(props.selectedItem);
});

watch(visibleRef, (isVisible) => {
  if (isVisible) {
    nextTick(() => focusSearch());
  } else {
    resetSearch();
  }
});

const close = () => emit("update:visible", false);
const selectItem = (itemId) => {
  emit("select", itemId);
  close();
};

const handleKeydown = (event) => {
  if (!props.visible) return;
  if (event.key === "Escape") {
    if (searchQuery.value) {
      searchQuery.value = "";
      event.preventDefault();
    } else {
      close();
    }
  }
};

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.inventory-item-selector {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
  padding: 20px;
  box-sizing: border-box;
  overflow: auto;
}

.selector-modal {
  background: linear-gradient(145deg, var(--glass-bg) 0%, var(--bg-secondary) 100%);
  backdrop-filter: var(--glass-backdrop-filter);
  -webkit-backdrop-filter: var(--glass-backdrop-filter);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-modal);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  width: 90%;
  max-width: 640px;
  height: min(85vh, 720px);
  overflow: hidden;
  position: relative;
  margin: auto;
  display: flex;
  flex-direction: column;
}

/* 淡入淡出动画 - 更流畅 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 缩放动画 - 增强弹性效果 */
.modal-scale-enter-active,
.modal-scale-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(-30px);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(30px);
}

/* 物品出现动画 — 极短淡入淡出，避免搜索键入时整格重排 */
.item-appear-enter-active,
.item-appear-leave-active {
  transition: opacity 0.15s ease;
}

.item-appear-enter-from,
.item-appear-leave-to {
  opacity: 0;
}

.item-appear-move {
  transition: transform 0.2s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 26px;
  border-bottom: 1px solid var(--glass-border);
  background: linear-gradient(to bottom, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.modal-header h3 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.close-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  transform: rotate(90deg);
}

.selector-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 26px 26px;
  flex: 1;
  min-height: 0;
}

.modal-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.search-input-wrap {
  position: relative;
  flex: 1 1 260px;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 11px 38px 11px 40px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-input);
  background: linear-gradient(145deg, var(--card-bg) 0%, var(--glass-bg) 100%);
  color: var(--text-primary);
  outline: none;
  font-size: 13px;
  transition: all 0.25s ease;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-input:hover {
  border-color: color-mix(in srgb, var(--accent-color) 30%, transparent);
}

.search-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 12%, transparent);
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-circle);
  transition: all 0.2s ease;
}

.clear-search:hover {
  color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}

.toolbar-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.result-count {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.selected-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 12%, var(--bg-secondary)) 0%,
    color-mix(in srgb, var(--primary) 8%, var(--bg-tertiary)) 100%
  );
  border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
  padding: 5px 10px;
  border-radius: var(--radius-tag);
  white-space: nowrap;
}

.remove-btn {
  border: 1px solid rgba(255, 59, 48, 0.35);
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.12) 0%, rgba(255, 59, 48, 0.08) 100%);
  color: var(--error-color);
  padding: 7px 14px;
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 600;
}

.remove-btn:hover {
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.22) 0%, rgba(255, 59, 48, 0.15) 100%);
  border-color: rgba(255, 59, 48, 0.6);
  transform: translateY(-1px);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
  grid-auto-rows: max-content;
  gap: 16px;
  overflow-y: auto;
  padding-right: 6px;
  flex: 1;
  min-height: 0;
  align-content: start;
  align-items: start;
}

.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(145deg, var(--card-bg) 0%, var(--glass-bg) 100%);
  position: relative;
  overflow: hidden;
}

.item-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(var(--primary-rgb, 99, 102, 241), 0.15) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.item-card:hover {
  transform: translateY(-4px) scale(1.03);
  border-color: color-mix(in srgb, var(--accent-color) 35%, transparent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.item-card:hover::before {
  opacity: 1;
}

.item-card.selected {
  border-color: var(--accent-color);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--primary) 12%, var(--card-bg)) 0%,
    color-mix(in srgb, var(--primary) 6%, var(--glass-bg)) 100%
  );
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent),
    0 8px 24px rgba(0, 0, 0, 0.1);
}

.item-card.selected::before {
  opacity: 1;
}

.item-image-wrapper {
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.item-image {
  width: 50px;
  height: 50px;
  object-fit: contain;
  display: block;
  margin-left: auto;
  margin-right: auto;
  transition: transform 0.25s ease;
}

.item-card:hover .item-image {
  transform: scale(1.1);
}

.item-name {
  font-size: 12px;
  text-align: center;
  color: var(--text-primary);
  line-height: 1.3;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-secondary);
  border: 2px dashed var(--glass-border);
  border-radius: var(--radius-md);
  background: linear-gradient(145deg, var(--glass-bg) 0%, var(--bg-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.empty-state-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.fuzzy-suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fuzzy-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  padding: 0 6px;
}

.fuzzy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
  gap: 12px;
}

.fuzzy-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 10px;
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(145deg, var(--card-bg) 0%, var(--glass-bg) 100%);
}

.fuzzy-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent-color);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.fuzzy-image-wrapper {
  width: 42px;
  height: 42px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.fuzzy-image {
  width: 42px;
  height: 42px;
  object-fit: contain;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.fuzzy-name {
  font-size: 11px;
  text-align: center;
  color: var(--text-primary);
  line-height: 1.3;
  font-weight: 500;
}

@media (max-width: 768px) {
  .selector-modal {
    width: 95%;
    margin: 16px;
    border-radius: var(--radius-xl);
  }

  .modal-header {
    padding: 18px 20px;
  }

  .modal-header h3 {
    font-size: 17px;
  }

  .selector-body {
    padding: 12px 18px 20px;
    gap: 12px;
  }

  .search-input-wrap {
    min-width: 100%;
  }

  .toolbar-meta {
    width: 100%;
    justify-content: space-between;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
    gap: 12px;
  }

  .item-card {
    padding: 12px;
  }

  .item-image-wrapper {
    width: 44px;
    height: 44px;
  }

  .item-image {
    width: 44px;
    height: 44px;
  }

  .fuzzy-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>
