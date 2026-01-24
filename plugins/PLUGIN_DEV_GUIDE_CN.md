# 🔌 插件开发指南

本指南将帮助你为 E.T.B. Save Manager 开发语言包或主题插件。

---

## 📁 插件结构

每个插件都是一个独立的文件夹，包含以下文件：

```
plugins/
├── lang-{locale}/           # 语言插件
│   ├── plugin.json          # 插件元数据（必需）
│   └── translations.json    # 翻译文件（必需）
│
└── theme-{name}/            # 主题插件
    ├── plugin.json          # 插件元数据（必需）
    └── theme.json           # 主题配置（必需）
```

---

## 🌐 语言插件开发

### 1. 创建 plugin.json

```json
{
  "id": "lang-{locale}",
  "name": "语言包名称",
  "type": "language",
  "version": "1.0.0",
  "author": "你的名字",
  "description": "插件描述",
  "locale": "xx-XX",
  "localeName": "语言名称",
  "main": "translations.json",
  "icon": "🏳️",
  "homepage": "",
  "repository": "",
  "license": "MIT",
  "minAppVersion": "1.0.0",
  "keywords": ["language", "翻译"]
}
```

### 字段说明

| 字段            | 类型   | 必需 | 说明                              |
| --------------- | ------ | ---- | --------------------------------- |
| `id`            | string | ✅   | 唯一标识符，格式：`lang-{locale}` |
| `name`          | string | ✅   | 插件显示名称                      |
| `type`          | string | ✅   | 必须为 `"language"`               |
| `version`       | string | ✅   | 语义化版本号                      |
| `author`        | string | ✅   | 作者名称                          |
| `description`   | string | ✅   | 插件描述                          |
| `locale`        | string | ✅   | 语言代码，如 `ja-JP`, `ko-KR`     |
| `localeName`    | string | ✅   | 语言的本地名称                    |
| `main`          | string | ✅   | 翻译文件名                        |
| `icon`          | string | ❌   | 国旗 emoji 或图标                 |
| `minAppVersion` | string | ❌   | 最低支持的应用版本                |

### 2. 创建 translations.json

翻译文件需要包含应用中所有的翻译键。参考 `src/i18n/locales/zh-CN.json` 获取完整的键列表。

```json
{
  "sidebar": {
    "archiveList": "存档列表的翻译",
    "createArchive": "创建存档的翻译"
  },
  "common": {
    "cancel": "取消的翻译",
    "save": "保存的翻译"
  }
}
```

### 3. 参考示例

- `plugins/lang-ja-JP/` - 日语
- `plugins/lang-ko-KR/` - 韩语
- `plugins/lang-ru-RU/` - 俄语
- `plugins/lang-pt-BR/` - 巴西葡萄牙语

---

## 🎨 主题插件开发

### 1. 创建 plugin.json

```json
{
  "id": "theme-{name}",
  "name": "主题名称",
  "type": "theme",
  "version": "1.0.0",
  "author": "你的名字",
  "description": "主题描述",
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

### 字段说明

| 字段      | 类型   | 必需 | 说明                             |
| --------- | ------ | ---- | -------------------------------- |
| `id`      | string | ✅   | 唯一标识符，格式：`theme-{name}` |
| `name`    | string | ✅   | 主题显示名称                     |
| `type`    | string | ✅   | 必须为 `"theme"`                 |
| `themeId` | string | ✅   | 主题 ID，用于内部引用            |
| `main`    | string | ✅   | 主题配置文件名                   |

### 2. 创建 theme.json

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

### 3. CSS 变量参考

#### 背景色

| 变量             | 说明         |
| ---------------- | ------------ |
| `--bg`           | 主背景色     |
| `--bg-primary`   | 主要背景     |
| `--bg-secondary` | 次要背景     |
| `--bg-tertiary`  | 第三级背景   |
| `--bg-elevated`  | 悬浮元素背景 |

#### 文字颜色

| 变量               | 说明         |
| ------------------ | ------------ |
| `--text`           | 主文字颜色   |
| `--text-primary`   | 主要文字     |
| `--text-secondary` | 次要文字     |
| `--text-tertiary`  | 第三级文字   |
| `--text-disabled`  | 禁用状态文字 |

#### 主题色

| 变量                | 说明       |
| ------------------- | ---------- |
| `--primary`         | 主色调     |
| `--primary-hover`   | 主色调悬停 |
| `--secondary-color` | 次要色调   |
| `--accent-color`    | 强调色     |

#### 状态颜色

| 变量              | 说明 |
| ----------------- | ---- |
| `--success-color` | 成功 |
| `--error-color`   | 错误 |
| `--warning-color` | 警告 |
| `--info-color`    | 信息 |

#### 组件样式

| 变量                  | 说明           |
| --------------------- | -------------- |
| `--sidebar-bg`        | 侧边栏背景     |
| `--sidebar-hover-bg`  | 侧边栏悬停背景 |
| `--sidebar-active-bg` | 侧边栏激活背景 |
| `--card-bg`           | 卡片背景       |
| `--card-shadow`       | 卡片阴影       |
| `--card-border`       | 卡片边框       |
| `--dropdown-bg`       | 下拉菜单背景   |
| `--scrollbar-thumb`   | 滚动条颜色     |

### 4. 参考示例

- `plugins/theme-cyberpunk/` - 赛博朋克主题

---

## 📄 页面插件开发

页面插件允许你为应用添加新的页面和侧边栏菜单项，扩展应用功能。

### 1. 创建 plugin.json

```json
{
  "id": "page-{name}",
  "name": "页面插件名称",
  "type": "page",
  "version": "1.0.0",
  "author": "你的名字",
  "description": "插件描述",
  "main": "page.json",
  "icon": "🔧",
  "homepage": "",
  "repository": "",
  "license": "MIT",
  "minAppVersion": "1.0.0",
  "keywords": ["page", "feature"]
}
```

### 字段说明

| 字段      | 类型   | 必需 | 说明                           |
| --------- | ------ | ---- | ------------------------------ |
| `id`      | string | ✅   | 唯一标识符，格式：`page-{name}` |
| `name`    | string | ✅   | 插件显示名称                   |
| `type`    | string | ✅   | 必须为 `"page"`                |
| `main`    | string | ✅   | 页面配置文件名                 |

### 2. 创建 Vue 组件文件

创建 `MyPage.vue` 文件：

```vue
<template>
  <div class="my-plugin-page">
    <div class="page-header">
      <h1>{{ $t('plugin.myPage.title') }}</h1>
      <p>{{ $t('plugin.myPage.description') }}</p>
    </div>
    
    <div class="page-content">
      <div class="card">
        <h2>功能区域</h2>
        <button @click="handleAction">执行操作</button>
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
  console.log('插件页面已挂载');
  loadData();
});

const loadData = () => {
  // 从存储加载数据
  data.value = storage.getItem('myPluginData');
};

const handleAction = () => {
  console.log('执行插件操作');
  // 你的逻辑
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

### 3. 创建插件入口文件

创建 `index.js` 文件：

```javascript
import MyPage from './MyPage.vue';

export default {
  id: 'page-my-plugin',
  name: '我的插件',
  type: 'page',
  version: '1.0.0',
  author: '你的名字',
  description: '插件描述',
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

### 配置说明

#### route（路由配置）

| 字段        | 类型   | 必需 | 说明                           |
| ----------- | ------ | ---- | ------------------------------ |
| `name`      | string | ✅   | 路由名称（必须唯一）           |
| `path`      | string | ✅   | 路由路径（如 `/my-page`）      |
| `component` | object | ✅   | Vue 组件对象                   |
| `meta`      | object | ❌   | 路由元数据（如缓存配置等）     |

#### menu（菜单配置）

| 字段             | 类型   | 必需 | 说明                                      |
| ---------------- | ------ | ---- | ----------------------------------------- |
| `textKey`        | string | ✅   | 菜单文本的 i18n 键值                      |
| `icon`           | array  | ✅   | FontAwesome 图标，格式：`["fas", "icon"]` |
| `position`       | string | ❌   | 菜单位置：`"top"` 或 `"bottom"`（默认 top） |
| `descriptionKey` | string | ❌   | 菜单描述的 i18n 键值                      |

---

## 📦 插件文件结构

```
plugins/
└── page-{name}/
    ├── plugin.json      # 插件元数据
    ├── config.json      # 路由和菜单配置
    ├── Component.vue    # Vue 组件文件
    └── README.md        # 说明文档（可选）
```

### plugin.json 示例

```json
{
  "id": "page-my-plugin",
  "name": "我的插件",
  "type": "page",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "插件描述",
  "main": "config.json",
  "componentFile": "MyComponent.vue",
  "icon": "puzzle-piece"
}
```

### config.json 示例

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

## 🔧 可用的应用 API

插件可以直接导入和使用应用的服务和工具：

### 存储服务
```javascript
import storage from '@/services/storageService';

storage.setItem('key', 'value');
const value = storage.getItem('key');
```

### 路由
```javascript
import { useRouter } from 'vue-router';

const router = useRouter();
router.push({ name: 'Home' });
```

### 国际化
```javascript
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const text = t('common.save');
```

### 其他服务
```javascript
// 根据应用提供的服务自行导入使用
import archiveService from '@/services/archiveService';
import logService from '@/services/logService';
```

---

## 📝 完整示例

### 文件结构
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
  "name": "统计页面",
  "type": "page",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "显示存档统计信息",
  "main": "index.js",
  "icon": "📊"
}
```

### index.js
```javascript
import Statistics from './Statistics.vue';

export default {
  id: 'page-statistics',
  name: '统计页面',
  type: 'page',
  version: '1.0.0',
  author: 'Your Name',
  description: '显示存档统计信息',
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
        <h3>总存档数</h3>
        <p class="stat-value">{{ totalArchives }}</p>
      </div>
      <div class="stat-card">
        <h3>今日创建</h3>
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
  // 加载统计数据
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

## 💻 编程方式安装

```javascript
import { installPagePlugin } from '@/plugins';
import pluginConfig from './plugins/page-my-plugin/index.js';

await installPagePlugin(pluginConfig);
```

---

## ⚠️ 重要提示

### 语言插件注意事项

1. **翻译完整性**：确保翻译所有键，缺失的键将回退到默认语言
2. **版本同步**：⚠️ 语言插件可能不会随应用版本更新而及时更新，新版本可能包含新的翻译键
3. **编码格式**：使用 UTF-8 编码保存文件
4. **JSON 格式**：确保 JSON 格式正确，可使用在线工具验证

### 主题插件注意事项

1. **颜色对比度**：确保文字与背景有足够的对比度
2. **完整变量**：建议定义所有 CSS 变量以获得最佳效果
3. **预览颜色**：`previewColors` 用于插件市场的主题预览
4. **自定义 CSS**：可通过 `customCSS` 字段添加额外样式

### 页面插件注意事项

1. **路由唯一性**：确保路由名称和路径在应用中唯一
2. **图标格式**：使用 FontAwesome 图标格式 `["fas", "icon-name"]`
3. **国际化**：菜单文本使用 i18n 键值，需要在语言包中定义
4. **Vue 组件**：必须提供完整的 Vue 组件文件（.vue）
5. **依赖导入**：可以直接导入应用的服务和工具
6. **生命周期**：完整支持 Vue 3 Composition API 和 Options API
7. **样式隔离**：建议使用 scoped 样式避免污染全局样式

---

## 📦 发布插件

### 语言插件和主题插件

1. 确保插件文件夹结构正确
2. 测试插件在应用中正常工作
3. 提交 Pull Request 到主仓库
4. 或联系开发者添加到插件市场

### 页面插件

页面插件支持两种安装方式：

#### 方式 1：手动安装（推荐）

1. 确保插件包含以下文件：
   - `plugin.json` - 插件元数据
   - `config.json` - 路由和菜单配置
   - `Component.vue` - Vue 组件文件

2. 用户通过插件市场的"手动安装"功能选择插件文件夹

3. 插件会自动加载并注册路由和菜单

#### 方式 2：开发环境集成

1. 将插件文件夹放到项目的 `plugins/` 目录
2. 在应用代码中导入并安装插件
3. 重新编译应用

示例：
```javascript
// 在 src/main.js 或其他初始化文件中
import { installPagePlugin } from './plugins';
import myPlugin from '../plugins/page-my-plugin/index.js';

// 在应用初始化后安装
await installPagePlugin(myPlugin);
```

---

## 🔗 相关资源

- [应用仓库](https://github.com/Eververdants/ETBSaveManager)
- [问题反馈](https://github.com/Eververdants/ETBSaveManager/issues)
- 联系邮箱：llzgd@outlook.com

---

<p align="center">
  <sub>感谢你为 E.T.B. Save Manager 贡献插件！</sub>
</p>
