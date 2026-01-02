<template>
  <div class="edit-archive-container">
    <!-- 顶部标题栏 + 标签导航 -->
    <div class="page-header">
      <h1 class="page-title">{{ $t("editArchive.title") }}</h1>
      
      <div class="tab-nav">
        <div class="tab-highlight" :style="highlightStyle"></div>
        <button 
          v-for="(tab, index) in tabs" 
          :key="tab.id"
          :ref="el => tabRefs[index] = el"
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
        <button class="btn-primary" @click="handleSaveArchive">
          <font-awesome-icon :icon="['fas', 'save']" />
          {{ $t("common.save") }}
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="tab-content" :class="`slide-${slideDirection}`">
      <!-- 基础设置 -->
      <div class="tab-panel" :class="{ 'tab-active': activeTab === 'basic' }">
        <div class="panel-grid">
          <div class="form-card">
            <label class="form-label">{{ $t("editArchive.archiveName") }}</label>
            <input
              v-model="archiveData.name"
              type="text"
              class="form-input"
              :placeholder="$t('editArchive.archiveNamePlaceholder')"
              maxlength="50"
            />
          </div>
          <div class="form-card">
            <label class="form-label">{{ $t("editArchive.difficulty") }}</label>
            <div class="difficulty-options">
              <div
                v-for="d in difficultyLevels"
                :key="d.value"
                class="difficulty-btn"
                :class="{ selected: archiveData.archiveDifficulty === d.value }"
                @click="archiveData.archiveDifficulty = d.value"
              >
                <font-awesome-icon :icon="d.icon" />
                <span>{{ $t(`editArchive.difficultyLevels.${d.value}`) }}</span>
              </div>
            </div>
          </div>
          <div class="form-card">
            <label class="form-label">{{ $t("editArchive.actualDifficulty") }}</label>
            <div class="difficulty-options">
              <div
                v-for="d in difficultyLevels"
                :key="`actual-${d.value}`"
                class="difficulty-btn"
                :class="{ selected: archiveData.actualDifficulty === d.value }"
                @click="archiveData.actualDifficulty = d.value"
              >
                <font-awesome-icon :icon="d.icon" />
                <span>{{ $t(`editArchive.difficultyLevels.${d.value}`) }}</span>
              </div>
            </div>
          </div>
          <div class="form-card">
            <label class="form-label">{{ $t("editArchive.hubDoors") }}</label>
            <button class="action-btn" @click="unlockAllHubDoors">
              <font-awesome-icon :icon="['fas', 'door-open']" />
              <span>{{ $t("editArchive.unlockAllHubDoors") }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 层级选择 -->
      <div class="tab-panel" :class="{ 'tab-active': activeTab === 'level' }">
        <div class="level-grid">
          <div
            v-for="(level, index) in availableLevels"
            :key="index"
            class="level-card"
            :class="{ selected: archiveData.currentLevel === level.levelKey }"
            @click="selectLevel(level.levelKey)"
          >
            <div class="level-img-wrap">
              <LazyImage :src="level.image" :alt="level.name" image-class="level-img" />
              <div class="level-check" v-if="archiveData.currentLevel === level.levelKey">
                <font-awesome-icon :icon="['fas', 'check-circle']" />
              </div>
            </div>
            <span class="level-name">{{ level.name }}</span>
          </div>
        </div>
      </div>

      <!-- 玩家管理 -->
      <div class="tab-panel" :class="{ 'tab-active': activeTab === 'players' }">
        <div class="players-layout">
          <!-- 玩家列表 -->
          <div class="player-list-section">
            <div class="section-title">
              <span>{{ $t("editArchive.playerManagement") }}</span>
              <span class="count-badge">{{ archiveData.players.length }}</span>
            </div>

            <div class="player-list" v-if="archiveData.players.length > 0">
              <div
                v-for="(player, index) in archiveData.players"
                :key="index"
                class="player-item"
                :class="{ active: activePlayerIndex === index }"
                @click="selectPlayer(index)"
              >
                <div class="player-avatar">
                  <font-awesome-icon :icon="['fas', 'user']" />
                </div>
                <div class="player-info">
                  <span class="player-name">
                    {{ player.username || (player.isOfflinePlayer ? `${player.steamId}(本地)` : player.steamId) }}
                  </span>
                  <span class="sanity-tag" :class="getSanityClass(player.sanity ?? 100)">
                    {{ player.sanity ?? 100 }}%
                  </span>
                </div>
                <button class="del-btn" @click.stop="removePlayer(index)">
                  <font-awesome-icon :icon="['fas', 'trash']" />
                </button>
              </div>
            </div>
            <div class="empty-hint" v-else>
              <font-awesome-icon :icon="['fas', 'user-plus']" />
              <p>{{ $t("editArchive.noPlayersHint") }}</p>
            </div>

            <div class="add-player-row">
              <input
                v-model="newSteamId"
                type="text"
                class="form-input"
                :placeholder="$t('editArchive.steamIdPlaceholder')"
                @keyup.enter="addPlayer"
              />
              <button class="add-btn" @click="addPlayer">
                <font-awesome-icon :icon="['fas', 'plus']" />
              </button>
            </div>
            <transition name="fade">
              <div v-if="playerInputMessage" class="msg-tip" :class="playerInputMessageType">
                {{ playerInputMessage }}
              </div>
            </transition>
          </div>

          <!-- 玩家详情 -->
          <div class="player-detail-section" v-if="activePlayerIndex !== -1 && archiveData.players.length > 0">
            <div class="detail-header">
              <span>{{ getCurrentPlayerDisplayName() }}</span>
            </div>

            <div class="detail-grid">
              <!-- 理智值 -->
              <div class="detail-block">
                <div class="block-title">
                  <font-awesome-icon :icon="['fas', 'brain']" />
                  {{ $t("editArchive.playerSanity") }}
                </div>
                <div class="sanity-display">
                  <span class="sanity-num" :class="getSanityClass(currentPlayerSanity)">{{ currentPlayerSanity }}%</span>
                  <div class="sanity-bar">
                    <div class="sanity-fill" :style="{ width: currentPlayerSanity + '%' }" :class="getSanityClass(currentPlayerSanity)"></div>
                  </div>
                </div>
                <div class="sanity-ctrl">
                  <CustomSlider v-model="currentPlayerSanity" :min="0" :max="100" :step="1" />
                  <div class="quick-btns">
                    <button class="qbtn danger" @click="setMinSanity()"><font-awesome-icon :icon="['fas', 'skull']" /></button>
                    <button class="qbtn success" @click="setMaxSanity()"><font-awesome-icon :icon="['fas', 'heart']" /></button>
                  </div>
                </div>
              </div>

              <!-- 背包 -->
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
                      class="inv-slot"
                      :class="{ empty: !getSlotContent(activePlayerIndex, slot - 1) }"
                      @click="editSlot(activePlayerIndex, slot - 1)"
                    >
                      <span class="slot-label">{{ $t(`editArchive.${getSlotLabel(slot - 1)}`) }}</span>
                      <LazyImage
                        v-if="getSlotContent(activePlayerIndex, slot - 1)"
                        :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(activePlayerIndex, slot - 1))}`"
                        image-class="slot-img"
                      />
                      <font-awesome-icon v-else :icon="['fas', 'hand-paper']" class="slot-placeholder" />
                    </div>
                  </div>
                  <div class="backpack-slots">
                    <div
                      v-for="slot in 9"
                      :key="`b-${slot}`"
                      class="inv-slot"
                      :class="{ empty: !getSlotContent(activePlayerIndex, slot + 2) }"
                      @click="editSlot(activePlayerIndex, slot + 2)"
                    >
                      <span class="slot-num">{{ slot }}</span>
                      <LazyImage
                        v-if="getSlotContent(activePlayerIndex, slot + 2)"
                        :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(activePlayerIndex, slot + 2))}`"
                        image-class="slot-img"
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
            <p>{{ archiveData.players.length > 0 ? $t("editArchive.selectPlayerHint") : $t("editArchive.addPlayerFirst") }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 物品选择器 -->
    <InventoryItemSelector
      :visible="showItemSelector"
      @select="handleItemSelect"
      @update:visible="showItemSelector = $event"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import { gsap } from "gsap";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import InventoryItemSelector from "../components/InventoryItemSelector.vue";
import LazyImage from "../components/LazyImage.vue";
import CustomSlider from "../components/CustomSlider.vue";
import { showError, showSuccess } from "../services/popupService";

const props = defineProps({
  archiveData: { type: String, default: "" },
});

const { t } = useI18n({ useScope: "global" });
const router = useRouter();

// 标签页配置
const tabs = [
  { id: 'basic', label: 'editArchive.tabs.basic', icon: ['fas', 'cog'] },
  { id: 'level', label: 'editArchive.tabs.level', icon: ['fas', 'map'] },
  { id: 'players', label: 'editArchive.tabs.players', icon: ['fas', 'users'] },
];
const activeTab = ref('basic');
const tabRefs = ref([]);
const highlightStyle = ref({});

// 切换标签
const currentTabIndex = ref(0);
const slideDirection = ref('right');

const switchTab = (tabId, index) => {
  slideDirection.value = index > currentTabIndex.value ? 'right' : 'left';
  currentTabIndex.value = index;
  activeTab.value = tabId;
  updateHighlight(index);
};

// 更新高亮位置
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

// 初始化高亮位置
const initHighlight = () => {
  const index = tabs.findIndex(t => t.id === activeTab.value);
  if (index !== -1) updateHighlight(index);
};

// 表单数据
const archiveData = reactive({
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
const editingSlot = ref({ playerIndex: 0, slotIndex: 0 });
const playerInputMessage = ref("");
const playerInputMessageType = ref("");
const currentPlayerSanity = ref(100);
const availableLevels = ref([]);

const difficultyLevels = [
  { value: "easy", icon: ["fas", "smile"] },
  { value: "normal", icon: ["fas", "meh"] },
  { value: "hard", icon: ["fas", "frown"] },
  { value: "nightmare", icon: ["fas", "skull"] },
];

// 保存存档
const handleSaveArchive = async () => {
  try {
    if (!originalArchive.value) return;

    const playerInventory = {};
    const playerSanity = {};

    archiveData.players.forEach((player) => {
      const steamId = player.steamId.trim();
      playerInventory[steamId] = player.inventory.map((itemId) => ({
        item: { id: getItemIdByName(itemId) },
      }));
      playerSanity[steamId] = player.sanity ?? 100;
    });

    const saveData = {
      path: originalArchive.value.path,
      name: archiveData.name,
      mode: "Multiplayer",
      currentLevel: archiveData.currentLevel,
      difficulty: archiveData.archiveDifficulty.charAt(0).toUpperCase() + archiveData.archiveDifficulty.slice(1),
      actualDifficulty: archiveData.actualDifficulty.charAt(0).toUpperCase() + archiveData.actualDifficulty.slice(1),
      playerInventory,
      playerSanity,
    };

    const outputDir = (await invoke("get_local_appdata")) + "\\EscapeTheBackrooms\\Saved\\SaveGames";
    await invoke("handle_edit_save", {
      jsonInput: { saveData: { jsonData: saveData, outputDir } },
    });

    router.push({ name: "Home" });
  } catch (error) {
    console.error("Save failed:", error);
  }
};

// 初始化
const initArchiveData = () => {
  try {
    if (props.archiveData) {
      const data = JSON.parse(props.archiveData);
      originalArchive.value = data;
      archiveData.name = data.name || "";
      archiveData.currentLevel = data.currentLevel || "Level0";
      archiveData.gameMode = "multiplayer";
      archiveData.archiveDifficulty = data.archiveDifficulty || "normal";
      archiveData.actualDifficulty = data.actualDifficulty || "normal";
      loadPlayerData(data);
    }
  } catch (e) {
    console.error("Parse failed:", e);
  }
};

const loadPlayerData = async (archive) => {
  try {
    const playerData = await invoke("get_player_data", { filePath: archive.path });
    if (playerData?.ids && playerData?.inventories) {
      archiveData.players = [];
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
            username = `${parts[0]}(本地)`;
          }

          archiveData.players.push({
            steamId: processedId,
            inventory: formattedInventory.slice(0, 12),
            username,
            isOfflinePlayer: isOffline,
            sanity: playerData.sanities[index] ?? 100,
          });
        }
      });
      if (archiveData.players.length > 0) activePlayerIndex.value = 0;
      await fetchSteamUsernames();
    }
  } catch (error) {
    console.error("Load player data failed:", error);
  }
};

const fetchSteamUsernames = async () => {
  try {
    const steamIds = archiveData.players
      .filter((p) => !p.isOfflinePlayer && p.steamId?.length === 17 && /^\d+$/.test(p.steamId))
      .map((p) => p.steamId);
    if (steamIds.length === 0) return;
    const usernames = await invoke("get_steam_usernames_command", { steamIds });
    archiveData.players.forEach((player) => {
      if (!player.isOfflinePlayer && usernames[player.steamId]) {
        player.username = usernames[player.steamId];
      }
    });
  } catch (error) {
    console.error("Fetch usernames failed:", error);
  }
};

// 层级相关
const loadLevels = () => {
  const levelMappings = [
    "Level0", "TopFloor", "MiddleFloor", "GarageLevel2", "BottomFloor", "TheHub",
    "Pipes1", "ElectricalStation", "Office", "Hotel", "Floor3", "BoilerRoom",
    "Pipes2", "LevelFun", "Poolrooms", "LevelRun", "TheEnd", "Level922", "Level94",
    "AnimatedKingdom", "LightsOut", "OceanMap", "CaveLevel", "Level05", "Level9",
    "AbandonedBase", "Level10", "Level3999", "Level07", "Snackrooms", "LevelDash",
    "Level188_Expanded", "Poolrooms_Expanded", "WaterPark_Level01_P", "WaterPark_Level02_P",
    "WaterPark_Level03_P", "LevelFun_Expanded", "Zone1_Modified", "Zone2_Modified",
    "Zone3_Baked", "Zone4", "Level52", "TunnelLevel", "Bunker", "GraffitiLevel",
    "Grassrooms_Expanded", "Level974", "LevelCheat",
  ];

  availableLevels.value = levelMappings.map((levelKey) => {
    let levelName;
    try { levelName = t(`LevelName_Display.${levelKey}`); } 
    catch { levelName = levelKey; }
    return { name: levelName, image: `/images/ETB/${levelKey}.jpg`, levelKey };
  });
};

const selectLevel = (levelKey) => {
  archiveData.currentLevel = levelKey;
};

// 玩家相关
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

  if (archiveData.players.some((p) => p.steamId === validation.processedSteamId)) {
    showMessage(t("editArchive.steamIdDuplicate", { steamId: validation.processedSteamId }), "error");
    return;
  }

  const newPlayer = {
    steamId: validation.processedSteamId,
    inventory: Array(12).fill(null),
    username: validation.isOfflinePlayer ? `${validation.processedSteamId}(本地)` : null,
    isOfflinePlayer: validation.isOfflinePlayer,
    sanity: 100,
  };

  archiveData.players.push(newPlayer);
  showMessage(t("editArchive.playerAddedSuccess"), "success");
  newSteamId.value = "";
  activePlayerIndex.value = archiveData.players.length - 1;

  if (!validation.isOfflinePlayer) {
    try {
      const usernames = await invoke("get_steam_usernames_command", { steamIds: [validation.processedSteamId] });
      if (usernames[validation.processedSteamId]) {
        archiveData.players[archiveData.players.length - 1].username = usernames[validation.processedSteamId];
      }
    } catch (e) { console.error(e); }
  }
};

const showMessage = (msg, type) => {
  playerInputMessage.value = msg;
  playerInputMessageType.value = type;
  if (messageTimeout) clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => { playerInputMessage.value = ""; }, 3000);
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
  if (steamId.length !== 17) return { valid: false, message: t("editArchive.steamIdValidationError", { error: "长度必须为17位" }) };
  return { valid: true, isOfflinePlayer: false, processedSteamId: steamId };
};

const removePlayer = (index) => {
  archiveData.players.splice(index, 1);
  if (activePlayerIndex.value >= archiveData.players.length) {
    activePlayerIndex.value = archiveData.players.length - 1;
  }
};

const selectPlayer = (index) => {
  activePlayerIndex.value = index;
  currentPlayerSanity.value = archiveData.players[index]?.sanity ?? 100;
};

const getCurrentPlayerDisplayName = () => {
  const player = archiveData.players[activePlayerIndex.value];
  if (!player) return "";
  return player.username || `玩家 ${player.steamId.substring(0, 8)}...`;
};

const getSanityClass = (val) => {
  if (val >= 80) return "sanity-high";
  if (val >= 50) return "sanity-medium";
  if (val >= 20) return "sanity-low";
  return "sanity-critical";
};

const setMaxSanity = () => { if (activePlayerIndex.value !== -1) { archiveData.players[activePlayerIndex.value].sanity = 100; currentPlayerSanity.value = 100; } };
const setMinSanity = () => { if (activePlayerIndex.value !== -1) { archiveData.players[activePlayerIndex.value].sanity = 0; currentPlayerSanity.value = 0; } };

// 背包相关
const getSlotContent = (playerIndex, slotIndex) => {
  const item = archiveData.players[playerIndex]?.inventory?.[slotIndex];
  return item && item !== "None" ? item : null;
};

const getSlotLabel = (slotIndex) => ["mainHand", "offHand1", "offHand2"][slotIndex] || "";

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
  if (archiveData.players[playerIndex]) {
    archiveData.players[playerIndex].inventory[slotIndex] = itemId;
  }
  showItemSelector.value = false;
};

const getItemIdByName = (itemName) => {
  if (!itemName || itemName === "None") return -1;
  const map = { AlmondConcentrate: 1, BugSpray: 2, Camera: 3, AlmondWater: 4, Chainsaw: 5, DivingHelmet: 6, EnergyBar: 7, Firework: 8, Flaregun: 9, Flashlight: 10, GlowstickBlue: 11, GlowStick: 12, GlowstickRed: 13, GlowstickYellow: 14, Juice: 15, LiquidPain: 16, Rope: 17, LiDAR: 18, Thermometer: 19, Ticket: 20, WalkieTalkie: 21, MothJelly: 22, Crowbar: 23, Knife: 24, Toy: 25 };
  return map[itemName] || -1;
};

const closeEdit = () => router.push({ name: "Home" });

// 解锁全部枢纽门
const unlockAllHubDoors = async () => {
  if (!originalArchive.value?.path) {
    showError(t("editArchive.noArchiveLoaded"));
    return;
  }
  
  try {
    await invoke("unlock_all_hub_doors", { filePath: originalArchive.value.path });
    showSuccess(t("editArchive.hubDoorsUnlocked"));
  } catch (error) {
    console.error("解锁枢纽门失败:", error);
    showError(String(error));
  }
};

// 监听理智值变化
watch(currentPlayerSanity, (val) => {
  if (activePlayerIndex.value !== -1 && archiveData.players[activePlayerIndex.value]) {
    const numVal = Number(val);
    archiveData.players[activePlayerIndex.value].sanity = Math.max(0, Math.min(100, isNaN(numVal) ? 100 : numVal));
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
  height: 100%;
  max-height: calc(100vh - 38px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部标题 */
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

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
.btn-secondary:hover { background: var(--hover-bg); }

/* 标签导航 - 浮动式 */
.tab-nav {
  position: relative;
  display: flex;
  gap: 4px;
  padding: 6px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  flex-shrink: 0;
}

.tab-highlight {
  position: absolute;
  top: 6px;
  left: 6px;
  height: calc(100% - 12px);
  background: var(--primary);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: white; }

/* 内容区域 */
.tab-content {
  flex: 1;
  overflow: hidden;
  padding: 24px;
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
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-right .tab-panel {
  transform: translateX(20px);
}

.slide-left .tab-panel {
  transform: translateX(-20px);
}

.tab-panel.tab-active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

/* 基础设置 */
.panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.form-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color);
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  box-sizing: border-box;
}

.form-input:focus { border-color: var(--primary); }

.difficulty-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.difficulty-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.difficulty-btn:hover { background: var(--hover-bg); }
.difficulty-btn.selected { background: rgba(0, 122, 255, 0.1); color: var(--primary); border-color: var(--primary); }

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3); }
.action-btn:active { transform: translateY(0); box-shadow: none; }

/* 层级选择 */
.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.level-card {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--card-bg);
  border: 2px solid transparent;
}

.level-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }
.level-card.selected { border-color: var(--primary); }

.level-img-wrap {
  position: relative;
  aspect-ratio: 16/9;
}

.level-img { width: 100%; height: 100%; object-fit: cover; }

.level-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--primary);
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
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

/* 玩家管理 */
.players-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  height: 100%;
  min-height: 0;
  max-height: 100%;
}

.player-list-section, .player-detail-section {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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

.player-item:hover { background: var(--hover-bg); }
.player-item.active { background: rgba(0, 122, 255, 0.1); outline: 2px solid var(--primary); }

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.player-item.active .player-avatar { background: var(--primary); color: white; }

.player-info { flex: 1; min-width: 0; }
.player-name { display: block; font-size: 13px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sanity-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.sanity-tag.sanity-high { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.sanity-tag.sanity-medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.sanity-tag.sanity-low { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.sanity-tag.sanity-critical { background: rgba(220, 38, 38, 0.15); color: #dc2626; }

.del-btn {
  opacity: 0;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.player-item:hover .del-btn { opacity: 1; }
.del-btn:hover { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }

.empty-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  padding: 40px;
}

.empty-hint svg { font-size: 36px; margin-bottom: 12px; opacity: 0.5; }
.empty-hint p { font-size: 13px; margin: 0; }

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
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.add-btn:hover { background: var(--primary-hover); }

.msg-tip {
  padding: 10px 12px;
  margin: 0 12px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.msg-tip.error { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
.msg-tip.success { background: rgba(52, 199, 89, 0.1); color: #34c759; }

/* 玩家详情 */
.player-detail-section { padding: 16px; overflow-y: auto; flex: 1; }
.player-detail-section.empty-detail { display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); }
.player-detail-section.empty-detail svg { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
.player-detail-section.empty-detail p { font-size: 13px; margin: 0; }

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
  border-radius: 10px;
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

.block-title svg { color: var(--primary); }

.sanity-display { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.sanity-num { font-size: 24px; font-weight: 700; min-width: 60px; }
.sanity-num.sanity-high { color: #10b981; }
.sanity-num.sanity-medium { color: #f59e0b; }
.sanity-num.sanity-low { color: #ef4444; }
.sanity-num.sanity-critical { color: #dc2626; }

.sanity-bar { flex: 1; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }
.sanity-fill { height: 100%; border-radius: 4px; transition: width 0.3s, background 0.4s; }
.sanity-fill.sanity-high { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.sanity-fill.sanity-medium { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.sanity-fill.sanity-low { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
.sanity-fill.sanity-critical { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); }

.sanity-ctrl { display: flex; align-items: center; gap: 12px; }
.sanity-ctrl > :first-child { flex: 1; }

.quick-btns { display: flex; gap: 6px; }
.qbtn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.qbtn.danger { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
.qbtn.danger:hover { background: rgba(255, 59, 48, 0.2); }
.qbtn.success { background: rgba(52, 199, 89, 0.1); color: #34c759; }
.qbtn.success:hover { background: rgba(52, 199, 89, 0.2); }

/* 背包 */
.inventory-wrap { display: flex; gap: 16px; }
.hand-slots { display: flex; flex-direction: column; gap: 8px; }
.backpack-slots { display: grid; grid-template-columns: repeat(3, 56px); gap: 8px; }

.inv-slot {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.inv-slot:hover { border-color: var(--primary); transform: scale(1.05); }
.inv-slot.empty { border-style: dashed; }

.slot-label { position: absolute; top: 3px; left: 3px; font-size: 8px; color: var(--text-tertiary); background: var(--bg-secondary); padding: 1px 4px; border-radius: 3px; }
.slot-num { position: absolute; top: 3px; right: 4px; font-size: 10px; font-weight: 600; color: var(--text-tertiary); }
.slot-img { width: 36px; height: 36px; object-fit: contain; }
.slot-placeholder { font-size: 18px; color: var(--text-tertiary); opacity: 0.4; }

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 响应式 */
@media (max-width: 900px) {
  .players-layout { grid-template-columns: 1fr; }
  .player-list-section { max-height: 300px; }
  .detail-grid { grid-template-columns: 1fr; }
  .page-header { flex-wrap: wrap; gap: 12px; }
  .tab-nav { order: 3; width: 100%; justify-content: center; }
}

@media (max-width: 600px) {
  .page-header { padding: 12px 16px; }
  .page-title { font-size: 16px; }
  .tab-nav { overflow-x: auto; }
  .tab-btn { padding: 6px 12px; font-size: 12px; white-space: nowrap; }
  .tab-content { padding: 16px; }
  .level-grid { grid-template-columns: repeat(2, 1fr); }
  .detail-grid { grid-template-columns: 1fr; }
  .inventory-wrap { flex-direction: column; }
  .btn-primary span, .btn-secondary span { display: none; }
  .btn-primary, .btn-secondary { padding: 8px 12px; }
}
</style>
