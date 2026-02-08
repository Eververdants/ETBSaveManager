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
                  <path d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5" stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" />
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
                  <input ref="searchInput" v-model="searchQuery" type="text" class="search-input"
                    :placeholder="$t('inventory.searchPlaceholder')" />
                  <button v-if="searchQuery" class="clear-search" type="button" @click="clearSearch"
                    :aria-label="$t('inventory.clearSearch')">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round" />
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
                <div v-for="item in filteredItems" :key="item.id" class="item-card"
                  :class="{ selected: selectedItem === item.id }" @click="selectItem(item.id)">
                  <div class="item-image-wrapper">
                    <LazyImage :src="`/icons/ETB_UI/${item.image}`" :alt="getItemName(item.id)"
                      image-class="item-image" />
                  </div>
                  <span class="item-name">{{ getItemName(item.id) }}</span>
                </div>
              </TransitionGroup>
              <div v-else class="empty-state">
                {{ $t("inventory.searchEmpty") }}
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import LazyImage from "./LazyImage.vue";
import { useI18n } from "vue-i18n";

export default {
  name: "InventoryItemSelector",
  components: {
    LazyImage,
  },
  setup() {
    const { t, te } = useI18n();

    const getItemName = (itemId) => {
      const translationKey = `inventory.items.${itemId}`;
      return te(translationKey) ? t(translationKey) : itemId;
    };

    return {
      getItemName,
    };
  },
  data() {
    return {
      searchQuery: "",
    };
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    selectedItem: {
      type: String,
      default: null,
    },
  },
  emits: ["update:visible", "select"],
  computed: {
    availableItems() {
      return [
        { id: "AlmondConcentrate", image: "AlmondConcentrate.png" },
        { id: "BugSpray", image: "BugSpray.png" },
        { id: "Camera", image: "Camera.png" },
        { id: "AlmondWater", image: "AlmondWater.png" },
        { id: "Chainsaw", image: "Chainsaw.png" },
        { id: "Crowbar", image: "Crowbar.png" },
        { id: "DivingHelmet", image: "DivingHelmet.png" },
        { id: "EnergyBar", image: "EnergyBar.png" },
        { id: "Firework", image: "Firework.png" },
        { id: "Flaregun", image: "Flaregun.png" },
        { id: "Flashlight", image: "Flashlight.png" },
        { id: "GlowstickBlue", image: "GlowstickBlue.png" },
        { id: "GlowStick", image: "GlowStick.png" },
        { id: "GlowstickRed", image: "GlowstickRed.png" },
        { id: "GlowstickYellow", image: "GlowstickYellow.png" },
        { id: "Knife", image: "Knife.png" },
        { id: "LiquidPain", image: "LiquidPain.png" },
        { id: "Juice", image: "Juice.png" },
        { id: "Rope", image: "Rope.png" },
        { id: "LiDAR", image: "LiDAR.png" },
        { id: "Thermometer", image: "Thermometer.png" },
        { id: "Ticket", image: "Ticket.png" },
        { id: "Toy", image: "Teddy_Bear.png" },
        { id: "WalkieTalkie", image: "WalkieTalkie.png" },
        { id: "MothJelly", image: "MothJelly.png" },
      ];
    },
    filteredItems() {
      const keyword = this.searchQuery.trim().toLowerCase();
      if (!keyword) return this.availableItems;
      return this.availableItems.filter((item) => {
        const itemId = String(item.id || "").toLowerCase();
        const itemName = String(this.getItemName(item.id) || "").toLowerCase();
        return itemId.includes(keyword) || itemName.includes(keyword);
      });
    },
    selectedItemLabel() {
      if (!this.selectedItem) return "";
      return this.getItemName(this.selectedItem);
    },
  },
  watch: {
    visible(isVisible) {
      if (isVisible) {
        this.$nextTick(() => {
          this.$refs.searchInput?.focus?.();
        });
        return;
      }
      this.searchQuery = "";
    },
  },
  methods: {
    close() {
      this.$emit("update:visible", false);
    },
    selectItem(itemId) {
      this.$emit("select", itemId);
      this.close();
    },
    clearSearch() {
      this.searchQuery = "";
      this.$nextTick(() => {
        this.$refs.searchInput?.focus?.();
      });
    },
    handleKeydown(event) {
      if (!this.visible) return;
      if (event.key === "Escape") {
        if (this.searchQuery) {
          this.searchQuery = "";
          event.preventDefault();
          return;
        }
        this.close();
      }
    },
  },
  mounted() {
    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeydown);
  },
};
</script>

<style scoped>
.inventory-item-selector {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  padding: 20px;
  box-sizing: border-box;
  overflow: auto;
}

.selector-modal {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  -webkit-backdrop-filter: var(--glass-backdrop-filter);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px var(--glass-shadow-light);
  width: 90%;
  max-width: 600px;
  height: min(80vh, 680px);
  overflow: hidden;
  position: relative;
  margin: auto;
  display: flex;
  flex-direction: column;
}

/* 淡入淡出动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 缩放动画 */
.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* 物品出现动画 */
.item-appear-enter-active,
.item-appear-leave-active {
  transition: all 0.3s ease;
}

.item-appear-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.item-appear-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-10px);
}

.item-appear-move {
  transition: transform 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--glass-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--text-primary);
}

.selector-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 24px 24px;
  flex: 1;
  min-height: 0;
}

.modal-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.search-input-wrap {
  position: relative;
  flex: 1 1 240px;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 36px 10px 36px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  background: var(--glass-bg);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08);
}

.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
}

.clear-search:hover {
  color: var(--text-primary);
}

.toolbar-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.result-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.selected-badge {
  font-size: 12px;
  color: var(--text-primary);
  background: var(--sidebar-active-bg);
  border: 1px solid var(--glass-border);
  padding: 4px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.remove-btn {
  border: 1px solid rgba(255, 59, 48, 0.3);
  background: rgba(255, 59, 48, 0.1);
  color: var(--error-color);
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-size: 12px;
}

.remove-btn:hover {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.5);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  grid-auto-rows: max-content;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
  flex: 1;
  min-height: 0;
  align-content: start;
  align-items: start;
}

.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--glass-bg);
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--glass-shadow-light);
}

.item-card.selected {
  border-color: var(--accent-color);
  background: var(--sidebar-active-bg);
}

.item-image-wrapper {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.item-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.item-name {
  font-size: 12px;
  text-align: center;
  color: var(--text-primary);
  line-height: 1.2;
}

.empty-state {
  padding: 28px 12px;
  text-align: center;
  color: var(--text-secondary);
  border: 1px dashed var(--glass-border);
  border-radius: 12px;
  background: var(--glass-bg);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .selector-modal {
    width: 95%;
    margin: 20px;
  }

  .selector-body {
    padding: 12px 16px 20px;
  }

  .search-input-wrap {
    min-width: 100%;
  }

  .toolbar-meta {
    width: 100%;
    justify-content: space-between;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 12px;
  }

  .item-image-wrapper {
    width: 40px;
    height: 40px;
  }

  .item-image {
    width: 40px;
    height: 40px;
  }
}
</style>
