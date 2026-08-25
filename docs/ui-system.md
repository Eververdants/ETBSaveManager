# UI System

## Design Tokens

所有颜色通过 CSS 变量定义在 `index.css`，分为：

- **色阶基准** — HSL 格式的中性色、主色、成功色、危险色
- **语义层** — 背景、文本、边框、状态颜色
- **外壳层** — 侧边栏、标题栏专用颜色

## Theme

支持三种主题模式：
- `light` — 浅色（默认）
- `dark` — 汉色
- `system` — 跟随系统

主题通过 `useAppStore` 管理，`App.tsx` 中监听变化并切换 `html.dark` class。

## Component Library

| 组件 | 位置 | 用途 |
|------|------|------|
| AppShell | layouts/ | 应用外壳 |
| TitleBar | layouts/components/ | 标题栏 |
| Sidebar | layouts/components/ | 侧边栏导航 |
| PagePlaceholder | components/ | 页面占位 |

## Styling Rules

- 使用 Tailwind CSS 工具类
- 颜色使用 CSS 变量（如 `var(--color-text-primary)`）
- 禁止私自编写与设计系统冲突的基础样式
- 使用 `cn()` 合并类名（clsx + tailwind-merge）
