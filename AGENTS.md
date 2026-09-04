# AGENTS.md

> 本文件是所有 AI Agent 在本仓库工作的强制规范。  
> 任何任务开始前，Agent 必须先阅读本文件及相关架构文档。  
> 若规则之间存在冲突，以“核心原则”和“模块边界”为准。

---

## 0. 核心原则

1. **Before adding anything, find out whether it already exists.**  
   添加任何东西之前，先确认仓库中是否已有相同或相似能力。

2. **Prefer reuse over duplication.**  
   能复用就不重写，能扩展就不新建。

3. **Prefer composition over reinvention.**  
   优先组合现有能力，而不是重新发明一套。

4. **Prefer minimal change over speculative abstraction.**  
   优先最小改动，不为假设的未来需求提前抽象。

5. **Agent 不是架构决策者。**  
   Agent 负责在既定边界内高质量实现，不得擅自改变架构方向、引入新架构模式或大规模重构。

---

## 1. 强制规则（Hard Rules）

### 1.1 先搜索，再创建

本项目是 **React 19 + TypeScript + Tauri v2**（非 Vue）。所有规则按 React 语义理解。

任何新功能、组件、service、hook、utility、Rust command 开始前，必须先搜索：

- 现有组件
- 现有 service
- 现有 store
- 现有 hook
- 现有 utility
- 现有 Rust command
- 现有类型定义

**找不到已有实现，才允许新增。**

示例：需要 Toast 时，先搜索 `Toast` / `toast` / `toastStore` / `Toaster`。  
只有确认不存在，才允许创建新的 Toast 能力。

---

### 1.2 同一能力只能有一个权威实现

每个能力必须有且只有一个权威实现，其他模块只能复用。

例如：

| 能力 | 权威实现 |
|------|----------|
| 通知 | `stores/toastStore` 导出的 `toast` |
| 确认框 | `components/ui/ConfirmDialog` |
| 文件选择 | 经 hook 封装的 `@tauri-apps/plugin-dialog` |
| 存档读取 | `api/save` 的 `saveApi` |
| Mod 扫描 | `api/mods` 的 `modsApi` |
| 窗口控制 | `api/system` 的 `windowControls` |

禁止：

- `SavesPage.tsx` 自己调 `invoke` 读存档
- `EditArchivePage.tsx` 再调一次
- `SettingsPage.tsx` 又写一遍

**Agent 发现已有能力时，必须复用，而不是重新实现。**

---

### 1.3 页面只负责 UI 编排

层级必须保持：

```text
View / Page (features/*/XxxPage.tsx)
    ↓
Hook / Store / Service
    ↓
api/ (tauriInvoke)
    ↓
Rust Command (src-tauri/)
```

禁止页面直接：

- 处理复杂业务逻辑
- 访问文件系统
- 拼装 Rust IPC 参数
- 调用 `invoke()` 或 Tauri 插件入口
- 实现跨页面共享逻辑
- 编写大量数据转换

错误示例：

```ts
// SavesPage.tsx
const files = await invoke("load_all_saves")
const parsed = ...
const filtered = ...
const sorted = ...
```

正确示例：

```ts
// features/saves/hooks/useArchiveList.ts
const saves = await saveApi.loadAllSaves()
```

---

### 1.4 Shared Component 必须真正通用

- 业务专属组件放在对应模块：`features/{name}/components/`
- 全项目通用组件放在：`components/ui/`
- 跨模块共享的领域组件放在：`components/save/`

禁止：

- 把业务组件扔进 shared 目录
- 为了单个页面微调样式，复制 `Button` / `Card` / `Dialog`
- 无限制地膨胀 shared 组件

需要时，应扩展现有组件能力，而不是复制。

---

### 1.5 不允许重复视觉实现

以下内容必须由 Design System / UI 组件统一提供：

```text
Button
Card
Dialog
Toast
Dropdown
Tabs
Table
```

Agent 在自定义样式前，必须先确认 Design Token 或 UI Component 是否已存在。  
禁止私自编写与现有设计系统冲突的 `border-radius`、`box-shadow`、`padding` 等基础样式。

---

### 1.6 不允许为了假设需求提前抽象

禁止以下行为：

- 因为“以后可能支持插件”，先造 Plugin System
- 因为“以后可能支持多个游戏”，先造 Game Provider Framework
- 因为“未来可能支持多种 Mod 来源”，先造 Repository / Adapter / Provider 多层抽象

原则：

> **没有第二个真实需求，就不要为了抽象而抽象。**

---

### 1.7 TS / Rust 边界固定

**TypeScript 负责：**

- UI
- 状态
- 交互
- 展示
- 流程编排

**Rust 负责：**

- 文件系统
- 游戏文件
- 解析
- 进程
- 性能敏感操作
- 系统能力

禁止：

- 把 Rust 本该处理的事情复制到 TS
- 让 Rust 承担前端 UI 状态和展示逻辑

---

### 1.8 修改公共组件必须评估全局影响

修改以下内容前，必须先搜索所有引用：

```text
Button
Dialog
Table
Toast
Layout
Theme
Store
Core Service
```

禁止：

> “这里长得不对，我改一下。”

然后导致多个页面一起变样。

修改公共组件时，必须在变更说明中列出影响范围。

---

### 1.9 一个 PR / 任务只解决一个问题

禁止“顺便重构”：

- 顺手重构目录
- 顺手换组件
- 顺手改状态管理

除非任务明确要求，否则不得扩大修改范围。

---

### 1.10 删除旧实现必须有证据

不能因为“看起来没用了”就删除。

删除前必须确认：

- 全局引用 = 0
- 动态引用 = 无
- 测试通过
- 构建通过

并记录删除原因和验证结果。

---

## 2. 开发流程

任何任务必须按以下顺序执行：

```text
1. 理解需求
2. 搜索现有实现
3. 找到可复用能力
4. 提出最小改动方案
5. 修改
6. 自检
7. 测试
8. 输出变更摘要
```

**第 2、3、4 步是强制步骤。**

Agent 不应一上来就：

> “我来创建 SaveEditor.tsx”

而应该先回答：

- 当前有没有 Save Editor？
- 当前编辑能力在哪里？
- 哪些组件可以复用？
- 哪些逻辑应该进入 hook / service？

---

## 3. 禁止行为清单

```text
禁止：
- 未搜索代码库就创建新组件
- 复制已有业务逻辑
- 在 View 中实现业务逻辑
- 页面直接 invoke Rust command
- 新建重复 Service
- 为单页面创建全局组件
- 引入新依赖解决已有依赖可以解决的问题
- 无需求新增抽象层
- 无理由修改公共组件
- 顺手重构无关代码
- 删除代码而不提供引用和测试证据
```

Agent 最需要的不是“怎么写”，而是**知道什么时候不该写**。

---

## 4. 新组件 / 新服务决策树

### 4.1 创建组件前

```text
我要创建组件 X
    ↓
仓库里有类似 X 吗？
    │
   是 ─────→ 能否复用？
              │
            能 → 复用
              │
            不能
              ↓
      能否扩展现有组件？
              │
            能 → 扩展
              │
            不能
              ↓
      创建业务组件
```

只有走到最后一步，才允许新增组件。

### 4.2 创建 Service 前

```text
我要创建 Service X
    ↓
仓库里有类似 Service 吗？
    │
   是 ─────→ 能否复用或扩展？
              │
            能 → 复用 / 扩展
              │
            不能
              ↓
      创建新 Service，并记录边界
```

同样适用于 store、hook、utility、Rust command。

---

## 5. 代码规模红线

以下阈值不是禁止，而是触发审核：

（与 `docs/development-rules.md` 保持一致）

```text
React Component    > 300 行
Hook               > 200 行
Service            > 300 行
Function           > 80 行
单文件             > 500 行
```

超过时，Agent 必须说明：

- 为什么必须这么大？
- 是否可以拆分？
- 拆分会增加复杂度还是降低复杂度？

**禁止机械拆分。**  
不要把 800 行文件拆成 `useA.ts`、`useB.ts`、`helperA.ts`、`serviceA.ts` 的碎片集合，除非拆分真正改善了职责边界。

---

## 6. 架构地图

仓库必须维护以下文档，Agent 每次开发前应读取相关部分：

```text
docs/
├── architecture.md        # 技术栈与真实目录结构（目录以本文件为准）
├── module-boundaries.md   # 模块依赖白名单与禁止项
├── ui-system.md           # Design Token 与组件库清单
├── data-flow.md           # 状态与数据流
└── development-rules.md   # 规模阈值与 PR 检查单
```

示例：`module-boundaries.md` 中应明确模块依赖规则：

```text
Save
├── 可以访问
│   ├── Core
│   └── Shared UI
│
└── 不可以直接访问
    ├── Mods internals
    └── UE4SS internals
```

**不同 AI 会话之间也必须遵守这些边界。**

---

## 7. 架构审查清单（Review Checklist）

每次 Agent 完成任务后，由 Reviewer（或开发者）逐项检查：

### A. 架构

```text
[ ] 是否创建了重复功能？
[ ] 是否违反模块边界？
[ ] 页面是否包含业务逻辑？
[ ] 是否跨层调用？
[ ] 是否出现重复数据源？
```

### B. UI

```text
[ ] 是否复用 Design System？
[ ] 是否新建了重复组件？
[ ] 样式是否统一？
[ ] 是否修改了公共组件？
[ ] 公共组件修改是否检查全局影响？
```

### C. TypeScript

```text
[ ] 是否出现 any？
[ ] 是否重复类型定义？
[ ] 是否出现巨型组件？
[ ] 是否出现巨型 hook？
[ ] 是否重复 API 调用？
```

### D. Rust / Tauri

```text
[ ] TS / Rust 职责划分是否正确？
[ ] Command 是否有明确边界？
[ ] 是否重复实现后端能力？
[ ] 错误是否统一处理？
```

### E. 维护性

```text
[ ] 是否引入不必要依赖？
[ ] 是否引入不必要抽象？
[ ] 是否留下死代码？
[ ] 是否新增技术债？
[ ] 是否需要补测试？
```

审查结果为：

```text
PASS
```

或

```text
CHANGES_REQUIRED
1. Duplicate Toast implementation
2. SavePage contains backend logic
3. New Dialog duplicates existing ConfirmDialog
```

---

## 8. 两阶段 Agent 协作模式

推荐使用两个角色：

### Agent A：Implementer

负责：

- 写代码
- 按本文件规则执行

### Agent B：Reviewer

只负责：

- 审核代码
- 检查重复实现
- 检查架构违规
- 检查 UI 不统一
- 检查类型重复
- 检查不必要依赖
- 检查技术债
- 检查过度设计

Reviewer 不允许假设“能编译就行”，必须按审查清单输出结论。

---

## 9. 最终总规则

> **“Before adding anything, find out whether it already exists.”**

> **“Prefer reuse over duplication, composition over reinvention, and minimal change over speculative abstraction.”**

Agent 的职责是：**在既定边界内高质量实现，而不是重新定义架构。**

---

**本文件优先级高于任何单个任务指令。**
