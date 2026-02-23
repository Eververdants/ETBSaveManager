<template>
  <div class="create-archive-container" :class="{ 'sidebar-expanded': isSidebarExpanded }">
    <!-- 步骤指示器 -->
    <div class="step-indicator">
      <!-- 左侧按钮区域 -->
      <div class="step-indicator-left">
        <!-- 返回快速模式按钮 - 只在快速模式下显示，且只在第一步显示 -->
        <button v-if="isQuickMode && currentStep === 1" class="back-to-quick-mode-btn" @click="goBackToQuickMode">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          <span>{{ $t("createArchive.backToQuickMode") }}</span>
        </button>
        <!-- 选择创建模式按钮 - 只在非快速模式下显示，且只在第一步显示 -->
        <button v-else-if="currentStep === 1" class="mode-select-button" @click="goToSelectMode">
          <font-awesome-icon :icon="['fas', 'th-large']" />
          <span>{{ $t("createMode.title") }}</span>
        </button>
      </div>

      <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <span class="step-number">{{ $t("common.step", { number: 1 }) }}</span>
        <span class="step-label">{{
          $t("createArchive.steps.selectLevel")
        }}</span>
      </div>
      <div class="step-connector"></div>
      <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <span class="step-number">{{ $t("common.step", { number: 2 }) }}</span>
        <span class="step-label">{{
          $t("createArchive.steps.configureArchive")
        }}</span>
      </div>
      <div class="step-connector"></div>
      <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
        <span class="step-number">{{ $t("common.step", { number: 3 }) }}</span>
        <span class="step-label">{{
          $t("createArchive.steps.editInventory")
        }}</span>
      </div>

      <!-- 右侧占位，保持居中 -->
      <div class="step-indicator-right"></div>
    </div>

    <!-- 主要内容区域 -->
    <div ref="contentWrapperRef" class="content-wrapper" :class="{ 'no-ending-selector': currentStep !== 1 }">
      <transition name="step-transition" mode="out-in" @enter="onStepEnter" @leave="onStepLeave">
        <div :key="currentStep" class="step-container">
          <!-- 步骤1: 选择层级 -->
          <Step1SelectLevel v-if="currentStep === 1" :selected-level="selectedLevel" :selected-ending="selectedEnding"
            :available-levels="availableLevels" :endings="endings" @select-level="selectLevel"
            @select-ending="selectEnding" />

          <!-- 步骤2: 配置存档 -->
          <Step2ConfigArchive v-else-if="currentStep === 2" v-model:archive-name="archiveName"
            :selected-game-mode="selectedGameMode" :selected-difficulty="selectedDifficulty"
            :selected-actual-difficulty="selectedActualDifficulty" :difficulty-levels="difficultyLevels"
            @select-difficulty="selectDifficulty" @select-actual-difficulty="selectActualDifficulty" />

          <!-- 步骤3: 编辑背包 -->
          <Step3EditInventory v-else-if="currentStep === 3" v-model:new-steam-id="newSteamId" :players="players"
            :active-player-index="activePlayerIndex" :player-input-message="playerInputMessage"
            :player-input-message-type="playerInputMessageType" @add-steam-id="addSteamId" @remove-player="removePlayer"
            @select-player="selectPlayer" @edit-slot="editSlot" @update-player-sanity="updatePlayerSanity" />
        </div>
      </transition>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button @click="previousStep" class="action-button secondary" :disabled="currentStep === 1">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
        {{ $t("createArchive.previous") }}
      </button>

      <div class="step-info">
        {{ $t("createArchive.step") }}
        <transition name="step-info-change" mode="out-in">
          <span :key="currentStep">{{ currentStep }}</span>
        </transition>
        / 3
      </div>

      <button @click="nextStep" class="action-button primary" :disabled="!canProceed">
        <template v-if="currentStep === 3 && isCreating">
          {{ $t("createArchive.creating") }}
          <font-awesome-icon :icon="['fas', 'spinner']" spin />
        </template>
        <template v-else-if="currentStep === 3 && isQuickMode">
          {{ $t("createArchive.finish") }}
          <font-awesome-icon :icon="['fas', 'check']" />
        </template>
        <template v-else>
          {{
            currentStep === 3
              ? $t("createArchive.createArchive")
              : $t("createArchive.next")
          }}
          <font-awesome-icon :icon="['fas', currentStep === 3 ? 'check' : 'arrow-right']" />
        </template>
      </button>
    </div>

    <!-- 物品选择器 -->
    <InventoryItemSelector :visible="showItemSelector" :selected-item="selectedItem" @select="handleItemSelect"
      @update:visible="showItemSelector = $event" />

    <!-- 创建成功弹窗 -->
    <Teleport to="body">
      <Transition name="success-modal">
        <div v-if="showSuccessModal" class="success-modal-overlay" @click.self="closeSuccessModal">
          <div class="success-modal-card">
            <div class="success-modal-icon-circle">
              <svg class="success-modal-check-mark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </div>
            <h2 class="success-modal-title">{{ $t("createArchive.archiveCreated") }}</h2>
            <p class="success-modal-subtitle">{{ $t("createArchive.archiveCreatedMessage") }}</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  onActivated,
  nextTick,
  watch,
} from "vue";
import { gsap } from "gsap";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import InventoryItemSelector from "@/components/InventoryItemSelector.vue";
import { notify } from "@/services/notificationService";
import Step1SelectLevel from "./Step1SelectLevel.vue";
import Step2ConfigArchive from "./Step2ConfigArchive.vue";
import Step3EditInventory from "./Step3EditInventory.vue";

export default {
  name: "CreateArchive",
  components: {
    InventoryItemSelector,
    Step1SelectLevel,
    Step2ConfigArchive,
    Step3EditInventory,
  },
  setup() {
    const { t, te } = useI18n({ useScope: "global" });
    const router = useRouter();
    const route = useRoute();

    const getLevelName = (levelKey) => {
      const translationKey = `LevelName_Display.${levelKey}`;
      return te(translationKey) ? t(translationKey) : levelKey;
    };

    // 检测是否从快速模式进入
    const isQuickMode = computed(() => route.query.quickMode === "true");
    const currentStep = ref(1);
    const previousStepValue = ref(1);
    const selectedLevel = ref(-1);
    const selectedEnding = ref(0);
    const archiveName = ref("");
    const selectedGameMode = ref("multiplayer");
    const selectedDifficulty = ref("normal");
    const selectedActualDifficulty = ref("normal");
    const newSteamId = ref("");
    const activePlayerIndex = ref(-1);
    const showItemSelector = ref(false);
    const showSuccessModal = ref(false);
    const contentWrapperRef = ref(null);
    const editingSlot = ref({ playerIndex: -1, slotIndex: -1 });
    const selectedItem = computed(() => {
      const { playerIndex, slotIndex } = editingSlot.value;
      const item = players[playerIndex]?.inventory?.[slotIndex];
      if (!item || item === "None") return null;
      return item;
    });
    const isSwitching = ref(false);
    const isCreating = ref(false);
    const playerInputMessage = ref("");
    const playerInputMessageType = ref("");
    const availableLevels = reactive([]);
    const players = reactive([]);
    let successModalTimer = null;

    // 结局数据 - 存储 levels 数据
    const endingLevelsData = reactive({
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    });

    // 结局数据 - 使用 computed 实现语言响应式
    const endings = computed(() => [
      {
        id: 0,
        label: t("createArchive.endings.main"),
        icon: "🏆",
        levels: endingLevelsData[0],
      },
      {
        id: 1,
        label: t("createArchive.endings.branch1"),
        icon: "🔍",
        levels: endingLevelsData[1],
      },
      {
        id: 2,
        label: t("createArchive.endings.branch2"),
        icon: "🔬",
        levels: endingLevelsData[2],
      },
      {
        id: 3,
        label: t("createArchive.endings.branch3"),
        icon: "🌟",
        levels: endingLevelsData[3],
      },
    ]);

    const gameModes = [{ value: "multiplayer", label: "multiplayer" }];

    const difficultyLevels = [
      { value: "easy", label: "easy", icon: ["fas", "smile"] },
      { value: "normal", label: "normal", icon: ["fas", "meh"] },
      { value: "hard", label: "hard", icon: ["fas", "frown"] },
      { value: "nightmare", label: "nightmare", icon: ["fas", "skull"] },
    ];

    const canProceed = computed(() => {
      if (isCreating.value) return false;
      switch (currentStep.value) {
        case 1:
          return selectedLevel.value !== -1;
        case 2:
          return (
            archiveName.value.trim() !== "" && !archiveName.value.includes("_")
          );
        case 3:
          return true;
        default:
          return true;
      }
    });

    watch(selectedEnding, () => { });

    const selectDifficulty = (difficulty) => {
      selectedDifficulty.value = difficulty;
    };
    const selectActualDifficulty = (difficulty) => {
      selectedActualDifficulty.value = difficulty;
    };

    const selectEnding = async (index) => {
      if (selectedEnding.value === index) return;
      selectedEnding.value = index;
      selectedLevel.value = -1;
      await nextTick();
      loadLevelsForEnding(index);
      await nextTick();
    };

    const goToSelectMode = () => {
      router.push("/select-create-mode");
    };

    const goBackToQuickMode = () => {
      // 清除 sessionStorage 中的状态数据
      sessionStorage.removeItem("quickModeArchiveConfig");
      sessionStorage.removeItem("quickModeCurrentState");
      router.push("/quick-create-archive");
    };

    const loadLevels = async () => {
      endingLevelsData[0] = [
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
      ];
      endingLevelsData[1] = ["Bunker", "GraffitiLevel", "Grassrooms_Expanded"];
      endingLevelsData[2] = ["Bunker", "TheHub", "BottomFloor", "Level922"];
      endingLevelsData[3] = [
        "Bunker",
        "TheHub",
        "OceanMap",
        "LightsOut",
        "Level974",
      ];
      loadLevelsForEnding(0);
    };

    const loadLevelsForEnding = async (endingIndex) => {
      const endingLevels = endings.value[endingIndex].levels;
      const newLevels = endingLevels.map((levelKey) => ({
        name: getLevelName(levelKey),
        image: `/images/ETB/${levelKey}.jpg`,
        levelKey: levelKey,
      }));
      availableLevels.splice(0, availableLevels.length, ...newLevels);
    };

    const selectLevel = (index) => {
      selectedLevel.value = index;
      // 动画已移至 Step1SelectLevel 组件中处理
    };

    const validateSteamId = (steamId) => {
      if (!steamId || steamId.trim() === "") {
        return { valid: false, message: t("createArchive.steamIdRequired") };
      }
      if (steamId.includes("-")) {
        const parts = steamId.split("-");
        if (
          parts.length === 2 &&
          parts[0].length === 5 &&
          parts[1].length === 15
        ) {
          return {
            valid: true,
            isOfflinePlayer: true,
            processedSteamId: parts[0],
          };
        }
        return { valid: false, message: t("createArchive.steamIdInvalid") };
      }
      if (!/^\d+$/.test(steamId)) {
        return { valid: false, message: t("createArchive.steamIdInvalid") };
      }
      if (steamId.length !== 17) {
        return {
          valid: false,
          message: t("createArchive.steamIdValidationError", {
            error: t("createArchive.steamIdLengthError"),
          }),
        };
      }
      return { valid: true, isOfflinePlayer: false, processedSteamId: steamId };
    };

    const showPlayerMessage = (message, type = "success") => {
      playerInputMessage.value = message;
      playerInputMessageType.value = type;
      setTimeout(() => {
        playerInputMessage.value = "";
        playerInputMessageType.value = "";
      }, 3000);
    };

    const addSteamId = async () => {
      const steamId = newSteamId.value.trim();
      if (!steamId) return;
      const validation = validateSteamId(steamId);
      if (!validation.valid) {
        showPlayerMessage(validation.message, "error");
        return;
      }
      const isDuplicate = players.some(
        (player) => player.steamId === validation.processedSteamId
      );
      if (isDuplicate) {
        showPlayerMessage(
          t("createArchive.steamIdDuplicate", {
            steamId: validation.processedSteamId,
          }),
          "error"
        );
        return;
      }
      const newPlayer = {
        steamId: validation.processedSteamId,
        inventory: Array(12).fill(null),
        username: validation.isOfflinePlayer
          ? `${validation.processedSteamId}(本地)`
          : null,
        isOfflinePlayer: validation.isOfflinePlayer,
        sanity: 100,
      };
      players.push(newPlayer);
      newSteamId.value = "";
      if (activePlayerIndex.value === -1) activePlayerIndex.value = 0;
      showPlayerMessage(t("createArchive.playerAddedSuccess"), "success");
      if (!validation.isOfflinePlayer) await fetchSteamUsernames();
    };

    const removePlayer = (index) => {
      players.splice(index, 1);
      if (activePlayerIndex.value >= players.length)
        activePlayerIndex.value = players.length - 1;
    };

    const selectPlayer = (index) => {
      activePlayerIndex.value = index;
    };

    const updatePlayerSanity = ({ playerIndex, sanity }) => {
      if (playerIndex < 0 || playerIndex >= players.length) return;
      const val = Number(sanity);
      players[playerIndex].sanity = Number.isFinite(val)
        ? Math.max(0, Math.min(100, val))
        : 100;
    };

    const getItemIdByName = (itemName) => {
      const itemMap = {
        AlmondConcentrate: 1,
        Lockpick: 2,
        Bandage: 3,
        Flashlight: 4,
        StaminaPills: 5,
        MedKit: 6,
        NutritionBar: 7,
        Coin: 8,
        Batteries: 9,
        Syringe: 10,
        Bone: 11,
        Key: 12,
        Code: 13,
        Glowstick: 14,
        OxygenMask: 15,
        Grapple: 16,
        Soda: 17,
        Beacon: 18,
        Radio: 19,
        Tea: 20,
        HealingPotion: 21,
        SpeedBoost: 22,
        InvisibilityPotion: 23,
        Knife: 24,
        Toy: 25,
      };
      return itemMap[itemName] || 1;
    };

    const editSlot = (playerIndex, slotIndex) => {
      if (playerIndex >= 0 && playerIndex < players.length) {
        editingSlot.value = { playerIndex, slotIndex };
        showItemSelector.value = true;
      }
    };

    const handleItemSelect = (itemId) => {
      if (
        editingSlot.value.playerIndex >= 0 &&
        editingSlot.value.slotIndex >= 0
      ) {
        const { playerIndex, slotIndex } = editingSlot.value;
        if (players[playerIndex] && players[playerIndex].inventory) {
          players[playerIndex].inventory[slotIndex] = itemId;
        }
      }
      editingSlot.value = { playerIndex: -1, slotIndex: -1 };
      showItemSelector.value = false;
    };

    const resetForm = () => {
      currentStep.value = 1;
      selectedLevel.value = -1;
      selectedEnding.value = 0;
      archiveName.value = "";
      selectedGameMode.value = "multiplayer";
      selectedDifficulty.value = "normal";
      selectedActualDifficulty.value = "normal";
      newSteamId.value = "";
      activePlayerIndex.value = -1;
      players.splice(0, players.length);
      isCreating.value = false;
      loadLevelsForEnding(0);
    };

    // 步骤切换方向：1 = 前进（向左滑出），-1 = 后退（向右滑出）
    const stepDirection = ref(1);

    const nextStep = () => {
      if (currentStep.value < 3 && canProceed.value) {
        stepDirection.value = 1; // 前进方向
        previousStepValue.value = currentStep.value;
        currentStep.value++;
      } else if (currentStep.value === 3) {
        // 如果是快速模式，将配置数据传回快速模式页面
        if (isQuickMode.value) {
          finishAndReturnToQuickMode();
        } else {
          createArchive();
        }
      }
    };

    /**
     * 完成配置并返回快速模式
     * 将当前配置的存档数据传回快速模式页面
     */
    const finishAndReturnToQuickMode = () => {
      const selectedLevelData = availableLevels[selectedLevel.value];

      // 构建存档配置数据
      const archiveConfig = {
        name: archiveName.value.trim() || "未命名存档",
        level: selectedLevelData?.levelKey || null,
        difficulty: selectedDifficulty.value,
        actualDifficulty: selectedActualDifficulty.value,
        players: players.map((p) => ({
          steamId: p.steamId,
          inventory: [...p.inventory],
          username: p.username,
          isOfflinePlayer: p.isOfflinePlayer,
        })),
        ending: selectedEnding.value,
      };

      // 将配置数据存储到 sessionStorage，供快速模式页面读取
      sessionStorage.setItem(
        "quickModeArchiveConfig",
        JSON.stringify(archiveConfig)
      );

      // 跳转回快速模式页面
      router.push("/quick-create-archive");
    };

    const previousStep = () => {
      if (currentStep.value > 1) {
        stepDirection.value = -1; // 后退方向
        previousStepValue.value = currentStep.value;
        currentStep.value--;
      }
    };

    const fetchSteamUsernames = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const steamIds = players
          .filter(
            (p) =>
              !p.isOfflinePlayer &&
              p.steamId?.length === 17 &&
              /^\d+$/.test(p.steamId)
          )
          .map((p) => p.steamId);
        if (steamIds.length === 0) return;
        const usernames = await invoke("get_steam_usernames_command", {
          steamIds,
        });
        players.forEach((player) => {
          if (!player.isOfflinePlayer && usernames[player.steamId]) {
            player.username = usernames[player.steamId];
          }
        });
      } catch (error) {
        console.error("获取Steam用户名失败:", error);
        let errorMessage = error.toString();
        let userFriendlyMessage = "";
        if (
          errorMessage.includes("403") ||
          errorMessage.includes("Forbidden")
        ) {
          userFriendlyMessage = t("createArchive.steamApiKeyInvalid");
        } else if (
          errorMessage.includes("429") ||
          errorMessage.includes("Too Many Requests")
        ) {
          userFriendlyMessage = t("createArchive.steamApiRateLimit");
        } else if (errorMessage.includes("Steam API密钥未配置")) {
          userFriendlyMessage = t("createArchive.steamApiKeyNotConfigured");
        } else {
          userFriendlyMessage = t("createArchive.steamIdValidationError", {
            error: errorMessage,
          });
        }
        notify.error(userFriendlyMessage);
      }
    };

    const loadJsonFile = async (filename) => {
      try {
        const response = await fetch(`/${filename}`);
        if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error(`读取 ${filename} 失败:`, error);
        return null;
      }
    };

    const createArchive = async () => {
      if (isCreating.value) return;
      try {
        isCreating.value = true;
        const selectedLevelData = availableLevels[selectedLevel.value];
        if (!selectedLevelData) {
          notify.error(t("createArchive.selectLevelRequired"));
          isCreating.value = false;
          return;
        }
        const basicArchive = await loadJsonFile("BasicArchive.json");
        if (!basicArchive) {
          notify.error(t("createArchive.loadTemplateFailed"));
          isCreating.value = false;
          return;
        }
        const isMainEnding = selectedEnding.value === 0;
        const megLevels = [
          "Level0",
          "TopFloor",
          "MiddleFloor",
          "GarageLevel2",
          "BottomFloor",
          "TheHub",
        ];
        const isMEGUnlocked = !megLevels.includes(selectedLevelData.levelKey);
        const saveData = {
          archive_name: archiveName.value.trim() || "未命名存档",
          level: selectedLevelData.levelKey || "Level0",
          game_mode: "multiplayer",
          difficulty:
            selectedDifficulty.value.charAt(0).toUpperCase() +
            selectedDifficulty.value.slice(1) || "Normal",
          actual_difficulty:
            selectedActualDifficulty.value.charAt(0).toUpperCase() +
            selectedActualDifficulty.value.slice(1) || "Normal",
          players: players.map((p) => ({
            steam_id: p.steamId || "",
            inventory: Array.isArray(p.inventory)
              ? p.inventory
                .filter((item) => item !== null && item !== undefined)
                .map((item) => getItemIdByName(item))
              : [],
            sanity: typeof p.sanity === "number" ? p.sanity : 100,
          })),
          basic_archive: basicArchive || {},
          main_ending: !isMainEnding,
          meg_unlocked: isMEGUnlocked,
        };
        if (!saveData.archive_name) {
          notify.error(t("createArchive.enterArchiveName"));
          isCreating.value = false;
          return;
        }
        if (!saveData.level) {
          notify.error(t("createArchive.selectLevelRequired"));
          isCreating.value = false;
          return;
        }
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("handle_new_save", { saveData });
        createParticleExplosion();
        openSuccessModal();
      } catch (error) {
        console.error("创建存档失败:", error);
        notify.error(t("createArchive.createFailed", { error: error.message || "未知错误" }));
        isCreating.value = false;
      }
    };

    const createParticleExplosion = () => {
      const colors = ["#00d4aa", "#007aff", "#ff3b30", "#ff9500", "#af52de"];
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement("div");
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 6 + 3;
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 50;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 50;
        particle.style.cssText = `position:fixed;width:${size}px;height:${size}px;background:${color};left:${x}px;top:${y}px;border-radius:50%;pointer-events:none;z-index:999;`;
        document.body.appendChild(particle);
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 50;
        gsap.to(particle, {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: 0,
          opacity: 0,
          duration: 0.8,
          ease: "power1.out",
          onComplete: () => {
            document.body.removeChild(particle);
          },
        });
      }
    };

    const clearSuccessModalTimer = () => {
      if (successModalTimer) {
        clearTimeout(successModalTimer);
        successModalTimer = null;
      }
    };

    const finishCreateFlow = () => {
      clearSuccessModalTimer();
      showSuccessModal.value = false;

      const stepsWrapper = contentWrapperRef.value;
      if (!stepsWrapper) {
        resetForm();
        isCreating.value = false;
        return;
      }

      gsap.killTweensOf(stepsWrapper);
      gsap.to(stepsWrapper, {
        x: "150%",
        opacity: 0,
        duration: 0.25,
        ease: "power1.in",
        onComplete: () => {
          resetForm();
          gsap.set(stepsWrapper, { x: "-150%", opacity: 0 });
          gsap.to(stepsWrapper, {
            x: "0%",
            opacity: 1,
            duration: 0.35,
            ease: "power1.out",
            onComplete: () => {
              isCreating.value = false;
            },
          });
        },
      });
    };

    const openSuccessModal = () => {
      clearSuccessModalTimer();
      showSuccessModal.value = true;
      successModalTimer = setTimeout(() => {
        finishCreateFlow();
      }, 1400);
    };

    const closeSuccessModal = () => {
      finishCreateFlow();
    };

    const isSidebarExpanded = ref(false);
    const handleSidebarExpand = (event) => {
      isSidebarExpanded.value = event.detail;
      updateBottomActionsPosition();
    };

    const updateBottomActionsPosition = () => {
      const bottomActions = document.querySelector(".bottom-actions");
      if (bottomActions) {
        const sidebarWidth = isSidebarExpanded.value ? 220 : 70;
        bottomActions.style.left = `calc(50% + ${sidebarWidth / 2}px)`;
      }
    };

    onMounted(async () => {
      // 进入页面时重置所有状态，确保从第一步开始
      resetForm();
      await loadLevels();
      window.addEventListener("sidebar-expand", handleSidebarExpand);
      if (players.length > 0) await fetchSteamUsernames();
      updateBottomActionsPosition();
    });

    // 由于路由设置了 keepAlive，组件会被缓存
    // 使用 onActivated 确保每次进入页面时都重置状态
    onActivated(() => {
      resetForm();
    });

    onUnmounted(() => {
      window.removeEventListener("sidebar-expand", handleSidebarExpand);
      clearSuccessModalTimer();
    });

    const onStepEnter = (el, done) => {
      // 前进时从右边进入，后退时从左边进入
      const fromX = stepDirection.value === 1 ? 30 : -30;
      gsap.fromTo(
        el,
        { opacity: 0, xPercent: fromX * 0.5 },
        {
          opacity: 1,
          xPercent: 0,
          duration: 0.2,
          ease: "power1.out",
          onComplete: done,
        }
      );
    };

    const onStepLeave = (el, done) => {
      // 直接淡出，不做位移，避免布局问题
      gsap.to(el, {
        opacity: 0,
        duration: 0.15,
        ease: "power1.in",
        onComplete: done,
      });
    };

    return {
      currentStep,
      previousStep,
      selectedLevel,
      selectedEnding,
      availableLevels,
      endings,
      archiveName,
      selectedGameMode,
      selectedDifficulty,
      selectedActualDifficulty,
      gameModes,
      difficultyLevels,
      newSteamId,
      players,
      activePlayerIndex,
      playerInputMessage,
      playerInputMessageType,
      isSidebarExpanded,
      isSwitching,
      isCreating,
      showItemSelector,
      showSuccessModal,
      contentWrapperRef,
      selectedItem,
      editingSlot,
      canProceed,
      isQuickMode,
      selectLevel,
      selectEnding,
      addSteamId,
      removePlayer,
      selectPlayer,
      updatePlayerSanity,
      editSlot,
      handleItemSelect,
      nextStep,
      previousStep,
      createArchive,
      resetForm,
      goToSelectMode,
      goBackToQuickMode,
      onStepEnter,
      onStepLeave,
      stepDirection,
      selectDifficulty,
      selectActualDifficulty,
      fetchSteamUsernames,
      finishAndReturnToQuickMode,
      closeSuccessModal,
    };
  },
};
</script>

<style scoped>
.create-archive-container {
  height: calc(100vh - 38px);
  overflow: hidden;
  padding: 10px 24px 0 24px;
  background: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, "San Francisco",
    "Helvetica Neue", sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  gap: 16px;
  position: relative;
}

/* 左右两侧占位区域 */
.step-indicator-left,
.step-indicator-right {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  min-width: 180px;
}

.step-indicator-left {
  left: 0;
}

.step-indicator-right {
  right: 0;
}

/* 返回快速模式按钮 */
.back-to-quick-mode-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-to-quick-mode-btn:hover {
  background: var(--bg-hover);
  color: var(--accent-color);
  border-color: var(--accent-color);
  transform: translateX(-2px);
}

.back-to-quick-mode-btn svg {
  font-size: 12px;
}

/* 选择创建模式按钮 */
.mode-select-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--divider-light);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-select-button:hover {
  background: var(--bg-hover);
  color: var(--accent-color);
  border-color: var(--accent-color);
  transform: translateX(-2px);
}

.mode-select-button svg {
  font-size: 12px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 18px;
  background: var(--bg-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.step.active {
  background: var(--accent-color);
  color: white;
  transform: scale(1.05);
}

.step.completed {
  background: var(--success-color);
  color: white;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.step.active .step-number {
  background: rgba(255, 255, 255, 0.3);
}

.step-label {
  font-size: 14px;
  font-weight: 500;
}

.step-connector {
  width: 40px;
  height: 2px;
  background: var(--divider-color);
  border-radius: 1px;
}

.content-wrapper {
  width: 100%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  height: calc(100vh - 248px);
  padding: 0 20px;
  padding-bottom: 100px;
  /* 为悬浮底部操作栏留出空间 */
  box-sizing: border-box;
  position: relative;
}

.content-wrapper.no-ending-selector {
  height: calc(100vh - 178px);
  padding-bottom: 100px;
  /* 为悬浮底部操作栏留出空间 */
}

.step-container {
  height: 100%;
  width: 100%;
}

.bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 48px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 20px;
  position: fixed;
  bottom: 16px;
  left: calc(50% + 35px);
  transform: translateX(-50%);
  width: calc(100% - 88px);
  max-width: 1200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  z-index: 100;
  transition: left 0.3s ease;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button.primary {
  background: var(--accent-color);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

.action-button.secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-button.secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-info {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.step-info {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.step-info span {
  font-weight: 600;
  color: var(--accent-color);
}

.step-info-change-enter-active,
.step-info-change-leave-active {
  transition: all 0.2s ease;
}

.step-info-change-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.step-info-change-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 步骤切换动画由 gsap 控制 */
.step-transition-enter-active,
.step-transition-leave-active {
  will-change: transform, opacity;
}

/* 创建成功弹窗 */
.success-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  backdrop-filter: blur(4px);
}

.success-modal-card {
  min-width: 320px;
  max-width: min(92vw, 520px);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border: 1px solid var(--divider-light);
  border-radius: 20px;
  padding: 32px 28px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
}

.success-modal-icon-circle {
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--success-color), #00d4aa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 28px rgba(0, 212, 170, 0.35);
}

.success-modal-check-mark {
  width: 30px;
  height: 30px;
}

.success-modal-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.success-modal-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
}

.success-modal-enter-active,
.success-modal-leave-active {
  transition: opacity 0.2s ease;
}

.success-modal-enter-active .success-modal-card,
.success-modal-leave-active .success-modal-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.success-modal-enter-from,
.success-modal-leave-to {
  opacity: 0;
}

.success-modal-enter-from .success-modal-card,
.success-modal-leave-to .success-modal-card {
  transform: scale(0.94);
  opacity: 0;
}

@media (max-width: 768px) {
  .step-indicator {
    flex-wrap: wrap;
    gap: 8px;
  }

  .step {
    padding: 8px 12px;
  }

  .step-label {
    font-size: 12px;
  }

  .step-connector {
    width: 20px;
  }

  .bottom-actions {
    flex-direction: column;
    gap: 12px;
    width: calc(100% - 32px);
    left: 50%;
    transform: translateX(-50%);
    bottom: 16px;
    padding: 16px;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
