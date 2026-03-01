<template>
  <div class="player-list-section" :class="{ embedded }">
    <div v-if="showHeader" class="section-title">
      <span>{{ title }}</span>
      <span v-if="showCount" class="count-badge">{{ players.length }}</span>
    </div>

    <div class="player-list" v-if="players.length > 0">
      <div
        v-for="(player, index) in players"
        :key="index"
        class="player-item"
        :class="{ active: activePlayerIndex === index }"
        @click="$emit('select-player', index)"
      >
        <div class="player-avatar">
          <font-awesome-icon :icon="['fas', 'user']" />
        </div>
        <div class="player-info">
          <span class="player-name">
            {{
              player.username ||
              (player.isOfflinePlayer ? `${player.steamId}(本地)` : player.steamId)
            }}
          </span>
          <span
            v-if="showSanity"
            class="sanity-tag"
            :class="getSanityClass(player.sanity ?? 100)"
          >
            {{ player.sanity ?? 100 }}%
          </span>
        </div>
        <button class="del-btn" @click.stop="$emit('remove-player', index)">
          <font-awesome-icon :icon="['fas', 'trash']" />
        </button>
      </div>
    </div>
    <div class="empty-hint" v-else>
      <font-awesome-icon :icon="['fas', 'user-plus']" />
      <p>{{ emptyHint }}</p>
    </div>

    <div class="add-player-row">
      <input
        :value="newSteamId"
        type="text"
        class="form-input"
        :placeholder="steamIdPlaceholder"
        @input="$emit('update:newSteamId', $event.target.value)"
        @keyup.enter="$emit('add-steam-id')"
      />
      <button class="add-btn" @click="$emit('add-steam-id')">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </button>
    </div>

    <transition name="fade">
      <div
        v-if="playerInputMessage"
        class="msg-tip"
        :class="playerInputMessageType"
      >
        {{ playerInputMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  players: {
    type: Array,
    default: () => [],
  },
  activePlayerIndex: {
    type: Number,
    default: -1,
  },
  newSteamId: {
    type: String,
    default: "",
  },
  playerInputMessage: {
    type: String,
    default: "",
  },
  playerInputMessageType: {
    type: String,
    default: "",
  },
  titleKey: {
    type: String,
    default: "editArchive.playerManagement",
  },
  emptyHintKey: {
    type: String,
    default: "editArchive.noPlayersHint",
  },
  steamIdPlaceholderKey: {
    type: String,
    default: "editArchive.steamIdPlaceholder",
  },
  showSanity: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showCount: {
    type: Boolean,
    default: true,
  },
});

defineEmits(["update:newSteamId", "add-steam-id", "remove-player", "select-player"]);

const { t } = useI18n({ useScope: "global" });

const title = computed(() => t(props.titleKey));
const emptyHint = computed(() => t(props.emptyHintKey));
const steamIdPlaceholder = computed(() => t(props.steamIdPlaceholderKey));

const getSanityClass = (val) => {
  if (val >= 80) return "sanity-high";
  if (val >= 50) return "sanity-medium";
  if (val >= 20) return "sanity-low";
  return "sanity-critical";
};
</script>

<style scoped>
.player-list-section {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.player-list-section.embedded {
  background: transparent;
  border: none;
  border-radius: 0;
  overflow: visible;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.count-badge {
  margin-left: auto;
  background: var(--primary);
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.player-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.player-item:hover {
  background: var(--hover-bg);
}

.player-item.active {
  background: rgba(0, 122, 255, 0.1);
  outline: 2px solid var(--primary);
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(0, 122, 255, 0.12);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.player-name {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sanity-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;
}

.sanity-high {
  background: rgba(34, 197, 94, 0.12);
  color: var(--success-color);
}

.sanity-medium {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warning-color);
}

.sanity-low {
  background: rgba(239, 68, 68, 0.12);
  color: var(--error-color);
}

.sanity-critical {
  background: rgba(239, 68, 68, 0.2);
  color: var(--error-color);
}

.del-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: rgba(239, 68, 68, 0.12);
  color: var(--error-color);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.del-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.empty-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: var(--text-tertiary);
  text-align: center;
}

.add-player-row {
  display: flex;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.form-input {
  flex: 1;
  padding: 12px 14px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
}

.add-btn {
  width: 44px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: white;
  cursor: pointer;
}

.msg-tip {
  padding: 10px 16px;
  margin: 0 16px 16px;
  border-radius: 10px;
  font-size: 13px;
}

.msg-tip.success {
  background: rgba(34, 197, 94, 0.12);
  color: var(--success-color);
}

.msg-tip.error {
  background: rgba(239, 68, 68, 0.12);
  color: var(--error-color);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
