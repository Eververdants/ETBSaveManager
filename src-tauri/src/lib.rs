use std::env;
use std::path::PathBuf;
use std::fs;
use regex::Regex;
use serde::{Deserialize, Serialize};
use hex;

#[derive(Deserialize, Debug)] // 添加 Debug 衍生特性
struct DifficultyData {
    easy: String,
    hard: String,
    nightmare: String,
    normal: String,
}

// 添加一个新的结构体用于返回存档信息
#[derive(Serialize)]
struct SaveGameInfo {
    file_name: String,
    game_mode: String,
    game_name: String,
    game_difficulty: String,
    actual_difficulty: String,
    is_in_subfolder: bool,
    file_path: String,
}

#[tauri::command]
fn get_save_games() -> Result<Vec<SaveGameInfo>, String> {
    // 获取 LOCALAPPDATA 环境变量
    let local_app_data = env::var("LOCALAPPDATA").map_err(|e| {
        println!("无法获取 LOCALAPPDATA 环境变量: {}", e);
        e.to_string()
    })?;

    // 拼接目标文件夹路径
    let mut save_games_path = PathBuf::from(local_app_data);
    save_games_path.push("EscapeTheBackrooms");
    save_games_path.push("Saved");
    save_games_path.push("SaveGames");

    println!("正在查找存档路径: {}", save_games_path.display());

    if !save_games_path.exists() {
        println!("存档路径不存在: {}", save_games_path.display());
        return Err(format!("存档路径不存在: {}", save_games_path.display()));
    }

    // 替换原有的 resolve_path 调用
    let mut difficulty_json_path = std::env::current_dir()
        .map_err(|e| {
            println!("无法获取当前目录: {}", e);
            e.to_string()
        })?;

    difficulty_json_path.pop();
    difficulty_json_path.push("public");
    difficulty_json_path.push("difficulty.json");

    if !difficulty_json_path.exists() {
        println!(
            "difficulty.json 文件不存在，请检查 public 文件夹: {}",
            difficulty_json_path.display()
        );
        return Err("difficulty.json 文件不存在，请检查 public 文件夹".to_string());
    }

    let difficulty_json_content = fs::read_to_string(&difficulty_json_path).map_err(|e| {
        println!("读取 difficulty.json 失败: {}", e);
        e.to_string()
    })?;

    // 解析 difficulty.json 内容
    let difficulty_data: DifficultyData = serde_json::from_str(&difficulty_json_content).map_err(|e| {
        println!("解析 difficulty.json 失败: {}", e);
        e.to_string()
    })?;

    // 定义正则表达式（支持难度后跟随任意数字），并添加不区分大小写的标志
    let re = Regex::new(r"(?i)^(MULTIPLAYER|SINGLEPLAYER)_(.+?)_(Easy|Normal|Hard|Nightmare|\d+)\.sav$").unwrap();

    // 创建一个向量来存储结果
    let mut save_games = Vec::new();

    // 递归遍历目录
    traverse_directory(&save_games_path, &re, &save_games_path, &difficulty_data, &mut save_games)?;

    println!("找到 {} 个存档文件", save_games.len());

    Ok(save_games)
}

// 递归函数：遍历目录并检查文件是否符合条件
fn traverse_directory<'a>(
    dir: &PathBuf,
    re: &Regex,
    root: &PathBuf,
    difficulty_data: &'a DifficultyData,
    save_games: &mut Vec<SaveGameInfo>,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| {
        println!("读取目录失败 {}: {}", dir.display(), e);
        e.to_string()
    })? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            traverse_directory(&path, re, root, difficulty_data, save_games)?;
        } else if path.is_file() {
            if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
                if let Some(captures) = re.captures(file_name) {
                    let game_mode = match captures.get(1).unwrap().as_str() {
                        "SINGLEPLAYER" => "Singleplayer",
                        "MULTIPLAYER" => "Multiplayer",
                        _ => unreachable!(),
                    };
                    let game_name = captures.get(2).unwrap().as_str();
                    let mut difficulty = captures.get(3).unwrap().as_str();

                    // 检查难度是否为数字，如果是则替换为 "Normal"
                    if difficulty.chars().all(|c| c.is_numeric()) {
                        difficulty = "Normal";
                    }

                    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                    let is_in_subfolder = path.parent().unwrap() != root;

                    let file_content = fs::read(&path).map_err(|e| {
                        println!("读取文件失败 {}: {}", path.display(), e);
                        e.to_string()
                    })?;
                    let hex_content = hex::encode(file_content);

                    let actual_difficulty = match search_difficulty(&hex_content, difficulty_data) {
                        Some(difficulty) => difficulty,
                        None => difficulty, // 使用从文件名中提取的难度
                    };

                    println!(
                        "文件名: {}, 游戏模式: {}, 游戏名称: {}, 实际难度: {}, 是否在子文件夹内: {}",
                        file_stem, game_mode, game_name, actual_difficulty, is_in_subfolder
                    );

                    // 将信息添加到结果向量中
                    save_games.push(SaveGameInfo {
                        file_name: file_stem.to_string(),
                        game_mode: game_mode.to_string().to_lowercase(),
                        game_name: game_name.to_string(),
                        game_difficulty: difficulty.to_string().to_lowercase(),
                        actual_difficulty: actual_difficulty.to_string().to_lowercase(),
                        is_in_subfolder,
                        file_path: path.to_string_lossy().to_string(),
                    });
                }
            }
        }
    }

    Ok(())
}

// 搜索难度，忽略大小写
fn search_difficulty<'a>(hex_content: &str, difficulty_data: &'a DifficultyData) -> Option<&'a str> {
    let difficulties = [
        ("Easy", difficulty_data.easy.as_str()),
        ("Hard", difficulty_data.hard.as_str()),
        ("Nightmare", difficulty_data.nightmare.as_str()),
        ("Normal", difficulty_data.normal.as_str()),
    ];

    let lower_hex_content = hex_content.to_lowercase();

    for (difficulty_name, pattern) in difficulties.iter() {
        let lower_pattern = pattern.to_lowercase();
        if lower_hex_content.contains(&lower_pattern) {
            return Some(difficulty_name);
        }
    }

    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_save_games])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用程序时出错");
}