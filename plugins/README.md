# 插件开发目录 / Plugins Development Directory

此目录用于存放和开发插件。

## 目录结构

```
plugins/
├── plugins.json                 # 插件索引文件（插件商店读取此文件）
├── README.md                    # 本文件
├── lang-ja-JP/                  # 日语语言插件示例
│   ├── plugin.json              # 插件元数据
│   ├── translations.json        # 翻译数据
│   └── README.md                # 插件说明
└── [your-plugin]/               # 你的插件
    ├── plugin.json              # 必需：插件元数据
    └── ...                      # 插件资源文件
```

## 插件索引文件 (plugins.json)

插件商店通过读取 `plugins.json` 来显示可用插件列表。

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-04",
  "plugins": [
    {
      "id": "lang-ja-JP",
      "name": "日本語言語パック",
      "type": "language",
      "version": "1.0.0",
      "author": "Kiro",
      "description": "日语翻译包",
      "locale": "ja-JP",
      "localeName": "日本語",
      "icon": "globe",
      "license": "MIT",
      "downloadUrl": "https://raw.githubusercontent.com/.../plugins/lang-ja-JP"
    }
  ]
}
```

### 添加新插件到索引

1. 在 `plugins/` 目录下创建插件文件夹
2. 编辑 `plugins.json`，在 `plugins` 数组中添加新插件信息
3. `downloadUrl` 指向插件文件夹的 raw URL

## 插件类型

### 语言插件 (type: "language")

语言插件用于添加新的界面语言支持。

#### plugin.json 结构

```json
{
  "id": "lang-{locale}",
  "name": "语言包名称",
  "type": "language",
  "version": "1.0.0",
  "author": "作者名",
  "description": "插件描述",
  "locale": "语言代码（如 ja-JP）",
  "localeName": "语言显示名称（如 日本語）",
  "main": "translations.json",
  "icon": "globe",
  "license": "MIT"
}
```

#### translations.json 结构

翻译文件需要包含以下必需字段：
- `common` - 通用文本
- `sidebar` - 侧边栏文本
- `settings` - 设置页面文本

参考 `src/i18n/locales/zh-CN.json` 获取完整的翻译键列表。

## 安装插件

用户可以通过以下方式安装插件：
1. 插件商店 → 点击安装按钮（从 GitHub 下载）
2. 插件商店 → 安装本地插件 → 选择插件文件夹

## 许可证

插件开发者可自行选择许可证，建议使用 MIT 或与主项目兼容的开源许可证。
