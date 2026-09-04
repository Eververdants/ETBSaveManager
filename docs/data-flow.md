# Data Flow

## State Management

```
Component → useAppStore → Zustand → localStorage (persist)
```

- `useAppStore` — 持久化状态（主题、侧边栏、开发者模式）
- 语言由 i18next 自管（localStorage i18nextLng），不存入 Zustand

## API Calls

```
Component → api/ (tauriInvoke) → Tauri IPC → Rust Command
```

- 所有 Tauri 调用通过 `api/index.ts` 的 `tauriInvoke()` 封装
- 错误统一在 API 层处理，抛出 `ApiError`
- 组件通过 TanStack Query 或直接调用 service 获取数据

## Data Fetching (TanStack Query)

- 配置：retry=1, staleTime=5min, refetchOnWindowFocus=false
- 配置位于 `main.tsx` 的 `QueryClient` 初始化处
