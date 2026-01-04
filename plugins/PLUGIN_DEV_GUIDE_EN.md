# 🔌 Plugin Development Guide

This guide will help you develop language packs or theme plugins for E.T.B. Save Manager.

---

## 📁 Plugin Structure

Each plugin is a standalone folder containing the following files:

```
plugins/
├── lang-{locale}/           # Language plugin
│   ├── plugin.json          # Plugin metadata (required)
│   └── translations.json    # Translation file (required)
│
└── theme-{name}/            # Theme plugin
    ├── plugin.json          # Plugin metadata (required)
    └── theme.json           # Theme configuration (required)
```

---

## 🌐 Language Plugin Development

### 1. Create plugin.json

```json
{
  "id": "lang-{locale}",
  "name": "Language Pack Name",
  "type": "language",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Plugin description",
  "locale": "xx-XX",
  "localeName": "Language Name",
  "main": "translations.json",
  "icon": "🏳️",
  "homepage": "",
  "repository": "",
  "license": "MIT",
  "minAppVersion": "1.0.0",
  "keywords": ["language", "translation"]
}
```

### Field Description

| Field           | Type   | Required | Description                                |
| --------------- | ------ | -------- | ------------------------------------------ |
| `id`            | string | ✅       | Unique identifier, format: `lang-{locale}` |
| `name`          | string | ✅       | Plugin display name                        |
| `type`          | string | ✅       | Must be `"language"`                       |
| `version`       | string | ✅       | Semantic version number                    |
| `author`        | string | ✅       | Author name                                |
| `description`   | string | ✅       | Plugin description                         |
| `locale`        | string | ✅       | Language code, e.g., `ja-JP`, `ko-KR`      |
| `localeName`    | string | ✅       | Native name of the language                |
| `main`          | string | ✅       | Translation file name                      |
| `icon`          | string | ❌       | Flag emoji or icon                         |
| `minAppVersion` | string | ❌       | Minimum supported app version              |

### 2. Create translations.json

The translation file should contain all translation keys used in the app. Refer to `src/i18n/locales/en-US.json` for the complete key list.

```json
{
  "sidebar": {
    "archiveList": "Save List",
    "createArchive": "Create Save"
  },
  "common": {
    "cancel": "Cancel",
    "save": "Save"
  }
}
```

### 3. Reference Examples

- `plugins/lang-ja-JP/` - Japanese
- `plugins/lang-ko-KR/` - Korean
- `plugins/lang-ru-RU/` - Russian
- `plugins/lang-pt-BR/` - Brazilian Portuguese

---

## 🎨 Theme Plugin Development

### 1. Create plugin.json

```json
{
  "id": "theme-{name}",
  "name": "Theme Name",
  "type": "theme",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Theme description",
  "themeId": "{name}",
  "main": "theme.json",
  "icon": "🎨",
  "homepage": "",
  "repository": "",
  "license": "MIT",
  "minAppVersion": "1.0.0",
  "keywords": ["theme", "dark"]
}
```

### Field Description

| Field     | Type   | Required | Description                               |
| --------- | ------ | -------- | ----------------------------------------- |
| `id`      | string | ✅       | Unique identifier, format: `theme-{name}` |
| `name`    | string | ✅       | Theme display name                        |
| `type`    | string | ✅       | Must be `"theme"`                         |
| `themeId` | string | ✅       | Theme ID for internal reference           |
| `main`    | string | ✅       | Theme configuration file name             |

### 2. Create theme.json

```json
{
  "previewColors": {
    "bg": "#0a0a0f",
    "sidebar": "#12121a",
    "header": "#1e1e2a",
    "card": "#12121a",
    "accent": "#ff00ff"
  },
  "variables": {
    "--bg": "#0a0a0f",
    "--bg-primary": "#0a0a0f",
    "--bg-secondary": "#12121a",
    "--text": "#e0e0ff",
    "--text-primary": "#e0e0ff",
    "--primary": "#ff00ff"
  },
  "customCSS": ""
}
```

### 3. CSS Variables Reference

#### Background Colors

| Variable         | Description                 |
| ---------------- | --------------------------- |
| `--bg`           | Main background             |
| `--bg-primary`   | Primary background          |
| `--bg-secondary` | Secondary background        |
| `--bg-tertiary`  | Tertiary background         |
| `--bg-elevated`  | Elevated element background |

#### Text Colors

| Variable           | Description     |
| ------------------ | --------------- |
| `--text`           | Main text color |
| `--text-primary`   | Primary text    |
| `--text-secondary` | Secondary text  |
| `--text-tertiary`  | Tertiary text   |
| `--text-disabled`  | Disabled text   |

#### Theme Colors

| Variable            | Description         |
| ------------------- | ------------------- |
| `--primary`         | Primary color       |
| `--primary-hover`   | Primary hover color |
| `--secondary-color` | Secondary color     |
| `--accent-color`    | Accent color        |

#### Status Colors

| Variable          | Description |
| ----------------- | ----------- |
| `--success-color` | Success     |
| `--error-color`   | Error       |
| `--warning-color` | Warning     |
| `--info-color`    | Info        |

#### Component Styles

| Variable              | Description               |
| --------------------- | ------------------------- |
| `--sidebar-bg`        | Sidebar background        |
| `--sidebar-hover-bg`  | Sidebar hover background  |
| `--sidebar-active-bg` | Sidebar active background |
| `--card-bg`           | Card background           |
| `--card-shadow`       | Card shadow               |
| `--card-border`       | Card border               |
| `--dropdown-bg`       | Dropdown background       |
| `--scrollbar-thumb`   | Scrollbar color           |

### 4. Reference Example

- `plugins/theme-cyberpunk/` - Cyberpunk theme

---

## ⚠️ Important Notes

### Language Plugin Notes

1. **Translation Completeness**: Ensure all keys are translated; missing keys will fall back to the default language
2. **Version Sync**: ⚠️ Language plugins may not be updated immediately with new app versions; new versions may contain new translation keys
3. **Encoding**: Save files with UTF-8 encoding
4. **JSON Format**: Ensure correct JSON format; use online tools to validate

### Theme Plugin Notes

1. **Color Contrast**: Ensure sufficient contrast between text and background
2. **Complete Variables**: Define all CSS variables for best results
3. **Preview Colors**: `previewColors` is used for theme preview in the plugin market
4. **Custom CSS**: Additional styles can be added via the `customCSS` field

---

## 📦 Publishing

1. Ensure correct plugin folder structure
2. Test that the plugin works properly in the app
3. Submit a Pull Request to the main repository
4. Or contact the developer to add to the plugin market

---

## 🔗 Resources

- [Repository](https://github.com/Eververdants/ETBSaveManager)
- [Issue Tracker](https://github.com/Eververdants/ETBSaveManager/issues)
- Contact: llzgd@outlook.com

---

<p align="center">
  <sub>Thank you for contributing plugins to E.T.B. Save Manager!</sub>
</p>
