/**
 * Feedback Service
 * 封装与 Tauri 后端的反馈系统通信
 * Requirements: 3.1, 7.1, 2.2, 2.3, 2.4, 8.1, 8.2
 */

import { invoke } from "@tauri-apps/api/core";
import { logService } from "./logService";

/**
 * 反馈状态枚举
 */
export const FeedbackStatus = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  FAILED: "failed",
};

/**
 * 反馈类型枚举
 */
export const FeedbackType = {
  BUG: "bug",
  IDEA: "idea",
  GENERAL: "general",
  UI: "ui",
};

/**
 * Bug 严重程度枚举
 */
export const BugSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

// ============================================
// 输入验证常量
// Requirements: 2.2, 2.3, 2.4, 8.1, 8.2
// ============================================

/**
 * 验证限制常量
 */
export const ValidationLimits = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 60000,
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_ATTACHMENT_COUNT: 5,
};

const LOG_MAX_CHARS = 20000;

// 基础脱敏规则（仅用于日志与描述字段）
const REDACTION_PATTERNS = [
  {
    regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    replacement: "[REDACTED_EMAIL]",
  },
  {
    regex: /\b(Authorization:\s*Bearer\s+)[A-Za-z0-9._-]+/gi,
    replacement: "$1[REDACTED_TOKEN]",
  },
  {
    regex: /\b(Bearer\s+)[A-Za-z0-9._-]+/gi,
    replacement: "$1[REDACTED_TOKEN]",
  },
  {
    regex: /\b(api[_-]?key|token|password|secret)\b\s*[:=]\s*[^\s]+/gi,
    replacement: "$1=[REDACTED]",
  },
  {
    regex: /([A-Z]:\\Users\\)[^\\]+/g,
    replacement: "$1[REDACTED_USER]",
  },
  {
    regex: /(\/Users\/)[^/]+/g,
    replacement: "$1[REDACTED_USER]",
  },
  {
    regex: /(\/home\/)[^/]+/g,
    replacement: "$1[REDACTED_USER]",
  },
];

function sanitizeText(text) {
  if (!text) return "";
  let result = String(text);
  for (const { regex, replacement } of REDACTION_PATTERNS) {
    result = result.replace(regex, replacement);
  }
  return result;
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const suffix = "\n[TRUNCATED]";
  const maxBody = Math.max(0, maxLength - suffix.length);
  return text.slice(0, maxBody) + suffix;
}

/**
 * 允许的附件文件扩展名
 */
export const AllowedFileExtensions = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "txt",
  "log",
  "json",
];

/**
 * 允许的 MIME 类型映射
 */
export const AllowedMimeTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  txt: "text/plain",
  log: "text/plain",
  json: "application/json",
};

// ============================================
// 输入验证工具函数
// Requirements: 2.2, 2.3, 2.4, 8.1, 8.2
// ============================================

/**
 * 验证结果对象
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否验证通过
 * @property {string|null} error - 错误消息（如果验证失败）
 */

/**
 * 验证标题长度
 * @param {string} title - 标题文本
 * @returns {ValidationResult} 验证结果
 * Requirements: 2.2
 */
export function validateTitle(title) {
  if (!title || typeof title !== "string") {
    return { valid: false, error: "标题不能为空" };
  }

  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "标题不能为空" };
  }

  if (trimmed.length > ValidationLimits.TITLE_MAX_LENGTH) {
    return {
      valid: false,
      error: `标题不能超过 ${ValidationLimits.TITLE_MAX_LENGTH} 个字符`,
    };
  }

  return { valid: true, error: null };
}

/**
 * 验证描述长度
 * @param {string} description - 描述文本
 * @returns {ValidationResult} 验证结果
 * Requirements: 2.3
 */
export function validateDescription(description) {
  if (!description || typeof description !== "string") {
    return { valid: false, error: "描述不能为空" };
  }

  const trimmed = description.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "描述不能为空" };
  }

  if (trimmed.length > ValidationLimits.DESCRIPTION_MAX_LENGTH) {
    return {
      valid: false,
      error: `描述不能超过 ${ValidationLimits.DESCRIPTION_MAX_LENGTH} 个字符`,
    };
  }

  return { valid: true, error: null };
}

/**
 * 获取文件扩展名（小写）
 * @param {string} filename - 文件名
 * @returns {string} 小写扩展名
 */
export function getFileExtension(filename) {
  if (!filename || typeof filename !== "string") {
    return "";
  }
  const parts = filename.split(".");
  if (parts.length < 2) {
    return "";
  }
  return parts[parts.length - 1].toLowerCase();
}

/**
 * 验证附件文件类型
 * @param {File|{name: string}} file - 文件对象
 * @returns {ValidationResult} 验证结果
 * Requirements: 8.1
 */
export function validateAttachmentType(file) {
  if (!file) {
    return { valid: false, error: "无效的文件" };
  }

  // 支持两种格式：原始 File 对象或已转换的附件对象
  const fileName = file.name || file.fileName;
  if (!fileName) {
    return { valid: false, error: "无效的文件" };
  }

  const ext = getFileExtension(fileName);
  if (!ext) {
    return { valid: false, error: "文件必须有扩展名" };
  }

  if (!AllowedFileExtensions.includes(ext)) {
    return {
      valid: false,
      error: `不支持的文件类型: .${ext}。支持的类型: ${AllowedFileExtensions.join(
        ", "
      )}`,
    };
  }

  return { valid: true, error: null };
}

/**
 * 验证附件文件大小
 * @param {File|{size: number, name: string}} file - 文件对象
 * @returns {ValidationResult} 验证结果
 * Requirements: 8.2
 */
export function validateAttachmentSize(file) {
  if (!file) {
    return { valid: false, error: "无效的文件" };
  }

  // 支持两种格式：原始 File 对象或已转换的附件对象（可能没有 size）
  const fileSize = file.size;
  const fileName = file.name || file.fileName || "未知文件";

  // 如果没有 size 属性（已转换的附件），跳过大小验证
  if (typeof fileSize !== "number") {
    return { valid: true, error: null };
  }

  if (fileSize > ValidationLimits.MAX_ATTACHMENT_SIZE) {
    const maxSizeMB = ValidationLimits.MAX_ATTACHMENT_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `文件 "${fileName}" 超过 ${maxSizeMB}MB 限制`,
    };
  }

  return { valid: true, error: null };
}

/**
 * 验证附件数量
 * @param {Array} attachments - 附件数组
 * @returns {ValidationResult} 验证结果
 * Requirements: 2.4
 */
export function validateAttachmentCount(attachments) {
  if (!Array.isArray(attachments)) {
    return { valid: true, error: null }; // 空数组视为有效
  }

  if (attachments.length > ValidationLimits.MAX_ATTACHMENT_COUNT) {
    return {
      valid: false,
      error: `最多只能上传 ${ValidationLimits.MAX_ATTACHMENT_COUNT} 个附件`,
    };
  }

  return { valid: true, error: null };
}

/**
 * 验证单个附件（类型和大小）
 * @param {File|{name: string, size: number}} file - 文件对象
 * @returns {ValidationResult} 验证结果
 * Requirements: 8.1, 8.2
 */
export function validateAttachment(file) {
  // 验证类型
  const typeResult = validateAttachmentType(file);
  if (!typeResult.valid) {
    return typeResult;
  }

  // 验证大小
  const sizeResult = validateAttachmentSize(file);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true, error: null };
}

/**
 * 验证所有附件
 * @param {Array<File|{name: string, size: number}>} attachments - 附件数组
 * @returns {ValidationResult} 验证结果
 * Requirements: 2.4, 8.1, 8.2
 */
export function validateAttachments(attachments) {
  // 验证数量
  const countResult = validateAttachmentCount(attachments);
  if (!countResult.valid) {
    return countResult;
  }

  // 验证每个附件
  if (Array.isArray(attachments)) {
    for (const file of attachments) {
      const result = validateAttachment(file);
      if (!result.valid) {
        return result;
      }
    }
  }

  return { valid: true, error: null };
}

/**
 * 验证反馈类型
 * @param {string} type - 反馈类型
 * @returns {ValidationResult} 验证结果
 */
export function validateFeedbackType(type) {
  const validTypes = Object.values(FeedbackType);
  if (!type || !validTypes.includes(type.toLowerCase())) {
    return {
      valid: false,
      error: `无效的反馈类型。有效类型: ${validTypes.join(", ")}`,
    };
  }
  return { valid: true, error: null };
}

/**
 * 验证 Bug 严重程度
 * @param {string} severity - 严重程度
 * @param {string} feedbackType - 反馈类型
 * @returns {ValidationResult} 验证结果
 */
export function validateSeverity(severity, feedbackType) {
  // 只有 bug 类型需要验证严重程度
  if (feedbackType?.toLowerCase() !== FeedbackType.BUG) {
    return { valid: true, error: null };
  }

  if (!severity) {
    return { valid: true, error: null }; // 严重程度是可选的
  }

  const validSeverities = Object.values(BugSeverity);
  if (!validSeverities.includes(severity.toLowerCase())) {
    return {
      valid: false,
      error: `无效的严重程度。有效值: ${validSeverities.join(", ")}`,
    };
  }

  return { valid: true, error: null };
}

/**
 * 验证完整的反馈表单数据（简化版，无附件）
 * @param {Object} data - 反馈数据
 * @param {string} data.type - 反馈类型
 * @param {string} [data.severity] - Bug 严重程度
 * @param {string} data.title - 标题
 * @param {string} data.description - 描述
 * @returns {ValidationResult} 验证结果
 * Requirements: 2.2, 2.3
 */
export function validateFeedbackForm(data) {
  // 验证反馈类型
  const typeResult = validateFeedbackType(data.type);
  if (!typeResult.valid) {
    return typeResult;
  }

  // 验证严重程度（仅 bug 类型）
  const severityResult = validateSeverity(data.severity, data.type);
  if (!severityResult.valid) {
    return severityResult;
  }

  // 验证标题
  const titleResult = validateTitle(data.title);
  if (!titleResult.valid) {
    return titleResult;
  }

  // 验证描述
  const descriptionResult = validateDescription(data.description);
  if (!descriptionResult.valid) {
    return descriptionResult;
  }

  return { valid: true, error: null };
}

/**
 * 反馈服务类
 */
class FeedbackService {
  constructor() {
    this.initialized = false;
  }

  /**
   * 直接发送反馈到 Cloudflare Worker（简化版）
   * @param {string} content - 反馈内容
   * @param {string} [email] - 可选的联系邮箱
   * @returns {Promise<{success: boolean, error?: string}>} 提交结果
   */
  async sendFeedback(content, email = null) {
    try {
      const result = await invoke("send_feedback", {
        content,
        email,
      });
      return result;
    } catch (error) {
      console.error("发送反馈失败:", error);
      throw error;
    }
  }

  /**
   * 提交反馈到 Cloudflare Worker（完整版，带系统信息）
   * @param {Object} data - 反馈数据
   * @param {string} data.type - 反馈类型 (bug, idea, general, ui)
   * @param {string} [data.severity] - Bug 严重程度 (仅 bug 类型)
   * @param {string} [data.sender] - 发送人名称/邮箱（可选）
   * @param {string} data.title - 反馈标题
   * @param {string} data.description - 反馈描述
   * @param {string} [data.language] - 应用语言设置
   * @param {string} [data.screenResolution] - 屏幕分辨率
   * @param {boolean} [data.includeLogs] - 是否包含日志，默认 false
   * @returns {Promise<Object>} 提交结果
   */
  async submitFeedback(data) {
    // 前端验证（不再验证附件）
    const validationResult = validateFeedbackForm(data);
    if (!validationResult.valid) {
      throw new Error(validationResult.error);
    }

    try {
      // 获取语言和分辨率信息
      const language =
        data.language || document.documentElement.lang || "zh-CN";
      const screenResolution =
        data.screenResolution ||
        `${window.screen.width}x${window.screen.height}`;

      // 收集日志（默认不包含，可通过 includeLogs: true 启用）
      let descriptionWithLogs = data.description || "";
      const includeLogs = data.includeLogs === true; // 默认不包含日志

      if (includeLogs) {
        // 获取前端日志（包含所有 console 输出和 Tauri 调用错误）
        const frontendLogs = truncateText(
          sanitizeText(logService.getRecentLogs(100)),
          LOG_MAX_CHARS
        );

        // 获取后端日志
        let backendLogs = "";
        try {
          backendLogs = await invoke("get_backend_logs");
        } catch (e) {
          console.warn("获取后端日志失败:", e);
        }
        backendLogs = truncateText(sanitizeText(backendLogs), LOG_MAX_CHARS);

        // 将日志附加到描述末尾
        descriptionWithLogs += "\n\n---\n\n## 📋 Application Logs\n";

        if (frontendLogs) {
          descriptionWithLogs +=
            "\n<details>\n<summary>Frontend Console Logs (Last 100 entries)</summary>\n\n```\n";
          descriptionWithLogs += frontendLogs;
          descriptionWithLogs += "\n```\n</details>\n";
        }

        if (backendLogs) {
          descriptionWithLogs +=
            "\n<details>\n<summary>Backend Logs (Last 100 entries)</summary>\n\n```\n";
          descriptionWithLogs += backendLogs;
          descriptionWithLogs += "\n```\n</details>\n";
        }
      }

      // 脱敏并截断，保证不超过后端限制
      descriptionWithLogs = sanitizeText(descriptionWithLogs);
      descriptionWithLogs = truncateText(
        descriptionWithLogs,
        ValidationLimits.DESCRIPTION_MAX_LENGTH
      );

      const result = await invoke("submit_feedback", {
        data: {
          feedback_type: data.type,
          severity: data.severity || null,
          sender: data.sender || null,
          title: data.title,
          description: descriptionWithLogs,
        },
        language,
        screenResolution,
      });
      return result;
    } catch (error) {
      console.error("提交反馈失败:", error);
      throw error;
    }
  }

  /**
   * 获取反馈历史记录
   * @returns {Promise<Array<Object>>} 反馈历史列表
   */
  async getHistory({ limit = 50, offset = 0 } = {}) {
    try {
      const history = await invoke("get_feedback_history", { limit, offset });
      return history;
    } catch (error) {
      console.error("获取反馈历史失败:", error);
      throw error;
    }
  }

  /**
   * 重试失败的反馈
   * @param {string} id - 反馈 ID
   * @returns {Promise<void>}
   */
  async retryFeedback(id) {
    try {
      await invoke("retry_feedback", { id });
    } catch (error) {
      console.error("重试反馈失败:", error);
      throw error;
    }
  }

  /**
   * 删除反馈
   * @param {string} id - 反馈 ID
   * @returns {Promise<void>}
   */
  async deleteFeedback(id) {
    try {
      await invoke("delete_feedback", { id });
    } catch (error) {
      console.error("删除反馈失败:", error);
      throw error;
    }
  }

  /**
   * 获取系统信息
   * @param {string} [language] - 应用语言设置
   * @param {string} [screenResolution] - 屏幕分辨率
   * @returns {Promise<Object>} 系统信息
   */
  async getSystemInfo(language, screenResolution) {
    try {
      // 获取语言和分辨率信息
      const lang = language || document.documentElement.lang || "zh-CN";
      const resolution =
        screenResolution || `${window.screen.width}x${window.screen.height}`;

      const systemInfo = await invoke("get_system_info", {
        language: lang,
        screenResolution: resolution,
      });
      return systemInfo;
    } catch (error) {
      console.error("获取系统信息失败:", error);
      throw error;
    }
  }
}

// 创建单例实例
export const feedbackService = new FeedbackService();
