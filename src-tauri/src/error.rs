use serde::Serialize;
use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Clone, Serialize, Error)]
#[error("{message}")]
pub struct AppError {
    pub message: String,
}

impl From<String> for AppError {
    fn from(value: String) -> Self {
        Self { message: value }
    }
}

impl From<&str> for AppError {
    fn from(value: &str) -> Self {
        Self {
            message: value.to_string(),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(value: std::io::Error) -> Self {
        Self {
            message: value.to_string(),
        }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(value: serde_json::Error) -> Self {
        Self {
            message: value.to_string(),
        }
    }
}

impl From<std::env::VarError> for AppError {
    fn from(value: std::env::VarError) -> Self {
        Self {
            message: value.to_string(),
        }
    }
}
