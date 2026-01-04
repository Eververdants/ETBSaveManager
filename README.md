# 🕳️ E.T.B. Save Manager

<p align="center">
  <img src="./src-tauri/icons/128x128.png" alt="E.T.B. Save Manager" width="128">
</p>

<p align="center">
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/badge/Version-3.0.0--Alpha--7.3-blue.svg" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Platform-Windows-0078D4.svg?logo=windows" alt="Platform">
  <img src="https://img.shields.io/badge/Framework-Tauri%202.0-orange.svg" alt="Framework">
</p>

<p align="center">
  <b>A modern, cross-platform save management tool for "Escape The Backrooms"</b>
</p>

<p align="center">
  <a href="./README-CN.md">简体中文</a> | <a href="./README-HANT.md">繁體中文</a> | <a href="#">English</a>
</p>

---

## ✨ Features

### 🗂️ Save Management

- **Full CRUD Operations** — Create, edit, delete, copy, hide/show saves
- **Batch Operations** — Process multiple saves simultaneously
- **Smart Filtering** — Filter by level, difficulty, game mode
- **Quick Search** — Fuzzy matching to locate saves instantly

### 🎨 Modern UI/UX

- **Modern Design** — Clean, intuitive interface with smooth animations
- **Theme System** — Light, Dark, and seasonal themes
- **Responsive Layout** — Collapsible sidebar, adaptive components
- **Hardware Accelerated** — GPU-optimized rendering for smooth performance

### 🌍 Internationalization

Built-in languages:

- Simplified Chinese (简体中文)
- Traditional Chinese (繁體中文)
- English

Additional languages via plugins:

- 日本語 (Japanese)
- 한국어 (Korean)
- Русский (Russian)
- Português (Brazilian Portuguese)

> ⚠️ **Note:** Language plugins may not be updated immediately with new app versions.

### 🛠️ Advanced Features

- **Multiple Creation Modes**
  - Quick Create — Streamlined workflow for fast save generation
  - Blueprint Create — Template-based save creation
  - Batch Create — Generate multiple saves at once
  - Standard Create — Full customization options
- **Inventory Editor** — Modify player inventory directly
- **Steam Cache Management** — Manage local Steam cache data
- **Feedback System** — Built-in feedback submission to developers
- **Plugin Market** — Download language packs and themes from the plugin marketplace
- **Performance Monitor** — Built-in diagnostics (dev mode)

---

## 🖥️ Screenshots

> Coming soon...

---

## 📦 Installation

### Download Release

1. Go to [Releases](https://github.com/Eververdants/ETBSaveManager/releases/tag/v3.0.0-Alpha-7.3)
2. Download the Windows installer (`.msi` or `.exe`)
3. Run the installer

> **Note:** You may need [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2) (usually pre-installed on Windows 10/11)

### Build from Source

```bash
# Clone repository
git clone https://github.com/Eververdants/ETBSaveManager.git
cd ETBSaveManager

# Install dependencies
npm install

# Development mode
npm run tauri dev

# Build for production
npm run tauri build
```

**Prerequisites:**

- Node.js 18+
- Rust toolchain
- Platform-specific dependencies (see [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

---

## 🧰 Tech Stack

| Layer          | Technology                   |
| -------------- | ---------------------------- |
| Frontend       | Vue 3 + Composition API      |
| Styling        | CSS Variables + Theme System |
| Build          | Vite 6                       |
| Desktop        | Tauri 2.0 + Rust             |
| i18n           | vue-i18n                     |
| Animation      | GSAP                         |
| Virtual Scroll | @tanstack/vue-virtual        |

---

## 📁 Project Structure

```
ETBSaveManager/
├── src/                    # Vue frontend
│   ├── components/         # Reusable UI components
│   ├── views/              # Page components
│   ├── styles/             # Theme system & CSS
│   ├── i18n/               # Internationalization
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
├── src-tauri/              # Rust backend
│   └── src/                # Tauri commands & logic
└── public/                 # Static assets
    └── icons/              # Game icons & UI assets
```

---

## 🚧 Development Status

**Current Version:** `v3.0.0-Alpha-7.3`

| Feature              | Status          |
| -------------------- | --------------- |
| Core Save Management | ✅ Complete     |
| Search & Filter      | ✅ Complete     |
| Theme System         | ✅ Complete     |
| Multi-language       | ✅ Complete     |
| Save Data Editor     | ✅ Complete     |
| Creation Modes       | ✅ Complete     |
| Feedback System      | ✅ Complete     |
| Plugin System        | 🧪 Beta Testing |
| Level Info Editor    | 🔄 Planned      |

---

## 🤝 Contributing

Contributions are welcome! This is a personal student project, and any help is appreciated.

- 🐛 [Report bugs](https://github.com/Eververdants/ETBSaveManager/issues)
- 💡 [Request features](https://github.com/Eververdants/ETBSaveManager/issues)
- 📧 Contact: **llzgd@outlook.com**

---

## ⚠️ Disclaimer

This project is **NOT** affiliated with, endorsed by, or connected to Fancy Games or "Escape The Backrooms" in any way. Game assets used are extracted from the game for educational and tool development purposes only.

---

## 📄 License

[MIT License](LICENSE) © 2024-NOW Eververdants

---

<p align="center">
  <sub>Built with ❤️ using Vue.js and Tauri</sub>
</p>
