# 🕳️ 逃离后室存档工具 (E.T.B. Save Manager) - 3.0 开发版

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center">
  <img src="./src-tauri/icons/128x128.png" alt="icon">
</p>

[中文](#) | [English](./README.md)

> 正在开发中的重大更新版本 —— 更现代化的 UI、搜索功能、颜色主题、多语言切换等新特性！

这是一个专为游戏《逃离后室》设计的桌面级存档管理工具，使用 Vue.js + JavaScript + CSS 构建前端，并通过 Vite 作为构建工具。3.0 是一次全面升级，带来全新的用户体验与更强的功能模块。

本项目中，使用了由 Escape The Backrooms 解包而来的资源，存放在`public`文件夹中的`icons/ETB_UI`文件夹内，资源名称未修改。

如果你在使用试用版本时遇到了一些 bug，请详细的描述问题给开发者，或截图 DevTools 中的错误信息，并提交 issue。

由于`“层级信息修改”`功能开发难度较高且逻辑复杂，该功能将暂时延期至未来版本中推出。原计划中，该功能预计在`“新建存档”`和`“编辑存档”`界面中上线。

我的邮箱：**`llzgd@outlook.com`**

‼️‼️‼️ 本仓库、程序不属于 Escape The Backrooms 开发者 Fancy‼️‼️‼️

---

## 🚧 当前状态：开发中（Alpha 阶段）

- 🔵 基础架构完成搭建 80%
- ❌ 功能尚未完全实现
- 🛠️ 正在持续更新中，请关注仓库获取最新进展
- 🧐 正在构思更多功能
- 🤯 个人学生开发者，欢迎协助我更快完成项目

---

## 📦 主要更新内容（3.0 新特性）

| 功能                  | 状态        | 进度 | 描述                                       |
| --------------------- | ----------- | ---- | ------------------------------------------ |
| 🎨 更现代化的 UI 界面 | ✅ 已完成   | 30%  | 使用现代设计原则重构整个界面，提升用户体验 |
| 🔍 搜索功能           | ✅ 已完成   | 100% | 支持通过名称、层级等关键词快速查找存档     |
| 🎨 颜色主题           | ⏳ 开发中   | 90%   | 用户可自定义应用的颜色主题                 |
| 🌐 多语言切换         | ✅ 已完成   | 100%   | 提供更方便的多语言切换支持                 |
| 💾 存档数据编辑       | ✅ 已完成   | 100% | 允许用户直接在工具内编辑存档数据           |
| ➕ 新建存档功能拓展   | ✅ 已完成   | 100% | 新增更多选项和设置以增强新建存档功能       |
| 📄 拓展内容包         | ⏳ 开发中   | 10%  | 可选择需要使用的拓展功能                   |
| 🌐 跨平台支持         | ✅ 基础支持 | 100% | 支持 Windows/macOS/Linux                   |

---

## 📚 2.7.3 版本回顾（供参考）

如果你需要使用稳定版本，请查看 [v2.7.3 发布页面](https://github.com/Eververdants/ETBSaveManager)。

### 主要功能（2.7.3）

- ✅ 存档创建、编辑、删除、刷新
- ✅ 存档隐藏功能
- ✅ 打开存档目录
- ✅ 层级图片预览
- ✅ 多语言界面支持

---

## 🧰 技术栈

- **前端**：Vue.js + JavaScript + CSS
- **构建工具**：Vite
- **跨平台框架**：Tauri + Rust
- **跨平台**：Windows / macOS / Linux

---

## 📥 安装方式（V3.0.0-Alpha-6.2 测试版）

### Windows

1. 下载 [v3.0.0-Alpha-6.2](https://github.com/Eververdants/ETBSaveManager/releases/tag/v3.0.0-Alpha-6.2) 的 Windows 安装包。

2. 双击安装包进行安装。（如果你没有安装 WebView2，安装包应该会自动进行安装。如果没有，请点击[这里](https://developer.microsoft.com/microsoft-edge/webview2)下载并安装 WebView2）

### 代码下载

```bash
# 克隆项目
git clone https://github.com/Eververdants/ETBSaveManager.git
cd ETBSaveManager

# 安装依赖
npm install

# 运行开发环境
npm run tauri dev
```

---

## 📖 功能简介（3.0）

### 存档管理

- 创建、编辑、删除、复制、隐藏、显示多个存档
- 支持批量操作
- 支持按层级、难度、模式筛选存档
- 显示当前所在层级

### 存档搜索

- 快速通过关键词定位目标存档
- 支持模糊匹配

### 颜色主题

- 用户可选择多种预设颜色主题
- 支持自定义颜色配置
- 支持导出或导入颜色配置

### 多语言切换

- 提供简体中文、英文等多种语言支持
- 用户可轻松切换界面语言

### 存档数据编辑

- 在工具内直接修改存档数据
- 修改玩家背包

### 新建存档功能拓展

- 新增更多选项

### 拓展内容包

- 可选择需要使用的拓展功能
- 拓展内容包将提供更多功能
- 选择从 Github 下载拓展包

---

## 📹 Bilibili 视频介绍（2.6.0）

观看详细的操作指南，请访问：[视频介绍](https://www.bilibili.com/video/BV1L3yeYzEfi)

---

## 📄 许可证

本项目采用 MIT License，请参阅[LICENSE](https://github.com/Eververdants/ETBSaveManager/blob/master/LICENSE)文件。
