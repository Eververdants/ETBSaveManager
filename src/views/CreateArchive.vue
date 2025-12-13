<template>
  <div class="create-archive-container" :class="{ 'sidebar-expanded': isSidebarExpanded }">
    <!-- 步骤指示器 - 放在顶部居中 -->
    <div class="step-indicator">
      <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <span class="step-number">{{ $t('common.step', { number: 1 }) }}</span>
        <span class="step-label">{{ $t('createArchive.steps.selectLevel') }}</span>
      </div>
      <div class="step-connector"></div>
      <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <span class="step-number">{{ $t('common.step', { number: 2 }) }}</span>
        <span class="step-label">{{ $t('createArchive.steps.configureArchive') }}</span>
      </div>
      <div class="step-connector"></div>
      <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
        <span class="step-number">{{ $t('common.step', { number: 3 }) }}</span>
        <span class="step-label">{{ $t('createArchive.steps.editInventory') }}</span>
      </div>
    </div>

    <!-- 结局选择器 - 只在第一步显示 -->
    <transition name="ending-selector" appear>
      <div v-if="currentStep === 1" class="ending-selector">
        <div class="ending-tabs">
          <div v-for="(ending, index) in endings" :key="index" class="ending-tab"
            :class="{ active: selectedEnding === index }" @click="selectEnding(index)" :style="{ '--index': index }">
            <span class="ending-icon">{{ ending.icon }}</span>
            <span class="ending-label">{{ ending.label }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 切换到批量创建页面的按钮（已废弃） -->
    <transition name="batch-switch">
      <button class="batch-create-button" @click="switchToBatchCreate" :class="{ 'shrink': isSwitching }">
        <font-awesome-icon :icon="['fas', 'layer-group']" />
        <span class="button-text">{{ $t('createArchive.batchCreate') }}</span>
      </button>
    </transition>

    <!-- 模式选择按钮 - 只在第一步显示 -->
    <transition name="mode-button">
      <button v-if="currentStep === 1" class="mode-select-button" @click="goToSelectMode">
        <font-awesome-icon :icon="['fas', 'th-large']" />
        <span class="button-text">{{ $t('createMode.title') }}</span>
      </button>
    </transition>

    <!-- 主要内容区域 -->
    <div class="content-wrapper" :class="{ 'no-ending-selector': currentStep !== 1 }">
      <!-- 步骤内容容器 -->
      <transition name="step-transition" mode="out-in" @enter="onStepEnter" @leave="onStepLeave">
        <div :key="currentStep" class="step-container">
          <div class="step-content" :data-step="currentStep">
            <!-- 步骤1: 选择层级 -->
            <div v-if="currentStep === 1" class="section-card">
              <div class="level-grid">
                <div v-for="(level, index) in availableLevels" :key="level.levelKey" class="level-card"
                  :class="{ selected: selectedLevel === index }" @click="selectLevel(index)">
                  <div class="level-image-container">
                    <LazyImage :src="level.image" :alt="level.name" image-class="level-image" />
                    <div class="level-overlay">
                      <font-awesome-icon :icon="['fas', 'check']" class="check-icon" v-if="selectedLevel === index" />
                    </div>
                  </div>
                  <div class="level-info">
                    <h3 class="level-name">{{ level.name }}</h3>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤2: 配置存档 -->
            <div v-else-if="currentStep === 2" class="config-grid">
              <!-- 存档名称 - 占满第一行 -->
              <div class="config-card full-width">
                <h3 class="form-section-title">{{ $t('createArchive.archiveName') }}</h3>
                <div class="form-group">
                  <label class="form-label">{{ $t('createArchive.archiveName') }}</label>
                  <input v-model="archiveName" type="text" class="form-input"
                    :placeholder="$t('createArchive.archiveNamePlaceholder')" maxlength="50" />
                  <transition name="error-fade">
                    <div v-if="archiveName.includes('_')" class="error-message">
                      <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
                      {{ $t('createArchive.archiveNameError') }}
                    </div>
                  </transition>
                </div>
              </div>



              <!-- 存档难度 -->
              <div class="config-card">
                <h3 class="form-section-title">{{ $t('createArchive.difficulty') }}</h3>
                <div class="difficulty-grid">
                  <div v-for="difficulty in difficultyLevels" :key="difficulty.value" class="difficulty-option" :class="{
                    selected: selectedDifficulty === difficulty.value,
                    disabled: selectedGameMode === 'singleplayer' && difficulty.value !== 'normal'
                  }" @click="selectDifficulty(difficulty.value)">
                    <div class="difficulty-icon">
                      <font-awesome-icon :icon="difficulty.icon" />
                    </div>
                    <span class="difficulty-label">{{ $t(`createArchive.difficultyLevels.${difficulty.value}`) }}</span>
                  </div>
                </div>
              </div>

              <!-- 实际难度 -->
              <div class="config-card">
                <h3 class="form-section-title">{{ $t('createArchive.actualDifficulty') }}</h3>
                <div class="difficulty-grid">
                  <div v-for="difficulty in difficultyLevels" :key="`actual-${difficulty.value}`"
                    class="difficulty-option" :class="{
                      selected: selectedActualDifficulty === difficulty.value,
                      disabled: selectedGameMode === 'singleplayer' && difficulty.value !== 'normal'
                    }" @click="selectActualDifficulty(difficulty.value)">
                    <div class="difficulty-icon">
                      <font-awesome-icon :icon="difficulty.icon" />
                    </div>
                    <span class="difficulty-label">{{ $t(`createArchive.difficultyLevels.${difficulty.value}`) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤3: 确认信息 -->
            <div v-else-if="currentStep === 3" class="inventory-section">
              <!-- Steam ID 管理 -->
              <div class="steam-id-card">
                <h3 class="form-section-title">{{ $t('createArchive.playerManagement') }}</h3>
                <div class="steam-id-info">
                  <font-awesome-icon :icon="['fas', 'info-circle']" />
                  <span>{{ $t('createArchive.steamIdInfo') }}</span>
                </div>
                <div class="steam-id-input-group">
                  <input v-model="newSteamId" type="text" class="form-input"
                    :placeholder="$t('createArchive.steamIdPlaceholder')" @keyup.enter="addSteamId" />
                  <button @click="addSteamId" class="add-button">
                    <font-awesome-icon :icon="['fas', 'plus']" />
                    {{ $t('createArchive.add') }}
                  </button>
                </div>

                <!-- 玩家输入提示信息 -->
                <transition name="message-fade" mode="out-in">
                  <div v-if="playerInputMessage" class="player-input-message" :class="playerInputMessageType"
                    key="message">
                    <font-awesome-icon
                      :icon="playerInputMessageType === 'success' ? ['fas', 'check-circle'] : ['fas', 'exclamation-circle']" />
                    {{ playerInputMessage }}
                  </div>
                </transition>

                <!-- Steam ID 列表 -->
                <div class="steam-id-list">
                  <div v-for="(player, index) in players" :key="index" class="steam-id-item"
                    :class="{ active: activePlayerIndex === index }" @click="selectPlayer(index)">
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
                          {{ $t('createArchive.loadingUsername') }}
                        </template>
                      </div>
                    </div>
                    <button @click.stop="removePlayer(index)" class="remove-button">
                      <font-awesome-icon :icon="['fas', 'times']" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- 背包编辑器 -->
              <div class="inventory-card">
                <h3 class="form-section-title">
                  <template v-if="activePlayerIndex !== -1">
                    {{ $t('createArchive.editInventoryFor', {
                      playerName: players[activePlayerIndex].username ||
                        players[activePlayerIndex].steamId
                    }) }}
                  </template>
                  <template v-else>
                    {{ $t('createArchive.editInventory') }}
                  </template>
                </h3>
                <div v-if="activePlayerIndex !== -1" class="inventory-grid">
                  <!-- 主手和副手位置 -->
                  <div class="inventory-column">
                    <div v-for="slot in 3" :key="`weapon-${slot - 1}`" class="inventory-slot weapon-slot" :class="{
                      'main-hand': slot === 1,
                      'off-hand': slot > 1,
                      'empty': !getSlotContent(activePlayerIndex, slot - 1)
                    }" @click="editSlot(activePlayerIndex, slot - 1)">
                      <div class="slot-label">{{ $t(`createArchive.${getSlotLabel(slot - 1)}`) }}</div>
                      <div class="slot-content">
                        <transition name="item-fade" mode="out-in">
                          <img v-if="getSlotContent(activePlayerIndex, slot - 1)"
                            :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(activePlayerIndex, slot - 1))}.png`"
                            :alt="getSlotContent(activePlayerIndex, slot - 1)" class="item-image"
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
                      @click="editSlot(activePlayerIndex, slot + 2)">
                      <div class="slot-number">{{ slot }}</div>
                      <div class="slot-content">
                        <transition name="item-fade" mode="out-in">
                          <img v-if="getSlotContent(activePlayerIndex, slot + 2)"
                            :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(activePlayerIndex, slot + 2))}.png`"
                            :alt="getSlotContent(activePlayerIndex, slot + 2)" class="item-image"
                            :key="getSlotContent(activePlayerIndex, slot + 2)" />
                          <font-awesome-icon v-else :icon="['fas', 'square']" class="slot-icon" key="empty" />
                        </transition>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-inventory-message">
                  <font-awesome-icon :icon="['fas', 'info-circle']" />
                  <p>{{ $t('createArchive.selectPlayerMessage') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button @click="previousStep" class="action-button secondary" :disabled="currentStep === 1">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
        {{ $t('createArchive.previous') }}
      </button>

      <div class="step-info">
        {{ $t('createArchive.step') }}
        <transition name="step-info-change" mode="out-in">
          <span :key="currentStep">{{ currentStep }}</span>
        </transition>
        / 3
      </div>

      <button @click="nextStep" class="action-button primary" :disabled="!canProceed">
        <template v-if="currentStep === 3 && isCreating">
          {{ $t('createArchive.creating') }}
          <font-awesome-icon :icon="['fas', 'spinner']" spin />
        </template>
        <template v-else>
          {{ currentStep === 3 ? $t('createArchive.createArchive') : $t('createArchive.next') }}
          <font-awesome-icon :icon="['fas', currentStep === 3 ? 'check' : 'arrow-right']" />
        </template>
      </button>
    </div>
    <!-- 物品选择器 -->
    <InventoryItemSelector :visible="showItemSelector" @select="handleItemSelect"
      @update:visible="showItemSelector = $event" />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { gsap } from 'gsap'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import InventoryItemSelector from '../components/InventoryItemSelector.vue'
import LazyImage from '../components/LazyImage.vue'
import { showError } from '../services/popupService'

export default {
  name: 'CreateArchive',
  components: {
    InventoryItemSelector,
    LazyImage
  },
  setup() {
    const { t } = useI18n({ useScope: 'global' })
    const router = useRouter()
    const currentStep = ref(1)
    const previousStepValue = ref(1)
    const selectedLevel = ref(-1)
    const selectedEnding = ref(0) // 默认选择第一个结局（主线）
    const archiveName = ref('')
    const selectedGameMode = ref('multiplayer') // 默认设置为多人模式
    const selectedDifficulty = ref('normal')
    const selectedActualDifficulty = ref('normal')
    const newSteamId = ref('')
    const activePlayerIndex = ref(-1)
    const showItemSelector = ref(false)
    const editingSlot = ref({ playerIndex: -1, slotIndex: -1 })
    const isSwitching = ref(false)
    const isCreating = ref(false) // 添加创建状态标志

    // 玩家输入提示信息
    const playerInputMessage = ref('')
    const playerInputMessageType = ref('') // 'success' 或 'error'

    // 动态加载层级数据
    const availableLevels = reactive([])
    const players = reactive([])

    // 结局数据
    const endings = reactive([
      {
        id: 0,
        label: t('createArchive.endings.main'),
        icon: '🏆',
        levels: [] // 主线关卡列表，将由用户填写
      },
      {
        id: 1,
        label: t('createArchive.endings.branch1'),
        icon: '🔍',
        levels: [] // 支线1关卡列表，将由用户填写
      },
      {
        id: 2,
        label: t('createArchive.endings.branch2'),
        icon: '🔬',
        levels: [] // 支线2关卡列表，将由用户填写
      },
      {
        id: 3,
        label: t('createArchive.endings.branch3'),
        icon: '🌟',
        levels: [] // 支线3关卡列表，将由用户填写
      },
      {
        id: 4,
        label: t('createArchive.endings.branch4'),
        icon: '🎭',
        levels: [] // 支线4关卡列表，将由用户填写
      },
      {
        id: 5,
        label: t('createArchive.endings.hidden'),
        icon: '🔒',
        levels: [] // 隐藏层级关卡列表，将由用户填写
      }
    ])



    // 游戏模式选项
    const gameModes = [
      { value: 'multiplayer', label: 'multiplayer' }
    ]

    // 难度选项
    const difficultyLevels = [
      { value: 'easy', label: 'easy', icon: ['fas', 'smile'] },
      { value: 'normal', label: 'normal', icon: ['fas', 'meh'] },
      { value: 'hard', label: 'hard', icon: ['fas', 'frown'] },
      { value: 'nightmare', label: 'nightmare', icon: ['fas', 'skull'] }
    ]

    // 计算属性
    const canProceed = computed(() => {
      // 如果正在创建，禁用按钮
      if (isCreating.value) {
        return false
      }

      switch (currentStep.value) {
        case 1:
          return selectedLevel.value !== -1
        case 2:
          return archiveName.value.trim() !== '' && !archiveName.value.includes('_')
        case 3:
          return true // 玩家背包改为非强制要求
        default:
          return true
      }
    })

    // 监听selectedEnding的变化
    watch(selectedEnding, (newVal, oldVal) => {
      // 移除控制台输出，避免在切换结局时显示调试信息
      // console.log(`selectedEnding changed from ${oldVal} to ${newVal}`)
    })

    // 方法
    const selectDifficulty = (difficulty) => {
      selectedDifficulty.value = difficulty
    }

    const selectActualDifficulty = (difficulty) => {
      selectedActualDifficulty.value = difficulty
    }

    const selectEnding = async (index) => {
      // 如果选择的是当前结局，不做任何操作
      if (selectedEnding.value === index) {
        return
      }

      // 更新选中的结局
      selectedEnding.value = index
      selectedLevel.value = -1 // 重置选中的层级

      // 使用nextTick确保DOM更新后再加载层级
      await nextTick()
      loadLevelsForEnding(index)

      // 强制触发视图更新
      await nextTick()
    }



    const switchToBatchCreate = () => {
      isSwitching.value = true

      // 简化淡出动画，减少性能开销
      gsap.to('.create-archive-container', {
        opacity: 0,
        duration: 0.2,
        ease: 'power1.in',
        onComplete: () => {
          router.push('/batch-create-archive')
        }
      })
    }

    // 跳转到模式选择页面
    const goToSelectMode = () => {
      router.push('/select-create-mode')
    }

    const loadLevels = async () => {
      // 层级名称映射
      const levelMappings = [
        'Level0', 'TopFloor', 'MiddleFloor', 'GarageLevel2', 'BottomFloor',
        'TheHub', 'Pipes1', 'ElectricalStation', 'Office', 'Hotel',
        'Floor3', 'BoilerRoom', 'Pipes2', 'LevelFun', 'Poolrooms',
        'LevelRun', 'TheEnd', 'Level922', 'Level94', 'AnimatedKingdom',
        'LightsOut', 'OceanMap', 'CaveLevel', 'Level05', 'Level9',
        'AbandonedBase', 'Level10', 'Level3999', 'Level07', 'Snackrooms',
        'LevelDash', 'Level188_Expanded', 'Poolrooms_Expanded', 'WaterPark_Level01_P',
        'WaterPark_Level02_P', 'WaterPark_Level03_P', 'LevelFun_Expanded',
        'Zone1_Modified', 'Zone2_Modified', 'Zone3_Baked', 'Zone4',
        'Level52', 'TunnelLevel',
        'Bunker', 'GraffitiLevel', 'Grassrooms_Expanded', 'Level974', 'LevelCheat'
      ]

      // 初始化结局对应的层级列表
      // 注意：这些层级列表需要您根据游戏实际情况填写
      endings[0].levels = ['Level0', 'TopFloor', 'MiddleFloor', 'GarageLevel2', 'BottomFloor',
        'TheHub', 'Pipes1', 'ElectricalStation', 'Office', 'Hotel',
        'Floor3', 'BoilerRoom', 'Pipes2', 'LevelFun', 'Poolrooms',
        'LevelRun', 'TheEnd', 'Level94', 'AnimatedKingdom',
        'LightsOut', 'OceanMap', 'CaveLevel', 'Level05', 'Level9',
        'AbandonedBase', 'Level10', 'Level3999', 'Level07', 'Snackrooms',
        'LevelDash', 'Level188_Expanded', 'Poolrooms_Expanded', 'WaterPark_Level01_P',
        'WaterPark_Level02_P', 'WaterPark_Level03_P', 'LevelFun_Expanded',
        'Zone1_Modified', 'Zone2_Modified', 'Zone3_Baked', 'Zone4',
        'Level52', 'TunnelLevel',] // 主线
      endings[1].levels = ['Bunker', "GraffitiLevel", "Grassrooms_Expanded"] // 支线1
      endings[2].levels = ['Bunker', 'TheHub', 'BottomFloor', 'Level922'] // 支线2
      endings[3].levels = ['Bunker', "TheHub", "OceanMap", "LightsOut", "Level974"] // 支线3
      endings[4].levels = ['Bunker', "Level3999"] // 支线4
      endings[5].levels = ['Bunker', 'TheHub', 'Level188_Expanded', 'LevelCheat'] // 隐藏层级

      // 加载默认结局（主线）的层级
      loadLevelsForEnding(0)
    }

    const loadLevelsForEnding = async (endingIndex) => {
      // 获取当前结局对应的层级键值列表
      const endingLevels = endings[endingIndex].levels

      // 创建新的层级列表
      const newLevels = endingLevels.map((levelKey) => {
        // 现在所有关卡都使用关卡名称作为图片文件名
        const imagePath = `/images/ETB/${levelKey}.jpg`

        return {
          name: t(`LevelName_Display.${levelKey}`),
          image: imagePath,
          levelKey: levelKey
        }
      })

      // 直接替换层级列表，避免过渡动画
      availableLevels.splice(0, availableLevels.length, ...newLevels)
    }

    const selectLevel = (index) => {
      selectedLevel.value = index
      // 简化选中动画，减少性能开销
      gsap.to(`.level-card:nth-child(${index + 1})`, {
        scale: 1.02,
        duration: 0.1,
        ease: "power1.out",
        yoyo: true,
        repeat: 1
      })
    }

    // 验证Steam ID格式
    const validateSteamId = (steamId) => {
      if (!steamId || steamId.trim() === '') {
        return { valid: false, message: t('createArchive.steamIdRequired') }
      }

      // 检查是否为离线玩家格式 (xxxxx-xxxxxxxxxxxxxxx)
      if (steamId.includes('-')) {
        const parts = steamId.split('-')
        if (parts.length === 2 && parts[0].length === 5 && parts[1].length === 15) {
          // 对于离线玩家，保留完整ID格式，但提取前5位用于显示
          return { valid: true, isOfflinePlayer: true, processedSteamId: steamId, displayId: parts[0] }
        } else {
          return { valid: false, message: t('createArchive.steamIdInvalid') }
        }
      }

      // 检查是否为纯数字
      if (!/^\d+$/.test(steamId)) {
        return { valid: false, message: t('createArchive.steamIdInvalid') }
      }

      // 对于在线Steam ID，检查长度是否为17位
      if (steamId.length !== 17) {
        return { valid: false, message: t('createArchive.steamIdValidationError', { error: t('createArchive.steamIdLengthError') }) }
      }

      return { valid: true, isOfflinePlayer: false, processedSteamId: steamId }
    }

    // 显示玩家输入提示信息
    const showPlayerMessage = (message, type = 'success') => {
      playerInputMessage.value = message
      playerInputMessageType.value = type

      // 3秒后自动清除提示
      setTimeout(() => {
        playerInputMessage.value = ''
        playerInputMessageType.value = ''
      }, 3000)
    }

    const addSteamId = async () => {
      const steamId = newSteamId.value.trim()
      if (!steamId) {
        return
      }

      // 验证Steam ID
      const validation = validateSteamId(steamId)
      if (!validation.valid) {
        // 使用更友好的提示方式
        showPlayerMessage(validation.message, 'error')
        return
      }

      // 检查是否已存在相同的Steam ID
      const isDuplicate = players.some(player => player.steamId === validation.processedSteamId)
      if (isDuplicate) {
        const duplicateMessage = t('createArchive.steamIdDuplicate', { steamId: validation.processedSteamId })
        showPlayerMessage(duplicateMessage, 'error')
        return
      }

      // 创建新玩家
      const newPlayer = {
        steamId: validation.processedSteamId, // 使用完整的ID格式
        inventory: Array(12).fill(null),
        username: validation.isOfflinePlayer ? `${validation.displayId}(本地)` : null, // 使用displayId显示
        isOfflinePlayer: validation.isOfflinePlayer
      }

      players.push(newPlayer)
      newSteamId.value = ''
      if (activePlayerIndex.value === -1) {
        activePlayerIndex.value = 0
      }

      // 显示成功提示
      showPlayerMessage(t('createArchive.playerAddedSuccess'), 'success')

      // 如果不是离线玩家，延迟批量获取用户名，避免频繁调用API
      if (!validation.isOfflinePlayer) {
        // 延迟500ms批量获取，提高缓存命中率
        setTimeout(async () => {
          await fetchSteamUsernames()
        }, 500)
      }
    }

    const removePlayer = (index) => {
      players.splice(index, 1)
      if (activePlayerIndex.value >= players.length) {
        activePlayerIndex.value = players.length - 1
      }
    }

    const selectPlayer = (index) => {
      activePlayerIndex.value = index
    }

    const getSlotContent = (playerIndex, slotIndex) => {
      if (players[playerIndex] && players[playerIndex].inventory) {
        return players[playerIndex].inventory[slotIndex]
      }
      return null
    }

    const getItemImageFile = (itemName) => {
      if (!itemName || itemName === 'None' || itemName === null) return 'None'
      // 特殊处理Toy物品，它的图片文件名是Teddy_Bear.png
      if (itemName === 'Toy') return 'Teddy_Bear'
      return itemName
    }

    const getSlotLabel = (slotIndex) => {
      const labels = ['mainHand', 'offHand1', 'offHand2']
      return labels[slotIndex] || ''
    }

    const editSlot = (playerIndex, slotIndex) => {
      if (playerIndex >= 0 && playerIndex < players.length) {
        editingSlot.value = { playerIndex, slotIndex }
        showItemSelector.value = true
      }
    }

    const resetForm = () => {
      // 重置表单状态
      currentStep.value = 1
      selectedLevel.value = -1
      selectedEnding.value = 0 // 重置为第一个结局（主线）
      archiveName.value = ''
      selectedGameMode.value = 'multiplayer' // 默认设置为多人模式
      selectedDifficulty.value = 'normal'
      selectedActualDifficulty.value = 'normal'
      newSteamId.value = ''
      activePlayerIndex.value = -1
      players.splice(0, players.length)
      isCreating.value = false
      // 重新加载主线的层级
      loadLevelsForEnding(0)
    }

    const nextStep = () => {
      if (currentStep.value < 3 && canProceed.value) {
        previousStepValue.value = currentStep.value
        currentStep.value++
      } else if (currentStep.value === 3) {
        createArchive()
      }
    }

    const previousStep = () => {
      if (currentStep.value > 1) {
        previousStepValue.value = currentStep.value
        currentStep.value--
      }
    }



    // 物品ID映射函数
    const getItemIdByName = (itemName) => {
      const itemMap = {
        'AlmondConcentrate': 1,
        'Lockpick': 2,
        'Bandage': 3,
        'Flashlight': 4,
        'StaminaPills': 5,
        'MedKit': 6,
        'NutritionBar': 7,
        'Coin': 8,
        'Batteries': 9,
        'Syringe': 10,
        'Bone': 11,
        'Key': 12,
        'Code': 13,
        'Glowstick': 14,
        'OxygenMask': 15,
        'Grapple': 16,
        'Soda': 17,
        'Beacon': 18,
        'Radio': 19,
        'Tea': 20,
        'HealingPotion': 21,
        'SpeedBoost': 22,
        'InvisibilityPotion': 23,
        'Knife': 24,
        'Toy': 25
      }
      return itemMap[itemName] || 1 // 默认返回1
    }

    const handleItemSelect = (itemId) => {
      if (editingSlot.value.playerIndex >= 0 && editingSlot.value.slotIndex >= 0) {
        const { playerIndex, slotIndex } = editingSlot.value
        if (players[playerIndex] && players[playerIndex].inventory) {
          players[playerIndex].inventory[slotIndex] = itemId
        }
      }
      editingSlot.value = { playerIndex: -1, slotIndex: -1 }
      showItemSelector.value = false
    }

    const fetchSteamUsernames = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        // 只获取非离线玩家的Steam ID
        const steamIds = players
          .filter(p => !p.isOfflinePlayer)
          .map(p => p.steamId)

        if (steamIds.length === 0) return

        const usernames = await invoke('get_steam_usernames_command', { steamIds })

        // 更新玩家用户名
        players.forEach((player) => {
          if (!player.isOfflinePlayer && usernames[player.steamId]) {
            player.username = usernames[player.steamId]
          }
        })
      } catch (error) {
        console.error('获取Steam用户名失败:', error)

        // 分析错误类型并提供相应的提示
        let errorMessage = error.toString()
        let userFriendlyMessage = ''

        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          userFriendlyMessage = t('createArchive.steamApiKeyInvalid')
        } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          userFriendlyMessage = t('createArchive.steamApiRateLimit')
        } else if (errorMessage.includes('Steam API密钥未配置')) {
          userFriendlyMessage = t('createArchive.steamApiKeyNotConfigured')
        } else if (errorMessage.includes('无效的Steam ID格式')) {
          userFriendlyMessage = t('createArchive.steamIdValidationError', { error: errorMessage })

          // 处理无效ID格式的情况，提取横杠前的部分作为用户名
          players.forEach((player) => {
            if (!player.isOfflinePlayer && player.steamId && player.steamId.includes('-')) {
              const parts = player.steamId.split('-')
              if (parts.length > 1) {
                player.username = `${parts[0]}(本地)`
                player.isOfflinePlayer = true
              }
            }
          })
        } else {
          userFriendlyMessage = t('createArchive.steamIdValidationError', { error: errorMessage })
        }

        // 显示错误提示
        showError(userFriendlyMessage)
      }
    }

    const loadJsonFile = async (filename) => {
      try {
        const response = await fetch(`/${filename}`)
        if (!response.ok) {
          throw new Error(`HTTP错误! 状态: ${response.status}`)
        }
        const jsonData = await response.json()
        return jsonData
      } catch (error) {
        console.error(`读取 ${filename} 失败:`, error)
        return null
      }
    }

    const createArchive = async () => {
      // 防止重复点击
      if (isCreating.value) {
        return
      }

      try {
        isCreating.value = true // 开始创建

        // 获取选中的层级
        const selectedLevelData = availableLevels[selectedLevel.value]
        if (!selectedLevelData) {
          alert('请选择层级')
          isCreating.value = false
          return
        }

        // 读取 BasicArchive.json 作为模板
        const basicArchive = await loadJsonFile('BasicArchive.json')
        if (!basicArchive) {
          alert('加载存档模板失败，请检查 BasicArchive.json 文件是否存在')
          isCreating.value = false
          return
        }


        // 判断是否为主线结局
        const isMainEnding = selectedEnding.value === 0

        // 判断是否需要锁定MEG
        const megLevels = ['Level0', 'TopFloor', 'MiddleFloor', 'GarageLevel2', 'BottomFloor', 'TheHub']
        const isMEGUnlocked = !megLevels.includes(selectedLevelData.levelKey)

        // 构建存档数据
        const saveData = {
          archive_name: archiveName.value.trim() || "未命名存档",
          level: selectedLevelData.levelKey || "Level0",
          game_mode: "multiplayer", // 始终设置为多人模式
          difficulty: selectedDifficulty.value.charAt(0).toUpperCase() + selectedDifficulty.value.slice(1) || "Normal",
          actual_difficulty: selectedActualDifficulty.value.charAt(0).toUpperCase() + selectedActualDifficulty.value.slice(1) || "Normal",
          players: players.map(p => ({
            steam_id: p.steamId || "",
            inventory: Array.isArray(p.inventory)
              ? p.inventory.filter(item => item !== null && item !== undefined).map(item => getItemIdByName(item))
              : []
          })),
          basic_archive: basicArchive || {}, // 确保不是 null
          main_ending: !isMainEnding, // 添加MainEnding参数，主线为false，支线为true
          meg_unlocked: isMEGUnlocked // 添加MEGUnlocked参数，特定层级为false，其他为true
        }

        // 验证所有必需字段
        if (!saveData.archive_name) {
          alert('请输入存档名称')
          isCreating.value = false
          return
        }
        if (!saveData.level) {
          alert('请选择层级')
          isCreating.value = false
          return
        }

        // 调用后端 API 创建存档
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('handle_new_save', { saveData })

        // 创建粒子爆炸效果
        createParticleExplosion()

        // 获取容器元素
        const container = document.querySelector('.create-archive-container')
        if (!container) return

        // 使用全局i18n实例获取翻译
        const t = (key) => {
          if (window.$i18n && window.$i18n.t) {
            return window.$i18n.t(key)
          }
          // 回退翻译
          const fallbackTranslations = {
            'createArchive.archiveCreated': '存档创建成功！',
            'createArchive.archiveCreatedMessage': '您的新存档已创建完成'
          }
          return fallbackTranslations[key] || key
        }

        // 创建成功提示卡片
        const successCard = document.createElement('div')
        successCard.className = 'success-card'
        successCard.innerHTML = `
          <div class="success-content">
            <div class="success-icon">
              <div class="icon-circle">
                <svg class="check-mark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 class="success-title">${t('createArchive.archiveCreated')}</h2>
            <p class="success-subtitle">${t('createArchive.archiveCreatedMessage')}</p>
            <div class="sparkles">
              <div class="sparkle" style="--delay: 0s"></div>
              <div class="sparkle" style="--delay: 0.2s"></div>
              <div class="sparkle" style="--delay: 0.4s"></div>
            </div>
          </div>
        `

        // 添加样式
        const style = document.createElement('style')
        style.textContent = `
        .success-card {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
          border: 1px solid var(--divider-light);
          border-radius: 24px;
          padding: 48px;
          text-align: center;
          z-index: 1000;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
        }
        
        .success-content {
          position: relative;
        }
        
        .icon-circle {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--success-color), #00d4aa);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          position: relative;
          box-shadow: 0 8px 32px rgba(0, 212, 170, 0.4);
        }
        
        .check-mark {
          color: white;
          width: 32px;
          height: 32px;
          stroke-width: 3;
        }
        
        .success-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        
        .success-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        
        .sparkles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: var(--accent-color);
          border-radius: 50%;
          animation: sparkle 1.5s ease-in-out infinite;
          animation-delay: var(--delay);
        }
        
        @keyframes sparkle {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(360deg);
          }
        }
        
        .particle {
          position: fixed;
          pointer-events: none;
          border-radius: 50%;
          z-index: 999;
        }
      `
        document.head.appendChild(style)

        document.body.appendChild(successCard)

        // 主动画时间线 - 简化动画，减少性能开销
        const tl = gsap.timeline({
          onComplete: () => {
            setTimeout(() => {
              // 成功卡片消失动画
              gsap.to(successCard, {
                opacity: 0,
                duration: 0.15,
                ease: "power1.in",
                onComplete: () => {
                  document.body.removeChild(successCard)
                  document.head.removeChild(style)

                  // 获取步骤2和3的包装器
                  const stepsWrapper = container?.querySelector('.content-wrapper')
                  if (!stepsWrapper) {
                    resetForm()
                    isCreating.value = false
                    return
                  }

                  // 步骤2和3的内容作为一个整体快速向右滑出
                  gsap.to(stepsWrapper, {
                    x: '150%',
                    opacity: 0,
                    duration: 0.3,
                    ease: "power1.in",
                    onComplete: () => {
                      resetForm()

                      // 重置包装器位置到左侧外部
                      gsap.set(stepsWrapper, { x: '-150%', opacity: 0 })

                      // 第一步内容保持不动，等待步骤2/3滑出后重新进入
                      // 步骤2/3的内容从左侧快速滑入
                      gsap.to(stepsWrapper, {
                        x: '0%',
                        opacity: 1,
                        duration: 0.4,
                        ease: "power1.out",
                        onComplete: () => {
                          // 延迟恢复按钮状态，确保用户看到明显的状态变化
                          setTimeout(() => {
                            isCreating.value = false
                          }, 1500) // 减少延迟时间至1.5秒
                        }
                      })
                    }
                  })
                }
              })
            }, 300) // 减少显示时间
          }
        })

        tl.fromTo(successCard,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "power1.out" }
        )

        // 使用具体选择器避免错误
        const iconCircle = successCard.querySelector('.icon-circle')
        const checkMark = successCard.querySelector('.check-mark')
        const successTitle = successCard.querySelector('.success-title')
        const successSubtitle = successCard.querySelector('.success-subtitle')

        if (iconCircle) {
          tl.from(iconCircle, {
            scale: 0,
            duration: 0.2,
            ease: "power1.out"
          }, "-=0.2")
        }

        if (checkMark) {
          tl.from(checkMark, {
            scale: 0,
            duration: 0.2,
            ease: "power1.out"
          }, "-=0.1")
        }

        if (successTitle) {
          tl.from(successTitle, {
            opacity: 0,
            duration: 0.15
          }, "-=0.1")
        }

        if (successSubtitle) {
          tl.from(successSubtitle, {
            opacity: 0,
            duration: 0.1
          }, "-=0.05")
        }
      } catch (error) {
        console.error('创建存档失败:', error)
        alert('创建存档失败: ' + (error.message || '未知错误'))
        isCreating.value = false // 失败时立即重置状态
      }
    }

    const createParticleExplosion = () => {
      const colors = ['#00d4aa', '#007aff', '#ff3b30', '#ff9500', '#af52de']
      const particles = 20 // 减少粒子数量

      for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div')
        particle.className = 'particle'

        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = Math.random() * 6 + 3 // 减小粒子大小
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 50 // 减小扩散范围
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 50

        particle.style.cssText = `
          position: fixed;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          left: ${x}px;
          top: ${y}px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 999;
        `

        document.body.appendChild(particle)

        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * 100 + 50 // 减小扩散距离

        gsap.to(particle, {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: 0,
          opacity: 0,
          duration: 0.8, // 缩短动画时间
          ease: "power1.out", // 使用更简单的缓动函数
          onComplete: () => {
            document.body.removeChild(particle)
          }
        })
      }
    }

    // 侧边栏展开状态
    const isSidebarExpanded = ref(false)

    // 监听侧边栏展开/收起事件
    const handleSidebarExpand = (event) => {
      isSidebarExpanded.value = event.detail
    }

    // 初始化
    onMounted(async () => {
      await loadLevels()

      // 监听侧边栏展开/收起事件
      window.addEventListener('sidebar-expand', handleSidebarExpand)

      // 如果有玩家，获取他们的用户名
      if (players.length > 0) {
        await fetchSteamUsernames()
      }
    })

    // 组件卸载时移除事件监听器
    onUnmounted(() => {
      window.removeEventListener('sidebar-expand', handleSidebarExpand)
    })

    // 过渡动画钩子
    const onStepEnter = (el, done) => {
      // 简化动画，减少性能开销
      gsap.fromTo(el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.2,
          ease: "power1.out",
          onComplete: () => {
            done()
            // 动画完成后滚动到顶部
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })
          }
        }
      )
    }

    const onStepLeave = (el, done) => {
      // 检查 el 是否有效，避免在组件卸载时出现空引用错误
      if (!el || !el.parentNode) {
        done()
        return
      }

      // 简化动画，减少性能开销
      gsap.to(el, {
        opacity: 0,
        duration: 0.15,
        ease: "power1.in",
        onComplete: done
      })
    }

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
      editingSlot,
      canProceed,
      selectLevel,
      selectEnding,
      addSteamId,
      removePlayer,
      selectPlayer,
      getSlotContent,
      getItemImageFile,
      getSlotLabel,
      editSlot,
      handleItemSelect,
      nextStep,
      previousStep,
      createArchive,
      resetForm,
      switchToBatchCreate,
      goToSelectMode,
      onStepEnter,
      onStepLeave,
      selectDifficulty,
      selectActualDifficulty,
      fetchSteamUsernames
    }
  }
}
</script>

<style scoped>
/* SwiftUI 风格样式 */
.create-archive-container {
  height: calc(100vh - 38px);
  /* 减去App.vue中main-content的margin-top */
  overflow: hidden;
  padding: 10px 24px 0 24px;
  background: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Helvetica Neue', sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 步骤指示器 - 居中显示 */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  gap: 16px;
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
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.step.active .step-number {
  background: rgba(255, 255, 255, 0.3);
}

.step-label {
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.step.active .step-label {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  0% {
    opacity: 0.7;
  }

  100% {
    opacity: 1;
  }
}

/* 数字切换过渡效果 */
.number-change-enter-active,
.number-change-leave-active {
  transition: all 0.3s ease;
}

.number-change-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.8);
}

.number-change-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.8);
}

.number-change-enter-to,
.number-change-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.step-connector {
  width: 40px;
  height: 2px;
  background: var(--divider-color);
  border-radius: 1px;
  transition: all 0.3s ease;
}

/* 结局选择器动画 */
.ending-selector-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.ending-selector-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

.ending-selector-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.ending-selector-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 结局选择器样式 */
.ending-selector {
  margin-bottom: 20px;
  overflow: hidden;
  /* 确保动画不会溢出 */
}

.ending-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  position: relative;
}

.ending-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.ending-tab.active {
  background: var(--accent-color) !important;
  border-color: var(--accent-color) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.3) !important;
  z-index: 10 !important;
  position: relative !important;
}

/* 移除复杂的波纹效果，简化为简单的点击反馈 */
.ending-tab:active {
  transform: scale(0.98);
}

.ending-tab:hover {
  background: var(--bg-tertiary);
}

.ending-icon {
  font-size: 18px;
  line-height: 1;
}

.ending-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* 内容包装器 */
.content-wrapper {
  width: 100%;
  /* 使用100%宽度，自适应容器 */
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  height: calc(100vh - 248px);
  /* 减去顶部区域(38px+70px+70px结局选择器)和底部操作栏高度(70px) */
  padding: 0 20px;
  /* 添加左右内边距，确保内容不会贴边 */
  box-sizing: border-box;
  /* 确保内边距包含在宽度内 */
}

/* 当不在第一步时，调整content-wrapper的高度 */
.content-wrapper.no-ending-selector {
  height: calc(100vh - 178px);
  /* 减去顶部区域(38px+70px)和底部操作栏高度(70px)，不包含结局选择器 */
}

/* 步骤内容 */
.step-content {
  margin-bottom: 48px;
}

/* 卡片样式 - 统一样式 */
.section-card,
.config-card,
.steam-id-card,
.inventory-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-card);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--divider-light);
}

/* 第一步选择层级的section-card样式，添加固定高度和内部滚动 */
.step-content[data-step="1"] .section-card {
  height: calc(100vh - 270px);
  overflow-y: auto;
  overflow-x: hidden;
}

.step-content[data-step="1"] .section-card::-webkit-scrollbar {
  width: 8px;
}

.step-content[data-step="1"] .section-card::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

.step-content[data-step="1"] .section-card::-webkit-scrollbar-thumb {
  background: var(--divider-color);
  border-radius: 4px;
}

.step-content[data-step="1"] .section-card::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.section-title,
.form-section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

/* 配置表单网格 - 优化布局 */
.config-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  max-width: 100%;
}

.config-card {
  flex: 1 1 280px;
  min-width: 280px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  transition: min-height 0.3s ease, height 0.3s ease;
}

.config-card.full-width {
  flex: 1 1 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 层级网格 */
.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  /* 增加最小宽度，提供更好的视觉效果 */
  gap: 24px;
  /* 增加间距 */
  padding-bottom: 20px;
  width: 100%;
  /* 确保网格使用全部可用宽度 */
  /* 强制GPU加速，防止布局抖动 */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.level-card {
  width: 100%;
  /* 宽度自适应 */
  min-height: 200px;
  /* 最小高度 */
  aspect-ratio: 4/3;
  /* 固定宽高比，确保卡片比例一致 */
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  /* 强制GPU加速，防止布局抖动 */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.level-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.level-card.selected {
  border: 2px solid var(--accent-color);
  transform: scale(1.02);
}

.level-image-container {
  position: relative;
  flex: 1;
  /* 占用剩余空间 */
  overflow: hidden;
  min-height: 150px;
  /* 最小高度 */
  /* 确保容器在过渡期间保持稳定 */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
  /* 防止内容在过渡期间溢出 */
  box-sizing: border-box;
  /* 确保容器在过渡期间保持固定尺寸 */
  min-width: 100%;
  width: 100%;
}

.level-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 确保图片正确填充容器 */
  background-color: var(--bg-tertiary);
  /* 添加背景色，图片未加载时显示 */
}

.level-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.level-card.selected .level-overlay {
  opacity: 1;
}

.check-icon {
  color: white;
  font-size: 32px;
}

.level-info {
  padding: 12px 16px;
  min-height: 50px;
  /* 最小高度，确保文字区域大小一致 */
  flex-shrink: 0;
  /* 防止文字部分被压缩 */
  display: flex;
  align-items: center;
  /* 垂直居中对齐 */
}

.level-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 文字过长时显示省略号 */
}

.level-description {
  font-size: 14px;
  color: var(--text-secondary);
  display: none;
  /* 暂时隐藏描述，确保名称显示 */
}

/* 表单元素 */
.form-group {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: 14px;
  color: var(--error-color);
}

/* 错误提示动画 */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from {
  opacity: 0;
  transform: translateY(-5px);
}

.error-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.error-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* 卡片高度变化动画 */
.config-card-height-enter-active,
.config-card-height-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.config-card-height-enter-from,
.config-card-height-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.config-card-height-enter-to,
.config-card-height-leave-from {
  opacity: 1;
  max-height: 1000px;
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--divider-color);
  border-radius: var(--radius-input);
  font-size: 16px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  padding: var(--space-3);
  border-radius: var(--radius-input);
  transition: all 0.3s ease;
}

.radio-option:hover {
  background: var(--bg-tertiary);
}

.radio-input {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--divider-color);
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
}

.radio-input:checked+.radio-custom {
  border-color: var(--accent-color);
  background: var(--accent-color);
}

.radio-input:checked+.radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.radio-label {
  font-size: 16px;
  color: var(--text-primary);
}

/* 难度选择 */
.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.difficulty-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px solid var(--divider-color);
  border-radius: var(--radius-input);
  cursor: pointer;
  transition: all 0.3s ease;
}

.difficulty-option:hover {
  border-color: var(--accent-color);
  background: var(--bg-tertiary);
}

.difficulty-option.selected {
  border-color: var(--accent-color);
  background: rgba(0, 122, 255, 0.1);
}

/* 单人模式提示 */
.singleplayer-notice {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 禁用状态样式 */
.difficulty-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.difficulty-option.disabled:hover {
  border-color: var(--divider-light);
  background: var(--bg-secondary);
}

.step-info {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 底部操作按钮 - 毛玻璃样式 */
.bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-8);
  /* 增加内边距 */
  position: fixed;
  bottom: 0;
  left: 0;
  /* 侧边栏收起时的宽度 */
  right: 0;
  height: 70px;
  /* 增加高度 */
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  -webkit-backdrop-filter: var(--glass-backdrop-filter);
  border-top: 1px solid var(--glass-border);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  transition: left 0.3s ease, background 0.3s ease;
  /* 与侧边栏展开/收起动画同步 */
  transform: translateY(-55%);
}

/* 步骤信息样式 */
.step-info {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

/* 侧边栏展开时调整底部操作按钮位置 */
.sidebar-expanded .bottom-actions {
  left: 150px;
  /* 侧边栏展开时的宽度 */
}

.action-button {
  display: flex;
  align-items: center;
  gap: 10px;
  /* 增加图标和文字之间的间距 */
  padding: 14px 28px;
  /* 增加内边距 */
  border: none;
  border-radius: 20px;
  /* 稍微增加圆角 */
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  /* 设置最小宽度 */
  justify-content: center;
  /* 居中对齐内容 */
}

.action-button.primary {
  background: var(--accent-color);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.action-button.secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--divider-color);
}

.action-button.secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Steam ID 管理 */
.steam-id-input-group {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.steam-id-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: var(--radius-input);
  color: var(--accent-color);
  font-size: 14px;
}

.add-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--radius-input);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-button:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.steam-id-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.steam-id-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-input);
  cursor: pointer;
  transition: all 0.3s ease;
}

.steam-id-item:hover {
  background: var(--bg-tertiary);
}

.steam-id-item.active {
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid var(--accent-color);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.player-id {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.player-id.has-username {
  color: var(--accent-color);
}

.steam-id {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.username {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-1-5);
}

.username.loading {
  color: var(--text-tertiary);
  font-style: italic;
}

/* 玩家输入提示信息样式 */
.player-input-message {
  margin-top: var(--space-2);
  padding: var(--space-2-5) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  animation: fadeIn 0.3s ease;
}

.player-input-message svg {
  font-size: 16px;
  flex-shrink: 0;
}

.player-input-message.success {
  background: rgba(52, 199, 89, 0.1);
  color: var(--success-color);
  border: 1px solid rgba(52, 199, 89, 0.2);
}

.player-input-message.error {
  background: rgba(255, 59, 48, 0.1);
  color: var(--error-color);
  border: 1px solid rgba(255, 59, 48, 0.2);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 提示信息过渡动画 */
.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.message-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.message-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid rgba(0, 122, 255, 0.2);
  border-top: 1.5px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.remove-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.remove-button:hover {
  background: var(--error-color);
  color: white;
}

/* 背包样式 */
.inventory-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
}

.inventory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}

.inventory-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
  text-align: center;
}

.inventory-backpack {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  justify-items: center;
  justify-content: center;
  margin: 0 auto;
  max-width: fit-content;
}

.inventory-slot {
  width: 60px;
  height: 60px;
  border: 1px solid var(--divider-color);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-primary);
}

.inventory-slot:hover {
  border-color: var(--accent-color);
  background: var(--bg-tertiary);
}

.inventory-slot.empty {
  opacity: 0.5;
}

.slot-label {
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: var(--space-0-5);
}

.slot-number {
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: var(--space-0-5);
}

.slot-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-icon {
  font-size: 20px;
  color: var(--text-primary);
}

.item-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
  margin: auto;
}

/* 空背包提示 */
.empty-inventory-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-15) var(--space-5);
  color: var(--text-secondary);
  text-align: center;
}

.empty-inventory-message .fa-info-circle {
  font-size: 48px;
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-inventory-message p {
  font-size: 16px;
  margin: 0;
}

/* 批量创建按钮样式 */
.batch-create-button {
  position: absolute;
  top: var(--space-5);
  right: var(--space-5);
  z-index: 100;
  /* display: flex; */
  display: none;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
}

.batch-create-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.batch-create-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-md);
}

.batch-create-button.shrink {
  transform: scale(0.9);
  opacity: 0;
}

/* 批量创建按钮动画 */
.batch-switch-enter-active,
.batch-switch-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.batch-switch-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.8);
}

.batch-switch-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.batch-switch-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.batch-switch-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.8);
}

/* 响应式调整 */
/* 物品图片渐显渐隐动画 */
.item-fade-enter-active,
.item-fade-leave-active {
  transition: opacity 0.15s ease;
}

.item-fade-enter-from,
.item-fade-leave-to {
  opacity: 0;
}

.item-fade-enter-to,
.item-fade-leave-from {
  opacity: 1;
}

@media (max-width: 768px) {
  .batch-create-button {
    top: var(--space-4);
    right: var(--space-4);
    padding: var(--space-2-5) var(--space-4);
    font-size: 13px;
  }

  .batch-create-button .button-text {
    display: none;
  }

  .batch-create-button .fa-layer-group {
    margin: 0;
  }
}

@media (max-width: 480px) {
  .batch-create-button {
    top: var(--space-3);
    right: var(--space-3);
    padding: var(--space-2) var(--space-3);
  }
}

/* 步骤信息过渡动画 */
.step-info-change-enter-active,
.step-info-change-leave-active {
  transition: all 0.3s ease;
}

.step-info-change-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

.step-info-change-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.step-info-change-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.step-info-change-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}

/* 层级卡片过渡动画 */
.level-fade-enter-active {
  transition: opacity 0.4s ease;
  transition-delay: calc(var(--index) * 0.05s);
  position: relative;
  z-index: 1;
}

.level-fade-leave-active {
  transition: opacity 0.2s ease;
  position: absolute;
  width: 100%;
  /* 宽度自适应，与level-card一致 */
  max-width: 100%;
  /* 限制最大宽度 */
  aspect-ratio: 4/3;
  /* 固定宽高比，与level-card一致 */
  max-height: calc(100vw * 0.75);
  /* 限制最大高度，防止图片放大 */
  z-index: 0;
  /* 确保离开的元素在进入的元素之下 */
  overflow: hidden;
  /* 防止内容溢出 */
  /* 强制GPU加速，防止布局抖动 */
  will-change: opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.level-fade-move {
  transition: transform 0.4s ease;
}

.level-fade-enter-from {
  opacity: 0;
}

.level-fade-enter-to {
  opacity: 1;
}

.level-fade-leave-from {
  opacity: 1;
}

.level-fade-leave-to {
  opacity: 0;
}

/* 确保level-grid在过渡期间保持布局 */
.level-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  /* 增加最小宽度，提供更好的视觉效果 */
  gap: var(--space-6);
  /* 增加间距 */
  padding-bottom: var(--space-5);
  width: 100%;
  /* 确保网格使用全部可用宽度 */
  min-height: 300px;
  /* 确保容器有最小高度 */
  overflow: hidden;
  /* 防止元素溢出 */
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .content-wrapper {
    padding: 0 var(--space-4);
    /* 减少内边距 */
  }
}

@media (max-width: 1200px) {
  .level-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--space-5);
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 0 var(--space-3);
    /* 进一步减少内边距 */
  }

  .level-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-4);
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 0 var(--space-2);
    /* 最小内边距 */
  }

  .level-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-3);
  }
}

/* 模式选择按钮样式 */
.mode-select-button {
  position: absolute;
  top: var(--space-5);
  right: var(--space-5);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
}

.mode-select-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.mode-select-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-md);
}

/* 模式选择按钮动画 */
.mode-button-enter-active,
.mode-button-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-button-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.8);
}

.mode-button-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.mode-button-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.mode-button-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.8);
}

/* 响应式设计 - 模式选择按钮 */
@media (max-width: 768px) {
  .mode-select-button {
    top: var(--space-4);
    right: var(--space-4);
    padding: var(--space-2-5) var(--space-4);
    font-size: 13px;
  }

  .mode-select-button .button-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .mode-select-button {
    top: var(--space-3);
    right: var(--space-3);
    padding: var(--space-2) var(--space-3);
  }
}
</style>
