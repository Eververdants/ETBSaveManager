//! 公共工具模块 - 提供跨模块共享的工具函数和类型

use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Write};
use std::path::PathBuf;
use std::sync::OnceLock;
use uesave::{
    Property, PropertyInner, PropertyKey, PropertyTagDataPartial, PropertyTagPartial, PropertyType,
    Save, ValueArray, ValueVec,
};

/// 缓存本地应用数据目录路径
static LOCAL_APPDATA_DIR: OnceLock<Result<PathBuf, String>> = OnceLock::new();
static SAVE_GAMES_DIR: OnceLock<Result<PathBuf, String>> = OnceLock::new();
static APP_CONFIG_DIR: OnceLock<Result<PathBuf, String>> = OnceLock::new();

/// 获取本地应用数据目录（带缓存）
pub fn get_local_appdata_dir() -> Result<PathBuf, String> {
    LOCAL_APPDATA_DIR
        .get_or_init(|| {
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
        .clone()
}

/// 获取存档目录路径（带缓存）
pub fn get_save_games_dir() -> Result<PathBuf, String> {
    SAVE_GAMES_DIR
        .get_or_init(|| {
            get_local_appdata_dir().map(|p| p.join("EscapeTheBackrooms/Saved/SaveGames"))
        })
        .clone()
}

/// 获取 MAINSAVE.sav 文件路径
#[inline]
pub fn get_mainsave_path() -> Result<PathBuf, String> {
    get_save_games_dir().map(|p| p.join("MAINSAVE.sav"))
}

/// 获取应用配置目录（带缓存）
pub fn get_app_config_dir() -> Result<PathBuf, String> {
    APP_CONFIG_DIR
        .get_or_init(|| get_local_appdata_dir().map(|p| p.join("ETBSaveManager")))
        .clone()
}

/// 读取 MAINSAVE.sav 文件
pub fn read_mainsave() -> Result<Save, String> {
    let mainsave_path = get_mainsave_path()?;

    if !mainsave_path.exists() {
        return Err("MAINSAVE.sav 文件不存在".to_string());
    }

    let file = File::open(&mainsave_path).map_err(|e| format!("打开 MAINSAVE.sav 失败: {}", e))?;
    let mut reader = BufReader::with_capacity(8192, file);

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
    let mut writer = BufWriter::with_capacity(8192, file);

    save.write(&mut writer)
        .map_err(|e| format!("写入 MAINSAVE.sav 失败: {:?}", e))?;
    writer
        .flush()
        .map_err(|e| format!("刷新缓冲区失败: {}", e))?;

    // 原子替换
    fs::rename(&temp_path, &mainsave_path).map_err(|e| format!("替换 MAINSAVE.sav 失败: {}", e))?;

    Ok(())
}

/// 获取 MAINSAVE 中的可见存档列表
pub fn get_visible_saves_set() -> Result<HashSet<String>, String> {
    let mainsave = match read_mainsave() {
        Ok(save) => save,
        Err(_) => return Ok(HashSet::new()),
    };

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(prop) = mainsave.root.properties.0.get(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref saves))) = &prop.inner {
            return Ok(saves.iter().cloned().collect());
        }
    }

    Ok(HashSet::new())
}

/// 从 MAINSAVE 的存档列表中添加存档名称
pub fn add_save_to_mainsave(archive_name: &str) -> Result<(), String> {
    let mut mainsave = match read_mainsave() {
        Ok(save) => save,
        Err(_) => {
            println!("⚠️ MAINSAVE.sav 不存在，跳过更新");
            return Ok(());
        }
    };

    let key = PropertyKey(0, "SingleplayerSaves".to_string());

    if let Some(prop) = mainsave.root.properties.0.get_mut(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut saves))) =
            &mut prop.inner
        {
            if !saves.iter().any(|s| s == archive_name) {
                saves.push(archive_name.to_string());
                println!("✅ 已添加存档到 MAINSAVE: {}", archive_name);
            } else {
                println!("ℹ️ 存档已存在于 MAINSAVE: {}", archive_name);
                return Ok(());
            }
        } else {
            return Err("SingleplayerSaves 字段格式不正确".to_string());
        }
    } else {
        // 创建新的 SingleplayerSaves 字段
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
        println!("✅ 已创建 SingleplayerSaves 并添加: {}", archive_name);
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
    let mut removed = false;

    if let Some(prop) = mainsave.root.properties.0.get_mut(&key) {
        if let PropertyInner::Array(ValueArray::Base(ValueVec::Str(ref mut saves))) =
            &mut prop.inner
        {
            let original_len = saves.len();
            saves.retain(|s| s != archive_name);
            removed = saves.len() < original_len;
        }
    }

    if removed {
        write_mainsave(&mainsave)?;
        println!("✅ 已从 MAINSAVE 移除: {}", archive_name);
    }

    Ok(removed)
}

/// 从文件名中提取存档名称（去除 .sav 后缀）
#[inline]
pub fn extract_archive_name(filename: &str) -> &str {
    filename.strip_suffix(".sav").unwrap_or(filename)
}

/// 统一的错误类型转换宏
#[macro_export]
macro_rules! map_err {
    ($expr:expr, $msg:literal) => {
        $expr.map_err(|e| format!("{}: {}", $msg, e))
    };
}
