<template>
  <div class="test-archive-container">
    <div class="header">
      <h1>临时存档测试页面</h1>
      <p>创建和管理100个临时存档进行测试</p>
    </div>

    <div class="controls">
      <div class="button-group">
        <button @click="generateRandomArchives" :disabled="isCreating" class="primary-btn">
          {{ isCreating ? '创建中...' : '生成100个随机临时存档' }}
        </button>
        <button @click="clearAllArchives" class="danger-btn">
          清空所有存档
        </button>
      </div>

      <div class="filter-group">
        <label>
          <input type="checkbox" v-model="showSavedOnly" />
          仅显示已保存的存档
        </label>
        <label>
          <input type="checkbox" v-model="autoSave" />
          自动保存新增存档
        </label>
      </div>

      <!-- 创建进度条 -->
      <div v-if="isCreating" class="progress-container">
        <div class="progress-header">
          <span class="progress-text">创建进度：{{ progress }}%</span>
          <span class="progress-status">
            {{ progress < 100 ? '正在创建存档...' : '创建完成！' }} </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-stats">
          <span>预计创建：100 个存档</span>
          <span>已完成：{{ Math.round(progress) }} 个</span>
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">总存档数：</span>
        <span class="stat-value">{{ tempArchives.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已保存：</span>
        <span class="stat-value saved">{{ savedArchives.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">临时：</span>
        <span class="stat-value temp">{{ tempArchives.length - savedArchives.length }}</span>
      </div>
    </div>

    <div class="archives-grid">
      <div v-for="archive in filteredArchives" :key="archive.id" class="archive-card" :class="{
        'saved': archive.isSaved,
        'selected': selectedArchives.includes(archive.id)
      }">
        <div class="archive-header">
          <h3>{{ archive.archive_name }}</h3>
          <div class="archive-actions">
            <button @click="toggleArchiveSelection(archive.id)" class="select-btn"
              :class="{ 'selected': selectedArchives.includes(archive.id) }">
              {{ selectedArchives.includes(archive.id) ? '✓' : '○' }}
            </button>
            <button @click="deleteArchive(archive.id)" class="delete-btn">
              🗑️
            </button>
          </div>
        </div>

        <div class="archive-info">
          <div class="info-row">
            <span class="label">层级：</span>
            <span class="value">{{ archive.level }}</span>
          </div>
          <div class="info-row">
            <span class="label">难度：</span>
            <span class="value">{{ archive.difficulty }}</span>
          </div>
          <div class="info-row">
            <span class="label">玩家数：</span>
            <span class="value">{{ archive.players?.length || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatTime(archive.createdAt) }}</span>
          </div>
        </div>

        <div class="archive-status">
          <span class="status-badge" :class="archive.isSaved ? 'saved' : 'temp'">
            {{ archive.isSaved ? '已保存' : '临时' }}
          </span>
        </div>

        <div class="archive-controls">
          <button @click="toggleSaveStatus(archive)" class="save-btn" :class="{ 'saved': archive.isSaved }">
            {{ archive.isSaved ? '取消保存' : '标记保存' }}
          </button>
          <button @click="viewArchiveDetails(archive)" class="details-btn">
            详情
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedArchives.length > 0" class="bulk-actions">
      <div class="bulk-info">
        已选择 {{ selectedArchives.length }} 个存档
      </div>
      <div class="bulk-buttons">
        <button @click="saveSelectedArchives" class="primary-btn">
          批量保存
        </button>
        <button @click="deleteSelectedArchives" class="danger-btn">
          批量删除
        </button>
        <button @click="clearSelection" class="secondary-btn">
          取消选择
        </button>
      </div>
    </div>

    <!-- 存档详情模态框 -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>存档详情</h2>
          <button @click="closeDetailsModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedArchive" class="archive-details">
            <div class="detail-section">
              <h3>基本信息</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">存档名称：</span>
                  <span class="detail-value">{{ selectedArchive.archive_name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">层级：</span>
                  <span class="detail-value">{{ selectedArchive.level }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">游戏模式：</span>
                  <span class="detail-value">{{ selectedArchive.game_mode }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">难度：</span>
                  <span class="detail-value">{{ selectedArchive.difficulty }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">实际难度：</span>
                  <span class="detail-value">{{ selectedArchive.actual_difficulty }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">创建时间：</span>
                  <span class="detail-value">{{ formatTime(selectedArchive.createdAt) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">状态：</span>
                  <span class="detail-value">{{ selectedArchive.isSaved ? '已保存' : '临时' }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedArchive.players && selectedArchive.players.length > 0" class="detail-section">
              <h3>玩家信息</h3>
              <div v-for="(player, index) in selectedArchive.players" :key="index" class="player-detail">
                <div class="player-header">
                  <span class="player-index">玩家 {{ index + 1 }}</span>
                  <span class="steam-id">{{ player.steam_id }}</span>
                </div>
                <div class="inventory-detail">
                  <span class="inventory-label">背包物品：</span>
                  <div class="inventory-items">
                    <span v-for="(item, itemIndex) in player.inventory" :key="itemIndex" class="inventory-item">
                      {{ getItemNameById(item) }}
                    </span>
                    <span v-if="!player.inventory || player.inventory.length === 0" class="empty-inventory">
                      空
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const tempArchives = ref([])
const selectedArchives = ref([])
const isCreating = ref(false)
const progress = ref(0)
const showSavedOnly = ref(false)
const autoSave = ref(false)
const showDetailsModal = ref(false)
const selectedArchive = ref(null)

// 层级数据
const availableLevels = ref([
  { levelKey: 'Level0', levelName: 'Level 0 - 主入口' },
  { levelKey: 'TopFloor', levelName: 'Top Floor - 顶层' },
  { levelKey: 'MiddleFloor', levelName: 'Middle Floor - 中层' },
  { levelKey: 'BottomFloor', levelName: 'Bottom Floor - 底层' },
  { levelKey: 'TheHub', levelName: 'The Hub - 中央枢纽' },
  { levelKey: 'GarageLevel2', levelName: 'Garage Level 2 - 车库2层' },
  { levelKey: 'Office', levelName: 'Office - 办公室' },
  { levelKey: 'Storage', levelName: 'Storage - 储藏室' },
  { levelKey: 'Warehouse', levelName: 'Warehouse - 仓库' },
  { levelKey: 'Cafeteria', levelName: 'Cafeteria - 食堂' }
])

// 难度选项
const difficultyLevels = ['easy', 'normal', 'hard', 'extreme']

// 计算属性
const savedArchives = computed(() =>
  tempArchives.value.filter(archive => archive.isSaved)
)

const filteredArchives = computed(() => {
  if (showSavedOnly.value) {
    return savedArchives.value
  }
  return tempArchives.value
})

// 生成随机存档
const generateRandomArchives = async () => {
  if (isCreating.value) return

  isCreating.value = true
  progress.value = 0

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const archives = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < 100; i++) {
      progress.value = Math.round((i / 100) * 100)

      // 生成随机存档数据
      const archiveData = await generateRandomArchiveData(i)

      try {
        // 调用后端Rust API创建存档
        await invoke('handle_new_save', { saveData: archiveData })

        // 创建成功后添加到本地列表
        const archive = {
          ...archiveData,
          id: Date.now() + i,
          createdAt: new Date().toISOString(),
          isSaved: true, // 真实创建后标记为已保存
          realCreated: true // 标记为真实创建
        }
        archives.push(archive)
        successCount++

        console.log(`成功创建存档: ${archiveData.archive_name}`)

      } catch (apiError) {
        errorCount++
        console.error(`创建存档 ${archiveData.archive_name} 失败:`, apiError)

        // 即使API调用失败，也添加到列表中作为失败记录
        const failedArchive = {
          ...archiveData,
          id: Date.now() + i,
          createdAt: new Date().toISOString(),
          isSaved: false,
          realCreated: false,
          error: apiError.message || '创建失败'
        }
        archives.push(failedArchive)
      }

      // 添加小延迟让用户看到进度，并避免API调用过频
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    tempArchives.value = [...tempArchives.value, ...archives]

    // 显示创建结果统计
    let resultMessage = `创建完成！`
    if (successCount > 0) {
      resultMessage += ` 成功创建 ${successCount} 个存档`
    }
    if (errorCount > 0) {
      resultMessage += ` 失败 ${errorCount} 个存档`
    }
    alert(resultMessage)

    console.log(`批量创建存档完成: 成功${successCount}个, 失败${errorCount}个`)

  } catch (error) {
    console.error('生成存档时出错:', error)
    alert(`生成存档时出错: ${error.message}`)
  } finally {
    isCreating.value = false
    progress.value = 0
  }
}

// 生成随机存档数据
const generateRandomArchiveData = async (index) => {
  const randomLevel = availableLevels.value[Math.floor(Math.random() * availableLevels.value.length)]
  const randomDifficulty = difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)]

  // 随机生成1-4个玩家
  const playerCount = Math.floor(Math.random() * 4) + 1
  const players = []

  for (let i = 0; i < playerCount; i++) {
    // 生成随机背包物品（0-6个物品）
    const inventorySize = Math.floor(Math.random() * 7)
    const inventory = []

    for (let j = 0; j < inventorySize; j++) {
      const randomItemId = Math.floor(Math.random() * 25) + 1
      inventory.push(randomItemId)
    }

    players.push({
      steam_id: generateRandomSteamId(),
      inventory: inventory
    })
  }

  // 判断是否为主线结局 (0-9为支线，10+为主线)
  const isMainEnding = index >= 10

  // 判断是否需要锁定MEG
  const megLevels = ['Level0', 'TopFloor', 'MiddleFloor', 'GarageLevel2', 'BottomFloor', 'TheHub']
  const isMEGUnlocked = !megLevels.includes(randomLevel.levelKey)

  // 加载BasicArchive模板
  let basicArchive = {}
  try {
    const response = await fetch('/BasicArchive.json')
    basicArchive = await response.json()
  } catch (error) {
    console.error('加载BasicArchive.json失败:', error)
  }

  return {
    archive_name: `测试存档_${index + 1}_${randomLevel.levelKey}`,
    level: randomLevel.levelKey,
    game_mode: 'multiplayer',
    difficulty: randomDifficulty.charAt(0).toUpperCase() + randomDifficulty.slice(1),
    actual_difficulty: randomDifficulty.charAt(0).toUpperCase() + randomDifficulty.slice(1),
    players: players,
    basic_archive: basicArchive,
    main_ending: !isMainEnding, // 主线为false，支线为true
    meg_unlocked: isMEGUnlocked // MEG解锁状态
  }
}

// 生成随机Steam ID
const generateRandomSteamId = () => {
  const numbers = Math.floor(Math.random() * 900000000) + 100000000
  return numbers.toString()
}

// 根据物品ID获取物品名称
const getItemNameById = (itemId) => {
  const itemMap = {
    1: '杏仁浓缩液',
    2: '开锁器',
    3: '绷带',
    4: '手电筒',
    5: '体力药丸',
    6: '医疗包',
    7: '营养棒',
    8: '硬币',
    9: '电池',
    10: '注射器',
    11: '骨头',
    12: '钥匙',
    13: '代码',
    14: '荧光棒',
    15: '氧气面罩',
    16: '抓钩',
    17: '汽水',
    18: '信标',
    19: '电台',
    20: '茶',
    21: '治疗药水',
    22: '速度提升',
    23: '隐身药水',
    24: '刀',
    25: '玩具'
  }
  return itemMap[itemId] || `未知物品(${itemId})`
}

// 格式化时间
const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

// 删除存档
const deleteArchive = (archiveId) => {
  if (confirm('确定要删除这个存档吗？')) {
    const index = tempArchives.value.findIndex(archive => archive.id === archiveId)
    if (index !== -1) {
      tempArchives.value.splice(index, 1)
      // 从选中列表中移除
      const selectedIndex = selectedArchives.value.indexOf(archiveId)
      if (selectedIndex !== -1) {
        selectedArchives.value.splice(selectedIndex, 1)
      }
    }
  }
}

// 清空所有存档
const clearAllArchives = () => {
  if (confirm('确定要清空所有存档吗？此操作不可恢复！')) {
    tempArchives.value = []
    selectedArchives.value = []
  }
}

// 切换存档选择状态
const toggleArchiveSelection = (archiveId) => {
  const index = selectedArchives.value.indexOf(archiveId)
  if (index === -1) {
    selectedArchives.value.push(archiveId)
  } else {
    selectedArchives.value.splice(index, 1)
  }
}

// 清除选择
const clearSelection = () => {
  selectedArchives.value = []
}

// 切换保存状态
const toggleSaveStatus = (archive) => {
  archive.isSaved = !archive.isSaved
}

// 批量保存选中的存档
const saveSelectedArchives = () => {
  selectedArchives.value.forEach(archiveId => {
    const archive = tempArchives.value.find(a => a.id === archiveId)
    if (archive) {
      archive.isSaved = true
    }
  })
  selectedArchives.value = []
}

// 批量删除选中的存档
const deleteSelectedArchives = () => {
  if (confirm(`确定要删除选中的 ${selectedArchives.value.length} 个存档吗？`)) {
    tempArchives.value = tempArchives.value.filter(archive => !selectedArchives.value.includes(archive.id))
    selectedArchives.value = []
  }
}

// 查看存档详情
const viewArchiveDetails = (archive) => {
  selectedArchive.value = archive
  showDetailsModal.value = true
}

// 关闭详情模态框
const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedArchive.value = null
}

// 初始化
onMounted(() => {
  console.log('临时存档测试页面已初始化')
})
</script>

<style scoped>
.test-archive-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.header p {
  color: var(--text-secondary);
  font-size: 16px;
}

.controls {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  cursor: pointer;
}

/* 进度条样式 */
.progress-container {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--accent-color);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-status {
  font-size: 14px;
  color: var(--accent-color);
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--divider-light);
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), var(--success-color));
  border-radius: 6px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

.stats {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--divider-light);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.saved {
  color: var(--success-color);
}

.stat-value.temp {
  color: var(--accent-color);
}

.archives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.archive-card {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}

.archive-card:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.archive-card.saved {
  border-color: var(--success-color);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(0, 212, 170, 0.05) 100%);
}

.archive-card.selected {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.archive-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  word-break: break-word;
}

.archive-actions {
  display: flex;
  gap: 8px;
}

.select-btn,
.delete-btn {
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}

.select-btn.selected {
  background: var(--accent-color);
  color: white;
}

.select-btn:hover,
.delete-btn:hover {
  background: var(--bg-tertiary);
}

.delete-btn:hover {
  background: var(--error-color);
  color: white;
}

.archive-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}

.info-row .label {
  color: var(--text-secondary);
}

.info-row .value {
  color: var(--text-primary);
  font-weight: 500;
}

.archive-status {
  margin-bottom: 12px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.saved {
  background: var(--success-color);
  color: white;
}

.status-badge.temp {
  background: var(--accent-color);
  color: white;
}

.archive-controls {
  display: flex;
  gap: 8px;
}

.save-btn,
.details-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn {
  background: var(--accent-color);
  color: white;
}

.save-btn.saved {
  background: var(--success-color);
}

.save-btn:hover {
  opacity: 0.8;
}

.details-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--divider-light);
}

.details-btn:hover {
  background: var(--divider-light);
}

.bulk-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-secondary);
  border: 1px solid var(--accent-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
}

.bulk-info {
  font-weight: 500;
  color: var(--text-primary);
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

.modal-overlay {
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
  padding: 20px;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  width: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--divider-light);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.detail-label {
  color: var(--text-secondary);
}

.detail-value {
  color: var(--text-primary);
  font-weight: 500;
}

.player-detail {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.player-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.player-index {
  font-weight: 600;
  color: var(--text-primary);
}

.steam-id {
  color: var(--text-secondary);
  font-family: monospace;
}

.inventory-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inventory-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.inventory-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.inventory-item {
  background: var(--accent-color);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.empty-inventory {
  color: var(--text-secondary);
  font-style: italic;
}

/* 按钮样式 */
.primary-btn,
.secondary-btn,
.danger-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn {
  background: var(--accent-color);
  color: white;
}

.primary-btn:hover:not(:disabled) {
  opacity: 0.8;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--divider-light);
}

.secondary-btn:hover {
  background: var(--divider-light);
}

.danger-btn {
  background: var(--error-color);
  color: white;
}

.danger-btn:hover {
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .archives-grid {
    grid-template-columns: 1fr;
  }

  .stats {
    flex-direction: column;
    gap: 16px;
  }

  .button-group {
    flex-direction: column;
  }

  .filter-group {
    flex-direction: column;
    gap: 12px;
  }

  .bulk-actions {
    position: static;
    transform: none;
    margin-top: 20px;
    flex-direction: column;
    align-items: stretch;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>