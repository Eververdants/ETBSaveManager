export default {
  nav: {
    overview: '亮点',
    features: '功能',
    preview: '预览',
    tech: '保障',
    download: '下载'
  },
  hero: {
    badge: 'v3.0.0 正式版现已发布',
    title1: '逃离后室',
    title2: '存档管理器',
    subtitle: '一款现代化的《Escape The Backrooms》存档管理工具',
    subtitleDesc: '界面直观，上手简单，三步即可完成常用存档操作',
    downloadBtn: '免费下载',
    downloadNote: '无需登录，无广告弹窗，下载后即可使用',
    sourceBtn: '查看源码',
    proofs: ['100% 免费', '新手友好', 'v3.0.0 稳定版', '开源透明'],
    stats: {
      platform: '支持平台',
      framework: '构建框架',
      languages: '多语言支持',
      languagesValue: '7+ 语言'
    }
  },
  overview: {
    badge: '玩家亮点',
    title: '简单好用，不花哨',
    subtitle: '面向普通玩家设计，重点是好上手、够稳定、效率高',
    basic: {
      title: '基本信息',
      items: [
        { label: '项目名称', value: 'ETB Save Manager' },
        { label: '版本', value: 'v3.0.0' },
        { label: '作者', value: 'Eververdants' },
        { label: '许可证', value: 'MIT' },
        { label: '主要平台', value: 'Windows' },
        { label: '核心框架', value: 'Tauri 2.0 + Vue 3' }
      ]
    },
    architecture: {
      title: '开发者技术细节（可选）',
      tip: '下面内容给想了解实现方案的用户查看，日常使用无需关注。',
      frontendTitle: '前端技术栈',
      backendTitle: '后端技术栈',
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
      title: '游戏支持范围',
      desc: '专为《逃离后室》设计，核心场景都能覆盖。',
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
        '支持存档读取、编辑、备份和删除',
        '支持 40+ 关卡与常用物品数据',
        '支持玩家理智值、背包等核心内容编辑'
      ]
    },
    quality: {
      title: '使用体验保障',
      items: [
        '大列表依旧流畅，不容易卡顿',
        '启动速度优化，打开后可快速使用',
        '自动更新检查，及时获得新版本',
        '输入校验与安全处理，减少误操作风险'
      ]
    }
  },
  features: {
    badge: '功能特性',
    title: '从存档到扩展的全流程能力',
    subtitle: '围绕“管理、编辑、扩展、反馈”四个方向，提供完整的玩家工具链',
    items: {
      saveManagement: {
        title: '存档管理',
        desc: '完整 CRUD + 批量处理 + 智能筛选 + 快速搜索'
      },
      theme: {
        title: '主题系统',
        desc: '浅色/深色与节日主题并存，支持自定义切换'
      },
      i18n: {
        title: '多语言',
        desc: '内置中英文，支持通过插件扩展日韩俄葡等语言'
      },
      quickCreate: {
        title: '快速创建',
        desc: '提供快速创建、蓝图创建、标准创建多种模式'
      },
      inventory: {
        title: '背包编辑',
        desc: '可直接修改背包内容，适配不同游玩需求'
      },
      plugins: {
        title: '插件系统',
        desc: '支持语言插件、主题插件、页面插件三类扩展'
      },
      feedback: {
        title: '反馈系统',
        desc: '内置问题反馈与迭代沟通入口'
      }
    }
  },
  screenshots: {
    badge: '界面预览',
    title: '现代化的用户界面',
    subtitle: '使用 "Ocean" 主题演示主要功能页面',
    viewMore: '查看更多截图',
    items: {
      list: { title: '存档列表', desc: '清晰展示全部存档数据' },
      create: { title: '创建存档', desc: '多步骤创建流程' },
      quick: { title: '快速创建', desc: '简化输入，快速生成' },
      edit: { title: '编辑页面', desc: '详细配置项与玩家数据' }
    }
  },
  tech: {
    badge: '稳定保障',
    title: '看不见但很重要的底层能力',
    subtitle: '你感受到的是顺畅和稳定，背后由成熟技术栈支撑',
    frontendTitle: '前端体验',
    backendTitle: '后端稳定性',
    opensource: {
      title: '开源项目',
      desc: 'MIT 许可证，欢迎 Star、Issue 与 PR 贡献',
      btn: 'Star on GitHub'
    }
  },
  download: {
    badge: '下载安装',
    title: '立即开始使用',
    subtitle: '免费下载，开箱即用',
    hot: {
      badge: '热门推荐',
      title: '现在下载，3 分钟内就能开始管理存档',
      subtitle: '如果你经常备份、换档或改背包，这个工具会明显省时间',
      cta: '立即下载 v3.0.0',
      points: ['Windows 10/11', '安装简单', '支持中文界面', '持续更新']
    },
    version: '最新版本',
    downloadBtn: '下载安装包',
    requirements: {
      title: '系统要求',
      item1: 'Windows 10/11',
      item2: 'WebView2 Runtime',
      item3: '约 50MB 磁盘空间'
    },
    source: {
      title: '从源码构建',
      viewRepo: '查看仓库'
    },
    release: {
      label: '正式版',
      date: 'v3.0.0 正式版已发布'
    }
  },
  footer: {
    desc: 'ETB Save Manager 是面向《逃离后室》的现代化存档管理桌面应用',
    product: '产品',
    resources: '资源',
    links: {
      download: '下载',
      changelog: '更新日志',
      feedback: '反馈问题'
    },
    disclaimer: '本项目与 Fancy Games 或《逃离后室》游戏没有任何关联'
  }
}
