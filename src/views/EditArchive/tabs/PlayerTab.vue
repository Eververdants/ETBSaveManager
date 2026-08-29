<template>
  <div class="players-layout">
    <!-- Player list -->
    <PlayerManager
      :players="players"
      :active-player-index="activePlayerIndex"
      :new-steam-id="newSteamId"
      :player-input-message="playerInputMessage"
      :player-input-message-type="playerInputMessageType"
      :show-sanity="true"
      @update:new-steam-id="$emit('update:newSteamId', $event)"
      @add-steam-id="$emit('add-steam-id')"
      @remove-player="$emit('remove-player', $event)"
      @select-player="$emit('select-player', $event)"
    />

    <!-- Player details -->
    <div v-if="activePlayerIndex !== -1 && players.length > 0" class="player-detail-section">
      <div class="detail-header">
        <Transition name="player-name-switch" mode="out-in">
          <span :key="activePlayerIndex">{{ getCurrentPlayerDisplayName() }}</span>
        </Transition>
      </div>

      <!-- Steam ID 编辑 -->
      <div class="steamid-edit-row">
        <span class="steamid-label">
          <font-awesome-icon :icon="['fab', 'steam']" />
          {{ $t("common.steamId") }}
        </span>
        <input
          v-model="currentPlayerSteamId"
          type="text"
          class="steamid-input"
          @blur="onSteamIdBlur"
          @keyup.enter="onSteamIdBlur"
        />
      </div>

      <Transition name="player-detail-grid-switch" mode="out-in">
        <PlayerDetailPanel
          :key="activePlayerIndex"
          :player="players[activePlayerIndex]"
          slot-label-prefix="editArchive"
          @edit-slot="(slotIndex) => $emit('edit-slot', activePlayerIndex, slotIndex)"
          @sanity-change="(sanity) => $emit('sanity-change', { playerIndex: activePlayerIndex, sanity })"
        />
      </Transition>
    </div>

    <div v-else class="player-detail-section empty-detail">
      <font-awesome-icon :icon="['fas', 'hand-pointer']" />
      <p>{{ players.length > 0 ? $t("editArchive.selectPlayerHint") : $t("editArchive.addPlayerFirst") }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import PlayerManager from "@/components/system/PlayerManager.vue";
import PlayerDetailPanel from "@/components/player/PlayerDetailPanel.vue";

const props = defineProps({
  players: { type: Array, default: () => [] },
  activePlayerIndex: { type: Number, default: -1 },
  newSteamId: { type: String, default: "" },
  playerInputMessage: { type: String, default: "" },
  playerInputMessageType: { type: String, default: "" },
});

const emit = defineEmits([
  "update:newSteamId",
  "add-steam-id",
  "remove-player",
  "select-player",
  "edit-slot",
  "sanity-change",
  "steam-id-change",
]);

const { t } = useI18n({ useScope: "global" });

const currentPlayerSteamId = ref("");

// Keep the inline editor in sync when the selection changes
watch(
  () => props.activePlayerIndex,
  (index) => {
    currentPlayerSteamId.value = props.players[index]?.steamId ?? "";
  },
  { immediate: true },
);

const getCurrentPlayerDisplayName = () => {
  const player = props.players[props.activePlayerIndex];
  if (!player) return "";
  return player.username || t("common.playerNameDisplay", { id: player.steamId });
};

const onSteamIdBlur = () => {
  const player = props.players[props.activePlayerIndex];
  if (!player) return;
  const val = currentPlayerSteamId.value.trim();
  if (val && /^\d+$/.test(val)) {
    emit("steam-id-change", { playerIndex: props.activePlayerIndex, steamId: val });
  } else {
    currentPlayerSteamId.value = player.steamId;
  }
};
</script>

<style scoped>
.players-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  position: relative;
}

/* Right panel - Player details with visual emphasis */
.player-detail-section {
  background: linear-gradient(145deg, var(--card-bg) 0%, var(--bg-secondary) 100%);
  border-radius: var(--radius-card);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  position: relative;
}

/* Add subtle gradient overlay for active state */
.player-detail-section::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--accent-color));
  opacity: 0;
  transition: opacity var(--transition-normal) var(--ease-default);
}

.player-detail-section:not(.empty-detail)::after {
  opacity: 1;
}

.player-name-switch-enter-active,
.player-name-switch-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.player-name-switch-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.player-name-switch-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.player-detail-grid-switch-enter-active,
.player-detail-grid-switch-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.player-detail-grid-switch-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.player-detail-grid-switch-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.player-detail-section {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.player-detail-section.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  padding: 40px 20px;
}

.player-detail-section.empty-detail svg {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.35;
  color: var(--primary);
}

.player-detail-section.empty-detail p {
  font-size: 14px;
  margin: 0;
  text-align: center;
  line-height: 1.6;
}

.steamid-edit-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal) var(--ease-default);
}

.steamid-edit-row:hover {
  border-color: color-mix(in srgb, var(--primary) 15%, transparent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.steamid-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.steamid-label svg {
  color: var(--primary);
  font-size: 16px;
}

.steamid-input {
  flex: 1;
  padding: 10px 14px;
  font-size: 13px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-input);
  background: var(--card-bg);
  color: var(--text-primary);
  outline: none;
  font-family: "SF Mono", "Consolas", monospace;
  letter-spacing: 0.5px;
  transition: all var(--transition-normal) var(--ease-default);
}

.steamid-input:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 8%, transparent);
}

.steamid-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
  background: linear-gradient(135deg, var(--card-bg) 0%, color-mix(in srgb, var(--primary) 3%, var(--card-bg)) 100%);
}

.detail-header {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 2px solid var(--border-color);
  position: relative;
}

.detail-header::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, var(--primary), var(--accent-color));
  border-radius: var(--radius-pill);
}

@media (max-width: 900px) {
  .players-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
