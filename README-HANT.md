<p align="center">
  <img src="./src-tauri/icons/128x128.png" alt="ETB Save Manager" width="128">
</p>

<h1 align="center">ETB Save Manager</h1>

<p align="center">
  《逃離後室》存檔管理工具，基於 Tauri 2.0 構建。
</p>

<p align="center">
  <a href="./README-CN.md">简体中文</a>
  · <a href="#">繁體中文</a>
  · <a href="./README.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/github/v/release/Eververdants/ETBSaveManager" alt="Version"></a>
  <a href="https://github.com/Eververdants/ETBSaveManager/actions"><img src="https://img.shields.io/github/actions/workflow/status/Eververdants/ETBSaveManager/release.yml" alt="CI"></a>
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/github/downloads/Eververdants/ETBSaveManager/total" alt="Downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Eververdants/ETBSaveManager" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-Windows-blue" alt="Platform">
</p>

## 功能特性

### 存檔管理

- **完整增刪改查** — 建立、編輯、刪除、複製、隱藏/顯示存檔
- **軟刪除與資源回收筒** — 刪除的存檔可復原或永久刪除
- **批次操作** — 多選模式，同時處理多個存檔
- **收藏與排序** — 標記重要存檔；依名稱、日期、層級或收藏排序
- **智慧篩選** — 按層級、難度、遊戲模式搜尋篩選
- **快速搜尋** — 模糊匹配，即時定位目標存檔
- **復原 / 重做** — 完整的存檔操作復原與重做支援
- **虛擬捲動** — 大量存檔時依然保持流暢

### 現代化介面

- **簡潔設計** — 直覺的介面，搭配 GSAP 驅動的流暢動畫
- **13 套主題** — 淺色、深色及 10 套色彩主題
- **響應式佈局** — 可摺疊側邊欄，自適應元件
- **硬體加速** — GPU 最佳化渲染，確保流暢體驗
- **全域搜尋** — 任意頁面按 `Ctrl+F` 即時搜尋
- **新手引導** — 首次使用時的互動式引導覆蓋層

### 多語言支援

內建語言：

- 简体中文
- 繁體中文
- English

> 國際化系統採用模組化設計，可透過新增語言檔案來貢獻更多語言。

### 進階功能

- **多種建立模式**
  - 快速建立 — 簡化流程，快速產生存檔
  - 標準建立 — 完整的自訂選項，分步嚮導
- **背包編輯器** — 可視化的玩家背包物品編輯器
- **玩家資料編輯** — 編輯背包物品、理智值等玩家屬性
- **通知系統** — 持久化通知中心，追蹤應用事件
- **效能監控** — 內建 FPS 與記憶體診斷工具（開發模式）
- **效能設定** — 調整 GPU 渲染與動畫偏好
- **統一設定面板** — 集中化的設定管理介面

---

## 介面預覽

> 以下截圖使用「海洋」主題演示

<p align="center">
  <img src="./docs/存档列表-zh.png" alt="存檔列表" width="49%">
  <img src="./docs/创建存档页面第一步-zh.png" alt="建立存檔第一步" width="49%">
</p>

<p align="center">
  <img src="./docs/快速创建存档页面-zh.png" alt="快速建立存檔" width="49%">
  <img src="./docs/编辑页面-zh.png" alt="編輯頁面" width="49%">
</p>

---

## 安裝方式

### 下載安裝包

1. 前往 [Releases 頁面](https://github.com/Eververdants/ETBSaveManager/releases/latest)
2. 下載 Windows 安裝包（`.msi` 或 `.exe`）
3. 執行安裝程式

> **提示：** 可能需要安裝 [WebView2 執行環境](https://developer.microsoft.com/microsoft-edge/webview2)（Windows 10/11 通常已預裝）

### 從原始碼建置

```bash
# 複製儲存庫
git clone https://github.com/Eververdants/ETBSaveManager.git
cd ETBSaveManager

# 安裝相依套件
pnpm install

# 開發模式執行
pnpm tauri dev

# 建置生產版本
pnpm tauri build
```

**環境需求：**

- Node.js 18+
- Rust 工具鏈
- 平台相關相依套件（參見 [Tauri 環境設定](https://v2.tauri.app/start/prerequisites/)）

---

## 維護策略

本專案按需進行維護：

- **地圖更新** — 當 *Escape The Backrooms* 發佈新地圖（關卡）時，本工具將同步更新以支援新的存檔資料格式和關卡元資料。
- **Bug 修復與優化** — 當發現並回報了 Bug 或效能問題時，會及時進行修復和優化。
- **功能請求** — 超出遊戲相容性範疇的新功能將按具體情況評估。歡迎透過 Issue 討論。

> 本專案的主要目標是保持存檔管理器與遊戲版本同步更新。社群貢獻的新功能同樣歡迎！

---

## 技術棧

### 前端

| 技術 | 用途 |
|------|------|
| Vue 3 + Composition API | 響應式 UI 框架 |
| TypeScript | 型別安全的開發體驗 |
| Vite 6 | 建置工具和開發伺服器 |
| Tailwind CSS 4 | 原子化 CSS 框架 |
| CSS Variables | 動態主題系統 |
| vue-i18n | 國際化 |
| Vue Router 4 | 單頁應用路由 |
| GSAP | 高效能動畫 |
| @tanstack/vue-virtual | 大數據列表虛擬捲動 |
| FontAwesome 7 | 向量圖示 |
| Chart.js | 資料視覺化 |
| @vue-flow/core | 節點流程編輯器 |
| vitest + fast-check | 單元測試與屬性測試 |

### 後端 (Rust)

| 技術 | 用途 |
|------|------|
| Tauri 2.0 | 桌面應用框架 |
| uesave 0.6.2 | UE4 存檔檔案解析 |
| serde + serde_json | 資料序列化 |
| rusqlite | 本機 SQLite 資料庫 |
| tokio + reqwest | 非同步 HTTP 用戶端 |
| walkdir + memmap2 | 高效檔案操作 |
| rayon | 平行運算 |
| chrono | 日期/時間處理 |
| uuid | 唯一 ID 生成 |
| regex | 模式匹配 |
| thiserror | 錯誤處理 |

---

## 專案結構

```
ETBSaveManager/
├── src/                              # Vue 前端（TypeScript）
│   ├── components/
│   │   ├── archive/                  # 存檔相關元件
│   │   │   ├── ArchiveCard.vue
│   │   │   ├── ArchiveCardFlow.vue
│   │   │   ├── ArchiveSearchFilter.vue
│   │   │   └── QuickCreateArchiveCard.vue
│   │   ├── feature/                  # 功能元件
│   │   │   ├── FloatingActionButton.vue
│   │   │   ├── GlobalSearchPanel.vue
│   │   │   ├── InventoryItemSelector.vue
│   │   │   ├── PreviewExecuteArea.vue
│   │   │   ├── SmartInputArea.vue
│   │   │   └── TutorialOverlay.vue
│   │   ├── layout/                   # 佈局元件
│   │   │   ├── Sidebar.vue
│   │   │   └── TitleBar.vue
│   │   ├── modal/                    # 模態對話框
│   │   │   ├── ArchiveEditModal.vue
│   │   │   ├── BatchEditModal.vue
│   │   │   ├── ConfirmModal.vue
│   │   │   └── PromptPopup.vue
│   │   ├── system/                   # 系統工具
│   │   │   ├── PerformanceMonitor.vue
│   │   │   ├── PerformanceSettings.vue
│   │   │   ├── PlayerManager.vue
│   │   │   └── UniformConfigPanel.vue
│   │   ├── theme/                    # 主題選擇
│   │   │   └── ThemeSelector.vue
│   │   └── ui/                       # 可複用 UI 元件
│   │       ├── CustomDropdown.vue
│   │       ├── CustomSlider.vue
│   │       ├── ErrorBoundary.vue
│   │       ├── LazyImage.vue
│   │       └── NotificationPopup.vue
│   ├── composables/                  # Vue 組合式函式
│   │   ├── useArchiveActions.ts      # 存檔 CRUD 操作
│   │   ├── useArchiveData.ts         # 存檔資料管理
│   │   ├── useArchiveCard.ts         # 卡片互動
│   │   ├── useArchiveCardFlow.ts     # 流模式邏輯
│   │   ├── useArchiveFilters.ts      # 篩選與搜尋
│   │   ├── useUndoRedo.ts            # 復原/重做
│   │   ├── useGlobalSearchPanel.ts   # 全域搜尋
│   │   ├── useFloatingActionButton.ts
│   │   ├── useQuickCreate.ts
│   │   ├── usePlayerManager.ts
│   │   ├── usePerformanceMonitor.ts
│   │   ├── usePerformanceSettings.ts
│   │   ├── useTutorialOverlay.ts
│   │   ├── useToast.ts
│   │   ├── useValidator.ts
│   │   ├── useNameParser.ts
│   │   ├── useReleaseNotes.ts
│   │   ├── useConfigResolver.ts
│   │   ├── useFocusTrap.ts
│   │   ├── useAnimations.ts
│   │   ├── useUniformConfigPanel.ts
│   │   └── useInventoryItemSelector.ts
│   ├── config/                       # 應用設定
│   │   ├── cdnConfig.ts
│   │   ├── sidebarMenu.ts
│   │   ├── updateConfig.ts
│   │   └── version.ts
│   ├── i18n/                         # 國際化
│   │   ├── index.ts
│   │   ├── loader.ts
│   │   └── locales/
│   │       ├── en-US/                # 英語（按領域劃分的 JSON 檔案）
│   │       ├── zh-CN/                # 簡體中文
│   │       └── zh-TW/                # 繁體中文
│   ├── router/                       # Vue Router 設定
│   ├── services/                     # 業務邏輯服務
│   │   ├── storageService.ts         # 持久化儲存
│   │   ├── logService.ts             # 日誌記錄
│   │   ├── notificationService.ts    # 通知管理
│   │   ├── popupService.ts           # 彈窗管理
│   │   ├── themeStorage.ts           # 主題持久化
│   │   ├── pluginStorage.ts          # 外掛資料
│   │   └── updateService.ts          # 自動更新
│   ├── styles/
│   │   ├── animations.css
│   │   └── themes/                   # 主題 CSS 檔案
│   │       ├── _colors.css
│   │       ├── _components.css
│   │       ├── _semantic.css
│   │       ├── light.css / dark.css
│   │       ├── high-contrast.css
│   │       ├── ocean.css / forest.css
│   │       ├── sunset.css / lavender.css
│   │       ├── rose.css / mint.css
│   │       ├── peach.css / sky.css
│   │       └── index.css
│   ├── utils/                        # 工具函式
│   │   ├── icons.ts / icons-full.ts / icons-critical.ts
│   │   ├── nameParser.ts
│   │   ├── performance.ts
│   │   ├── consoleForwarder.ts
│   │   ├── polyfills.ts
│   │   ├── disableInteractions.ts
│   │   └── floatingButtonProtection.ts
│   ├── views/                        # 頁面視圖
│   │   ├── Home.vue                  # 存檔列表
│   │   ├── CreateArchive/            # 建立存檔嚮導
│   │   ├── EditArchive.vue           # 編輯存檔
│   │   ├── QuickCreateArchive.vue    # 快速建立
│   │   ├── SelectCreateMode.vue      # 模式選擇
│   │   ├── Settings.vue              # 應用設定
│   │   ├── About.vue                 # 關於頁面
│   │   ├── Log.vue                   # 操作日誌
│   │   └── TestArchive.vue           # 測試工具
│   ├── types.ts                      # 全域型別定義
│   ├── appContext.ts                 # 依賴注入上下文
│   ├── App.vue                       # 根元件
│   └── main.ts                       # 應用入口
├── src-tauri/                        # Rust 後端
│   └── src/
│       ├── lib.rs                    # 庫入口 / Tauri 設定
│       ├── main.rs                   # 主程式入口
│       ├── save_commands.rs          # 存檔 CRUD 命令
│       ├── save_editor.rs            # 存檔檔案編輯
│       ├── save_shared.rs            # 共享存檔型別
│       ├── save_utils.rs             # 存檔檔案工具
│       ├── new_save.rs               # 存檔建立邏輯
│       ├── player_data.rs            # 玩家資料處理
│       ├── cli_handlers.rs           # CLI 命令處理
│       ├── system_commands.rs        # 系統級命令
│       ├── theme_commands.rs         # 主題管理
│       ├── gpu_settings.rs           # GPU/渲染設定
│       ├── get_file_path.rs          # 檔案路徑解析
│       ├── common.rs                 # 通用輔助函式
│       └── error.rs                  # 錯誤型別定義
├── public/                           # 靜態資源
│   ├── icons/                        # 遊戲物品圖示
│   └── images/                       # 遊戲關卡圖片
├── docs/                             # 截圖
├── scripts/                          # 建置腳本
│   └── sync-version.js               # 版本同步
├── dist/                             # 建置輸出
├── index.html                        # HTML 入口
├── vite.config.ts                    # Vite 設定
├── tsconfig.json                     # TypeScript 設定
├── eslint.config.js                  # ESLint 設定
├── package.json
└── pnpm-lock.yaml
```

---

## 主題列表

ETB Save Manager 內建 13 套主題：

### 基礎主題
- **Light（淺色）** — 清新的淺色主題
- **Dark（深色）** — 舒適的深色主題

### 色彩主題
- **Ocean（海洋）** — 深藍色海洋風格
- **Forest（森林）** — 自然綠色森林風格
- **Sunset（日落）** — 溫暖的橙色日落色調
- **Lavender（薰衣草）** — 柔和的紫色薰衣草
- **Rose（玫瑰）** — 優雅的粉色玫瑰
- **Mint（薄荷）** — 清新的薄荷綠
- **Peach（蜜桃）** — 柔和的蜜桃色調
- **Sky（天空）** — 明亮的天空藍

---

## 參與貢獻

歡迎貢獻程式碼！這是一個個人學生專案，任何幫助都非常感謝。

- [回報 Bug](https://github.com/Eververdants/ETBSaveManager/issues)
- [功能建議](https://github.com/Eververdants/ETBSaveManager/issues)
- 聯絡信箱：**llzgd@outlook.com**

---

## 免責聲明

本專案**與 Fancy Games 或《逃離後室》沒有任何關聯、背書或連結**。

遊戲素材（如關卡圖示）**僅用於識別目的**，以協助使用者辨識存檔所屬的關卡。  
《逃離後室》及其素材的所有權利均屬於其各自所有者。

---

## 星標歷史

<p align="center">
  <a href="https://star-history.com/#Eververdants/ETBSaveManager&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Eververdants/ETBSaveManager&type=Date&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Eververdants/ETBSaveManager&type=Date" />
      <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Eververdants/ETBSaveManager&type=Date" />
    </picture>
  </a>
</p>

---

## 開源授權

---

<p align="center">
  <sub>使用 Vue.js 和 Tauri 建置</sub>
</p>
