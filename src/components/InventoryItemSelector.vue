<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div v-if="visible" class="inventory-item-selector" @click.self="close">
        <Transition name="modal-scale" appear>
          <div class="selector-modal">
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

            <div class="items-grid">
              <TransitionGroup name="item-appear" appear>
                <div
                  v-for="item in availableItems"
                  :key="item.id"
                  class="item-card"
                  :class="{ selected: selectedItem === item.id }"
                  @click="selectItem(item.id)"
                >
                  <LazyImage
                    :src="`/icons/ETB_UI/${item.image}`"
                    :alt="$t(`inventory.items.${item.id}`)"
                    image-class="item-image"
                  />
                  <span class="item-name">{{
                    $t(`inventory.items.${item.id}`)
                  }}</span>
                </div>

                <div
                  key="remove"
                  class="item-card remove-card"
                  @click="selectItem(null)"
                >
                  <div class="remove-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <span class="item-name">{{
                    $t("inventory.removeItem")
                  }}</span>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import LazyImage from "./LazyImage.vue";

export default {
  name: "InventoryItemSelector",
  components: {
    LazyImage,
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
  },
  methods: {
    close() {
      this.$emit("update:visible", false);
    },
    selectItem(itemId) {
      this.$emit("select", itemId);
      this.close();
    },
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
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  margin: auto;
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

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
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

.item-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 12px;
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

.remove-card {
  background: rgba(255, 59, 48, 0.1);
  border-color: rgba(255, 59, 48, 0.2);
}

.remove-card:hover {
  background: rgba(255, 59, 48, 0.2);
}

.remove-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: var(--error-color);
}

@media (max-width: 768px) {
  .selector-modal {
    width: 95%;
    margin: 20px;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 12px;
    padding: 16px;
  }

  .item-image {
    width: 40px;
    height: 40px;
  }
}
</style>
