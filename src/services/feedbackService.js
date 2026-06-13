/**
 * Feedback Service
 * Encapsulates communication with the Tauri backend feedback system
 * Requirements: 3.1, 7.1, 2.2, 2.3, 2.4, 8.1, 8.2
 */

import { invoke } from "@tauri-apps/api/core";
import { logService } from "./logService";

/**
 * Feedback status enum
 */
export const FeedbackStatus = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  FAILED: "failed",
};

/**
 * Feedback type enum
 */
export const FeedbackType = {
  BUG: "bug",
  IDEA: "idea",
  GENERAL: "general",
  UI: "ui",
};

/**
 * Bug severity level enum
 */
export const BugSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

// ============================================
// Input validation constants
// Requirements: 2.2, 2.3, 2.4, 8.1, 8.2
// ============================================

/**
 * Validation limit constants
 */
export const ValidationLimits = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 60000,
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_ATTACHMENT_COUNT: 5,
};

const LOG_MAX_CHARS = 20000;

// Basic redaction rules (used only for logs and description fields)
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
 * Allowed attachment file extensions
 */
export const AllowedFileExtensions = ["png", "jpg", "jpeg", "gif", "txt", "log", "json"];

/**
 * Allowed MIME type mapping
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
// Input validation utility functions
// Requirements: 2.2, 2.3, 2.4, 8.1, 8.2
// ============================================

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string|null} error - Error message (if validation failed)
 */

/**
 * Validate title length
 * @param {string} title - Title text
 * @returns {ValidationResult} Validation result
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
 * Validate description length
 * @param {string} description - Description text
 * @returns {ValidationResult} Validation result
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
 * Get file extension (lowercase)
 * @param {string} filename - Filename
 * @returns {string} Lowercase extension
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
 * Validate attachment file type
 * @param {File|{name: string}} file - File object
 * @returns {ValidationResult} Validation result
 * Requirements: 8.1
 */
export function validateAttachmentType(file) {
  if (!file) {
    return { valid: false, error: "无效的文件" };
  }

  // Supports two formats: raw File object or converted attachment object
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
      error: `不支持的文件类型: .${ext}。支持的类型: ${AllowedFileExtensions.join(", ")}`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate attachment file size
 * @param {File|{size: number, name: string}} file - File object
 * @returns {ValidationResult} Validation result
 * Requirements: 8.2
 */
export function validateAttachmentSize(file) {
  if (!file) {
    return { valid: false, error: "无效的文件" };
  }

  // Supports two formats: raw File object or converted attachment object (may not have size)
  const fileSize = file.size;
  const fileName = file.name || file.fileName || "未知文件";

  // If no size attribute (converted attachment), skip size validation
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
 * Validate attachment count
 * @param {Array} attachments - Attachment array
 * @returns {ValidationResult} Validation result
 * Requirements: 2.4
 */
export function validateAttachmentCount(attachments) {
  if (!Array.isArray(attachments)) {
    return { valid: true, error: null }; // Empty array is considered valid
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
 * Validate a single attachment (type and size)
 * @param {File|{name: string, size: number}} file - File object
 * @returns {ValidationResult} Validation result
 * Requirements: 8.1, 8.2
 */
export function validateAttachment(file) {
  // Validate type
  const typeResult = validateAttachmentType(file);
  if (!typeResult.valid) {
    return typeResult;
  }

  // Validate size
  const sizeResult = validateAttachmentSize(file);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true, error: null };
}

/**
 * Validate all attachments
 * @param {Array<File|{name: string, size: number}>} attachments - Attachment array
 * @returns {ValidationResult} Validation result
 * Requirements: 2.4, 8.1, 8.2
 */
export function validateAttachments(attachments) {
  // Validate count
  const countResult = validateAttachmentCount(attachments);
  if (!countResult.valid) {
    return countResult;
  }

  // Validate each attachment
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
 * Validate feedback type
 * @param {string} type - Feedback type
 * @returns {ValidationResult} Validation result
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
 * Validate Bug severity level
 * @param {string} severity - Severity level
 * @param {string} feedbackType - Feedback type
 * @returns {ValidationResult} Validation result
 */
export function validateSeverity(severity, feedbackType) {
  // Only bug type requires severity validation
  if (feedbackType?.toLowerCase() !== FeedbackType.BUG) {
    return { valid: true, error: null };
  }

  if (!severity) {
    return { valid: true, error: null }; // Severity is optional
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
 * Validate complete feedback form data (simplified, no attachments)
 * @param {Object} data - Feedback data
 * @param {string} data.type - Feedback type
 * @param {string} [data.severity] - Bug severity level
 * @param {string} data.title - Title
 * @param {string} data.description - Description
 * @returns {ValidationResult} Validation result
 * Requirements: 2.2, 2.3
 */
export function validateFeedbackForm(data) {
  // Validate feedback type
  const typeResult = validateFeedbackType(data.type);
  if (!typeResult.valid) {
    return typeResult;
  }

  // Validate severity (bug type only)
  const severityResult = validateSeverity(data.severity, data.type);
  if (!severityResult.valid) {
    return severityResult;
  }

  // Validate title
  const titleResult = validateTitle(data.title);
  if (!titleResult.valid) {
    return titleResult;
  }

  // Validate description
  const descriptionResult = validateDescription(data.description);
  if (!descriptionResult.valid) {
    return descriptionResult;
  }

  return { valid: true, error: null };
}

/**
 * Feedback service class
 */
class FeedbackService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Send feedback directly to Cloudflare Worker (simplified)
   * @param {string} content - Feedback content
   * @param {string} [email] - Optional contact email
   * @returns {Promise<{success: boolean, error?: string}>} Submission result
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
   * Submit feedback to Cloudflare Worker (full version, with system info)
   * @param {Object} data - Feedback data
   * @param {string} data.type - Feedback type (bug, idea, general, ui)
   * @param {string} [data.severity] - Bug severity level (bug type only)
   * @param {string} [data.sender] - Sender name/email (optional)
   * @param {string} data.title - Feedback title
   * @param {string} data.description - Feedback description
   * @param {string} [data.language] - Application language setting
   * @param {string} [data.screenResolution] - Screen resolution
   * @param {boolean} [data.includeLogs] - Whether to include logs, defaults to false
   * @returns {Promise<Object>} Submission result
   */
  async submitFeedback(data) {
    // Frontend validation (attachments no longer validated here)
    const validationResult = validateFeedbackForm(data);
    if (!validationResult.valid) {
      throw new Error(validationResult.error);
    }

    try {
      // Get language and resolution info
      const language = data.language || document.documentElement.lang || "zh-CN";
      const screenResolution = data.screenResolution || `${window.screen.width}x${window.screen.height}`;

      // Collect logs (disabled by default, enable with includeLogs: true)
      let descriptionWithLogs = data.description || "";
      const includeLogs = data.includeLogs === true; // Disabled by default

      if (includeLogs) {
        // Get frontend logs (includes all console output and Tauri invocation errors)
        const frontendLogs = truncateText(sanitizeText(logService.getRecentLogs(100)), LOG_MAX_CHARS);

        // Get backend logs
        let backendLogs = "";
        try {
          backendLogs = await invoke("get_backend_logs");
        } catch (e) {
          console.warn("获取后端日志失败:", e);
        }
        backendLogs = truncateText(sanitizeText(backendLogs), LOG_MAX_CHARS);

        // Append logs to the end of the description
        descriptionWithLogs += "\n\n---\n\n## 📋 Application Logs\n";

        if (frontendLogs) {
          descriptionWithLogs += "\n<details>\n<summary>Frontend Console Logs (Last 100 entries)</summary>\n\n```\n";
          descriptionWithLogs += frontendLogs;
          descriptionWithLogs += "\n```\n</details>\n";
        }

        if (backendLogs) {
          descriptionWithLogs += "\n<details>\n<summary>Backend Logs (Last 100 entries)</summary>\n\n```\n";
          descriptionWithLogs += backendLogs;
          descriptionWithLogs += "\n```\n</details>\n";
        }
      }

      // Sanitize and truncate to ensure we don't exceed backend limits
      descriptionWithLogs = sanitizeText(descriptionWithLogs);
      descriptionWithLogs = truncateText(descriptionWithLogs, ValidationLimits.DESCRIPTION_MAX_LENGTH);

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
   * Get feedback history
   * @returns {Promise<Array<Object>>} Feedback history list
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
   * Retry failed feedback
   * @param {string} id - Feedback ID
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
   * Delete feedback
   * @param {string} id - Feedback ID
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
   * Get system information
   * @param {string} [language] - Application language setting
   * @param {string} [screenResolution] - Screen resolution
   * @returns {Promise<Object>} System information
   */
  async getSystemInfo(language, screenResolution) {
    try {
      // Get language and resolution info
      const lang = language || document.documentElement.lang || "zh-CN";
      const resolution = screenResolution || `${window.screen.width}x${window.screen.height}`;

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

// Create singleton instance
export const feedbackService = new FeedbackService();
