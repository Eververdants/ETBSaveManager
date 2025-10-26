<template>
  <div class="home-container">
    <div class="archive-list-container" :class="{ 'no-scroll': showSearch }">
      <!-- 加载状态和存档网格 - 布局切换动画 -->
      <transition name="layout-switch" mode="out-in">
        <div v-if="loading" key="loading" class="loading-state">
          <div class="loading-content">
            <div class="loading-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
            </div>
            <h3 class="loading-title">{{ $t('archiveSearch.loadingArchives') }}</h3>
            <p class="loading-subtitle">{{ $t('archiveSearch.scanningFiles') }}</p>
            <div class="loading-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else key="grid" class="archive-grid-container">
          <transition-group name="archive-card" tag="div" class="archive-grid" ref="archiveGrid"
            @before-enter="beforeCardEnter" @enter="cardEnter" @leave="cardLeave">
            <ArchiveCard v-for="(archive, index) in displayArchives" :key="archive.id" :archive="archive" :index="index"
              :data-index="index" @toggle-visibility="handleToggleVisibility" @edit="handleEdit" @delete="deleteArchive"
              @select="selectArchive" />

            <div v-if="displayArchives.length === 0 && archives.length > 0 && hasActiveFilters" key="no-results"
              class="empty-state">
              <div class="empty-content">
                <div class="empty-icon">🔍</div>
                <h3 class="empty-title">{{ $t('archiveSearch.noResults') }}</h3>
                <p class="empty-description">{{ $t('archiveSearch.noMatchingArchives') }}</p>
                <p class="empty-hint">{{ $t('archiveSearch.adjustSearchOrClearFilters') }}</p>
                <button class="empty-action" @click="clearAllFilters">
                  {{ $t('archiveSearch.clearFilters') }}
                </button>
              </div>
            </div>

            <div v-else-if="displayArchives.length === 0 && archives.length === 0" key="no-archives" class="empty-state">
              <div class="empty-content">
                <div class="empty-icon">📁</div>
                <h3 class="empty-title">{{ $t('archiveSearch.noArchives') }}</h3>
                <p class="empty-description">{{ $t('archiveSearch.createNewArchive') }}</p>
                <button class="empty-action" @click="createNewArchive">
                  {{ $t('archiveSearch.createArchive') }}
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </transition>

      <!-- 搜索存档组件 -->
      <Teleport to="body">
        <transition name="search-panel" @before-enter="beforeSearchEnter" @enter="searchEnter" @leave="searchLeave">
          <div v-show="showSearch && !loading" class="search-overlay">
            <!-- 使用Teleport将搜索组件传送到body层级，确保不受父容器影响 -->
            <ArchiveSearchFilter :archives="archives" :initial-filters="lastSearchFilters"
              :visible="showSearch" @filtered="handleFilteredArchives" @filters-changed="updateLastFilters"
              @close="toggleSearch" ref="archiveSearchFilter" />
          </div>
        </transition>
      </Teleport>

      <!-- 删除确认模态框 -->
      <ConfirmModal v-model:show="showDeleteConfirm" :title="$t('confirmModal.deleteArchiveTitle')"
        :message="$t('confirmModal.deleteArchiveMessage', { name: archiveToDelete?.name || '' })"
        :description="$t('confirmModal.deleteArchiveDescription')" type="danger"
        :confirm-text="$t('confirmModal.confirm')" :cancel-text="$t('confirmModal.cancel')" :loading="isDeleting"
        @confirm="confirmDelete" @cancel="cancelDelete" />
        
      <!-- 性能设置模态框 -->
      <Teleport to="body">
        <transition name="modal">
          <div v-if="showPerformanceSettings" class="modal-overlay" @click.self="showPerformanceSettings = false">
            <div class="modal-container">
              <div class="modal-header">
                <h2 class="modal-title">性能设置</h2>
                <button class="modal-close" @click="showPerformanceSettings = false">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div class="modal-body">
                <PerformanceSettings 
                  v-model:performanceMode="performanceMode"
                  v-model:animationQuality="animationQuality"
                  v-model:hardwareAcceleration="hardwareAcceleration"
                  v-model:virtualizationEnabled="virtualizationEnabled" />
              </div>
            </div>
          </div>
        </transition>
      </Teleport>
    </div>
    
    <!-- 浮动操作按钮 - 移到body层级确保不受任何父容器影响 -->
    <Teleport to="body">
      <FloatingActionButton :class="loading ? 'loading' : ''" :current-index="fabCurrentIndex"
        @update:current-index="fabCurrentIndex = $event" @search-click="toggleSearch" @refresh-click="refreshArchives"
        @folder-click="openSaveGamesFolder" @settings-click="showPerformanceSettings = true" />
    </Teleport>
  </div>
</template>



<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { gsap } from 'gsap'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import { safeModifyBodyStyles, protectFloatingButtonPosition } from '../utils/floatingButtonProtection.js'
import { detectDevicePerformance, getAnimationParams, createPerformanceMonitor } from '../utils/performance.js'
import ArchiveCard from '../components/ArchiveCard.vue'
import ArchiveSearchFilter from '../components/ArchiveSearchFilter.vue'
import FloatingActionButton from '../components/FloatingActionButton.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import PerformanceSettings from '../components/PerformanceSettings.vue'

// FloatingActionButton当前索引状态
const fabCurrentIndex = ref(0)

// 浮动按钮位置检查定时器引用
const fabPositionCheckerRef = ref(null)

// 从后端加载的真实存档数据
const archives = ref([])
const router = useRouter()

// 可见存档列表（从MAINSAVE获取）
const visibleSaves = ref(new Set())

// 性能设置状态
const showPerformanceSettings = ref(false)
const performanceMode = ref('auto') // 'auto' | 'normal' | 'low'
const animationQuality = ref('medium') // 'high' | 'medium' | 'low' | 'disabled'
const hardwareAcceleration = ref(true)
const virtualizationEnabled = ref(true)

// 性能监控实例
let performanceMonitor = null

// 性能观察器清理函数
let cleanupPerformanceObserver = null

// 长任务监控 - 用于检测页面卡顿
let longTaskObserver = null
let longTaskCount = 0
const LONG_TASK_THRESHOLD = 50 // 50ms
const LONG_TASK_LIMIT = 3 // 连续3个长任务后降低质量，更快响应性能问题

// 在组件卸载时清理定时器
onUnmounted(() => {
  if (fabPositionCheckerRef.value) {
    clearInterval(fabPositionCheckerRef.value)
    fabPositionCheckerRef.value = null
  }
})

// 加载状态
const loading = ref(true)
const loadingProgress = ref(0)

// 性能优化：批量更新和防抖
let updateTimeout = null
let animationFrame = null

// 获取MAINSAVE中的可见存档列表
const loadVisibleSaves = async () => {
  try {
    // 调用后端获取MAINSAVE文件内容
    const response = await invoke('handle_file', { 
      action: 'read',
      filePath: 'MAINSAVE.sav' 
    })
    
    if (response && response.success && response.data) {
      // 解析SingleplayerSaves字段
      const singleplayerSaves = response.data.SingleplayerSaves || []
      visibleSaves.value = new Set(singleplayerSaves)
    } else {
      // 如果MAINSAVE不存在或读取失败，默认所有单人存档都可见
      visibleSaves.value = new Set()
    }
  } catch (error) {
    console.error('获取可见存档列表失败:', error)
    visibleSaves.value = new Set()
  }
}

// 加载真实存档数据（带进度模拟）
const loadRealArchives = async () => {
  try {
    // 模拟加载进度
    const progressInterval = setInterval(() => {
      loadingProgress.value = Math.min(loadingProgress.value + Math.random() * 15, 90)
    }, 200)

    // 调用后端的 load_all_saves 命令
    const response = await invoke('load_all_saves')

    clearInterval(progressInterval)
    loadingProgress.value = 100

    if (response && Array.isArray(response)) {
      // 中文难度到英文的映射
      const difficultyMap = {
        '简单难度': 'easy',
        '普通难度': 'normal',
        '困难难度': 'hard',
        '噩梦难度': 'nightmare'
      }

      // 将后端返回的数据格式转换为前端需要的格式
      return response.map(item => {
        const gameMode = item.mode === '单人模式' ? 'singleplayer' :
          item.mode === '多人模式' ? 'multiplayer' :
            item.mode.toLowerCase()
        
        // 直接使用后端返回的is_visible值，不再自己判断
        const isVisible = item.is_visible === true
        
        return {
          id: item.id,
          name: item.name,
          currentLevel: item.current_level,
          gameMode: gameMode,
          archiveDifficulty: difficultyMap[item.difficulty] || item.difficulty.toLowerCase(),
          actualDifficulty: difficultyMap[item.actual_difficulty] || item.actual_difficulty.toLowerCase(),
          isVisible: isVisible,
          path: item.path,
          date: item.date
        }
      })
    }
    return []
  } catch (error) {
    console.error('加载存档失败:', error)
    return []
  }
}

// 初始化真实存档数据
const initializeArchives = async (silent = false) => {
  if (!silent) {
    loading.value = true
  }
  
  // 确保在加载过程中不显示任何内容（非静默模式）
  if (!silent) {
    archives.value = []
    displayArchives.value = []
  }

  try {
    // 先加载可见存档列表
    await loadVisibleSaves()
    
    // 再加载存档数据
    const realArchives = await loadRealArchives()
    archives.value = realArchives

    // 只有在没有激活搜索筛选时才直接赋值
    if (!hasActiveFilters.value) {
      displayArchives.value = realArchives
    }

    // 确保浮动按钮位置正确
    nextTick(() => {
      enhancedProtectFloatingButton()
    })

    // 如果没有找到存档，显示空列表
    if (realArchives.length === 0) {
      console.warn('未找到可加载的存档')
    }
  } catch (error) {
    console.error('初始化存档失败:', error)
    if (!silent) {
      archives.value = []
      displayArchives.value = []
    }
  } finally {
    if (!silent) {
      setTimeout(() => {
        loading.value = false
      }, 300) // 确保动画流畅
    }
  }
}

// 搜索相关状态
const showSearch = ref(false)
const filteredArchives = ref([])
const displayArchives = ref([])

// 删除确认相关状态
const showDeleteConfirm = ref(false)
const archiveToDelete = ref(null)
const isDeleting = ref(false)

// 筛选状态持久化（内存中，不保存到本地存储）
const lastSearchFilters = ref({
  searchQuery: '',
  selectedGameMode: '',
  selectedArchiveDifficulty: '',
  selectedActualDifficulty: '',
  selectedVisibility: ''
})

// 性能优化：防抖处理筛选
const debouncedApplyFilters = (archives, filters) => {
  if (updateTimeout) clearTimeout(updateTimeout)

  updateTimeout = setTimeout(() => {
    const filtered = applyFiltersImmediate(archives, filters)
    displayArchives.value = filtered
    
    // 确保浮动按钮位置正确
     nextTick(() => {
       enhancedProtectFloatingButton()
     })
  }, 100)
}

// 立即应用筛选逻辑
const applyFiltersImmediate = (archives, filters) => {
  if (!archives || archives.length === 0) return []

  let filtered = archives

  // 按名称搜索
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    filtered = filtered.filter(archive =>
      archive.name.toLowerCase().includes(query)
    )
  }

  // 按存档难度筛选
  if (filters.selectedArchiveDifficulty) {
    filtered = filtered.filter(archive =>
      archive.archiveDifficulty === filters.selectedArchiveDifficulty
    )
  }

  // 按实际难度筛选
  if (filters.selectedActualDifficulty) {
    filtered = filtered.filter(archive =>
      archive.actualDifficulty === filters.selectedActualDifficulty
    )
  }

  // 按可见性筛选
  if (filters.selectedVisibility) {
    const isVisible = filters.selectedVisibility === 'visible'
    filtered = filtered.filter(archive =>
      archive.isVisible === isVisible
    )
  }

  return filtered
}

// 性能监控：监听系统性能状态
const performanceObserver = () => {
  if (!('PerformanceObserver' in window) || !('PerformanceLongTaskTiming' in window)) {
    console.warn('Performance Observer or Long Task Timing not supported')
    return
  }

  // 获取设备性能信息
  const devicePerf = detectDevicePerformance()
  
  // 根据设备性能调整阈值
  const longTaskThreshold = devicePerf.isVeryLowEndDevice ? 30 : 50
  const fpsThreshold = devicePerf.isVeryLowEndDevice ? 20 : 30
  
  longTaskObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration > longTaskThreshold) {
        longTaskCount++
        if (longTaskCount >= LONG_TASK_LIMIT) {
          // 触发降低动画质量
          performanceMode.value = 'low'
          isSidebarAnimating = true

          // 重置计数器
          setTimeout(() => {
            longTaskCount = 0
            isSidebarAnimating = false
          }, 1000)
        }
      }
    })
  })

  longTaskObserver.observe({ entryTypes: ['longtask'] })

  // 添加帧率监控
  let lastTime = performance.now()
  let frameCount = 0
  let fpsCheckTimer = null
  let lowFpsCount = 0
  let isLowPerfMode = false // 是否已切换到低性能模式

  const checkFPS = () => {
    const now = performance.now()
    frameCount++

    if (now - lastTime >= 1000) { // 每秒检查一次
      const fps = Math.round((frameCount * 1000) / (now - lastTime))

      // 如果FPS低于阈值，自动切换到低性能模式
      if (fps < fpsThreshold) {
        lowFpsCount++
        // 连续3次低FPS才切换，避免偶尔波动
        if (lowFpsCount >= 3 && performanceMode.value !== 'low' && !isLowPerfMode) {
          console.warn(`检测到帧率过低 (${fps} FPS)，自动切换到低性能模式`)
          performanceMode.value = 'low'
          isLowPerfMode = true
        }
      } else {
        // FPS恢复后重置计数器
        if (lowFpsCount > 0) {
          lowFpsCount = Math.max(0, lowFpsCount - 1)
        }
        
        // 如果FPS恢复到45以上，可以考虑恢复普通模式
        if (fps > 45 && isLowPerfMode && lowFpsCount === 0) {
          console.log(`帧率已恢复 (${fps} FPS)，恢复到自动性能模式`)
          performanceMode.value = 'auto'
          isLowPerfMode = false
        }
      }

      // 重置计数器
      frameCount = 0
      lastTime = now
    }

    fpsCheckTimer = requestAnimationFrame(checkFPS)
  }

  // 开始帧率监控
  fpsCheckTimer = requestAnimationFrame(checkFPS)

  // 返回清理函数
  return () => {
    if (longTaskObserver) {
      longTaskObserver.disconnect()
      longTaskObserver = null
    }
    if (fpsCheckTimer) {
      cancelAnimationFrame(fpsCheckTimer)
    }
  }
}

// 获取动画参数的函数

// 性能优化：虚拟化大列表
const VIRTUALIZATION_THRESHOLD = 30 // 降低阈值以更早启用虚拟化
const isVirtualizationEnabled = computed(() => archives.value.length > VIRTUALIZATION_THRESHOLD)

// 计算属性优化
const archiveStats = computed(() => ({
  total: archives.value.length,
  visible: archives.value.filter(a => a.isVisible).length,
  hidden: archives.value.filter(a => !a.isVisible).length
}))

// 检查是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return lastSearchFilters.value.searchQuery ||
    lastSearchFilters.value.selectedArchiveDifficulty ||
    lastSearchFilters.value.selectedActualDifficulty ||
    lastSearchFilters.value.selectedVisibility
})

const archiveGrid = ref(null)
const archiveSearchFilter = ref(null)

// 搜索相关方法
const toggleSearch = () => {
  showSearch.value = !showSearch.value
  
  // 当打开搜索时，不再滚动到顶部，保持在当前位置
  if (showSearch.value) {
    nextTick(() => {
      // 确保浮动按钮位置正确
      protectFloatingButtonPosition()
    })
  }
}

const updateLastFilters = (filters) => {
  lastSearchFilters.value = { ...filters }
}

const handleFilteredArchives = (filteredArchives) => {
  // 只有在非加载状态时才应用筛选结果
  if (!loading.value) {
    // 使用nextTick确保DOM更新完成后再设置值，以正确触发动画
    nextTick(() => {
      displayArchives.value = filteredArchives
      
      // 确保浮动按钮位置正确
      enhancedProtectFloatingButton()
    })
  }
}

const clearAllFilters = () => {
  // 先清空显示的存档，触发动画
  displayArchives.value = []

  // 重置筛选条件
  const resetFilters = {
    searchQuery: '',
    selectedGameMode: '',
    selectedArchiveDifficulty: '',
    selectedActualDifficulty: '',
    selectedVisibility: ''
  }

  // 调用搜索组件的clearAllFilters方法来重置筛选条件
  if (archiveSearchFilter.value && typeof archiveSearchFilter.value.clearAllFilters === 'function') {
    archiveSearchFilter.value.clearAllFilters()
  }

  // 更新lastSearchFilters以触发子组件的watch
  lastSearchFilters.value = resetFilters

  // 使用nextTick确保DOM更新完成后再设置值，以正确触发动画
  nextTick(() => {
    // 延迟设置存档数据，确保空状态动画完成后再显示存档
    setTimeout(() => {
      displayArchives.value = [...archives.value]
      
      // 确保浮动按钮位置正确
      enhancedProtectFloatingButton()
    }, 400) // 与空状态动画时长保持一致
  })
}

// 选择存档
// 防重复点击控制
const clickTimeouts = new Map()
const isProcessingClick = new Set()

const selectArchive = (archive) => {
  // 防止重复点击
  if (isProcessingClick.has(archive.id)) {
    return
  }

  isProcessingClick.add(archive.id)

  // 清除之前的定时器
  if (clickTimeouts.has(archive.id)) {
    clearTimeout(clickTimeouts.get(archive.id))
  }

  // 移除动画效果，直接处理选择逻辑
  // 这里可以添加其他选择后的处理逻辑

  // 延迟清理点击状态
  setTimeout(() => {
    isProcessingClick.delete(archive.id)
  }, 300)
}

const handleToggleVisibility = async (updatedArchive) => {
  try {
    // 立即更新前端状态，提供即时反馈
    const originalVisibility = updatedArchive.isVisible
    const newVisibility = !originalVisibility
    
    // 同步更新主存档列表 - 使用Vue的响应式更新
    const archiveIndex = archives.value.findIndex(a => a.id === updatedArchive.id)
    if (archiveIndex > -1) {
      archives.value[archiveIndex].isVisible = newVisibility
    }
    
    // 同步更新显示列表，确保视图立即更新 - 使用Vue的响应式更新
    const displayIndex = displayArchives.value.findIndex(a => a.id === updatedArchive.id)
    if (displayIndex > -1) {
      displayArchives.value[displayIndex].isVisible = newVisibility
    }

    // 显示成功提示
    const action = newVisibility ? '显示' : '隐藏'
    const successToast = document.createElement('div')
    successToast.className = 'success-toast'
    successToast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">✓</span>
        <span class="toast-text">${updatedArchive.name} 已${action}</span>
      </div>
    `
    document.body.appendChild(successToast)

    gsap.fromTo(successToast,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
    )

    setTimeout(() => {
      gsap.to(successToast, {
        opacity: 0, scale: 0.8, duration: 0.3, onComplete: () => {
          document.body.removeChild(successToast)
        }
      })
    }, 2000)

    // 调用后端处理文件
    if (updatedArchive.path) {
      const result = await invoke('handle_file', {
        filePath: updatedArchive.path,
        action: 'toggle_visibility',
        archiveName: updatedArchive.name
      })

      // 解析后端返回的JSON字符串
      let resultObj;
      try {
        resultObj = typeof result === 'string' ? JSON.parse(result) : result;
      } catch (e) {
        console.error('解析后端返回结果失败:', e);
        throw new Error('解析后端返回结果失败');
      }

      if (!resultObj || !resultObj.success) {
        // 如果后端操作失败，恢复前端状态
        
        // 同步恢复主存档列表
        if (archiveIndex > -1) {
          archives.value[archiveIndex].isVisible = originalVisibility
        }
        
        // 同步恢复显示列表
        if (displayIndex > -1) {
          displayArchives.value[displayIndex].isVisible = originalVisibility
        }
        
        throw new Error(resultObj?.error || '操作失败')
      }
      
      // 后端操作成功，立即重新加载数据以确保状态一致性
      
      // 立即重新加载存档列表，不显示动画
      await initializeArchives(true) // true 表示静默加载，不显示动画
      
      // 确保浮动按钮位置正确
      protectFloatingButtonPosition()
    }
  } catch (error) {
    console.error('切换可见性失败:', error)
    
    // 使用更优雅的错误提示
    const errorToast = document.createElement('div')
    errorToast.className = 'error-toast'
    errorToast.textContent = '切换可见性失败: ' + error.message
    document.body.appendChild(errorToast)

    gsap.fromTo(errorToast,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    )

    setTimeout(() => {
      gsap.to(errorToast, {
        opacity: 0, y: -50, duration: 0.3, onComplete: () => {
          document.body.removeChild(errorToast)
        }
      })
    }, 3000)
  }
}

const handleEdit = (archive) => {
  router.push({
    name: 'EditArchive',
    params: { archiveData: JSON.stringify(archive) }
  })
}

const deleteArchive = (archive) => {
  archiveToDelete.value = archive
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!archiveToDelete.value) return

  isDeleting.value = true
  const archive = archiveToDelete.value
  const index = archives.value.findIndex(a => a.id === archive.id)

  if (index > -1) {
    try {
      // 先调用后端删除实际文件
      if (archive.path) {
        await invoke('delete_file', { filePath: archive.path })
      }

      // 从前端数据中移除
      archives.value.splice(index, 1)

      // 重新应用筛选器
      debouncedApplyFilters(archives.value, lastSearchFilters.value)
      
      // 确保浮动按钮位置正确
      protectFloatingButtonPosition()

      // 添加删除成功动画
      const successToast = document.createElement('div')
      successToast.className = 'success-toast'
      successToast.innerHTML = `
        <div class="toast-content">
          <span class="toast-icon">✓</span>
          <span class="toast-text">${archive.name} 已删除</span>
        </div>
      `
      document.body.appendChild(successToast)

      gsap.fromTo(successToast,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
      )

      setTimeout(() => {
        gsap.to(successToast, {
          opacity: 0, scale: 0.8, duration: 0.3, onComplete: () => {
            document.body.removeChild(successToast)
          }
        })
      }, 2500)

      setTimeout(() => {
        closeDeleteModal()
      }, 300)

    } catch (error) {
      console.error('删除存档失败:', error)
      closeDeleteModal()
    }
  }
}

const cancelDelete = () => {
  closeDeleteModal()
}

const closeDeleteModal = () => {
  showDeleteConfirm.value = false
  archiveToDelete.value = null
  isDeleting.value = false
}

// 创建新存档
const createNewArchive = () => {
  router.push({ name: 'CreateArchive' })
}

// 刷新存档列表
const refreshArchives = async () => {
  loading.value = true
  loadingProgress.value = 0

  try {
    // 先重新加载可见存档列表（关键修复：确保获取最新的可见性状态）
    await loadVisibleSaves()
    
    // 再重新加载真实存档数据
    const realArchives = await loadRealArchives()
    archives.value = realArchives

    // 重新应用当前筛选器
    debouncedApplyFilters(archives.value, lastSearchFilters.value)

  } catch (error) {
    console.error('刷新存档失败:', error)
  } finally {
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

const resetPerformanceMode = () => {
  performanceMode.value = 'normal'
  isSidebarAnimating = false
  longTaskCount = 0
}

// 本地增强的浮动按钮保护函数，使用导入的全局函数
const enhancedProtectFloatingButton = () => {
  // 立即执行一次保护
  protectFloatingButtonPosition()
  
  // 在下一个动画帧再次检查，确保DOM更新完成
  requestAnimationFrame(() => {
    protectFloatingButtonPosition()
    
    // 多重延迟检查，确保所有可能的布局变化都被处理
    setTimeout(protectFloatingButtonPosition, 50)
    setTimeout(protectFloatingButtonPosition, 100)
    setTimeout(protectFloatingButtonPosition, 200)
    setTimeout(protectFloatingButtonPosition, 300)
    setTimeout(protectFloatingButtonPosition, 500)
    setTimeout(protectFloatingButtonPosition, 1000)
    
    // 最终检查 - 确保位置完全正确
    setTimeout(() => {
      const container = document.querySelector('.floating-action-container')
      if (container) {
        const rect = container.getBoundingClientRect()
        const expectedBottom = window.innerHeight - rect.bottom
        const expectedRight = window.innerWidth - rect.right
        
        // 如果位置偏差超过5px，强制重置
        if (Math.abs(expectedBottom - 30) > 5 || Math.abs(expectedRight - 30) > 5) {
          container.style.setProperty('position', 'fixed', 'important')
          container.style.setProperty('bottom', `${expectedBottom}px`, 'important')
          container.style.setProperty('right', `${expectedRight}px`, 'important')
          container.style.setProperty('transform', 'none', 'important')
          container.style.setProperty('margin', '0', 'important')
          container.style.setProperty('top', 'auto', 'important')
          container.style.setProperty('left', 'auto', 'important')
          container.style.setProperty('z-index', '1000', 'important')
        }
      }
    }, 1000)
  })
}

// 打开存档文件夹
const openSaveGamesFolder = async () => {
  try {
    await invoke('open_save_games_folder')

    // 添加打开成功动画
    const folderToast = document.createElement('div')
    folderToast.className = 'folder-toast'
    folderToast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">📁</span>
        <span class="toast-text">已打开存档文件夹</span>
      </div>
    `
    document.body.appendChild(folderToast)

    gsap.fromTo(folderToast,
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
    )

    setTimeout(() => {
      gsap.to(folderToast, {
        opacity: 0, x: 50, duration: 0.3, onComplete: () => {
          document.body.removeChild(folderToast)
        }
      })
    }, 2000)
    
    // 确保浮动按钮位置不受影响
    enhancedProtectFloatingButton()
    
    // 延迟再次检查，确保在所有动画完成后按钮位置仍然正确
    setTimeout(enhancedProtectFloatingButton, 300)

  } catch (error) {
    console.error('打开文件夹失败:', error)
  }
}

// 动画钩子函数
const beforeCardEnter = (el) => {
  // 获取动画参数
  const params = getAnimationParams('cardEnter', performanceMode.value, animationQuality.value)
  
  const index = parseInt(el.dataset.index) || 0
  el.style.setProperty('--index', index)
  el.style.opacity = 0
  el.style.transform = 'translateY(20px)'
}

const cardEnter = (el, done) => {
  // 如果正在侧边栏动画期间，跳过动画直接完成
  if (typeof isSidebarAnimating !== 'undefined' && isSidebarAnimating) {
    el.style.opacity = 1
    el.style.transform = 'translateY(0)'
    done()
    return
  }

  // 获取动画参数
  const params = getAnimationParams('cardEnter', performanceMode.value, animationQuality.value)
  const devicePerf = detectDevicePerformance()
  
  // 对于大量卡片情况，简化动画
  const index = parseInt(el.dataset.index) || 0
  const cardCount = displayArchives.value.length

  // 在极低性能模式或卡片数量过多时，直接完成动画
  if (devicePerf.isVeryLowEndDevice || cardCount > 200 || performanceMode.value === 'low') {
    el.style.opacity = 1
    el.style.transform = 'translateY(0)'
    el.style.removeProperty('--index')
    done()
    return
  }

  // 如果卡片数量超过100，减少动画延迟以提升性能
  const delay = cardCount > 100 ? Math.min(index * params.delay, 150) : Math.min(index * params.delay, 300)
  const duration = cardCount > 100 ? 0.2 : params.duration
  
  // 移除延迟，使用 requestAnimationFrame 确保同步
  requestAnimationFrame(() => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: duration,
      ease: params.ease,
      force3D: params.force3D,
      onComplete: done
    })
  })
}

const cardLeave = (el, done) => {
  // 如果正在侧边栏动画期间，跳过动画直接完成
  if (typeof isSidebarAnimating !== 'undefined' && isSidebarAnimating) {
    el.style.opacity = 0
    el.style.transform = 'translateY(-20px)'
    done()
    return
  }

  // 获取动画参数
  const params = getAnimationParams('cardLeave', performanceMode.value, animationQuality.value)
  const devicePerf = detectDevicePerformance()
  
  // 对于大量卡片情况，简化动画
  const cardCount = displayArchives.value.length
  
  // 在极低性能模式或卡片数量过多时，直接完成动画
  if (devicePerf.isVeryLowEndDevice || cardCount > 200 || performanceMode.value === 'low') {
    el.style.opacity = 0
    el.style.transform = 'translateY(-10px)'
    done()
    return
  }
  
  const duration = cardCount > 100 ? 0.15 : params.duration

  gsap.to(el, {
    opacity: 0,
    y: -10,
    duration: duration,
    ease: params.ease,
    onComplete: done
  })
}

const beforeSearchEnter = (el) => {
  // 获取动画参数
  const params = getAnimationParams('search', performanceMode.value, animationQuality.value)
  
  // 预设置初始状态，避免初始跳动
  gsap.set(el, {
    opacity: 0,
    y: -15,
    force3D: params.force3D,
    willChange: 'opacity, transform'
  })
}

const searchEnter = (el, done) => {
  // 获取动画参数
  const params = getAnimationParams('search', performanceMode.value, animationQuality.value)
  const devicePerf = detectDevicePerformance()
  
  // 移除延迟，使用 requestAnimationFrame 确保同步
  requestAnimationFrame(() => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: params.duration,
      ease: params.ease,
      force3D: params.force3D,
      onComplete: done
    })
  })
}

const searchLeave = (el, done) => {
  // 获取动画参数
  const params = getAnimationParams('search', performanceMode.value, animationQuality.value)
  const devicePerf = detectDevicePerformance()
                          
  gsap.to(el, {
    opacity: 0,
    y: -8,
    duration: params.duration,
    ease: params.ease,
    force3D: params.force3D,
    onComplete: done
  })
}

// 性能优化：使用 Intersection Observer 进行懒加载
let intersectionObserver = null

// 侧边栏动画控制
let isSidebarAnimating = false
let sidebarAnimationTimeout = null

// 生命周期
onMounted(async () => {
  // 组件卸载标志
  let isUnmounted = false
  
  // 初始化性能监控并保存清理函数
  cleanupPerformanceObserver = performanceObserver()
  
  // 创建性能监控器实例
  performanceMonitor = createPerformanceMonitor({
    onLowPerformance: () => {
      performanceMode.value = 'low'
      animationQuality.value = 'low'
      console.log('检测到性能问题，已切换到低性能模式')
    },
    onPerformanceRecovery: () => {
      if (performanceMode.value === 'low') {
        performanceMode.value = 'auto'
        animationQuality.value = 'medium'
        console.log('性能已恢复，已切换到自动性能模式')
      }
    },
    onFPSUpdate: (fps) => {
      // 可以在这里更新UI显示当前FPS
      if (fps < 30 && fps > 0) {
        console.warn(`当前帧率较低: ${fps} FPS`)
      }
    }
  })
  
  // 初始化性能监控器
  performanceMonitor.start()
  
  // 检测设备性能并设置初始性能模式
  const devicePerf = detectDevicePerformance()
  if (devicePerf.isLowEndDevice) {
    performanceMode.value = 'low'
    animationQuality.value = 'low'
  } else if (devicePerf.performanceLevel === 'high') {
    performanceMode.value = 'auto'
    animationQuality.value = 'high'
  }
  
  // 初始化浮动按钮样式保护
   let fabObserver = null
   const initFloatingButtonProtection = () => {
     const fabElement = document.querySelector('.floating-action-container')
     if (fabElement) {
       // 初始化保护按钮位置
       enhancedProtectFloatingButton()
       
       // 创建MutationObserver监控样式变化，但只监控关键定位属性
       fabObserver = new MutationObserver((mutations) => {
         mutations.forEach((mutation) => {
           if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
             // 只检查关键定位属性
             const currentStyles = fabElement.style;
             const criticalStyles = ['position', 'bottom', 'right', 'top', 'left'];
             let hasCriticalChanges = false;
             
             // 检查关键定位样式是否被意外修改
             criticalStyles.forEach(prop => {
               const currentValue = currentStyles.getPropertyValue(prop);
               let expectedValue = '';
               
               // 根据屏幕尺寸确定期望值
               if (prop === 'position') {
                 expectedValue = 'fixed';
               } else if (prop === 'bottom' || prop === 'right') {
                 if (window.innerWidth <= 480) {
                   expectedValue = prop === 'bottom' ? '15px' : '15px';
                 } else if (window.innerWidth <= 768) {
                   expectedValue = prop === 'bottom' ? '20px' : '20px';
                 } else {
                   expectedValue = '30px';
                 }
               } else if (prop === 'top' || prop === 'left') {
                 expectedValue = 'auto';
               }
               
               if (currentValue && currentValue !== expectedValue) {
                 console.warn(`浮动按钮定位样式被意外修改: ${prop}`);
                 hasCriticalChanges = true;
               }
             });
             
             // 只有检测到关键定位样式被修改时才恢复
             if (hasCriticalChanges) {
               console.log('恢复浮动按钮定位样式');
               protectFloatingButtonPosition()
             }
           }
         })
       })
       
       // 开始观察
       fabObserver.observe(fabElement, {
         attributes: true,
         attributeFilter: ['style'],
         childList: false,
         subtree: false
       })
       
       console.log('浮动按钮样式保护已启用')
     }
   }
   
   // 延迟初始化以确保DOM已完全加载
   setTimeout(initFloatingButtonProtection, 1000)
   
   // 定期检查浮动按钮位置，确保它始终正确
   const fabPositionChecker = setInterval(() => {
     protectFloatingButtonPosition()
   }, 5000)
   
   // 将定时器保存到组件实例，以便在onUnmounted中清理
   fabPositionCheckerRef.value = fabPositionChecker

  // 设置CSS变量用于动画控制
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.documentElement.style.setProperty(
    '--animation-duration',
    prefersReducedMotion ? '0.2s' : '0.4s'
  )

  // 加载存档数据
  await initializeArchives()
  displayArchives.value = [...archives.value]

  // 初始化 Intersection Observer
  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          
          // 元素进入视图时强制重绘，防止图层卡住
          requestAnimationFrame(() => {
            // 检查元素和样式是否仍然存在
            if (entry.target && entry.target.style) {
              entry.target.style.transform = 'translateZ(0)';
              setTimeout(() => {
                // 再次检查，防止组件卸载后访问
                if (entry.target && entry.target.style) {
                  entry.target.style.transform = '';
                }
              }, 0);
            }
          });
        }
      })
    }, {
      rootMargin: '50px',
      threshold: 0.1
    })
  }

  // 监听窗口大小变化
  const handleResize = () => {
    // 如果组件已卸载，直接返回
    if (isUnmounted) return
    
    if (animationFrame) cancelAnimationFrame(animationFrame)
    animationFrame = requestAnimationFrame(() => {
      // 如果组件已卸载，直接返回
      if (isUnmounted) return
      
      // 重新计算布局
      
      // 窗口大小变化时强制重绘，防止图层卡住
      if (archiveGrid.value && archiveGrid.value.style) {
        archiveGrid.value.style.visibility = 'hidden';
        archiveGrid.value.offsetHeight; // 触发重排
        archiveGrid.value.style.visibility = 'visible';
      }
      
      // 使用全局保护工具安全修改body样式
      safeModifyBodyStyles(() => {
        document.body.style.transform = 'translateZ(0)';
        setTimeout(() => {
          if (!isUnmounted && document.body) {
            document.body.style.transform = '';
          }
        }, 0);
      });
      
      // 确保浮动按钮位置在窗口大小变化时正确
      protectFloatingButtonPosition()
    })
  }

  // 监听侧边栏展开/收起事件
  const handleSidebarExpand = (event) => {
    // 如果组件已卸载，直接返回
    if (isUnmounted) return
    
    // 设置动画状态标志，暂时禁用卡片动画
    isSidebarAnimating = true
    if (sidebarAnimationTimeout) clearTimeout(sidebarAnimationTimeout)

    // 在侧边栏动画结束后重新启用卡片动画
    sidebarAnimationTimeout = setTimeout(() => {
      // 检查组件是否仍然挂载
      if (!isUnmounted) {
        isSidebarAnimating = false
      }
    }, 350) // 稍长于侧边栏动画时间(300ms)

    // 使用requestAnimationFrame延迟执行，避免阻塞UI
    requestAnimationFrame(() => {
      // 如果组件已卸载，直接返回
      if (isUnmounted) return
      
      // 触发网格重新布局
      if (archiveGrid.value && archiveGrid.value.style) {
        // 强制浏览器重新计算样式，但不触发重排
        archiveGrid.value.style.visibility = 'hidden'
        archiveGrid.value.offsetHeight // 触发重排
        archiveGrid.value.style.visibility = 'visible'
      }
    })
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('sidebar-expand', handleSidebarExpand)
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (updateTimeout) clearTimeout(updateTimeout)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  if (intersectionObserver) intersectionObserver.disconnect()
  if (sidebarAnimationTimeout) clearTimeout(sidebarAnimationTimeout)
  
  // 停止性能监控
  if (performanceMonitor) {
    performanceMonitor.stop()
    performanceMonitor = null
  }
  
  // 清理性能观察器
  if (cleanupPerformanceObserver) {
    cleanupPerformanceObserver()
  }
  
  // 清理长任务观察器
  if (longTaskObserver) {
    longTaskObserver.disconnect()
    longTaskObserver = null
  }
  
  window.removeEventListener('resize', () => {})
  window.removeEventListener('sidebar-expand', () => {})
  // 清理引用，防止内存泄漏
  archiveGrid.value = null
})

// 监听存档变化
watch(archives, (newArchives) => {
  debouncedApplyFilters(newArchives, lastSearchFilters.value)
}, { deep: true })
</script>

<style scoped>
.home-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.archive-list-container {
  flex: 1;
  overflow-y: auto;
  padding-top: 0;
  background: var(--bg-primary);
  margin-top: 0;
  padding-bottom: 80px;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
  transform: none;
}

.archive-list-container.no-scroll {
  overflow: hidden;
}

/* 页面头部 */
.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 0 16px;
}

.archive-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 存档网格容器 */
.archive-grid-container {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 存档网格 - 使用固定列数避免重排，提升性能 */
.archive-grid {
  display: grid;
  gap: 20px;
  padding: 0 16px;
  width: 100%;
  box-sizing: border-box;
  /* 默认6列布局，使用固定宽度避免重排 */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* 卡片宽度自适应 - 移除过渡效果提升性能 */
.archive-grid .archive-card {
  width: 100%;
  min-width: auto;
  max-width: none;
  /* 减少box-shadow复杂度以提升滚动性能 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 基于容器宽度的固定列数布局 - 避免大量重排 */
@media (max-width: 1920px) {
  .archive-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 1600px) {
  .archive-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 1400px) {
  .archive-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 1200px) {
  .archive-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 992px) {
  .archive-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .archive-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 0 12px;
  }
}

@media (max-width: 576px) {
  .archive-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 0 12px;
  }
}

/* 加载状态 - 现代化设计 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: var(--text-secondary);
}

.loading-content {
  text-align: center;
  padding: 48px;
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* 深色模式下的加载状态优化 */
@media (prefers-color-scheme: dark) {
  .loading-content {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.loading-spinner {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
  border-top-color: var(--primary-color);
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
  border-top-color: var(--primary-light);
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
  border-top-color: var(--primary-dark);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.loading-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.loading-progress {
  width: 200px;
  margin: 0 auto;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  border-radius: 2px;
  transition: width 0.3s ease;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

/* 空状态设计 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 48px 24px;
}

.empty-content {
  text-align: center;
  max-width: 400px;
  padding: 48px;
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

/* 深色模式下的空状态优化 */
@media (prefers-color-scheme: dark) {
  .empty-content {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.empty-content:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 24px;
  filter: grayscale(0.3);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.empty-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-bottom: 24px;
}

.empty-action {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(var(--primary-color-rgb), 0.3);
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--primary-color-rgb), 0.4);
}

.empty-action:active {
  transform: translateY(0);
}

/* 搜索面板样式 - 毛玻璃效果 */
.search-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 20px;
  /* 确保覆盖层完全固定，不随页面滚动 */
  transform: translate3d(0, 0, 0);
  will-change: transform;
  /* 防止触摸穿透 */
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  /* 确保在所有设备上都能正确固定 */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  /* 确保搜索面板保持在视口中央，不受页面滚动影响 */
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  /* 使用固定定位确保不随页面滚动 */
  position: fixed;
  top: 0;
  left: 0;
  /* 确保内容居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 强制硬件加速 */
  backface-visibility: hidden;
  perspective: 1000;
  transform: translateZ(0);
}

/* 动画优化 - 自然过渡 */
.archive-card-enter-active,
.archive-card-leave-active,
.archive-card-move {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.archive-card-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.archive-card-enter-active {
  transition-delay: calc(var(--index, 0) * 0.03s);
}

.archive-card-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.archive-card-leave-active {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  /* 确保删除动画期间卡片尺寸保持不变 */
  width: 320px !important;
  height: 160px !important;
  min-width: 320px !important;
  min-height: 160px !important;
  max-width: 320px !important;
  max-height: 160px !important;
  /* 防止图片在动画期间变形 */
  overflow: hidden !important;
  /* 确保内部元素不会变形 */
  box-sizing: border-box !important;
}

/* 确保删除动画期间卡片内部元素保持固定 */
.archive-card-leave-active .card-background {
  width: 100% !important;
  height: 100px !important;
  box-sizing: border-box !important;
}

.archive-card-leave-active .background-image {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  box-sizing: border-box !important;
}

.archive-card-leave-active .archive-info {
  box-sizing: border-box !important;
}

.archive-card-move {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 空状态过渡动画 */
.empty-state-enter-active,
.empty-state-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.empty-state-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.empty-state-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 空状态容器 */
.empty-state {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  /* 确保空状态在网格中的位置稳定 */
  grid-column: 1 / -1;
  /* 在网格中居中显示 */
  justify-self: center;
  /* 确保空状态在网格容器中正确对齐 */
  align-self: center;
}

/* 布局切换动画 - loading和grid之间的平滑过渡 */
.layout-switch-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transition-delay: 0.1s;
}

.layout-switch-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  top: 0;
  box-sizing: border-box;
}

.layout-switch-enter-from {
  opacity: 0;
  transform: translateY(40px);
}

.layout-switch-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}

/* 存档网格容器样式 */
.archive-grid-container {
  padding: 20px;
  max-width: none;
  margin: 0 auto;
  min-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  position: relative;
}

/* 存档网格 */
.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  justify-content: center;
  position: relative;
}

/* 加载动画 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  width: 100%;
  box-sizing: border-box;
}

/* 头部动画 - 简洁淡入 */
.header-slide-enter-active {
  transition: all 0.4s ease-out;
}

.header-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

/* 搜索面板布局优化 */
.search-overlay {
  contain: layout style paint;
  /* 限制重排影响范围 */
}

/* 通知提示样式 */
.success-toast,
.error-toast,
.refresh-toast,
.folder-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 300px;
  max-width: 400px;
}

.success-toast {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.error-toast {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.refresh-toast {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.folder-toast {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.toast-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* FloatingActionButton加载状态样式 */
.loading {
  opacity: 0.6;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

/* 性能优化 */
@media (prefers-reduced-motion: reduce) {

  .archive-card-enter-active,
  .archive-card-leave-active,
  .archive-card-move,
  .loading-fade-enter-active,
  .loading-fade-leave-active,
  .header-slide-enter-active,
  .search-panel-enter-active,
  .search-panel-leave-active {
    transition: none !important;
    animation: none !important;
  }
}

/* 响应式设计优化 - 保持固定列数 */
@media (max-width: 1200px) {
  .archive-grid {
    grid-template-columns: repeat(3, 1fr);
    /* 保持3列 */
    gap: 20px;
  }

  .archive-grid .archive-card {
    min-width: 300px;
    max-width: 350px;
  }
}

@media (max-width: 1024px) {
  .archive-grid {
    grid-template-columns: repeat(2, 1fr);
    /* 保持2列 */
    gap: 20px;
  }

  .archive-grid .archive-card {
    min-width: 280px;
    max-width: 320px;
  }
}

@media (max-width: 768px) {
  .archive-list-container {
    padding: 16px 12px;
  }

  .archive-stats {
    gap: 16px;
  }

  .stat-item {
    padding: 8px 16px;
  }

  .archive-grid {
    grid-template-columns: repeat(2, 1fr);
    /* 保持2列 */
    gap: 16px;
    padding: 0 8px;
  }

  .archive-grid .archive-card {
    min-width: 250px;
    max-width: 300px;
  }

  .search-overlay {
    padding: 20px 16px;
  }

  .search-overlay>.archive-search-filter {
    max-width: 100%;
    max-height: 85vh;
  }

  .empty-content {
    padding: 32px 24px;
  }

  .empty-icon {
    font-size: 3rem;
  }
}

@media (max-width: 600px) {
  .archive-grid {
    grid-template-columns: repeat(2, 1fr);
    /* 保持2列 */
    gap: 12px;
  }

  .archive-grid .archive-card {
    min-width: 220px;
    max-width: 260px;
  }
}

@media (max-width: 480px) {
  .archive-list-container {
    padding: 12px 8px;
  }

  .archive-grid {
    grid-template-columns: 1fr;
    /* 小屏幕保持1列 */
    gap: 12px;
    padding: 0 4px;
  }

  .archive-grid .archive-card {
    min-width: auto;
    max-width: none;
  }

  .search-overlay {
    padding: 16px 12px;
  }

  .empty-content {
    padding: 24px 16px;
    margin: 0 16px;
  }

  .success-toast,
  .error-toast,
  .refresh-toast,
  .folder-toast {
    left: 16px;
    right: 16px;
    top: 16px;
    min-width: auto;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .archive-list-container {
    background: linear-gradient(135deg,
        var(--bg-primary-dark) 0%,
        var(--bg-secondary-dark) 100%);
  }

  .loading-content,
  .empty-content,
  .stat-item {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 4px;
  transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-light);
}

/* 焦点样式优化 */
*:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  border-radius: 4px;
}
</style>