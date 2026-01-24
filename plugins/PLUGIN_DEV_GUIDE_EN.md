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

## 📄 Page Plugin Development

Page plugins allow you to add new pages and sidebar menu items to extend app functionality.

### 1. Create plugin.json

```json
{
  "id": "page-{name}",
  "name": "Page Plugin Name",
  "type": "page",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Plugin description",
  "main": "page.json",
  "icon": "🔧",
  "homepage": "",
  "repository": "",
  "license": "MIT",
  "minAppVersion": "1.0.0",
  "keywords": ["page", "feature"]
}
```

### Field Description

| Field  | Type   | Required | Description                              |
| ------ | ------ | -------- | ---------------------------------------- |
| `id`   | string | ✅       | Unique identifier, format: `page-{name}` |
| `name` | string | ✅       | Plugin display name                      |
| `type` | string | ✅       | Must be `"page"`                         |
| `main` | string | ✅       | Page configuration file name             |

### 2. Create Vue Component File

Create `MyPage.vue` file:

```vue
<template>
  <div class="my-plugin-page">
    <div class="page-header">
      <h1>{{ $t('plugin.myPage.title') }}</h1>
      <p>{{ $t('plugin.myPage.description') }}</p>
    </div>
    
    <div class="page-content">
      <div class="card">
        <h2>Feature Area</h2>
        <button @click="handleAction">Execute Action</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import storage from '@/services/storageService';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

const data = ref(null);

onMounted(() => {
  console.log('Plugin page mounted');
  loadData();
});

const loadData = () => {
  // Load data from storage
  data.value = storage.getItem('myPluginData');
};

const handleAction = () => {
  console.log('Execute plugin action');
  // Your logic here
};
</script>

<style scoped>
.my-plugin-page {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-md);
}
</style>
```

### 3. Create Plugin Entry File

Create `index.js` file:

```javascript
import MyPage from './MyPage.vue';

export default {
  id: 'page-my-plugin',
  name: 'My Plugin',
  type: 'page',
  version: '1.0.0',
  author: 'Your Name',
  description: 'Plugin description',
  data: {
    route: {
      name: 'MyPluginPage',
      path: '/my-plugin-page',
      component: MyPage,
      meta: {
        keepAlive: false
      }
    },
    menu: {
      textKey: 'plugin.myPage.title',
      icon: ['fas', 'puzzle-piece'],
      position: 'top',
      descriptionKey: 'plugin.myPage.description'
    }
  }
};
```

### Configuration Description

#### route (Route Configuration)

| Field       | Type   | Required | Description                        |
| ----------- | ------ | -------- | ---------------------------------- |
| `name`      | string | ✅       | Route name (must be unique)        |
| `path`      | string | ✅       | Route path (e.g., `/my-page`)      |
| `component` | object | ✅       | Vue component object               |
| `meta`      | object | ❌       | Route metadata (cache config, etc) |

#### menu (Menu Configuration)

| Field            | Type   | Required | Description                                       |
| ---------------- | ------ | -------- | ------------------------------------------------- |
| `textKey`        | string | ✅       | i18n key for menu text                            |
| `icon`           | array  | ✅       | FontAwesome icon, format: `["fas", "icon"]`       |
| `position`       | string | ❌       | Menu position: `"top"` or `"bottom"` (default top) |
| `descriptionKey` | string | ❌       | i18n key for menu description                     |

---

## 📦 Plugin File Structure

```
plugins/
└── page-{name}/
    ├── plugin.json      # Plugin metadata
    ├── config.json      # Route and menu configuration
    ├── Component.vue    # Vue component file
    └── README.md        # Documentation (optional)
```

### plugin.json Example

```json
{
  "id": "page-my-plugin",
  "name": "My Plugin",
  "type": "page",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Plugin description",
  "main": "config.json",
  "componentFile": "MyComponent.vue",
  "icon": "puzzle-piece"
}
```

### config.json Example

```json
{
  "route": {
    "name": "MyPluginPage",
    "path": "/my-plugin-page",
    "meta": {
      "keepAlive": false
    }
  },
  "menu": {
    "textKey": "plugin.myPlugin.title",
    "icon": ["fas", "star"],
    "position": "top",
    "descriptionKey": "plugin.myPlugin.description"
  }
}
```

---

## 🔧 Available App APIs

Plugins can directly import and use app services and utilities:

### Storage Service
```javascript
import storage from '@/services/storageService';

storage.setItem('key', 'value');
const value = storage.getItem('key');
```

### Router
```javascript
import { useRouter } from 'vue-router';

const router = useRouter();
router.push({ name: 'Home' });
```

### Internationalization
```javascript
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const text = t('common.save');
```

### Other Services
```javascript
// Import and use services provided by the app
import archiveService from '@/services/archiveService';
import logService from '@/services/logService';
```

---

## 📝 Complete Example

### File Structure
```
plugins/page-statistics/
├── plugin.json
├── index.js
└── Statistics.vue
```

### plugin.json
```json
{
  "id": "page-statistics",
  "name": "Statistics Page",
  "type": "page",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Display save statistics",
  "main": "index.js",
  "icon": "📊"
}
```

### index.js
```javascript
import Statistics from './Statistics.vue';

export default {
  id: 'page-statistics',
  name: 'Statistics Page',
  type: 'page',
  version: '1.0.0',
  author: 'Your Name',
  description: 'Display save statistics',
  data: {
    route: {
      name: 'Statistics',
      path: '/statistics',
      component: Statistics,
      meta: { keepAlive: true }
    },
    menu: {
      textKey: 'plugin.statistics.title',
      icon: ['fas', 'chart-bar'],
      position: 'top',
      descriptionKey: 'plugin.statistics.description'
    }
  }
};
```

### Statistics.vue
```vue
<template>
  <div class="statistics-page">
    <h1>{{ $t('plugin.statistics.title') }}</h1>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Archives</h3>
        <p class="stat-value">{{ totalArchives }}</p>
      </div>
      <div class="stat-card">
        <h3>Created Today</h3>
        <p class="stat-value">{{ todayCreated }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import storage from '@/services/storageService';

const totalArchives = ref(0);
const todayCreated = ref(0);

onMounted(() => {
  loadStatistics();
});

const loadStatistics = () => {
  // Load statistics data
  const archives = storage.getItem('archives') || [];
  totalArchives.value = archives.length;
  
  const today = new Date().toDateString();
  todayCreated.value = archives.filter(a => 
    new Date(a.createdAt).toDateString() === today
  ).length;
};
</script>

<style scoped>
.statistics-page {
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stat-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
  margin-top: 0.5rem;
}
</style>
```

---

## 💻 Programmatic Installation

```javascript
import { installPagePlugin } from '@/plugins';
import pluginConfig from './plugins/page-my-plugin/index.js';

await installPagePlugin(pluginConfig);
```

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

### Page Plugin Notes

1. **Route Uniqueness**: Ensure route names and paths are unique in the app
2. **Icon Format**: Use FontAwesome icon format `["fas", "icon-name"]`
3. **Internationalization**: Menu text uses i18n keys, must be defined in language packs
4. **Vue Components**: Must provide complete Vue component files (.vue)
5. **Dependency Import**: Can directly import app services and utilities
6. **Lifecycle**: Full support for Vue 3 Composition API and Options API
7. **Style Isolation**: Recommend using scoped styles to avoid polluting global styles

---

## 📦 Publishing

### Language and Theme Plugins

1. Ensure correct plugin folder structure
2. Test that the plugin works properly in the app
3. Submit a Pull Request to the main repository
4. Or contact the developer to add to the plugin market

### Page Plugins

Page plugins support two installation methods:

#### Method 1: Manual Installation (Recommended)

1. Ensure the plugin contains these files:
   - `plugin.json` - Plugin metadata
   - `config.json` - Route and menu configuration
   - `Component.vue` - Vue component file

2. Users select the plugin folder via the plugin market's "Manual Install" feature

3. The plugin will automatically load and register routes and menus

#### Method 2: Development Environment Integration

1. Place the plugin folder in the project's `plugins/` directory
2. Import and install the plugin in your app code
3. Recompile the application

Example:
```javascript
// In src/main.js or other initialization file
import { installPagePlugin } from './plugins';
import myPlugin from '../plugins/page-my-plugin/index.js';

// Install after app initialization
await installPagePlugin(myPlugin);
```

---

## 🔗 Resources

- [Repository](https://github.com/Eververdants/ETBSaveManager)
- [Issue Tracker](https://github.com/Eververdants/ETBSaveManager/issues)
- Contact: llzgd@outlook.com

---

<p align="center">
  <sub>Thank you for contributing plugins to E.T.B. Save Manager!</sub>
</p>
