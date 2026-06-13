# ETBSaveManager 优化分析报告

> 生成日期：2026-06-13
> 项目版本：3.1.0
> 技术栈：Tauri v2 + Vue 3 + Tailwind CSS 4 + Rust

---

## 目录

- [性能优化](#一性能优化)
- [Rust 后端架构优化](#二rust-后端架构优化)
- [前端架构优化](#三前端架构优化)
- [安全与数据完整性](#四安全与数据完整性)
- [构建与配置](#五构建与配置)
- [优先级排序](#六建议优先级排序)

---

## 一、性能优化

### 1. 💾 存储系统：防丢失短板

**文件：** `src/services/storageService.js`

设置数据全部缓存在内存中，每 500ms debounce 一次写入磁盘。如果在 debounce 窗口内应用崩溃，最后更改的设置会丢失。

**建议：**
- 对关键配置（`theme`, `language`, `locale` 等）提供同步双写选项
- 在页面关闭 / 窗口隐藏时主动执行一次 `flush()`
- 当前已有 `KEYS_TO_KEEP_IN_LOCALSTORAGE` 机制将关键值同步到 `localStorage`，但这在 Tauri WebView 环境下不太可靠，建议同样保证文件写入的及时性

```diff
// 关键配置变更时立即写入，而非等待 debounce
+ if (CRITICAL_KEYS.includes(key)) {
+   await saveToFile(); // 立即同步写入
+ } else {
+   debouncedSave();    // 非关键配置仍可 debounce
+ }
```

---

### 2. 📦 Bundle 体积：两个虚拟滚动库冲突

**文件：** `package.json`

同时依赖了两个虚拟滚动方案：

| 库 | 用途 | 体积 |
|---|---|---|
| `@tanstack/vue-virtual` `^3.13.13` | Headless 虚拟滚动 | ~15KB |
| `vue-virtual-scroller` `2.0.0-beta.8` | 封装组件式虚拟滚动 | ~30KB + 依赖 |

**建议：** 统一为一个。如果已全面使用 `@tanstack/vue-virtual`，移除 `vue-virtual-scroller`。两个库功能重叠，打包两套方案浪费带宽和内存。

---

### 3. 📦 Bundle 体积：两个 Markdown 解析器

**文件：** `package.json`

同时依赖了两个 Markdown 渲染引擎：

| 库 | 插件数量 |
|---|---|
| `markdown-it` | `markdown-it-attrs`、`markdown-it-container`、`markdown-it-sanitizer` |
| `marked` | 无额外插件 |

**建议：** 检查实际使用场景。如果 `markdown-it` 的插件生态已经满足了所有 Markdown 渲染需求，移除 `marked`，约节省 ~40KB。

---

### 4. 🖼️ FontAwesome 按需加载可优化

**文件：** `src/main.js`、`src/utils/icons-full.js`（234行）、`src/utils/icons-critical.js`（82行）

目前采用两阶段加载（Critical → Full），但 `icons-full.js` 可能注册了大量未实际使用的图标。

**建议：**
- 手动审查所有 Vue 组件中实际用到的 `faIcon` 名称
- 只注册用到的图标，移除无用的 import
- 或使用 `tree-shaking` 配合 FontAwesome 官方 subset 工具

---

### 5. 🎯 大组件拆分

以下视图文件超过 1000 行，不利于维护和 IDE 性能：

| 文件 | 行数 | 建议 |
|------|------|------|
| `src/views/Settings.vue` | 2895 | 拆为 GeneralSettings / PluginSettings / About 等子组件 |
| `src/views/SteamCache.vue` | 2289 | 拆为 CacheList / CacheDetail / BatchActions |
| `src/views/QuickCreateArchive.vue` | 1773 | 复用已有的多步向导组件模式 |
| `src/views/EditArchive.vue` | 1622 | 拆分编辑面板为独立组件 |
| `src/views/Home.vue` | 1047 | 拆分卡片区域和工具栏 |
| `src/views/Feedback.vue` | 1104 | 拆分表单 / 历史列表 / 状态卡片 |
| `src/views/TestArchive.vue` | 1049 | 拆分测试面板 |

通用拆分模式：每 300-400 行作为一个功能模块拆出独立组件。

---

### 6. 🎯 大 Composable 拆分

| 文件 | 行数 | 问题 | 建议 |
|------|------|------|------|
| `src/composables/useQuickCreate.js` | 1088 | 完整的存档创建逻辑全部堆在一个文件 | 拆为 useQuickCreateForm / useQuickCreateBatch / useQuickCreateValidation |
| `src/composables/useNameParser.js` | 636 | 纯函数与 Vue composable 混在一起 | 将 parseName / parseMultiple / parseCSV 等纯函数移到 `src/utils/nameParser.js`，composable 只保留响应式状态管理层 |

---

## 二、Rust 后端架构优化

### 7. 🔁 DRY：严重代码重复（**P0**）

`new_save.rs` 与 `save_editor.rs` 之间存在大量重复代码。

#### 重复函数

| 函数 | `new_save.rs` | `save_editor.rs` | 说明 |
|------|---------------|-------------------|------|
| `create_default_world_property()` | 第 352 行 | 第 517 行 | **完全相同的 50 行代码** |
| `update_difficulty()` | 第 272 行 | 第 139 行 | **几乎相同的逻辑** |
| `modify_current_level()` | 第 210 行 | 第 70 行 | **几乎相同** |
| Pipe 处理逻辑 | 第 241 行 | 第 105 行 | 分散在 `process_pipes_level` 和 `handle_pipes_unlocked_fun` 中 |

#### 重复常量

| 常量 | `new_save.rs` | `save_editor.rs` |
|------|---------------|-------------------|
| 层级列表 | `ALL_LEVELS`（第 37 行，42 个） | `HUB_DOOR_LEVELS`（第 476 行，33 个） |
| Item 映射 | 通过 `crate::save_editor::map_item_id_to_name` 引用 | `ITEM_MAP`（第 13 行） |
| 属性名常量 | 各自定义 | 各自定义 |

#### 建议

```rust
// 新建 src-tauri/src/save_shared.rs
// 提取共享函数：
// - create_default_world_property()
// - update_difficulty()
// - modify_current_level()
// - map_item_id_to_name()
// - process_pipes_level()
// - INVENTORY_PROP_NAME, SANITY_PROP_NAME 等常量
// - 层级列表常量
```

然后在 `new_save.rs` 和 `save_editor.rs` 中统一引用 `crate::save_shared::*`。

---

### 8. 🧠 OS 版本检测开销（低优先级）

**文件：** `src-tauri/src/system_info.rs`（第 69 行）

Windows 下每次调用 `get_os_version()` 都 spawn 一个 `cmd /C ver` 子进程。虽然有 `OnceLock` 缓存，但第一次调用有约 30-50ms 的子进程开销。

**建议：** 对于纯离线应用的反馈功能，影响极小，保持现状即可。如果将来需要优化，可用 `windows-sys` crate 调用 `RtlGetVersion`。

---

### 9. 🛡️ 错误模型：String-only 丢失类型信息

**文件：** `src-tauri/src/error.rs`

```rust
#[derive(Debug, Clone, Serialize, Error)]
#[error("{message}")]
pub struct AppError {
    pub message: String,
}
```

所有错误都通过单一 `String` 字段传播，前端无法区分错误类型（IO / JSON / 验证 / 授权）。

**建议：**

```rust
#[derive(Debug, Clone, Serialize, Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(String),
    #[error("Parse error: {0}")]
    Parse(String),
    #[error("Validation error: {0}")]
    Validation(String),
    #[error("{0}")]
    General(String),
}
```

前端可根据不同 error type 展示不同的 UI。

---

### 10. 🧩 `AppResult` 与 `Result<T, String>` 混用

部分函数返回 `AppResult<T>`（即 `Result<T, AppError>`），部分返回 `Result<T, String>`，风格不一致。

```rust
// ✅ 一致风格
pub fn some_func() -> AppResult<T> { ... }

// ❌ 不一致
pub fn other_func() -> Result<T, String> { ... }
```

**建议：** 统一为 `AppResult<T>`，利用从 `String` 到 `AppError` 的自动转换 `From` 实现。

---

## 三、前端架构优化

### 11. 🔄 Service 模式 vs Composable 模式不一致

项目中存在两种模式并存：

| Class 式 Service 单例 | Composable 函数式 |
|---|---|
| `themeStorage.js` | `useThemeList.js` |
| `themeValidator.js` | `useArchiveData.js` |
| `updateService.js` | `useConfigResolver.js` |
| `feedbackService.js` | ... |
| `notificationService.js` | |

**建议：** 统一为 Composable 模式，与 Vue 3 响应式系统更好地集成。纯逻辑无状态模块（如 `themeValidator`）可保留纯函数模块。

---

### 12. 🔌 插件系统复杂度评估

**目录：** `src/plugins/`

系统由以下部分组成：
- `PluginManager.js` — 核心管理器
- `LanguagePluginLoader.js` — 语言包加载
- `PagePluginLoader.js` — 页面插件加载
- `ThemePluginLoader.js` — 主题包加载
- `pluginStorage.js` — 插件持久化
- `plugins.json` — 插件注册表
- 12 个内置插件/主题/语言包

**建议：** 评估实际插件使用率。如果主题和语言功能已内置，插件系统可能增加不必要的复杂度，可考虑简化。

---

### 13. 🔧 类级服务中的重复模式

`themeStorage.js` 中存在多个函数每次都调用 `loadCustomThemes()` 全量加载后再过滤：

```javascript
// 每次都全量加载后查找
async themeExists(themeId) {
  const themes = await this.loadCustomThemes();
  return themes.some((t) => t.id === themeId);
}
async getCustomTheme(themeId) {
  const themes = await this.loadCustomThemes();
  return themes.find((t) => t.id === themeId) || null;
}
async getThemeCount() {
  const themes = await this.loadCustomThemes();
  return themes.length;
}
```

**建议：** 使用简单的内存缓存，在增删操作后标记失效，减少重复的 IPC 调用。

---

## 四、安全与数据完整性

### 14. ✅ 现有做得好的

- **CSP** 在 `tauri.conf.json` 中严格配置，限制加载来源
- **路径遍历防护**：`common.rs` 中的 `validate_path_under_base()` 双重检查机制
- **加密体系**：AES-256-GCM + Argon2id + `keyring` 系统凭据管理 → 流程正确
- **Steam API Key**：用系统凭据管理器存储，非明文 JSON
- **反馈系统**：正则过滤 PII（Email / Token / 用户路径）后再发送

---

### 15. ⚠️ Zeroizing 类型传递风险

**文件：** `src-tauri/src/encryption.rs`

`load_master_key()` 返回 `Zeroizing<[u8; 32]>`（确保内存使用后清零），但 `encrypt_file` / `decrypt_file` 接收的是普通 `&[u8; 32]` 引用。

```rust
// 当前：接收普通引用
pub fn encrypt_file(master_key: &[u8; MASTER_KEY_LEN], ...)
pub fn decrypt_file(master_key: &[u8; MASTER_KEY_LEN], ...)
```

**建议：** 内部函数统一接收 `&Zeroizing<[u8; 32]>`，防止调用链中意外复制 key。

---

## 五、构建与配置

### 16. 📦 LTO 优化

**文件：** `src-tauri/Cargo.toml`

当前 release profile：

```toml
[profile.release]
lto = "thin"
strip = true
```

**建议：**

```toml
[profile.release]
lto = "fat"            # 更积极的 LTO（编译时间 ~2×，二进制 -5~15%）
codegen-units = 1      # 单代码生成单元，优化更彻底
panic = "abort"        # 如果不用 unwind 捕获 panic，减小体积
strip = true
```

> 注：`panic = "abort"` 需要确保代码中没有使用 `std::panic::catch_unwind`。

---

### 17. ⚡ Vite terser passes

**文件：** `vite.config.js`

```javascript
passes: 1,
```

**建议：** 如果构建时间不是瓶颈，设为 `passes: 2` 可额外压缩 1-3% 体积。

---

### 18. 🔄 pnpm-lock.yaml 不一致

**状态：** `pnpm-lock.yaml` 在 git 中标记为修改状态（` M pnpm-lock.yaml`），可能是依赖版本变更未锁定。

**建议：**

```bash
pnpm install --frozen-lockfile
# 或重新生成 lockfile
pnpm install
```

---

## 六、建议优先级排序

| 优先级 | ID | 优化项 | 预估工时 | 影响 |
|--------|----|--------|----------|------|
| 🔴 **P0** | 7 | Rust 代码去重（new_save.rs 与 save_editor.rs） | 1-2 天 | 减少维护成本，fix bug 不会漏修 |
| 🔴 **P0** | — | 检查 `src/plugins/core/PluginManager.js` 导入路径 | 30 分钟 | 防止运行时崩溃 |
| 🟠 **P1** | 2 | 统一 Markdown 解析器（去掉 `marked`） | 1-2 小时 | 减小 ~40KB bundle |
| 🟠 **P1** | 3 | 统一虚拟滚动库（去掉 `vue-virtual-scroller`） | 1-2 小时 | 减小 ~30KB bundle |
| 🟠 **P1** | 1 | 关键配置同步持久化 | 2-3 小时 | 防设置数据丢失 |
| 🟠 **P1** | 16 | Cargo profile 优化 | 30 分钟 | 减小二进制体积 ~10% |
| 🟡 **P2** | 5 | 大组件拆分（Settings / SteamCache 等） | 2-3 天 | 改善可维护性和加载性能 |
| 🟡 **P2** | 6 | 大 Composables 拆分 | 1 天 | 改善代码组织 |
| 🟡 **P2** | 10 | 统一错误风格（AppResult vs Result<String>） | 2-3 小时 | 代码一致性 |
| 🟡 **P2** | 11 | 统一前端 Service / Composable 模式 | 持续 | 减少认知负担 |
| 🟡 **P2** | 18 | 修复 pnpm-lock.yaml 不一致 | 10 分钟 | 依赖锁定一致 |
| 🟢 **P3** | 9 | 结构化错误类型（Enum variants） | 1 天 | 更好的前端错误展示 |
| 🟢 **P3** | 13 | ThemeStorage 添加内存缓存 | 1-2 小时 | 减少重复 IPC |
| 🟢 **P3** | 15 | Zeroizing 类型传递加强 | 1 小时 | 提高加密安全性 |
| 🔵 **P4** | 17 | terser passes: 2 | 30 分钟 | 微量额外压缩 |
| 🔵 **P4** | 8 | OS 版本改用 WinAPI | 2-3 小时 | 减少首次延迟 |
| 🔵 **P4** | 12 | 插件系统简化评估 | 待评估 | 看实际需求 |

---

> 本报告基于代码静态分析，建议在实施前对关键优化项进行影响评估和测试。
