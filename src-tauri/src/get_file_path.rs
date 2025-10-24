use regex::Regex;
use std::env;
use std::path::PathBuf;
use walkdir::WalkDir;
use std::fs;
use uesave::Save;
use std::io::BufReader;
use uesave::PropertyKey;

pub fn list_save_paths() -> Result<Vec<PathBuf>, String> {
    let mut saves = Vec::new();

    // 获取 %LOCALAPPDATA%\EscapeTheBackrooms\Saved\SaveGames\
    let local_appdata = env::var("LOCALAPPDATA").map_err(|e| e.to_string())?;
    let base_dir = PathBuf::from(local_appdata).join("EscapeTheBackrooms/Saved/SaveGames");

    if !base_dir.exists() {
        return Err("未找到存档目录".to_string());
    }

    let re =
        Regex::new(r"(?i)^(MULTIPLAYER|SINGLEPLAYER)_(.+?)_(Easy|Normal|Hard|Nightmare|\d+)\.sav$")
            .map_err(|e| e.to_string())?;

    // 读取 MAINSAVE.sav 文件获取存档列表
    let mainsave_path = base_dir.join("MAINSAVE.sav");
    let visible_saves = if mainsave_path.exists() {
        match fs::File::open(&mainsave_path) {
            Ok(file) => {
                let mut reader = BufReader::new(file);
                match Save::read(&mut reader) {
                    Ok(mainsave) => {
                        // 查找 SingleplayerSaves 字段
                        let singleplayer_saves_key = PropertyKey(0, "SingleplayerSaves".to_string());
                        if let Some(singleplayer_saves_prop) = mainsave.root.properties.0.get(&singleplayer_saves_key) {
                            if let uesave::PropertyInner::Array(uesave::ValueArray::Base(uesave::ValueVec::Str(ref existing_saves))) = &singleplayer_saves_prop.inner {
                                // 调试输出：显示MAINSAVE中的存档名称
                                println!("=== MAINSAVE.sav 中的可见存档列表 ===");
                                for (i, save_name) in existing_saves.iter().enumerate() {
                                    println!("  [{}] {}", i + 1, save_name);
                                }
                                println!("MAINSAVE中共有 {} 个可见存档", existing_saves.len());
                                
                                // 收集所有可见的存档名称（不带.sav后缀）
                                existing_saves.iter().cloned().collect::<std::collections::HashSet<String>>()
                            } else {
                                println!("MAINSAVE.sav 中 SingleplayerSaves 字段格式不正确");
                                std::collections::HashSet::new()
                            }
                        } else {
                            println!("MAINSAVE.sav 中未找到 SingleplayerSaves 字段");
                            std::collections::HashSet::new()
                        }
                    }
                    Err(e) => {
                        eprintln!("解析 MAINSAVE.sav 失败: {:?}，将显示所有存档", e);
                        std::collections::HashSet::new()
                    }
                }
            }
            Err(e) => {
                eprintln!("打开 MAINSAVE.sav 失败: {}，将显示所有存档", e);
                std::collections::HashSet::new()
            }
        }
    } else {
        println!("MAINSAVE.sav 文件不存在: {:?}，将显示所有单人存档", mainsave_path);
        std::collections::HashSet::new()
    };

    // 递归遍历所有子目录
    println!("=== 开始扫描存档文件 ===");
    let mut total_files = 0;
    let mut multiplayer_files = 0;
    let mut singleplayer_files = 0;
    let _filtered_out_files = 0;
    
    for entry in WalkDir::new(&base_dir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.into_path();
        if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
            if re.is_match(name) {
                total_files += 1;
                
                // 检查是否为多人模式存档，所有存档都添加，但记录可见性状态
                if name.to_uppercase().starts_with("MULTIPLAYER_") {
                    multiplayer_files += 1;
                    
                    // 多人模式存档，检查是否在MAINSAVE的列表中
                    let save_name_without_ext = name.trim_end_matches(".sav");
                    let is_visible = visible_saves.contains(save_name_without_ext);
                    
                    if is_visible {
                        println!("  [多人-可见] {} - 已添加", save_name_without_ext);
                    } else {
                        println!("  [多人-隐藏] {} - 已添加（但在MAINSAVE中标记为隐藏）", save_name_without_ext);
                    }
                    
                    saves.push(path);
                } else if name.to_uppercase().starts_with("SINGLEPLAYER_") {
                    singleplayer_files += 1;
                    
                    // 单人模式存档，检查是否在MAINSAVE的列表中
                    let save_name_without_ext = name.trim_end_matches(".sav");
                    let is_visible = visible_saves.contains(save_name_without_ext);
                    
                    if is_visible {
                        println!("  [单人-可见] {} - 已添加", save_name_without_ext);
                    } else {
                        println!("  [单人-隐藏] {} - 已添加（但在MAINSAVE中标记为隐藏）", save_name_without_ext);
                    }
                    
                    saves.push(path);
                }
            }
        }
    }
    
    println!("=== 扫描完成 ===");
    println!("总计扫描到 {} 个符合格式的存档文件", total_files);
    println!("其中多人模式: {} 个，单人模式: {} 个", multiplayer_files, singleplayer_files);
    println!("最终添加到列表的存档: {} 个", saves.len());

    Ok(saves)
}
