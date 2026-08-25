# Architecture

## Overview

ETBToolkit is a Tauri v2 desktop application for managing game saves, mods, and tools.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| State | Zustand |
| Styling | Tailwind CSS 3 + CSS Variables (Design Tokens) |
| Routing | React Router v7 |
| Data Fetching | TanStack Query |
| i18n | i18next |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| Desktop | Tauri v2 |

## Directory Structure

```
src/
├── api/            # Tauri invoke 封装，唯一权威 API 层
├── components/     # 跨模块共享的通用 UI 组件
├── constants/      # 应用常量（配置、导航、Query Keys）
├── hooks/          # 跨模块共享的自定义 Hooks
├── layouts/        # 布局组件（AppShell、TitleBar、Sidebar）
│   └── components/ # 布局专用子组件
├── locales/        # i18n 翻译文件
├── stores/         # Zustand 状态管理（每个 Store 独立文件）
├── types/          # 全局 TypeScript 类型定义
└── utils/          # 通用工具函数
```

## Layer Responsibilities

```
View / Page
    ↓
Composable / Store / Service
    ↓
Tauri Command (api/)
    ↓
Rust (src-tauri/)
```

- **TypeScript** — UI、状态、交互、展示、流程编排
- **Rust** — 文件系统、游戏文件解析、进程管理、性能敏感操作、系统能力
