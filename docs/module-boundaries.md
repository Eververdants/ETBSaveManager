# Module Boundaries

## Rules

1. **页面只负责 UI 编排** — 不处理业务逻辑、不直接 invoke Rust command
2. **api/ 是唯一权威 API 层** — 组件不得直接使用 `invoke` 或 `fetch`
3. **stores/ 每个 Store 独立文件** — 遵循单一职责
4. **components/ 只放跨模块共享组件** — 功能专用组件放 `features/{name}/components/`

## Allowed Dependencies

```
layouts/        → stores, constants, utils, components
components/     → stores, constants, utils, hooks
hooks/          → stores, utils
stores/         → types, constants
api/            → types
```

## Forbidden

- 页面直接调用 `invoke()`
- 组件直接访问文件系统
- 跨模块引用功能专用组件
- 在共享目录放置业务专属逻辑
