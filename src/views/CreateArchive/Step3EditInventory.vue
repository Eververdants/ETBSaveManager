<template>
  <div class="step-content" data-step="3">
    <div class="inventory-section">
      <!-- Steam ID 管理 -->
      <div class="steam-id-card">
        <h3 class="form-section-title">
          {{ $t("createArchive.playerManagement") }}
        </h3>
        <div class="steam-id-info">
          <font-awesome-icon :icon="['fas', 'info-circle']" />
          <span>{{ $t("createArchive.steamIdInfo") }}</span>
        </div>
        <div class="steam-id-input-group">
          <input :value="newSteamId" @input="$emit('update:newSteamId', $event.target.value)" type="text"
            class="form-input" :placeholder="$t('createArchive.steamIdPlaceholder')"
            @keyup.enter="$emit('add-steam-id')" />
          <button @click="$emit('add-steam-id')" class="add-button">
            <font-awesome-icon :icon="['fas', 'plus']" />
            {{ $t("createArchive.add") }}
          </button>
        </div>

        <!-- 玩家输入提示信息 -->
        <transition name="message-fade" mode="out-in">
          <div v-if="playerInputMessage" class="player-input-message" :class="playerInputMessageType" key="message">
            <font-awesome-icon :icon="playerInputMessageType === 'success'
              ? ['fas', 'check-circle']
              : ['fas', 'exclamation-circle']
              " />
            {{ playerInputMessage }}
          </div>
        </transition>

        <!-- Steam ID 列表 -->
        <div class="steam-id-list">
          <div v-for="(player, index) in players" :key="index" class="steam-id-item"
            :class="{ active: activePlayerIndex === index }" @click="$emit('select-player', index)">
            <div class="player-info">
              <div class="player-id" :class="{ 'has-username': player.username }">
                <template v-if="player.username">
                  {{ player.username }}
                </template>
                <template v-else>
                  {{ player.steamId }}
                </template>
              </div>
              <div class="username" :class="{ loading: !player.username }">
                <template v-if="!player.username">
                  <div class="loading-spinner"></div>
                  {{ $t("createArchive.loadingUsername") }}
                </template>
              </div>
            </div>
            <button @click.stop="$emit('remove-player', index)" class="remove-button">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
        </div>
      </div>

      <!-- 背包编辑器 -->
      <div class="inventory-card">
        <h3 class="form-section-title">
          <template v-if="activePlayerIndex !== -1 && players[activePlayerIndex]">
            {{
              $t("createArchive.editInventoryFor", {
                playerName:
                  players[activePlayerIndex].username ||
                  players[activePlayerIndex].steamId,
              })
            }}
          </template>
          <template v-else>
            {{ $t("createArchive.editInventory") }}
          </template>
        </h3>
        <div v-if="activePlayerIndex !== -1" class="inventory-grid">
          <!-- 主手和副手位置 -->
          <div class="inventory-column">
            <div v-for="slot in 3" :key="`weapon-${slot - 1}`" class="inventory-slot weapon-slot" :class="{
              'main-hand': slot === 1,
              'off-hand': slot > 1,
              empty: !getSlotContent(activePlayerIndex, slot - 1),
            }" @click="$emit('edit-slot', activePlayerIndex, slot - 1)">
              <div class="slot-label">
                {{ getSlotLabelText(slot - 1) }}
              </div>
              <div class="slot-content">
                <transition name="item-fade" mode="out-in">
                  <img v-if="getSlotContent(activePlayerIndex, slot - 1)" :src="`/icons/ETB_UI/${getItemImageFile(
                    getSlotContent(activePlayerIndex, slot - 1)
                  )}.png`" :alt="getSlotContent(activePlayerIndex, slot - 1)" class="item-image"
                    :key="getSlotContent(activePlayerIndex, slot - 1)" />
                  <font-awesome-icon v-else :icon="['fas', 'hand-paper']" class="slot-icon" key="empty" />
                </transition>
              </div>
            </div>
          </div>

          <!-- 背包格子 -->
          <div class="inventory-backpack">
            <div v-for="slot in 9" :key="`backpack-${slot + 2}`" class="inventory-slot backpack-slot"
              :class="{ empty: !getSlotContent(activePlayerIndex, slot + 2) }"
              @click="$emit('edit-slot', activePlayerIndex, slot + 2)">
              <div class="slot-number">{{ slot }}</div>
              <div class="slot-content">
                <transition name="item-fade" mode="out-in">
                  <img v-if="getSlotContent(activePlayerIndex, slot + 2)" :src="`/icons/ETB_UI/${getItemImageFile(
                    getSlotContent(activePlayerIndex, slot + 2)
                  )}.png`" :alt="getSlotContent(activePlayerIndex, slot + 2)" class="item-image"
                    :key="getSlotContent(activePlayerIndex, slot + 2)" />
                  <font-awesome-icon v-else :icon="['fas', 'square']" class="slot-icon" key="empty" />
                </transition>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-inventory-message">
          <font-awesome-icon :icon="['fas', 'info-circle']" />
          <p>{{ $t("createArchive.selectPlayerMessage") }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from "vue-i18n";

export default {
  name: "Step3EditInventory",
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
  ],
  methods: {
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
.inventory-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 4px;
}

.steam-id-card,
.inventory-card {
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
}

.steam-id-card::before,
.inventory-card::before {
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

.steam-id-card:hover,
.inventory-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
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

.steam-id-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg,
      rgba(var(--accent-color-rgb), 0.12) 0%,
      rgba(var(--accent-color-rgb), 0.06) 100%);
  border-radius: 12px;
  color: var(--accent-color);
  font-size: 13px;
  margin-bottom: 18px;
  border: 1px solid rgba(var(--accent-color-rgb), 0.15);
}

.steam-id-input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.form-input {
  flex: 1;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(145deg,
      var(--bg-tertiary) 0%,
      var(--bg-secondary) 100%);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.form-input:hover {
  border-color: rgba(var(--accent-color-rgb), 0.3);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15),
    inset 0 1px 2px rgba(0, 0, 0, 0.05);
  background: var(--bg-tertiary);
}

.form-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 22px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg,
      var(--accent-color) 0%,
      var(--accent-hover) 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.3);
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--accent-color-rgb), 0.4);
}

.add-button:active {
  transform: translateY(0);
}

/* 玩家输入提示 */
.player-input-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

.player-input-message.success {
  background: rgba(var(--success-color-rgb), 0.1);
  color: var(--success-color);
}

.player-input-message.error {
  background: rgba(255, 59, 48, 0.1);
  color: var(--error-color);
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Steam ID 列表 */
.steam-id-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.steam-id-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(145deg,
      var(--bg-tertiary) 0%,
      var(--bg-secondary) 100%);
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.steam-id-item:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
  border-color: rgba(var(--accent-color-rgb), 0.2);
}

.steam-id-item.active {
  border-color: var(--accent-color);
  background: linear-gradient(145deg,
      rgba(var(--accent-color-rgb), 0.12) 0%,
      rgba(var(--accent-color-rgb), 0.06) 100%);
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.15);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-id {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.player-id.has-username {
  font-size: 15px;
}

.username {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.username.loading {
  color: var(--text-tertiary);
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--divider-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.remove-button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 59, 48, 0.1);
  color: var(--error-color);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-button:hover {
  background: rgba(255, 59, 48, 0.2);
}

/* 背包网格 */
.inventory-grid {
  display: flex;
  gap: 20px;
}

.inventory-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inventory-backpack {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
}

.inventory-slot {
  aspect-ratio: 1;
  background: linear-gradient(145deg,
      var(--bg-tertiary) 0%,
      var(--bg-secondary) 100%);
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 70px;
  min-height: 70px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.inventory-slot:hover {
  border-color: var(--accent-color);
  background: var(--bg-hover);
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(var(--accent-color-rgb), 0.15);
}

.inventory-slot.empty {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.12);
}

.inventory-slot.empty:hover {
  border-style: solid;
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

.slot-number {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 10px;
  color: var(--text-tertiary);
}

.slot-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.slot-icon {
  font-size: 24px;
  color: var(--text-tertiary);
}

.item-fade-enter-active,
.item-fade-leave-active {
  transition: all 0.2s ease;
}

.item-fade-enter-from,
.item-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 空背包提示 */
.empty-inventory-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-tertiary);
  text-align: center;
  gap: 12px;
}

.empty-inventory-message svg {
  font-size: 32px;
}

.empty-inventory-message p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .inventory-section {
    grid-template-columns: 1fr;
  }

  .inventory-grid {
    flex-direction: column;
  }

  .inventory-column {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
