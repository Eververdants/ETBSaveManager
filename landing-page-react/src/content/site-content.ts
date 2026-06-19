export const site = {
  name: "E.T.B. Save Manager",
  tagline: "A modern save management tool for Escape The Backrooms",
  description:
    "Full CRUD for saves, 13 themes, multilingual UI, and virtual scrolling — built with Vue 3 and Tauri 2 for Windows.",
  features: [
    {
      id: "crud",
      title: "Full Save Management",
      description: "Create, edit, delete, copy, and hide saves with undo/redo support.",
      iconKey: "icon-crud",
    },
    {
      id: "themes",
      title: "13 Built-in Themes",
      description: "Light, dark, and 11 vibrant color schemes to match your style.",
      iconKey: "icon-themes",
    },
    {
      id: "virtual-scroll",
      title: "Virtual Scrolling",
      description: "Smooth performance across thousands of saves with GPU-accelerated rendering.",
      iconKey: "icon-virtual",
    },
    {
      id: "i18n",
      title: "Multilingual UI",
      description: "Built-in English, Simplified Chinese, and Traditional Chinese with plugin support.",
      iconKey: "icon-i18n",
    },
    {
      id: "tutorial",
      title: "Interactive Tutorial",
      description: "First-run overlay guides you through every feature in under a minute.",
      iconKey: "icon-tutorial",
    },
    {
      id: "performance",
      title: "Performance Monitor",
      description: "Built-in FPS and memory diagnostics keep the experience buttery smooth.",
      iconKey: "icon-performance",
    },
  ],
  downloads: [
    {
      id: "win-x64",
      label: "Windows x64",
      href: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
    },
    {
      id: "win-x86",
      label: "Windows x86",
      href: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
    },
    {
      id: "win-arm64",
      label: "Windows ARM64",
      href: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
    },
  ],
  githubUrl: "https://github.com/Eververdants/ETBSaveManager",
  releasesUrl: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
} as const;
