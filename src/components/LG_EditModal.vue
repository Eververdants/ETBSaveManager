<template>
  <Transition name="modal" appear>
    <div
      v-if="show"
      class="edit-modal-overlay"
      @mousedown.self="handleOverlayClick"
    >
      <div
        class="edit-modal"
        :class="{ 'light-mode': lightMode }"
        ref="modalRef"
      >
        <div class="modal-header">
          <h2>编辑存档</h2>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-content">
          <!-- 基本信息板块 -->
          <div class="section">
            <div class="section-header">
              <i class="fas fa-info-circle"></i>
              <h3>基本信息</h3>
            </div>
            <div class="section-content scrollable">
              <div class="form-group">
                <label for="archive-name">存档名称</label>
                <div class="input-wrapper">
                  <input
                    id="archive-name"
                    type="text"
                    v-model="editedArchive.name"
                    :class="{ 'light-mode': lightMode }"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>存档难度</label>
                <CustomSelect
                  v-model="editedArchive.difficulty"
                  :options="difficultyOptions"
                  :light-mode="lightMode"
                />
              </div>

              <div class="form-group">
                <label>实际难度</label>
                <CustomSelect
                  v-model="editedArchive.actualDifficulty"
                  :options="difficultyOptions"
                  :light-mode="lightMode"
                />
              </div>

              <div class="form-group">
                <label>游戏模式</label>
                <CustomSelect
                  v-model="editedArchive.mode"
                  :options="modeOptions"
                  :light-mode="lightMode"
                />
              </div>

              <div class="form-group">
                <label>状态</label>
                <CustomSelect
                  v-model="editedArchive.hidden"
                  :options="visibilityOptions"
                  :light-mode="lightMode"
                />
              </div>
            </div>
          </div>

          <!-- 具体数据板块 -->
          <div class="section">
            <div class="section-header">
              <i class="fas fa-chart-bar"></i>
              <h3>具体数据</h3>
            </div>
            <div class="section-nav">
              <button
                :class="{ active: activeDataSection === 'level' }"
                @click="scrollToSection('level')"
              >
                <i class="fas fa-layer-group"></i> 层级修改
              </button>
              <button
                :class="{ active: activeDataSection === 'inventory' }"
                @click="scrollToSection('inventory')"
              >
                <i class="fas fa-backpack"></i> 玩家数据
              </button>
            </div>
            <div
              class="section-content scrollable"
              ref="dataSection"
              @scroll="handleSectionScroll"
            >
              <!-- 层级修改部分 -->
              <div class="data-section" id="level-section">
                <h4>层级修改</h4>
                <div class="form-group">
                  <label>当前层级</label>
                  <CustomSelect
                    v-model="editedArchive.currentLevel1"
                    :options="levelOptions"
                    track-by="searchLabel"
                    label="label"
                    :light-mode="lightMode"
                  />
                </div>
              </div>

              <!-- 玩家背包部分 -->
              <div class="data-section" id="inventory-section">
                <h4>玩家数据</h4>

                <!-- 玩家选择器 -->
                <div class="player-selector">
                  <label>选择玩家</label>
                  <CustomSelect
                    v-model="selectedPlayer"
                    :options="playerOptions"
                    :light-mode="lightMode"
                  />
                </div>

                <!-- 数据标签页 -->
                <div class="inventory-tabs">
                  <button
                    v-for="tab in ['背包', '理智']"
                    :key="tab"
                    :class="['tab-button', { active: currentTab === tab }]"
                    @click="currentTab = tab"
                  >
                    {{ tab }}
                  </button>
                </div>

                <!-- 数据内容区域 -->
                <div class="tab-content">
                  <!-- 背包内容 -->
                  <div v-show="currentTab === '背包'" class="inventory-grid">
                    <div
                      v-for="(slot, index) in currentPlayerInventory"
                      :key="index"
                      class="inventory-slot"
                      @click="openItemMenu($event, index)"
                    >
                      <template v-if="slot.item">
                        <div
                          class="item-icon"
                          :style="{ backgroundImage: `url(${slot.item.icon})` }"
                        ></div>
                      </template>
                    </div>
                  </div>

                  <!-- 理智内容 -->
                  <div v-show="currentTab === '理智'" class="sanity-section">
                    <h4>玩家理智</h4>
                    <div
                      class="sanity-slider"
                      :class="{ 'light-mode': lightMode }"
                    >
                      <div class="slider-labels">
                        <span>0.0</span>
                        <span>100.0</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        v-model.number="currentPlayerSanity"
                        class="slider-input"
                        :class="{ 'light-mode': lightMode }"
                      />
                      <div
                        class="slider-value"
                        :class="{ 'light-mode': lightMode }"
                      >
                        {{ currentPlayerSanity.toFixed(1) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 层级信息板块 -->
          <div class="section" v-if="false">
            <div class="section-header">
              <i class="fas fa-map-marked-alt"></i>
              <h3>层级信息</h3>
            </div>

            <div class="section-content scrollable">
              <!-- 遍历所有层级 -->
              <div
                v-for="(meta, levelKey) in levelConfig.levelMeta"
                :key="levelKey"
                class="level-section"
              >
                <div v-if="meta.subtitle" class="level-name">
                  <h3>{{ meta.subtitle }}</h3>
                </div>

                <!-- 动态渲染该层级的字段 -->
                <div
                  v-for="field in meta.fields"
                  :key="field.id"
                  class="form-group"
                >
                  <LG_FormField
                    :field="field"
                    v-model="meta[field.id]"
                    :light-mode="lightMode"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn cancel-btn" @click="closeModal">取消编辑</button>
          <button class="btn confirm-btn" @click="saveChanges">确认编辑</button>
        </div>

        <!-- 物品选择菜单 -->
        <ItemMenu
          v-if="showItemMenu"
          :position="itemMenuPosition"
          :items="itemOptions"
          @select="selectItem"
          @close="closeItemMenu"
          :light-mode="lightMode"
          ref="itemMenuRef"
        />
      </div>
    </div>
  </Transition>
</template>

<script>
import {
  ref,
  reactive,
  watch,
  onMounted,
  computed,
  nextTick,
  onUnmounted,
  shallowRef,
  watchEffect,
} from "vue";
import gsap from "gsap";
import CustomSelect from "./LG_CustomSelect.vue";
import ItemMenu from "./LG_ItemMenu.vue";
import { itemOptions } from "../utils/constants.js";
import { levelConfig } from "../utils/levelConfig";
import LG_FormField from "./LG_FormField.vue";
import { invoke } from "@tauri-apps/api/core";

export default {
  components: {
    CustomSelect,
    ItemMenu,
    LG_FormField,
  },
  props: {
    show: Boolean,
    archive: Object,
    lightMode: Boolean,
    playerOptions: {
      type: Array,
      required: true,
      default: () => [
        { value: "player1", label: "玩家1" },
        { value: "player2", label: "玩家2" },
        { value: "player3", label: "玩家3" },
        { value: "player4", label: "玩家4" },
      ],
    },
    playerInventory: {
      type: Object,
      default: () => ({}),
    },
    playerSanity: {
      type: Object,
      default: () => ({}),
    },
    selectedPlayer: {
      type: [String, Number],
      default: null,
    },
  },
  emits: ["update:show", "save"],
  setup(props, { emit }) {
    const modalRef = ref(null);
    const itemMenuRef = ref(null);
    const levelNameMap = ref({});

    onMounted(async () => {
      try {
        const response = await fetch("/locales/zh-CN/zh-CN.json"); // 注意路径是否正确
        const data = await response.json();
        levelNameMap.value = data.LevelName || {};
      } catch (error) {
        console.error("加载语言包失败:", error);
      }
    });

    const levelConfigReactive = reactive(
      JSON.parse(JSON.stringify(levelConfig))
    );

    // 编辑的存档数据 - 深拷贝
    const editedArchive = ref(JSON.parse(JSON.stringify(props.archive)));

    // 初始化背包函数
    const initPlayerInventory = (playerOptions) => {
      const inventory = {};
      if (!playerOptions) return inventory;

      playerOptions.forEach((player) => {
        const playerId = player.value;
        inventory[playerId] = Array(12)
          .fill()
          .map((_, slotIndex) => ({
            id: slotIndex,
            item: null,
            position: [Math.floor(slotIndex / 4) + 1, (slotIndex % 4) + 1],
          }));
      });

      return inventory;
    };

    // 强制初始化所有玩家背包
    const playerInventory = reactive(initPlayerInventory(props.playerOptions));

    // 如果外部传入了 playerInventory，则合并更新
    watchEffect(() => {
      if (props.playerInventory) {
        // 清空旧数据
        for (const key in playerInventory) {
          delete playerInventory[key];
        }

        // 深拷贝并确保每个玩家背包都是数组
        for (const key in props.playerInventory) {
          const source = props.playerInventory[key];

          // 如果 source 不是数组，或者为空，则填充默认值
          if (!Array.isArray(source)) {
            playerInventory[key] = Array(12).fill({
              id: null,
              item: null,
              position: [0, 0],
            });
            continue;
          }

          playerInventory[key] = source.map((item, index) => ({
            id: index,
            item: item?.item || null,
            position: [Math.floor(index / 4) + 1, (index % 4) + 1],
          }));
        }
      }
    });

    const currentPlayerInventory = computed(() => {
      const current = selectedPlayer.value;
      return current ? playerInventory[current] || [] : [];
    });

    // 设置默认玩家
    const selectedPlayer = ref("");

    watchEffect(() => {
      if (props.playerOptions && props.playerOptions.length > 0) {
        selectedPlayer.value = props.playerOptions[0].value;
      }
    });

    // 使用 props 初始化理智值
    const localPlayerSanity = ref(
      JSON.parse(JSON.stringify(props.playerSanity))
    );

    // 切换玩家时更新理智值
    const currentPlayerSanity = computed({
      get() {
        const value = localPlayerSanity.value?.[selectedPlayer.value];
        return value !== undefined && value !== null ? value : 85.5;
      },
      set(value) {
        localPlayerSanity.value[selectedPlayer.value] = parseFloat(
          value.toFixed(1)
        );
      },
    });

    watchEffect(() => {
      const current = selectedPlayer.value;
      if (
        current &&
        localPlayerSanity.value &&
        localPlayerSanity.value[current] !== undefined
      ) {
        // 当前玩家理智值已存在，不需要 fallback
      } else if (current && props.playerSanity?.[current]) {
        // 如果 props 中有值，则优先使用
        localPlayerSanity.value = {
          ...localPlayerSanity.value,
          [current]: parseFloat(props.playerSanity[current].toFixed(1)),
        };
      } else if (current) {
        // 否则才 fallback 到默认值
        localPlayerSanity.value = {
          ...localPlayerSanity.value,
          [current]: 85.5,
        };
      }
    });

    // 下拉框选项
    const difficultyOptions = ref([
      { value: "简单难度", label: "简单难度" },
      { value: "普通难度", label: "普通难度" },
      { value: "困难难度", label: "困难难度" },
      { value: "噩梦难度", label: "噩梦难度" },
    ]);

    const modeOptions = ref([
      { value: "单人模式", label: "单人模式" },
      { value: "多人模式", label: "多人模式" },
    ]);

    const visibilityOptions = ref([
      { value: false, label: "可见" },
      { value: true, label: "隐藏" },
    ]);

    const levelOptions = computed(() => {
      return Object.entries(levelNameMap.value).map(([value, label]) => ({
        value,
        label,
        searchLabel: label.toLowerCase(),
      }));
    });

    const levelInfoOptions = ref([
      { value: "level-0", label: "Level 0" },
      { value: "level-1", label: "Level 1" },
      { value: "level-2", label: "Level 2" },
      { value: "level-3", label: "Level 3" },
      { value: "level-4", label: "Level 4" },
      { value: "level-5", label: "Level 5" },
    ]);

    // 物品菜单状态
    const showItemMenu = ref(false);
    const itemMenuPosition = ref({ x: 0, y: 0 });
    const currentSlotIndex = ref(null);

    // 具体数据板块导航
    const activeDataSection = shallowRef("level");
    const dataSection = ref(null);

    // 添加当前标签页状态
    const currentTab = ref("背包");

    // 层级信息
    const selectedLevelInfo = ref("level-0");

    const levelInfoFields = ref(levelConfig.fields);

    // 初始化层级信息
    const levelInfo = reactive({
      name: "",
      subtitle: "",
      fields: [],
    });

    // 当 selectedLevelInfo 变化时更新 levelInfo
    watch(selectedLevelInfo, (newValue) => {
      const meta = levelConfig.levelMeta[newValue];

      if (meta) {
        levelInfo.name = meta.name;
        levelInfo.subtitle = meta.subtitle;
        levelInfo.fields = meta.fields || [];
      }
    });

    function initLevelFields() {
      Object.values(levelConfigReactive.levelMeta).forEach((meta) => {
        meta.fields.forEach((field) => {
          if (!Object.prototype.hasOwnProperty.call(meta, field.id)) {
            meta[field.id] = field.default !== undefined ? field.default : null;
          }
        });
      });
    }

    initLevelFields(); // 初始化字段值

    // 修复：打开物品菜单
    const openItemMenu = async (event, slotIndex) => {
      if (event?.stopPropagation) event.stopPropagation();

      const slotElement = event.currentTarget;
      const rect = slotElement.getBoundingClientRect();
      const modalRect = modalRef.value.getBoundingClientRect();

      const menuWidth = 800;
      const menuHeight = 600;
      const padding = 0; // 设置与边缘的距离

      let menuX = rect.left;
      let menuY = rect.bottom + 10;

      // 检查是否底部越界
      if (menuY + menuHeight > modalRect.bottom) {
        menuY = rect.top - menuHeight - 10;
      }

      // 检查是否右侧越界
      if (menuX + menuWidth > modalRect.right) {
        menuX = modalRect.right - menuWidth - padding;
      }

      // 检查是否左侧越界
      if (menuX < modalRect.left) {
        menuX = modalRect.left + padding;
      }

      // 检查调整后的位置是否仍越界（比如弹窗太小）
      if (menuY < modalRect.top) {
        menuY = modalRect.top + padding;
      }

      itemMenuPosition.value = { x: menuX - 70, y: menuY };
      currentSlotIndex.value = slotIndex;

      // 延迟显示菜单，确保动画生效
      showItemMenu.value = false;
      await nextTick();
      showItemMenu.value = true;
    };

    // 选择物品
    const selectItem = (item) => {
      if (currentSlotIndex.value !== null) {
        currentPlayerInventory.value[currentSlotIndex.value].item = item;
      }
      closeItemMenu();
    };

    // 关闭物品菜单
    const closeItemMenu = () => {
      const menuEl = itemMenuRef.value?.$el;
      if (!menuEl) {
        showItemMenu.value = false;
        return;
      }

      // 使用 requestAnimationFrame 避免绿色帧
      requestAnimationFrame(() => {
        setTimeout(() => {
          showItemMenu.value = false;
        }, 300); // 等待动画完成
      });
    };
    // 处理板块滚动事件
    const handleSectionScroll = () => {
      if (showItemMenu.value) {
        closeItemMenu();
      }
    };

    // 滚动到具体数据板块
    const scrollToSection = (section) => {
      if (!dataSection.value) return;

      const targetElement = document.getElementById(
        section === "level" ? "level-section" : "inventory-section"
      );

      if (targetElement) {
        // 先设置 active 状态
        setActiveButton(section);

        // 再执行滚动动画
        gsap.to(dataSection.value, {
          scrollTop: targetElement.offsetTop,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    };

    // 滚动检测函数
    const checkActiveSection = () => {
      if (!dataSection.value) return;

      const levelSection = document.getElementById("level-section");
      const inventorySection = document.getElementById("inventory-section");

      if (!levelSection || !inventorySection) return;

      const container = dataSection.value;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      const levelTop = levelSection.offsetTop;
      const inventoryTop = inventorySection.offsetTop;

      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + containerHeight;

      const levelInView = levelTop >= viewportTop && levelTop < viewportBottom;
      const inventoryInView =
        inventoryTop >= viewportTop && inventoryTop < viewportBottom;

      if (levelInView) {
        activeDataSection.value = "level";
      } else if (inventoryInView) {
        activeDataSection.value = "inventory";
      }
    };

    // 绑定滚动监听
    watch(
      () => props.show,
      (newVal) => {
        if (newVal && dataSection.value) {
          nextTick(() => {
            checkActiveSection(); // 初始判断
          });
        }
      }
    );

    const levelSection = ref(null);
    const inventorySection = ref(null);
    let ticking = false;

    function setActiveButton(section) {
      const buttons = document.querySelectorAll(".section-nav button");
      buttons.forEach((btn) => btn.classList.remove("active"));
      if (section === "level") buttons[0]?.classList.add("active");
      else if (section === "inventory") buttons[1]?.classList.add("active");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (entry.target === levelSection.value) {
                  setActiveButton("level");
                } else if (entry.target === inventorySection.value) {
                  setActiveButton("inventory");
                }
              }
            });
            ticking = false;
          });
          ticking = true;
        }
      },
      {
        root: dataSection.value,
        threshold: [0.4, 0.6],
      }
    );

    function setActiveButton(section) {
      const buttons = document.querySelectorAll(".section-nav button");
      buttons.forEach((btn) => btn.classList.remove("active"));
      if (section === "level") buttons[0]?.classList.add("active");
      else if (section === "inventory") buttons[1]?.classList.add("active");
    }

    onMounted(async () => {
      await nextTick(); // 确保 DOM 已渲染

      const container = dataSection.value;
      if (!container) return;

      const levelTop = levelSection.value?.offsetTop;
      const inventoryTop = inventorySection.value?.offsetTop;

      if (levelTop === undefined || inventoryTop === undefined) return;

      // ✅ 创建 observer 在这里
      observer = new IntersectionObserver(
        (entries) => {
          if (!ticking) {
            requestAnimationFrame(() => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  if (entry.target === levelSection.value) {
                    setActiveButton("level");
                  } else if (entry.target === inventorySection.value) {
                    setActiveButton("inventory");
                  }
                }
              });
              ticking = false;
            });
            ticking = true;
          }
        },
        {
          root: dataSection.value, // ✅ 滚动容器
          threshold: [0.4, 0.6], // 可视比例
        }
      );

      if (levelSection.value) observer.observe(levelSection.value);
      if (inventorySection.value) observer.observe(inventorySection.value);

      // 初始判断当前激活项
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;

      if (levelTop >= scrollTop && levelTop < scrollTop + clientHeight / 2) {
        setActiveButton("level");
      } else if (
        inventoryTop >= scrollTop &&
        inventoryTop < scrollTop + clientHeight / 2
      ) {
        setActiveButton("inventory");
      }
    });

    onUnmounted(() => {
      observer.disconnect();
    });

    // 关闭弹窗动画
    const closeModal = () => {
      gsap.to(modalRef.value, {
        opacity: 0,
        scale: 0.9,
        y: 30,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          emit("update:show", false);
        },
      });
    };

    const difficultyMap = {
      "简单难度": "Easy",
      "普通难度": "Normal",
      "困难难度": "Hard",
      "噩梦难度": "Nightmare",
    };

    const modeMap = {
      "单人模式": "Singleplayer",
      "多人模式": "Multiplayer",
    };

    // 保存修改
    const saveChanges = async () => {
      // 将中文映射为英文
      const difficulty = difficultyMap[editedArchive.value.difficulty] || editedArchive.value.difficulty;
      const actualDifficulty = difficultyMap[editedArchive.value.actualDifficulty] || editedArchive.value.actualDifficulty;
      const mode = modeMap[editedArchive.value.mode] || editedArchive.value.mode;

      // 动态判断 outputDir
      const isHidden = editedArchive.value.hidden === true || editedArchive.value.hidden === "hidden";
      let outputDir = "";

      try {
        // 获取 %LOCALAPPDATA%
        const localAppData = await invoke("get_local_appdata");
        const baseDir = `${localAppData}/EscapeTheBackrooms/Saved/SaveGames`;

        if (!isHidden) {
          outputDir = `${baseDir}/HiddenFiles`;
        } else {
          outputDir = baseDir;
        }

        // 确保输出目录存在
        await invoke("ensure_dir_exists", { path: outputDir });
      } catch (e) {
        console.error("获取 LOCALAPPDATA 失败:", e);
        alert("无法确定保存路径，请确保游戏数据目录可用");
        return;
      }

      // 构造完整存档数据
      const payload = {
        jsonInput: {
          saveData: {
            outputDir,
            jsonData: {
              name: editedArchive.value.name,
              path: editedArchive.value.path,
              difficulty,
              actualDifficulty,
              mode,
              hidden: isHidden,
              currentLevel: editedArchive.value.currentLevel1,
              playerInventory: { ...playerInventory },
              playerSanity: { ...localPlayerSanity.value },
            }
          }
        }
      };

      try {
        console.log("保存数据:", payload);
        await invoke("handle_edit_save", payload);

        // ✅ 正确地 emit 编辑后的存档数据
        emit("save", {
          ...editedArchive.value,
          difficulty,
          actualDifficulty,
          mode,
          hidden: isHidden,
          currentLevel: editedArchive.value.currentLevel1,
          playerInventory: { ...playerInventory },
          playerSanity: { ...localPlayerSanity.value }
        });

        emit("save");

        closeModal();
      } catch (error) {
        console.error("保存失败:", error);
      }
    };

    // 监听弹窗显示状态 - 添加进场动画
    watch(
      () => props.show,
      async (newVal) => {
        if (newVal && modalRef.value) {
          await nextTick(); // 等待 DOM 更新
          gsap.set(modalRef.value, {
            opacity: 0,
            scale: 0.9,
            y: 30,
          });

          gsap.to(modalRef.value, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.4,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      }
    );

    return {
      modalRef,
      itemMenuRef,
      editedArchive,
      difficultyOptions,
      modeOptions,
      visibilityOptions,
      levelOptions,
      playerOptions: props.playerOptions,
      levelInfoOptions,
      selectedLevelInfo,
      levelInfo,
      playerInventory,
      selectedPlayer,
      currentPlayerInventory,
      showItemMenu,
      activeDataSection,
      dataSection,
      openItemMenu,
      selectItem,
      closeItemMenu,
      handleSectionScroll,
      scrollToSection,
      closeModal,
      saveChanges,
      itemOptions,
      itemMenuPosition,
      levelSection,
      inventorySection,
      currentTab,
      currentPlayerSanity,
      levelConfig: levelConfigReactive,
    };
  },
};
</script>

<style scoped>
.edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
}

.edit-modal {
  position: relative;
  width: 800px;
  height: 600px;
  background: rgba(25, 25, 35, 0.85);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transform-origin: center;
  will-change: transform, opacity;
}

.edit-modal.light-mode {
  background: rgba(240, 242, 245, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-modal.light-mode .modal-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #e0e0ff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.edit-modal.light-mode .modal-header h2 {
  color: #2c3e50;
  text-shadow: none;
}

.close-btn {
  background: none;
  border: none;
  color: #a0a0c0;
  font-size: 20px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: rotate(90deg);
}

.edit-modal.light-mode .close-btn {
  color: #7f8c8d;
}

.edit-modal.light-mode .close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #2c3e50;
}

.modal-content {
  display: flex;
  flex: 1;
  padding: 0 10px 10px;
  min-height: 0;
}

.section {
  flex: 1;
  display: none;
  flex-direction: column;
  padding: 0 10px;
  min-height: 0;
}

.section-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  margin: 0 10px 10px;
  flex-shrink: 0;
}

.edit-modal.light-mode .section-header {
  background: rgba(0, 0, 0, 0.03);
}

.section-header i {
  margin-right: 10px;
  font-size: 18px;
  color: #7a89c9;
}

.edit-modal.light-mode .section-header i {
  color: #5a6da8;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #d0d0ff;
}

.edit-modal.light-mode .section-header h3 {
  color: #34495e;
}

.section-nav {
  display: flex;
  padding: 0 10px 10px;
  gap: 10px;
  flex-shrink: 0;
}

.section-nav button {
  flex: 1;
  padding: 10px;
  background: rgba(60, 65, 90, 0.4);
  border: none;
  border-radius: 10px;
  color: #b0b0e0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.section-nav button:hover {
  background: rgba(80, 85, 120, 0.5);
  color: #e0e0ff;
}

.section-nav button.active {
  background: rgba(100, 110, 180, 0.6);
  color: white;
  box-shadow: 0 4px 12px rgba(100, 110, 180, 0.3);
}

.edit-modal.light-mode .section-nav button {
  background: rgba(200, 205, 220, 0.5);
  color: #5a6da8;
}

.edit-modal.light-mode .section-nav button:hover {
  background: rgba(180, 190, 220, 0.7);
  color: #3a4a8a;
}

.edit-modal.light-mode .section-nav button.active {
  background: rgba(120, 140, 220, 0.7);
  color: white;
  box-shadow: 0 4px 12px rgba(120, 140, 220, 0.3);
}

.level-selector {
  padding: 0 10px 10px;
  /* 修复滚动问题：固定选择器 */
  flex-shrink: 0;
}

.section-content {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;
  background: rgba(20, 22, 30, 0.5);
  padding: 15px;
  position: relative;
  /* 修复滚动问题：关键设置 */
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.edit-modal.light-mode .section-content {
  background: rgba(245, 247, 250, 0.7);
}

.scrollable {
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
}

.scrollable::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #a0a0d0;
}

.edit-modal.light-mode .form-group label {
  color: #5a6da8;
}

.input-wrapper {
  position: relative;
}

.input-wrapper i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a89c9;
  font-size: 16px;
}

input {
  width: 90%;
  padding: 12px 15px;
  background: rgba(30, 32, 45, 0.7);
  border: 1px solid rgba(100, 110, 180, 0.3);
  border-radius: 10px;
  color: #e0e0ff;
  font-size: 14px;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #7a89c9;
  box-shadow: 0 0 0 2px rgba(100, 110, 180, 0.3);
}

.edit-modal.light-mode input {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(120, 140, 220, 0.3);
  color: #2c3e50;
}

.edit-modal.light-mode input:focus {
  border-color: #5a6da8;
  box-shadow: 0 0 0 2px rgba(120, 140, 220, 0.3);
}

.data-section {
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.data-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.data-section h4 {
  margin: 0 0 15px;
  font-size: 16px;
  font-weight: 500;
  color: #d0d0ff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-modal.light-mode .data-section h4 {
  color: #34495e;
}

.player-selector {
  margin-bottom: 20px;
}

.inventory-grid {
  display: grid;
  grid-template-rows: repeat(3, 1fr); /* 3行 */
  grid-auto-flow: column; /* 列优先 */
  gap: 12px;
}

.inventory-slot {
  aspect-ratio: 1/1;
  background: rgba(40, 45, 60, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(100, 110, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.inventory-slot:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(100, 110, 180, 0.3);
  border-color: rgba(140, 150, 220, 0.5);
}

.edit-modal.light-mode .inventory-slot {
  background: rgba(220, 225, 240, 0.7);
  border: 1px solid rgba(120, 140, 220, 0.3);
}

.edit-modal.light-mode .inventory-slot:hover {
  border-color: rgba(100, 120, 200, 0.5);
}

.item-icon {
  width: 70%;
  height: 70%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.item-count {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.progress-bar {
  height: 24px;
  background: rgba(40, 45, 60, 0.5);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.edit-modal.light-mode .progress-bar {
  background: rgba(220, 225, 240, 0.7);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7a89c9, #5a6da8);
  border-radius: 12px;
  transition: width 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.modal-footer {
  padding: 10px 30px 20px; /* 下边距20px */
  display: flex;
  justify-content: center;
  gap: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  /* 修复按钮位置：确保固定在底部 */
  margin-top: auto;
  flex-shrink: 0;
}

.edit-modal.light-mode .modal-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.btn {
  padding: 12px 35px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.cancel-btn {
  background: rgba(80, 85, 120, 0.3);
  color: #b0b0e0;
}

.cancel-btn:hover {
  background: rgba(100, 105, 140, 0.5);
  color: #e0e0ff;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.confirm-btn {
  background: linear-gradient(135deg, #7a89c9, #5a6da8);
  color: white;
  box-shadow: 0 4px 12px rgba(100, 110, 180, 0.4);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #8a99d9, #6a7db8);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(100, 110, 180, 0.5);
}

/* 动画效果 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.4s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .edit-modal,
.modal-leave-active .edit-modal {
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.modal-enter-from .edit-modal,
.modal-leave-to .edit-modal {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* 修复滚动问题的关键CSS */
.modal-content {
  flex: 1;
  display: flex;
  min-height: 0; /* 允许内容收缩 */
}

.section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许内容收缩 */
}

.section-content {
  flex: 1;
  min-height: 0; /* 允许内容收缩 */
  display: flex;
  flex-direction: column;
}

.inventory-slot {
  aspect-ratio: 1/1;
  background: rgba(40, 45, 60, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(100, 110, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.inventory-slot:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(100, 110, 180, 0.3);
  border-color: rgba(140, 150, 220, 0.5);
}

.slot-placeholder {
  color: rgba(180, 190, 220, 0.5);
  font-size: 16px;
}

.item-icon {
  width: 70%;
  height: 70%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.item-count {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

/* 修复物品菜单位置 */
.item-menu {
  position: fixed;
  z-index: 2000;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

/* 调整输入框宽度 */
.input-wrapper,
.custom-select {
  width: 100%;
}

/* 调整取消按钮样式 */
.cancel-btn {
  background: rgba(100, 105, 140, 0.3) !important;
  color: #b0b0e0;
}

.cancel-btn:hover {
  background: rgba(120, 125, 160, 0.5) !important;
  color: #e0e0ff;
}

/* 弹窗动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.4s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .edit-modal,
.modal-leave-active .edit-modal {
  transition: all 0.4s cubic-bezier(0.47, 0, 0.75, 0.72);
}

.modal-enter-from .edit-modal,
.modal-leave-to .edit-modal {
  opacity: 0;
  transform: scale(0.9) translateY(30px);
}

/* 取消按钮样式优化 */
.cancel-btn {
  background: rgba(120, 130, 150, 0.25) !important;
  color: #c0c0e0 !important;
  border: 1px solid rgba(150, 160, 180, 0.15);
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(140, 150, 170, 0.4) !important;
  color: #ffffff !important;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 确认按钮样式优化 */
.confirm-btn {
  background: linear-gradient(135deg, #7a89c9, #5a6da8) !important;
  color: white !important;
  border: none;
  box-shadow: 0 4px 12px rgba(100, 110, 180, 0.4);
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #8a99d9, #6a7db8) !important;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 18px rgba(100, 110, 180, 0.6);
}

/* 表单组样式 - 恢复原始布局 */
.form-group {
  margin-bottom: 20px;
  width: 100%;
}

/* 输入框和下拉框居中 */
.input-wrapper,
.custom-select {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

/* 背包格子样式 */
.inventory-slot {
  aspect-ratio: 1/1;
  background: rgba(40, 45, 60, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(100, 110, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.inventory-slot:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(100, 110, 180, 0.3);
  border-color: rgba(140, 150, 220, 0.5);
}

.item-icon {
  width: 70%;
  height: 70%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.sanity-section {
  margin-top: 20px;
}

.sanity-slider {
  background: rgba(30, 32, 45, 0.7);
  border-radius: 12px;
  padding: 15px;
  border: 1px solid rgba(100, 110, 180, 0.3);
  transition: all 0.3s ease;
}

.sanity-slider.light-mode {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(120, 140, 220, 0.3);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #a0a0d0;
  font-size: 14px;
}

.slider-labels.light-mode {
  color: #5a6da8;
}

.slider-input {
  width: 80%;
  appearance: none;
  height: 8px;
  border-radius: 5px;
  background: rgba(100, 110, 180, 0.3);
  outline: none;
  transition: all 0.3s ease;
}

.slider-input.light-mode {
  background: rgba(120, 140, 220, 0.3);
}

.slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7a89c9, #5a6da8);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.slider-input.light-mode::-webkit-slider-thumb {
  background: linear-gradient(135deg, #5a6da8, #7a89c9);
}

.slider-value {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0ff;
  text-align: right;
}

.slider-value.light-mode {
  color: #2c3e50;
}
.inventory-tabs {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.tab-button {
  flex: 1;
  padding: 8px 12px;
  background: rgba(60, 65, 90, 0.4);
  border: none;
  border-radius: 8px;
  color: #b0b0e0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: rgba(80, 85, 120, 0.5);
  color: #e0e0ff;
}

.tab-button.active {
  background: rgba(100, 110, 180, 0.6);
  color: white;
  box-shadow: 0 4px 12px rgba(100, 110, 180, 0.3);
}

.tab-button.light-mode {
  background: rgba(200, 205, 220, 0.5);
  color: #5a6da8;
}

.tab-button.light-mode:hover {
  background: rgba(180, 190, 220, 0.7);
  color: #3a4a8a;
}

.tab-button.light-mode.active {
  background: rgba(120, 140, 220, 0.7);
  color: white;
  box-shadow: 0 4px 12px rgba(120, 140, 220, 0.3);
}

.tab-content {
  position: relative;
  min-height: 200px;
}

.item-position {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 3px;
  border-radius: 3px;
}

.light-mode .item-position {
  color: rgba(0, 0, 0, 0.7);
  background: rgba(255, 255, 255, 0.3);
}
</style>
