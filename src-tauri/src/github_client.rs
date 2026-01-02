//! GitHub API Client Module
//!
//! Handles communication with GitHub GraphQL API for creating Discussions
//! and uploading attachments to GitHub Releases.

use crate::system_info::SystemInfo;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Result of creating a GitHub Discussion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscussionResult {
    pub id: String,
    pub url: String,
}

/// GitHub API client for feedback submissions
pub struct GitHubClient {
    client: Client,
    token: String,
    repo_owner: String,
    repo_name: String,
    repo_id: String,
    category_ids: HashMap<String, String>,
}

/// Feedback type to GitHub Discussion category mapping
#[derive(Debug, Clone, Copy)]
pub enum FeedbackType {
    Bug,
    Idea,
    General,
    Ui,
}

impl FeedbackType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "bug" | "bug reports" => Some(FeedbackType::Bug),
            "idea" | "ideas" => Some(FeedbackType::Idea),
            "general" => Some(FeedbackType::General),
            "ui" | "ui & experience" => Some(FeedbackType::Ui),
            _ => None,
        }
    }

    pub fn category_name(&self) -> &'static str {
        match self {
            FeedbackType::Bug => "Bug Reports",
            FeedbackType::Idea => "Ideas",
            FeedbackType::General => "General",
            FeedbackType::Ui => "UI & Experience",
        }
    }
}

impl GitHubClient {
    pub fn new(
        token: String,
        repo_owner: String,
        repo_name: String,
        repo_id: String,
        category_ids: HashMap<String, String>,
    ) -> Self {
        GitHubClient {
            client: Client::new(),
            token,
            repo_owner,
            repo_name,
            repo_id,
            category_ids,
        }
    }

    pub async fn create_discussion(
        &self,
        feedback_type: &str,
        severity: Option<&str>,
        title: &str,
        description: &str,
        system_info: &SystemInfo,
        attachment_urls: &[String],
        github_username: Option<&str>,
    ) -> Result<DiscussionResult, String> {
        let ft = FeedbackType::from_str(feedback_type)
            .ok_or_else(|| format!("Invalid feedback type: {}", feedback_type))?;

        let category_id = self
            .category_ids
            .get(ft.category_name())
            .ok_or_else(|| format!("Category ID not found for: {}", ft.category_name()))?;

        let formatted_title = format_discussion_title(feedback_type, severity, title);
        let body =
            format_discussion_body(description, system_info, attachment_urls, github_username);

        let query = r#"
            mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
                createDiscussion(input: {
                    repositoryId: $repositoryId,
                    categoryId: $categoryId,
                    title: $title,
                    body: $body
                }) {
                    discussion {
                        id
                        url
                    }
                }
            }
        "#;

        let variables = serde_json::json!({
            "repositoryId": self.repo_id,
            "categoryId": category_id,
            "title": formatted_title,
            "body": body
        });

        let request_body = serde_json::json!({
            "query": query,
            "variables": variables
        });

        let response = self
            .client
            .post("https://api.github.com/graphql")
            .header("Authorization", format!("Bearer {}", self.token))
            .header("User-Agent", "ETBSaveManager-Feedback")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("GitHub API error {}: {}", status, error_text));
        }

        let response_json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if let Some(errors) = response_json.get("errors") {
            return Err(format!("GraphQL errors: {}", errors));
        }

        let discussion = response_json
            .get("data")
            .and_then(|d| d.get("createDiscussion"))
            .and_then(|cd| cd.get("discussion"))
            .ok_or("Invalid response structure")?;

        let id = discussion
            .get("id")
            .and_then(|v| v.as_str())
            .ok_or("Missing discussion id")?
            .to_string();
        let url = discussion
            .get("url")
            .and_then(|v| v.as_str())
            .ok_or("Missing discussion url")?
            .to_string();

        Ok(DiscussionResult { id, url })
    }

    pub async fn upload_attachment(
        &self,
        file_name: &str,
        content: &[u8],
        mime_type: &str,
    ) -> Result<String, String> {
        // Get the latest release to upload assets to
        let releases_url = format!(
            "https://api.github.com/repos/{}/{}/releases/latest",
            self.repo_owner, self.repo_name
        );

        let release_response = self
            .client
            .get(&releases_url)
            .header("Authorization", format!("Bearer {}", self.token))
            .header("User-Agent", "ETBSaveManager-Feedback")
            .send()
            .await
            .map_err(|e| format!("Failed to get releases: {}", e))?;

        if !release_response.status().is_success() {
            return Err("No releases found or access denied".to_string());
        }

        let release: serde_json::Value = release_response
            .json()
            .await
            .map_err(|e| format!("Failed to parse release: {}", e))?;

        let upload_url = release
            .get("upload_url")
            .and_then(|v| v.as_str())
            .ok_or("Missing upload_url in release")?;

        // Remove the {?name,label} template part
        let upload_url = upload_url.split('{').next().unwrap_or(upload_url);
        let upload_url = format!("{}?name={}", upload_url, urlencoding::encode(file_name));

        let upload_response = self
            .client
            .post(&upload_url)
            .header("Authorization", format!("Bearer {}", self.token))
            .header("User-Agent", "ETBSaveManager-Feedback")
            .header("Content-Type", mime_type)
            .body(content.to_vec())
            .send()
            .await
            .map_err(|e| format!("Failed to upload attachment: {}", e))?;

        if !upload_response.status().is_success() {
            let error_text = upload_response.text().await.unwrap_or_default();
            return Err(format!("Upload failed: {}", error_text));
        }

        let asset: serde_json::Value = upload_response
            .json()
            .await
            .map_err(|e| format!("Failed to parse upload response: {}", e))?;

        let download_url = asset
            .get("browser_download_url")
            .and_then(|v| v.as_str())
            .ok_or("Missing download URL in response")?
            .to_string();

        Ok(download_url)
    }
}

/// Formats the discussion title according to the spec
/// Format: "[Type][Severity] User Title" (severity only for bug type)
pub fn format_discussion_title(feedback_type: &str, severity: Option<&str>, title: &str) -> String {
    let type_label = match feedback_type.to_lowercase().as_str() {
        "bug" | "bug reports" => "Bug",
        "idea" | "ideas" => "Idea",
        "general" => "General",
        "ui" | "ui & experience" => "UI",
        _ => "Feedback",
    };

    if feedback_type.to_lowercase().starts_with("bug") {
        if let Some(sev) = severity {
            let sev_label = match sev.to_lowercase().as_str() {
                "low" => "Low",
                "medium" => "Medium",
                "high" => "High",
                "critical" => "Critical",
                _ => sev,
            };
            return format!("[{}][{}] {}", type_label, sev_label, title);
        }
    }

    format!("[{}] {}", type_label, title)
}

/// Formats the discussion body with description, system info, and attachments
pub fn format_discussion_body(
    description: &str,
    system_info: &SystemInfo,
    attachment_urls: &[String],
    sender: Option<&str>,
) -> String {
    let mut body = String::new();

    // Add sender info if provided
    if let Some(name) = sender {
        if !name.trim().is_empty() {
            body.push_str(&format!("**From:** {}\n\n", name.trim()));
        }
    }

    // User description
    body.push_str("## User Feedback\n\n");
    body.push_str(description);
    body.push_str("\n\n---\n\n");

    // System info in collapsible section
    body.push_str("<details>\n<summary>System Information</summary>\n\n");
    body.push_str("| Item | Value |\n");
    body.push_str("|------|-------|\n");
    body.push_str(&format!(
        "| OS | {} {} |\n",
        system_info.os, system_info.os_version
    ));
    body.push_str(&format!("| App Version | {} |\n", system_info.app_version));
    body.push_str(&format!("| Language | {} |\n", system_info.language));
    body.push_str(&format!(
        "| Screen Resolution | {} |\n",
        system_info.screen_resolution
    ));
    body.push_str("\n</details>\n");

    // Attachments
    if !attachment_urls.is_empty() {
        body.push_str("\n## Attachments\n\n");
        for (i, url) in attachment_urls.iter().enumerate() {
            let ext = url.rsplit('.').next().unwrap_or("file").to_lowercase();
            if ["png", "jpg", "jpeg", "gif"].contains(&ext.as_str()) {
                body.push_str(&format!("![Attachment {}]({})\n", i + 1, url));
            } else {
                body.push_str(&format!("- [Attachment {}]({})\n", i + 1, url));
            }
        }
    }

    body.push_str("\n---\n*Submitted via ETBSaveManager Feedback System*");

    body
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_discussion_title_bug_with_severity() {
        let title = format_discussion_title("bug", Some("high"), "App crashes on startup");
        assert_eq!(title, "[Bug][High] App crashes on startup");
    }

    #[test]
    fn test_format_discussion_title_bug_without_severity() {
        let title = format_discussion_title("bug", None, "App crashes on startup");
        assert_eq!(title, "[Bug] App crashes on startup");
    }

    #[test]
    fn test_format_discussion_title_idea() {
        let title = format_discussion_title("idea", None, "Add dark mode");
        assert_eq!(title, "[Idea] Add dark mode");
    }

    #[test]
    fn test_format_discussion_title_general() {
        let title = format_discussion_title("general", None, "Question about feature");
        assert_eq!(title, "[General] Question about feature");
    }

    #[test]
    fn test_format_discussion_title_ui() {
        let title = format_discussion_title("ui", None, "Button too small");
        assert_eq!(title, "[UI] Button too small");
    }

    #[test]
    fn test_format_discussion_body_without_sender() {
        let system_info = SystemInfo {
            os: "Windows".to_string(),
            os_version: "10.0.19045".to_string(),
            app_version: "3.0.0".to_string(),
            language: "zh-CN".to_string(),
            screen_resolution: "1920x1080".to_string(),
        };

        let body = format_discussion_body("Test description", &system_info, &[], None);

        assert!(body.contains("## User Feedback"));
        assert!(body.contains("Test description"));
        assert!(body.contains("System Information"));
        assert!(body.contains("Windows 10.0.19045"));
        assert!(body.contains("3.0.0"));
        assert!(!body.contains("**From:**"));
    }

    #[test]
    fn test_format_discussion_body_with_sender() {
        let system_info = SystemInfo {
            os: "Windows".to_string(),
            os_version: "10.0".to_string(),
            app_version: "1.0.0".to_string(),
            language: "en-US".to_string(),
            screen_resolution: "1920x1080".to_string(),
        };

        let body = format_discussion_body("Test", &system_info, &[], Some("TestUser"));

        assert!(body.contains("**From:** TestUser"));
    }

    #[test]
    fn test_format_discussion_body_with_attachments() {
        let system_info = SystemInfo {
            os: "Windows".to_string(),
            os_version: "10.0".to_string(),
            app_version: "1.0.0".to_string(),
            language: "en-US".to_string(),
            screen_resolution: "1920x1080".to_string(),
        };

        let attachments = vec![
            "https://example.com/image.png".to_string(),
            "https://example.com/log.txt".to_string(),
        ];

        let body = format_discussion_body("Test", &system_info, &attachments, None);

        assert!(body.contains("## Attachments"));
        assert!(body.contains("![Attachment 1]"));
        assert!(body.contains("[Attachment 2]"));
    }

    #[test]
    fn test_feedback_type_from_str() {
        assert!(matches!(
            FeedbackType::from_str("bug"),
            Some(FeedbackType::Bug)
        ));
        assert!(matches!(
            FeedbackType::from_str("Bug Reports"),
            Some(FeedbackType::Bug)
        ));
        assert!(matches!(
            FeedbackType::from_str("idea"),
            Some(FeedbackType::Idea)
        ));
        assert!(matches!(
            FeedbackType::from_str("Ideas"),
            Some(FeedbackType::Idea)
        ));
        assert!(matches!(
            FeedbackType::from_str("general"),
            Some(FeedbackType::General)
        ));
        assert!(matches!(
            FeedbackType::from_str("ui"),
            Some(FeedbackType::Ui)
        ));
        assert!(matches!(
            FeedbackType::from_str("UI & Experience"),
            Some(FeedbackType::Ui)
        ));
        assert!(FeedbackType::from_str("invalid").is_none());
    }

    #[test]
    fn test_feedback_type_category_name() {
        assert_eq!(FeedbackType::Bug.category_name(), "Bug Reports");
        assert_eq!(FeedbackType::Idea.category_name(), "Ideas");
        assert_eq!(FeedbackType::General.category_name(), "General");
        assert_eq!(FeedbackType::Ui.category_name(), "UI & Experience");
    }
}
