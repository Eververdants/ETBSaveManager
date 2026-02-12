//! Feedback Queue Module
//!
//! Manages offline storage of feedback submissions using SQLite.
//! Optimized version with prepared statements and reduced allocations.

use crate::system_info::SystemInfo;
use chrono::Utc;
use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::Path;
use uuid::Uuid;

/// Feedback status enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FeedbackStatus {
    Pending,
    Submitted,
    Failed,
}

impl FeedbackStatus {
    #[inline]
    pub fn as_str(&self) -> &'static str {
        match self {
            FeedbackStatus::Pending => "pending",
            FeedbackStatus::Submitted => "submitted",
            FeedbackStatus::Failed => "failed",
        }
    }
}

/// Feedback record stored in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackRecord {
    pub id: String,
    pub feedback_type: String,
    pub severity: Option<String>,
    pub title: String,
    pub description: String,
    pub system_info: SystemInfo,
    pub attachments: Vec<String>,
    pub status: String,
    pub discussion_id: Option<String>,
    pub discussion_url: Option<String>,
    pub retry_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

impl FeedbackRecord {
    /// Creates a new feedback record with a unique ID
    pub fn new(
        feedback_type: String,
        severity: Option<String>,
        title: String,
        description: String,
        system_info: SystemInfo,
        attachments: Vec<String>,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        FeedbackRecord {
            id: Uuid::new_v4().to_string(),
            feedback_type,
            severity,
            title,
            description,
            system_info,
            attachments,
            status: FeedbackStatus::Pending.as_str().to_string(),
            discussion_id: None,
            discussion_url: None,
            retry_count: 0,
            created_at: now.clone(),
            updated_at: now,
        }
    }
}

/// Feedback queue manager using SQLite
pub struct FeedbackQueue {
    conn: Connection,
}

/// Lightweight feedback history row (no system_info parsing)
#[derive(Debug, Clone)]
pub struct FeedbackHistoryRow {
    pub id: String,
    pub feedback_type: String,
    pub title: String,
    pub status: String,
    pub created_at: String,
    pub discussion_url: Option<String>,
    pub discussion_id: Option<String>,
}

impl FeedbackQueue {
    /// Creates a new FeedbackQueue with the database in the specified directory
    pub fn new(app_data_dir: &Path) -> SqliteResult<Self> {
        let db_path = app_data_dir.join("feedback_queue.db");
        let conn = Connection::open(&db_path)?;

        // 启用 WAL 模式提升并发性能
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")?;

        let queue = FeedbackQueue { conn };
        queue.init_schema()?;

        Ok(queue)
    }

    /// Creates a new FeedbackQueue with an in-memory database (for testing)
    #[cfg(test)]
    pub fn new_in_memory() -> SqliteResult<Self> {
        let conn = Connection::open_in_memory()?;
        let queue = FeedbackQueue { conn };
        queue.init_schema()?;
        Ok(queue)
    }

    /// Initializes the database schema
    fn init_schema(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS feedbacks (
                id TEXT PRIMARY KEY,
                feedback_type TEXT NOT NULL,
                severity TEXT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                system_info TEXT NOT NULL,
                attachments TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                discussion_id TEXT,
                discussion_url TEXT,
                retry_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
            CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);",
        )
    }

    /// Adds a feedback record to the queue
    pub fn enqueue(&self, feedback: &FeedbackRecord) -> SqliteResult<()> {
        let system_info_json = serde_json::to_string(&feedback.system_info)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        let attachments_json = serde_json::to_string(&feedback.attachments)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        self.conn.execute(
            "INSERT INTO feedbacks (
                id, feedback_type, severity, title, description,
                system_info, attachments, status, discussion_id,
                discussion_url, retry_count, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                feedback.id,
                feedback.feedback_type,
                feedback.severity,
                feedback.title,
                feedback.description,
                system_info_json,
                attachments_json,
                feedback.status,
                feedback.discussion_id,
                feedback.discussion_url,
                feedback.retry_count,
                feedback.created_at,
                feedback.updated_at,
            ],
        )?;

        Ok(())
    }

    /// Updates the status of a feedback record
    pub fn update_status(
        &self,
        id: &str,
        status: FeedbackStatus,
        discussion_id: Option<&str>,
        discussion_url: Option<&str>,
    ) -> SqliteResult<()> {
        let now = Utc::now().to_rfc3339();

        self.conn.execute(
            "UPDATE feedbacks SET status = ?1, discussion_id = ?2,
             discussion_url = ?3, updated_at = ?4 WHERE id = ?5",
            params![status.as_str(), discussion_id, discussion_url, now, id],
        )?;

        Ok(())
    }

    /// Increments the retry count for a feedback record
    pub fn increment_retry_count(&self, id: &str) -> SqliteResult<i32> {
        let now = Utc::now().to_rfc3339();

        self.conn.query_row(
            "UPDATE feedbacks
             SET retry_count = retry_count + 1, updated_at = ?1
             WHERE id = ?2
             RETURNING retry_count",
            params![now, id],
            |row| row.get(0),
        )
    }

    /// Deletes a feedback record
    pub fn delete(&self, id: &str) -> SqliteResult<()> {
        self.conn
            .execute("DELETE FROM feedbacks WHERE id = ?1", [id])?;
        Ok(())
    }

    /// Gets all feedback records
    #[cfg(test)]
    pub fn get_all(&self) -> SqliteResult<Vec<FeedbackRecord>> {
        let mut stmt = self.conn.prepare_cached(
            "SELECT id, feedback_type, severity, title, description,
                    system_info, attachments, status, discussion_id,
                    discussion_url, retry_count, created_at, updated_at
             FROM feedbacks ORDER BY created_at DESC",
        )?;

        let records = stmt.query_map([], |row| self.row_to_record(row))?;
        records.collect()
    }

    /// Gets lightweight feedback history rows with a limit and offset
    pub fn get_history_rows(
        &self,
        limit: usize,
        offset: usize,
    ) -> SqliteResult<Vec<FeedbackHistoryRow>> {
        let mut stmt = self.conn.prepare_cached(
            "SELECT id, feedback_type, title, status, created_at, discussion_url, discussion_id
             FROM feedbacks ORDER BY created_at DESC LIMIT ?1 OFFSET ?2",
        )?;

        let limit_value = i64::try_from(limit).unwrap_or(200);
        let offset_value = i64::try_from(offset).unwrap_or(0);
        let rows = stmt.query_map([limit_value, offset_value], |row| {
            Ok(FeedbackHistoryRow {
                id: row.get(0)?,
                feedback_type: row.get(1)?,
                title: row.get(2)?,
                status: row.get(3)?,
                created_at: row.get(4)?,
                discussion_url: row.get(5)?,
                discussion_id: row.get(6)?,
            })
        })?;

        rows.collect()
    }

    /// Gets a single feedback record by ID
    pub fn get_by_id(&self, id: &str) -> SqliteResult<Option<FeedbackRecord>> {
        let mut stmt = self.conn.prepare_cached(
            "SELECT id, feedback_type, severity, title, description,
                    system_info, attachments, status, discussion_id,
                    discussion_url, retry_count, created_at, updated_at
             FROM feedbacks WHERE id = ?1",
        )?;

        let mut rows = stmt.query([id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(self.row_to_record(row)?))
        } else {
            Ok(None)
        }
    }

    /// Converts a database row to a FeedbackRecord
    fn row_to_record(&self, row: &rusqlite::Row) -> SqliteResult<FeedbackRecord> {
        let system_info_str: String = row.get(5)?;
        let attachments_str: String = row.get(6)?;

        let system_info: SystemInfo = serde_json::from_str(&system_info_str).map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(5, rusqlite::types::Type::Text, Box::new(e))
        })?;

        let attachments: Vec<String> = serde_json::from_str(&attachments_str).map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(6, rusqlite::types::Type::Text, Box::new(e))
        })?;

        Ok(FeedbackRecord {
            id: row.get(0)?,
            feedback_type: row.get(1)?,
            severity: row.get(2)?,
            title: row.get(3)?,
            description: row.get(4)?,
            system_info,
            attachments,
            status: row.get(7)?,
            discussion_id: row.get(8)?,
            discussion_url: row.get(9)?,
            retry_count: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_feedback() -> FeedbackRecord {
        FeedbackRecord::new(
            "bug".to_string(),
            Some("high".to_string()),
            "Test Bug".to_string(),
            "This is a test bug description".to_string(),
            SystemInfo::collect("zh-CN".to_string(), "1920x1080".to_string()),
            vec![],
        )
    }

    #[test]
    fn test_enqueue_and_get_all() {
        let queue = FeedbackQueue::new_in_memory().unwrap();
        let feedback = create_test_feedback();

        queue.enqueue(&feedback).unwrap();

        let all = queue.get_all().unwrap();
        assert_eq!(all.len(), 1);
        assert_eq!(all[0].id, feedback.id);
        assert_eq!(all[0].title, "Test Bug");
    }

    #[test]
    fn test_update_status() {
        let queue = FeedbackQueue::new_in_memory().unwrap();
        let feedback = create_test_feedback();

        queue.enqueue(&feedback).unwrap();
        queue
            .update_status(
                &feedback.id,
                FeedbackStatus::Submitted,
                Some("D_123"),
                Some("https://github.com/test/discussions/1"),
            )
            .unwrap();

        let record = queue.get_by_id(&feedback.id).unwrap().unwrap();
        assert_eq!(record.status, "submitted");
        assert_eq!(record.discussion_id, Some("D_123".to_string()));
    }

    #[test]
    fn test_delete() {
        let queue = FeedbackQueue::new_in_memory().unwrap();
        let feedback = create_test_feedback();

        queue.enqueue(&feedback).unwrap();
        assert_eq!(queue.get_all().unwrap().len(), 1);

        queue.delete(&feedback.id).unwrap();
        assert_eq!(queue.get_all().unwrap().len(), 0);
    }

    #[test]
    fn test_increment_retry_count() {
        let queue = FeedbackQueue::new_in_memory().unwrap();
        let feedback = create_test_feedback();

        queue.enqueue(&feedback).unwrap();

        let count1 = queue.increment_retry_count(&feedback.id).unwrap();
        assert_eq!(count1, 1);

        let count2 = queue.increment_retry_count(&feedback.id).unwrap();
        assert_eq!(count2, 2);
    }

    #[test]
    fn test_feedback_id_uniqueness() {
        let f1 = create_test_feedback();
        let f2 = create_test_feedback();
        assert_ne!(f1.id, f2.id);
    }
}
