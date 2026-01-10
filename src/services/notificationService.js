import { createApp, h, ref } from 'vue'
import NotificationPopup from '@/components/NotificationPopup.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

let notificationInstance = null
let mountPoint = null
const ENABLE_NOTIFICATION = true

const initNotification = () => {
  if (notificationInstance) return notificationInstance
  mountPoint = document.createElement('div')
  mountPoint.id = 'notification-container'
  document.body.appendChild(mountPoint)
  const notificationRef = ref(null)
  const app = createApp({ setup() { return () => h(NotificationPopup, { ref: notificationRef }) } })
  app.component('font-awesome-icon', FontAwesomeIcon)
  app.mount(mountPoint)
  return new Promise((resolve) => {
    const checkRef = () => {
      if (notificationRef.value) { notificationInstance = notificationRef.value; resolve(notificationInstance) }
      else requestAnimationFrame(checkRef)
    }
    checkRef()
  })
}

const getInstance = async () => {
  if (!ENABLE_NOTIFICATION) return null
  if (!notificationInstance) await initNotification()
  return notificationInstance
}

const show = async (options) => {
  const instance = await getInstance()
  if (!instance) return null
  return instance.add(options)
}

const success = async (message, options = {}) => show({ message, type: 'success', ...options })
const error = async (message, options = {}) => show({ message, type: 'error', ...options })
const warning = async (message, options = {}) => show({ message, type: 'warning', ...options })
const info = async (message, options = {}) => show({ message, type: 'info', ...options })
const close = async (id) => { const instance = await getInstance(); if (instance) instance.close(id) }
const closeAll = async () => { const instance = await getInstance(); if (instance) instance.closeAll() }

export const notify = { show, success, error, warning, info, close, closeAll }
export default notify
export { show as showPopup, success as showSuccess, error as showError, warning as showWarning, info as showInfo }
