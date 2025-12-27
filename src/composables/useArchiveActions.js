import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import { gsap } from 'gsap'
import { useToast } from './useToast'

export function useArchiveActions(archiveData, filters) {
  const router = useRouter()
  const toast = useToast()

  const showDeleteConfirm = ref(false)
  const archiveToDelete = ref(null)
  const isDeleting = ref(false)
  const deletingCardId = ref(null)
  const isProcessingClick = new Set()

  const selectArchive = (archive) => {
    if (isProcessingClick.has(archive.id)) return
    isProcessingClick.add(archive.id)
    setTimeout(() => isProcessingClick.delete(archive.id), 300)
  }

  const handleToggleVisibility = async (updatedArchive, callbacks = {}) => {
    const { onSuccess, onError, onRefresh } = callbacks
    try {
      const originalVisibility = updatedArchive.isVisible
      const newVisibility = !originalVisibility
      if (archiveData.updateArchiveVisibility) {
        archiveData.updateArchiveVisibility(updatedArchive.id, newVisibility)
      }
      toast.showSuccess(`${updatedArchive.name} 已${newVisibility ? '显示' : '隐藏'}`)
      if (updatedArchive.path) {
        const result = await invoke('handle_file', {
          filePath: updatedArchive.path,
          action: 'toggle_visibility',
          archiveName: updatedArchive.name
        })
        let resultObj
        try {
          resultObj = typeof result === 'string' ? JSON.parse(result) : result
        } catch (e) {
          throw new Error('解析后端返回结果失败')
        }
        if (!resultObj || !resultObj.success) {
          if (archiveData.updateArchiveVisibility) {
            archiveData.updateArchiveVisibility(updatedArchive.id, originalVisibility)
          }
          throw new Error(resultObj?.error || '操作失败')
        }
        if (onRefresh) await onRefresh()
        if (onSuccess) onSuccess()
      }
    } catch (error) {
      toast.showError('切换可见性失败: ' + error.message)
      if (onError) onError(error)
    }
  }

  const handleEdit = (archive) => {
    router.push({ name: 'EditArchive', params: { archiveData: JSON.stringify(archive) } })
  }

  const deleteArchive = (archive) => {
    archiveToDelete.value = archive
    showDeleteConfirm.value = true
  }

  /**
   * 记录卡片位置
   */
  const recordPositions = (excludeId) => {
    const positions = new Map()
    document.querySelectorAll('.archive-card[data-archive-id]').forEach(card => {
      const id = card.getAttribute('data-archive-id')
      if (id && id !== excludeId) {
        const rect = card.getBoundingClientRect()
        positions.set(id, { 
          el: card,
          left: rect.left, 
          top: rect.top 
        })
      }
    })
    return positions
  }

  /**
   * 执行补位动画
   */
  const animateReposition = (oldPositions) => {
    // 获取新位置并计算差值
    oldPositions.forEach(({ el, left: oldLeft, top: oldTop }, id) => {
      // 确保元素还在 DOM 中
      if (!document.contains(el)) return
      
      const newRect = el.getBoundingClientRect()
      const deltaX = oldLeft - newRect.left
      const deltaY = oldTop - newRect.top

      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        // 立即设置到旧位置（视觉上没有跳动）
        gsap.set(el, { x: deltaX, y: deltaY })
        
        // 动画到新位置
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
          clearProps: "x,y"
        })
      }
    })
  }

  const confirmDelete = async (callbacks = {}) => {
    const { onSuccess, onError } = callbacks
    if (!archiveToDelete.value || isDeleting.value) return

    isDeleting.value = true
    deletingCardId.value = archiveToDelete.value.id

    try {
      const archiveIndex = archiveData.archives.value.findIndex(a => a.id === archiveToDelete.value.id)
      if (archiveIndex === -1) throw new Error('未找到要删除的存档数据')

      const archive = archiveData.archives.value[archiveIndex]
      showDeleteConfirm.value = false

      const cardElement = document.querySelector(`[data-archive-id="${archive.id}"]`)
      
      // 1. 记录其他卡片的当前位置
      const oldPositions = recordPositions(archive.id)

      // 2. 播放删除卡片的退出动画
      if (cardElement) {
        await new Promise(resolve => {
          gsap.to(cardElement, {
            opacity: 0, 
            scale: 0.85, 
            y: -20,
            duration: 0.25, 
            ease: "power2.in",
            onComplete: resolve
          })
        })
      }

      // 3. 调用后端删除
      if (archive.path) {
        await invoke('delete_file', { filePath: archive.path })
      }

      // 4. 从数据中移除（触发 Vue 重新渲染）
      archiveData.archives.value.splice(archiveIndex, 1)

      // 5. 等待 DOM 更新
      await nextTick()

      // 6. 立即执行补位动画（在同一帧内设置位置，避免闪烁）
      animateReposition(oldPositions)

      toast.showSuccess(`${archive.name} 已删除`)
      archiveToDelete.value = null
      isDeleting.value = false
      deletingCardId.value = null
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.showError('删除失败: ' + (error.message || error))
      closeDeleteModal()
      if (onError) onError(error)
    }
  }

  const cancelDelete = () => closeDeleteModal()

  const closeDeleteModal = () => {
    showDeleteConfirm.value = false
    archiveToDelete.value = null
    isDeleting.value = false
    deletingCardId.value = null
  }

  const createNewArchive = () => router.push({ name: 'CreateArchive' })

  const openSaveGamesFolder = async (callbacks = {}) => {
    try {
      await invoke('open_save_games_folder')
      toast.showFolder('已打开存档文件夹')
      if (callbacks.onSuccess) callbacks.onSuccess()
    } catch (error) {
      console.error('打开文件夹失败:', error)
    }
  }

  return {
    showDeleteConfirm, archiveToDelete, isDeleting, deletingCardId,
    selectArchive, handleToggleVisibility, handleEdit, deleteArchive,
    confirmDelete, cancelDelete, closeDeleteModal, createNewArchive, openSaveGamesFolder
  }
}
