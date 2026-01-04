//! 公共工具模块 - 提供跨模块共享的工具函数和类型
//! 优化版本：使用 Arc 减少克隆，增加缓存预热

use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Write};
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use uesave::{
    Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial, PropertyType,
    Save, ValueArray, ValueVec,
};

/// 缓存本地应用数据目录路径（使用 Arc 避免克隆）
static LOCAL_APPDATA_DIR: OnceLock<Arc<Result<PathBuf, String>>> = OnceLock::new();
static SAVE_GAMES_DIR: OnceLock<Arc<Result<PathBuf, String>>> = OnceLock::new();
static APP_CONFIG_DIR: OnceLock<Arc<Result<PathBuf, String>>> = OnceLock::new();

/// I/O 缓冲区大小（16KB 对于小文件更高效）
const IO_BUFFER_SIZE: usize = 16384;

/// 获取本地应用数据目录（带缓存，返回引用避免克隆）
#[inline]
pub fn get_local_appdata_dir() -> Result<PathBuf, String> {
    LOCAL_APPDATA_DIR
        .get_or_init(|| {
            Arc::new({
                #[cfg(target_os = "windows")]
                {
                    std::env::var("LOCALAPPDATA")
                        .map(PathBuf::from)
                        .map_err(|e| format!("获取 LOCALAPPDATA 失败: {}", e))
                }
                #[cfg(not(target_os = "windows"))]
                {
                    Err("仅支持 Windows 系统".to_string())
                }
            })
        })
        .as_ref()
        .clone()
}

/// 获取存档目录路径（带缓存）
#[inline]
pub fn get_save_games_dir() -> Result<PathBuf, String> {
    SAVE_GAMES_DIR
        .get_or_init(|| {
            Arc::new(get_local_appdata_dir().map(|p| p.join("EscapeTheBackrooms/Saved/SaveGames")))
        })
        .as_ref()
        .clone()
}

/// 获取 MAINSAVE.sav 文件路径（内联优化）
#[inline(always)]
pub fn get_mainsave_path() -> Result<PathBuf, String> {
    get_save_games_dir().map(|p| p.join("MAINSAVE.sav"))
}

/// 获取应用配置目录（带缓存）
#[inline]
pub fn get_app_config_dir() -> Result<PathBuf, String> {
    APP_CONFIG_DIR
        .get_or_init(|| Arc::new(get_local_appdata_dir().map(|p| p.join("ETBSaveManager"))))
        .as_ref()
        .clone()
}

/// 读取 MAINSAVE.sav 文件（优化缓冲区大小）
pub fn read_mainsave() -> Result<Save, String> {
    let mainsave_path = get_mainsave_path()?;

    let file = File::open(&mainsave_path).map_err(|e| format!("打开 MAINSAVE.sav 失败: {}", e))?;
    let mut reader = BufReader::with_capacity(IO_BUFFER_SIZE, file);

    Save::read(&mut reader).map_err(|e| format!("解析 MAINSAVE.sav 失败: {:?}", e))
}

/// 写入 MAINSAVE.sav 文件（使用临时文件确保原子性）
pub fn write_mainsave(save: &Save) -> Result<(), String> {
    let save_dir = get_save_games_dir()?;
    let mainsave_path = save_dir.join("MAINSAVE.sav");
    let temp_path = save_dir.join("MAINSAVE_temp.sav");

    // 写入临时文件
    let file =
        File::create(&temp_path).map_err(|e| format!("创建临时 MAINSAVE 文件失败: {}", e))?;
    let mut writer = BufWriter::with_capacity(IO_BUFFER_SIZE, file);

    save.write(&mut writer)
        .map_err(|e| format!("写入 MAINSAVE.sav 失败: {:?}", e))?;
    writer
        .flush()
        .map_err(|e| format!("刷新缓冲区失败: {}", e))?;

    // 原子替换
    fs::rename(&temp_path, &mainsave_path).map_err(|e| format!("替换 MAINSAVE.sav 失败: {}", e))
}

/// 获取 MAINSAVE 中的可见存档列表（预分配容量）
pub fn get_visible_saves_set() -> Result<HashSet<String>, String> {
    let mainsave = match read_mainsave() {
        Ok(save) => save,
        Err(_) => return Ok(HashSet::with_capacity(0)),
    };

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(prop) = mainsave.root.properties.0.get(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref saves))) = &prop.inner {
            let mut set = HashSet::with_capacity(saves.len());
            set.extend(saves.iter().cloned());
            return Ok(set);
        }
    }

    Ok(HashSet::with_capacity(0))
}

/// 从 MAINSAVE 的存档列表中添加存档名称
pub fn add_save_to_mainsave(archive_name: &str) -> Result<(), String> {
    let mut mainsave = match read_mainsave() {
        Ok(save) => save,
        Err(_) => return Ok(()), // 静默跳过
    };

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(prop) = mainsave.root.properties.0.get_mut(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut saves))) =
            &mut prop.inner
        {
            if saves.iter().any(|s| s == archive_name) {
                return Ok(()); // 已存在，无需操作
            }
            saves.push(archive_name.to_string());
        } else {
            return Err("SingleplayerSaves 字段格式不正确".to_string());
        }
    } else {
        let new_prop = Property {
            tag: PropertyTagPartial {
                id: None,
                data: PropertyTagDataPartial::Array(Box::new(PropertyTagDataPartial::Other(
                    PropertyType::StrProperty,
                ))),
            },
            inner: PropertyInner::Array(ValueArray::Base(ValueVec::Str(vec![
                archive_name.to_string()
            ]))),
        };
        mainsave.root.properties.0.insert(key, new_prop);
    }

    write_mainsave(&mainsave)
}

/// 从 MAINSAVE 的存档列表中移除存档名称
pub fn remove_save_from_mainsave(archive_name: &str) -> Result<bool, String> {
    let mut mainsave = match read_mainsave() {
        Ok(save) => save,
        Err(_) => return Ok(false),
    };

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(prop) = mainsave.root.properties.0.get_mut(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut saves))) =
            &mut prop.inner
        {
            let original_len = saves.len();
            saves.retain(|s| s != archive_name);
            if saves.len() < original_len {
                write_mainsave(&mainsave)?;
                return Ok(true);
            }
        }
    }

    Ok(false)
}

/// 从文件名中提取存档名称（去除 .sav 后缀）
#[inline(always)]
pub fn extract_archive_name(filename: &str) -> &str {
    filename.strip_suffix(".sav").unwrap_or(filename)
}
