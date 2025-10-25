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

    <!-- 切换到批量创建页面的按钮 -->
    <transition name="batch-switch">
      <button class="batch-create-button" @click="switchToBatchCreate" :class="{ 'shrink': isSwitching }">
        <font-awesome-icon :icon="['fas', 'layer-group']" />
        <span class="button-text">{{ $t('createArchive.batchCreate') }}</span>
      </button>
    </transition>

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <!-- 步骤内容容器 -->
      <transition name="step-transition" mode="out-in" @enter="onStepEnter" @leave="onStepLeave">
        <div :key="currentStep" class="step-container">
          <div class="step-content" :data-step="currentStep">
            <!-- 步骤1: 选择层级 -->
            <div v-if="currentStep === 1" class="section-card">
              <div class="level-grid">
                <div v-for="(level, index) in availableLevels" :key="index" class="level-card"
                  :class="{ selected: selectedLevel === index }" @click="selectLevel(index)">
                  <div class="level-image-container">
                    <img :src="level.image" :alt="level.name" class="level-image" />
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
                  <div v-for="difficulty in difficultyLevels" :key="difficulty.value" class="difficulty-option"
                    :class="{ 
                      selected: selectedDifficulty === difficulty.value,
                      disabled: selectedGameMode === 'singleplayer' && difficulty.value !== 'normal'
                    }"
                    @click="selectDifficulty(difficulty.value)">
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
                    class="difficulty-option" 
                    :class="{ 
                      selected: selectedActualDifficulty === difficulty.value,
                      disabled: selectedGameMode === 'singleplayer' && difficulty.value !== 'normal'
                    }"
                    @click="selectActualDifficulty(difficulty.value)">
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
                    :placeholder="$t('createArchive.steamIdPlaceholder')"
                    @input="newSteamId = newSteamId.replace(/[^0-9]/g, '')" @keyup.enter="addSteamId" />
                  <button @click="addSteamId" class="add-button">
                    <font-awesome-icon :icon="['fas', 'plus']" />
                    {{ $t('createArchive.add') }}
                  </button>
                </div>

                <!-- Steam ID 列表 -->
                <div class="steam-id-list">
                  <div v-for="(player, index) in players" :key="index" class="steam-id-item"
                    :class="{ active: activePlayerIndex === index }" @click="selectPlayer(index)">
                    <span class="steam-id-text">{{ player.steamId }}</span>
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
                    {{ $t('createArchive.editInventoryFor', { steamId: players[activePlayerIndex].steamId }) }}
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
                        <img v-if="getSlotContent(activePlayerIndex, slot - 1)"
                          :src="`/icons/ETB_UI/${getSlotContent(activePlayerIndex, slot - 1)}.png`"
                          :alt="getSlotContent(activePlayerIndex, slot - 1)" class="item-image" />
                        <font-awesome-icon v-else :icon="['fas', 'hand-paper']" class="slot-icon" />
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
                        <img v-if="getSlotContent(activePlayerIndex, slot + 2)"
                          :src="`/icons/ETB_UI/${getSlotContent(activePlayerIndex, slot + 2)}.png`"
                          :alt="getSlotContent(activePlayerIndex, slot + 2)" class="item-image" />
                        <font-awesome-icon v-else :icon="['fas', 'square']" class="slot-icon" />
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
        {{ $t('createArchive.step') }} {{ currentStep }} / 3
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

export default {
  name: 'CreateArchive',
  components: {
    InventoryItemSelector
  },
  setup() {
    const { t } = useI18n({ useScope: 'global' })
    const router = useRouter()
    const currentStep = ref(1)
    const previousStepValue = ref(1)
    const selectedLevel = ref(-1)
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

    // 动态加载层级数据
    const availableLevels = reactive([])
    const players = reactive([])



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

    // 方法
    const selectDifficulty = (difficulty) => {
      selectedDifficulty.value = difficulty
    }

    const selectActualDifficulty = (difficulty) => {
      selectedActualDifficulty.value = difficulty
    }



    const switchToBatchCreate = () => {
      isSwitching.value = true

      // 添加淡出动画
      gsap.to('.create-archive-container', {
        opacity: 0,
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          router.push('/batch-create-archive')
        }
      })
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

      levelMappings.forEach((levelKey, index) => {
        // 现在所有关卡都使用关卡名称作为图片文件名
        const imagePath = `/images/${levelKey}.jpg`
        
        availableLevels.push({
          name: t(`LevelName_Display.${levelKey}`),
          image: imagePath,
          levelKey: levelKey
        })
      })
    }

    const selectLevel = (index) => {
      selectedLevel.value = index
      // 添加选中动画
      gsap.to(`.level-card:nth-child(${index + 1})`, {
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      })
    }

    const addSteamId = () => {
      const steamId = newSteamId.value.trim()
      if (steamId && /^\d+$/.test(steamId)) {
        players.push({
          steamId: steamId,
          inventory: Array(12).fill(null)
        })
        newSteamId.value = ''
        if (activePlayerIndex.value === -1) {
          activePlayerIndex.value = 0
        }
      } else if (steamId) {
        alert(t('createArchive.steamIdInvalid'))
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
      archiveName.value = ''
      selectedGameMode.value = 'multiplayer' // 默认设置为多人模式
      selectedDifficulty.value = 'normal'
      selectedActualDifficulty.value = 'normal'
      newSteamId.value = ''
      activePlayerIndex.value = -1
      players.splice(0, players.length)
      isCreating.value = false
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


        // 构建存档数据
        const saveData = {
          archive_name: archiveName.value.trim() || "未命名存档",
          level: selectedLevelData.levelKey || "Level0",
          game_mode: "multiplayer", // 始终设置为多人模式
          difficulty: selectedDifficulty.value.charAt(0).toUpperCase() + selectedDifficulty.value.slice(1) || "Normal",
          actual_difficulty: selectedActualDifficulty.value.charAt(0).toUpperCase() + selectedActualDifficulty.value.slice(1) || "Normal",
          players: players.map(p => ({
            steam_id: p.steamId || "",
            inventory: Array.isArray(p.inventory) ? p.inventory.filter(item => item !== null && item !== undefined) : []
          })),
          basic_archive: basicArchive || {} // 确保不是 null
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

        // 主动画时间线
        const tl = gsap.timeline({
          onComplete: () => {
            setTimeout(() => {
              // 成功卡片消失动画
              gsap.to(successCard, {
                x: 100,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
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
                    duration: 0.6,
                    ease: "power2.in",
                    onComplete: () => {
                      resetForm()

                      // 重置包装器位置到左侧外部
                      gsap.set(stepsWrapper, { x: '-150%', opacity: 0 })

                      // 第一步内容保持不动，等待步骤2/3滑出后重新进入
                      // 步骤2/3的内容从左侧快速滑入
                      gsap.to(stepsWrapper, {
                        x: '0%',
                        opacity: 1,
                        duration: 0.7,
                        ease: "power2.out",
                        onComplete: () => {
                          // 延迟恢复按钮状态，确保用户看到明显的状态变化
                          setTimeout(() => {
                            isCreating.value = false
                          }, 2000) // 延长禁用时间至2秒
                        }
                      })
                    }
                  })
                }
              })
            }, 500)
          }
        })

        tl.fromTo(successCard,
          { scale: 0, opacity: 0, rotation: -10 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: "back.out(1.7)" }
        )

        // 使用具体选择器避免错误
        const iconCircle = successCard.querySelector('.icon-circle')
        const checkMark = successCard.querySelector('.check-mark')
        const successTitle = successCard.querySelector('.success-title')
        const successSubtitle = successCard.querySelector('.success-subtitle')

        if (iconCircle) {
          tl.from(iconCircle, {
            scale: 0,
            rotation: -180,
            duration: 0.4,
            ease: "back.out(1.7)"
          }, "-=0.4")
        }

        if (checkMark) {
          tl.from(checkMark, {
            scale: 0,
            duration: 0.4,
            ease: "back.out(2)"
          }, "-=0.3")
        }

        if (successTitle) {
          tl.from(successTitle, {
            y: 20,
            opacity: 0,
            duration: 0.3
          }, "-=0.2")
        }

        if (successSubtitle) {
          tl.from(successSubtitle, {
            y: 10,
            opacity: 0,
            duration: 0.2
          }, "-=0.1")
        }
      } catch (error) {
        console.error('创建存档失败:', error)
        alert('创建存档失败: ' + (error.message || '未知错误'))
        isCreating.value = false // 失败时立即重置状态
      }
    }

    const createParticleExplosion = () => {
      const colors = ['#00d4aa', '#007aff', '#ff3b30', '#ff9500', '#af52de']
      const particles = 50

      for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div')
        particle.className = 'particle'

        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = Math.random() * 8 + 4
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 100
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 100

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
        const distance = Math.random() * 200 + 100

        gsap.to(particle, {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: 0,
          opacity: 0,
          duration: 1.5,
          ease: "power2.out",
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

    // 初始化动画
    onMounted(() => {
      loadLevels()

      // 监听侧边栏展开/收起事件
      window.addEventListener('sidebar-expand', handleSidebarExpand)

      // 页面入场动画 - 移除对.page-header的引用
      const tl = gsap.timeline({ delay: 0.1 })

      // 获取实际存在的元素
      const stepIndicator = document.querySelector('.step-indicator')
      const stepContent = document.querySelector('.step-content')
      const bottomActions = document.querySelector('.bottom-actions')

      if (stepIndicator) {
        tl.from(stepIndicator, {
          y: -20,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out"
        })
      }

      if (stepContent) {
        tl.from(stepContent, {
          y: 20,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.2")
      }

      if (bottomActions) {
        tl.from(bottomActions, {
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.2")
      }
    })

    // 组件卸载时移除事件监听器
    onUnmounted(() => {
      window.removeEventListener('sidebar-expand', handleSidebarExpand)
    })

    // 过渡动画钩子
    const onStepEnter = (el, done) => {
      const isMovingForward = currentStep.value > previousStepValue.value
      const direction = isMovingForward ? 1 : -1

      gsap.fromTo(el,
        { x: 100 * direction, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
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
      const isMovingForward = currentStep.value > previousStepValue.value
      const direction = isMovingForward ? -1 : 1

      gsap.to(el, {
        x: 100 * direction,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: done
      })
    }

    return {
      currentStep,
      previousStep,
      selectedLevel,
      availableLevels,
      archiveName,
      selectedGameMode,
      selectedDifficulty,
      selectedActualDifficulty,
      gameModes,
      difficultyLevels,
      newSteamId,
      players,
      activePlayerIndex,
      isSidebarExpanded,
      isSwitching,
      isCreating,
      showItemSelector,
      editingSlot,
      canProceed,
      selectLevel,
      addSteamId,
      removePlayer,
      selectPlayer,
      getSlotContent,
      getSlotLabel,
      editSlot,
      handleItemSelect,
      nextStep,
      previousStep,
      createArchive,
      resetForm,
      switchToBatchCreate,
      onStepEnter,
      onStepLeave,
      selectDifficulty,
      selectActualDifficulty
    }
  }
}
</script>

<style scoped>
/* SwiftUI 风格样式 */
.create-archive-container {
  height: 100vh;
  overflow: hidden;
  padding: 10px 24px 80px 24px;
  background: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Helvetica Neue', sans-serif;
  display: flex;
  flex-direction: column;
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

/* 内容包装器 */
.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  height: calc(100vh - 150px);
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
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid var(--divider-light);
  transition: all 0.3s ease;
}

/* 第一步选择层级的section-card样式，添加固定高度和内部滚动 */
.step-content[data-step="1"] .section-card {
  max-height: calc(100vh - 200px);
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding-bottom: 20px;
}

.level-card {
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.level-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.level-card.selected {
  border: 2px solid var(--accent-color);
  transform: scale(1.02);
}

.level-image-container {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.level-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  padding: 16px;
}

.level-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.level-description {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 表单元素 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
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
  padding: 12px 16px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
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
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
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
  gap: 12px;
}

.difficulty-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
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
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 8px;
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

.difficulty-icon {
  font-size: 24px;
  color: var(--text-secondary);
}

.difficulty-option.selected .difficulty-icon {
  color: var(--accent-color);
}

.difficulty-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

/* Steam ID 管理 */
.steam-id-input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.steam-id-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 12px;
  color: var(--accent-color);
  font-size: 14px;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 12px;
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
  gap: 8px;
}

.steam-id-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-radius: 12px;
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

.steam-id-text {
  font-size: 14px;
  color: var(--text-primary);
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
  gap: 24px;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
}

.inventory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}

.inventory-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
}

.inventory-backpack {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  justify-items: center;
  justify-content: center;
  margin: 0 auto;
  max-width: fit-content;
}

.inventory-slot {
  width: 60px;
  height: 60px;
  border: 1px solid var(--divider-color);
  border-radius: 8px;
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
  margin-bottom: 2px;
}

.slot-number {
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 2px;
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
  width: 32px;
  height: 32px;
  object-fit: contain;
}

/* 底部操作按钮 - 毛玻璃样式 */
.bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  position: fixed;
  bottom: 0;
  left: 0;
  /* 侧边栏收起时的宽度 */
  right: 0;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  -webkit-backdrop-filter: var(--glass-backdrop-filter);
  border-top: 1px solid var(--glass-border);
  box-shadow: 0 -8px 32px var(--glass-shadow-light), 0 -2px 8px var(--glass-shadow-medium);
  margin-top: auto;
  z-index: 100;
  transition: left 0.3s ease, background 0.3s ease;
  /* 与侧边栏展开/收起动画同步 */
}

/* 侧边栏展开时调整底部操作按钮位置 */
.sidebar-expanded .bottom-actions {
  left: 150px;
  /* 侧边栏展开时的宽度 */
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 18px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
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

.step-info {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Steam ID管理卡片自适应布局 */
.steam-id-card {
  height: 60vh;
  max-height: 600px;
  min-height: 350px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
}

.steam-id-input-group {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.steam-id-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--divider-light);
  border-radius: 12px;
  padding: 8px;
  background: var(--bg-tertiary);
  min-height: 200px;
}

.steam-id-list::-webkit-scrollbar {
  width: 6px;
}

.steam-id-list::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.steam-id-list::-webkit-scrollbar-thumb {
  background: var(--divider-color);
  border-radius: 3px;
}

.steam-id-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* 背包卡片自适应宽度 */
.inventory-card {
  width: 100%;
  max-width: 100%;
  min-width: 100%;
}

/* 空背包提示 */
.empty-inventory-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-inventory-message .fa-info-circle {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-inventory-message p {
  font-size: 16px;
  margin: 0;
}

/* 确保卡片容器自适应 */
.step-content[data-step="3"] .card {
  width: 100%;
  max-width: 100%;
}

/* 步骤3的网格布局优化 */
.step-content[data-step="3"] .step-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
}

@media (max-width: 768px) {
  .step-content[data-step="3"] .step-grid {
    grid-template-columns: 1fr;
  }
}

/* 响应式设计 - 优化不同屏幕尺寸 */
@media (max-width: 1200px) {
  .config-card {
    flex: 1 1 300px;
  }

  /* 中等屏幕下底部操作按钮的调整 */
  .bottom-actions {
    left: 70px;
    /* 保持与侧边栏的间距 */
  }

  .sidebar-expanded .bottom-actions {
    left: 220px;
    /* 侧边栏展开时保持间距 */
  }
}

@media (max-width: 768px) {
  .create-archive-container {
    padding: 0 16px 80px 16px;
  }

  .step-indicator {
    flex-direction: column;
    gap: 8px;
  }

  .step-connector {
    width: 2px;
    height: 20px;
  }

  .config-card {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .level-grid {
    grid-template-columns: 1fr;
  }

  .difficulty-grid {
    grid-template-columns: 1fr;
  }

  .inventory-section {
    grid-template-columns: 1fr;
  }

  .inventory-backpack {
    grid-template-columns: repeat(3, 1fr);
    justify-items: center;
  }

  .bottom-actions {
    flex-direction: column;
    gap: 8px;
    padding: 8px 16px;
    left: 0;
    /* 在小屏幕上不需要考虑侧边栏 */
  }

  /* 小屏幕下侧边栏展开时的底部操作按钮 */
  .sidebar-expanded .bottom-actions {
    left: 0;
    /* 在小屏幕上不需要考虑侧边栏 */
  }
}

@media (max-width: 480px) {
  .step {
    padding: 8px 12px;
  }

  .step-label {
    font-size: 12px;
  }

  .config-card,
  .section-card {
    padding: 16px;
  }

  .inventory-slot {
    width: 50px;
    height: 50px;
  }

  .slot-icon {
    font-size: 16px;
  }
}

/* 批量创建按钮样式 */
.batch-create-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  /* display: flex; */
  display: none;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 25px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
}

.batch-create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.batch-create-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.1);
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
@media (max-width: 768px) {
  .batch-create-button {
    top: 16px;
    right: 16px;
    padding: 10px 16px;
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
    top: 12px;
    right: 12px;
    padding: 8px 12px;
  }
}
</style>