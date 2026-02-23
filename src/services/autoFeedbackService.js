import storage from "./storageService";
import { feedbackService } from "./feedbackService";
import { invoke } from "@tauri-apps/api/core";

const AUTO_FEEDBACK_SETTING_KEY = "autoFeedbackEnabled";

/**
 * 获取当前页面位置信息
 * @returns {string} 页面位置描述
 */
function getCurrentPageLocation() {
  try {
    // 尝试从 Vue Router 获取当前路由
    if (window.__VUE_ROUTER__?.currentRoute?.value) {
      const route = window.__VUE_ROUTER__.currentRoute.value;
      return `${route.name || 'Unknown'} (${route.path})`;
    }

    // 备用方案：从 window.location 获取
    const hash = window.location.hash;
    const path = hash ? hash.replace('#', '') : window.location.pathname;

    // 根据路径匹配路由名称
    const routeMap = {
      '/': 'Home',
      '/about': 'About',
      '/settings': 'Settings',
      '/plugins': 'PluginMarket',
      '/select-create-mode': 'SelectCreateMode',
      '/create-archive': 'CreateArchive',
      '/quick-create-archive': 'QuickCreateArchive',
      '/test-archive': 'TestArchive',
      '/edit-archive': 'EditArchive',
      '/logs': 'Log',
      '/steam-cache': 'SteamCache',
      '/feedback': 'Feedback',
      '/theme-editor': 'ThemeEditor',
    };

    // 匹配基础路径
    const basePath = path.split('/').slice(0, 2).join('/') || '/';
    const routeName = routeMap[basePath] || routeMap[path] || 'Unknown';

    return `${routeName} (${path})`;
  } catch (e) {
    return 'Unknown (failed to get location)';
  }
}
const REPORT_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_REPORTS_PER_SESSION = 3;
const BACKEND_POLL_INTERVAL_MS = 12000;
const BLOCKED_KEYWORDS_URL = "https://etbsavemanager-feedback.llzgd.workers.dev";

let cachedBlockedKeywords = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000;

async function getBlockedKeywords() {
  const now = Date.now();
  if (cachedBlockedKeywords && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedBlockedKeywords;
  }

  try {
    const response = await fetch(BLOCKED_KEYWORDS_URL);
    if (!response.ok) {
      console.warn("[AutoFeedback] 获取屏蔽词列表失败:", response.status);
      return cachedBlockedKeywords || [];
    }
    const data = await response.json();
    cachedBlockedKeywords = data.blockedKeywords || [];
    lastFetchTime = now;
    return cachedBlockedKeywords;
  } catch (error) {
    console.warn("[AutoFeedback] 获取屏蔽词列表出错:", error);
    return cachedBlockedKeywords || [];
  }
}

function containsBlockedKeyword(message, blockedKeywords) {
  if (!message || !Array.isArray(blockedKeywords) || blockedKeywords.length === 0) {
    return false;
  }
  const normalizedMessage = message.toLowerCase();
  return blockedKeywords.some(keyword => {
    if (!keyword) return false;
    return normalizedMessage.includes(keyword.toLowerCase());
  });
}

function normalizeMessage(message) {
  return String(message || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFingerprint(log) {
  const normalized = normalizeMessage(log.message).slice(0, 240);
  return `${log.type}:${normalized}`;
}

function parseBackendErrorEntries(logText) {
  if (!logText) return [];

  const lines = String(logText).split(/\r?\n/).filter(Boolean);
  const entries = [];

  for (const line of lines) {
    const match = line.match(/^\[([^\]]+)\]\s+([A-Za-z]+):\s*(.*)$/);
    if (!match) continue;

    const [, timestamp, levelRaw, messageRaw] = match;
    const level = levelRaw.toLowerCase();
    if (level !== "error") continue;

    const message = normalizeMessage(messageRaw);
    if (!message || message.includes("[AutoFeedback]")) continue;

    entries.push({
      timestamp,
      level,
      message,
      key: `${timestamp}|${level}|${message.slice(0, 240)}`,
    });
  }

  return entries;
}

class AutoFeedbackService {
  constructor() {
    this.enabled = false;
    this.initialized = false;
    this.lastProcessedLogId = null;
    this.lastReportAt = 0;
    this.reportCount = 0;
    this.reportedFingerprints = new Set();
    this.isSubmitting = false;
    this.backendErrorSeenKeys = new Set();
    this.backendPollTimer = null;
    this.backendPolling = false;
    this.backendPrimed = false;

    this.handleLogsUpdated = this.handleLogsUpdated.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  init() {
    if (this.initialized) return;

    const saved = storage.getItem(AUTO_FEEDBACK_SETTING_KEY, true);
    this.enabled = saved === true || saved === "true" || saved === null || saved === undefined;

    window.addEventListener("logs-updated", this.handleLogsUpdated);
    window.addEventListener("auto-feedback-toggle", this.handleToggle);

    if (this.enabled) {
      this.startBackendPolling();
    }

    this.initialized = true;
  }

  destroy() {
    if (!this.initialized) return;

    window.removeEventListener("logs-updated", this.handleLogsUpdated);
    window.removeEventListener("auto-feedback-toggle", this.handleToggle);
    this.stopBackendPolling();
    this.initialized = false;
  }

  handleToggle(event) {
    this.enabled = event?.detail?.enabled === true;

    if (this.enabled) {
      this.startBackendPolling();
    } else {
      this.stopBackendPolling();
    }
  }

  handleLogsUpdated(event) {
    if (!this.enabled || this.isSubmitting) return;

    const logs = event?.detail?.logs;
    if (!Array.isArray(logs) || logs.length === 0) return;

    const latestLog = logs[logs.length - 1];
    if (!latestLog || latestLog.id === this.lastProcessedLogId) return;

    this.lastProcessedLogId = latestLog.id;

    if (!this.isTargetError(latestLog)) return;

    this.submitAutoFeedback(latestLog, "frontend");
  }

  isTargetError(log) {
    if (!log || log.type !== "error") return false;

    const message = normalizeMessage(log.message);

    // 忽略自动反馈自身日志，防止递归触发
    if (message.includes("[AutoFeedback]")) return false;

    // 忽略用户配置问题（不是应用错误）
    if (this.isUserConfigError(message)) return false;

    return true;
  }

  /**
   * 检查是否为"用户配置问题"而非"应用错误"
   * 这类问题不应该被自动反馈，因为它们是用户环境配置导致的
   */
  isUserConfigError(message) {
    const userConfigErrorPatterns = [
      // Steam API 未配置
      /steam.*api.*密钥.*未配置/i,
      /steam.*api.*key.*not.*configured/i,

      // 用户取消操作
      /用户取消|user.*cancel/i,
      /对话框.*取消|dialog.*cancel/i,

      // 文件/路径不存在（用户环境问题）
      /存档目录不存在|save.*directory.*not.*exist/i,
      /文件不存在|file.*not.*exist/i,
      /主题不存在|theme.*not.*found/i,
      /配置文件不存在|config.*file.*not.*exist/i,
      /父目录不存在|parent.*directory.*not.*exist/i,
      /路径包含无效字符|path.*invalid.*character/i,

      // 无效的用户输入
      /无效的steam.*id|invalid.*steam.*id/i,
      /文件名格式不匹配|filename.*format.*not.*match/i,
      /无效的颜色格式|invalid.*color.*format/i,
      /无效的路径|invalid.*path/i,
      /无效的文件名|invalid.*filename/i,
      /无效的加密密钥格式|invalid.*encryption.*key/i,
      /无效的密钥长度|invalid.*key.*length/i,
      /无效的.*id|invalid.*id/i,

      // 网络/API 问题（非应用错误）
      /请求steam.*api.*失败|steam.*api.*request.*failed/i,
      /steam.*api.*返回错误|steam.*api.*error/i,
      /网络超时|network.*timeout/i,
      /连接失败|connection.*failed/i,

      // 其他用户环境问题
      /导入文件不存在|import.*file.*not.*found/i,
      /路径遍历攻击|path.*traversal/i,
    ];

    return userConfigErrorPatterns.some((pattern) => pattern.test(message));
  }

  canSubmitFor(log) {
    const now = Date.now();
    const fingerprint = buildFingerprint(log);

    if (this.reportedFingerprints.has(fingerprint)) {
      return { allowed: false, fingerprint };
    }

    if (this.reportCount >= MAX_REPORTS_PER_SESSION) {
      return { allowed: false, fingerprint };
    }

    if (now - this.lastReportAt < REPORT_COOLDOWN_MS) {
      return { allowed: false, fingerprint };
    }

    return { allowed: true, fingerprint };
  }

  async submitAutoFeedback(log, source = "frontend") {
    const decision = this.canSubmitFor(log);
    if (!decision.allowed) return;

    const { fingerprint } = decision;

    const message = normalizeMessage(log.message).slice(0, 800);

    const blockedKeywords = await getBlockedKeywords();
    if (containsBlockedKeyword(message, blockedKeywords)) {
      console.info("[AutoFeedback] 日志包含屏蔽词，跳过自动提交");
      return;
    }

    this.isSubmitting = true;
    this.reportedFingerprints.add(fingerprint);
    this.lastReportAt = Date.now();
    this.reportCount += 1;

    try {
      const language = storage.getItem("language", "zh-CN") || "zh-CN";
      const sourceLabel = source === "backend" ? "Backend" : "Frontend";
      const pageLocation = source === "frontend" ? getCurrentPageLocation() : "N/A (Backend Error)";

      await feedbackService.submitFeedback({
        type: "bug",
        severity: "high",
        title: `[AutoFeedback] ${sourceLabel} ${log.type.toUpperCase()} detected`,
        description: [
          "Auto-captured application error log.",
          `Source: ${sourceLabel}`,
          `Level: ${log.type}`,
          `Time: ${log.timestamp || new Date().toLocaleTimeString()}`,
          `Page: ${pageLocation}`,
          "",
          "Message:",
          message,
        ].join("\n"),
        language,
        includeLogs: true,
      });

      console.info("[AutoFeedback] 自动反馈已提交");
    } catch (error) {
      console.warn("[AutoFeedback] 自动反馈提交失败:", error);
      this.reportedFingerprints.delete(fingerprint);
      this.reportCount = Math.max(0, this.reportCount - 1);
      this.lastReportAt = Date.now();
    } finally {
      this.isSubmitting = false;
    }
  }

  startBackendPolling() {
    if (this.backendPollTimer) return;
    this.backendPrimed = false;

    this.checkBackendLogs();
    this.backendPollTimer = setInterval(() => {
      this.checkBackendLogs();
    }, BACKEND_POLL_INTERVAL_MS);
  }

  stopBackendPolling() {
    if (this.backendPollTimer) {
      clearInterval(this.backendPollTimer);
      this.backendPollTimer = null;
    }
    this.backendPolling = false;
    this.backendPrimed = false;
  }

  pruneBackendSeenKeys(limit = 300) {
    if (this.backendErrorSeenKeys.size <= limit) return;
    const keys = Array.from(this.backendErrorSeenKeys);
    this.backendErrorSeenKeys = new Set(keys.slice(-limit));
  }

  async checkBackendLogs() {
    if (!this.enabled || this.backendPolling) return;
    this.backendPolling = true;

    try {
      const backendLogs = await invoke("get_backend_logs");
      const errorEntries = parseBackendErrorEntries(backendLogs);

      if (!this.backendPrimed) {
        for (const entry of errorEntries) {
          this.backendErrorSeenKeys.add(entry.key);
        }
        this.pruneBackendSeenKeys();
        this.backendPrimed = true;
        if (errorEntries.length > 0) return;
      }

      const newEntries = errorEntries.filter(
        (entry) => !this.backendErrorSeenKeys.has(entry.key)
      );

      for (const entry of newEntries) {
        this.backendErrorSeenKeys.add(entry.key);
      }
      this.pruneBackendSeenKeys();

      if (newEntries.length === 0) return;

      const latest = newEntries[newEntries.length - 1];
      await this.submitAutoFeedback(
        {
          type: "error",
          message: `[Backend] ${latest.message}`,
          timestamp: latest.timestamp,
        },
        "backend"
      );
    } catch (error) {
      console.warn("[AutoFeedback] 读取后端日志失败:", error);
    } finally {
      this.backendPolling = false;
    }
  }
}

export const autoFeedbackService = new AutoFeedbackService();
export default autoFeedbackService;
