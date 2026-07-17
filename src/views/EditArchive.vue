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
v-for="(tab, index) in tabs" :key="tab.id" :ref="(el) => (tabRefs[index] = el)" class="tab-btn"
          :class="{ active: activeTab === tab.id }" @click="switchTab(tab.id, index)">
          <font-awesome-icon :icon="tab.icon" />
          <span>{{ $t(tab.label) }}</span>
        </button>
      </div>

      <div class="header-actions">
        <button class="btn-secondary" @click="closeEdit">
          <font-awesome-icon :icon="['fas', 'times']" />
          {{ $t("common.cancel") }}
        </button>
        <button class="btn-primary" @click="handleSaveArchive">
          <font-awesome-icon :icon="['fas', 'save']" />
          {{ $t("common.save") }}
        </button>
      </div>
    </div>

    <!-- Content area -->
    <div class="tab-content" :class="`slide-${slideDirection}`">
      <!-- Basic settings -->
      <div class="tab-panel" :class="{ 'tab-active': activeTab === 'basic' }">
        <div class="basic-sections">
          <!-- Basic Info -->
          <div class="settings-section">
            <h3 class="section-title">
              <font-awesome-icon :icon="['fas', 'info-circle']" />
              {{ $t("editArchive.basicInfo") }}
            </h3>
            <div class="settings-card">
              <label class="card-label">{{ $t("editArchive.archiveName") }}</label>
              <input
v-model="formData.name" type="text" class="settings-input"
                :placeholder="$t('editArchive.archiveNamePlaceholder')" maxlength="50" />
            </div>
          </div>

          <!-- Difficulty Settings -->
          <div class="settings-section">
            <h3 class="section-title">
              <font-awesome-icon :icon="['fas', 'gauge-high']" />
              {{ $t("editArchive.difficulty") }}
            </h3>
            <div class="difficulty-row" :class="{ 'difficulty-row--merged': FEATURES.MERGE_DIFFICULTY }">
              <div class="settings-card">
                <label class="card-label">{{ $t("editArchive.difficulty") }}</label>
                <div class="diff-grid">
                  <div
v-for="d in difficultyLevels" :key="d.value" class="diff-option"
                    :class="{ selected: formData.archiveDifficulty === d.value }"
                    @click="formData.archiveDifficulty = d.value">
                    <font-awesome-icon :icon="d.icon" class="diff-icon" />
                    <span class="diff-text">{{ getDifficultyText(d.value) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="!FEATURES.MERGE_DIFFICULTY" class="settings-card">
                <label class="card-label">{{ $t("editArchive.actualDifficulty") }}</label>
                <div class="diff-grid">
                  <div
v-for="d in difficultyLevels" :key="`actual-${d.value}`" class="diff-option"
                    :class="{ selected: formData.actualDifficulty === d.value }"
                    @click="formData.actualDifficulty = d.value">
                    <font-awesome-icon :icon="d.icon" class="diff-icon" />
                    <span class="diff-text">{{ getDifficultyText(d.value) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Merge difficulty hint -->
            <div v-if="FEATURES.MERGE_DIFFICULTY" class="difficulty-hint">
              <font-awesome-icon :icon="['fas', 'info-circle']" />
              <span>{{ t("editArchive.difficultyMergeHint") }}</span>
            </div>
          </div>

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
        <div class="level-grid">
          <div
v-for="(level, index) in availableLevels" :key="index" class="level-card"
            :class="{ selected: formData.currentLevel === level.levelKey }" @click="selectLevel(level.levelKey)">
            <div class="level-img-wrap">
              <LazyImage :src="level.image" :alt="level.name" image-class="level-img" />
              <div v-if="formData.currentLevel === level.levelKey" class="level-check">
                <font-awesome-icon :icon="['fas', 'check-circle']" />
              </div>
            </div>
            <span class="level-name">{{ level.name }}</span>
          </div>
        </div>
      </div>

      <!-- Player management -->
      <div class="tab-panel" :class="{ 'tab-active': activeTab === 'players' }">
        <div class="players-layout">
          <!-- Player list -->
          <PlayerManager
:players="formData.players" :active-player-index="activePlayerIndex" :new-steam-id="newSteamId"
            :player-input-message="playerInputMessage" :player-input-message-type="playerInputMessageType"
            :show-sanity="true" @update:new-steam-id="(val) => (newSteamId = val)" @add-steam-id="addPlayer"
            @remove-player="removePlayer" @select-player="selectPlayer" />

          <!-- Player details -->
          <div v-if="activePlayerIndex !== -1 && formData.players.length > 0" class="player-detail-section">
            <div class="detail-header">
              <Transition name="player-name-switch" mode="out-in">
                <span :key="activePlayerIndex">{{ getCurrentPlayerDisplayName() }}</span>
              </Transition>
            </div>

            <Transition name="player-detail-grid-switch" mode="out-in">
              <div :key="activePlayerIndex" class="detail-grid">
                <!-- Sanity -->
                <div class="detail-block">
                  <div class="block-title">
                    <font-awesome-icon :icon="['fas', 'brain']" />
                    {{ $t("editArchive.playerSanity") }}
                  </div>
                  <div class="sanity-display">
                    <span class="sanity-num" :class="getSanityClass(currentPlayerSanity)">{{ currentPlayerSanity
                    }}%</span>
                    <div class="sanity-bar">
                      <div
class="sanity-fill" :style="{ width: currentPlayerSanity + '%' }"
                        :class="getSanityClass(currentPlayerSanity)"></div>
                    </div>
                  </div>
                  <div class="sanity-ctrl">
                    <CustomSlider v-model="currentPlayerSanity" :min="0" :max="100" :step="1" />
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

                <!-- Inventory -->
                <div class="detail-block">
                  <div class="block-title">
                    <font-awesome-icon :icon="['fas', 'suitcase']" />
                    {{ $t("editArchive.inventory") }}
                  </div>
                  <div class="inventory-wrap">
                    <div class="hand-slots">
                      <div
v-for="slot in 3" :key="`h-${slot}`" class="inv-slot"
                        :class="{ empty: !getSlotContent(activePlayerIndex, slot - 1) }"
                        @click="editSlot(activePlayerIndex, slot - 1)">
                        <span class="slot-label">{{ getSlotLabelText(slot - 1) }}</span>
                        <LazyImage
v-if="getSlotContent(activePlayerIndex, slot - 1)"
                          :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(activePlayerIndex, slot - 1))}`"
                          image-class="slot-img" />
                        <font-awesome-icon v-else :icon="['fas', 'hand-paper']" class="slot-placeholder" />
                      </div>
                    </div>
                    <div class="backpack-slots">
                      <div
v-for="slot in 9" :key="`b-${slot}`" class="inv-slot"
                        :class="{ empty: !getSlotContent(activePlayerIndex, slot + 2) }"
                        @click="editSlot(activePlayerIndex, slot + 2)">
                        <span class="slot-num">{{ slot }}</span>
                        <LazyImage
v-if="getSlotContent(activePlayerIndex, slot + 2)"
                          :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(activePlayerIndex, slot + 2))}`"
                          image-class="slot-img" />
                        <font-awesome-icon v-else :icon="['fas', 'cube']" class="slot-placeholder" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
:visible="showItemSelector" :selected-item="selectedItem" @select="handleItemSelect"
      @update:visible="showItemSelector = $event" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import InventoryItemSelector from "../components/feature/InventoryItemSelector.vue";
import LazyImage from "../components/ui/LazyImage.vue";
import CustomSlider from "../components/ui/CustomSlider.vue";
import PlayerManager from "../components/system/PlayerManager.vue";
import { notify } from "../services/notificationService";
import { editArchiveDataStore } from "../composables/useArchiveActions";
import { formatDifficulty } from "../utils/archiveCreationUtils";
import { FEATURES } from "@/config/features";

const props = defineProps({
  archiveData: { type: String, default: "" },
});

const { t, te } = useI18n({ useScope: "global" });
const router = useRouter();

const getLevelName = (levelKey) => {
  const translationKey = `LevelName_Display.${levelKey}`;
  return te(translationKey) ? t(translationKey) : levelKey;
};

const getDifficultyText = (difficultyKey) => {
  const translationKey = `editArchive.difficultyLevels.${difficultyKey}`;
  return te(translationKey) ? t(translationKey) : difficultyKey;
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
const currentPlayerSanity = ref(100);
const parseError = ref(false);
const availableLevels = ref([]);

const difficultyLevels = [
  { value: "easy", icon: ["fas", "smile"] },
  { value: "normal", icon: ["fas", "meh"] },
  { value: "hard", icon: ["fas", "frown"] },
  { value: "nightmare", icon: ["fas", "skull"] },
];

// Save archive
const handleSaveArchive = async () => {
  try {
    if (!originalArchive.value) return;

    const playerInventory = {};
    const playerSanity = {};

    formData.players.forEach((player) => {
      const steamId = player.steamId.trim();
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
      actualDifficulty: formatDifficulty(FEATURES.MERGE_DIFFICULTY ? formData.archiveDifficulty : formData.actualDifficulty),
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

    if (errorMsg.includes("拒绝访问") || errorMsg.includes("Access is denied") || errorMsg.includes("os error 5")) {
      notify.error(t("editArchive.saveErrorAccessDenied"));
    } else if (errorMsg.includes("正在使用") || errorMsg.includes("being used")) {
      notify.error(t("editArchive.saveErrorFileInUse"));
    } else {
      notify.error(t("editArchive.saveError", { error: errorMsg }));
    }
  }
};

// Initialize
const initArchiveData = () => {
  try {
    if (props.archiveData) {
      let data;

      // Try lookup from editArchiveDataStore first (key-based)
      const stored = editArchiveDataStore.get(props.archiveData);
      if (stored) {
        try {
          data = JSON.parse(stored);
        } catch (e) {
          console.error("解析存档数据失败:", e);
        }
        // Clean up store entry
        editArchiveDataStore.delete(props.archiveData);
      }

      // If store lookup failed, try direct JSON parse (backward compatibility)
      if (!data) {
        try {
          data = JSON.parse(props.archiveData);
        } catch (parseErr) {
          console.error("存档数据解析失败:", parseErr);
          notify.error(t("editArchive.parseFailed") + " " + parseErr.message);
          parseError.value = true;
          return;
        }
      }

      if (!data || typeof data !== "object") {
        console.error("存档数据格式无效");
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
        : (data.actualDifficulty || "normal");
      loadPlayerData(data);
    }
  } catch (e) {
    console.error("初始化存档数据失败:", e);
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

          let processedId = steamId;
          let isOffline = false;
          let username = null;

          if (steamId.includes("-")) {
            const parts = steamId.split("-");
            processedId = parts[0];
            isOffline = true;
            username = `${parts[0]}${t("common.localPlayerSuffix")}`;
          }

          formData.players.push({
            steamId: processedId,
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
  const levelMappings = [
    "Level0",
    "TopFloor",
    "MiddleFloor",
    "GarageLevel2",
    "BottomFloor",
    "TheHub",
    "Pipes1",
    "ElectricalStation",
    "Office",
    "Hotel",
    "Floor3",
    "BoilerRoom",
    "Pipes2",
    "LevelFun",
    "Poolrooms",
    "LevelRun",
    "TheEnd",
    "Level922",
    "Level94",
    "AnimatedKingdom",
    "LightsOut",
    "OceanMap",
    "CaveLevel",
    "Level05",
    "Level9",
    "AbandonedBase",
    "Level10",
    "Level3999",
    "Level07",
    "Snackrooms",
    "LevelDash",
    "Level188_Expanded",
    "Poolrooms_Expanded",
    "WaterPark_Level01_P",
    "WaterPark_Level02_P",
    "WaterPark_Level03_P",
    "LevelFun_Expanded",
    "Zone1_Modified",
    "Zone2_Modified",
    "Zone3_Baked",
    "Zone4",
    "Level52",
    "TunnelLevel",
    "Bunker",
    "GraffitiLevel",
    "Grassrooms_Expanded",
    "Level974",
    "LevelCheat",
  ];

  availableLevels.value = levelMappings.map((levelKey) => {
    return { name: getLevelName(levelKey), image: `/images/ETB/${levelKey}.webp`, levelKey };
  });
};

const selectLevel = (levelKey) => {
  formData.currentLevel = levelKey;
};

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
  currentPlayerSanity.value = formData.players[index]?.sanity ?? 100;
};

const getCurrentPlayerDisplayName = () => {
  const player = formData.players[activePlayerIndex.value];
  if (!player) return "";
  return player.username || t("common.playerNameDisplay", { id: player.steamId.substring(0, 8) });
};

const getSanityClass = (val) => {
  if (val >= 80) return "sanity-high";
  if (val >= 50) return "sanity-medium";
  if (val >= 20) return "sanity-low";
  return "sanity-critical";
};

const setMaxSanity = () => {
  if (activePlayerIndex.value !== -1) {
    formData.players[activePlayerIndex.value].sanity = 100;
    currentPlayerSanity.value = 100;
  }
};
const setMinSanity = () => {
  if (activePlayerIndex.value !== -1) {
    formData.players[activePlayerIndex.value].sanity = 0;
    currentPlayerSanity.value = 0;
  }
};

// Inventory related
const getSlotContent = (playerIndex, slotIndex) => {
  const item = formData.players[playerIndex]?.inventory?.[slotIndex];
  return item && item !== "None" ? item : null;
};

const getSlotLabel = (slotIndex) => ["mainHand", "offHand1", "offHand2"][slotIndex] || "";

const getSlotLabelText = (slotIndex) => {
  const label = getSlotLabel(slotIndex);
  const translationKey = `editArchive.${label}`;
  return te(translationKey) ? t(translationKey) : label;
};

const getItemImageFile = (itemName) => {
  if (!itemName || itemName === "None") return null;
  if (itemName === "Toy") return "Teddy_Bear.png";
  return `${itemName}.png`;
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

const getItemIdByName = (itemName) => {
  if (!itemName || itemName === "None") return -1;
  const map = {
    AlmondConcentrate: 1,
    BugSpray: 2,
    Camera: 3,
    AlmondWater: 4,
    Chainsaw: 5,
    DivingHelmet: 6,
    EnergyBar: 7,
    Firework: 8,
    Flaregun: 9,
    Flashlight: 10,
    GlowstickBlue: 11,
    GlowStick: 12,
    GlowstickRed: 13,
    GlowstickYellow: 14,
    Juice: 15,
    LiquidPain: 16,
    Rope: 17,
    LiDAR: 18,
    Thermometer: 19,
    Ticket: 20,
    WalkieTalkie: 21,
    MothJelly: 22,
    Crowbar: 23,
    Knife: 24,
    Toy: 25,
  };
  return map[itemName] || -1;
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
    console.error("解锁枢纽门失败:", error);
    notify.error(String(error));
  }
};

// Watch sanity value changes
watch(currentPlayerSanity, (val) => {
  if (activePlayerIndex.value !== -1 && formData.players[activePlayerIndex.value]) {
    const numVal = Number(val);
    formData.players[activePlayerIndex.value].sanity = Math.max(0, Math.min(100, isNaN(numVal) ? 100 : numVal));
  }
});

onUnmounted(() => {
  if (props.archiveData) {
    editArchiveDataStore.delete(props.archiveData);
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
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--hover-bg);
}

/* Tab navigation - floating style */
.tab-nav {
  position: relative;
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
 * 基础设置 — 三段式布局
 *     连续曲率 + 大圆角 + 同心等距
 *    Card: 36px(lg) → Inner: 28px(md) → 8px 递减
 * ========================================== */

/* 外层容器 */
.basic-sections {
  display: flex;
  flex-direction: column;
  gap: 26px;
  max-width: 780px;
  margin: 0 auto;
}

/* ━━ 区域分组 ━━ */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 区域标题（带 accent 竖条装饰）*/
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  padding-left: 14px;
  position: relative;
  letter-spacing: -0.02em;
}

.section-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: var(--accent-color);
  border-radius: var(--radius-xs);
}

.section-title svg {
  color: var(--accent-color);
  font-size: 16px;
}

/* ━━ 设置卡片 — 36px (lg) 大圆角连续曲线 ━━ */
.settings-card {
  background: linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
  position: relative;
  transition: all var(--transition-normal) var(--ease-default);
}

/* 顶部微光描边 */
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
  box-shadow: var(--shadow-card-hover, 0 8px 32px rgba(0, 0, 0, 0.12));
}

/* 卡片标签 */
.card-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

/* ━━ 输入框 — 28px (md) 同心第二层 ━━ */
.settings-input {
  width: 100%;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: linear-gradient(145deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all var(--transition-normal) var(--ease-default);
}

.settings-input:hover {
  border-color: var(--accent-color);
}

.settings-input:focus {
  border-color: var(--accent-color);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent-color) 15%, transparent),
    inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.settings-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

/* ━━ 难度双列布局 ━━ */
.difficulty-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* When difficulty merge is active, use single column for full-width selector */
.difficulty-row--merged {
  grid-template-columns: 1fr;
  max-width: 500px;
}

/* Merge difficulty hint */
.difficulty-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(var(--warning-color-rgb, 255, 159, 10), 0.1);
  border: 1px solid rgba(var(--warning-color-rgb, 255, 159, 10), 0.2);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 500px;
}

.difficulty-hint svg {
  color: #ff9f0a;
  font-size: 14px;
  flex-shrink: 0;
}

/* ━━ 难度网格 4 列 ━━ */
.diff-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

/* ━━ 难度选项 — 28px (md) 同心第二层 ━━ */
.diff-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: var(--radius-md);
  background: linear-gradient(145deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border: 2px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-default);
  position: relative;
  overflow: hidden;
  user-select: none;
}

.diff-option::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center,
      color-mix(in srgb, var(--accent-color) 10%, transparent) 0%,
      transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.diff-option:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-color) 30%, transparent);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.diff-option:hover::before {
  opacity: 1;
}

.diff-option.selected {
  border-color: var(--accent-color);
  background: linear-gradient(145deg,
      color-mix(in srgb, var(--accent-color) 15%, transparent) 0%,
      color-mix(in srgb, var(--accent-color) 8%, transparent) 100%);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--accent-color) 20%, transparent),
    0 4px 12px color-mix(in srgb, var(--accent-color) 15%, transparent);
}

.diff-icon {
  font-size: 24px;
  color: var(--text-secondary);
  transition: all var(--transition-normal) var(--ease-default);
}

.diff-option:hover .diff-icon {
  transform: scale(1.1);
}

.diff-option.selected .diff-icon {
  color: var(--accent-color);
  transform: scale(1.1);
}

.diff-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  transition: color var(--transition-fast) var(--ease-default);
}

.diff-option.selected .diff-text {
  color: var(--accent-color);
}

/* ━━ 操作卡片 — 36px (lg) 大圆角 ━━ */
.action-card {
  cursor: pointer;
  background: linear-gradient(145deg,
      color-mix(in srgb, var(--accent-color) 6%, transparent) 0%,
      var(--bg-secondary) 100%);
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
  background: linear-gradient(145deg,
      color-mix(in srgb, var(--accent-color) 10%, transparent) 0%,
      var(--bg-tertiary) 100%);
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

/* ━━ 响应式 ━━ */
@media (max-width: 768px) {
  .basic-sections {
    max-width: 100%;
    gap: 24px;
  }

  .difficulty-row {
    grid-template-columns: 1fr;
  }

  .diff-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .diff-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .settings-card {
    padding: 20px;
  }
}

/* Level selection */
.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.level-card {
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--card-bg);
  border: 2px solid transparent;
}

.level-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.level-card.selected {
  border-color: var(--primary);
}

.level-img-wrap {
  position: relative;
  aspect-ratio: 16/9;
}

.level-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.level-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--primary);
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.level-name {
  display: block;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Player management */
.players-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  height: 100%;
  min-height: 0;
  max-height: 100%;
}

.player-list-section,
.player-detail-section {
  background: var(--card-bg);
  border-radius: var(--radius-card);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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
  padding: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.player-item:hover {
  background: var(--hover-bg);
}

.player-item.active {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  outline: 2px solid var(--primary);
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-xs);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.player-item.active .player-avatar {
  background: var(--primary);
  color: white;
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
  transition: all 0.15s;
}

.player-item:hover .del-btn {
  opacity: 1;
}

.del-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
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

/* Player details */
.player-detail-section {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.player-detail-section.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
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

.detail-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-block {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.block-title svg {
  color: var(--primary);
}

.sanity-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sanity-num {
  font-size: 24px;
  font-weight: 700;
  min-width: 60px;
}

.sanity-num.sanity-high {
  color: #10b981;
}

.sanity-num.sanity-medium {
  color: #f59e0b;
}

.sanity-num.sanity-low {
  color: #ef4444;
}

.sanity-num.sanity-critical {
  color: #dc2626;
}

.sanity-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.sanity-fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition:
    width 0.3s,
    background 0.4s;
}

.sanity-fill.sanity-high {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.sanity-fill.sanity-medium {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.sanity-fill.sanity-low {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.sanity-fill.sanity-critical {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.sanity-ctrl {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sanity-ctrl> :first-child {
  flex: 1;
}

.quick-btns {
  display: flex;
  gap: 6px;
}

.qbtn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.qbtn.danger {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.qbtn.danger:hover {
  background: rgba(255, 59, 48, 0.2);
}

.qbtn.success {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.qbtn.success:hover {
  background: rgba(52, 199, 89, 0.2);
}

/* Inventory */
.inventory-wrap {
  display: flex;
  gap: 16px;
}

.hand-slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backpack-slots {
  display: grid;
  grid-template-columns: repeat(3, 56px);
  gap: 8px;
}

.inv-slot {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.inv-slot:hover {
  border-color: var(--primary);
  transform: scale(1.05);
}

.inv-slot.empty {
  border-style: dashed;
}

.slot-label {
  position: absolute;
  top: 3px;
  left: 3px;
  font-size: 8px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 1px 4px;
  border-radius: var(--radius-xs);
}

.slot-num {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.slot-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.slot-placeholder {
  font-size: 18px;
  color: var(--text-tertiary);
  opacity: 0.4;
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
  }

  .player-list-section {
    max-height: 300px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .tab-nav {
    order: 3;
    width: 100%;
    justify-content: center;
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

  .level-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .inventory-wrap {
    flex-direction: column;
  }

  .btn-primary span,
  .btn-secondary span {
    display: none;
  }

  .btn-primary,
  .btn-secondary {
    padding: 8px 12px;
  }
}
</style>
