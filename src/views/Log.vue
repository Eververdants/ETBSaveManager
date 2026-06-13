<template>
  <div class="log-view">
    <div class="header">
      <h1>{{ t("logs.title") }}</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="clearLogs">
          <font-awesome-icon :icon="['fas', 'trash']" />
          {{ t("logs.clear") }}
        </button>
        <button class="btn btn-primary" @click="exportLogs">
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
        <input v-model="searchText" :placeholder="t('logs.search')" class="search-input" @input="applyFilter" />
      </div>
    </div>

    <!-- Console command section -->
    <div class="console-section">
      <div class="console-input-line">
        <span class="console-prompt">$ </span>
        <input
          ref="consoleInput"
          v-model="consoleCommand"
          type="text"
          placeholder="Type help for available commands"
          class="console-input"
          @keyup.enter="executeConsoleCommand"
          @keyup.up="navigateHistory(-1)"
          @keyup.down="navigateHistory(1)"
        />
      </div>
    </div>

    <div ref="logContainer" class="log-container">
      <div v-for="(log, index) in filteredLogs" :key="index" :class="['log-entry', log.type]">
        <div class="log-time">{{ formatTime(log.date) }}</div>
        <div class="log-level" :class="log.type">[{{ log.type.toUpperCase() }}]</div>
        <div class="log-message">
          <div v-if="Array.isArray(log.message)" class="log-multiline">
            <div
              v-for="(line, lineIndex) in log.message"
              :key="lineIndex"
              :class="{
                'log-command': lineIndex === 0,
                'log-result': lineIndex === 1 && log.message.length > 1,
              }"
            >
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
import { i18n } from "../i18n/index.js";
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

// Safe argument parsing function
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

// Safe expression processing function
const processSafeExpression = (expression) => {
  try {
    // Allowed characters: digits, operators, parentheses, quotes, whitespace, letters (for translation function t())
    const allowedPattern = /^[\d\s+\-*/().,?!:='"`[\]{}a-zA-Z_]+$/;
    if (!allowedPattern.test(expression)) {
      throw new Error("Expression contains disallowed characters");
    }

    // Remove dangerous keywords
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
        throw new Error(`Keyword not allowed: ${keyword}`);
      }
    }

    // Only allow simple math calculations and basic operations
    if (/^[\d\s+\-*/().]+$/.test(expression)) {
      // Pure math expression
      return Function(`"use strict"; return (${expression})`)();
    }

    // Translation function call
    if (expression.includes("t(")) {
      const match = expression.match(/t\(['"`]([^'"`]+)['"`]\)/);
      if (match) {
        const key = match[1];
        return t(key);
      }
    }

    // String literal
    if (
      (expression.startsWith('"') && expression.endsWith('"')) ||
      (expression.startsWith("'") && expression.endsWith("'")) ||
      (expression.startsWith("`") && expression.endsWith("`"))
    ) {
      return parseValue(expression);
    }

    // Simple variable or constant
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression)) {
      return expression;
    }

    // JSON object or array
    if (
      (expression.startsWith("{") && expression.endsWith("}")) ||
      (expression.startsWith("[") && expression.endsWith("]"))
    ) {
      return JSON.parse(expression);
    }

    // Number
    if (!isNaN(expression)) {
      return Number(expression);
    }

    throw new Error("Unsupported expression type");
  } catch (error) {
    throw new Error(`Expression processing error: ${error.message}`, { cause: error });
  }
};

// Parse a single value
const parseValue = (value) => {
  // Remove surrounding quotes from string
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith("`") && value.endsWith("`"))
  ) {
    return value.slice(1, -1);
  }

  // Number
  if (!isNaN(value)) {
    return Number(value);
  }

  // Boolean
  if (value === "true") return true;
  if (value === "false") return false;

  // undefined
  if (value === "undefined") return undefined;

  // null
  if (value === "null") return null;

  // Try to parse JSON
  if (value.startsWith("{") && value.endsWith("}")) {
    try {
      return JSON.parse(value);
    } catch {
      // Ignore parse errors
    }
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      return JSON.parse(value);
    } catch {
      // Ignore parse errors
    }
  }

  // Default to string
  return value;
};

// Get filtered logs
const filteredLogs = computed(() => {
  let result = logs.value;

  if (filterLevel.value) {
    result = result.filter((log) => log.type === filterLevel.value);
  }

  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase();
    result = result.filter((log) => log.message.toLowerCase().includes(searchLower));
  }

  return result;
});

// Format time
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

// Apply filter
const applyFilter = () => {
  nextTick(() => {
    scrollToBottom();
  });
};

// Clear logs
const clearLogs = () => {
  logService.clearLogs();
  logs.value = [];
};

// Export logs
const exportLogs = () => {
  logService.exportLogs();
};

// Scroll to bottom
const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
};

// Console command execution
const executeConsoleCommand = () => {
  try {
    const cmd = consoleCommand.value.trim();
    if (!cmd) return;

    // Add to history
    commandHistory.value.unshift(cmd);
    if (commandHistory.value.length > 50) {
      commandHistory.value = commandHistory.value.slice(0, 50);
    }
    historyIndex.value = -1;

    let result;

    // Console command parsing
    switch (cmd.toLowerCase()) {
      case "help":
        result = `Available commands:
  help        - Show this help
  locale      - Show current language
  messages    - Show all translation messages
  t(key)      - Test translation key, e.g.: t('app.name')
  app.name    - Show app name
  clear       - Clear console
  ls          - List available languages

JavaScript support:
  console.log("text") - Output log
  1 + 1 - Math calculation
  "hello" - String
  [1,2,3] - Array
  {a:1} - Object`;
        break;
      case "locale":
        result = `Current language: ${i18n.locale || "Unknown"}`;
        break;
      case "messages":
        result = JSON.stringify(i18n.messages || {}, null, 2);
        break;
      case "clear":
        logService.clearLogs();
        consoleCommand.value = "";
        return;
      case "ls":
        result = `Available languages: ${Object.keys(i18n.messages || {}).join(", ")}`;
        break;
      default:
        // Handle translation test
        if (cmd.startsWith("t(")) {
          const match = cmd.match(/t\(['"]([^'"]+)['"]\)/);
          if (match) {
            const key = match[1];
            result = t(key);
          } else {
            result = 'Usage: t("key")';
          }
        } else if (cmd.includes("console.log")) {
          // Safe handling of console.log
          try {
            const match = cmd.match(/console\.log\((.*)\)$/);
            if (match) {
              const argsStr = match[1].trim();
              // Use safe argument parsing
              const args = parseSafeArguments(argsStr);
              result = args
                .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
                .join(" ");
            } else {
              result = 'console.log usage: console.log("text") or console.log(variable)';
            }
          } catch (e) {
            result = `Error: ${e.message}`;
          }
        } else if (cmd.includes(".") && !cmd.includes("(") && !cmd.includes(" ")) {
          // Direct translation key
          result = t(cmd);
        } else {
          // Execute JavaScript expression
          try {
            // Handle translation keys directly
            if (cmd.startsWith("t(") && cmd.endsWith(")")) {
              // Handle t('key') format
              const match = cmd.match(/t\(['"`](.*?)['"`]\)/);
              if (match) {
                const key = match[1];
                result = this.$t(key);
              } else {
                result = this.$t("app.name"); // Default test
              }
            } else {
              // Handle other expression types
              result = processSafeExpression(cmd);
            }
          } catch (e) {
            result = `Error: ${e.message}`;
          }
        }
    }

    // Add command and result to logs
    logService.addLog("info", [`$ ${cmd}`, `→ ${result}`]);
  } catch (error) {
    logService.addLog("error", [`$ ${consoleCommand.value}`, `✗ Error: ${error.message}`]);
  }

  consoleCommand.value = "";
};

// Command history navigation
const navigateHistory = (direction) => {
  if (commandHistory.value.length === 0) return;

  if (direction === -1) {
    // Up arrow
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++;
      consoleCommand.value = commandHistory.value[historyIndex.value];
    }
  } else {
    // Down arrow
    if (historyIndex.value > 0) {
      historyIndex.value--;
      consoleCommand.value = commandHistory.value[historyIndex.value];
    } else {
      historyIndex.value = -1;
      consoleCommand.value = "";
    }
  }
};

// Update logs
const updateLogs = () => {
  const newLogs = logService.getLogs();
  const newLogCount = newLogs.length;

  logs.value = newLogs;

  // Only scroll to bottom if there are new logs and user hasn't manually scrolled
  if (newLogCount > lastLogCount && !isUserScrolling) {
    nextTick(() => {
      scrollToBottom();
    });
  }
  lastLogCount = newLogCount;
};

// Auto scroll toggle
let autoScrollInterval;
let lastLogCount = 0;
let isUserScrolling = false;

// Detect if user is manually scrolling
const checkUserScrolling = () => {
  if (!logContainer.value) return;

  const container = logContainer.value;
  const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;

  if (!isAtBottom) {
    isUserScrolling = true;
  } else {
    isUserScrolling = false;
  }
};

onMounted(() => {
  updateLogs();
  lastLogCount = logs.value.length;

  // Listen for log updates
  window.addEventListener("logs-updated", updateLogs);

  // Listen for user scroll events
  if (logContainer.value) {
    logContainer.value.addEventListener("scroll", checkUserScrolling);
  }

  // Smart scroll: only scroll to bottom on new logs if user hasn't manually scrolled
  autoScrollInterval = setInterval(() => {
    const newLogs = logService.getLogs();
    const newLogCount = newLogs.length;

    // Check if there are new logs
    if (newLogCount > lastLogCount && !isUserScrolling) {
      logs.value = newLogs;
      lastLogCount = newLogCount;
      nextTick(() => {
        scrollToBottom();
      });
    } else if (newLogCount !== logs.value.length) {
      // Update logs but don't auto scroll
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
    console.error("Error cleaning up log listeners:", error);
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
  font-family:
    "Consolas", "Monaco", "Lucida Console", "Liberation Mono", "DejaVu Sans Mono", "Bitstream Vera Sans Mono",
    "Courier New", monospace;
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

/* Scrollbar styles */
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

/* Responsive design */
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
