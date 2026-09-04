# Architecture

## Overview

ETBToolkit is a Tauri v2 desktop application for managing "Escape The Backrooms" game saves and mods.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| State | Zustand |
| Styling | Tailwind CSS 3 + CSS Variables (Design Tokens) |
| Routing | React Router v7 |
| Data Fetching | TanStack Query |
| i18n | i18next (zh-CN / zh-TW / en-US) |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| Save parsing (Rust) | uesave crate |
| Desktop | Tauri v2 |

## Directory Structure

```
src/
├── api/            # Tauri invoke 封装，唯一权威 API 层
│   ├── index.ts    # tauriInvoke + ApiError + 错误归一化
│   ├── save.ts     # 存档加载/删除/回收站/创建/转换
│   ├── player.ts   # 玩家数据 / EOS 键 / 编辑保存 / Hub 门
│   ├── mods.ts     # UE4SS / NSU 安装管理
│   └── system.ts   # 窗口 / GPU / 进程 / 路径
├── components/     # 跨模块共享组件
│   ├── ui/         # Design System（Button/Card/Dialog/Toast/Dropdown/Tabs…）
│   └── save/       # 存档领域共享组件（创建/编辑流程共用）
├── constants/      # 应用常量（导航、功能开关、结局关卡表）
├── features/       # 页面级功能模块（每个模块自包含）
│   ├── saves/      # 存档列表 → /saves/all
│   ├── create/     # 创建流程 → /saves/create（模式选择 / 向导 / 快速）
│   ├── edit/       # 编辑存档 → /games/edit
│   ├── mods/       # 模组管理 → /mods/installed
│   └── settings/   # 设置 → /settings
├── hooks/          # 跨模块共享 Hooks（NSU 状态、关卡分组等）
├── layouts/        # AppShell / TitleBar / Sidebar
├── locales/        # i18n 翻译（文件名即命名空间前缀）
├── services/       # 纯前端服务（updateService）
├── stores/         # Zustand（app/archive/history/toast/editArchive）
├── types/          # 全局类型（save.ts 为领域类型权威定义）
└── utils/          # 纯工具（nameParser/configResolver/validator/关卡图片…）
```

## Layer Responsibilities

```
View / Page (features/)
    ↓
Hooks / Stores / Services / utils
    ↓
api/ (tauriInvoke)
    ↓
Rust (src-tauri/)
```

- **TypeScript** — UI、状态、交互、展示、流程编排
- **Rust** — 文件系统、游戏文件解析（uesave）、进程管理、性能敏感操作

## Wire Format Convention

Tauri 命令的参数/返回字段名以 Rust 序列化为准（多为 snake_case，如
`load_save_details_batch` 返回 `{ path, current_level, actual_difficulty }`）。
`types/save.ts` 中的 Wire 类型字段名与 Rust 完全一致；UI 类型（camelCase）
由映射函数（`api/save.ts` 的 `mapArchive` / `stores/archiveStore.ts`）转换。

错误统一为 Rust `AppError` 序列化形状 `{ type, message }`，
在 `api/index.ts` 的 `normalizeInvokeError` 中归一化。
