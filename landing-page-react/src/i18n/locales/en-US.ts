/**
 * 站点文案 — English (source of truth).
 * 与 `site-content.ts` 中 `site` 字段保持镜像；命名风格为命名空间 + 点路径。
 */
export default {
  common: {
    siteName: "ETB Save Manager",
    tagline: "A modern, cross-platform save management tool for Escape The Backrooms",
    description:
      "A declassified archive manager for the Backrooms — full CRUD with soft-delete, 3-step creation wizard across 4 endings and 54 levels, 10 themes, en/zh-CN/zh-TW UI, virtual scrolling, and a built-in performance monitor. Built with Tauri 2.0 on Windows.",
    cat: "cat. etb · save · mgr",
    catShort: "cat · save · mgr",
    root: "root",
    archive: "archive",
    obtain: "obtain",
    screens: "screens",
    source: "source",
    sourceAriaLabel: "GitHub",
    classificationStandard: "Standard",
    classificationTechnical: "Technical",
    declassifiedSubline: "declassified — for archival purposes only",
  },

  theme: {
    toggleLabel: "Toggle theme",
    switchToLight: "Switch to light",
    switchToDark: "Switch to dark",
  },

  lang: {
    label: "Language",
    enUS: "English",
    zhCN: "简体中文",
    zhTW: "繁體中文",
  },

  meta: {
    archive: "Archive",
    statusOnline: "online",
    buildLabel: "build /",
    comingSoon: "↳ next build: v{version} · {date} — smart scheduling & UI refactor",
  },

  hero: {
    breadcrumb: "Level 0",
    // Heading is split across "ETB" (monogram) + "Save Manager" to allow
    // translations that re-arrange or omit the monogram.
    headingPrefix: "ETB",
    // 标题第二行：把首字母 S 单独拆出做高亮着色（en: "S" + "ave Manager"）
    headingHighlight: "S",
    headingRest: "ave Manager",
    taglineSuffix: "— a declassified utility for the lost floors.",
    ctaDownload: "Download for Windows",
    ctaGithub: "View on GitHub",
    latestStable: "↓ latest stable",
    ctaGithubAria: "GitHub repository",
    meta: {
      version: "version",
      build: "build",
      released: "released",
      platform: "platform",
      platformValue: "windows / tauri",
    },
    card: {
      aria: "FILE_001.SAV — sample archived save record",
      file: "file_001.sav",
      archivedBadge: "archived",
      title: "The Yellow Hallway",
      levelSuffix: "// lvl 0",
      idValue: "a4f7-9c2b-001",
      playerValue: '"operative_07"',
      id: "id",
      player: "player",
      sanity: "sanity",
      size: "size",
      sizeValue: "2.4 mb",
      created: "created",
      items: "items",
      itemsValue: "12 / 24",
      inventory: "inventory // 12/24",
      tagStandard: "Standard",
      tagHidden: "Hidden",
      tagClassII: "Class II",
      stamp: "archived",
    },
  },

  features: {
    section: {
      index: "Index",
      indexSubline: "of features",
      intro: "Everything you need to keep your Backrooms saves organized, fast, and portable.",
      introSuffix: "Six modules. No bloat. Everything local.",
      lastRevised: "↳ 6 files in archive · last revised {date}",
    },
    crud: {
      title: "Full Save Management",
      description: "Create, edit, copy, hide, soft-delete and restore. Favorites, batch ops, and full undo / redo.",
    },
    wizard: {
      title: "3-Step Creation Wizard",
      description:
        "Quick Create or Standard mode — pick from 54 levels across 4 endings (Wrong Door, Empty City, The Suburbs, The Pink House), configure difficulty, edit 12-slot inventory.",
    },
    themes: {
      title: "11 Built-in Themes",
      description:
        "Light, Dark, and 9 vibrant palettes (forest, lavender, mint, ocean, peach, rose, sky, sunset, high-contrast).",
    },
    i18n: {
      title: "Trilingual UI",
      description:
        "English, 简体中文, and 繁體中文. Every string externalised through i18next with no hard-coded copy.",
    },
    "virtual-scroll": {
      title: "Virtual Scrolling",
      description:
        "GPU-accelerated @tanstack/vue-virtual — smooth scrolling across thousands of saves with incremental load.",
    },
    performance: {
      title: "Performance Monitor",
      description:
        "Built-in FPS, memory, and animation-quality diagnostics. Tune GPU rendering and effect budgets in real time.",
    },
    scheduler: {
      title: "Smart Resource Scheduling",
      description:
        "Automatically detects operation context and dynamically allocates CPU, rendering, and I/O budgets. Priority-based background task queue with real-time FPS/memory feedback loops.",
    },
  },

  screens: {
    section: {
      plate: "fig // plate 02 / 04",
      plateSubline: "abstract views — built from real components",
      plateTech: "vue 3.5 · tauri 2.0",
      index: "§ 02",
      titleA: "See it",
      titleB: "in action",
      intro: "A snapshot of the three main views — all hand-built from the same primitives the app uses.",
      introSuffix: "No mockups, just real shapes.",
    },
    home: {
      title: "Archive List",
      description: "Browse, search, and manage every save.",
      windowTitle: "Home · Archives",
      archives: "{count} archives",
    },
    create: {
      title: "Create Archive — Step 1",
      description: "Three-step wizard. Pick from {levels} levels across {endings} endings.",
      windowTitle: "Create · Step 1 / 3",
      levelsCount: "{count} levels",
      step1: "select",
      step2: "config",
      step3: "inventory",
      ending1: "wrong door",
      ending2: "empty city",
      ending3: "suburbs",
      ending4: "pink house",
      previous: "← previous",
      next: "next →",
      stepCounter: "step 1 / 3",
    },
    edit: {
      title: "Edit Archive — Players",
      description: "Steam IDs, sanity slider, {slots}-slot inventory editor.",
      windowTitle: "Edit · Players",
      playersCount: "2 players",
      tabBasic: "basic",
      tabLevel: "level",
      tabPlayers: "players",
      cancel: "× cancel",
      save: "↓ save",
      playersHeading: "players · 2",
      steamIdPlaceholder: "steam id…",
      addPlayer: "+ add",
      sanity: "sanity",
      sanityPercent: "{value}%",
      inventory: "inventory · 9/12",
      slot: "{value}",
      placeholderHand: "hand",
      placeholderBack: "back",
    },
    items: {
      Flashlight: "Flashlight",
      GlowstickBlue: "Blue Glow Stick",
      Knife: "Knife",
      WalkieTalkie: "Walkie Talkie",
      MothJelly: "Moth Jelly",
      AlmondWater: "Almond Water",
      Battery: "Battery",
      Crowbar: "Crowbar",
      DivingHelmet: "Diving Helmet",
      Flaregun: "Flare Gun",
      LiquidPain: "Liquid Sorrow",
      Rope: "Rope",
    },
    homeTool: {
      back: "← back",
      selectAll: "select all",
      invert: "invert",
      counter: "{selected} / {total}",
      delete: "delete",
      search: "search saves, levels, players…",
      chipLevel: "level",
      chipDiff: "diff",
      chipFav: "★ fav",
    },
  },

  download: {
    section: {
      index: "§ 03",
      titleA: "Obtain",
      titleB: "/ download",
      intro: "Choose your platform — the latest build is fetched straight from GitHub Releases.",
      introSuffix: "No installer, no telemetry, no surprises.",
      buildLine: "↳ v{version} · build # {build} · {date}",
      sha: "sha256 verified at build",
      noTelemetry: "no telemetry · offline-first",
      mit: "mit license · source included",
      filePrefix: "file /",
      ready: "ready",
      arch: "arch",
      size: "size",
      build: "build",
      type: "type",
      typeValue: ".msi",
    },
    labels: {
      "win-x64": "Windows x64",
      "win-x86": "Windows x86",
      "win-arm64": "Windows ARM64",
    },
  },

  footer: {
    section: "§ archive / end of document",
    edition: "/ archive ed.",
    taglineA: "A declassified utility for the lost floors.",
    taglineB: "Stay sane. Bring a flashlight.",
    index: "↳ index",
    releases: "Releases",
    license: "License",
    source: "Source",
    issues: "Issues",
    copyright: "© {year} {name}. released under mit.",
    buildLine: "v{version} · build # {build} · {date}",
    madeWith: "made with",
    heart: "for the lost floors",
  },
} as const;
