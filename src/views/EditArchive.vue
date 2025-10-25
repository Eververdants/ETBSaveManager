<template>
  <div class="edit-archive-container">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <h1 class="page-title">{{ $t('editArchive.title') }}</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="closeEdit">
          <font-awesome-icon :icon="['fas', 'times']" />
          {{ $t('common.cancel') }}
        </button>
        <button class="btn-primary" @click="handleSaveArchive">
          <font-awesome-icon :icon="['fas', 'save']" />
          {{ $t('common.save') }}
        </button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <div class="form-container">
        <!-- 存档名称 -->
        <div class="form-section">
          <label class="section-title">{{ $t('editArchive.archiveName') }}</label>
          <div class="input-wrapper">
            <input v-model="archiveData.name" type="text" class="form-input"
              :placeholder="$t('editArchive.archiveNamePlaceholder')" maxlength="50" />
          </div>
        </div>

        <!-- 当前层级 -->
        <div class="form-section">
          <label class="section-title">{{ $t('editArchive.selectLevelTitle') }}</label>
          <div class="level-selector">
            <div v-for="(level, index) in availableLevels" :key="index" class="level-option"
              :class="{ selected: archiveData.currentLevel === level.levelKey }" @click="selectLevel(level.levelKey)">
              <div class="level-image-container">
                <img :src="level.image" :alt="level.name" class="level-image" @error="handleImageError" />
                <div class="level-overlay">
                  <font-awesome-icon :icon="['fas', 'check']" class="check-icon"
                    v-if="archiveData.currentLevel === level.levelKey" />
                </div>
              </div>
              <span class="level-name">{{ level.name }}</span>
            </div>
          </div>
        </div>



        <!-- 难度设置 -->
        <div class="form-row">
          <div class="form-section half-width">
            <label class="section-title">{{ $t('editArchive.difficulty') }}</label>
            <div class="difficulty-grid">
              <div v-for="difficulty in difficultyLevels" :key="difficulty.value" class="difficulty-option"
                :class="{ 
                  selected: archiveData.archiveDifficulty === difficulty.value
                }"
                @click="handleDifficultySelect('archive', difficulty.value)">
                <div class="difficulty-icon">
                  <font-awesome-icon :icon="difficulty.icon" />
                </div>
                <span class="difficulty-label">{{ $t(`editArchive.difficultyLevels.${difficulty.value}`) }}</span>
              </div>
            </div>
          </div>

          <div class="form-section half-width">
            <label class="section-title">{{ $t('editArchive.actualDifficulty') }}</label>
            <div class="difficulty-grid">
              <div v-for="difficulty in difficultyLevels" :key="`actual-${difficulty.value}`" class="difficulty-option"
                :class="{ 
                  selected: archiveData.actualDifficulty === difficulty.value
                }"
                @click="handleDifficultySelect('actual', difficulty.value)">
                <div class="difficulty-icon">
                  <font-awesome-icon :icon="difficulty.icon" />
                </div>
                <span class="difficulty-label">{{ $t(`editArchive.difficultyLevels.${difficulty.value}`) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 玩家背包管理 -->
        <div class="form-section">
          <label class="section-title">{{ $t('editArchive.playerManagement') }}</label>

          <!-- Steam ID 列表 -->
          <div class="player-list">
            <div v-for="(player, index) in archiveData.players" :key="index" class="player-card"
              :class="{ active: activePlayerIndex === index }" @click="selectPlayer(index)">
              <span class="player-id">{{ player.steamId }}</span>
              <button class="remove-player-btn" @click.stop="removePlayer(index)">
                <font-awesome-icon :icon="['fas', 'trash']" />
              </button>
            </div>
          </div>

          <div class="add-player-section">
            <input v-model="newSteamId" type="text" class="form-input"
              :placeholder="$t('editArchive.steamIdPlaceholder')"
              @input="newSteamId = newSteamId.replace(/[^0-9]/g, '')" @keyup.enter="addPlayer" />
            <button class="add-player-btn" @click="addPlayer">
              <font-awesome-icon :icon="['fas', 'plus']" />
            </button>
          </div>

          <!-- 无玩家提示 -->
          <div v-if="archiveData.players.length === 0" class="no-players-hint">
            <font-awesome-icon :icon="['fas', 'users']" class="hint-icon" />
            <p>{{ $t('editArchive.noPlayersHint') }}</p>
          </div>

          <!-- 玩家背包管理 -->
          <div v-if="activePlayerIndex !== -1 && archiveData.players.length > 0" class="inventory-section">
            <div class="inventory-grid">
              <!-- 主手和副手位置 -->
              <div class="inventory-column">
                <div v-for="slot in 3" :key="`weapon-${slot - 1}`" class="inventory-slot weapon-slot" :class="{
                  'main-hand': slot === 1,
                  'off-hand': slot > 1,
                  'empty': !getSlotContent(activePlayerIndex, slot - 1)
                }" @click="editSlot(activePlayerIndex, slot - 1)">
                  <div class="slot-label">{{ $t(`editArchive.${getSlotLabel(slot - 1)}`) }}</div>
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
          </div>
        </div>
      </div>
    </div>
    <!-- 物品选择器 -->
    <InventoryItemSelector :visible="showItemSelector" @select="handleItemSelect"
      @update:visible="showItemSelector = $event" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { gsap } from 'gsap'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import InventoryItemSelector from '../components/InventoryItemSelector.vue'

const props = defineProps({
  archiveData: {
    type: String,
    default: ''
  }
})

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

// 添加一个方法来处理实际的存档保存逻辑
const handleSaveArchive = async () => {
  try {
    if (!originalArchive.value) {
      console.error('No original archive data found')
      return
    }

    // 构造玩家背包数据
    const playerInventory = {}
    const playerSanity = {}

    archiveData.players.forEach(player => {
      const steamId = player.steamId.trim()
      playerInventory[steamId] = player.inventory.map(itemId => ({
        item: { id: getItemIdByName(itemId) }
      }))
      playerSanity[steamId] = 100 // 默认理智值
    })

    // 构造要保存的数据
    const saveData = {
      path: originalArchive.value.path,
      name: archiveData.name,
      mode: 'Multiplayer', // 始终设置为多人模式
      currentLevel: archiveData.currentLevel,
      difficulty: archiveData.archiveDifficulty.charAt(0).toUpperCase() + archiveData.archiveDifficulty.slice(1),
      actualDifficulty: archiveData.actualDifficulty.charAt(0).toUpperCase() + archiveData.actualDifficulty.slice(1),
      playerInventory,
      playerSanity
    }

    console.log(t('editArchive.savingArchiveData'), saveData)

    // 调用后端的编辑API
    const outputDir = await invoke('get_local_appdata') + '\\EscapeTheBackrooms\\Saved\\SaveGames'
    const result = await invoke('handle_edit_save', {
      jsonInput: {
        saveData: {
          jsonData: saveData,
          outputDir: outputDir
        }
      }
    })

    console.log('Archive saved successfully:', result)

    // 保存成功后返回主页
    router.push({ name: 'Home' })
  } catch (error) {
    console.error(t('editArchive.saveFailed'), error)
    // 这里可以添加错误提示
  }
}

// 解析传入的存档数据
const originalArchive = ref(null)

// 表单数据
const archiveData = reactive({
  name: '',
  currentLevel: 'Level0',
  gameMode: 'multiplayer', // 默认设置为多人模式
  archiveDifficulty: 'normal',
  actualDifficulty: 'normal',
  players: []
})

// 初始化存档数据
const initArchiveData = () => {
  try {
    if (props.archiveData) {
      const data = JSON.parse(props.archiveData)
      originalArchive.value = data

      // 填充表单数据
      archiveData.name = data.name || ''
      archiveData.currentLevel = data.currentLevel || 'Level0'
      // 强制设置为多人模式
      archiveData.gameMode = 'multiplayer'
      archiveData.archiveDifficulty = data.archiveDifficulty || 'normal'
      archiveData.actualDifficulty = data.actualDifficulty || 'normal'

      // 加载玩家数据
      loadPlayerData(data)
    }
  } catch (e) {
    console.error(t('editArchive.parseFailed'), e)
  }
}

// 加载玩家数据
const loadPlayerData = async (archive) => {
  try {
    const playerData = await invoke('get_player_data', { filePath: archive.path })

    if (playerData && playerData.ids && playerData.inventories) {
      archiveData.players = []

      playerData.ids.forEach((steamId, index) => {
        if (steamId && steamId.trim()) {
          const inventory = playerData.inventories[index] || []
          const formattedInventory = inventory.map(itemName => itemName || null)

          // 确保有12个物品槽位
          while (formattedInventory.length < 12) {
            formattedInventory.push(null)
          }

          archiveData.players.push({
            steamId: steamId,
            inventory: formattedInventory.slice(0, 12)
          })
        }
      })

      // 如果有玩家，默认选中第一个
      if (archiveData.players.length > 0) {
        activePlayerIndex.value = 0
      }
    }
  } catch (error) {
    console.error('加载玩家数据失败:', error)
    // 如果没有玩家数据，创建一个空数组
    archiveData.players = []
  }
}

const newSteamId = ref('')
const activePlayerIndex = ref(archiveData.players.length > 0 ? 0 : -1)
const showItemSelector = ref(false)
const editingSlot = ref({ playerIndex: 0, slotIndex: 0 })

// 可用层级
const availableLevels = ref([])



// 难度选项
const difficultyLevels = [
  { value: 'easy', icon: ['fas', 'smile'], label: 'easy' },
  { value: 'normal', icon: ['fas', 'meh'], label: 'normal' },
  { value: 'hard', icon: ['fas', 'frown'], label: 'hard' },
  { value: 'nightmare', icon: ['fas', 'skull'], label: 'nightmare' }
]

// 图片加载错误处理
const handleImageError = (event) => {
  console.warn('Image failed to load:', event.target.src)
  // 可以设置一个默认图片
  event.target.src = '/images/default.jpg'
}

// 方法
const loadLevels = () => {
  try {
    // 层级名称映射 - 与CreateArchive.vue保持一致
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

    // 清空现有数据
    availableLevels.value = []
    console.log('Loading levels, total count:', levelMappings.length)

    // 为每个层级生成数据
    levelMappings.forEach((levelKey, index) => {
      try {
        // 现在所有关卡都使用关卡名称作为图片文件名
        const imagePath = `/images/${levelKey}.jpg`
        
        // 获取翻译名称，如果失败则使用原始键名
        let levelName
        try {
          levelName = t(`LevelName_Display.${levelKey}`)
        } catch (translationError) {
          console.warn(`Translation failed for level ${levelKey}:`, translationError)
          levelName = levelKey
        }
        
        availableLevels.value.push({
          name: levelName,
          image: imagePath,
          levelKey: levelKey
        })
      } catch (itemError) {
        console.error(`Error processing level ${levelKey}:`, itemError)
      }
    })
    
    console.log('Levels loaded successfully, count:', availableLevels.value.length)
  } catch (error) {
    console.error(t('editArchive.loadLevelsFailed'), error)
    // 如果翻译加载失败，使用默认层级（包含所有层级）
    const fallbackLevels = [
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
    
    availableLevels.value = []
    
    fallbackLevels.forEach((levelKey, index) => {
      // 检查是否存在对应的.png图片（新关卡）
      const pngNewLevels = ['Bunker', 'GraffitiLevel', 'Grassrooms_Expanded', 'Level974', 'LevelCheat']
      let imagePath
      
      if (pngNewLevels.includes(levelKey)) {
        // 新关卡使用关卡名称.png
        imagePath = `/images/${levelKey}.png`
      } else {
        // 原有关卡使用数字索引.jpg
        imagePath = `/images/${index}.jpg`
      }
      
      availableLevels.value.push({
        name: levelKey, // 使用原始键名作为回退
        image: imagePath,
        levelKey: levelKey
      })
    })
    
    console.log('Levels loaded with fallback, count:', availableLevels.value.length)
  }
}

const selectLevel = (levelKey) => {
  archiveData.currentLevel = levelKey
}

const handleDifficultySelect = (type, difficulty) => {
  // 单人模式下只能选择普通难度
  if (archiveData.gameMode === 'singleplayer' && difficulty !== 'normal') {
    return
  }
  
  if (type === 'archive') {
    archiveData.archiveDifficulty = difficulty
  } else if (type === 'actual') {
    archiveData.actualDifficulty = difficulty
  }
}

const getSlotContent = (playerIndex, slotIndex) => {
  if (archiveData.players[playerIndex] && archiveData.players[playerIndex].inventory) {
    const item = archiveData.players[playerIndex].inventory[slotIndex]
    return item && item !== 'None' ? item : null
  }
  return null
}

const getSlotLabel = (slotIndex) => {
  const labels = ['mainHand', 'offHand1', 'offHand2']
  return labels[slotIndex] || ''
}

// 物品名称到ID的反向映射
const getItemIdByName = (itemName) => {
  if (!itemName || itemName === 'None') return -1

  const itemMap = {
    'AlmondConcentrate': 1,
    'BugSpray': 2,
    'Camera': 3,
    'AlmondWater': 4,
    'Chainsaw': 5,
    'DivingHelmet': 6,
    'EnergyBar': 7,
    'Firework': 8,
    'Flaregun': 9,
    'Flashlight': 10,
    'GlowstickBlue': 11,
    'GlowStick': 12,
    'GlowstickRed': 13,
    'GlowstickYellow': 14,
    'Juice': 15,
    'LiquidPain': 16,
    'Rope': 17,
    'LiDAR': 18,
    'Thermometer': 19,
    'Ticket': 20,
    'WalkieTalkie': 21,
    'MothJelly': 22,
    'Crowbar': 23
  }
  return itemMap[itemName] || -1
}

const editSlot = (playerIndex, slotIndex) => {
  editingSlot.value = { playerIndex, slotIndex }
  showItemSelector.value = true
}

const handleItemSelect = (itemId) => {
  const { playerIndex, slotIndex } = editingSlot.value

  if (archiveData.players[playerIndex]) {
    archiveData.players[playerIndex].inventory[slotIndex] = itemId
  }

  showItemSelector.value = false
}

const addPlayer = () => {
  const steamId = newSteamId.value.trim()
  if (steamId && /^\d+$/.test(steamId)) {
    archiveData.players.push({
      steamId: steamId,
      inventory: Array(12).fill(null)
    })
    newSteamId.value = ''
    activePlayerIndex.value = archiveData.players.length - 1
  }

  // 如果没有玩家时添加第一个玩家，自动选中
  if (archiveData.players.length === 1) {
    activePlayerIndex.value = 0
  }
}

const removePlayer = (index) => {
  archiveData.players.splice(index, 1)
  if (activePlayerIndex.value >= archiveData.players.length) {
    activePlayerIndex.value = archiveData.players.length - 1
  }
  if (archiveData.players.length === 0) {
    activePlayerIndex.value = -1
  }
}

const selectPlayer = (index) => {
  activePlayerIndex.value = index
}

const closeEdit = () => {
  router.push({ name: 'Home' })
}

// 动画
const animateIn = () => {
  nextTick(() => {
    const container = document.querySelector('.edit-archive-container')
    if (container) {
      // 确保初始位置正确，避免margin auto的冲突
      gsap.set(container, { opacity: 0, y: 20 })
      gsap.to(container,
        { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out', clearProps: 'transform' }
      )
    }
  })
}

// 监听游戏模式变化
watch(() => archiveData.gameMode, (newMode) => {
  if (newMode === 'singleplayer') {
    // 当切换到单人模式时，自动设置难度为普通
    archiveData.archiveDifficulty = 'normal'
    archiveData.actualDifficulty = 'normal'
  }
})

onMounted(() => {
  console.log('EditArchive component mounted')
  loadLevels()
  animateIn()
  initArchiveData()

  // 如果有存档数据但没有玩家，不添加空玩家
  // 只有当用户手动添加玩家时才创建
  
  // 调试：检查可用层级数据
  setTimeout(() => {
    console.log('Available levels after mount:', availableLevels.value.length)
    if (availableLevels.value.length > 0) {
      console.log('First few levels:', availableLevels.value.slice(0, 3))
    }
  }, 1000)
})

// 在<script setup>中不需要return语句，所有变量都会自动暴露给模板
</script>

<style scoped>
.edit-archive-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-top: 20px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 122, 255, 0.3);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--hover-bg);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.btn-secondary:hover::before {
  left: 100%;
}

.btn-primary:active,
.btn-secondary:active {
  transform: translateY(0) scale(0.98);
  transition: all 0.1s ease;
}

.content-area {
  width: 100%;
}

.form-container {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.input-wrapper {
  position: relative;
  width: 99%;
}

.form-input {
  width: 100%;
  padding: 14px 18px;
  font-size: 16px;
  border: 2px solid var(--divider-color);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--card-bg) 100%);
  color: var(--text-primary);
  outline: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15), 0 4px 12px rgba(0, 122, 255, 0.1);
  background: var(--card-bg);
  transform: translateY(-1px);
}

.level-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.level-selector::-webkit-scrollbar {
  width: 6px;
}

.level-selector::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.level-selector::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 3px;
}

.level-selector::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.level-option {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, var(--card-bg) 0%, var(--bg-secondary) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--divider-light);
}

.level-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.level-option.selected {
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
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
  transition: opacity 0.2s ease;
}

.level-option.selected .level-overlay {
  opacity: 1;
}

.check-icon {
  color: white;
  font-size: 20px;
}

.level-name {
  display: block;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.segmented-control {
  display: flex;
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 2px;
}

.segment {
  flex: 1;
  padding: 8px 16px;
  text-align: center;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.segment.active {
  background: var(--card-bg);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.half-width {
  flex: 1;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.difficulty-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--divider-light);
}

.difficulty-option:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.difficulty-option.selected {
  background: rgba(0, 122, 255, 0.1);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
}

.difficulty-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-tertiary);
  border-color: var(--divider-light);
  color: var(--text-tertiary);
}

.difficulty-option.disabled:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.difficulty-icon {
  font-size: 24px;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.difficulty-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.inventory-section {
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-primary) 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--divider-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
}

.inventory-grid {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: center;
}

.inventory-backpack {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
}

.inventory-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inventory-slot {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--card-bg) 100%);
  border: 2px solid var(--divider-light);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.inventory-slot:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.inventory-slot.empty {
  border-color: var(--divider-color);
}

.slot-label {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 8px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 1px 3px;
  border-radius: 2px;
}

.slot-number {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 1px 3px;
  border-radius: 2px;
}

.slot-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.item-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.slot-icon {
  font-size: 20px;
  color: var(--text-secondary);
}

.multiplayer-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--card-bg);
  border-radius: 16px;
  border: 1px solid var(--divider-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.no-players-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 2px dashed var(--divider-light);
}

.hint-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-players-hint p {
  font-size: 16px;
  margin: 0;
  opacity: 0.8;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

.player-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-bg);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-card:hover {
  background: var(--bg-secondary);
}

.player-card.active {
  background: rgba(0, 122, 255, 0.1);
}

.player-id {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.remove-player-btn {
  background: none;
  border: none;
  color: #ff3b30;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.remove-player-btn:hover {
  background: rgba(255, 59, 48, 0.1);
}

.add-player-section {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--divider-light);
}

.add-player-btn {
  background: #34c759;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-player-btn:hover {
  background: #30d158;
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }

  .form-container {
    padding: 16px;
  }

  .form-row {
    flex-direction: column;
    gap: 24px;
  }

  .level-selector {
    grid-template-columns: repeat(2, 1fr);
  }

  .inventory-backpack {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .level-selector {
    grid-template-columns: 1fr;
  }

  .form-container {
    padding: 12px;
  }

  .section-title {
    font-size: 16px;
  }

  .form-input {
    padding: 10px 12px;
    font-size: 14px;
  }
}

.singleplayer-notice {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-top: 12px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05));
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  animation: fade-slide-enter 0.3s ease-out;
}

.notice-icon {
  margin-right: 8px;
  color: #007aff;
  font-size: 16px;
}

/* Vue过渡动画 */
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

@keyframes fade-slide-enter {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 所有主题颜色已通过CSS变量处理，无需额外媒体查询 */
</style>