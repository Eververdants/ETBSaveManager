# ETB Save Manager 用户体验优化计划

> 版本：1.0  
> 日期：2026-06-13  
> 范围：前端交互体验 + 后端性能感知

---

## 目录

1. [优先级总览](#1-优先级总览)
2. [P0 · 核心体验短板](#2-p0--核心体验短板)
3. [P1 · 交互细节增强](#3-p1--交互细节增强)
4. [P2 · 性能与流畅度](#4-p2--性能与流畅度)
5. [P3 · 长期愿景](#5-p3--长期愿景)
6. [技术债务与代码质量](#6-技术债务与代码质量)

---

## 1. 优先级总览

| 级别 | 优化项 | 影响面 | 预估工作量 |
|------|--------|--------|-----------|
| **P0** | 撤销/恢复系统 | 全局 | 3-5 天 |
| **P0** | 错误边界 (Error Boundary) | 全局 | 1 天 |
| **P0** | 加载状态骨架屏 | 首页 | 1-2 天 |
| **P0** | Rust 命令异步化 | 后端 | 2-3 天 |
| **P0** | 焦点管理 + Focus Trap | 全局 | 2 天 |
| **P1** | Toast 撤销动作 | 全局 | 1 天 |
| **P1** | 创建向导草稿持久化 | 创建页 | 1 天 |
| **P1** | Sidebar 键盘导航 | 侧边栏 | 0.5 天 |
| **P1** | 创建成功体验优化 | 创建页 | 1 天 |
| **P1** | SearchFilter 体验增强 | 搜索 | 1 天 |
| **P2** | 日志事件推送替代轮询 | 日志页 | 1-2 天 |
| **P2** | 大存档分页/延迟加载 | 首页 | 3-5 天 |
| **P2** | CSS 变量一致性 | 全局 | 1 天 |
| **P2** | i18n 完整性补齐 | 全局 | 1-2 天 |
| **P2** | Settings 主题切换重构 | 设置页 | 1 天 |
| **P3** | 存档版本历史 | 编辑页 | 5-7 天 |
| **P3** | 内联编辑 + 拖拽排序 | 首页 | 3 天 |
| **P3** | 全局搜索增强 | 搜索 | 2 天 |
| **P3** | 骨架屏全面铺开 | 全局 | 2 天 |

---

## 2. P0 · 核心体验短板

### 2.1 撤销/恢复系统

**现状**：删除、可见性切换等破坏性操作不可撤销。误操作后用户无法恢复。

**影响**：全局所有修改操作

**方案**：

```
src/
  composables/
    useUndoRedo.js          # 核心：操作历史栈
    useDestructiveAction.js  # 包装器：自动推入历史 + Toast 撤销
```

- `useUndoRedo`：维护 `past[]` / `future[]` 数组，支持 `push(action)` / `undo()` / `redo()`
  ```js
  // 结构
  { type: 'delete' | 'toggleVisibility' | 'batchDelete',
    timestamp: number,
    description: string,        // 用于显示 "撤销删除 xxx"
    undo: () => Promise<void>,  // 逆向操作
    redo: () => Promise<void>   // 正向重做
  }
  ```
- `useDestructiveAction`：封装删除、批量删除等操作，执行后自动：
  1. 显示 Toast：`已删除 xxx.sav「撤销 ✕」`（5s 倒计时）
  2. 5 秒内点击撤销 → 调用 `undo()`
  3. 5 秒后或第二次操作 → 从历史栈移除
- 支持 `Ctrl+Z` / `Ctrl+Shift+Z` 全局快捷键
- 批量操作作为单条历史条目入栈

**细节注意**：
- 删除操作默认**软删除**（标记删除 + 延迟 30 秒清理），撤销时只需取消标记
- 可见性切换只需记录前后状态
- 历史栈上限 50 条，超出时丢弃最旧条目

---

### 2.2 错误边界 (Error Boundary)

**现状**：任意子组件渲染错误会导致整个视图白屏，用户只能强制重启。

**影响**：全局所有路由视图

**实现**：创建 `ErrorBoundary.vue`
```vue
<template>
  <div v-if="hasError" class="error-boundary">
    <font-awesome-icon :icon="['fas', 'bug']" />
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <div class="actions">
      <button @click="retry">重试</button>
      <button @click="goHome">返回首页</button>
      <button v-if="showDetail" @click="toggleDetail">查看详情</button>
    </div>
    <pre v-if="showDetail">{{ error.stack }}</pre>
  </div>
  <slot v-else />
</template>
```
- 使用 Vue 3 的 `onErrorCaptured` 钩子
- 提供「重试」「返回首页」「查看详情」三个按钮
- 每个路由视图包裹：`<ErrorBoundary><router-view /></ErrorBoundary>`
- 全局注册为插件，统一处理未捕获错误

---

### 2.3 加载状态骨架屏

**现状**：首页加载时仅有 FAB 上的 loading 类（opacity 减弱），列表区域完全空白。用户无法感知加载进度。

**影响**：首页（主要入口）

**方案**：创建 `SkeletonLoader.vue` 组件
- 支持多种布局：`grid`（卡片网格）、`list`（列表行）、`card`（单个卡片占位）
- 使用 CSS 动画 `shimmer`（移动渐变条）模拟加载
- 5 个骨架卡片占满首屏，尺寸匹配真实卡片
- 加载完成后以 `Transition` 渐入替换真实内容

```
src/components/ui/SkeletonLoader.vue
```

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-card {
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-card);
}
```

**集成点**：Home.vue 中，`loading` 为 true 时渲染 `<SkeletonLoader type="grid" :count="10" />`，完成后淡出。

---

### 2.4 Rust 命令异步化

**现状**：除 `load_all_saves` 外，主要文件操作命令（`delete_file`、`handle_file`、`convert_sav_to_json` 等）均为同步命令，连续快速调用会阻塞 Tauri IPC。

**影响**：首页所有存档操作 + 编辑页 + 创建页

**方案**：对 I/O 密集型命令添加 `async` + `tokio::task::spawn_blocking`

```rust
// 优化前
#[tauri::command]
fn delete_file(path: String) -> Result<(), AppError> {
    std::fs::remove_file(&path)?;
    Ok(())
}

// 优化后
#[tauri::command]
async fn delete_file(path: String) -> Result<(), AppError> {
    tokio::task::spawn_blocking(move || {
        std::fs::remove_file(&path)?;
        Ok::<(), AppError>(())
    })
    .await
    .map_err(|e| AppError::General(e.to_string()))??;
    Ok(())
}
```

**优先异步化的命令**：

| 命令 | 原因 |
|------|------|
| `delete_file` | 批量删除时频繁调用 |
| `handle_file` | 文件 I/O + sav 解析 |
| `handle_new_save` | 创建存档含写入 |
| `handle_edit_save` | 编辑后保存 |
| `convert_sav_to_json` | 大文件 JSON 序列化 |
| `convert_json_to_sav` | 大文件反序列化 |
| `unlock_all_hub_doors` | 可能修改大数组 |

---

### 2.5 焦点管理 + Focus Trap

**现状**：所有 Modal、Dropdown 打开后无焦点捕捉，TAB 键会跳出到页面背景。键盘用户完全无法使用模态交互。

**影响**：全局所有弹窗组件

**方案**：创建 `useFocusTrap` composable

```js
// composables/useFocusTrap.js
export function useFocusTrap(containerRef, options = {}) {
  const { enabled = ref(true), initialFocus = 'auto' } = options

  onMounted(() => {
    if (!enabled.value) return
    trapFocus()
  })

  onUnmounted(() => releaseFocus())

  // 核心：TAB 循环在 container 内
  // Shift+TAB 反向循环
  // Escape 触发关闭回调
  // 关闭后焦点返回触发元素
}
```

**集成列表**：

| 组件 | 当前状态 | 方案 |
|------|---------|------|
| `ConfirmModal` | 仅 Escape 关闭 | + Focus Trap + aria-modal |
| `ArchiveEditModal` | 无 | + Focus Trap |
| `BatchEditModal` | 无 | + Focus Trap |
| `CustomDropdown` | 无 | + aria-expanded + 选项键盘导航 |
| `GlobalSearchPanel` | 无 | + Enter/F3 快捷键 |
| `TutorialOverlay` | 无 | + 键盘步进 |

**额外：Sidebar 键盘导航**

Sidebar 当前为 `<div @click>` 无任何键盘支持：

```js
// Sidebar.vue 扩展
// - tabindex="0" (collapsed) / tabindex="-1" (expanded 但非活跃)
// - role="navigation" + aria-label="主菜单"
// - 上下箭头导航
// - Enter/Space 激活
// - 每项 aria-current="page" 当活跃
```

---

## 3. P1 · 交互细节增强

### 3.1 Toast 撤销动作

**现状**：`useToast` 的 `showSuccess/Error` 不暴露 action 回调，NotificationPopup 支持 action 但上层未对接。

**影响**：全局操作反馈

**实现**：扩展 `useToast.js`
```js
// 使用方式
notify.success('已删除 Explorer.sav', {
  action: {
    label: '撤销',
    callback: () => undoDelete(archiveId)
  },
  duration: 5000  // 5s 后自动关闭
})
```

改动范围：
- `useToast.js`：`showSuccess/Error/Warning/Info` 签名扩展，透传 action 配置
- `notificationService.js`：组件实例方法扩展
- `NotificationPopup.vue`：action 按钮已有，无需改动

---

### 3.2 创建向导草稿持久化

**现状**：3 步创建向导，用户中途离开（切换页面）会调用 `resetForm()`，所有进度丢失。

**影响**：CreateArchive 页面

**方案**：
1. 进入 Step1 时，自动将 `{ step, level, config, inventory }` 序列化到 `sessionStorage`（键：`create-draft`）
2. 重新进入时检测草稿，弹出确认框：
   > 「发现未完成的存档创建（上次在步骤 2），是否恢复？」「恢复」「重新开始」
3. 成功创建 / 手动取消 → 清除草稿
4. 浏览器 `beforeunload` 提示

**数据流**：
```
onMounted → checkDraft()
   ├─ 有草稿 → 弹窗 → 用户选择
   │   ├─ 恢复 → restoreDraft() → setStep(draft.step)
   │   └─ 重新开始 → clearDraft()
   └─ 无草稿 → 正常开始

watch([step, formData], { deep: true }) → debounce(1000) → saveDraft()
```

---

### 3.3 创建成功体验优化

**现状**：
- 创建成功后 success modal 1400ms 自动关闭，粒子动画 800ms 未完成就已开始关闭
- 无进度指示器（`isCreating` 仅改变按钮文字）
- 创建完成后无导向（直接返回首页）

**影响**：CreateArchive

**方案**：
1. **成功弹窗改为手动关闭**，不再自动计时
2. 粒子动画结束后提供三个操作选项：
   - 「编辑此存档」 → 导航到 EditArchive
   - 「继续创建」 → 重置表单
   - 「返回首页」 → 导航到首页
3. 创建过程中添加进度条（或 spinner + 预计剩余时间）
4. 创建失败时显示具体失败原因（如 `validateField` 提示不通过的具体字段）

---

### 3.4 SearchFilter 体验增强

**现状**：
- 搜索仅匹配存档名，不匹配关卡、难度、模式
- 筛选器激活后 `position: fixed` 锁滚动造成 layout shift
- 无搜索历史
- debounce 仅 50ms（几乎等于无）

**影响**：首页

**方案**：
1. **扩展搜索范围**：同时匹配关卡名称、难度标签、游戏模式
2. **搜索建议**：输入时显示历史搜索（最近 5 条）+ 最匹配前 3 项
3. **搜索结果高亮**：匹配关键词在卡片标题上加 `<mark>` 标签
4. **Scroll Lock 优化**：改用 `overflow: hidden` + `padding-right: scrollbarWidth` 防止 layout shift
5. **debounce 提升**：50ms → 250ms

```js
// 搜索高亮 composable
function highlightMatch(text, query) {
  if (!query) return text
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}
```

---

### 3.5 空状态体验升级

**现状**：两个空状态都有文字 + 图标，视觉上可以更有温度。

**影响**：首页、日志页、QuickCreate

**方案**：
- 首页无存档：SVG 插画（一个打开的空文件夹 + 箭头指向创建按钮）
- 筛选无结果：更有趣的文案 + 「随机逛逛」按钮（清除所有筛选）
- 日志为空：终端风格的空行 + 闪烁光标动画

---

## 4. P2 · 性能与流畅度

### 4.1 日志事件推送替代轮询

**现状**：Log.vue 每 1000ms 调用 `logService.getLogs()` 轮询，每次替换整个数组。

**影响**：日志页

**方案**：使用 Tauri 事件系统推送日志更新

```rust
// Rust 端 - 日志写入时发送事件
fn write_log(app_handle: &AppHandle, entry: LogEntry) {
    // 写入文件/DB
    app_handle.emit("log-event", &entry).ok();
}
```

```js
// 前端 - 监听替代轮询
import { listen } from '@tauri-apps/api/event'

onMounted(() => {
  unlisten = await listen('log-event', (event) => {
    logs.value.push(event.payload)
    trimToMax(1000) // 保持上限
  })
})

onUnmounted(() => unlisten())
```

**优化**：增量追加而非全量替换，上限 1000 条自动裁剪。

---

### 4.2 ArchiveCard 渲染优化

**现状**：
- 每个卡片同时设置 `will-change: transform, opacity`、`contain: layout style`、`isolation: isolate` → 10+ 合成层
- hover 阴影使用硬编码颜色
- 按钮 shine 效果只触发一次

**影响**：首页（虚拟滚动渲染中）

**方案**：
1. **精简 CSS**：移除 `will-change`（虚拟滚动已保证复用，不需要提前告知），改为 `transform: translateZ(0)` 按需提升
2. **阴影使用 CSS 变量**：`var(--card-shadow-hover)` 替代硬编码 rgba
3. **Shine 效果修复**：使用 `@keyframes` 替代 `::after` 的位置过渡，确保每次 hover 都重新触发
4. **错误状态**：`LazyImage` 加载失败时显示占位图标

---

### 4.3 Home 视图渲染优化

**现状**：
- `displayArchives` 被直接赋值而非 computed，与 `archives` watcher 可能在排序上不一致
- `watch(archives, { deep: true })` 递归遍历全部对象
- `updateContainerSize` 每次数据变更后触发，引起过度测量

**影响**：首页

**方案**：
1. `displayArchives` 改为 `computed`，消除数据源不一致
2. 深 watcher → 浅 watcher + 显式依赖追踪（只观察 `archives.length` 和排序/筛选状态）
3. `updateContainerSize` 加防抖（300ms）+ 只在 resize 时触发，不在数据变更时触发
4. `selectedArchives` 由 `new Set()` 替换创建 → `reactive(Set)` 直接修改

---

### 4.4 性能监控器交互修复

**现状**：PerformanceMonitor hover 时 opacity 降到 0.3 + 移除 backdrop-filter（想看它时它反而消失）。

**影响**：开发者模式

**修复**：反转 hover 行为
```css
.performance-monitor {
  opacity: 0.3;           /* 默认半透明，不干扰主界面 */
  transition: opacity 0.2s;
}
.performance-monitor:hover {
  opacity: 1;             /* hover 时完全可见可读 */
}
```

另外移除子元素的 `pointer-events: none`，让用户能真正交互。

---

### 4.5 大存档列表分批加载

**现状**：`load_all_saves` 一次加载所有 .sav 文件并解析。500+ 存档时启动时间变长。

**影响**：首页

**方案**（可选两种之一）：
1. **增量加载**：先返回文件元数据（名称、大小、修改时间），分页（每页 50 条），滚动到可视区时解析详细数据
2. **启动优化**：保留全量加载，但首页展示进度条：「正在加载存档… (42/156)」

推荐方案 1，但实现成本较高。方案 2 可作为过渡。

---

## 5. P3 · 长期愿景

### 5.1 存档版本历史与快照

- 每次编辑存档时自动备份前一个版本（保存在 `{appdata}/backups/{archiveId}/{timestamp}.sav`）
- 编辑页面中增加「历史版本」侧面板
- 支持版本对比（文件名、大小、修改时间列表）
- 支持恢复到任意历史版本

### 5.2 内联编辑 + 拖拽排序

- **内联重命名**：双击存档标题直接编辑名称
- **收藏/置顶**：星标标记，收藏存档固定显示在最前
- **拖拽排序**：利用已有的 `vuedraggable`，在首页启用拖拽调整显示顺序
- **自定义分组**：用户创建文件夹/标签分类存档

### 5.3 全局搜索增强

- 支持高级查询语法：`name:xxx`、`level:xxx`、`difficulty:hard`
- 全局搜索面板扩展为可搜索所有页面内容
- 搜索历史持久化（localStorage，保留最近 20 条）
- 快捷键 `Ctrl+Shift+F` 打开高级搜索框

### 5.4 骨架屏全面铺开

- 路由懒加载时显示页面级骨架屏（替代白屏）
- `Settings` 页各设置组切换时骨架屏过渡
- `Log` 页首次加载时终端风格骨架屏

---

## 6. 技术债务与代码质量

### 6.1 CSS 变量不一致

**问题**：
- 同时存在 `--card-radius: 16px`（theme 文件）和 `--radius-card: 16px`（variables.css）
- `--bg`, `--bg-primary`, `--bg-secondary` vs `--sidebar-bg` 混用
- `_semantic.css` 只有 `[data-theme="dark"]` 覆盖，缺少其他深色主题的覆盖

**修复**：
1. 统一命名规范：`--radius-card`（variables.css）作为标准，废弃 `--card-radius`
2. 语义化 background：全部使用 `--bg-*` 系列，消除 `--sidebar-bg` 等特例
3. 所有深色主题添加语义色覆盖

### 6.2 i18n 完整性补齐

**问题**：
- `en-US` 35 个翻译文件，`zh-CN`/`zh-TW` 31 个，完整性不一致
- `GlobalSearchPanel` 有硬编码中文字符串
- 无 locale fallback 机制

**修复**：
1. 补齐 `zh-CN`/`zh-TW` 缺失的 4 个文件
2. 消除所有硬编码字符串（`GlobalSearchPanel`、`ConfirmModal` 等）
3. vue-i18n 配置 `fallbackLocale: 'en-US'`

### 6.3 Settings 主题切换重构

**问题**：
- `forceThemeBackgroundUpdate` 手动设置 CSS 变量，与 `data-theme` 主题 CSS 冲突
- 每次切换主题时，`storage.setItem` → `themeManager.setTheme` → `forceThemeBackgroundUpdate` 多次写入

**修复**：
1. 移除 `forceThemeBackgroundUpdate` 方法
2. 确保所有主题 CSS 文件已定义背景变量，不再需要 JS 强制设置
3. 切换流程简化为：`changeTheme(name) → storage.setItem('theme', name) → document.documentElement.dataset.theme = name`

### 6.4 死代码清理

| 文件 | 问题 | 操作 |
|------|------|------|
| `useAnimations.js` | `beforeCardEnter` / `cardEnter` / `cardLeave` 从未被调用 | 移除 |
| `usePerformanceMonitor.js` | `resetPerformanceMode` 从未被调用 | 移除 |
| `useToast.js` | `icon` 参数接收但不使用 | 修复或移除参数 |
| `variables.css` | toast 样式（`.success-toast` 等）与 NotificationPopup 组件重叠 | 移除 |
| `animations.css` | `.text-swift-*` 与 App.vue scoped 样式重复 | 合并 |

### 6.5 组件 API 风格统一

**问题**：Step1SelectLevel、Step2ConfigArchive、Step3EditInventory 使用 Options API（`data()`、`methods`），而项目其他组件使用 Composition API（`<script setup>`）。

**修复**：统一迁移到 Composition API + `<script setup>`。

---

## 附录：文件修改清单

### P0（立即行动）

| 文件 | 改动类型 |
|------|---------|
| `src/composables/useUndoRedo.js` | **新建** |
| `src/composables/useDestructiveAction.js` | **新建** |
| `src/components/ui/ErrorBoundary.vue` | **新建** |
| `src/components/ui/SkeletonLoader.vue` | **新建** |
| `src/composables/useFocusTrap.js` | **新建** |
| `src/App.vue` | 修改 — 集成 ErrorBoundary |
| `src/views/Home.vue` | 修改 — 集成骨架屏 |
| `src-tauri/src/save_commands.rs` | 修改 — 异步化 |
| `src/components/layout/Sidebar.vue` | 修改 — 键盘导航 |
| `src/components/modal/ConfirmModal.vue` | 修改 — Focus Trap + aria |
| `src/components/modal/ArchiveEditModal.vue` | 修改 — Focus Trap |
| `src/components/modal/BatchEditModal.vue` | 修改 — Focus Trap |
| `src/components/ui/CustomDropdown.vue` | 修改 — 键盘导航 |

### P1（短期规划）

| 文件 | 改动类型 |
|------|---------|
| `src/composables/useToast.js` | 修改 — action 支持 |
| `src/services/notificationService.js` | 修改 — action 透传 |
| `src/views/CreateArchive/index.vue` | 修改 — 草稿持久化 |
| `src/views/CreateArchive/step2ConfigArchive.vue` | 修改 — 验证优化 |
| `src/composables/useArchiveFilters.js` | 修改 — debounce + 高亮 |
| `src/components/archive/ArchiveSearchFilter.vue` | 修改 — 无跳转锁定 |
| `src/components/archive/ArchiveCard.vue` | 修改 — CSS 优化 |

### P2（中期规划）

| 文件 | 改动类型 |
|------|---------|
| `src-tauri/src/lib.rs` | 修改 — log-event 发送 |
| `src/views/Log.vue` | 修改 — 事件监听替代轮询 |
| `src/composables/useArchiveData.js` | 修改 — computed + 浅 watcher |
| `src/components/system/PerformanceMonitor.vue` | 修改 — hover 行为修复 |
| `src/views/settings.vue` | 修改 — 主题切换重构 |
| `src/styles/themes/_semantic.css` | 修改 — 深色主题覆盖 |
| `src/styles/variables.css` | 修改 — 统一 radius 变量 |
| `src/i18n/locales/zh-CN/` | 修改 — 补齐翻译 |
| `src/i18n/locales/zh-TW/` | 修改 — 补齐翻译 |
| `src/components/feature/GlobalSearchPanel.vue` | 修改 — i18n 替换硬编码 |

### P3（长期愿景）

| 文件 | 改动类型 |
|------|---------|
| `src/composables/useArchiveHistory.js` | **新建** |
| `src/components/ui/ErrorFallback.vue` | 修改 — 骨架屏铺开 |
| `src/views/Home.vue` | 修改 — 拖拽排序 |
| `src/components/feature/GlobalSearchPanel.vue` | 修改 — 高级查询 |

---

> 本文档将随项目迭代持续更新。所有变更应遵循现有架构风格（Composition API + `<script setup>`、CSS 变量主题系统），并保持向后兼容。
