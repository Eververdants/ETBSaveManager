export default {
  nav: {
    overview: 'Highlights',
    features: 'Features',
    preview: 'Preview',
    tech: 'Stability',
    download: 'Download'
  },
  hero: {
    badge: 'v3.0.2 Stable Release Now Available',
    title1: 'Escape The Backrooms',
    title2: 'Save Manager',
    subtitle: 'A modern save management desktop tool for "Escape The Backrooms"',
    subtitleDesc: 'Clean UI, easy onboarding, and fast day-to-day save operations',
    downloadBtn: 'Free Download',
    downloadNote: 'No account needed, no popup ads, download and use immediately',
    sourceBtn: 'View Source',
    proofs: ['100% Free', 'Beginner Friendly', 'v3.0.2 Stable', 'Open Source'],
    stats: {
      platform: 'Platform',
      framework: 'Framework',
      languages: 'Languages',
      languagesValue: '7+ Languages'
    }
  },
  overview: {
    badge: 'Player Highlights',
    title: 'Simple, Fast, and Practical',
    subtitle: 'Designed for regular players with focus on usability, stability, and speed',
    basic: {
      title: 'Basic Information',
      items: [
        { label: 'Project Name', value: 'ETB Save Manager' },
        { label: 'Version', value: 'v3.0.2' },
        { label: 'Author', value: 'Eververdants' },
        { label: 'License', value: 'MIT' },
        { label: 'Primary Platform', value: 'Windows' },
        { label: 'Core Framework', value: 'Tauri 2.0 + Vue 3' }
      ]
    },
    architecture: {
      title: 'Developer Technical Details (Optional)',
      tip: 'This part is for users who want implementation details. You can safely skip it.',
      frontendTitle: 'Frontend Stack',
      backendTitle: 'Rust Backend Stack',
      frontend: [
        'Vue 3 + Composition API',
        'Vite',
        'Tailwind CSS + CSS Variables',
        'vue-i18n'
      ],
      backend: [
        'Tauri 2.0',
        'uesave',
        'tokio',
        'rusqlite'
      ]
    },
    support: {
      title: 'Game Support Scope',
      desc: 'Purpose-built for Escape the Backrooms and covers the core gameplay save scenarios.',
      levelTags: [
        'Level 0',
        'Level 0.5',
        'Level 1',
        'Level 3',
        'Level 52',
        'Level 94',
        'Level 188',
        'Poolrooms',
        'The Hub',
        'The End'
      ],
      items: [
        'Supports save reading, editing, backup, and cleanup',
        'Supports 40+ levels and common item data',
        'Supports player position, and inventory editing'
      ]
    },
    quality: {
      title: 'Everyday Reliability',
      items: [
        'Large save lists remain responsive',
        'Startup path is optimized for quick use',
        'Auto-update checks keep versions current',
        'Input validation reduces accidental mistakes'
      ]
    }
  },
  features: {
    badge: 'Features',
    title: 'End-to-End Save Workflow Capabilities',
    subtitle: 'Designed around management, editing, extension, and feedback for ETB players',
    items: {
      saveManagement: {
        title: 'Save Management',
        desc: 'Complete CRUD with batch operations, smart filtering, and fast search'
      },
      theme: {
        title: 'Theme System',
        desc: 'Light/dark plus seasonal themes with flexible customization'
      },
      i18n: {
        title: 'Multi-language',
        desc: 'Built-in Chinese and English, extensible with plugin language packs'
      },
      quickCreate: {
        title: 'Quick Create',
        desc: 'Quick Create, Blueprint Create, and Standard Create modes'
      },
      inventory: {
        title: 'Inventory Editor',
        desc: 'Direct inventory customization for tailored gameplay'
      },
      plugins: {
        title: 'Plugin System',
        desc: 'Supports language, theme, and page plugin types'
      },
      feedback: {
        title: 'Feedback System',
        desc: 'Built-in channel for issue reporting and iteration feedback'
      }
    }
  },
  screenshots: {
    badge: 'Preview',
    title: 'Modern User Interface',
    subtitle: 'Key pages shown with the "Ocean" theme',
    viewMore: 'View More Screenshots',
    items: {
      list: { title: 'Save List', desc: 'Clear view of all save data' },
      create: { title: 'Create Save', desc: 'Multi-step creation flow' },
      quick: { title: 'Quick Create', desc: 'Faster creation with simplified input' },
      edit: { title: 'Edit Page', desc: 'Detailed options and player data controls' }
    }
  },
  tech: {
    badge: 'Stability Foundation',
    title: 'Reliable Tech Behind the UI',
    subtitle: 'What players feel is smooth and stable behavior powered by proven technologies',
    frontendTitle: 'Frontend Experience',
    backendTitle: 'Backend Stability',
    opensource: {
      title: 'Open Source',
      desc: 'MIT licensed, contributions via Stars, Issues, and PRs are welcome',
      btn: 'Star on GitHub'
    }
  },
  download: {
    badge: 'Download',
    title: 'Get Started Now',
    subtitle: 'Free download, ready to use',
    hot: {
      badge: 'Top Pick',
      title: 'Download now and start managing saves in minutes',
      subtitle: 'If you frequently back up, switch saves, or edit inventory, this tool saves real time',
      cta: 'Download v3.0.2 Now',
      points: ['Windows 10/11', 'Easy setup', 'Multi-language UI', 'Actively updated']
    },
    version: 'Latest Version',
    downloadBtn: 'Download Installer',
    requirements: {
      title: 'System Requirements',
      item1: 'Windows 10/11',
      item2: 'WebView2 Runtime',
      item3: '~50MB disk space'
    },
    source: {
      title: 'Build from Source',
      viewRepo: 'View Repository'
    },
    release: {
      label: 'Stable Release',
      date: 'v3.0.2 stable release is now live'
    }
  },
  downloadPage: {
    meta: {
      pageTitle: 'ETB Save Manager - Download',
      platform: 'Platform',
      architecture: 'Architecture',
      targetFile: 'Target File',
      platformWindows: 'Windows',
      platformOther: 'Other',
      releasesPage: 'Releases Page'
    },
    backHome: 'Back to Home',
    title: 'Preparing the right installer for your device',
    subtitle: 'We detected your platform and architecture. You can still choose manually below.',
    actions: {
      downloadRecommended: 'Download Now (Recommended)',
      allReleases: 'View All Releases'
    },
    status: {
      nonWindows: 'Non-Windows system detected. Please choose manually on the Releases page.',
      autoDisabled: 'Auto redirect is disabled (auto=0). Click "Download Now (Recommended)".',
      autoCountdown: 'Auto download starts in {seconds}s ({arch}).'
    },
    manual: {
      title: 'Choose installer manually (Windows Setup)',
      arm64Note: 'Windows on ARM devices',
      x64Note: 'Most 64-bit Windows devices',
      x86Note: 'Older 32-bit Windows devices'
    }
  },
  footer: {
    desc: 'ETB Save Manager is a modern desktop save management tool built for Escape The Backrooms',
    product: 'Product',
    resources: 'Resources',
    links: {
      download: 'Download',
      changelog: 'Changelog',
      feedback: 'Feedback'
    },
    disclaimer: 'This project is NOT affiliated with Fancy Games or "Escape The Backrooms"'
  }
}
