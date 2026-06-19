/**
 * 站点内容集中管理。
 *
 * 同步规则：
 * - version / build / releaseDate / framework / identifier / bundle 必须与主项目
 *   package.json / tauri.conf.json / release-notes 保持完全同步。
 * - levelCount / endingCount / inventorySlotCount / inventoryItemCount 与主项目
 *   src/views/CreateArchive/index.vue loadLevels() / useInventoryItemSelector 对齐。
 * - features 顺序与 README 列出的产品能力顺序一致。
 *
 * i18n 规则：
 * - 本文件保留 en-US 镜像（name / tagline / description / features[i].title 与
 *   description / downloads[i].label）以保证既有测试可读。
 * - 用户实际看到的内容由 i18next 从 src/i18n/locales/{en-US,zh-CN,zh-TW}.ts 提供。
 *   修改 en-US 文案时，请同步本文件与 locales/en-US.ts。
 */
export const site = {
  name: "ETB Save Manager",
  tagline: "A modern, cross-platform save management tool for Escape The Backrooms",
  description:
    "A declassified archive manager for the Backrooms — full CRUD with soft-delete, 3-step creation wizard across 4 endings and 54 levels, 11 themes, en/zh-CN/zh-TW UI, virtual scrolling, and a built-in performance monitor. Built with Tauri 2.0 on Windows.",

  // 与主项目同步：版本戳 / 编译号 / 发布日（非翻译数据）
  meta: {
    version: "3.2.0",
    build: "20260619",
    releaseDate: "2026-06-19",
    edition: "Archive Edition",
    status: "online",
    codename: "Code Cleanup & Performance Optimization",
    framework: "Tauri 2.0",
    identifier: "com.admin.etbsavemanager",
    bundle: "nsis · msi",
    // 真实内容规模（与主项目 src/views/CreateArchive/index.vue loadLevels 对齐）
    levelCount: 54,
    endingCount: 4,
    inventorySlotCount: 12,
    inventoryItemCount: 25,
  },

  // 6 大特性（en-US 镜像；翻译见 i18n/locales）
  features: [
    {
      id: "crud",
      title: "Full Save Management",
      description: "Create, edit, copy, hide, soft-delete and restore. Favorites, batch ops, and full undo / redo.",
      iconKey: "icon-crud",
      ref: "FILE 001",
      classification: "Standard",
    },
    {
      id: "wizard",
      title: "3-Step Creation Wizard",
      description:
        "Quick Create or Standard mode — pick from 54 levels across 4 endings (Wrong Door, Empty City, The Suburbs, The Pink House), configure difficulty, edit 12-slot inventory.",
      iconKey: "icon-wizard",
      ref: "FILE 002",
      classification: "Standard",
    },
    {
      id: "themes",
      title: "11 Built-in Themes",
      description:
        "Light, Dark, and 9 vibrant palettes (forest, lavender, mint, ocean, peach, rose, sky, sunset, high-contrast).",
      iconKey: "icon-themes",
      ref: "FILE 003",
      classification: "Standard",
    },
    {
      id: "i18n",
      title: "Trilingual UI",
      description:
        "English, 简体中文, and 繁體中文. Every string externalised through i18next with no hard-coded copy.",
      iconKey: "icon-i18n",
      ref: "FILE 004",
      classification: "Standard",
    },
    {
      id: "virtual-scroll",
      title: "Virtual Scrolling",
      description:
        "GPU-accelerated @tanstack/vue-virtual — smooth scrolling across thousands of saves with incremental load.",
      iconKey: "icon-virtual",
      ref: "FILE 005",
      classification: "Technical",
    },
    {
      id: "performance",
      title: "Performance Monitor",
      description:
        "Built-in FPS, memory, and animation-quality diagnostics. Tune GPU rendering and effect budgets in real time.",
      iconKey: "icon-performance",
      ref: "FILE 006",
      classification: "Technical",
    },
  ],

  // 下载项（id / arch / size / href 非翻译；label 由 i18n 提供，en-US 镜像保留用于测试）
  downloads: [
    {
      id: "win-x64",
      label: "Windows x64",
      href: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
      arch: "x86_64",
      size: "nsis",
    },
    {
      id: "win-x86",
      label: "Windows x86",
      href: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
      arch: "i686",
      size: "msi",
    },
    {
      id: "win-arm64",
      label: "Windows ARM64",
      href: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
      arch: "arm64",
      size: "msi",
    },
  ],

  githubUrl: "https://github.com/Eververdants/ETBSaveManager",
  releasesUrl: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
} as const;
