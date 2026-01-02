//! System Information Collection Module
//!
//! Collects non-PII system information for feedback submissions.
//! Only collects: OS, OS version, app version, language, screen resolution.
//! Explicitly does NOT collect: username, machine name, IP, MAC, hardware IDs, file paths.

use serde::{Deserialize, Serialize};
use std::env;

/// System information structure for feedback submissions.
/// Contains only non-personally identifiable information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    /// Operating system name (e.g., "Windows", "macOS", "Linux")
    pub os: String,
    /// Operating system version (e.g., "10.0.19045")
    pub os_version: String,
    /// Application version from Cargo.toml
    pub app_version: String,
    /// Current language setting (e.g., "zh-CN", "en-US")
    pub language: String,
    /// Screen resolution (e.g., "1920x1080")
    pub screen_resolution: String,
}

impl SystemInfo {
    /// Collects system information.
    ///
    /// # Arguments
    /// * `language` - The current app language setting from frontend
    /// * `screen_resolution` - The screen resolution from frontend
    ///
    /// # Returns
    /// A SystemInfo struct with all fields populated
    pub fn collect(language: String, screen_resolution: String) -> Self {
        SystemInfo {
            os: get_os_name(),
            os_version: get_os_version(),
            app_version: get_app_version(),
            language,
            screen_resolution,
        }
    }

    /// Validates that all required fields are non-empty.
    pub fn is_valid(&self) -> bool {
        !self.os.is_empty()
            && !self.os_version.is_empty()
            && !self.app_version.is_empty()
            && !self.language.is_empty()
            && !self.screen_resolution.is_empty()
    }
}

/// Gets the operating system name.
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
        get_windows_version()
    }
    #[cfg(target_os = "macos")]
    {
        get_macos_version()
    }
    #[cfg(target_os = "linux")]
    {
        get_linux_version()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        "Unknown".to_string()
    }
}

/// Gets Windows version from environment or registry.
#[cfg(target_os = "windows")]
fn get_windows_version() -> String {
    use std::process::Command;

    // Try to get version from systeminfo or ver command
    if let Ok(output) = Command::new("cmd").args(["/C", "ver"]).output() {
        if let Ok(version_str) = String::from_utf8(output.stdout) {
            // Parse version from "Microsoft Windows [Version 10.0.19045.3803]"
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

    // Fallback: try environment variable
    env::var("OS").unwrap_or_else(|_| "Windows".to_string())
}

/// Gets macOS version.
#[cfg(target_os = "macos")]
fn get_macos_version() -> String {
    use std::process::Command;

    if let Ok(output) = Command::new("sw_vers").arg("-productVersion").output() {
        if let Ok(version) = String::from_utf8(output.stdout) {
            return version.trim().to_string();
        }
    }
    "Unknown".to_string()
}

/// Gets Linux version from /etc/os-release.
#[cfg(target_os = "linux")]
fn get_linux_version() -> String {
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
        // Fallback to PRETTY_NAME
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

/// Gets the application version from Cargo.toml.
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

impl Default for SystemInfo {
    fn default() -> Self {
        SystemInfo {
            os: get_os_name(),
            os_version: get_os_version(),
            app_version: get_app_version(),
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
    fn test_system_info_is_valid() {
        let valid_info = SystemInfo::collect("en-US".to_string(), "2560x1440".to_string());
        assert!(valid_info.is_valid());

        let invalid_info = SystemInfo {
            os: "".to_string(),
            os_version: "10.0".to_string(),
            app_version: "1.0.0".to_string(),
            language: "en-US".to_string(),
            screen_resolution: "1920x1080".to_string(),
        };
        assert!(!invalid_info.is_valid());
    }

    #[test]
    fn test_app_version_not_empty() {
        let version = get_app_version();
        assert!(!version.is_empty());
    }

    #[test]
    fn test_os_name_known() {
        let os = get_os_name();
        assert!(["Windows", "macOS", "Linux", "Unknown"].contains(&os.as_str()));
    }
}
