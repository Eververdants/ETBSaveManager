<template>
  <div class="i18n-debugger" v-if="showDebugger">
    <div class="debug-header">
      <h3>{{ t('i18nDebugger.title') }}</h3>
      <button @click="closeDebugger" class="close-btn">×</button>
    </div>

    <div class="debug-content">
      <!-- 基本信息 -->
      <div class="debug-section">
        <h4>{{ t('i18nDebugger.currentLanguage') }}</h4>
        <div class="info-grid">
          <div class="info-item">
            <label>{{ t('i18nDebugger.currentLanguage') }}:</label>
            <span>{{ currentLanguage }}</span>
          </div>
          <div class="info-item">
            <label>{{ t('i18nDebugger.availableLanguages') }}:</label>
            <span>{{ availableLocales.join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- 执行命令 -->
      <div class="debug-section">
        <h4>执行命令</h4>
        <div class="command-input">
          <input v-model="commandInput" @keyup.enter="executeCommand" placeholder="输入命令，如: i18n.global.messages"
            class="command-field" />
          <button @click="executeCommand" class="execute-btn">执行</button>
        </div>
        <div class="command-result">
          <pre>{{ commandResult }}</pre>
        </div>
      </div>

      <!-- 消息内容 -->
      <div class="debug-section">
        <h4>{{ t('i18nDebugger.translationKeys') }}</h4>
        <div class="message-tabs">
          <button v-for="locale in availableLocales" :key="locale" @click="selectedLocale = locale"
            :class="['tab-btn', { active: selectedLocale === locale }]">
            {{ locale }}
          </button>
        </div>
        <div class="message-content">
          <pre>{{ formatMessages(selectedLocale) }}</pre>
        </div>
      </div>

      <!-- 快速测试 -->
      <div class="debug-section">
        <h4>{{ t('i18nDebugger.description') }}</h4>
        <div class="test-input">
          <input v-model="testKey" @keyup.enter="testTranslation" :placeholder="t('i18nDebugger.searchPlaceholder')" class="test-field" />
          <button @click="testTranslation" class="test-btn">{{ t('common.confirm') }}</button>
        </div>
        <div class="test-result">
          <div><strong>{{ t('i18nDebugger.value') }}:</strong> {{ testResult }}</div>
          <div><strong>{{ t('i18nDebugger.key') }}:</strong> {{ testKey }}</div>
        </div>
      </div>
    </div>

    <!-- 浮动按钮 -->
    <button v-if="!showDebugger" @click="openDebugger" class="floating-debug-btn">
      🌍
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, te, i18n } = useI18n({ useScope: 'global' })

// 状态
const showDebugger = ref(false)
const commandInput = ref('i18n.global.messages')
const commandResult = ref('')
const selectedLocale = ref('zh-CN')
const testKey = ref('app.name')
const testResult = ref('')

// 计算属性
const currentLanguage = computed(() => i18n.global.locale.value)
const fallbackLanguage = computed(() => i18n.global.fallbackLocale.value)
const availableLocales = computed(() => Object.keys(i18n.global.messages))

// 方法
const openDebugger = () => {
  showDebugger.value = true
}

const closeDebugger = () => {
  showDebugger.value = false
}

const executeCommand = () => {
  try {
    const cmd = commandInput.value
    let result

    // 安全地执行命令
    if (cmd === 'i18n.global.messages') {
      result = i18n.global.messages
    } else if (cmd === 'i18n.global.locale') {
      result = i18n.global.locale
    } else if (cmd === 'i18n.global.fallbackLocale') {
      result = i18n.global.fallbackLocale
    } else if (cmd === 'i18n.global.availableLocales') {
      result = availableLocales.value
    } else if (cmd === 'i18n.global.tm') {
      result = i18n.global.tm()
    } else if (cmd === 'i18n.global.rt') {
      result = i18n.global.rt
    } else if (cmd.startsWith('i18n.global.t(')) {
      // 提取键名
      const match = cmd.match(/i18n\.global\.t\(['"]([^'"]*)['"]\)/)
      if (match) {
        result = t(match[1])
      } else {
        result = '无效的翻译键格式'
      }
    } else {
      result = eval(cmd) // 注意：仅用于调试
    }

    commandResult.value = JSON.stringify(result, null, 2)
  } catch (error) {
    commandResult.value = `错误: ${error.message}`
  }
}

const formatMessages = (locale) => {
  try {
    return JSON.stringify(i18n.global.messages[locale], null, 2)
  } catch (error) {
    return `获取消息失败: ${error.message}`
  }
}

const testTranslation = () => {
  try {
    if (te(testKey.value)) {
      testResult.value = t(testKey.value)
    } else {
      testResult.value = `[缺失]: ${testKey.value}`
    }
  } catch (error) {
    testResult.value = `错误: ${error.message}`
  }
}

// 键盘快捷键
const handleKeyPress = (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'I') {
    event.preventDefault()
    showDebugger.value = !showDebugger.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  // 设置默认选中当前语言
  selectedLocale.value = currentLanguage.value
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})

// 暴露方法给全局使用
window.openI18nDebugger = openDebugger
</script>

<style scoped>
.i18n-debugger {
  position: fixed;
  top: 50px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  overflow: hidden;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.debug-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
}

.close-btn:hover {
  color: var(--text-primary);
}

.debug-content {
  max-height: 550px;
  overflow-y: auto;
  padding: 12px;
}

.debug-section {
  margin-bottom: 16px;
}

.debug-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 8px;
}

.info-item {
  display: contents;
}

.info-item label {
  font-weight: bold;
  color: var(--text-secondary);
}

.info-item span {
  color: var(--text-primary);
  word-break: break-all;
}

.command-input,
.test-input {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.command-field,
.test-field {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 11px;
}

.execute-btn,
.test-btn {
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 11px;
}

.execute-btn:hover,
.test-btn:hover {
  background: var(--bg-tertiary);
}

.command-result,
.message-content,
.test-result {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 10px;
  line-height: 1.4;
}

.message-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.tab-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 10px;
}

.tab-btn.active {
  background: var(--primary);
  color: white;
}

.floating-debug-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  z-index: 9998;
}

.floating-debug-btn:hover {
  transform: scale(1.1);
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>