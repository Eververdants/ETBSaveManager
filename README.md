# 🕳️ E.T.B. Save Manager - 3.0 Development Edition

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center">
  <img src="./src-tauri/icons/128x128.png" alt="icon">
</p>

[中文](./README-CN.md) | [English](#)

> A major update in development — featuring a more modern UI, search functionality, color themes, multi-language switching, and more!

This is a desktop-level save management tool specifically designed for the game "Escape The Backrooms", built using Vue.js + JavaScript + CSS for the frontend, and Vite as the build tool. Version 3.0 represents a complete upgrade, offering an entirely new user experience and enhanced functionalities.

Please note: Future development may involve features related to encryption keys. For data security, the code for these parts will not be open-sourced, and I will make corresponding annotations in the code.

This project uses assets extracted from Escape The Backrooms, which are stored in the `icons/ETB_UI` folder within the `public`directory. The names of the resources have not been modified.

There is currently a trial version available, with the version number `V3.0.0-Alpha-1.1`. You can experience the new interface in this version. However, at this time, only the `Chinese` language is supported.

If you encounter any bugs while using the trial version, please provide a detailed description of the issue to the developer, or take a screenshot of the error messages shown in the DevTools, and submit an issue.

Due to the high development complexity and intricate logic involved, the `"Hierarchy Information Editing"` feature will be postponed to a future version. Originally, this feature was planned to be introduced in the `"Create New Archive"` and `"Edit Archive"` interfaces

My email: **`llzgd@outlook.com`**

‼️‼️‼️ This repository and program are not affiliated with Escape The Backrooms developer Fancy‼️‼️‼️

---

## 🚧 Current Status: In Development (Alpha Stage)

- 🔵 Basic architecture setup 45% complete
- ❌ Features not fully implemented yet
- 🛠️ Continuous updates in progress, please follow the repository for the latest developments
- 🧐 More features under consideration
- 🤯 Personal student developer, contributions to accelerate project completion are welcome

---

## 📦 Main Updates (3.0 New Features)

| Feature                                       | Status            | Progress | Description                                                                             |
| --------------------------------------------- | ----------------- | -------- | --------------------------------------------------------------------------------------- |
| 🎨 More modern UI interface                   | ⏳ In development | 30%      | Refactor the entire interface using modern design principles to enhance user experience |
| 🔍 Search functionality                       | ✅ Completed      | 100%     | Support quick search of archives by keywords such as name, hierarchy, etc.              |
| 🎨 Color themes                               | ⏳ In development | 0%       | Users can customize the application's color themes                                      |
| 🌐 Multi-language switching                   | ⏳ In development | 5%       | Provide more convenient multi-language switching support                                |
| 💾 Archive data editing                       | ✅ Completed      | 100%     | Allow users to directly edit archive data within the tool                               |
| ➕ Expansion of new archive creation features | ⏳ In development | 0%       | Add more options and settings to enhance the function of creating new archives          |
| 📄 Expansion content pack                     | ⏳ In development | 0%       | Selectable additional features for use                                                  |
| 🌐 Cross-platform support                     | ✅ Basic support  | 100%     | Supports Windows/macOS/Linux                                                            |

---

## 📚 2.7.3 Version Review (For Reference)

If you need to use the stable version, please refer to the [v2.7.3 Release Page](https://github.com/llzgdc/ETBSaveManager).

### Main Features (2.7.3)

- ✅ Create, Edit, Delete, Refresh Saves
- ✅ Hide Saves Functionality
- ✅ Open Save Directory
- ✅ Level Preview Images
- ✅ Multi-Language Interface Support

---

## 🧰 Tech Stack

- **Frontend**: Vue.js + JavaScript + CSS
- **Build Tool**: Vite
- **Cross-Platform Framework**: Tauri + Rust
- **Cross-Platform**: Windows / macOS / Linux

---

## 📥 Installation (V3.0.0-Alpha-1.2)

### Windows

1. Download the Windows installer for [v3.0.0-Alpha-1.2](https://github.com/llzgdc/ETBSaveManager/releases/tag/v3.0.0-Alpha-1.2).

2. Double-click the installer to begin installation. (If you don't have WebView2 installed, the installer should install it automatically. If not, please click [here](https://developer.microsoft.com/microsoft-edge/webview2) to download and install WebView2.)

### Source Code Download

```bash
# Clone the project
git clone https://github.com/llzgdc/ETBSaveManager.git
cd ETBSaveManager

# Install dependencies
npm install

# Run development environment
npm run tauri dev
```

---

## 📖 Feature Overview (3.0)

### Save Management

- Create, Edit, Delete, Copy, Hide, Show Multiple Saves
- Supports batch operations
- Filter saves by level, difficulty, mode
- Display current level location

### Save Search

- Quickly locate target saves via keywords
- Supports fuzzy matching

### Color Themes

- Users can select from multiple preset color themes
- Supports custom color configurations

### Multi-Language Switching

- Provides support for Simplified Chinese, English, and other languages
- Easy switching of interface language

### Save Data Editing

- Directly modify save data within the tool
- Modify player inventory

### Expanded New Save Creation

- Add more options, such as: hierarchical collectible (key) information

### Expansion Content Pack

- Select which expansion features to use
- Expansion packs will provide additional functionality
- Option to download packs from GitHub or Gitee (if available)
- Expansion packs developed by llzgdc are free of charge

---

## 📹 Bilibili Video Introduction (2.6.0)

Watch detailed operation guides at: [Video Introduction](https://www.bilibili.com/video/BV1L3yeYzEfi)

---

## 📄 License

This project is licensed under the MIT License, see the [LICENSE](https://github.com/llzgdc/ETBSaveManager/blob/master/LICENSE) file for details.
