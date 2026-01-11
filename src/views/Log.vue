<template>
  <div class="log-view">
    <div class="header">
      <h1>{{ t("logs.title") }}</h1>
      <div class="header-actions">
        <button @click="clearLogs" class="btn btn-secondary">
          <font-awesome-icon :icon="['fas', 'trash']" />
          {{ t("logs.clear") }}
        </button>
        <button @click="exportLogs" class="btn btn-primary">
          <font-awesome-icon :icon="['fas', 'download']" />
          {{ t("logs.export") }}
        </button>
      </div>
    </div>

    <div class="log-controls">
      <div class="filter-group">
        <label>{{ t("logs.filter") }}:</label>
        <select v-model="filterLevel" @change="applyFilter">
          <option value="">{{ t("logs.allLevels") }}</option>
          <option value="error">{{ t("logs.error") }}</option>
          <option value="warn">{{ t("logs.warn") }}</option>
          <option value="info">{{ t("logs.info") }}</option>
          <option value="debug">{{ t("logs.debug") }}</option>
        </select>
      </div>

      <div class="search-group">
        <input v-model="searchText" :placeholder="t('logs.search')" @input="applyFilter" class="search-input" />
      </div>
    </div>

    <!-- 控制台命令区域 -->
    <div class="console-section">
      <div class="console-input-line">
        <span class="console-prompt">$ </span>
        <input ref="consoleInput" v-model="consoleCommand" type="text" placeholder="输入 help 查看可用命令"
          class="console-input" @keyup.enter="executeConsoleCommand" @keyup.up="navigateHistory(-1)"
          @keyup.down="navigateHistory(1)" />
      </div>
    </div>

    <div class="log-container" ref="logContainer">
      <div v-for="(log, index) in filteredLogs" :key="index" :class="['log-entry', log.type]">
        <div class="log-time">{{ formatTime(log.date) }}</div>
        <div class="log-level" :class="log.type">
          [{{ log.type.toUpperCase() }}]
        </div>
        <div class="log-message">
          <div v-if="Array.isArray(log.message)" class="log-multiline">
            <div v-for="(line, lineIndex) in log.message" :key="lineIndex" :class="{
              'log-command': lineIndex === 0,
              'log-result': lineIndex === 1 && log.message.length > 1,
            }">
              {{ line }}
            </div>
          </div>
          <div v-else>{{ log.message }}</div>
        </div>
      </div>

      <div v-if="filteredLogs.length === 0" class="no-logs">
        {{ t("logs.noLogs") }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { logService } from "../services/logService.js";

const { t } = useI18n({ useScope: "global" });

const logs = ref([]);
const filterLevel = ref("");
const searchText = ref("");
const logContainer = ref(null);
const consoleInput = ref(null);
const consoleCommand = ref("");
const commandHistory = ref([]);
const historyIndex = ref(-1);

// 安全参数解析函数
const parseSafeArguments = (argsStr) => {
  const args = [];
  let current = "";
  let inString = false;
  let stringChar = "";
  let escapeNext = false;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if (escapeNext) {
      if (char === "n") {
        current += "\n";
      } else if (char === "t") {
        current += "\t";
      } else if (char === "r") {
        current += "\r";
      } else if (char === "\\") {
        current += "\\";
      } else if (char === '"') {
        current += '"';
      } else if (char === "'") {
        current += "'";
      } else {
        current += char;
      }
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if ((char === '"' || char === "'" || char === "`") && !inString) {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === stringChar && inString) {
      inString = false;
      stringChar = "";
      continue;
    }

    if (char === "," && !inString) {
      if (current.trim()) {
        args.push(parseValue(current.trim()));
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(parseValue(current.trim()));
  }

  return args;
};

// 安全表达式处理函数
const processSafeExpression = (expression) => {
  try {
    // 允许的字符：数字、运算符、括号、引号、空白字符、字母（用于翻译函数t()）
    const allowedPattern =
      /^[\d\s\+\-\*\/\(\)\.\,\?\:\!\=\'\"\`\[\]\{\}a-zA-Z_]+$/;
    if (!allowedPattern.test(expression)) {
      throw new Error("表达式包含不允许的字符");
    }

    // 移除危险关键词
    const dangerousKeywords = [
      "eval",
      "Function",
      "constructor",
      "prototype",
      "import",
      "require",
      "window",
      "document",
      "fetch",
      "XMLHttpRequest",
    ];
    const lowerExpression = expression.toLowerCase();
    for (const keyword of dangerousKeywords) {
      if (lowerExpression.includes(keyword)) {
        throw new Error(`不允许使用关键词: ${keyword}`);
      }
    }

    // 只允许简单的数学计算和基本操作
    if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(expression)) {
      // 纯数学表达式
      return Function(`"use strict"; return (${expression})`)();
    }

    // 翻译函数调用
    if (expression.includes("t(")) {
      const match = expression.match(/t\(['"`]([^'"`]+)['"`]\)/);
      if (match) {
        const key = match[1];
        return t(key);
      }
    }

    // 字符串字面量
    if (
      (expression.startsWith('"') && expression.endsWith('"')) ||
      (expression.startsWith("'") && expression.endsWith("'")) ||
      (expression.startsWith("`") && expression.endsWith("`"))
    ) {
      return parseValue(expression);
    }

    // 简单变量或常量
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression)) {
      return expression;
    }

    // JSON对象或数组
    if (
      (expression.startsWith("{") && expression.endsWith("}")) ||
      (expression.startsWith("[") && expression.endsWith("]"))
    ) {
      return JSON.parse(expression);
    }

    // 数字
    if (!isNaN(expression)) {
      return Number(expression);
    }

    throw new Error("不支持的表达式类型");
  } catch (error) {
    throw new Error(`表达式处理错误: ${error.message}`);
  }
};

// 解析单个值
const parseValue = (value) => {
  // 移除字符串两端的引号
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith("`") && value.endsWith("`"))
  ) {
    return value.slice(1, -1);
  }

  // 数字
  if (!isNaN(value)) {
    return Number(value);
  }

  // 布尔值
  if (value === "true") return true;
  if (value === "false") return false;

  // undefined
  if (value === "undefined") return undefined;

  // null
  if (value === "null") return null;

  // 尝试解析JSON
  if (value.startsWith("{") && value.endsWith("}")) {
    try {
      return JSON.parse(value);
    } catch {
      // 忽略解析错误
    }
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      return JSON.parse(value);
    } catch {
      // 忽略解析错误
    }
  }

  // 默认为字符串
  return value;
};

// 获取过滤后的日志
const filteredLogs = computed(() => {
  let result = logs.value;

  if (filterLevel.value) {
    result = result.filter((log) => log.type === filterLevel.value);
  }

  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase();
    result = result.filter((log) =>
      log.message.toLowerCase().includes(searchLower)
    );
  }

  return result;
});

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

// 应用过滤器
const applyFilter = () => {
  nextTick(() => {
    scrollToBottom();
  });
};

// 清空日志
const clearLogs = () => {
  logService.clearLogs();
  logs.value = [];
};

// 导出日志
const exportLogs = () => {
  logService.exportLogs();
};

// 滚动到底部
const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
};

// 控制台命令执行
const executeConsoleCommand = () => {
  try {
    const cmd = consoleCommand.value.trim();
    if (!cmd) return;

    // 添加到历史记录
    commandHistory.value.unshift(cmd);
    if (commandHistory.value.length > 50) {
      commandHistory.value = commandHistory.value.slice(0, 50);
    }
    historyIndex.value = -1;

    let result;

    // 控制台命令解析
    switch (cmd.toLowerCase()) {
      case "help":
        result = `可用命令:
  help        - 显示此帮助信息
  locale      - 显示当前语言
  messages    - 显示所有翻译消息
  t(key)      - 测试翻译键值，如: t('app.name')
  app.name    - 显示应用名称
  clear       - 清空控制台
  ls          - 列出可用语言
  
JavaScript 支持:
  console.log("文本") - 输出日志
  1 + 1 - 数学计算
  "hello" - 字符串
  [1,2,3] - 数组
  {a:1} - 对象`;
        break;
      case "locale":
        result = `当前语言: ${i18n.locale || "未知"}`;
        break;
      case "messages":
        result = JSON.stringify(i18n.messages || {}, null, 2);
        break;
      case "clear":
        logService.clearLogs();
        consoleCommand.value = "";
        return;
      case "ls":
        result = `可用语言: ${Object.keys(i18n.messages || {}).join(", ")}`;
        break;
      default:
        // 处理翻译测试
        if (cmd.startsWith("t(")) {
          const match = cmd.match(/t\(['"]([^'"]+)['"]\)/);
          if (match) {
            const key = match[1];
            result = t(key);
          } else {
            result = '用法: t("key")';
          }
        } else if (cmd.includes("console.log")) {
          // 安全处理 console.log
          try {
            const match = cmd.match(/console\.log\((.*)\)$/);
            if (match) {
              const argsStr = match[1].trim();
              // 使用安全的参数解析
              const args = parseSafeArguments(argsStr);
              result = args
                .map((arg) =>
                  typeof arg === "object"
                    ? JSON.stringify(arg, null, 2)
                    : String(arg)
                )
                .join(" ");
            } else {
              result =
                'console.log 用法: console.log("文本") 或 console.log(变量)';
            }
          } catch (e) {
            result = `错误: ${e.message}`;
          }
        } else if (
          cmd.includes(".") &&
          !cmd.includes("(") &&
          !cmd.includes(" ")
        ) {
          // 直接翻译键值
          result = t(cmd);
        } else {
          // 执行 JavaScript 表达式
          try {
            // 直接处理翻译键值
            if (cmd.startsWith("t(") && cmd.endsWith(")")) {
              // 处理 t('key') 格式
              const match = cmd.match(/t\(['"`](.*?)['"`]\)/);
              if (match) {
                const key = match[1];
                result = this.$t(key);
              } else {
                result = this.$t("app.name"); // 默认测试
              }
            } else {
              // 处理其他类型的表达式
              result = processSafeExpression(cmd);
            }
          } catch (e) {
            result = `错误: ${e.message}`;
          }
        }
    }

    // 将命令和结果添加到日志
    logService.addLog("info", [`$ ${cmd}`, `→ ${result}`]);
  } catch (error) {
    logService.addLog("error", [
      `$ ${consoleCommand.value}`,
      `✗ 错误: ${error.message}`,
    ]);
  }

  consoleCommand.value = "";
};

// 命令历史导航
const navigateHistory = (direction) => {
  if (commandHistory.value.length === 0) return;

  if (direction === -1) {
    // 上箭头
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++;
      consoleCommand.value = commandHistory.value[historyIndex.value];
    }
  } else {
    // 下箭头
    if (historyIndex.value > 0) {
      historyIndex.value--;
      consoleCommand.value = commandHistory.value[historyIndex.value];
    } else {
      historyIndex.value = -1;
      consoleCommand.value = "";
    }
  }
};

// 更新日志
const updateLogs = () => {
  const newLogs = logService.getLogs();
  const newLogCount = newLogs.length;

  logs.value = newLogs;

  // 只在有新日志且用户未手动滚动时滚动到底部
  if (newLogCount > lastLogCount && !isUserScrolling) {
    nextTick(() => {
      scrollToBottom();
    });
  }
  lastLogCount = newLogCount;
};

// 自动滚动开关
let autoScrollInterval;
let lastLogCount = 0;
let isUserScrolling = false;

// 检测用户是否在手动滚动
const checkUserScrolling = () => {
  if (!logContainer.value) return;

  const container = logContainer.value;
  const isAtBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight < 10;

  if (!isAtBottom) {
    isUserScrolling = true;
  } else {
    isUserScrolling = false;
  }
};

onMounted(() => {
  updateLogs();
  lastLogCount = logs.value.length;

  // 监听日志更新
  window.addEventListener("logs-updated", updateLogs);

  // 监听用户滚动事件
  if (logContainer.value) {
    logContainer.value.addEventListener("scroll", checkUserScrolling);
  }

  // 智能滚动：只有在新日志产生且用户没有手动滚动时才滚动到底部
  autoScrollInterval = setInterval(() => {
    const newLogs = logService.getLogs();
    const newLogCount = newLogs.length;

    // 检查是否有新日志
    if (newLogCount > lastLogCount && !isUserScrolling) {
      logs.value = newLogs;
      lastLogCount = newLogCount;
      nextTick(() => {
        scrollToBottom();
      });
    } else if (newLogCount !== logs.value.length) {
      // 更新日志但不自动滚动
      logs.value = newLogs;
      lastLogCount = newLogCount;
    }
  }, 1000);
});

onUnmounted(() => {
  try {
    window.removeEventListener("logs-updated", updateLogs);
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
    if (logContainer.value) {
      logContainer.value.removeEventListener("scroll", checkUserScrolling);
    }
  } catch (error) {
    console.error("清理日志监听器时出错:", error);
  }
});
</script>

<style scoped>
.log-view {
  height: 100vh;
  max-height: 100vh;
  padding: 0;
  margin: 0;
  background: var(--log-bg);
  color: var(--log-text);
  font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
    "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--log-bg-secondary);
  border-bottom: 1px solid var(--log-border);
  flex-shrink: 0;
  height: 40px;
}

.header h1 {
  font-size: 14px;
  font-weight: bold;
  color: var(--log-text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  padding: 4px 12px;
  border: none;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
  background: var(--log-btn-primary);
  color: white;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn:hover {
  background: var(--log-btn-primary-hover);
}

.btn-secondary {
  background: var(--log-btn-secondary);
}

.btn-secondary:hover {
  background: var(--log-btn-secondary-hover);
}

.log-controls {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: var(--log-bg-secondary);
  border-bottom: 1px solid var(--log-border);
  flex-shrink: 0;
  height: 36px;
  align-items: center;
}

.filter-group,
.search-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 12px;
  color: var(--log-text-secondary);
}

select,
.search-input {
  padding: 4px 8px;
  border: 1px solid var(--log-border);
  border-radius: 2px;
  background: var(--log-bg-tertiary);
  color: var(--log-text-secondary);
  font-size: 12px;
  font-family: inherit;
}

.search-input {
  min-width: 150px;
}

.log-container {
  height: calc(100vh - 108px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 16px;
  background: var(--log-bg);
  font-size: 13px;
  line-height: 1.4;
  max-width: 100%;
  box-sizing: border-box;
}

.log-entry {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  max-width: 100%;
  word-wrap: break-word;
  box-sizing: border-box;
}

.log-time {
  color: var(--log-text-muted);
  min-width: 100px;
  flex-shrink: 0;
}

.log-level {
  min-width: 50px;
  flex-shrink: 0;
  font-weight: bold;
}

.log-level.error {
  color: var(--log-level-error);
}

.log-level.warn {
  color: var(--log-level-warn);
}

.log-level.info {
  color: var(--log-level-info);
}

.log-level.debug {
  color: var(--log-text-muted);
}

.log-message {
  flex: 1;
  color: var(--log-text);
  word-break: break-word;
  white-space: pre-wrap;
  min-width: 0;
  max-width: calc(100% - 160px);
}

.log-multiline {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 100%;
  overflow-x: auto;
}

.log-command {
  color: var(--log-command);
  font-weight: bold;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-result {
  color: var(--log-text);
  margin-left: 16px;
  border-left: 1px solid var(--log-border);
  padding-left: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-logs {
  text-align: center;
  color: var(--log-text-muted);
  padding: 2rem;
  font-style: italic;
}

.console-section {
  background: var(--log-bg);
  border-top: 1px solid var(--log-border);
  padding: 8px 16px;
  flex-shrink: 0;
  height: 40px;
}

.console-input-line {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
}

.console-prompt {
  color: var(--log-command);
  font-family: inherit;
  font-weight: normal;
  user-select: none;
  font-size: 13px;
}

.console-input {
  flex: 1;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--log-text);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  height: 100%;
}

.console-input::placeholder {
  color: var(--log-text-muted);
  opacity: 0.7;
  font-size: 12px;
}

/* 滚动条样式 */
.log-container::-webkit-scrollbar {
  width: 10px;
}

.log-container::-webkit-scrollbar-track {
  background: var(--log-scrollbar-track);
}

.log-container::-webkit-scrollbar-thumb {
  background: var(--log-scrollbar-thumb);
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: var(--log-scrollbar-thumb-hover);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .log-view {
    font-size: 12px;
  }

  .header {
    padding: 6px 12px;
    height: auto;
  }

  .log-controls {
    padding: 6px 12px;
    height: auto;
    flex-wrap: wrap;
  }

  .log-container {
    padding: 6px 12px;
  }

  .console-section {
    padding: 6px 12px;
  }

  .log-time {
    min-width: 80px;
    font-size: 11px;
  }

  .log-level {
    min-width: 40px;
    font-size: 11px;
  }
}
</style>
