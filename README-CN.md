<p align="center">
  <img src="./src-tauri/icons/128x128.png" alt="ETB Save Manager" width="128">
</p>

<h1 align="center">ETB Save Manager</h1>

<p align="center">
  《逃离后室》存档管理工具，基于 Tauri 2.0 构建。
</p>

<p align="center">
  <a href="#">简体中文</a>
  · <a href="./README-HANT.md">繁體中文</a>
  · <a href="./README.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/github/v/release/Eververdants/ETBSaveManager" alt="Version"></a>
  <a href="https://github.com/Eververdants/ETBSaveManager/actions"><img src="https://img.shields.io/github/actions/workflow/status/Eververdants/ETBSaveManager/release.yml" alt="CI"></a>
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/github/downloads/Eververdants/ETBSaveManager/total" alt="Downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Eververdants/ETBSaveManager" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-Windows-blue" alt="Platform">
</p>

## 功能特性

### 存档管理

- **完整增删改查** — 创建、编辑、删除、复制、隐藏/显示存档
- **软删除与回收站** — 删除的存档可恢复或永久删除
- **批量操作** — 多选模式，同时处理多个存档
- **收藏与排序** — 标记重要存档；按名称、日期、层级或收藏排序
- **智能筛选** — 按层级、难度、游戏模式搜索筛选
- **快速搜索** — 模糊匹配，即时定位目标存档
- **撤销 / 重做** — 完整的存档操作撤销与重做支持
- **虚拟滚动** — 大量存档时依然保持流畅

### 现代化界面

- **简洁设计** — 直观的界面，搭配 GSAP 驱动的流畅动画
- **13 套主题** — 浅色、深色及 10 套色彩主题
- **响应式布局** — 可折叠侧边栏，自适应组件
- **硬件加速** — GPU 优化渲染，确保流畅体验
- **全局搜索** — 任意页面按 `Ctrl+F` 即时搜索
- **新手引导** — 首次使用时的交互式引导覆盖层

### 多语言支持

内置语言：

- 简体中文
- 繁體中文
- English

> 国际化系统采用模块化设计，可通过添加新的语言文件来贡献更多语言。

### 高级功能

- **多种创建模式**
  - 快速创建 — 简化流程，快速生成存档
  - 标准创建 — 完整的自定义选项，分步向导
- **背包编辑器** — 可视化的玩家背包物品编辑器
- **玩家数据编辑** — 编辑背包物品、理智值等玩家属性
- **通知系统** — 持久化通知中心，追踪应用事件
- **性能监控** — 内置 FPS 与内存诊断工具（开发模式）
- **性能设置** — 调整 GPU 渲染与动画偏好
- **统一配置面板** — 集中化的配置管理界面

---

## 界面预览

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

## 安装方式

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
- 平台相关依赖（参见 [Tauri 环境配置](https://v2.tauri.app/start/prerequisites/)）

---

## 维护策略

本项目按需进行维护：

- **地图更新** — 当 *Escape The Backrooms* 发布新地图（关卡）时，本工具将同步更新以支持新的存档数据格式和关卡元数据。
- **Bug 修复与优化** — 当发现并报告了 Bug 或性能问题时，会及时进行修复和优化。
- **功能请求** — 超出游戏兼容性范畴的新功能将按具体情况评估。欢迎通过 Issue 讨论。

> 本项目的主要目标是保持存档管理器与游戏版本同步更新。社区贡献的新功能同样欢迎！

---

## 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| Vue 3 + Composition API | 响应式 UI 框架 |
| TypeScript | 类型安全的开发体验 |
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
| vitest + fast-check | 单元测试与属性测试 |

### 后端 (Rust)

| 技术 | 用途 |
|------|------|
| Tauri 2.0 | 桌面应用框架 |
| uesave 0.6.2 | UE4 存档文件解析 |
| serde + serde_json | 数据序列化 |
| rusqlite | 本地 SQLite 数据库 |
| tokio + reqwest | 异步 HTTP 客户端 |
| walkdir + memmap2 | 高效文件操作 |
| rayon | 并行计算 |
| chrono | 日期/时间处理 |
| uuid | 唯一 ID 生成 |
| regex | 模式匹配 |
| thiserror | 错误处理 |

---

## 项目结构

```
ETBSaveManager/
├── src/                              # Vue 前端（TypeScript）
│   ├── components/
│   │   ├── archive/                  # 存档相关组件
│   │   │   ├── ArchiveCard.vue
│   │   │   ├── ArchiveCardFlow.vue
│   │   │   ├── ArchiveSearchFilter.vue
│   │   │   └── QuickCreateArchiveCard.vue
│   │   ├── feature/                  # 功能组件
│   │   │   ├── FloatingActionButton.vue
│   │   │   ├── GlobalSearchPanel.vue
│   │   │   ├── InventoryItemSelector.vue
│   │   │   ├── PreviewExecuteArea.vue
│   │   │   ├── SmartInputArea.vue
│   │   │   └── TutorialOverlay.vue
│   │   ├── layout/                   # 布局组件
│   │   │   ├── Sidebar.vue
│   │   │   └── TitleBar.vue
│   │   ├── modal/                    # 模态对话框
│   │   │   ├── ArchiveEditModal.vue
│   │   │   ├── BatchEditModal.vue
│   │   │   ├── ConfirmModal.vue
│   │   │   └── PromptPopup.vue
│   │   ├── system/                   # 系统工具
│   │   │   ├── PerformanceMonitor.vue
│   │   │   ├── PerformanceSettings.vue
│   │   │   ├── PlayerManager.vue
│   │   │   └── UniformConfigPanel.vue
│   │   ├── theme/                    # 主题选择
│   │   │   └── ThemeSelector.vue
│   │   └── ui/                       # 可复用 UI 组件
│   │       ├── CustomDropdown.vue
│   │       ├── CustomSlider.vue
│   │       ├── ErrorBoundary.vue
│   │       ├── LazyImage.vue
│   │       └── NotificationPopup.vue
│   ├── composables/                  # Vue 组合式函数
│   │   ├── useArchiveActions.ts      # 存档 CRUD 操作
│   │   ├── useArchiveData.ts         # 存档数据管理
│   │   ├── useArchiveCard.ts         # 卡片交互
│   │   ├── useArchiveCardFlow.ts     # 流模式逻辑
│   │   ├── useArchiveFilters.ts      # 筛选与搜索
│   │   ├── useUndoRedo.ts            # 撤销/重做
│   │   ├── useGlobalSearchPanel.ts   # 全局搜索
│   │   ├── useFloatingActionButton.ts
│   │   ├── useQuickCreate.ts
│   │   ├── usePlayerManager.ts
│   │   ├── usePerformanceMonitor.ts
│   │   ├── usePerformanceSettings.ts
│   │   ├── useTutorialOverlay.ts
│   │   ├── useToast.ts
│   │   ├── useValidator.ts
│   │   ├── useNameParser.ts
│   │   ├── useReleaseNotes.ts
│   │   ├── useConfigResolver.ts
│   │   ├── useFocusTrap.ts
│   │   ├── useAnimations.ts
│   │   ├── useUniformConfigPanel.ts
│   │   └── useInventoryItemSelector.ts
│   ├── config/                       # 应用配置
│   │   ├── cdnConfig.ts
│   │   ├── sidebarMenu.ts
│   │   ├── updateConfig.ts
│   │   └── version.ts
│   ├── i18n/                         # 国际化
│   │   ├── index.ts
│   │   ├── loader.ts
│   │   └── locales/
│   │       ├── en-US/                # 英语（按领域划分的 JSON 文件）
│   │       ├── zh-CN/                # 简体中文
│   │       └── zh-TW/                # 繁體中文
│   ├── router/                       # Vue Router 配置
│   ├── services/                     # 业务逻辑服务
│   │   ├── storageService.ts         # 持久化存储
│   │   ├── logService.ts             # 日志记录
│   │   ├── notificationService.ts    # 通知管理
│   │   ├── popupService.ts           # 弹窗管理
│   │   ├── themeStorage.ts           # 主题持久化
│   │   ├── pluginStorage.ts          # 插件数据
│   │   └── updateService.ts          # 自动更新
│   ├── styles/
│   │   ├── animations.css
│   │   └── themes/                   # 主题 CSS 文件
│   │       ├── _colors.css
│   │       ├── _components.css
│   │       ├── _semantic.css
│   │       ├── light.css / dark.css
│   │       ├── high-contrast.css
│   │       ├── ocean.css / forest.css
│   │       ├── sunset.css / lavender.css
│   │       ├── rose.css / mint.css
│   │       ├── peach.css / sky.css
│   │       └── index.css
│   ├── utils/                        # 工具函数
│   │   ├── icons.ts / icons-full.ts / icons-critical.ts
│   │   ├── nameParser.ts
│   │   ├── performance.ts
│   │   ├── consoleForwarder.ts
│   │   ├── polyfills.ts
│   │   ├── disableInteractions.ts
│   │   └── floatingButtonProtection.ts
│   ├── views/                        # 页面视图
│   │   ├── Home.vue                  # 存档列表
│   │   ├── CreateArchive/            # 创建存档向导
│   │   ├── EditArchive.vue           # 编辑存档
│   │   ├── QuickCreateArchive.vue    # 快速创建
│   │   ├── SelectCreateMode.vue      # 模式选择
│   │   ├── Settings.vue              # 应用设置
│   │   ├── About.vue                 # 关于页面
│   │   ├── Log.vue                   # 操作日志
│   │   └── TestArchive.vue           # 测试工具
│   ├── types.ts                      # 全局类型定义
│   ├── appContext.ts                 # 依赖注入上下文
│   ├── App.vue                       # 根组件
│   └── main.ts                       # 应用入口
├── src-tauri/                        # Rust 后端
│   └── src/
│       ├── lib.rs                    # 库入口 / Tauri 设置
│       ├── main.rs                   # 主程序入口
│       ├── save_commands.rs          # 存档 CRUD 命令
│       ├── save_editor.rs            # 存档文件编辑
│       ├── save_shared.rs            # 共享存档类型
│       ├── save_utils.rs             # 存档文件工具
│       ├── new_save.rs               # 存档创建逻辑
│       ├── player_data.rs            # 玩家数据处理
│       ├── cli_handlers.rs           # CLI 命令处理
│       ├── system_commands.rs        # 系统级命令
│       ├── theme_commands.rs         # 主题管理
│       ├── gpu_settings.rs           # GPU/渲染配置
│       ├── get_file_path.rs          # 文件路径解析
│       ├── common.rs                 # 通用辅助函数
│       └── error.rs                  # 错误类型定义
├── public/                           # 静态资源
│   ├── icons/                        # 游戏物品图标
│   └── images/                       # 游戏关卡图片
├── docs/                             # 截图
├── scripts/                          # 构建脚本
│   └── sync-version.js               # 版本同步
├── dist/                             # 构建输出
├── index.html                        # HTML 入口
├── vite.config.ts                    # Vite 配置
├── tsconfig.json                     # TypeScript 配置
├── eslint.config.js                  # ESLint 配置
├── package.json
└── pnpm-lock.yaml
```

---

## 主题列表

ETB Save Manager 内置 13 套主题：

### 基础主题
- **Light（浅色）** — 清新的浅色主题
- **Dark（深色）** — 舒适的深色主题

### 色彩主题
- **Ocean（海洋）** 深蓝色海洋风格
- **Forest（森林）** 自然绿色森林风格
- **Sunset（日落）** 温暖的橙色日落色调
- **Lavender（薰衣草）** 柔和的紫色薰衣草
- **Rose（玫瑰）** 优雅的粉色玫瑰
- **Mint（薄荷）** 清新的薄荷绿
- **Peach（蜜桃）** 柔和的蜜桃色调
- **Sky（天空）** 明亮的天空蓝

---

## 参与贡献

欢迎贡献代码！这是一个个人学生项目，任何帮助都非常感谢。

- [报告 Bug](https://github.com/Eververdants/ETBSaveManager/issues)
- [功能建议](https://github.com/Eververdants/ETBSaveManager/issues)
- 联系邮箱：**llzgd@outlook.com**

---

## 免责声明

本项目**与 Fancy Games 或《逃离后室》没有任何关联、背书或连接**。

游戏素材（如关卡图标）**仅用于识别目的**，以帮助用户识别存档所属的关卡。  
《逃离后室》及其素材的所有权利均属于其各自所有者。

---

## 星标历史

<p align="center">
  <a href="https://star-history.com/#Eververdants/ETBSaveManager&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Eververdants/ETBSaveManager&type=Date&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Eververdants/ETBSaveManager&type=Date" />
      <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Eververdants/ETBSaveManager&type=Date" />
    </picture>
  </a>
</p>

---

## 开源许可

[MIT License](LICENSE) © 2026 Eververdants

---

<p align="center">
  <sub>使用 Vue.js 和 Tauri 构建</sub>
</p>
