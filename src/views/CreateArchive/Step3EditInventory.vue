<template>
  <div class="step-content" data-step="3">
    <div class="players-layout">
      <PlayerManager
        :players="players"
        :active-player-index="activePlayerIndex"
        :new-steam-id="newSteamId"
        :player-input-message="playerInputMessage"
        :player-input-message-type="playerInputMessageType"
        title-key="createArchive.playerManagement"
        empty-hint-key="createArchive.noPlayersHint"
        steam-id-placeholder-key="createArchive.steamIdPlaceholder"
        :show-sanity="true"
        @update:newSteamId="$emit('update:newSteamId', $event)"
        @add-steam-id="$emit('add-steam-id')"
        @remove-player="$emit('remove-player', $event)"
        @select-player="$emit('select-player', $event)"
      />

      <div class="player-detail-section" v-if="activePlayerIndex !== -1 && players[activePlayerIndex]">
        <div class="detail-header">
          <span>
            {{
              players[activePlayerIndex].username ||
              (players[activePlayerIndex].isOfflinePlayer
                ? `${players[activePlayerIndex].steamId}(本地)`
                : players[activePlayerIndex].steamId)
            }}
          </span>
        </div>

        <div class="detail-grid">
          <div class="detail-block">
            <div class="block-title">
              <font-awesome-icon :icon="['fas', 'brain']" />
              {{ $t("editArchive.playerSanity") }}
            </div>
            <div class="sanity-display">
              <span class="sanity-num" :class="getSanityClass(currentPlayerSanity)">
                {{ currentPlayerSanity }}%
              </span>
              <div class="sanity-bar">
                <div
                  class="sanity-fill"
                  :style="{ width: currentPlayerSanity + '%' }"
                  :class="getSanityClass(currentPlayerSanity)"
                ></div>
              </div>
            </div>
            <div class="sanity-ctrl">
              <div class="sanity-slider-wrap">
                <CustomSlider v-model="currentPlayerSanity" :min="0" :max="100" :step="1" />
              </div>
              <div class="quick-btns">
                <button class="qbtn danger" @click="setMinSanity()">
                  <font-awesome-icon :icon="['fas', 'skull']" />
                </button>
                <button class="qbtn success" @click="setMaxSanity()">
                  <font-awesome-icon :icon="['fas', 'heart']" />
                </button>
              </div>
            </div>
          </div>

          <div class="detail-block">
            <div class="block-title">
              <font-awesome-icon :icon="['fas', 'suitcase']" />
              {{ $t("editArchive.inventory") }}
            </div>
            <div class="inventory-wrap">
              <div class="hand-slots">
                <div
                  v-for="slot in 3"
                  :key="`h-${slot}`"
                  class="inv-slot hand-slot"
                  :class="{ empty: !getSlotContent(activePlayerIndex, slot - 1) }"
                  @click="$emit('edit-slot', activePlayerIndex, slot - 1)"
                >
                  <span class="slot-label">{{ getSlotLabelText(slot - 1) }}</span>
                  <img
                    v-if="getSlotContent(activePlayerIndex, slot - 1)"
                    :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(activePlayerIndex, slot - 1))}.png`"
                    class="slot-img"
                    :alt="getSlotContent(activePlayerIndex, slot - 1)"
                  />
                  <font-awesome-icon v-else :icon="['fas', 'hand-paper']" class="slot-placeholder" />
                </div>
              </div>

              <div class="backpack-slots">
                <div
                  v-for="slot in 9"
                  :key="`b-${slot}`"
                  class="inv-slot backpack-slot"
                  :class="{ empty: !getSlotContent(activePlayerIndex, slot + 2) }"
                  @click="$emit('edit-slot', activePlayerIndex, slot + 2)"
                >
                  <span class="slot-num">{{ slot }}</span>
                  <img
                    v-if="getSlotContent(activePlayerIndex, slot + 2)"
                    :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(activePlayerIndex, slot + 2))}.png`"
                    class="slot-img"
                    :alt="getSlotContent(activePlayerIndex, slot + 2)"
                  />
                  <font-awesome-icon v-else :icon="['fas', 'cube']" class="slot-placeholder" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="player-detail-section empty-detail" v-else>
        <font-awesome-icon :icon="['fas', 'hand-pointer']" />
        <p>
          {{
            players.length > 0
              ? $t("editArchive.selectPlayerHint")
              : $t("editArchive.addPlayerFirst")
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from "vue-i18n";
import PlayerManager from "@/components/PlayerManager.vue";
import CustomSlider from "@/components/CustomSlider.vue";

export default {
  name: "Step3EditInventory",
  components: {
    PlayerManager,
    CustomSlider,
  },
  setup() {
    const { t, te } = useI18n();

    const getSlotLabelText = (slotIndex) => {
      const labels = ["mainHand", "offHand1", "offHand2"];
      const label = labels[slotIndex] || "";
      const translationKey = `createArchive.${label}`;
      return te(translationKey) ? t(translationKey) : label;
    };

    return {
      getSlotLabelText,
    };
  },
  data() {
    return {
      currentPlayerSanity: 100,
    };
  },
  props: {
    newSteamId: {
      type: String,
      default: "",
    },
    players: {
      type: Array,
      default: () => [],
    },
    activePlayerIndex: {
      type: Number,
      default: -1,
    },
    playerInputMessage: {
      type: String,
      default: "",
    },
    playerInputMessageType: {
      type: String,
      default: "",
    },
  },
  emits: [
    "update:newSteamId",
    "add-steam-id",
    "remove-player",
    "select-player",
    "edit-slot",
    "update-player-sanity",
  ],
  watch: {
    activePlayerIndex: {
      immediate: true,
      handler(newIndex) {
        if (newIndex === -1) return;
        const player = this.players?.[newIndex];
        this.currentPlayerSanity = player?.sanity ?? 100;
      },
    },
    currentPlayerSanity(newVal) {
      if (this.activePlayerIndex === -1) return;
      this.$emit("update-player-sanity", {
        playerIndex: this.activePlayerIndex,
        sanity: newVal,
      });
    },
  },
  methods: {
    getSanityClass(val) {
      if (val >= 80) return "sanity-high";
      if (val >= 50) return "sanity-medium";
      if (val >= 20) return "sanity-low";
      return "sanity-critical";
    },
    setMinSanity() {
      this.currentPlayerSanity = 0;
    },
    setMaxSanity() {
      this.currentPlayerSanity = 100;
    },
    getSlotContent(playerIndex, slotIndex) {
      if (this.players[playerIndex] && this.players[playerIndex].inventory) {
        return this.players[playerIndex].inventory[slotIndex];
      }
      return null;
    },
    getItemImageFile(itemName) {
      if (!itemName || itemName === "None" || itemName === null) return "None";
      if (itemName === "Toy") return "Teddy_Bear";
      return itemName;
    },
    getSlotLabel(slotIndex) {
      const labels = ["mainHand", "offHand1", "offHand2"];
      return labels[slotIndex] || "";
    },
  },
};
</script>

<style scoped>
/* 背包编辑区域 */
.step-content {
  height: 100%;
  min-height: 0;
}

.players-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  padding: 4px;
  min-height: 0;
  height: 100%;
  align-items: stretch;
}

:deep(.player-list-section) {
  height: 100%;
  min-height: 0;
}

.player-detail-section {
  background: linear-gradient(145deg,
      var(--bg-secondary) 0%,
      var(--bg-tertiary) 100%);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  transition: all 0.3s ease;
  min-height: 0;
  overflow-y: auto;
}

.player-detail-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent);
  pointer-events: none;
}

.player-detail-section:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.player-detail-section.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-tertiary);
  text-align: center;
  gap: 12px;
}

.player-detail-section.empty-detail svg {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.4;
}

.player-detail-section.empty-detail p {
  font-size: 13px;
  margin: 0;
}

.form-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 18px 0;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-section-title::before {
  content: "";
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg,
      var(--accent-color),
      rgba(var(--accent-color-rgb), 0.5));
  border-radius: 2px;
}

.detail-header {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.detail-block {
  background: linear-gradient(145deg,
      var(--bg-tertiary) 0%,
      var(--bg-secondary) 100%);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.block-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-weight: 700;
  font-size: 13px;
  color: var(--text-primary);
}

.sanity-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sanity-num {
  font-weight: 800;
  min-width: 52px;
  text-align: right;
}

.sanity-bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.sanity-fill {
  height: 100%;
  transition: width 0.2s ease;
}

.sanity-ctrl {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.sanity-slider-wrap {
  flex: 1;
  min-width: 0;
}

:deep(.sanity-slider-wrap .custom-slider) {
  padding: 14px 0 10px;
  margin-top: 4px;
}

:deep(.sanity-slider-wrap .slider-labels) {
  margin-top: 6px;
}

.quick-btns {
  display: flex;
  gap: 8px;
}

.qbtn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.qbtn.danger {
  background: rgba(239, 68, 68, 0.9);
}

.qbtn.success {
  background: rgba(34, 197, 94, 0.9);
}

.sanity-high {
  color: var(--success-color);
}

.sanity-medium {
  color: var(--warning-color);
}

.sanity-low,
.sanity-critical {
  color: var(--error-color);
}

.sanity-fill.sanity-high {
  background: rgba(34, 197, 94, 0.85);
}

.sanity-fill.sanity-medium {
  background: rgba(245, 158, 11, 0.85);
}

.sanity-fill.sanity-low,
.sanity-fill.sanity-critical {
  background: rgba(239, 68, 68, 0.85);
}

.inventory-wrap {
  display: flex;
  gap: 14px;
}

.hand-slots {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.backpack-slots {
  display: grid;
  grid-template-columns: repeat(3, 56px);
  gap: 10px;
  flex: 1;
  justify-content: start;
  align-content: start;
}

.inv-slot {
  position: relative;
  aspect-ratio: 1;
  min-width: 56px;
  min-height: 56px;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(145deg,
      var(--bg-tertiary) 0%,
      var(--bg-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.inv-slot.backpack-slot {
  width: 56px;
  height: 56px;
  min-width: 56px;
  min-height: 56px;
  aspect-ratio: auto;
  border-radius: 14px;
}

.inv-slot:hover {
  border-color: rgba(var(--accent-color-rgb), 0.35);
  transform: scale(1.03);
}

.inv-slot.empty {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.12);
}

.slot-label {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.slot-num {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 10px;
  color: var(--text-tertiary);
}

.slot-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.inv-slot.backpack-slot .slot-img {
  width: 40px;
  height: 40px;
}

.slot-placeholder {
  font-size: 20px;
  color: var(--text-tertiary);
}

.inv-slot.backpack-slot .slot-placeholder {
  font-size: 20px;
}

@media (max-width: 768px) {
  .players-layout {
    grid-template-columns: 1fr;
  }

  .inventory-wrap {
    flex-direction: column;
  }

  .hand-slots {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
