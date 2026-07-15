<p align="center">
  <img src="./src-tauri/icons/128x128.png" alt="ETB Save Manager" width="128">
</p>

<h1 align="center">ETB Save Manager</h1>

<p align="center">
  A save file manager for <em>Escape The Backrooms</em>, built with Tauri 2.0.
</p>

<p align="center">
  <a href="https://eververdants.github.io/ETBSaveManager/">Landing Page</a>
  · <a href="./README-CN.md">简体中文</a>
  · <a href="./README-HANT.md">繁體中文</a>
</p>

<p align="center">
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/github/v/release/Eververdants/ETBSaveManager" alt="Version"></a>
  <a href="https://github.com/Eververdants/ETBSaveManager/actions"><img src="https://img.shields.io/github/actions/workflow/status/Eververdants/ETBSaveManager/release.yml" alt="CI"></a>
  <a href="https://github.com/Eververdants/ETBSaveManager/releases"><img src="https://img.shields.io/github/downloads/Eververdants/ETBSaveManager/total" alt="Downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Eververdants/ETBSaveManager" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-Windows-blue" alt="Platform">
</p>

## Features

### Save Management

- **Full CRUD Operations** — Create, edit, delete, copy, hide/show saves
- **Soft Delete & Recycle Bin** — Trashed saves can be restored or permanently deleted
- **Batch Operations** — Process multiple saves simultaneously with multi-select mode
- **Favorites & Sorting** — Star your important saves; sort by name, date, level, or favorites
- **Smart Filtering** — Filter by level, difficulty, game mode, and search keywords
- **Quick Search** — Fuzzy matching to locate saves instantly
- **Undo / Redo** — Full undo/redo support for archive operations
- **Virtual Scrolling** — Smooth performance with large save collections

### UI/UX

- **Clean Interface** — Intuitive design with smooth GSAP-powered animations
- **13 Themes** — Light, Dark, and 11 vibrant color themes
- **Responsive Layout** — Collapsible sidebar, adaptive components
- **Hardware Accelerated** — GPU-optimized rendering for smooth performance
- **Global Search** — Press `Ctrl+F` to search across any page
- **Tutorial Overlay** — Interactive guide for first-time users

### Internationalization

Built-in languages:

- English
- Simplified Chinese (简体中文)
- Traditional Chinese (繁體中文)

> The i18n system is modular — additional languages can be contributed by adding new locale files.

### Advanced Features

- **Multiple Creation Modes**
  - Quick Create — Streamlined workflow for fast save generation
  - Standard Create — Full customization options with step-by-step wizard
- **Inventory Editor** — Visual editor for player inventory items
- **Player Data Editor** — Edit inventory items, sanity, and other player stats
- **Notification System** — Persistent notification center for app events
- **Performance Monitor** — Built-in FPS and memory diagnostics (dev mode)
- **Performance Settings** — Tweak GPU rendering and animation preferences
- **Uniform Config Panel** — Centralized configuration interface

---

## Screenshots

> Screenshots below are demonstrated using the "Ocean" theme

<p align="center">
  <img src="./docs/存档列表-en.png" alt="Archive List" width="49%">
  <img src="./docs/创建存档页面第一步-en.png" alt="Create Archive Step 1" width="49%">
</p>

<p align="center">
  <img src="./docs/快速创建存档页面-en.png" alt="Quick Create Archive" width="49%">
  <img src="./docs/编辑页面-en.png" alt="Edit Archive" width="49%">
</p>

---

## Installation

### Download Release

1. Go to [Releases](https://github.com/Eververdants/ETBSaveManager/releases/latest)
2. Download the Windows installer (`.msi` or `.exe`)
3. Run the installer

> **Note:** You may need [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2) (usually pre-installed on Windows 10/11)

### Build from Source

```bash
# Clone repository
git clone https://github.com/Eververdants/ETBSaveManager.git
cd ETBSaveManager

# Install dependencies
pnpm install

# Development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

**Prerequisites:**

- Node.js 18+
- Rust toolchain
- Platform-specific dependencies (see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/))

---

## Maintenance Policy

This project is maintained on an **as-needed basis**:

- **Map Updates** — When *Escape The Backrooms* releases new maps (levels), this project will be updated to support the new save data formats and level metadata.
- **Bug Fixes & Optimizations** — When bugs or performance issues are identified and reported, fixes and optimizations will be applied in a timely manner.
- **Feature Requests** — New features beyond game update compatibility are considered on a case-by-case basis. Feel free to open an issue to discuss.

> The primary goal of this project is to keep the save manager functional and up-to-date with the game's evolution. Community contributions for new features are welcome!

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| Vue 3 + Composition API | Reactive UI framework |
| TypeScript | Type-safe development |
| Vite 6 | Build tool and dev server |
| Tailwind CSS 4 | Utility-first CSS framework |
| CSS Variables | Dynamic theme system |
| vue-i18n | Internationalization |
| Vue Router 4 | SPA routing |
| GSAP | High-performance animations |
| @tanstack/vue-virtual | Virtual scrolling for large lists |
| FontAwesome 7 | Vector icons |
| Chart.js | Data visualization |
| @vue-flow/core | Node-based flow editor |
| vitest + fast-check | Unit & property-based testing |

### Backend (Rust)

| Technology | Purpose |
|------------|---------|
| Tauri 2.0 | Desktop application framework |
| uesave 0.6.2 | UE4 Save file parsing |
| serde + serde_json | Data serialization |
| rusqlite | Local SQLite database |
| tokio + reqwest | Async HTTP client |
| walkdir + memmap2 | Efficient file operations |
| rayon | Parallel processing |
| chrono | Date/time handling |
| uuid | Unique ID generation |
| regex | Pattern matching |
| thiserror | Error handling |

---

## Project Structure

```
ETBSaveManager/
├── src/                              # Vue frontend (TypeScript)
│   ├── components/
│   │   ├── archive/                  # Save-related components
│   │   │   ├── ArchiveCard.vue
│   │   │   ├── ArchiveCardFlow.vue
│   │   │   ├── ArchiveSearchFilter.vue
│   │   │   └── QuickCreateArchiveCard.vue
│   │   ├── feature/                  # Feature-specific components
│   │   │   ├── FloatingActionButton.vue
│   │   │   ├── GlobalSearchPanel.vue
│   │   │   ├── InventoryItemSelector.vue
│   │   │   ├── PreviewExecuteArea.vue
│   │   │   ├── SmartInputArea.vue
│   │   │   └── TutorialOverlay.vue
│   │   ├── layout/                   # Layout components
│   │   │   ├── Sidebar.vue
│   │   │   └── TitleBar.vue
│   │   ├── modal/                    # Modal dialogs
│   │   │   ├── ArchiveEditModal.vue
│   │   │   ├── BatchEditModal.vue
│   │   │   ├── ConfirmModal.vue
│   │   │   └── PromptPopup.vue
│   │   ├── system/                   # System utilities
│   │   │   ├── PerformanceMonitor.vue
│   │   │   ├── PerformanceSettings.vue
│   │   │   ├── PlayerManager.vue
│   │   │   └── UniformConfigPanel.vue
│   │   ├── theme/                    # Theme selection
│   │   │   └── ThemeSelector.vue
│   │   └── ui/                       # Reusable UI primitives
│   │       ├── CustomDropdown.vue
│   │       ├── CustomSlider.vue
│   │       ├── ErrorBoundary.vue
│   │       ├── LazyImage.vue
│   │       └── NotificationPopup.vue
│   ├── composables/                  # Vue composition functions
│   │   ├── useArchiveActions.ts      # Save CRUD operations
│   │   ├── useArchiveData.ts         # Save data management
│   │   ├── useArchiveCard.ts         # Card interactions
│   │   ├── useArchiveCardFlow.ts     # Flow mode logic
│   │   ├── useArchiveFilters.ts      # Filter & search
│   │   ├── useUndoRedo.ts            # Undo/redo support
│   │   ├── useGlobalSearchPanel.ts   # Global search
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
│   ├── config/                       # App configuration
│   │   ├── cdnConfig.ts
│   │   ├── sidebarMenu.ts
│   │   ├── updateConfig.ts
│   │   └── version.ts
│   ├── i18n/                         # Internationalization
│   │   ├── index.ts
│   │   ├── loader.ts
│   │   └── locales/
│   │       ├── en-US/                # English (JSON files by domain)
│   │       ├── zh-CN/                # Simplified Chinese
│   │       └── zh-TW/                # Traditional Chinese
│   ├── router/                       # Vue Router configuration
│   ├── services/                     # Business logic services
│   │   ├── storageService.ts         # Persistent storage
│   │   ├── logService.ts             # Logging
│   │   ├── notificationService.ts    # Notifications
│   │   ├── popupService.ts           # Popup management
│   │   ├── themeStorage.ts           # Theme persistence
│   │   ├── pluginStorage.ts          # Plugin data
│   │   └── updateService.ts          # Auto-update
│   ├── styles/
│   │   ├── animations.css
│   │   └── themes/                   # Theme CSS files
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
│   ├── utils/                        # Utilities
│   │   ├── icons.ts / icons-full.ts / icons-critical.ts
│   │   ├── nameParser.ts
│   │   ├── performance.ts
│   │   ├── consoleForwarder.ts
│   │   ├── polyfills.ts
│   │   ├── disableInteractions.ts
│   │   └── floatingButtonProtection.ts
│   ├── views/                        # Page views
│   │   ├── Home.vue                  # Save list
│   │   ├── CreateArchive/            # Create save wizard
│   │   ├── EditArchive.vue           # Edit save
│   │   ├── QuickCreateArchive.vue    # Quick create
│   │   ├── SelectCreateMode.vue      # Mode selection
│   │   ├── Settings.vue              # App settings
│   │   ├── About.vue                 # About page
│   │   ├── Log.vue                   # Operation logs
│   │   └── TestArchive.vue           # Testing utility
│   ├── types.ts                      # Global type definitions
│   ├── appContext.ts                 # Dependency injection context
│   ├── App.vue                       # Root component
│   └── main.ts                       # Application entry
├── src-tauri/                        # Rust backend
│   └── src/
│       ├── lib.rs                    # Library entry / Tauri setup
│       ├── main.rs                   # Main entry
│       ├── save_commands.rs          # Save CRUD commands
│       ├── save_editor.rs            # Save file editing
│       ├── save_shared.rs            # Shared save types
│       ├── save_utils.rs             # Save file utilities
│       ├── new_save.rs               # Save creation logic
│       ├── player_data.rs            # Player data handling
│       ├── cli_handlers.rs           # CLI command handlers
│       ├── system_commands.rs        # System-level commands
│       ├── theme_commands.rs         # Theme management
│       ├── gpu_settings.rs           # GPU/rendering config
│       ├── get_file_path.rs          # File path resolution
│       ├── common.rs                 # Common helpers
│       └── error.rs                  # Error types
├── public/                           # Static assets
│   ├── icons/                        # Game item icons
│   └── images/                       # Game level images
├── docs/                             # Screenshots
├── scripts/                          # Build scripts
│   └── sync-version.js               # Version syncing
├── dist/                             # Build output
├── index.html                        # HTML entry
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript configuration
├── eslint.config.js                  # ESLint configuration
├── package.json
└── pnpm-lock.yaml
```

---

## Themes

ETB Save Manager includes 13 built-in themes:

### Base Themes
- **Light** — Clean light theme
- **Dark** — Comfortable dark theme

### Color Themes
- **Ocean** — Deep blue ocean-inspired
- **Forest** — Natural green forest theme
- **Sunset** — Warm orange sunset colors
- **Lavender** — Soft purple lavender
- **Rose** — Elegant pink rose
- **Mint** — Fresh mint green
- **Peach** — Soft peach tones
- **Sky** — Bright sky blue

---

## Contributing

Contributions are welcome! This is a personal student project, and any help is appreciated.

- [Report bugs](https://github.com/Eververdants/ETBSaveManager/issues)
- [Request features](https://github.com/Eververdants/ETBSaveManager/issues)
- Contact: **llzgd@outlook.com**

---

## Disclaimer

This project is **not affiliated with, endorsed by, or connected to** Fancy Games or *Escape The Backrooms* in any way.

Game assets (e.g., level icons) are used **strictly for identification purposes** to help users recognize which level a save file belongs to.  
All rights to *Escape The Backrooms* and its assets belong to their respective owners.

---

## Star History

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

## License

[MIT License](LICENSE) © 2026 Eververdants

---

<p align="center">
  <sub>Built with Vue.js and Tauri</sub>
</p>
