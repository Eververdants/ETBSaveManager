<template>
  <teleport to="body">
    <div v-for="position in positions" :key="position" class="notification-container"
      :class="`notification-container-${position}`">
      <TransitionGroup tag="div" class="notification-list" :name="`notification-${position}`"
        @before-enter="(el) => onBeforeEnter(el, position)" @enter="(el, done) => onEnter(el, done, position)"
        @before-leave="(el) => onBeforeLeave(el, position)" @leave="(el, done) => onLeave(el, done, position)">
        <div v-for="notification in getNotificationsByPosition(position)" :key="notification.id"
          class="notification-item" :class="[
            `notification-${notification.type}`,
            { 'notification-hovering': notification.isHovering },
            { 'notification-expanded': notification.actions?.length || notification.details }
          ]" @mouseenter="pauseNotification(notification)" @mouseleave="resumeNotification(notification)">
          <!-- 图标 -->
          <div class="notification-icon-wrapper" :class="`icon-${notification.type}`">
            <font-awesome-icon v-if="notification.icon" :icon="notification.icon" class="notification-icon" />
          </div>

          <!-- 内容区 -->
          <div class="notification-content">
            <div v-if="notification.title" class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>

            <!-- 详情区域 -->
            <div v-if="notification.details" class="notification-details">
              <div v-if="notification.details.version" class="detail-item">
                <span class="detail-label">版本:</span>
                <span class="detail-value">{{ notification.details.version }}</span>
              </div>
              <div v-if="notification.details.description" class="detail-item detail-desc">
                {{ notification.details.description }}
              </div>
            </div>

            <!-- 按钮区域 -->
            <div v-if="notification.actions?.length" class="notification-actions">
              <button v-for="(action, idx) in notification.actions" :key="idx" class="notification-btn"
                :class="[action.type || 'default', action.class]" @click="handleAction(notification, action)">
                <font-awesome-icon v-if="action.icon" :icon="action.icon" class="btn-icon" />
                {{ action.text }}
              </button>
            </div>
          </div>

          <!-- 关闭按钮 -->
          <button class="notification-close" @click="closeNotification(notification.id)">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>

          <!-- 进度条 -->
          <div v-if="notification.duration > 0 && !notification.actions?.length" class="notification-progress">
            <div class="notification-progress-bar" :class="`progress-${notification.type}`"
              :style="{ width: `${notification.progress}%` }" />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </teleport>
</template>

<script setup>
import { ref, reactive, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'

const MAX_NOTIFICATIONS = 5
const positions = ['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left']
const notifications = ref([])
let notificationId = 0
const timers = new Map()

const defaultOptions = {
  type: 'info',
  duration: 4000,
  position: 'top-right',
  icon: null,
  title: '',
  closable: true,
  actions: null,  // 按钮数组 [{ text, type, icon, onClick, closeOnClick }]
  details: null   // 详情对象 { version, description, ... }
}

const typeIcons = {
  success: ['fas', 'check-circle'],
  error: ['fas', 'times-circle'],
  warning: ['fas', 'exclamation-triangle'],
  info: ['fas', 'info-circle'],
  default: ['fas', 'bell']
}

const getNotificationsByPosition = (position) => notifications.value.filter(n => n.position === position)

const getAnimationDirection = (position) => {
  if (position.includes('right')) return { x: 120, y: 0 }
  if (position.includes('left')) return { x: -120, y: 0 }
  if (position === 'top') return { x: 0, y: -80 }
  if (position === 'bottom') return { x: 0, y: 80 }
  return { x: 120, y: 0 }
}

const onBeforeEnter = (el, position) => {
  const dir = getAnimationDirection(position)
  gsap.set(el, { opacity: 0, x: dir.x, y: dir.y, scale: 0.8, filter: 'blur(8px)' })
}

const onEnter = (el, done, position) => {
  gsap.to(el, { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out', onComplete: done })
}

const onBeforeLeave = (el, position) => {
  const rect = el.getBoundingClientRect()
  const parent = el.parentElement
  const parentRect = parent.getBoundingClientRect()
  
  // 创建占位元素，保持原有空间
  const placeholder = document.createElement('div')
  placeholder.className = 'notification-placeholder'
  placeholder.style.height = `${rect.height}px`
  placeholder.style.width = `${rect.width}px`
  placeholder.style.flexShrink = '0'
  el._placeholder = placeholder
  
  // 在当前元素位置插入占位符
  parent.insertBefore(placeholder, el)
  
  // 将退场元素设为绝对定位
  el.style.position = 'absolute'
  el.style.top = `${rect.top - parentRect.top}px`
  el.style.left = `${rect.left - parentRect.left}px`
  el.style.width = `${rect.width}px`
  el.style.margin = '0'
  el.style.zIndex = '1'
}

const onLeave = (el, done, position) => {
  const dir = getAnimationDirection(position)
  const placeholder = el._placeholder
  
  // 同时动画：退场元素淡出 + 占位符收缩
  if (placeholder) {
    gsap.to(placeholder, {
      height: 0,
      marginBottom: 0,
      duration: 0.3,
      ease: 'power2.inOut',
      onComplete: () => placeholder.remove()
    })
  }
  
  gsap.to(el, {
    opacity: 0,
    x: dir.x * 0.5,
    y: dir.y * 0.3,
    scale: 0.85,
    filter: 'blur(4px)',
    duration: 0.3,
    ease: 'power2.in',
    onComplete: done
  })
}

const addNotification = (options) => {
  const id = ++notificationId
  const config = { ...defaultOptions, ...options }
  if (!config.icon) config.icon = typeIcons[config.type] || typeIcons.default

  // 有按钮时默认不自动关闭
  if (config.actions?.length && config.duration === defaultOptions.duration) {
    config.duration = 0
  }

  const positionNotifications = getNotificationsByPosition(config.position)
  if (positionNotifications.length >= MAX_NOTIFICATIONS) {
    closeNotification(positionNotifications[0].id)
  }

  const notification = reactive({
    id, ...config, progress: 100, isHovering: false, remainingTime: config.duration, createdAt: Date.now()
  })
  notifications.value.push(notification)
  if (config.duration > 0) nextTick(() => startTimer(id))
  return id
}

const getNotification = (id) => notifications.value.find(n => n.id === id)

const startTimer = (id) => {
  const notification = getNotification(id)
  if (!notification) return
  const startTime = Date.now()
  const duration = notification.remainingTime
  const totalDuration = notification.duration

  const tick = () => {
    const n = getNotification(id)
    if (!n || n.isHovering) { timers.delete(id); return }
    const elapsed = Date.now() - startTime
    const remaining = duration - elapsed
    n.progress = Math.max(0, (remaining / totalDuration) * 100)
    if (remaining <= 0) closeNotification(id)
    else timers.set(id, requestAnimationFrame(tick))
  }
  timers.set(id, requestAnimationFrame(tick))
}

const pauseNotification = (notification) => {
  notification.isHovering = true
  if (timers.has(notification.id)) {
    cancelAnimationFrame(timers.get(notification.id))
    timers.delete(notification.id)
    notification.remainingTime = (notification.progress / 100) * notification.duration
  }
}

const resumeNotification = (notification) => {
  notification.isHovering = false
  if (notification.duration > 0 && notification.remainingTime > 0) startTimer(notification.id)
}

const handleAction = (notification, action) => {
  if (action.onClick) action.onClick(notification.id)
  if (action.closeOnClick !== false) closeNotification(notification.id)
}

const closeNotification = (id) => {
  if (timers.has(id)) { cancelAnimationFrame(timers.get(id)); timers.delete(id) }
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) notifications.value.splice(index, 1)
}

const closeAll = () => {
  timers.forEach(t => cancelAnimationFrame(t))
  timers.clear()
  notifications.value = []
}

onUnmounted(() => { timers.forEach(t => cancelAnimationFrame(t)); timers.clear() })

defineExpose({
  add: addNotification, close: closeNotification, closeAll,
  success: (message, options = {}) => addNotification({ message, type: 'success', ...options }),
  error: (message, options = {}) => addNotification({ message, type: 'error', ...options }),
  warning: (message, options = {}) => addNotification({ message, type: 'warning', ...options }),
  info: (message, options = {}) => addNotification({ message, type: 'info', ...options })
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 10001;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.notification-container-top {
  top: 58px;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.notification-container-top-right {
  top: 58px;
  right: 20px;
  align-items: flex-end;
}

.notification-container-right {
  top: calc(50% + 19px);
  right: 20px;
  transform: translateY(-50%);
  align-items: flex-end;
}

.notification-container-bottom-right {
  bottom: 20px;
  right: 20px;
  align-items: flex-end;
  flex-direction: column-reverse;
}

.notification-container-bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
  flex-direction: column-reverse;
}

.notification-container-bottom-left {
  bottom: 20px;
  left: 20px;
  align-items: flex-start;
  flex-direction: column-reverse;
}

.notification-container-left {
  top: calc(50% + 19px);
  left: 20px;
  transform: translateY(-50%);
  align-items: flex-start;
}

.notification-container-top-left {
  top: 58px;
  left: 20px;
  align-items: flex-start;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.notification-placeholder {
  pointer-events: none;
}

.notification-top-move,
.notification-top-right-move,
.notification-top-left-move,
.notification-right-move,
.notification-left-move,
.notification-bottom-move,
.notification-bottom-right-move,
.notification-bottom-left-move {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  padding-right: 40px;
  min-width: 300px;
  max-width: 400px;
  background: var(--card-bg, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(20px);
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: auto;
  overflow: hidden;
  will-change: transform, opacity, filter;
}

.notification-item:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
}

.notification-expanded {
  padding-bottom: 14px;
}

.notification-icon-wrapper {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.notification-icon {
  font-size: 16px;
  color: white;
}

.icon-success {
  background: linear-gradient(135deg, #34c759, #30d158);
  box-shadow: 0 3px 10px rgba(52, 199, 89, 0.35);
}

.icon-error {
  background: linear-gradient(135deg, #ff3b30, #ff453a);
  box-shadow: 0 3px 10px rgba(255, 59, 48, 0.35);
}

.icon-warning {
  background: linear-gradient(135deg, #ff9500, #ffcc00);
  box-shadow: 0 3px 10px rgba(255, 149, 0, 0.35);
}

.icon-info {
  background: linear-gradient(135deg, #007aff, #5ac8fa);
  box-shadow: 0 3px 10px rgba(0, 122, 255, 0.35);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin-bottom: 2px;
  line-height: 1.3;
}

.notification-message {
  font-size: 13px;
  color: var(--text-secondary, #8e8e93);
  line-height: 1.4;
  word-wrap: break-word;
}

/* 详情区域 */
.notification-details {
  margin-top: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  font-size: 12px;
}

.detail-item {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: var(--text-tertiary, #8e8e93);
}

.detail-value {
  color: var(--text-primary, #1c1c1e);
  font-weight: 500;
}

.detail-desc {
  color: var(--text-secondary, #636366);
  line-height: 1.4;
  display: block;
}

/* 按钮区域 */
.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.notification-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.notification-btn .btn-icon {
  font-size: 12px;
}

.notification-btn.primary {
  background: linear-gradient(135deg, #007aff, #5ac8fa);
  color: white;
}

.notification-btn.primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.notification-btn.secondary,
.notification-btn.default {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary, #1c1c1e);
}

.notification-btn.secondary:hover,
.notification-btn.default:hover {
  background: rgba(0, 0, 0, 0.1);
}

.notification-btn.success {
  background: linear-gradient(135deg, #34c759, #30d158);
  color: white;
}

.notification-btn.danger {
  background: linear-gradient(135deg, #ff3b30, #ff453a);
  color: white;
}

.notification-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 6px;
  color: var(--text-tertiary, #c7c7cc);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-primary, #1c1c1e);
  transform: rotate(90deg);
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border-radius: 0 0 14px 14px;
}

.notification-progress-bar {
  height: 100%;
  border-radius: 0 0 14px 14px;
}

.progress-success {
  background: linear-gradient(90deg, #34c759, #30d158);
}

.progress-error {
  background: linear-gradient(90deg, #ff3b30, #ff453a);
}

.progress-warning {
  background: linear-gradient(90deg, #ff9500, #ffcc00);
}

.progress-info {
  background: linear-gradient(90deg, #007aff, #5ac8fa);
}

.notification-success {
  border-left: 3px solid #34c759;
}

.notification-error {
  border-left: 3px solid #ff3b30;
}

.notification-warning {
  border-left: 3px solid #ff9500;
}

.notification-info {
  border-left: 3px solid #007aff;
}

@media (prefers-color-scheme: dark) {
  .notification-item {
    background: var(--card-bg, rgba(44, 44, 46, 0.95));
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  }

  .notification-close {
    background: rgba(255, 255, 255, 0.08);
  }

  .notification-close:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .notification-progress {
    background: rgba(255, 255, 255, 0.06);
  }

  .notification-details {
    background: rgba(255, 255, 255, 0.05);
  }

  .notification-btn.secondary,
  .notification-btn.default {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary, #f5f5f7);
  }

  .notification-btn.secondary:hover,
  .notification-btn.default:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

@media (max-width: 480px) {
  .notification-container {
    max-width: calc(100vw - 32px);
  }

  .notification-container-top,
  .notification-container-bottom {
    left: 16px;
    right: 16px;
    transform: none;
  }

  .notification-item {
    min-width: auto;
    width: 100%;
    padding: 12px 14px;
    padding-right: 36px;
  }

  .notification-icon-wrapper {
    width: 32px;
    height: 32px;
  }

  .notification-icon {
    font-size: 14px;
  }

  .notification-actions {
    flex-direction: column;
  }

  .notification-btn {
    justify-content: center;
  }
}
</style>
