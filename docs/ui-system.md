# UI System

## Design Tokens

所有颜色通过 CSS 变量定义在 `index.css`，分为：

- **色阶基准** — HSL 格式的中性色、主色、成功色、危险色
- **语义层** — 背景、文本、边框、状态颜色
- **外壳层** — 侧边栏、标题栏专用颜色

## Theme

支持三种主题模式：
- `light` — 浅色（默认）
- `dark` — 深色
- `system` — 跟随系统

主题通过 `useAppStore` 管理，`App.tsx` 中监听变化并切换 `html.dark` class。

## Component Library

### 基础组件（components/ui/）— Design System 唯一出口

| 组件 | 用途 |
|------|------|
| Button / IconButton | 按钮（primary/secondary/subtle/danger/ghost） |
| Card / CardTitle / CardDescription | 内容容器 |
| Dialog | 受控模态（焦点陷阱 + Esc） |
| ConfirmDialog | 确认框（info/warning/danger，支持存档详情行） |
| Toaster | Toast 队列渲染（数据来自 stores/toastStore） |
| Input / Dropdown / Switch / Checkbox / Slider | 表单控件 |
| Tabs | 胶囊页签（滑动高亮） |
| EmptyState | 空状态 |
| Badge / Spinner / ProgressBar | 反馈元素 |
| LazyImage | 懒加载图片（并发 1 队列 + IntersectionObserver） |

### 存档领域共享组件（components/save/）— 创建/编辑流程共用

| 组件 | 用途 |
|------|------|
| SectionTitle | accent 竖条分区标题 |
| ArchiveNameCard | 存档命名（含下划线错误提示） |
| DifficultySelector | 难度选择（MERGE_DIFFICULTY 时显示 NSU 提示） |
| LevelPicker | 关卡选择（结局分组 + 跨组搜索） |
| PlayerManager | 玩家列表（增删选） |
| PlayerDetailPanel | 理智滑块 + 12 格背包 |
| InventoryItemSelector | 物品选择模态（搜索 + 模糊建议） |

## Styling Rules

- 使用 Tailwind CSS 工具类
- 颜色使用 CSS 变量（如 `var(--color-text-primary)`）
- 禁止私自编写与设计系统冲突的基础样式
- 使用 `cn()` 合并类名（clsx + tailwind-merge）
- 图标统一使用 lucide-react（master 的 FontAwesome 图标按语义映射）
