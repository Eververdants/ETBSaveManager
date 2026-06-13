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
import { logService } from "../services/logService.js";

const { t } = useI18n({ useScope: "global" });

const logs = ref([]);
const filterLevel = ref("");
const searchText = ref("");
const logContainer = ref(null);


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
