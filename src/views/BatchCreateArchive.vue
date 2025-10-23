<template>
  <div class="batch-create-container" :class="{ 'sidebar-expanded': isSidebarExpanded }">
    <!-- 批量创建标题 -->
    <div class="batch-header">
      <h1 class="page-title">{{ $t('batchCreate.title') }}</h1>
      <p class="page-subtitle">{{ $t('batchCreate.subtitle') }}</p>
      
      <transition name="fade">
        <button 
          v-if="!isSwitching"
          @click="switchToSingleCreate" 
          class="switch-to-single-btn"
          :class="{ 'shrink': isSwitching }"
        >
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          {{ $t('batchCreate.switchToSingle') }}
        </button>
      </transition>
    </div>

    <!-- 批量配置区域 -->
    <div class="batch-config-section">
      <div class="config-grid">
        <!-- 基础配置 -->
        <div class="config-card">
          <h3 class="form-section-title">{{ $t('batchCreate.baseConfig') }}</h3>
          
          <!-- 存档前缀 -->
          <div class="form-group">
            <label class="form-label">{{ $t('batchCreate.archivePrefix') }}</label>
            <input v-model="archivePrefix" type="text" class="form-input"
              :placeholder="$t('batchCreate.prefixPlaceholder')" maxlength="30" />
            <transition name="error-fade">
              <div v-if="archivePrefix.includes('_')" class="error-message">
                <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
                {{ $t('batchCreate.prefixError') }}
              </div>
            </transition>
          </div>

          <!-- 生成数量 -->
          <div class="form-group">
            <label class="form-label">{{ $t('batchCreate.generateCount') }}</label>
            <div class="count-selector">
              <button @click="decreaseCount" class="count-btn" :disabled="generateCount <= 1">
                <font-awesome-icon :icon="['fas', 'minus']" />
              </button>
              <span class="count-display">{{ generateCount }}</span>
              <button @click="increaseCount" class="count-btn" :disabled="generateCount >= 50">
                <font-awesome-icon :icon="['fas', 'plus']" />
              </button>
            </div>
          </div>

          <!-- 游戏模式 -->
          <div class="form-group">
            <label class="form-label">{{ $t('batchCreate.gameMode') }}</label>
            <div class="radio-group">
              <label class="radio-option" v-for="mode in gameModes" :key="mode.value">
                <input type="radio" v-model="selectedGameMode" :value="mode.value" class="radio-input" />
                <span class="radio-custom"></span>
                <span class="radio-label">{{ $t(`createArchive.gameModes.${mode.value}`) }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 层级配置 -->
        <div class="config-card">
          <h3 class="form-section-title">{{ $t('batchCreate.levelConfig') }}</h3>
          
          <!-- 层级选择模式 -->
          <div class="form-group">
            <label class="form-label">{{ $t('batchCreate.levelMode') }}</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="levelMode" value="single" class="radio-input" />
                <span class="radio-custom"></span>
                <span class="radio-label">{{ $t('batchCreate.singleLevel') }}</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="levelMode" value="multiple" class="radio-input" />
                <span class="radio-custom"></span>
                <span class="radio-label">{{ $t('batchCreate.multipleLevels') }}</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="levelMode" value="random" class="radio-input" />
                <span class="radio-custom"></span>
                <span class="radio-label">{{ $t('batchCreate.randomLevels') }}</span>
              </label>
            </div>
          </div>

          <!-- 选择层级（单层级模式） -->
          <div v-if="levelMode === 'single'" class="form-group">
            <label class="form-label">{{ $t('batchCreate.selectSingleLevel') }}</label>
            <div class="level-selector">
              <select v-model="selectedSingleLevel" class="form-select">
                <option value="-1">{{ $t('batchCreate.chooseLevel') }}</option>
                <option v-for="(level, index) in availableLevels" :key="index" :value="index">
                  {{ level.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- 选择多个层级 -->
          <div v-if="levelMode === 'multiple'" class="form-group">
            <label class="form-label">{{ $t('batchCreate.selectMultipleLevels') }}</label>
            <div class="level-checkbox-grid">
              <label v-for="(level, index) in availableLevels" :key="index" class="level-checkbox">
                <input type="checkbox" v-model="selectedMultipleLevels" :value="index" />
                <span class="checkbox-custom"></span>
                <span class="level-name">{{ level.name }}</span>
              </label>
            </div>
          </div>

          <!-- 随机层级数量 -->
          <div v-if="levelMode === 'random'" class="form-group">
            <label class="form-label">{{ $t('batchCreate.randomLevelCount') }}</label>
            <div class="count-selector">
              <button @click="decreaseRandomCount" class="count-btn" :disabled="randomLevelCount <= 1">
                <font-awesome-icon :icon="['fas', 'minus']" />
              </button>
              <span class="count-display">{{ randomLevelCount }}</span>
              <button @click="increaseRandomCount" class="count-btn" 
                :disabled="randomLevelCount >= availableLevels.length">
                <font-awesome-icon :icon="['fas', 'plus']" />
              </button>
            </div>
          </div>
        </div>

        <!-- 难度配置 -->
        <div class="config-card">
          <h3 class="form-section-title">{{ $t('batchCreate.difficultyConfig') }}</h3>
          
          <!-- 存档难度 -->
          <div class="form-group">
            <label class="form-label">{{ $t('batchCreate.difficulty') }}</label>
            <div class="difficulty-grid">
              <div v-for="difficulty in difficultyLevels" :key="difficulty.value" class="difficulty-option"
                :class="{ selected: selectedDifficulty === difficulty.value }"
                @click="selectedDifficulty = difficulty.value">
                <div class="difficulty-icon">
                  <font-awesome-icon :icon="difficulty.icon" />
                </div>
                <span class="difficulty-label">{{ $t(`batchCreate.difficultyLevels.${difficulty.value}`) }}</span>
              </div>
            </div>
          </div>

          <!-- 实际难度 -->
          <div class="form-group">
            <label class="form-label">{{ $t('batchCreate.actualDifficulty') }}</label>
            <div class="difficulty-grid">
              <div v-for="difficulty in difficultyLevels" :key="`actual-${difficulty.value}`"
                class="difficulty-option" :class="{ selected: selectedActualDifficulty === difficulty.value }"
                @click="selectedActualDifficulty = difficulty.value">
                <div class="difficulty-icon">
                  <font-awesome-icon :icon="difficulty.icon" />
                </div>
                <span class="difficulty-label">{{ $t(`batchCreate.difficultyLevels.${difficulty.value}`) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 玩家配置 -->
        <div class="config-card">
          <h3 class="form-section-title">{{ $t('batchCreate.playerConfig') }}</h3>
          
          <!-- 玩家Steam ID -->
          <div class="form-group">
            <label class="form-label">{{ $t('batchCreate.steamIds') }}</label>
            <div class="steam-id-input-group">
              <input v-model="newSteamId" type="text" class="form-input"
                :placeholder="$t('batchCreate.steamIdPlaceholder')"
                @input="newSteamId = newSteamId.replace(/[^0-9]/g, '')" @keyup.enter="addSteamId" />
              <button @click="addSteamId" class="add-button">
                <font-awesome-icon :icon="['fas', 'plus']" />
                {{ $t('batchCreate.add') }}
              </button>
            </div>
            
            <!-- Steam ID 列表 -->
            <div class="steam-id-list">
              <div v-for="(steamId, index) in steamIds" :key="index" class="steam-id-item">
                <span class="steam-id-text">{{ steamId }}</span>
                <button @click="removeSteamId(index)" class="remove-button">
                  <font-awesome-icon :icon="['fas', 'times']" />
                </button>
              </div>
            </div>
          </div>

          <!-- 统一背包设置 -->
          <div class="form-group">
            <label class="form-label">{{ $t('batchCreate.inventorySettings') }}</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="inventoryMode" value="empty" class="radio-input" />
                <span class="radio-custom"></span>
                <span class="radio-label">{{ $t('batchCreate.emptyInventory') }}</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="inventoryMode" value="template" class="radio-input" />
                <span class="radio-custom"></span>
                <span class="radio-label">{{ $t('batchCreate.templateInventory') }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div class="preview-section">
      <div class="preview-card">
        <h3 class="form-section-title">
          {{ $t('batchCreate.preview') }}
          <span class="preview-count">({{ previewArchives.length }})</span>
        </h3>
        
        <div class="preview-list">
          <div v-for="(archive, index) in previewArchives.slice(0, 10)" :key="index" class="preview-item">
            <div class="archive-name">{{ archive.name }}</div>
            <div class="archive-info">
              <span class="level">{{ archive.level }}</span>
              <span class="mode">{{ archive.mode }}</span>
            </div>
          </div>
          <div v-if="previewArchives.length > 10" class="preview-more">
            {{ $t('batchCreate.moreArchives', { count: previewArchives.length - 10 }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 批量创建进度 -->
    <div v-if="isCreating" class="progress-overlay">
      <div class="progress-card">
        <div class="progress-header">
          <h3>{{ $t('batchCreate.creatingArchives') }}</h3>
          <p>{{ $t('batchCreate.progressText', { current: createdCount, total: generateCount }) }}</p>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        
        <div class="progress-details">
          <div class="current-archive">{{ currentArchiveName }}</div>
          <div class="progress-percentage">{{ Math.round(progressPercentage) }}%</div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button @click="resetForm" class="action-button secondary">
        <font-awesome-icon :icon="['fas', 'refresh']" />
        {{ $t('batchCreate.reset') }}
      </button>

      <div class="batch-info">
        {{ $t('batchCreate.willCreate') }}: {{ generateCount }} {{ $t('batchCreate.archives') }}
      </div>

      <button @click="startBatchCreate" class="action-button primary" :disabled="!canCreate || isCreating">
        <font-awesome-icon :icon="['fas', 'layer-group']" />
        {{ isCreating ? $t('batchCreate.creating') : $t('batchCreate.startCreate') }}
      </button>
    </div>

    <!-- 物品选择器（用于模板库存） -->
    <InventoryItemSelector 
      v-if="inventoryMode === 'template'"
      :visible="showItemSelector" 
      @select="handleTemplateInventory"
      @update:visible="showItemSelector = $event" />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import InventoryItemSelector from '../components/InventoryItemSelector.vue'

export default {
  name: 'BatchCreateArchive',
  components: {
    InventoryItemSelector
  },
  setup() {
    const { t } = useI18n({ useScope: 'global' })
    const router = useRouter()
    
    // 表单数据
    const archivePrefix = ref('')
    const generateCount = ref(5)
    const selectedGameMode = ref('singleplayer')
    const selectedDifficulty = ref('normal')
    const selectedActualDifficulty = ref('normal')
    const levelMode = ref('single')
    const selectedSingleLevel = ref(-1)
    const selectedMultipleLevels = ref([])
    const randomLevelCount = ref(3)
    const steamIds = ref([])
    const newSteamId = ref('')
    const inventoryMode = ref('empty')
    const templateInventory = ref(Array(12).fill(null))
    
    // 状态管理
    const isCreating = ref(false)
    const createdCount = ref(0)
    const currentArchiveName = ref('')
    const showItemSelector = ref(false)
    const isSwitching = ref(false)
    
    // 动态数据
    const availableLevels = reactive([])
    
    // 游戏模式选项
    const gameModes = [
      { value: 'singleplayer', label: 'singleplayer' },
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
    const canCreate = computed(() => {
      return archivePrefix.value.trim() !== '' && 
             !archivePrefix.value.includes('_') &&
             (levelMode.value !== 'single' || selectedSingleLevel.value !== -1) &&
             (levelMode.value !== 'multiple' || selectedMultipleLevels.value.length > 0)
    })
    
    const progressPercentage = computed(() => {
      return generateCount.value > 0 ? (createdCount.value / generateCount.value) * 100 : 0
    })
    
    const previewArchives = computed(() => {
      const archives = []
      const levels = getSelectedLevels()
      
      for (let i = 0; i < generateCount.value; i++) {
        const level = levels[i % levels.length]
        const levelName = level ? availableLevels[level]?.name || 'Unknown' : 'Unknown'
        
        archives.push({
          name: `${archivePrefix.value}_${String(i + 1).padStart(3, '0')}`,
          level: levelName,
          mode: selectedGameMode.value
        })
      }
      
      return archives
    })
    
    // 方法
    const loadLevels = async () => {
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
        
        availableLevels.push({
          name: t(`LevelName_Display.${levelKey}`),
          image: imagePath,
          levelKey: levelKey
        })
      })
    }
    
    const getSelectedLevels = () => {
      switch (levelMode.value) {
        case 'single':
          return [selectedSingleLevel.value]
        case 'multiple':
          return selectedMultipleLevels.value
        case 'random':
          return getRandomLevels()
        default:
          return [0]
      }
    }
    
    const getRandomLevels = () => {
      const indices = Array.from({ length: availableLevels.length }, (_, i) => i)
      const shuffled = indices.sort(() => Math.random() - 0.5)
      return shuffled.slice(0, Math.min(randomLevelCount.value, availableLevels.length))
    }
    
    const increaseCount = () => {
      if (generateCount.value < 50) generateCount.value++
    }
    
    const decreaseCount = () => {
      if (generateCount.value > 1) generateCount.value--
    }
    
    const increaseRandomCount = () => {
      if (randomLevelCount.value < availableLevels.length) randomLevelCount.value++
    }
    
    const decreaseRandomCount = () => {
      if (randomLevelCount.value > 1) randomLevelCount.value--
    }
    
    const switchToSingleCreate = () => {
      if (isSwitching.value) return;
      
      isSwitching.value = true;
      
      // 使用GSAP创建淡出动画
      gsap.to('.batch-create-container', {
        opacity: 0,
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
          router.push('/create-archive');
        }
      });
    };

    const addSteamId = () => {
      const steamId = newSteamId.value.trim()
      if (steamId && /^\d+$/.test(steamId) && !steamIds.value.includes(steamId)) {
        steamIds.value.push(steamId)
        newSteamId.value = ''
      } else if (steamId && steamIds.value.includes(steamId)) {
        alert(t('batchCreate.steamIdDuplicate'))
      } else if (steamId) {
        alert(t('batchCreate.steamIdInvalid'))
      }
    }
    
    const removeSteamId = (index) => {
      steamIds.value.splice(index, 1)
    }
    
    const handleTemplateInventory = (itemId) => {
      // 这里简化处理，实际可以打开完整的库存编辑器
      templateInventory.value[0] = itemId
      showItemSelector.value = false
    }
    
    const loadJsonFile = async (filename) => {
      try {
        const response = await fetch(`/${filename}`)
        if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`)
        return await response.json()
      } catch (error) {
        console.error(`读取 ${filename} 失败:`, error)
        return null
      }
    }
    
    const startBatchCreate = async () => {
      if (!canCreate.value || isCreating.value) return
      
      isCreating.value = true
      createdCount.value = 0
      
      try {
        const basicArchive = await loadJsonFile('BasicArchive.json')
        if (!basicArchive) {
          alert(t('batchCreate.loadTemplateFailed'))
          return
        }
        
        const levels = getSelectedLevels()
        const { invoke } = await import('@tauri-apps/api/core')
        
        for (let i = 0; i < generateCount.value; i++) {
          const levelIndex = levels[i % levels.length]
          const levelData = availableLevels[levelIndex] || availableLevels[0]
          
          const archiveName = `${archivePrefix.value}_${String(i + 1).padStart(3, '0')}`
          currentArchiveName.value = archiveName
          
          const saveData = {
            archive_name: archiveName,
            level: levelData.levelKey,
            game_mode: selectedGameMode.value,
            difficulty: selectedDifficulty.value.charAt(0).toUpperCase() + selectedDifficulty.value.slice(1),
            actual_difficulty: selectedActualDifficulty.value.charAt(0).toUpperCase() + selectedActualDifficulty.value.slice(1),
            players: steamIds.value.map(steamId => ({
              steam_id: steamId,
              inventory: inventoryMode.value === 'empty' ? [] : templateInventory.value.filter(item => item !== null)
            })),
            basic_archive: basicArchive
          }
          
          await invoke('handle_new_save', { saveData })
          createdCount.value++
          
          // 添加小延迟避免过快
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // 创建成功动画
        createSuccessAnimation()
        
      } catch (error) {
        console.error('批量创建失败:', error)
        alert(t('batchCreate.createFailed') + ': ' + (error.message || '未知错误'))
      } finally {
        isCreating.value = false
        resetForm()
      }
    }
    
    const createSuccessAnimation = () => {
      // 成功动画效果
      const container = document.querySelector('.batch-create-container')
      if (!container) return
      
      const successCard = document.createElement('div')
      successCard.className = 'success-card batch-success'
      successCard.innerHTML = `
        <div class="success-content">
          <div class="success-icon">
            <div class="icon-circle">
              <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            </div>
          </div>
          <h2 class="success-title">${t('batchCreate.successTitle')}</h2>
          <p class="success-subtitle">${t('batchCreate.successMessage', { count: generateCount.value })}</p>
        </div>
      `
      
      document.body.appendChild(successCard)
      
      gsap.fromTo(successCard,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)",
          onComplete: () => {
            setTimeout(() => {
              gsap.to(successCard, {
                scale: 0, opacity: 0, duration: 0.3,
                onComplete: () => document.body.removeChild(successCard)
              })
            }, 2000)
          }
        }
      )
    }
    
    const resetForm = () => {
      archivePrefix.value = ''
      generateCount.value = 5
      selectedGameMode.value = 'singleplayer'
      selectedDifficulty.value = 'normal'
      selectedActualDifficulty.value = 'normal'
      levelMode.value = 'single'
      selectedSingleLevel.value = -1
      selectedMultipleLevels.value = []
      randomLevelCount.value = 3
      steamIds.value = []
      newSteamId.value = ''
      inventoryMode.value = 'empty'
      templateInventory.value = Array(12).fill(null)
    }
    
    // 侧边栏状态
    const isSidebarExpanded = ref(false)
    const handleSidebarExpand = (event) => {
      isSidebarExpanded.value = event.detail
    }
    
    // 生命周期
    onMounted(() => {
      loadLevels()
      window.addEventListener('sidebar-expand', handleSidebarExpand)
      
      // 入场动画
      gsap.from('.batch-header', { y: -20, opacity: 0, duration: 0.5 })
      gsap.from('.config-card', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 })
    })
    
    return {
      isSwitching,
      isSidebarExpanded,
      archivePrefix,
      generateCount,
      selectedGameMode,
      selectedDifficulty,
      selectedActualDifficulty,
      levelMode,
      selectedSingleLevel,
      selectedMultipleLevels,
      randomLevelCount,
      steamIds,
      newSteamId,
      inventoryMode,
      templateInventory,
      isCreating,
      createdCount,
      currentArchiveName,
      showItemSelector,
      availableLevels,
      gameModes,
      difficultyLevels,
      canCreate,
      progressPercentage,
      previewArchives,
      increaseCount,
      decreaseCount,
      increaseRandomCount,
      decreaseRandomCount,
      addSteamId,
      removeSteamId,
      handleTemplateInventory,
      startBatchCreate,
      switchToSingleCreate,
      resetForm
    }
  }
}
</script>

<style scoped>
.batch-create-container {
  min-height: 100vh;
  padding: 24px 24px 100px 24px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: padding 0.3s ease;
}

.batch-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 0;
}

.batch-config-section {
  max-width: 1200px;
  margin: 0 auto;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.config-card {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.config-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.form-section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

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

.form-input, .form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  font-size: 16px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.count-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.count-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--divider-color);
  background: var(--bg-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.count-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: white;
}

.count-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count-display {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 30px;
  text-align: center;
}

.level-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--divider-light);
  border-radius: 8px;
  padding: 8px;
}

.level-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.level-checkbox:hover {
  background: var(--bg-tertiary);
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid var(--divider-color);
  border-radius: 3px;
  position: relative;
  transition: all 0.2s ease;
}

.level-checkbox input:checked + .checkbox-custom {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.level-checkbox input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 6px;
  border: 2px solid white;
  border-top: none;
  border-right: none;
  transform: translate(-50%, -60%) rotate(-45deg);
}

.level-name {
  font-size: 14px;
  color: var(--text-primary);
}

.steam-id-input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.steam-id-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--divider-light);
  border-radius: 8px;
  padding: 8px;
}

.steam-id-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: var(--bg-primary);
  border-radius: 6px;
  transition: background 0.2s ease;
}

.steam-id-item:hover {
  background: var(--bg-tertiary);
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
  transition: all 0.2s ease;
}

.remove-button:hover {
  background: var(--error-color);
  color: white;
}

.preview-section {
  max-width: 1200px;
  margin: 0 auto 32px;
}

.preview-card {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 16px;
  padding: 24px;
}

.preview-count {
  color: var(--text-secondary);
  font-size: 14px;
  margin-left: 8px;
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--bg-primary);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.preview-item:hover {
  background: var(--bg-tertiary);
}

.archive-name {
  font-weight: 600;
  color: var(--text-primary);
}

.archive-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-more {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 12px;
  font-style: italic;
}

.progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.progress-card {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 16px;
  padding: 32px;
  min-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.progress-header h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.progress-header p {
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), var(--success-color));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-archive {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.progress-percentage {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-color);
}

.bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  position: fixed;
  bottom: 0;
  left: 70px;
  right: 0;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  -webkit-backdrop-filter: var(--glass-backdrop-filter);
  border-top: 1px solid var(--glass-border);
  box-shadow: 0 -8px 32px var(--glass-shadow-light), 0 -2px 8px var(--glass-shadow-medium);
  z-index: 100;
  transition: left 0.3s ease;
}

.sidebar-expanded .bottom-actions {
  left: 220px;
}

.batch-info {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.switch-to-single-btn {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: var(--glass-backdrop-filter);
  -webkit-backdrop-filter: var(--glass-backdrop-filter);
  box-shadow: 0 4px 16px var(--glass-shadow-light);
}

.switch-to-single-btn:hover:not(:disabled) {
  background: var(--glass-bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--glass-shadow-medium);
}

.switch-to-single-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px var(--glass-shadow-light);
}

.switch-to-single-btn.shrink {
  transform: scale(0.95);
  opacity: 0.8;
}

.switch-to-single-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: var(--error-color);
}

/* 动画 */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.success-card.batch-success {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  z-index: 1001;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .batch-create-container {
    padding: 16px 16px 80px 16px;
  }
  
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .level-checkbox-grid {
    grid-template-columns: 1fr;
  }
  
  .bottom-actions {
    left: 0;
    flex-direction: column;
    gap: 8px;
    padding: 8px 16px;
  }
  
  .sidebar-expanded .bottom-actions {
    left: 0;
  }
  
  .switch-to-single-btn {
    position: static;
    margin-top: 16px;
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }
  
  .config-card {
    padding: 16px;
  }
  
  .progress-card {
    min-width: 300px;
    margin: 16px;
  }
  
  .switch-to-single-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>