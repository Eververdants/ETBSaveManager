<template>
  <Search
    :light-mode="lightMode ? true : false"
    ref="searchButtonRef"
    @search="handleSearch"
  />

  <DeleteConfirm
    v-if="showDeleteConfirm"
    :archive="selectedArchiveForDelete"
    :light-mode="lightMode"
    @confirm="handleDeleteConfirm"
    @cancel="showDeleteConfirm = false"
  />

  <!-- 在主页中使用 -->
  <EditArchiveModal
    v-if="showEditModal"
    :show="showEditModal"
    :archive="editingArchive"
    :lightMode="lightMode"
    :player-options="playerOptions"
    :player-inventory="editingArchive.playerInventory"
    :player-sanity="editingArchive.playerSanity"
    @update:show="showEditModal = $event"
    @save="handleSaveEdit"
  />
  <div class="glass-scroll-container">
    <div class="glass-scroll-content" ref="glassScrollContentRef">
      <div class="cards-container" :data-theme="lightMode ? 'light' : 'dark'">
        <Card
          v-for="archive in archives"
          :key="archive.id"
          :archive="archive"
          :file-path="archive.path"
          :lightMode="lightMode"
          @delete="handleDelete"
          @update-archive="updateArchive"
          @edit="handleEdit"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watchEffect } from "vue";
import gsap from "gsap";
import Card from "../components/LG_Card.vue";
import Search from "../components/LG_Search.vue";
import DeleteConfirm from "../components/LG_DeleteConfirm.vue";
import EditArchiveModal from "../components/LG_EditModal.vue";
import { invoke } from "@tauri-apps/api/core";
import { itemOptions } from "../utils/constants.js";

export default {
  components: {
    Card,
    Search,
    DeleteConfirm,
    EditArchiveModal,
  },
  setup() {
    const lightMode = ref(true);
    const archives = ref([]);
    const searchButtonRef = ref(null);
    const glassScrollContentRef = ref(null);
    const showDeleteConfirm = ref(false);
    const selectedArchiveForDelete = ref(null);
    const originalArchives = ref([]);
    const showEditModal = ref(false);
    const editingArchive = ref(null);
    const playerOptions = ref(null);

    const loadTranslations = async () => {
      try {
        const response = await fetch("/locales/zh-CN/zh-CN.json");
        if (!response.ok) throw new Error("Failed to load language file.");
        return await response.json();
      } catch (err) {
        console.error("Error: Failed to load language file:", err);
        return {};
      }
    };

    const loadSaves = async () => {
      try {
        const [saves, translations] = await Promise.all([
          invoke("load_all_saves"),
          loadTranslations(),
        ]);

        const levelNames = translations?.LevelName || {};

        archives.value = saves.map((save) => ({
          id: save.id,
          name: save.name,
          difficulty: save.difficulty,
          difficultyClass: save.difficulty_class,
          actualDifficulty: save.actual_difficulty,
          mode: save.mode,
          date: save.date,
          currentLevel: levelNames[save.current_level] || save.current_level,
          hidden: save.hidden,
          path: save.path,
        }));

        originalArchives.value = [...archives.value];
      } catch (err) {
        console.error("Error: Failed to load save file:", err);
      }
    };

    // 更新玩家背包和相关状态
    const handleEdit = async (archive) => {
      try {
        const playerData = await invoke("get_player_data", {
          filePath: archive.path,
        });

        console.log("Player Data:", playerData);

        const { ids, inventories, sanities } = playerData;

        playerOptions.value = ids.map((id) => ({
          value: id,
          label: id,
        }));

        const newPlayerInventory = {};
        inventories.forEach((inventory, playerIndex) => {
          const key = ids[playerIndex];

          // 保证每个玩家都有12个格子，缺失的填"None"
          const validInventory = Array.from({ length: 12 }, (_, i) => {
            if (inventory && Array.isArray(inventory) && i in inventory) {
              return inventory[i];
            }
            return "None";
          });

          newPlayerInventory[key] = validInventory.map((itemId, slotIndex) => {
            let item = null;

            // 物品映射表
            const nameMap = {
              Flashlight: "手电筒",
              AlmondConcentrate: "浓缩杏仁水",
              BugSpray: "杀虫剂",
              Camera: "摄像机",
              AlmondWater: "杏仁水",
              Chainsaw: "电锯",
              DivingHelmet: "潜水头盔",
              EnergyBar: "能量棒",
              Firework: "烟花",
              FlareGun: "信号枪",
              GlowStickBlue: "蓝色荧光棒",
              GlowStickGreen: "绿色荧光棒",
              GlowStickRed: "红色荧光棒",
              GlowStickYellow: "黄色荧光棒",
              Juice: "果汁",
              LiquidPain: "液体痛苦",
              Rope: "绳索",
              Scanner: "扫描仪",
              Thermometer: "温度计",
              Ticket: "票",
              WalkieTalkie: "对讲机",
              WaxBar: "飞蛾果冻",
              Crowbar: "撬棍",
            };

            const chineseName = nameMap[itemId] || itemId;

            if (itemId && itemId !== "None") {
              const foundItem = itemOptions.find((i) => i.name === chineseName);
              if (foundItem) {
                item = { ...foundItem };
              }
            }

            // 自定义 position 映射规则
            let row, col;
            if (slotIndex < 3) {
              // 第1~3格：(1,1), (2,1), (3,1)
              row = slotIndex + 1;
              col = 1;
            } else {
              // 第4~12格：按列优先排列
              const adjustedIndex = slotIndex - 3; // 从0开始计算
              const colGroup = Math.floor(adjustedIndex / 3); // 每列3个
              const rowInCol = adjustedIndex % 3; // 行号(0~2)

              row = rowInCol + 1;
              col = colGroup + 2; // 从第2列开始
            }

            return {
              id: slotIndex,
              item: item,
              position: [row, col],
            };
          });
        });

        const newPlayerSanity = {};
        sanities.forEach((sanity, playerIndex) => {
          const steamId = ids[playerIndex]; // 获取对应的 Steam ID
          if (steamId) {
            newPlayerSanity[steamId] = parseFloat(sanity.toFixed(1));
          }
        });

        editingArchive.value = {
          ...archive,
          playerInventory: newPlayerInventory,
          playerSanity: newPlayerSanity,
          selectedPlayer: ids[0], // 使用 Steam ID
        };

        showEditModal.value = true;
      } catch (err) {
        console.error("Error fetching player data:", err);
      }
    };

    // 处理保存编辑
    const handleSaveEdit = (editedArchive) => {
      // 更新存档逻辑...
      console.log("保存编辑:", editedArchive);
    };

    const updateArchive = (updatedArchive) => {
      const index = archives.value.findIndex((a) => a.id === updatedArchive.id);
      if (index !== -1) {
        archives.value.splice(index, 1, updatedArchive);
      }
    };

    const handleSearch = (searchParams) => {
      let filtered = [...originalArchives.value];

      // 难度映射表：将英文标识符映射为中文标签
      const difficultyLabelMap = {
        Easy: "简单难度",
        Normal: "普通难度",
        Hard: "困难难度",
        Nightmare: "噩梦难度",
      };

      // 模式映射表：英文标识符 → 中文标签
      const modeLabelMap = {
        Singleplayer: "单人模式",
        Multiplayer: "多人模式",
      };

      // ✅ 仅根据【存档名称】进行关键词搜索
      if (searchParams.query) {
        const query = searchParams.query.trim().toLowerCase();
        if (query) {
          filtered = filtered.filter((archive) =>
            archive.name.toLowerCase().includes(query)
          );
        }
      }

      // 难度筛选：使用映射表进行中英文转换后比对
      if (searchParams.difficulty) {
        const targetLabel = difficultyLabelMap[searchParams.difficulty];
        if (targetLabel) {
          filtered = filtered.filter(
            (archive) => archive.difficulty === targetLabel
          );
        }
      }

      // 游戏模式筛选：使用映射表进行中英文转换后比对
      if (searchParams.mode) {
        const targetLabel = modeLabelMap[searchParams.mode];
        if (targetLabel) {
          filtered = filtered.filter((archive) => archive.mode === targetLabel);
        }
      }

      // 存档状态筛选
      if (searchParams.status) {
        const isHidden = searchParams.status === "hidden";
        filtered = filtered.filter((archive) => archive.hidden === isHidden);
      }

      // 排序
      switch (searchParams.sortBy) {
        case "default":
          // 使用原始顺序（即后端传来的顺序）
          filtered.sort((a, b) => {
            const indexA = originalArchives.value.indexOf(a);
            const indexB = originalArchives.value.indexOf(b);
            return indexA - indexB;
          });
          break;

        case "name":
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;

        case "difficulty": {
          const difficultyOrder = [
            "简单难度",
            "普通难度",
            "困难难度",
            "噩梦难度",
          ];
          filtered.sort(
            (a, b) =>
              difficultyOrder.indexOf(a.difficulty) -
              difficultyOrder.indexOf(b.difficulty)
          );
          break;
        }

        case "date":
        default:
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      archives.value = filtered;
    };

    const handleDelete = (archiveId) => {
      const archive = archives.value.find((a) => a.id === archiveId);
      if (!archive) return;

      selectedArchiveForDelete.value = archive;
      showDeleteConfirm.value = true;
    };

    const handleDeleteConfirm = async () => {
      const archive = selectedArchiveForDelete.value;
      if (!archive) return;

      try {
        await invoke("delete_file", { filePath: archive.path });
        // 从两个列表中删除
        originalArchives.value = originalArchives.value.filter(
          (a) => a.id !== archive.id
        );
        archives.value = archives.value.filter((a) => a.id !== archive.id);
      } catch (err) {
        console.error("删除文件失败:", err);
      } finally {
        showDeleteConfirm.value = false;
        selectedArchiveForDelete.value = null;
      }
    };

    const handleScroll = () => {
      const container = glassScrollContentRef.value;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      const bottomThreshold = scrollHeight - clientHeight * 1.15;

      if (searchButtonRef.value && searchButtonRef.value.$el) {
        const buttonEl = searchButtonRef.value.$el;

        if (scrollTop >= bottomThreshold) {
          gsap.to(buttonEl, {
            duration: 0.3,
            scale: 0.7,
            y: -40,
            opacity: 0.8,
            ease: "power2.out",
          });
        } else {
          gsap.to(buttonEl, {
            duration: 0.3,
            scale: 1,
            y: 0,
            opacity: 1,
            ease: "power2.out",
          });
        }
      }
    };

    onMounted(async () => {
      await loadSaves();

      if (glassScrollContentRef.value) {
        glassScrollContentRef.value.addEventListener("scroll", handleScroll);
      }
    });

    onUnmounted(() => {
      if (glassScrollContentRef.value) {
        glassScrollContentRef.value.removeEventListener("scroll", handleScroll);
      }
    });

    return {
      lightMode,
      archives,
      loadSaves,
      handleDelete,
      searchButtonRef,
      showDeleteConfirm,
      selectedArchiveForDelete,
      handleDeleteConfirm,
      handleSearch,
      updateArchive,
      showEditModal,
      editingArchive,
      handleEdit,
      handleSaveEdit,
      playerOptions,
    };
  },
};
</script>

<style scoped>
.card {
  position: relative;
  left: 10px;
}

.cards-container {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: clamp(10px, 5%, 25px); /* 动态调整间距 */
  width: 90%;
  height: 90vh;
  margin: 0 auto;
  padding: 20px;
  justify-content: center;
  align-items: start;
  background-color: #d4dde5;
  color: #111827;
  border-radius: 37px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  clip-path: inset(0 round 20px);
  left: 35px;
  top: 10px;
}

.glass-scroll-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding-right: 20px;
  border-radius: 20px;
  clip-path: inset(0 round 20px);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'%3E%3Crect x='0' y='0' width='100%' height='100%' rx='20' ry='20' fill='white'/%3E%3C/svg%3E")
    no-repeat center / contain;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'%3E%3Crect x='0' y='0' width='100%' height='100%' rx='20' ry='20' fill='white'/%3E%3C/svg%3E")
    no-repeat center / contain;
  mask-composite: add;
  -webkit-mask-composite: source-in;
}
</style>

<style>
.glass-scroll-container {
  position: relative;
  overflow: hidden;
  border-radius: var(--Home-container-border-radius);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.light-mode {
  --Home-scrollbar-thumb-color: rgba(102, 126, 234, 0.5);
  --Home-scrollbar-track-color: rgba(0, 0, 0, 0.05);
  --Home-scrollbar-hover-color: rgba(102, 126, 234, 0.8);
}

.glass-scroll-content::-webkit-scrollbar {
  width: var(--Home-scrollbar-width);
}

.glass-scroll-content::-webkit-scrollbar-track {
  background: var(--Home-scrollbar-track-color);
  border-radius: var(--Home-scrollbar-border-radius);
}

.glass-scroll-content::-webkit-scrollbar-thumb {
  background: var(--Home-scrollbar-thumb-color);
  border-radius: var(--Home-scrollbar-border-radius);
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.glass-scroll-content::-webkit-scrollbar-thumb:hover {
  background: var(--Home-scrollbar-hover-color);
}

.glass-scroll-content {
  scrollbar-width: thin;
  scrollbar-color: var(--Home-scrollbar-thumb-color)
    var(--Home-scrollbar-track-color);
}
</style>
