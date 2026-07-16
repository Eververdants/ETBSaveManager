# 快速创建存档模式简化方案

**日期**: 2026-07-16  
**状态**: 设计稿 v3  
**关联**: ETBSaveManager v3.0

---

## 游戏结局路线体系

游戏基于 **4 个结局路线（Endings）** 组织关卡：

| 结局 | 标签 | 关卡数 | 关卡范围 |
|------|------|--------|----------|
| 主线 (Ending 0) | 主线 | 42 | Level0 ~ TunnelLevel |
| 支线1 (Ending 1) | 支线1 | 3 | Bunker → GraffitiLevel → Grassrooms_Expanded |
| 支线2 (Ending 2) | 支线2 | 4 | Bunker → TheHub → BottomFloor → Level922 |
| 支线3 (Ending 3) | 支线3 | 5 | Bunker → TheHub → OceanMap → LightsOut → Level974 |

核心逻辑：**选择结局 → 自动加载该结局的关卡列表 → 勾选要创建的关卡 → 批量创建**

---

## 设计方案

### 布局（单页面，极简）

```
┌──────────────────────────────────────────────────────────────┐
│  ← 返回             🚀 快速创建存档               [创建 N 个] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  选择结局路线:                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [ ● 主线 ]  [ 支线1 ]  [ 支线2 ]  [ 支线3 ]          │ │
│  │                     ← 滑动选择器，复用现有组件样式 →      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  勾选要创建的关卡（主线 · 42 关）                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ☐ 全选                             已选 0 / 42 关      │ │
│  │                                                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ │
│  │  │ ✅ Level0 │ │ ☐ TopFlo│ │ ☐ Middle │ │ ☐ Garage │   │ │
│  │  │  教学关卡 │ │  宜居(1)│ │  宜居(2) │ │  宜居(3) │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │ │
│  │  ┌──────────┐ ┌──────────┐ ...                         │ │
│  │  │ ☐ Bottom │ │ ☐ Hub   │                             │ │
│  │  └──────────┘ └──────────┘                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  存档参数:                                                    │
│  难度: [Normal ▾]   每关创建: [1] 份  命名: [路线_关卡_难度]  │
│                                                              │
│  ── 预览 (即将创建 42 个存档) ──                              │
│  Level0_Normal  TopFloor_Normal  MiddleFloor_Normal  ...      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 核心交互流程

```
1. 选结局 → 默认选中该结局全部关卡
   ├─ 切换结局 → 关卡网格切换为该结局的关卡列表
   └─ 勾选关卡 → 支持全选/反选/单选

2. 设参数
   ├─ 难度: easy / normal / hard / nightmare
   ├─ 份数: 每关创建几份（>1 自动加序号后缀）
   └─ 命名格式: 固定为 "关卡名_难度"

3. 预览 + 创建
   ├─ 简洁文本列表，无卡片动画
   └─ 点击创建 → 批量调用后端 → 弹窗显示结果
```

### 复用组件

| 组件 | 来源 | 改动 |
|------|------|------|
| `ending-selector`（结局切换） | `Step1SelectLevel.vue` 的 `ending-group` | 样式复用，行为改为**切换关卡网格 + 自动重置勾选** |
| `level-card`（关卡卡片） | `Step1SelectLevel.vue` 的 `level-card` | 样式复用，点击行为改为**多选勾选**（而非单选） |
| `createArchive`（单个创建） | `CreateArchive/index.vue` 的 `createArchive` | 逻辑复用，改为批量循环调用 |

### 存档命名规则

```
格式: {关卡Key}_{难度}

示例: Level0_Normal
      Level0_Normal(2)   ← 份数 > 1 时自动加序号
      TopFloor_Hard
```

---

## 与现有组件的关联

```
快速创建页面 (QuickCreateArchive.vue)
  │
  ├─ 结局选择器 ← 复用 Step1SelectLevel 的 ending-group HTML 结构 + CSS
  │               但逻辑改为：切换结局时替换关卡列表、重置勾选状态
  │
  ├─ 关卡网格 ← 复用 Step1SelectLevel 的 level-card HTML 结构 + CSS
  │             但逻辑改为：多选而非单选、增加全选/取消全选
  │
  ├─ 预览列表（新增 PreviewList.vue）纯文本
  │
  ├─ 创建逻辑 ← 复用 useQuickCreate.ts 的 batchCreateArchives / createSingleArchive
  │             但输入来源改为"结局 + 勾选的关卡列表"
  │
  └─ 存档名称 → 废弃 SmartInputArea 中本功能入口
```

---

## 性能优化

| 项 | 当前 | 改为 |
|----|------|------|
| BATCH_DELAY | 100ms | **0ms** |
| DEBOUNCE_DELAY | 300ms | **0ms** |
| 卡片动画 | 任何时候都播放 | **只在点击/切换结局时短暂过渡** |
| 用户步骤 | 4-6 步 | **3 步（选结局→勾关卡→创建）** |
| 文本粘贴/批量配置 | 默认显示 | **整页移除**（不再需要） |

---

## 组件变更清单

### 新增

| 组件 | 职责 |
|------|------|
| `src/components/quickCreate/EndingSelector.vue` | 结局切换（主线/支线1/2/3），复用 Step1SelectLevel 样式 |
| `src/components/quickCreate/LevelCheckGrid.vue` | 关卡多选网格，复用 level-card 样式 + 全选逻辑 |
| `src/components/quickCreate/PreviewList.vue` | 简洁文本预览列表 |

### 修改

| 文件 | 变更 |
|------|------|
| `src/views/QuickCreateArchive.vue` | 整页重写：结局选择 + 关卡勾选 + 预览，**删除** SmartInputArea / UniformConfigPanel / ArchiveCardFlow |
| `src/composables/useQuickCreate.ts` | 简化：去掉档案名称解析/搜索/规则逻辑，输入改为"结局+关卡列表+难度" |

### 删除

| 文件 | 原因 |
|------|------|
| `src/components/feature/SmartInputArea.vue` | 快速模式不再需要文本粘贴 |
| `src/components/system/UniformConfigPanel.vue` | 快速模式不再需要批量配置 |
| `src/components/archive/ArchiveCardFlow.vue` | 快速模式不再需要卡片流（简化为预览列表） |
| `src/composables/useQuickCreateArchiveCard.ts` | 不再使用 |
| `src/views/SelectCreateMode.vue` | 可选：改为在首页加一个按钮切换 |

---

## 保留的动画

| 位置 | 效果 |
|------|------|
| 结局切换时关卡网格切换 | 0.18s fade（复用现有 level-grid-fade 过渡） |
| 点击勾选关卡卡片 | 0.1s scale 反馈（复用现有 gsap 动画） |
| 创建成功弹窗 | 0.3s slideIn |
| 预览列表 | **无动画** |

---

## 边界情况

| 场景 | 行为 |
|------|------|
| 未勾选任何关卡点创建 | 按钮置灰，提示"请至少选择 1 个关卡" |
| 切换结局时已勾选关卡 | 清空勾选状态（新结局不同关卡列表） |
| 份数设为 0 | 自动修正为 1 |
| 创建失败 | 弹窗显示成功/失败数量，失败详情可展开 |
| 部分成功 | 弹窗显示"12/42 创建成功"，不自动清空已创建的 |
