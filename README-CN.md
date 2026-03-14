# 🕳️ 逃离后室存档管理器 (E.T.B. Save Manager)

<p align="center">
  <img src="./src-tauri/icons/128x128.png" alt="E.T.B. Save Manager" width="128">
</p>

<p align="center">
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/badge/版本-3.1.0-blue.svg" alt="版本"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/许可证-MIT-green.svg" alt="许可证"></a>
  <img src="https://img.shields.io/badge/平台-Windows-0078D4.svg?logo=windows" alt="平台">
  <img src="https://img.shields.io/badge/框架-Tauri%202.0-orange.svg" alt="框架">
</p>

<p align="center">
  <b>一款现代化、跨平台的《逃离后室》存档管理工具</b>
</p>

<p align="center">
  <a href="#">简体中文</a> | <a href="./README-HANT.md">繁體中文</a> | <a href="./README.md">English</a>
</p>

---

## ✨ 功能特性

### 🗂️ 存档管理

- **完整的增删改查** — 创建、编辑、删除、复制、隐藏/显示存档
- **批量操作** — 同时处理多个存档
- **智能筛选** — 按层级、难度、游戏模式筛选
- **快速搜索** — 模糊匹配，即时定位目标存档
- **虚拟滚动** — 大量存档时依然流畅

### 🎨 现代化界面

- **现代化设计** — 简洁直观的界面，流畅的动画效果
- **15+ 主题** — 浅色、深色、多彩主题以及节日特别主题
- **响应式布局** — 可折叠侧边栏，自适应组件
- **硬件加速** — GPU 优化渲染，确保流畅体验
- **GSAP 动画** — 专业级动画效果

### 🌍 多语言支持

内置语言：

- 简体中文
- 繁體中文
- English

通过插件扩展：

- 日本語 (日语)
- 한국어 (韩语)
- Русский (俄语)
- Português (巴西葡萄牙语)

> ⚠️ **注意：** 语言插件可能不会随版本更新而及时更新。

### 🛠️ 高级功能

- **多种创建模式**
  - 快速创建 — 简化流程，快速生成存档
  - 标准创建 — 完整的自定义选项，分步向导
- **背包编辑器** — 可视化的玩家背包物品编辑器
- **玩家数据编辑** — 编辑生命值、位置等玩家属性
- **Steam 缓存管理** — 管理本地 Steam 缓存数据
- **反馈系统** — 内置反馈提交功能，支持离线队列
- **插件市场** — 从插件市场下载语言包和主题
- **性能监控** — 内置诊断工具（开发模式）
- **自动更新** — 自动检查并安装更新

---

## 🖥️ 界面预览

> 以下截图使用"海洋"主题演示

<p align="center">
  <img src="./docs/存档列表-zh.png" alt="存档列表" width="49%">
  <img src="./docs/创建存档页面第一步-zh.png" alt="创建存档第一步" width="49%">
</p>

<p align="center">
  <img src="./docs/快速创建存档页面-zh.png" alt="快速创建存档" width="49%">
  <img src="./docs/编辑页面-zh.png" alt="编辑页面" width="49%">
</p>

---

## 📦 安装方式

### 下载安装包

1. 前往 [Releases 页面](https://github.com/Eververdants/ETBSaveManager/releases/latest)
2. 下载 Windows 安装包（`.msi` 或 `.exe`）
3. 运行安装程序

> **提示：** 可能需要安装 [WebView2 运行时](https://developer.microsoft.com/microsoft-edge/webview2)（Windows 10/11 通常已预装）

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/Eververdants/ETBSaveManager.git
cd ETBSaveManager

# 安装依赖
pnpm install

# 开发模式运行
pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

**环境要求：**

- Node.js 18+
- Rust 工具链
- 平台相关依赖（参见 [Tauri 环境配置](https://tauri.app/v1/guides/getting-started/prerequisites)）

---

## 🧰 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| Vue 3 + Composition API | 响应式 UI 框架 |
| Vite 6 | 构建工具和开发服务器 |
| Tailwind CSS 4 | 原子化 CSS 框架 |
| CSS Variables | 动态主题系统 |
| vue-i18n | 国际化 |
| Vue Router 4 | 单页应用路由 |
| GSAP | 高性能动画 |
| @tanstack/vue-virtual | 大数据列表虚拟滚动 |
| FontAwesome 7 | 矢量图标 |
| Chart.js | 数据可视化 |
| @vue-flow/core | 节点流程编辑器 |

### 后端 (Rust)

| 技术 | 用途 |
|------|------|
| Tauri 2.0 | 桌面应用框架 |
| uesave 0.6.2 | UE4 存档文件解析 |
| serde + serde_json | 数据序列化 |
| aes-gcm + argon2 | 加密和安全 |
| rusqlite | 本地 SQLite 数据库 |
| reqwest + tokio | 异步 HTTP 客户端 |
| walkdir + memmap2 | 高效文件操作 |

---

## 📁 项目结构

```
ETBSaveManager/
├── src/                          # Vue 前端
│   ├── components/               # UI 组件
│   │   ├── plugin/              # 插件相关组件
│   │   ├── ArchiveCard.vue      # 存档卡片组件
│   │   ├── ArchiveSearchFilter.vue # 搜索筛选面板
│   │   ├── Sidebar.vue          # 侧边导航栏
│   │   ├── TitleBar.vue         # 窗口标题栏
│   │   └── ...                  # 其他组件
│   ├── composables/             # Vue 组合式函数
│   │   ├── useArchiveActions.js # 存档操作逻辑
│   │   ├── useArchiveData.js    # 存档数据管理
│   │   └── ...                  # 其他组合式函数
│   ├── config/                  # 配置文件
│   ├── i18n/                    # 国际化
│   │   └── locales/             # 语言文件
│   │       ├── zh-CN/           # 简体中文
│   │       ├── zh-TW/           # 繁體中文
│   │       └── en-US/           # 英语
│   ├── plugins/                 # 插件系统
│   │   ├── core/                # 插件管理器
│   │   └── loaders/             # 插件加载器（语言、主题、页面）
│   ├── router/                  # Vue Router 配置
│   ├── services/                # 业务逻辑服务
│   ├── styles/                  # 样式系统
│   │   └── themes/              # 主题文件（15+ 主题）
│   ├── utils/                   # 工具函数
│   ├── views/                   # 页面视图
│   │   ├── CreateArchive/       # 创建存档向导
│   │   ├── Home.vue             # 存档列表页
│   │   ├── EditArchive.vue      # 编辑存档页
│   │   └── ...                  # 其他页面
│   ├── App.vue                  # 根组件
│   └── main.js                  # 应用入口
├── src-tauri/                    # Rust 后端
│   └── src/
│       ├── lib.rs               # 库入口
│       ├── main.rs              # 主程序入口
│       ├── save_commands.rs     # 存档操作命令
│       ├── save_editor.rs       # 存档文件编辑器
│       ├── player_data.rs       # 玩家数据处理
│       ├── steam_api.rs         # Steam API 集成
│       ├── feedback_commands.rs # 反馈系统
│       └── ...                  # 其他模块
├── plugins/                      # 插件目录
│   ├── lang-ja-JP/              # 日语语言包
│   ├── lang-ko-KR/              # 韩语语言包
│   ├── lang-ru-RU/              # 俄语语言包
│   ├── lang-pt-BR/              # 巴西葡萄牙语包
│   ├── theme-cyberpunk/         # 赛博朋克主题
│   ├── theme-dracula/           # Dracula 主题
│   ├── theme-monokai/           # Monokai 主题
│   ├── theme-nord/              # Nord 主题
│   └── theme-solarized/         # Solarized 主题
├── public/                       # 静态资源
│   ├── icons/                   # 游戏物品图标（20+）
│   └── images/                  # 游戏关卡图片（40+）
└── docs/                         # 文档和截图
```

---

## 🎨 主题列表

ETB Save Manager 内置 15+ 主题：

### 基础主题
- **Light（浅色）** — 清新的浅色主题
- **Dark（深色）** — 舒适的深色主题

### 彩色主题
- **Ocean（海洋）** 🌊 — 深蓝色海洋风格
- **Forest（森林）** 🌲 — 自然绿色森林风格
- **Sunset（日落）** 🌅 — 温暖的橙色日落色调
- **Lavender（薰衣草）** 💜 — 柔和的紫色薰衣草
- **Rose（玫瑰）** 🌸 — 优雅的粉色玫瑰
- **Mint（薄荷）** 🍃 — 清新的薄荷绿
- **Peach（蜜桃）** 🍑 — 柔和的蜜桃色调
- **Sky（天空）** ☁️ — 明亮的天空蓝

### 节日主题
- **New Year（元旦）** 🎊 — 新年庆祝主题
- **Spring Festival（春节）** 🧧 — 中国新年主题（限时）

### 插件主题
- **Cyberpunk（赛博朋克）** — 霓虹赛博朋克风格
- **Dracula** — 流行的 Dracula 配色方案
- **Monokai** — 经典的 Monokai 主题
- **Nord** — 北极 Nord 调色板
- **Solarized** — Solarized 配色方案

---

## 🚧 开发进度

**当前版本：** `v3.1.0`

| 功能 | 状态 |
|------|------|
| 核心存档管理 | ✅ 已完成 |
| 搜索与筛选 | ✅ 已完成 |
| 主题系统（15+ 主题） | ✅ 已完成 |
| 多语言支持 | ✅ 已完成 |
| 存档数据编辑 | ✅ 已完成 |
| 多种创建模式（快速和标准） | ✅ 已完成 |
| 反馈系统 | ✅ 已完成 |
| 插件系统 | ✅ 已完成 |
| 主题编辑器 | ✅ 已完成 |
| 背包编辑器 | ✅ 已完成 |
| 玩家数据编辑器 | ✅ 已完成 |
| Steam 缓存管理 | ✅ 已完成 |
| 自动更新 | ✅ 已完成 |
| 层级信息编辑 | 🔄 计划中 |

---

## 🎬 视频教程

观看详细的操作指南：[Bilibili 视频介绍](https://www.bilibili.com/video/BV1L3yeYzEfi)（基于 2.6.0 版本）

---

## 🤝 参与贡献

欢迎贡献代码！这是一个个人学生项目，任何帮助都非常感谢。

- 🐛 [报告 Bug](https://github.com/Eververdants/ETBSaveManager/issues)
- 💡 [功能建议](https://github.com/Eververdants/ETBSaveManager/issues)
- 📧 联系邮箱：**llzgd@outlook.com**

### 插件开发

想要创建自己的语言包或主题？查看 [插件开发指南](./plugins/PLUGIN_DEV_GUIDE_CN.md)。

---

## ⚠️ 免责声明

本项目**与 Fancy Games 或《逃离后室》没有任何关联、背书或连接**。

游戏素材（如关卡图标）**仅用于识别目的**，以帮助用户识别存档所属的关卡。  
《逃离后室》及其素材的所有权利均属于其各自所有者。

-------

## 📄 开源许可

[MIT License](LICENSE) © 2024-NOW Eververdants

---

<p align="center">
  <sub>使用 Vue.js 和 Tauri 用 ❤️ 构建</sub>
</p>
