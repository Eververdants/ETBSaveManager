//! System Information Collection Module
//!
//! Collects non-PII system information for feedback submissions.
//! Optimized version with reduced allocations.

use serde::{Deserialize, Serialize};
use std::env;

/// System information structure for feedback submissions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub os_version: String,
    pub app_version: String,
    pub language: String,
    pub screen_resolution: String,
}

impl SystemInfo {
    /// Collects system information.
    #[inline]
    pub fn collect(language: String, screen_resolution: String) -> Self {
        SystemInfo {
            os: get_os_name(),
            os_version: get_os_version(),
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            language,
            screen_resolution,
        }
    }
}

/// Gets the operating system name.
#[inline]
fn get_os_name() -> String {
    #[cfg(target_os = "windows")]
    {
        "Windows".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        "macOS".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        "Linux".to_string()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        "Unknown".to_string()
    }
}

/// Gets the operating system version.
fn get_os_version() -> String {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("cmd").args(["/C", "ver"]).output() {
            if let Ok(version_str) = String::from_utf8(output.stdout) {
                if let Some(start) = version_str.find('[') {
                    if let Some(end) = version_str.find(']') {
                        let version_part = &version_str[start + 1..end];
                        if let Some(ver) = version_part.strip_prefix("Version ") {
                            return ver.trim().to_string();
                        }
                    }
                }
            }
        }
        env::var("OS").unwrap_or_else(|_| "Windows".to_string())
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("sw_vers").arg("-productVersion").output() {
            if let Ok(version) = String::from_utf8(output.stdout) {
                return version.trim().to_string();
            }
        }
        "Unknown".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        use std::fs;
        if let Ok(content) = fs::read_to_string("/etc/os-release") {
            for line in content.lines() {
                if line.starts_with("VERSION_ID=") {
                    return line
                        .trim_start_matches("VERSION_ID=")
                        .trim_matches('"')
                        .to_string();
                }
            }
            for line in content.lines() {
                if line.starts_with("PRETTY_NAME=") {
                    return line
                        .trim_start_matches("PRETTY_NAME=")
                        .trim_matches('"')
                        .to_string();
                }
            }
        }
        "Unknown".to_string()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        "Unknown".to_string()
    }
}

impl Default for SystemInfo {
    fn default() -> Self {
        SystemInfo {
            os: get_os_name(),
            os_version: get_os_version(),
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            language: "unknown".to_string(),
            screen_resolution: "unknown".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_info_collect() {
        let info = SystemInfo::collect("zh-CN".to_string(), "1920x1080".to_string());
        assert!(!info.os.is_empty());
        assert!(!info.os_version.is_empty());
        assert!(!info.app_version.is_empty());
        assert_eq!(info.language, "zh-CN");
        assert_eq!(info.screen_resolution, "1920x1080");
    }

    #[test]
    fn test_os_name_known() {
        let os = get_os_name();
        assert!(["Windows", "macOS", "Linux", "Unknown"].contains(&os.as_str()));
    }
}
