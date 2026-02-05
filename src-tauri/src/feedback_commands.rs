//! Feedback Commands Module
//!
//! Tauri command handlers for the feedback system.
//! Provides commands for submitting feedback via Gist comments (no authentication required).

use crate::feedback_queue::{FeedbackQueue, FeedbackRecord, FeedbackStatus};
use crate::error::AppError;
use crate::error::AppResult;
use crate::system_info::SystemInfo;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::Mutex;
use tauri::State;

// ============================================
// 后端日志收集器（优化版）
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
    logs: Mutex<VecDeque<BackendLogEntry>>,
    max_logs: usize,
}

impl BackendLogState {
    pub fn new() -> Self {
        BackendLogState {
            logs: Mutex::new(VecDeque::with_capacity(100)),
            max_logs: 100,
        }
    }

    #[inline]
    pub fn add_log(&self, level: &str, message: &str) {
        if let Ok(mut logs) = self.logs.lock() {
            if logs.len() >= self.max_logs {
                logs.pop_front();
            }
            logs.push_back(BackendLogEntry {
                timestamp: Local::now().format("%H:%M:%S%.3f").to_string(),
                level: level.to_string(),
                message: message.to_string(),
            });
        }
    }

    pub fn get_logs_as_string(&self) -> String {
        if let Ok(logs) = self.logs.lock() {
            let mut result = String::with_capacity(logs.len() * 80);
            for log in logs.iter() {
                result.push('[');
                result.push_str(&log.timestamp);
                result.push_str("] ");
                result.push_str(&log.level.to_uppercase());
                result.push_str(": ");
                result.push_str(&log.message);
                result.push('\n');
            }
            result
        } else {
            String::new()
        }
    }
}

impl Default for BackendLogState {
    fn default() -> Self {
        Self::new()
    }
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

    pub fn init(&self, app_data_dir: &std::path::Path) -> AppResult<()> {
        let queue = FeedbackQueue::new(app_data_dir).map_err(|e| AppError {
            message: e.to_string(),
        })?;
        let mut guard = self.queue.lock().map_err(|e| AppError {
            message: e.to_string(),
        })?;
        *guard = Some(queue);
        Ok(())
    }

    pub fn with_queue<F, R>(&self, f: F) -> AppResult<R>
    where
        F: FnOnce(&FeedbackQueue) -> AppResult<R>,
    {
        let guard = self.queue.lock().map_err(|e| AppError {
            message: format!("Lock error: {}", e),
        })?;
        let queue = guard.as_ref().ok_or(AppError {
            message: "Feedback queue not initialized".to_string(),
        })?;
        f(queue)
    }
}

impl Default for FeedbackState {
    fn default() -> Self {
        Self::new()
    }
}

/// Cloudflare Worker URL for feedback
const WORKER_URL: &str = "https://etbsavemanager-feedback.llzgd.workers.dev";

/// Cloudflare Worker 反馈响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerResponse {
    pub success: bool,
    #[serde(default)]
    pub error: Option<String>,
}

/// Sends feedback to Cloudflare Worker
#[tauri::command]
pub async fn send_feedback(
    content: String,
    email: Option<String>,
) -> AppResult<WorkerResponse> {
    let client = reqwest::Client::new();

    let res = client
        .post(WORKER_URL)
        .header("User-Agent", "ETBSaveManager/3.0")
        .json(&serde_json::json!({
            "content": content,
            "email": email
        }))
        .send()
        .await
        .map_err(|e| AppError {
            message: format!("Network error: {}", e),
        })?;

    let status = res.status();
    let text = res.text().await.map_err(|e| AppError {
        message: e.to_string(),
    })?;

    if status.is_success() {
        let resp: WorkerResponse = serde_json::from_str(&text).map_err(|e| AppError {
            message: format!("Parse response error: {}", e),
        })?;
        Ok(resp)
    } else {
        Err(format!("Server error {}: {}", status, text).into())
    }
}

/// Submits feedback to Cloudflare Worker or queues it for later
#[tauri::command]
pub async fn submit_feedback(
    data: FeedbackData,
    language: String,
    screen_resolution: String,
    state: State<'_, FeedbackState>,
    _app_handle: tauri::AppHandle,
) -> AppResult<SubmitResult> {
    // Validate input
    validate_feedback_input(&data)?;

    // Collect system info
    let system_info = SystemInfo::collect(language, screen_resolution);

    // Format feedback content
    let content = format_feedback_content(&data, &system_info);

    // Create feedback record
    let mut record = FeedbackRecord::new(
        data.feedback_type.clone(),
        data.severity.clone(),
        data.title.clone(),
        data.description.clone(),
        system_info.clone(),
        vec![],
    );

    // Try to submit to Cloudflare Worker
    match send_feedback(content, data.sender.clone()).await {
        Ok(resp) if resp.success => {
            record.status = FeedbackStatus::Submitted.as_str().to_string();

            // Save to local history
            state.with_queue(|queue| {
                queue.enqueue(&record).map_err(|e| AppError {
                    message: e.to_string(),
                })
            })?;

            Ok(SubmitResult {
                success: true,
                feedback_id: record.id,
                queued: false,
                discussion_url: None,
                error: None,
            })
        }
        Ok(resp) => {
            let error_msg = resp.error.unwrap_or_else(|| "Unknown error".to_string());
            println!("Failed to submit feedback: {}", error_msg);

            // Queue for later submission (offline)
            state.with_queue(|queue| {
                queue.enqueue(&record).map_err(|e| AppError {
                    message: e.to_string(),
                })
            })?;

            Ok(SubmitResult {
                success: true,
                feedback_id: record.id,
                queued: true,
                discussion_url: None,
                error: Some(error_msg),
            })
        }
        Err(e) => {
            println!("Failed to submit feedback: {}", e);

            // Queue for later submission (offline)
            state.with_queue(|queue| {
                queue.enqueue(&record).map_err(|e| AppError {
                    message: e.to_string(),
                })
            })?;

            Ok(SubmitResult {
                success: true,
                feedback_id: record.id,
                queued: true,
                discussion_url: None,
                error: Some(e.to_string()),
            })
        }
    }
}

/// Formats feedback content for Worker
fn format_feedback_content(data: &FeedbackData, system_info: &SystemInfo) -> String {
    let mut content = String::new();

    // Title
    content.push_str(&format!("## {}\n\n", data.title));

    // Type and Severity
    content.push_str(&format!("**Type:** {}\n", data.feedback_type));
    if let Some(ref severity) = data.severity {
        content.push_str(&format!("**Severity:** {}\n", severity));
    }
    if let Some(ref sender) = data.sender {
        content.push_str(&format!("**From:** {}\n", sender));
    }
    content.push_str("\n");

    // Description
    content.push_str("### Description\n\n");
    content.push_str(&data.description);
    content.push_str("\n\n");

    // System Info
    content.push_str("### System Information\n\n");
    content.push_str(&format!(
        "- **OS:** {} {}\n",
        system_info.os, system_info.os_version
    ));
    content.push_str(&format!("- **App Version:** {}\n", system_info.app_version));
    content.push_str(&format!("- **Language:** {}\n", system_info.language));
    content.push_str(&format!(
        "- **Resolution:** {}\n",
        system_info.screen_resolution
    ));
    content.push_str(&format!(
        "- **Timestamp:** {}\n",
        Local::now().format("%Y-%m-%d %H:%M:%S")
    ));

    content
}

/// Gets the feedback history
#[tauri::command]
pub fn get_feedback_history(
    state: State<'_, FeedbackState>,
) -> AppResult<Vec<FeedbackHistoryItem>> {
    state.with_queue(|queue| {
        let records = queue.get_all().map_err(|e| AppError {
            message: e.to_string(),
        })?;
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
) -> AppResult<SubmitResult> {
    // Get the feedback record
    let record = state
        .with_queue(|queue| {
            queue.get_by_id(&id).map_err(|e| AppError {
                message: e.to_string(),
            })
        })?
        .ok_or_else(|| AppError {
            message: "Feedback not found".to_string(),
        })?;

    // Check if it can be retried
    if record.status != FeedbackStatus::Pending.as_str()
        && record.status != FeedbackStatus::Failed.as_str()
    {
        return Err(AppError {
            message: "Feedback cannot be retried".to_string(),
        });
    }

    // Format feedback content
    let content = format_feedback_content(
        &FeedbackData {
            feedback_type: record.feedback_type.clone(),
            severity: record.severity.clone(),
            sender: None,
            title: record.title.clone(),
            description: record.description.clone(),
        },
        &record.system_info,
    );

    // Try to submit to Cloudflare Worker
    match send_feedback(content, None).await {
        Ok(resp) if resp.success => {
            state.with_queue(|queue| {
                queue
                    .update_status(&id, FeedbackStatus::Submitted, None, None)
                    .map_err(|e| e.to_string().into())
            })?;

            Ok(SubmitResult {
                success: true,
                feedback_id: id,
                queued: false,
                discussion_url: None,
                error: None,
            })
        }
        Ok(resp) => {
            let error_msg = resp.error.unwrap_or_else(|| "Unknown error".to_string());

            // Increment retry count
            let retry_count = state
                .with_queue(|queue| queue.increment_retry_count(&id).map_err(|e| e.to_string().into()))?;

            // Mark as failed after 3 retries
            if retry_count >= 3 {
                state.with_queue(|queue| {
                    queue
                        .update_status(&id, FeedbackStatus::Failed, None, None)
                        .map_err(|e| e.to_string().into())
                })?;
            }

            Err(format!("Retry failed: {}", error_msg).into())
        }
        Err(e) => {
            // Increment retry count
            let retry_count = state
                .with_queue(|queue| queue.increment_retry_count(&id).map_err(|e| e.to_string().into()))?;

            // Mark as failed after 3 retries
            if retry_count >= 3 {
                state.with_queue(|queue| {
                    queue
                        .update_status(&id, FeedbackStatus::Failed, None, None)
                        .map_err(|e| e.to_string().into())
                })?;
            }

            Err(format!("Retry failed: {}", e).into())
        }
    }
}

/// Deletes a feedback entry
#[tauri::command]
pub fn delete_feedback(id: String, state: State<'_, FeedbackState>) -> AppResult<()> {
    Ok(state.with_queue(|queue| {
        queue.delete(&id).map_err(|e| AppError {
            message: e.to_string(),
        })
    })?)
}

/// Gets system information
#[tauri::command]
pub fn get_system_info(language: String, screen_resolution: String) -> SystemInfo {
    SystemInfo::collect(language, screen_resolution)
}

/// Validates feedback input data
fn validate_feedback_input(data: &FeedbackData) -> AppResult<()> {
    // Check required fields
    if data.title.trim().is_empty() {
        return Err("Title is required".to_string().into());
    }
    if data.description.trim().is_empty() {
        return Err("Description is required".to_string().into());
    }

    // Check length limits
    if data.title.len() > 100 {
        return Err(AppError {
            message: "Title must be 100 characters or less".to_string(),
        });
    }
    if data.description.len() > 60000 {
        return Err(AppError {
            message: "Description must be 60000 characters or less".to_string(),
        });
    }

    // Validate feedback type
    let valid_types = ["bug", "idea", "general", "ui"];
    if !valid_types.contains(&data.feedback_type.to_lowercase().as_str()) {
        return Err(AppError {
            message: "Invalid feedback type".to_string(),
        });
    }

    // Validate severity for bug type
    if data.feedback_type.to_lowercase() == "bug" {
        if let Some(ref severity) = data.severity {
            let valid_severities = ["low", "medium", "high", "critical"];
            if !valid_severities.contains(&severity.to_lowercase().as_str()) {
                return Err(AppError {
                    message: "Invalid severity level".to_string(),
                });
            }
        }
    }

    Ok(())
}

/// Gets backend logs for feedback
#[tauri::command]
pub fn get_backend_logs(log_state: State<'_, BackendLogState>) -> String {
    log_state.get_logs_as_string()
}

/// Adds a log entry to backend logs (for internal use)
#[tauri::command]
pub fn add_backend_log(level: String, message: String, log_state: State<'_, BackendLogState>) {
    // 打印到后端控制台
    match level.to_lowercase().as_str() {
        "error" => eprintln!("[Frontend ERROR] {}", message),
        "warn" => println!("[Frontend WARN] {}", message),
        "debug" => println!("[Frontend DEBUG] {}", message),
        _ => println!("[Frontend] {}", message),
    }
    // 同时保存到日志状态
    log_state.add_log(&level, &message);
}
