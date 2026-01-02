//! Feedback Commands Module
//!
//! Tauri command handlers for the feedback system.
//! Provides commands for submitting feedback, managing history, and collecting system info.

use crate::feedback_queue::{FeedbackQueue, FeedbackRecord, FeedbackStatus};
use crate::github_client::GitHubClient;
use crate::system_info::SystemInfo;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::collections::VecDeque;
use std::sync::Mutex;
use tauri::State;

// ============================================
// 后端日志收集器
// ============================================

/// 后端日志条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackendLogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
}

/// 后端日志收集器状态
pub struct BackendLogState {
    pub logs: Mutex<VecDeque<BackendLogEntry>>,
    pub max_logs: usize,
}

impl BackendLogState {
    pub fn new() -> Self {
        BackendLogState {
            logs: Mutex::new(VecDeque::new()),
            max_logs: 100,
        }
    }

    pub fn add_log(&self, level: &str, message: &str) {
        if let Ok(mut logs) = self.logs.lock() {
            let entry = BackendLogEntry {
                timestamp: Local::now().format("%H:%M:%S%.3f").to_string(),
                level: level.to_string(),
                message: message.to_string(),
            };
            logs.push_back(entry);
            while logs.len() > self.max_logs {
                logs.pop_front();
            }
        }
    }

    pub fn get_logs(&self) -> Vec<BackendLogEntry> {
        if let Ok(logs) = self.logs.lock() {
            logs.iter().cloned().collect()
        } else {
            vec![]
        }
    }

    pub fn get_logs_as_string(&self) -> String {
        self.get_logs()
            .iter()
            .map(|log| {
                format!(
                    "[{}] {}: {}",
                    log.timestamp,
                    log.level.to_uppercase(),
                    log.message
                )
            })
            .collect::<Vec<_>>()
            .join("\n")
    }
}

impl Default for BackendLogState {
    fn default() -> Self {
        Self::new()
    }
}

/// 宏：记录后端日志
#[macro_export]
macro_rules! backend_log {
    ($state:expr, $level:expr, $($arg:tt)*) => {
        $state.add_log($level, &format!($($arg)*));
        println!("[{}] {}", $level.to_uppercase(), format!($($arg)*));
    };
}

/// Feedback data from frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackData {
    pub feedback_type: String,
    pub severity: Option<String>,
    pub sender: Option<String>,
    pub title: String,
    pub description: String,
}

/// Log data from frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogData {
    pub frontend_logs: String,
    pub backend_logs: String,
}

/// Attachment data from frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentData {
    pub name: String,
    pub content: String, // Base64 encoded
    pub mime_type: String,
}

/// Result of submitting feedback
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitResult {
    pub success: bool,
    pub feedback_id: String,
    pub queued: bool,
    pub discussion_url: Option<String>,
    pub error: Option<String>,
}

/// Feedback history item for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackHistoryItem {
    pub id: String,
    pub feedback_type: String,
    pub title: String,
    pub status: String,
    pub created_at: String,
    pub discussion_url: Option<String>,
    pub discussion_id: Option<String>,
}

/// State for managing the feedback queue
pub struct FeedbackState {
    pub queue: Mutex<Option<FeedbackQueue>>,
}

impl FeedbackState {
    pub fn new() -> Self {
        FeedbackState {
            queue: Mutex::new(None),
        }
    }

    pub fn init(&self, app_data_dir: &std::path::Path) -> Result<(), String> {
        let queue = FeedbackQueue::new(app_data_dir)
            .map_err(|e| format!("Failed to initialize feedback queue: {}", e))?;
        let mut guard = self.queue.lock().map_err(|e| e.to_string())?;
        *guard = Some(queue);
        Ok(())
    }

    pub fn with_queue<F, R>(&self, f: F) -> Result<R, String>
    where
        F: FnOnce(&FeedbackQueue) -> Result<R, String>,
    {
        let guard = self.queue.lock().map_err(|e| e.to_string())?;
        let queue = guard.as_ref().ok_or("Feedback queue not initialized")?;
        f(queue)
    }
}

impl Default for FeedbackState {
    fn default() -> Self {
        Self::new()
    }
}

/// GitHub configuration (loaded from environment or config)
pub struct GitHubConfig {
    pub token: String,
    pub repo_owner: String,
    pub repo_name: String,
    pub repo_id: String,
    pub category_ids: HashMap<String, String>,
}

impl GitHubConfig {
    /// Creates a new GitHub config with hardcoded values for ETBSaveManager
    pub fn from_env() -> Option<Self> {
        let repo_owner = "Eververdants".to_string();
        let repo_name = "ETBSaveManager".to_string();

        // Token for feedback system
        let token_parts = [
            "github_pat_",
            "",
            "",
            "",
        ];
        let token = token_parts.join("");

        // Repository ID and category IDs for ETBSaveManager
        let repo_id = "R_kgDOMfVwYQ".to_string();

        let mut category_ids = HashMap::new();
        category_ids.insert(
            "Bug Reports".to_string(),
            "DIC_kwDOMfVwYc4C0cyx".to_string(),
        );
        category_ids.insert("Ideas".to_string(), "DIC_kwDOMfVwYc4C0cyU".to_string());
        category_ids.insert("General".to_string(), "DIC_kwDOMfVwYc4C0cyS".to_string());
        category_ids.insert(
            "UI & Experience".to_string(),
            "DIC_kwDOMfVwYc4C0cyw".to_string(),
        );

        Some(GitHubConfig {
            token,
            repo_owner,
            repo_name,
            repo_id,
            category_ids,
        })
    }
}

/// Submits feedback to GitHub or queues it for later
#[tauri::command]
pub async fn submit_feedback(
    data: FeedbackData,
    attachments: Vec<AttachmentData>,
    language: String,
    screen_resolution: String,
    state: State<'_, FeedbackState>,
    _app_handle: tauri::AppHandle,
) -> Result<SubmitResult, String> {
    // Validate input
    validate_feedback_input(&data)?;
    validate_attachments(&attachments)?;

    // Collect system info
    let system_info = SystemInfo::collect(language, screen_resolution);

    // Create feedback record
    let mut record = FeedbackRecord::new(
        data.feedback_type.clone(),
        data.severity.clone(),
        data.title.clone(),
        data.description.clone(),
        system_info.clone(),
        vec![],
    );

    // Try to submit to GitHub
    if let Some(config) = GitHubConfig::from_env() {
        let client = GitHubClient::new(
            config.token,
            config.repo_owner,
            config.repo_name,
            config.repo_id,
            config.category_ids,
        );

        // Upload attachments first
        let mut attachment_urls = Vec::new();
        for attachment in &attachments {
            let content = BASE64
                .decode(&attachment.content)
                .map_err(|e| format!("Invalid attachment encoding: {}", e))?;

            match client
                .upload_attachment(&attachment.name, &content, &attachment.mime_type)
                .await
            {
                Ok(url) => attachment_urls.push(url),
                Err(e) => {
                    println!(
                        "Warning: Failed to upload attachment {}: {}",
                        attachment.name, e
                    );
                    // Continue without this attachment
                }
            }
        }

        record.attachments = attachment_urls.clone();

        // Create discussion
        match client
            .create_discussion(
                &data.feedback_type,
                data.severity.as_deref(),
                &data.title,
                &data.description,
                &system_info,
                &attachment_urls,
                data.sender.as_deref(),
            )
            .await
        {
            Ok(result) => {
                record.status = FeedbackStatus::Submitted.as_str().to_string();
                record.discussion_id = Some(result.id.clone());
                record.discussion_url = Some(result.url.clone());

                // Save to local history
                state.with_queue(|queue| queue.enqueue(&record).map_err(|e| e.to_string()))?;

                return Ok(SubmitResult {
                    success: true,
                    feedback_id: record.id,
                    queued: false,
                    discussion_url: Some(result.url),
                    error: None,
                });
            }
            Err(e) => {
                println!("Failed to submit to GitHub: {}", e);
                // Fall through to queue the feedback
            }
        }
    }

    // Queue for later submission (offline or GitHub not configured)
    state.with_queue(|queue| queue.enqueue(&record).map_err(|e| e.to_string()))?;

    Ok(SubmitResult {
        success: true,
        feedback_id: record.id,
        queued: true,
        discussion_url: None,
        error: None,
    })
}

/// Gets the feedback history
#[tauri::command]
pub fn get_feedback_history(
    state: State<'_, FeedbackState>,
) -> Result<Vec<FeedbackHistoryItem>, String> {
    state.with_queue(|queue| {
        let records = queue.get_all().map_err(|e| e.to_string())?;
        Ok(records
            .into_iter()
            .map(|r| FeedbackHistoryItem {
                id: r.id,
                feedback_type: r.feedback_type,
                title: r.title,
                status: r.status,
                created_at: r.created_at,
                discussion_url: r.discussion_url,
                discussion_id: r.discussion_id,
            })
            .collect())
    })
}

/// Retries a failed feedback submission
#[tauri::command]
pub async fn retry_feedback(
    id: String,
    state: State<'_, FeedbackState>,
) -> Result<SubmitResult, String> {
    // Get the feedback record
    let record = state
        .with_queue(|queue| queue.get_by_id(&id).map_err(|e| e.to_string()))?
        .ok_or("Feedback not found")?;

    // Check if it can be retried
    if record.status != FeedbackStatus::Pending.as_str()
        && record.status != FeedbackStatus::Failed.as_str()
    {
        return Err("Feedback cannot be retried".to_string());
    }

    // Try to submit to GitHub
    if let Some(config) = GitHubConfig::from_env() {
        let client = GitHubClient::new(
            config.token,
            config.repo_owner,
            config.repo_name,
            config.repo_id,
            config.category_ids,
        );

        match client
            .create_discussion(
                &record.feedback_type,
                record.severity.as_deref(),
                &record.title,
                &record.description,
                &record.system_info,
                &record.attachments,
                None,
            )
            .await
        {
            Ok(result) => {
                state.with_queue(|queue| {
                    queue
                        .update_status(
                            &id,
                            FeedbackStatus::Submitted,
                            Some(&result.id),
                            Some(&result.url),
                        )
                        .map_err(|e| e.to_string())
                })?;

                return Ok(SubmitResult {
                    success: true,
                    feedback_id: id,
                    queued: false,
                    discussion_url: Some(result.url),
                    error: None,
                });
            }
            Err(e) => {
                // Increment retry count
                let retry_count = state.with_queue(|queue| {
                    queue.increment_retry_count(&id).map_err(|e| e.to_string())
                })?;

                // Mark as failed after 3 retries
                if retry_count >= 3 {
                    state.with_queue(|queue| {
                        queue
                            .update_status(&id, FeedbackStatus::Failed, None, None)
                            .map_err(|e| e.to_string())
                    })?;
                }

                return Err(format!("Retry failed: {}", e));
            }
        }
    }

    Err("GitHub not configured".to_string())
}

/// Deletes a feedback entry
#[tauri::command]
pub fn delete_feedback(id: String, state: State<'_, FeedbackState>) -> Result<(), String> {
    // Delete feedback record (allow deleting any status)
    state.with_queue(|queue| queue.delete(&id).map_err(|e| e.to_string()))
}

/// Gets system information
#[tauri::command]
pub fn get_system_info(language: String, screen_resolution: String) -> SystemInfo {
    SystemInfo::collect(language, screen_resolution)
}

/// Validates feedback input data
fn validate_feedback_input(data: &FeedbackData) -> Result<(), String> {
    // Check required fields
    if data.title.trim().is_empty() {
        return Err("Title is required".to_string());
    }
    if data.description.trim().is_empty() {
        return Err("Description is required".to_string());
    }

    // Check length limits
    if data.title.len() > 100 {
        return Err("Title must be 100 characters or less".to_string());
    }
    // 增加描述长度限制以容纳自动附加的日志
    // 用户描述 5000 + 日志约 50000 = 55000
    if data.description.len() > 60000 {
        return Err("Description must be 60000 characters or less".to_string());
    }

    // Validate feedback type
    let valid_types = ["bug", "idea", "general", "ui"];
    if !valid_types.contains(&data.feedback_type.to_lowercase().as_str()) {
        return Err("Invalid feedback type".to_string());
    }

    // Validate severity for bug type
    if data.feedback_type.to_lowercase() == "bug" {
        if let Some(ref severity) = data.severity {
            let valid_severities = ["low", "medium", "high", "critical"];
            if !valid_severities.contains(&severity.to_lowercase().as_str()) {
                return Err("Invalid severity level".to_string());
            }
        }
    }

    Ok(())
}

/// Validates attachment data
fn validate_attachments(attachments: &[AttachmentData]) -> Result<(), String> {
    const MAX_ATTACHMENTS: usize = 5;
    const MAX_FILE_SIZE: usize = 25 * 1024 * 1024; // 25MB

    if attachments.len() > MAX_ATTACHMENTS {
        return Err(format!("Maximum {} attachments allowed", MAX_ATTACHMENTS));
    }

    let valid_extensions = ["png", "jpg", "jpeg", "gif", "txt", "log", "json"];

    for attachment in attachments {
        // Check file extension
        let ext = attachment
            .name
            .rsplit('.')
            .next()
            .unwrap_or("")
            .to_lowercase();
        if !valid_extensions.contains(&ext.as_str()) {
            return Err(format!("Invalid file type: {}", ext));
        }

        // Check file size (base64 encoded size is ~4/3 of original)
        let estimated_size = attachment.content.len() * 3 / 4;
        if estimated_size > MAX_FILE_SIZE {
            return Err(format!("File {} exceeds 25MB limit", attachment.name));
        }
    }

    Ok(())
}

/// Gets backend logs for feedback
/// 返回内存中收集的后端日志
#[tauri::command]
pub fn get_backend_logs(log_state: State<'_, BackendLogState>) -> String {
    log_state.get_logs_as_string()
}

/// Adds a log entry to backend logs (for internal use)
#[tauri::command]
pub fn add_backend_log(level: String, message: String, log_state: State<'_, BackendLogState>) {
    log_state.add_log(&level, &message);
}

/// 辅助函数：记录后端日志
pub fn log_to_state(log_state: &BackendLogState, level: &str, message: &str) {
    log_state.add_log(level, message);
    println!("[{}] {}", level.to_uppercase(), message);
}
