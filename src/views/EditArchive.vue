<template>
  <div v-if="parseError" class="edit-archive-container">
    <div class="error-state">
      <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="error-icon" />
      <h2 class="error-title">{{ $t("editArchive.parseFailed") }}</h2>
      <p class="error-desc">{{ $t("editArchive.parseFailed") }}</p>
      <button class="btn-primary" @click="closeEdit">
        <font-awesome-icon :icon="['fas', 'home']" />
        Return to Home
      </button>
    </div>
  </div>
  <div v-else class="edit-archive-container">
    <!-- Top title bar + tab navigation -->
    <div class="page-header">
      <h1 class="page-title">{{ $t("editArchive.title") }}</h1>

      <div class="tab-nav">
        <div class="tab-highlight" :style="highlightStyle"></div>
        <button
          v-for="(tab, index) in tabs"
          :key="tab.id"
          :ref="(el) => (tabRefs[index] = el)"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id, index)"
        >
          <font-awesome-icon :icon="tab.icon" />
          <span>{{ $t(tab.label) }}</span>
        </button>
      </div>

      <div class="header-actions">
        <button class="btn-secondary" @click="closeEdit">
          <font-awesome-icon :icon="['fas', 'times']" />
          {{ $t("common.cancel") }}
        </button>
        <button class="btn-primary" :disabled="isSaving" @click="handleSaveArchive">
          <font-awesome-icon v-if="!isSaving" :icon="['fas', 'save']" />
          <span v-else class="save-spinner"></span>
          {{ isSaving ? $t("editArchive.saving") : $t("common.save") }}
        </button>
      </div>
    </div>

    <!-- Content area -->
    <div class="tab-content" :class="`slide-${slideDirection}`">
      <!-- Basic settings -->
      <div class="tab-panel" :class="{ 'tab-active': activeTab === 'basic' }">
        <div class="basic-sections">
          <ArchiveNameCard
            v-model="formData.name"
            :title="t('editArchive.basicInfo')"
            :label="t('editArchive.archiveName')"
            :placeholder="t('editArchive.archiveNamePlaceholder')"
          />

          <DifficultySelector
            v-model:archive-difficulty="formData.archiveDifficulty"
            v-model:actual-difficulty="formData.actualDifficulty"
            i18n-prefix="editArchive"
            :title="t('editArchive.difficulty')"
          />

          <!-- Quick Action -->
          <button type="button" class="settings-card action-card" @click="unlockAllHubDoors">
            <div class="action-card-body">
              <div class="action-card-info">
                <span class="action-card-title">
                  <font-awesome-icon :icon="['fas', 'door-open']" />
                  {{ $t("editArchive.unlockAllHubDoors") }}
                </span>
                <span class="action-card-desc">{{ $t("editArchive.hubDoors") }}</span>
              </div>
              <span class="action-card-arrow">
                <font-awesome-icon :icon="['fas', 'chevron-right']" />
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Level selection -->
      <div class="tab-panel" :class="{ 'tab-active': activeTab === 'level' }">
        <div class="level-selector">
          <LevelPicker
            v-model:active-group="selectedLevelGroup"
            :groups="levelGroups"
            :selected-key="formData.currentLevel"
            :search-placeholder="t('editArchive.levelSearchPlaceholder')"
            :empty-text="t('editArchive.levelSearchEmpty')"
            :badge-text="t('editArchive.unlockMainBadge')"
            @select="(card) => (formData.currentLevel = card.levelKey)"
          />
        </div>
      </div>

      <!-- Player management -->
      <div class="tab-panel" :class="{ 'tab-active': activeTab === 'players' }">
        <div class="players-layout">
          <!-- Player list -->
          <PlayerManager
            :players="formData.players"
            :active-player-index="activePlayerIndex"
            :new-steam-id="newSteamId"
            :player-input-message="playerInputMessage"
            :player-input-message-type="playerInputMessageType"
            :show-sanity="true"
            @update:new-steam-id="(val) => (newSteamId = val)"
            @add-steam-id="addPlayer"
            @remove-player="removePlayer"
            @select-player="selectPlayer"
          />

          <!-- Player details -->
          <div v-if="activePlayerIndex !== -1 && formData.players.length > 0" class="player-detail-section">
            <div class="detail-header">
              <Transition name="player-name-switch" mode="out-in">
                <span :key="activePlayerIndex">{{ getCurrentPlayerDisplayName() }}</span>
              </Transition>
            </div>

            <!-- Steam ID 锟洁辑 -->
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
                :player="formData.players[activePlayerIndex]"
                slot-label-prefix="editArchive"
                @edit-slot="(slotIndex) => editSlot(activePlayerIndex, slotIndex)"
                @sanity-change="onSanityChange"
              />
            </Transition>
          </div>

          <div v-else class="player-detail-section empty-detail">
            <font-awesome-icon :icon="['fas', 'hand-pointer']" />
            <p>
              {{ formData.players.length > 0 ? $t("editArchive.selectPlayerHint") : $t("editArchive.addPlayerFirst") }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Item selector -->
    <InventoryItemSelector
      :visible="showItemSelector"
      :selected-item="selectedItem"
      @select="handleItemSelect"
      @update:visible="showItemSelector = $event"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import InventoryItemSelector from "../components/feature/InventoryItemSelector.vue";
import PlayerManager from "../components/system/PlayerManager.vue";
import PlayerDetailPanel from "../components/player/PlayerDetailPanel.vue";
import LevelPicker from "../components/archive/LevelPicker.vue";
import ArchiveNameCard from "../components/archive/ArchiveNameCard.vue";
import DifficultySelector from "../components/archive/DifficultySelector.vue";
import { notify } from "../services/notificationService";
import { editArchiveDataStore } from "../composables/useArchiveActions";
import { formatDifficulty } from "../utils/archiveCreationUtils";
import { stripSteamIdSuffix } from "../utils/steamIdUtils";
import { getItemIdByName } from "../utils/itemIdMap";
import { getLevelImage } from "../utils/levelUtils";
import { FEATURES } from "@/config/features";
import { ENDING_LEVELS, ENDINGS_CONFIG } from "@/data/endingsData";

const props = defineProps({
  archiveData: { type: String, default: "" },
});

const { t, te, locale } = useI18n({ useScope: "global" });

// Cross-locale name lookup so typing "Ocean Map" finds the level even in zh-CN
const _enNames = ref({});
const _zhNames = ref({});
import("@/i18n/locales/en-US/LevelName_Display.json")
  .then((m) => (_enNames.value = m.default))
  .catch(() => {});
import("@/i18n/locales/zh-CN/LevelName_Display.json")
  .then((m) => (_zhNames.value = m.default))
  .catch(() => {});
const altName = (k) => (locale.value === "en-US" ? _zhNames.value[k] : _enNames.value[k]) || "";
const router = useRouter();

const getLevelName = (levelKey) => {
  const translationKey = `LevelName_Display.${levelKey}`;
  return te(translationKey) ? t(translationKey) : levelKey;
};

// Tab configuration
const tabs = [
  { id: "basic", label: "editArchive.tabs.basic", icon: ["fas", "cog"] },
  { id: "level", label: "editArchive.tabs.level", icon: ["fas", "map"] },
  { id: "players", label: "editArchive.tabs.players", icon: ["fas", "users"] },
];
const activeTab = ref("basic");
const tabRefs = ref([]);
const highlightStyle = ref({});

// Switch tabs
const currentTabIndex = ref(0);
const slideDirection = ref("right");

const switchTab = (tabId, index) => {
  slideDirection.value = index > currentTabIndex.value ? "right" : "left";
  currentTabIndex.value = index;
  activeTab.value = tabId;
  updateHighlight(index);
};

// Update highlight position
const updateHighlight = (index) => {
  nextTick(() => {
    const btn = tabRefs.value[index];
    if (btn) {
      highlightStyle.value = {
        width: `${btn.offsetWidth}px`,
        transform: `translateX(${btn.offsetLeft - 6}px)`,
      };
    }
  });
};

// Initialize highlight position
const initHighlight = () => {
  const index = tabs.findIndex((t) => t.id === activeTab.value);
  if (index !== -1) updateHighlight(index);
};

// Form data
const formData = reactive({
  name: "",
  currentLevel: "Level0",
  gameMode: "multiplayer",
  archiveDifficulty: "normal",
  actualDifficulty: "normal",
  players: [],
});

const originalArchive = ref(null);
const newSteamId = ref("");
const activePlayerIndex = ref(-1);
const showItemSelector = ref(false);
const editingSlot = ref({ playerIndex: -1, slotIndex: -1 });
const selectedItem = computed(() => {
  const { playerIndex, slotIndex } = editingSlot.value;
  const item = formData.players?.[playerIndex]?.inventory?.[slotIndex];
  if (!item || item === "None") return null;
  return item;
});
const playerInputMessage = ref("");
const playerInputMessageType = ref("");
const currentPlayerSteamId = ref("");
const parseError = ref(false);
const availableLevels = ref([]);
const isSaving = ref(false);

// Save immediately — no confirmation dialog
const handleSaveArchive = () => {
  confirmSaveArchive();
};

// Confirm and execute save
const confirmSaveArchive = async () => {
  try {
    isSaving.value = true;

    if (!originalArchive.value) return;

    const playerInventory = {};
    const playerSanity = {};

    formData.players.forEach((player) => {
      // 锟斤拷锟矫存档原始锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷戏锟斤拷锟缴碉拷 UniqueNetId 锟斤拷缀锟斤拷锟斤拷id 锟斤拷锟矫伙拷锟侥癸拷锟斤拷锟剿回达拷 id
      const originalBase = player.originalSteamId ? stripSteamIdSuffix(player.originalSteamId).split("-")[0] : "";
      const steamId =
        player.originalSteamId && originalBase === player.steamId.trim()
          ? player.originalSteamId
          : player.steamId.trim();
      playerInventory[steamId] = player.inventory.map((itemId) => ({
        item: { id: getItemIdByName(itemId) },
      }));
      playerSanity[steamId] = player.sanity ?? 100;
    });

    const saveData = {
      path: originalArchive.value.path,
      name: formData.name,
      mode: "Multiplayer",
      currentLevel: formData.currentLevel,
      difficulty: formatDifficulty(formData.archiveDifficulty),
      actualDifficulty: formatDifficulty(
        FEATURES.MERGE_DIFFICULTY ? formData.archiveDifficulty : formData.actualDifficulty,
      ),
      playerInventory,
      playerSanity,
    };

    const outputDir = (await invoke("get_local_appdata")) + "\\EscapeTheBackrooms\\Saved\\SaveGames";
    await invoke("handle_edit_save", {
      jsonInput: { saveData: { jsonData: saveData, outputDir } },
    });

    notify.success(t("editArchive.saveSuccess"));
    router.push({ name: "Home" });
  } catch (error) {
    const errorMsg = error?.message || String(error);
    console.error("Save failed:", error);

    if (
      errorMsg.includes("锟杰撅拷锟斤拷锟斤拷") ||
      errorMsg.includes("Access is denied") ||
      errorMsg.includes("os error 5")
    ) {
      notify.error(t("editArchive.saveErrorAccessDenied"));
    } else if (errorMsg.includes("锟斤拷锟斤拷使锟斤拷") || errorMsg.includes("being used")) {
      notify.error(t("editArchive.saveErrorFileInUse"));
    } else {
      notify.error(t("editArchive.saveError", { error: errorMsg }));
    }
  } finally {
    isSaving.value = false;
  }
};

// Initialize
const initArchiveData = () => {
  try {
    if (props.archiveData) {
      let data;

      // Try lookup from editArchiveDataStore first (key-based)
      const stored = editArchiveDataStore.get("current");
      if (stored) {
        try {
          data = JSON.parse(stored);
        } catch (e) {
          console.error("锟斤拷锟斤拷锟芥档锟斤拷锟斤拷失锟斤拷:", e);
        }
        // Clean up store entry
        editArchiveDataStore.delete("current");
      }

      // If store lookup failed, try direct JSON parse (backward compatibility)
      if (!data) {
        try {
          data = JSON.parse(props.archiveData);
        } catch (parseErr) {
          console.error("锟芥档锟斤拷锟捷斤拷锟斤拷失锟斤拷:", parseErr);
          notify.error(t("editArchive.parseFailed") + " " + parseErr.message);
          parseError.value = true;
          return;
        }
      }

      if (!data || typeof data !== "object") {
        console.error("锟芥档锟斤拷锟捷革拷式锟斤拷效");
        notify.error(t("editArchive.parseFailedDataInvalid"));
        parseError.value = true;
        return;
      }

      originalArchive.value = data;
      formData.name = data.name || "";
      formData.currentLevel = data.currentLevel || "Level0";
      formData.gameMode = "multiplayer";
      formData.archiveDifficulty = data.archiveDifficulty || "normal";
      formData.actualDifficulty = FEATURES.MERGE_DIFFICULTY
        ? formData.archiveDifficulty
        : data.actualDifficulty || "normal";
      loadPlayerData(data);
    }
  } catch (e) {
    console.error("锟斤拷始锟斤拷锟芥档锟斤拷锟斤拷失锟斤拷:", e);
    notify.error(t("editArchive.parseFailed") + " " + (e.message || e));
    parseError.value = true;
  }
};

const loadPlayerData = async (archive) => {
  try {
    const playerData = await invoke("get_player_data", { filePath: archive.path });
    if (playerData?.ids && playerData?.inventories) {
      formData.players = [];
      playerData.ids.forEach((steamId, index) => {
        if (steamId?.trim()) {
          const inventory = playerData.inventories[index] || [];
          const formattedInventory = inventory.map((item) => item || null);
          while (formattedInventory.length < 12) formattedInventory.push(null);

          let processedId;
          let isOffline = false;
          let username = null;

          if (steamId.includes("-")) {
            const parts = steamId.split("-");
            processedId = parts[0];
            isOffline = true;
            username = `${parts[0]}${t("common.localPlayerSuffix")}`;
          } else {
            // 锟斤拷锟斤拷锟斤拷遥锟斤拷锟斤拷锟?UE UniqueNetId 锟斤拷缀锟斤拷锟斤拷锟斤拷只锟斤拷示锟斤拷 steam id
            processedId = stripSteamIdSuffix(steamId);
          }

          formData.players.push({
            // 锟斤拷锟斤拷锟斤拷示/锟洁辑锟矫达拷 id
            steamId: processedId,
            // 锟芥档锟斤拷锟皆硷拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷撸锟絗<id>_+_|<32hex>`锟斤拷锟斤拷锟竭ｏ拷`<id>-<15锟街凤拷>`锟斤拷
            // 锟斤拷锟斤拷时锟斤拷锟矫ｏ拷锟斤拷证锟斤拷业锟?UniqueNetId 锟斤拷锟斤拷锟斤拷写锟斤拷锟斤拷戏锟斤拷锟缴的猴拷缀应锟斤拷锟睫凤拷锟狡碉拷锟斤拷
            originalSteamId: steamId,
            inventory: formattedInventory.slice(0, 12),
            username,
            isOfflinePlayer: isOffline,
            sanity: playerData.sanities[index] ?? 100,
          });
        }
      });
      if (formData.players.length > 0) {
        activePlayerIndex.value = 0;
        selectPlayer(0);
      }
    }
  } catch (error) {
    console.error("Load player data failed:", error);
  }
};

// Level related
const loadLevels = () => {
  // Get all unique levels from ENDING_LEVELS (0, 1, 2, 3) preserving order
  const seen = new Set();
  const allLevels = [];
  for (const key of [0, 1, 2, 3]) {
    for (const level of ENDING_LEVELS[key] || []) {
      if (!seen.has(level)) {
        seen.add(level);
        allLevels.push(level);
      }
    }
  }
  // Add special levels not in any ending
  const specialLevels = ["LevelCheat"];
  for (const level of specialLevels) {
    if (!seen.has(level)) {
      allLevels.push(level);
    }
  }

  availableLevels.value = allLevels.map((levelKey) => ({
    name: getLevelName(levelKey),
    image: getLevelImage(levelKey),
    levelKey,
  }));
};

// --- Level search & grouping ---
// Capsule selector state; tab/search/grid rendering lives in <LevelPicker>
const selectedLevelGroup = ref(0);

// Group levels by ending ROUTE. Each tab lists exactly that route's levels
// from ENDING_LEVELS — nothing else. Levels shared with the main route get an
// extra "_UnlockMain" twin placed right below them in BRANCH tabs only
// (selecting it explicitly requests main-ending unlock semantics); the main
// tab itself stays free of twins so no duplicates ever appear there.
const mkLevel = (levelKey) => {
  const name = getLevelName(levelKey);
  return {
    name,
    altName: altName(levelKey),
    image: getLevelImage(levelKey),
    levelKey,
    _search: `${name} ${altName(levelKey)} ${levelKey}`.toLowerCase(),
  };
};
// Levels shared between a branch route and the main route get an
// informational tag so they are distinguishable during search
const mainRouteSet = new Set(ENDING_LEVELS[0]);

const levelGroups = computed(() => {
  const groups = [];
  ENDINGS_CONFIG.forEach((cfg) => {
    const g = {
      id: cfg.id,
      label: t(`createArchive.endings.${cfg.labelKey}`),
      levels: [],
    };
    (ENDING_LEVELS[cfg.id] || []).forEach((k) => {
      const level = mkLevel(k);
      if (cfg.id !== 0 && mainRouteSet.has(k)) level.unlockMain = true;
      level.routeLabel = g.label; // for cross-group search origin display
      g.levels.push(level);
    });
    groups.push(g);
  });

  // Special bucket: flat-list levels belonging to NO route (e.g. LevelCheat)
  const known = new Set(Object.values(ENDING_LEVELS).flat());
  const leftovers = availableLevels.value.filter(
    (l) => !known.has(l.levelKey),
  );
  if (leftovers.length > 0) {
    groups.push({
      id: "special",
      label: t("editArchive.levelGroup.special"),
      levels: leftovers,
    });
  }
  return groups;
});

// Player related
let messageTimeout = null;

const addPlayer = async () => {
  playerInputMessage.value = "";
  const steamId = newSteamId.value.trim();
  if (!steamId) {
    showMessage(t("editArchive.steamIdRequired"), "error");
    return;
  }

  const validation = validateSteamId(steamId);
  if (!validation.valid) {
    showMessage(validation.message, "error");
    return;
  }

  if (formData.players.some((p) => p.steamId === validation.processedSteamId)) {
    showMessage(t("editArchive.steamIdDuplicate", { steamId: validation.processedSteamId }), "error");
    return;
  }

  const newPlayer = {
    steamId: validation.processedSteamId,
    inventory: Array(12).fill(null),
    username: validation.isOfflinePlayer ? `${validation.processedSteamId}${t("common.localPlayerSuffix")}` : null,
    isOfflinePlayer: validation.isOfflinePlayer,
    sanity: 100,
  };

  formData.players.push(newPlayer);
  showMessage(t("editArchive.playerAddedSuccess"), "success");
  newSteamId.value = "";
  activePlayerIndex.value = formData.players.length - 1;
};

const showMessage = (msg, type) => {
  playerInputMessage.value = msg;
  playerInputMessageType.value = type;
  if (messageTimeout) clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => {
    playerInputMessage.value = "";
  }, 3000);
};

const validateSteamId = (steamId) => {
  if (!steamId) return { valid: false, message: t("editArchive.steamIdRequired") };
  if (steamId.includes("-")) {
    const parts = steamId.split("-");
    if (parts.length === 2 && parts[0].length === 5 && parts[1].length === 15) {
      return { valid: true, isOfflinePlayer: true, processedSteamId: parts[0] };
    }
    return { valid: false, message: t("editArchive.steamIdInvalid") };
  }
  if (!/^\d+$/.test(steamId)) return { valid: false, message: t("editArchive.steamIdInvalid") };
  if (steamId.length !== 17) return { valid: false, message: t("editArchive.steamIdLengthError") };
  return { valid: true, isOfflinePlayer: false, processedSteamId: steamId };
};

const removePlayer = (index) => {
  formData.players.splice(index, 1);
  if (activePlayerIndex.value >= formData.players.length) {
    activePlayerIndex.value = formData.players.length - 1;
  }
};

const selectPlayer = (index) => {
  activePlayerIndex.value = index;
  currentPlayerSteamId.value = formData.players[index]?.steamId ?? "";
};

const onSteamIdBlur = () => {
  const player = formData.players[activePlayerIndex.value];
  if (!player) return;
  const val = currentPlayerSteamId.value.trim();
  if (val && /^\d+$/.test(val)) {
    player.steamId = val;
  } else {
    currentPlayerSteamId.value = player.steamId;
  }
};

const getCurrentPlayerDisplayName = () => {
  const player = formData.players[activePlayerIndex.value];
  if (!player) return "";
  return player.username || t("common.playerNameDisplay", { id: player.steamId });
};

// PlayerDetailPanel reports the clamped sanity value for the active player
const onSanityChange = (val) => {
  if (activePlayerIndex.value !== -1 && formData.players[activePlayerIndex.value]) {
    formData.players[activePlayerIndex.value].sanity = val;
  }
};

const editSlot = (playerIndex, slotIndex) => {
  editingSlot.value = { playerIndex, slotIndex };
  showItemSelector.value = true;
};

const handleItemSelect = (itemId) => {
  const { playerIndex, slotIndex } = editingSlot.value;
  if (formData.players[playerIndex]) {
    formData.players[playerIndex].inventory[slotIndex] = itemId;
  }
  showItemSelector.value = false;
};

const closeEdit = () => router.push({ name: "Home" });

// Unlock all hub doors
const unlockAllHubDoors = async () => {
  if (!originalArchive.value?.path) {
    notify.error(t("editArchive.noArchiveLoaded"));
    return;
  }

  try {
    await invoke("unlock_all_hub_doors", { filePath: originalArchive.value.path });
    notify.success(t("editArchive.hubDoorsUnlocked"));
  } catch (error) {
    console.error("锟斤拷锟斤拷锟斤拷纽锟斤拷失锟斤拷:", error);
    notify.error(String(error));
  }
};

onUnmounted(() => {
  if (props.archiveData) {
    editArchiveDataStore.delete("current");
  }
});

onMounted(() => {
  loadLevels();
  initArchiveData();
  nextTick(() => initHighlight());
});
</script>

<style scoped>
.edit-archive-container {
  height: calc(100vh - 38px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Top title */
.page-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-button);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--hover-bg);
  border-color: color-mix(in srgb, var(--primary) 20%, transparent);
}

/* Save button loading spinner */
.save-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-circle);
  border-top-color: white;
  animation: save-spin 0.8s linear infinite;
  margin-right: 2px;
}

@keyframes save-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Tab navigation - floating style */
.tab-nav {
  /* Absolutely centered on the HEADER itself — flex space-between would
     center it only within the leftover space between title and actions. */
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 4px;
  padding: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.tab-highlight {
  position: absolute;
  top: 6px;
  left: 6px;
  height: calc(100% - 12px);
  background: var(--primary);
  border-radius: var(--radius-xs);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 30%, transparent);
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.tab-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: white;
}

/* Content area */
.tab-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
  min-height: 0;
  box-sizing: border-box;
  position: relative;
}

.tab-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px;
  overflow-y: auto;
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.slide-right .tab-panel {
  transform: translateX(24px);
}

.slide-left .tab-panel {
  transform: translateX(-24px);
}

.tab-panel.tab-active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

/* ==========================================
 * 锟斤拷锟斤拷锟斤拷锟斤拷 锟斤拷 锟斤拷锟斤拷式锟斤拷锟斤拷
 *     锟斤拷锟斤拷锟斤拷锟斤拷 + 锟斤拷圆锟斤拷 + 同锟侥等撅拷
 *    Card: 36px(lg) 锟斤拷 Inner: 28px(md) 锟斤拷 8px 锟捷硷拷
 * ========================================== */

/* 锟斤拷锟斤拷锟斤拷锟?*/
.basic-sections {
  display: flex;
  flex-direction: column;
  gap: 26px;
  max-width: 780px;
  margin: 0 auto;
}

/* 锟斤拷锟斤拷 锟斤拷锟矫匡拷片 锟斤拷 36px (lg) 锟斤拷圆锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷 锟斤拷锟斤拷 */
.settings-card {
  background: linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--border-color);
  filter: drop-shadow(var(--filter-card-shadow));
  position: relative;
  transition: all var(--transition-normal) var(--ease-default);
}

/* 锟斤拷锟斤拷微锟斤拷锟斤拷锟?*/
.settings-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  pointer-events: none;
}

.settings-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  filter: drop-shadow(var(--filter-card-shadow-hover, 0 8px 32px rgba(0, 0, 0, 0.12)));
}

/* 锟斤拷锟斤拷 锟斤拷锟斤拷锟斤拷片 锟斤拷 36px (lg) 锟斤拷圆锟斤拷 锟斤拷锟斤拷 */
.action-card {
  cursor: pointer;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--accent-color) 6%, transparent) 0%,
    var(--bg-secondary) 100%
  );
  border: 1px solid color-mix(in srgb, var(--accent-color) 12%, transparent);
  transition: all var(--transition-normal) var(--ease-default);
  /* Button reset: override default <button> styles */
  font-family: inherit;
  font-size: inherit;
  text-align: inherit;
  width: 100%;
  padding: 24px;
  outline: none;
  -webkit-user-select: none;
  user-select: none;
}

.action-card:hover {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--accent-color) 10%, transparent) 0%,
    var(--bg-tertiary) 100%
  );
  border-color: color-mix(in srgb, var(--accent-color) 25%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.action-card:focus-visible {
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent-color) 25%, transparent),
    0 8px 24px rgba(0, 0, 0, 0.1);
}

.action-card:active {
  transform: translateY(0);
}

.action-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.action-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-card-title svg {
  color: var(--accent-color);
  font-size: 16px;
}

.action-card-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: 26px;
}

.action-card-arrow {
  color: var(--text-tertiary);
  font-size: 14px;
  transition: all var(--transition-normal) var(--ease-default);
  flex-shrink: 0;
}

.action-card:hover .action-card-arrow {
  color: var(--accent-color);
  transform: translateX(4px);
}

/* 锟斤拷锟斤拷 Level selector - Enhanced with better visual feedback 锟斤拷锟斤拷 */
/* Single scroll container is .tab-panel; search bar sits at its top in normal flow. */
.level-selector {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  /* Grid height override for the editor layout (picker default suits the wizard) */
  --level-grid-height: calc(100vh - 200px);
}

@media (max-width: 768px) {
  .level-selector {
    --level-grid-height: calc(100vh - 280px);
  }
}

/* 锟斤拷锟斤拷 锟斤拷应式 锟斤拷锟斤拷 */
@media (max-width: 768px) {
  .basic-sections {
    max-width: 100%;
    gap: 24px;
  }
}

@media (max-width: 480px) {
  .settings-card {
    padding: 20px;
  }
}

/* Player management - Enhanced layout with better visual hierarchy */
.players-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  position: relative;
}

/* Left panel - Player list with sticky positioning */
.player-list-section {
  background: linear-gradient(145deg, var(--card-bg) 0%, var(--bg-secondary) 100%);
  border-radius: var(--radius-card);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-normal) var(--ease-default);
}

.player-list-section:hover {
  box-shadow: var(--shadow-lg);
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

.count-badge {
  margin-left: auto;
  background: var(--primary);
  color: white;
  padding: 2px 10px;
  border-radius: var(--radius-tag);
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
  padding: 14px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-default);
  position: relative;
  overflow: hidden;
}

.player-item::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at left, rgba(var(--primary-rgb, 99, 102, 241), 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity var(--transition-normal) var(--ease-default);
}

.player-item:hover {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 8%, var(--bg-tertiary)) 0%,
    var(--bg-secondary) 100%
  );
  border-color: color-mix(in srgb, var(--primary) 20%, transparent);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.player-item:hover::before {
  opacity: 1;
}

.player-item.active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 12%, var(--bg-tertiary)) 0%,
    color-mix(in srgb, var(--primary) 6%, var(--bg-secondary)) 100%
  );
  border-color: var(--primary);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 20%, transparent);
}

.player-item.active::before {
  opacity: 1;
}

.player-avatar {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-xs);
  background: linear-gradient(135deg, var(--bg-quaternary, var(--bg-tertiary)) 0%, var(--bg-tertiary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 16px;
  transition: all var(--transition-normal) var(--ease-default);
  flex-shrink: 0;
}

.player-item:hover .player-avatar {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 15%, var(--bg-tertiary)) 0%,
    var(--bg-secondary) 100%
  );
  color: var(--primary);
}

.player-item.active .player-avatar {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
  color: white;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent);
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sanity-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-tag);
  margin-top: 4px;
}

.sanity-tag.sanity-high {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.sanity-tag.sanity-medium {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.sanity-tag.sanity-low {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.sanity-tag.sanity-critical {
  background: rgba(220, 38, 38, 0.15);
  color: #dc2626;
}

.del-btn {
  opacity: 0;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-xs);
  transition: all var(--transition-normal) var(--ease-default);
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-item:hover .del-btn {
  opacity: 1;
}

.del-btn:hover {
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.15) 0%, rgba(255, 59, 48, 0.08) 100%);
  color: #ff3b30;
  transform: scale(1.1);
}

.del-btn:active {
  transform: scale(0.95);
}

.empty-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  padding: 40px;
}

.empty-hint svg {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-hint p {
  font-size: 13px;
  margin: 0;
}

.add-player-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--border-color);
}

.add-btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-button);
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.add-btn:hover {
  background: var(--primary-hover);
}

.msg-tip {
  padding: 10px 12px;
  margin: 0 12px 12px;
  border-radius: var(--radius-xs);
  font-size: 12px;
}

.msg-tip.error {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.msg-tip.success {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

/* Player details - Enhanced visual hierarchy */
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

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  padding: 40px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  color: var(--text-tertiary);
  opacity: 0.6;
}

.error-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.error-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  max-width: 400px;
  line-height: 1.5;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .players-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .player-list-section {
    max-height: 280px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .page-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .tab-nav {
    /* Back into the wrapped flow on narrow screens */
    position: static;
    left: auto;
    top: auto;
    transform: none;
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .inventory-wrap {
    flex-direction: column;
    gap: 14px;
  }

  .backpack-slots {
    grid-template-columns: repeat(3, 54px);
  }

  .inv-slot {
    width: 54px;
    height: 54px;
  }
}

@media (max-width: 600px) {
  .page-header {
    padding: 12px 16px;
  }

  .page-title {
    font-size: 16px;
  }

  .tab-nav {
    overflow-x: auto;
  }

  .tab-btn {
    padding: 6px 12px;
    font-size: 12px;
    white-space: nowrap;
  }

  .tab-content {
    padding: 16px;
  }

  .group-header {
    padding: 10px 12px;
  }

  .group-title {
    font-size: 13px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .detail-block {
    padding: 14px;
  }

  .inventory-wrap {
    flex-direction: column;
    gap: 12px;
  }

  .hand-slots,
  .backpack-slots {
    gap: 8px;
  }

  .inv-slot {
    width: 52px;
    height: 52px;
  }

  .btn-primary span,
  .btn-secondary span {
    display: none;
  }

  .btn-primary,
  .btn-secondary {
    padding: 8px 12px;
  }

  .sanity-num {
    font-size: 24px;
    min-width: 60px;
  }

  .sanity-bar {
    height: 8px;
  }

  .quick-btns {
    gap: 6px;
  }

  .qbtn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}

</style>
