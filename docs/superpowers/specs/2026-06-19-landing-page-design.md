# Landing Page with React + GitHub Pages Deployment

- **Date**：2026-06-19
- **Owner**：ETB Save Manager 项目维护者
- **Status**：Draft → Approved（待用户复审）
- **Scope**：在 `ETBSaveManager-Project` 仓库新增独立子项目 `landing-page-react/`，用于展示与下载入口，并通过 GitHub Pages 自动部署。

## 1. 背景与目标

主项目 `ETBSaveManager-Project` 是基于 Vue 3 + Vite 6 + Tauri 2.0 的 Windows 桌面应用（Escape The Backrooms 存档管理器）。仓库当前缺少可直接分享与 SEO 友好的落地页；用户访问 GitHub 仓库时仅能通过 README 了解项目，缺少具视觉冲击力的产品介绍与一键下载入口。

本次目标：

1. 在仓库内新增一个独立的 React 落地页（**不使用任何图片**）。
2. 通过 GitHub Actions 在 `push` 到 `main` 时自动构建并部署到 GitHub Pages。
3. 落地页与主项目（Tauri 桌面应用）解耦，互不污染依赖、构建与发布流程。

## 2. 决策摘要

| 决策点 | 选择 | 备选 |
|--------|------|------|
| 项目位置 | 独立子目录 `landing-page-react/` | Monorepo 混合 / 完全替换（已否决） |
| 内容范围 | Hero + Features + Screens（CSS 抽象）+ Download + Footer | 丰满型 / 极简型（已否决） |
| 工具链 | Vite 6 + React 19 + TypeScript + Tailwind CSS 4 | 原生 CSS / CRA（已否决） |
| 部署 | `actions/deploy-pages@v4` + `upload-pages-artifact@v3` 官方方案 | 在 release.yml 中追加（已否决） |
| 暗色模式 | light + dark 切换（跟随系统偏好 + localStorage 持久化） | 仅浅色 / 仅深色（已否决） |
| 多语言 | 本次不实现 i18n；文案集中在 `site-content.ts`，为后续 i18n 留扩展点 | — |

## 3. 项目布局

```
landing-page-react/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── nav-bar.tsx
│   │   ├── hero-section.tsx
│   │   ├── features-section.tsx
│   │   ├── screens-section.tsx
│   │   ├── download-section.tsx
│   │   ├── footer-section.tsx
│   │   └── theme-toggle.tsx
│   ├── hooks/
│   │   └── use-theme-mode.ts
│   ├── content/
│   │   └── site-content.ts
│   ├── styles/
│   │   └── global.css
│   ├── app.tsx
│   ├── main.tsx
│   └── env.d.ts
├── tests/
│   ├── setup.ts
│   ├── components/
│   │   ├── hero-section.test.tsx
│   │   ├── features-section.test.tsx
│   │   ├── screens-section.test.tsx
│   │   ├── download-section.test.tsx
│   │   ├── nav-bar.test.tsx
│   │   └── theme-toggle.test.tsx
│   ├── hooks/
│   │   └── use-theme-mode.test.ts
│   └── content/
│       └── site-content.test.ts
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── prettier.config.js
├── .gitignore
└── README.md
```

## 4. 依赖与版本

| 类别 | 包 | 版本 |
|------|----|------|
| 运行时 | react | ^19 |
| 运行时 | react-dom | ^19 |
| 构建 | vite | ^6 |
| 构建 | @vitejs/plugin-react | ^4 |
| 样式 | tailwindcss | ^4 |
| 样式 | @tailwindcss/vite | ^4 |
| 类型 | typescript | ^5.8 |
| 类型 | @types/react | ^19 |
| 类型 | @types/react-dom | ^19 |
| 测试 | vitest | ^4 |
| 测试 | @testing-library/react | ^16 |
| 测试 | @testing-library/jest-dom | ^6 |
| 测试 | happy-dom | ^20 |
| 代码质量 | eslint | ^9（React 项目对 eslint 10 兼容性视情况定） |
| 代码质量 | eslint-plugin-react-hooks | latest |
| 代码质量 | eslint-plugin-react-refresh | latest |
| 代码质量 | prettier | ^3 |
| 工具 | @vitejs/plugin-react | ^4 |

> 注：实际锁版本以 `pnpm install` 解析后的 `pnpm-lock.yaml` 为准。

## 5. Vite 配置

`vite.config.ts` 关键项：

- `plugins: [react(), tailwindcss()]`
- `base`: 读取 `process.env.VITE_BASE_PATH ?? "/"`（本地默认 `/`，部署时由 workflow 注入 `/ETBSaveManager-Project/`）
- `build.outDir: "dist"`
- `build.sourcemap: false`（与主项目一致）
- `resolve.alias`: `"@": path.resolve(__dirname, "src")`
- `test.environment: "happy-dom"`，`test.setupFiles: ["./tests/setup.ts"]`

## 6. 内容与组件

### 6.1 页面分区

| Section | 组件 | 关键元素 | 无图片实现 |
|---------|------|----------|------------|
| Nav | `nav-bar.tsx` | 文字 monogram、GitHub 链接、主题切换 | 内联 `<svg>` 单色图标 |
| Hero | `hero-section.tsx` | 标题、slogan、Download / GitHub 双 CTA | 大字号排版 + `bg-gradient-to-br` |
| Features | `features-section.tsx` | 6 项功能卡：CRUD / 13 主题 / 虚拟滚动 / i18n / 教程 / 性能监控 | 卡片左侧内联单色 SVG 图标 |
| Screens | `screens-section.tsx` | 3 个抽象"界面"卡：存档列表 / 创建 / 编辑 | 纯 CSS + Tailwind 模拟窗口框、占位条、按钮 |
| Download | `download-section.tsx` | Windows x64 / x86 / arm64 三按钮 + GitHub Releases 入口 | 内联 SVG 平台单色图标 |
| Footer | `footer-section.tsx` | 版权、License 链接、相关项目链接 | 纯文字 |

### 6.2 组件层级

```tsx
<App>
  <ThemeProvider>
    <NavBar>
      <ThemeToggle />
    </NavBar>
    <main>
      <HeroSection />
      <FeaturesSection />
      <ScreensSection />
      <DownloadSection />
    </main>
    <FooterSection />
  </ThemeProvider>
</App>
```

### 6.3 状态管理

- `use-theme-mode.ts` 钩子：管理 `light | dark | system`，持久化到 `localStorage.etb-theme-pref`，初始化读取 `prefers-color-scheme`，将结果以 `dark` class 写入 `<html>`。

### 6.4 数据源（`site-content.ts`）

```ts
export const site = {
  name: "E.T.B. Save Manager",
  tagline: "A modern save management tool for Escape The Backrooms",
  description: "...",
  features: [
    { id: "crud", title: "...", description: "...", iconKey: "icon-key-1" },
    ...
  ],
  downloads: [
    { id: "win-x64", label: "Windows x64", href: "https://github.com/Eververdants/ETBSaveManager/releases/latest" },
    { id: "win-x86", label: "Windows x86", href: "https://github.com/Eververdants/ETBSaveManager/releases/latest" },
    { id: "win-arm64", label: "Windows ARM64", href: "https://github.com/Eververdants/ETBSaveManager/releases/latest" },
  ],
  githubUrl: "https://github.com/Eververdants/ETBSaveManager",
  releasesUrl: "https://github.com/Eververdants/ETBSaveManager/releases/latest",
} as const;
```

三个 download 按钮的具体资产文件名（如 `.msi`、`.exe`）由 GitHub Releases latest 的资源决定，落地页不做硬编码文件名，而是统一指向 `releases/latest`，由 GitHub 自动重定向到最新版本。

## 7. "无图片"边界定义

- **允许**：内联 SVG（单色，每文件 < 1KB，写死在组件中）、CSS 渐变、Tailwind 工具类、极少 emoji。
- **禁止**：`<img>` 标签、CSS `background-image: url()`、外链图标资源、`<canvas>` 截图、`<picture>`。

## 8. 响应式与可访问性

- 断点：Tailwind 默认（`sm: 640px` `md: 768px` `lg: 1024px` `xl: 1280px`）
- 移动端：Hero 单列；Features 网格从 3 列降到 1 列；Screens 横向滑动
- A11y：语义化标签、`aria-label` / `aria-pressed` 用于交互元素；颜色对比度满足 WCAG AA

## 9. GitHub Pages 部署 Workflow

新增 `.github/workflows/pages.yml`：

```yaml
name: Deploy Landing Page to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'landing-page-react/**'
      - '.github/workflows/pages.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: 'landing-page-react/pnpm-lock.yaml'

      - name: Install dependencies
        working-directory: landing-page-react
        run: pnpm install --frozen-lockfile

      - name: Lint
        working-directory: landing-page-react
        run: pnpm lint

      - name: Typecheck
        working-directory: landing-page-react
        run: pnpm typecheck

      - name: Unit test
        working-directory: landing-page-react
        run: pnpm test:unit

      - name: Build
        working-directory: landing-page-react
        run: pnpm build
        env:
          VITE_BASE_PATH: /ETBSaveManager-Project/

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: landing-page-react/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 9.1 关键决策

1. **触发**：`push` 到 `main` 且 `landing-page-react/**` 变更；保留 `workflow_dispatch` 手动触发。
2. **Runner**：Pages 部署用 `ubuntu-latest`（轻、快）；Tauri release 仍用 `windows-latest`（构建 Windows 安装包必需），互不影响。
3. **环境变量 `VITE_BASE_PATH`**：在 `vite.config.ts` 中通过 `import.meta.env.VITE_BASE_PATH` 读取并写入 `base` 选项，便于本地（`/`）与生产（`/ETBSaveManager-Project/`）切换。
4. **质量门禁**：lint → typecheck → test → build，任意失败则终止部署。
5. **官方部署方案**：`actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`。
6. **Environment**：使用内置 `github-pages` environment，部署链接可在 Actions 页面直接预览。

### 9.2 仓库侧一次性配置

- Settings → Pages → Source 选择 "GitHub Actions"（首次需要切换）
- 如遇 organization 限制，需要 admin 在 Settings → Actions → General 启用 "Read and write permissions"

## 10. 测试与质量保障

| 层级 | 工具 | 覆盖 |
|------|------|------|
| 单元 | Vitest + @testing-library/react | 关键组件渲染、主题切换、site-content 数据完整性 |
| 类型 | `tsc --noEmit` | 整库类型正确性 |
| Lint | ESLint flat config | 代码风格 + React Hooks + React Refresh |
| 格式 | Prettier | 与主项目对齐：双引号、120 print width、LF、2 空格、trailing comma |
| 构建 | Vite build | 验证可发布 |
| 端到端 | 暂不引入 Playwright | 落地页范围足够 |

### 10.1 package.json scripts

```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "lint": "eslint src tests --ext .ts,.tsx",
  "lint:fix": "eslint src tests --ext .ts,.tsx --fix",
  "format": "prettier --check src tests",
  "format:fix": "prettier --write src tests",
  "test:unit": "vitest run",
  "test:watch": "vitest"
}
```

### 10.2 CI 门禁顺序

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test:unit`
5. `pnpm build`

### 10.3 质量基线

- Prettier：120 print width、LF、双引号、trailing comma、2 空格缩进
- ESLint：React Hooks 规则、React Refresh 规则、`no-console: warn`（允许 warn/error）、`eqeqeq`、`no-var: error`
- `tsconfig.json` 开启 `strict: true`
- 独立 `.gitignore` 排除 `dist/`、`node_modules/`、`.vite-cache/`、`coverage/`

## 11. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| GitHub Pages 子路径 base 错误 | 资源 404 | 通过 `VITE_BASE_PATH` 注入并写测试断言 |
| 用户组织策略限制 Actions 写 Pages | 部署失败 | README 文档化"Read and write permissions"启用步骤 |
| React 19 与某些库兼容性 | 构建失败 | 优先选用声明支持 React 19 的库；锁版本保守 |
| 内联 SVG 增多后组件体积膨胀 | 影响 LCP | 限制每图 < 1KB；必要时 SVG 抽离到独立文件 + Vite 内联 |

## 12. 完成定义（Definition of Done）

- [ ] `landing-page-react/` 目录所有文件按 Section 3 创建完成
- [ ] `pnpm lint`、`pnpm typecheck`、`pnpm test:unit`、`pnpm build` 全部通过
- [ ] 本地 `pnpm dev` 可访问，6 个 section 渲染正确，主题切换工作
- [ ] 推送到 `main` 后 GitHub Actions 成功部署到 Pages
- [ ] 部署后页面在 `https://<owner>.github.io/ETBSaveManager-Project/` 可访问
- [ ] 仓库 README 增补落地页访问链接（可选）

## 13. 不在范围内（Non-Goals）

- i18n 多语言实现（仅留扩展点）
- 服务端渲染 / Next.js
- PWA / Service Worker
- 评论系统 / 用户分析
- 暗色模式以外的额外主题（彩色主题）
- 替换主项目 Tauri 应用
- 修改主项目 Vue 3 + Vite 配置
