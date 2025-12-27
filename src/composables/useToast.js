import { gsap } from 'gsap'

/**
 * Toast 通知 composable
 */
export function useToast() {
  /**
   * 显示成功提示
   */
  const showSuccess = (message, icon = '✓') => {
    const toast = document.createElement('div')
    toast.className = 'success-toast'
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-text">${message}</span>
      </div>
    `
    document.body.appendChild(toast)

    gsap.fromTo(toast,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
    )

    setTimeout(() => {
      gsap.to(toast, {
        opacity: 0, scale: 0.8, duration: 0.3, onComplete: () => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }
      })
    }, 2000)
  }

  /**
   * 显示错误提示
   */
  const showError = (message, icon = '✗') => {
    const toast = document.createElement('div')
    toast.className = 'error-toast'
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-text">${message}</span>
      </div>
    `
    document.body.appendChild(toast)

    gsap.fromTo(toast,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    )

    setTimeout(() => {
      gsap.to(toast, {
        opacity: 0, y: -50, duration: 0.3, onComplete: () => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }
      })
    }, 3000)
  }

  /**
   * 显示文件夹提示
   */
  const showFolder = (message, icon = '📁') => {
    const toast = document.createElement('div')
    toast.className = 'folder-toast'
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-text">${message}</span>
      </div>
    `
    document.body.appendChild(toast)

    gsap.fromTo(toast,
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
    )

    setTimeout(() => {
      gsap.to(toast, {
        opacity: 0, x: 50, duration: 0.3, onComplete: () => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }
      })
    }, 2000)
  }

  /**
   * 显示信息提示
   */
  const showInfo = (message, icon = 'ℹ️') => {
    const toast = document.createElement('div')
    toast.className = 'info-toast'
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-text">${message}</span>
      </div>
    `
    document.body.appendChild(toast)

    gsap.fromTo(toast,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    )

    setTimeout(() => {
      gsap.to(toast, {
        opacity: 0, y: -50, duration: 0.3, onComplete: () => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }
      })
    }, 2500)
  }

  return {
    showSuccess,
    showError,
    showFolder,
    showInfo
  }
}
