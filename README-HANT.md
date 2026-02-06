# 🕳️ 逃離後室存檔管理器 (E.T.B. Save Manager)

<p align="center">
  <img src="./src-tauri/icons/128x128.png" alt="E.T.B. Save Manager" width="128">
</p>

<p align="center">
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/badge/版本-3.0.0--Beta--1-blue.svg" alt="版本"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/授權-MIT-green.svg" alt="授權"></a>
  <img src="https://img.shields.io/badge/平台-Windows-0078D4.svg?logo=windows" alt="平台">
  <img src="https://img.shields.io/badge/框架-Tauri%202.0-orange.svg" alt="框架">
</p>

<p align="center">
  <b>一款現代化、跨平台的《逃離後室》存檔管理工具</b>
</p>

<p align="center">
  <a href="./README-CN.md">简体中文</a> | <a href="#">繁體中文</a> | <a href="./README.md">English</a>
</p>

---

## ✨ 功能特性

### 🗂️ 存檔管理

- **完整的增刪改查** — 建立、編輯、刪除、複製、隱藏/顯示存檔
- **批次操作** — 同時處理多個存檔
- **智慧篩選** — 按層級、難度、遊戲模式篩選
- **快速搜尋** — 模糊匹配，即時定位目標存檔

### 🎨 現代化介面

- **現代化設計** — 簡潔直觀的介面，流暢的動畫效果
- **主題系統** — 淺色、深色主題，以及節日特別主題
- **響應式佈局** — 可摺疊側邊欄，自適應元件
- **硬體加速** — GPU 優化渲染，確保流暢體驗

### 🌍 多語言支援

內建語言：

- 简体中文
- 繁體中文
- English

透過外掛擴充：

- 日本語 (日語)
- 한국어 (韓語)
- Русский (俄語)
- Português (巴西葡萄牙語)

> ⚠️ **注意：** 語言外掛可能不會隨版本更新而及時更新。

### 🛠️ 進階功能

- **多種建立模式**
  - 快速建立 — 簡化流程，快速產生存檔
  - 藍圖建立（實驗功能）— 節點圖編排，需在 設定 > 開發者選項 啟用
  - 標準建立 — 完整的自訂選項
- **藍圖範本** — 保存並重複使用藍圖流程
- **背包編輯器** — 直接修改玩家背包物品
- **Steam 快取管理** — 管理本機 Steam 快取資料
- **反饋系統** — 內建反饋提交功能，直達開發者
- **外掛市場** — 從外掛市場下載語言包和主題
- **效能監控** — 內建診斷工具（開發模式）

---

## 🖥️ 介面預覽

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

## 📦 安裝方式

### 下載安裝包

1. 前往 [Releases 頁面](https://github.com/Eververdants/ETBSaveManager/releases/tag/v3.0.0-Beta-2)
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
- 平台相關相依套件（參見 [Tauri 環境設定](https://tauri.app/v1/guides/getting-started/prerequisites)）

---

## 🧰 技術棧

| 層級     | 技術                     |
| -------- | ------------------------ |
| 前端框架 | Vue 3 + Composition API  |
| 樣式方案 | CSS Variables + 主題系統 |
| 建置工具 | Vite 6                   |
| 桌面框架 | Tauri 2.0 + Rust         |
| 國際化   | vue-i18n                 |
| 動畫庫   | GSAP                     |
| 虛擬捲動 | @tanstack/vue-virtual    |

---

## 📁 專案結構

```
ETBSaveManager/
├── src/                    # Vue 前端
│   ├── components/         # 可複用 UI 元件
│   ├── views/              # 頁面元件
│   ├── styles/             # 主題系統 & CSS
│   ├── i18n/               # 國際化
│   ├── services/           # 業務邏輯
│   └── utils/              # 工具函式
├── src-tauri/              # Rust 後端
│   └── src/                # Tauri 命令 & 邏輯
└── public/                 # 靜態資源
    └── icons/              # 遊戲圖示 & UI 素材
```

---

## 🚧 開發進度

**目前版本：** `v3.0.0-Beta-2`

> 🎉 **v3.0.0 正式版**將於 **2026年2月15日 12:00 (CST)** 發佈

| 功能         | 狀態          |
| ------------ | ------------- |
| 核心存檔管理 | ✅ 已完成     |
| 搜尋與篩選   | ✅ 已完成     |
| 主題系統     | ✅ 已完成     |
| 多語言支援   | ✅ 已完成     |
| 存檔資料編輯 | ✅ 已完成     |
| 多種建立模式 | ✅ 已完成（藍圖為實驗功能） |
| 反饋系統     | ✅ 已完成     |
| 外掛系統     | ✅ 已完成     |
| 層級資訊編輯 | 🔄 計劃中     |

---

## 🎬 影片教學

觀看詳細的操作指南：[Bilibili 影片介紹](https://www.bilibili.com/video/BV1L3yeYzEfi)（基於 2.6.0 版本）

---

## 🤝 參與貢獻

歡迎貢獻程式碼！這是一個個人學生專案，任何幫助都非常感謝。

- 🐛 [回報 Bug](https://github.com/Eververdants/ETBSaveManager/issues)
- 💡 [功能建議](https://github.com/Eververdants/ETBSaveManager/issues)
- 📧 聯絡信箱：**llzgd@outlook.com**

---

## ⚠️ 免責聲明

本專案與 Fancy Games 或《逃離後室》遊戲**沒有任何關聯**，未獲得官方認可或授權。專案中使用的遊戲素材僅用於教育和工具開發目的。

---

## 📄 開源授權

[MIT License](LICENSE) © 2024-NOW Eververdants

---

<p align="center">
  <sub>使用 Vue.js 和 Tauri 用 ❤️ 建置</sub>
</p>
