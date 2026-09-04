# Module Boundaries

## Rules

1. **页面只负责 UI 编排** — 不处理业务逻辑、不直接 invoke Rust command
2. **api/ 是唯一权威 API 层** — 组件与页面不得直接 `invoke`，也不得直接使用
   `@tauri-apps/api/window` 等窗口入口（统一走 `api/system` 的 `windowControls`）。
   `@tauri-apps/api` 的 event/dialog/fs/opener 插件入口属例外，但必须经 feature hook 封装
3. **stores/ 每个 Store 独立文件** — 遵循单一职责
4. **components/ 只放跨模块共享组件** — 功能专用组件放 `features/{name}/components/`
5. **types/save.ts 是领域类型权威定义** — 禁止在 feature 内重复定义同名类型

## Allowed Dependencies

```
layouts/        → api, stores, constants, utils, components
features/*      → api, stores, hooks, utils, constants, components
components/     → stores, constants, utils, hooks
hooks/          → stores, api, utils, constants
stores/         → api, types, constants, utils
services/       → api, types, constants, utils
api/            → types
```

> `layouts/ → api` 仅限窗口相关能力（`systemApi.setWindowTitle`、`windowControls`），
> 因为标题栏需要直接操作原生窗口。其余业务数据一律走 feature hook / store。

## Forbidden

- 页面（features/*/Page）直接调用 `invoke()`
- 组件直接访问文件系统
- 跨 feature 引用功能专用组件（如 `features/edit/components/*` 被 saves 引用）
- 在共享目录（components/、hooks/、utils/）放置单一 feature 的业务逻辑
- 在 feature 内重复定义 types/ 已有的领域类型

## Feature Directory Convention

```
features/{name}/
├── XxxPage.tsx        # 页面入口（仅 UI 编排）
├── components/        # 页面级组件
├── hooks/             # 页面级 hooks（业务逻辑在此）
└── types.ts           # 仅该 feature 使用的类型（可选）
```
