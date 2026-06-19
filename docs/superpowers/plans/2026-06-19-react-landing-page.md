# React Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `ETBSaveManager-Project` 仓库新增独立 React 落地页 `landing-page-react/`，并通过 GitHub Actions 自动部署到 GitHub Pages。

**Architecture:** 独立子项目（自有 `package.json`/`vite.config.ts`/`tsconfig.json`），与主项目 Vue + Tauri 完全隔离。Vite 构建纯静态 SPA，Tailwind CSS 4 处理样式，所有视觉元素用内联 SVG + CSS 渐变（不使用任何图片）。通过 `actions/deploy-pages@v4` 官方方案部署。

**Tech Stack:** Vite 6、React 19、TypeScript 5.8、Tailwind CSS 4、Vitest 4、@testing-library/react 16、ESLint 9、Prettier 3、pnpm 9、Node 20。

**Spec Reference:** [2026-06-19-landing-page-design.md](../specs/2026-06-19-landing-page-design.md)

---

## File Structure

所有路径相对仓库根 `d:\Eververdants\Projects\Code\ETBSaveManager-Project\`。

### 新建文件

```
landing-page-react/
├── public/
│   ├── favicon.svg                       # 单文件 SVG monogram
│   └── robots.txt                        # 允许所有抓取
├── src/
│   ├── components/
│   │   ├── nav-bar.tsx                   # 顶部导航栏
│   │   ├── hero-section.tsx              # 首屏
│   │   ├── features-section.tsx          # 功能特性 6 卡
│   │   ├── screens-section.tsx           # 抽象界面 3 卡
│   │   ├── download-section.tsx          # 三个平台下载按钮
│   │   ├── footer-section.tsx            # 页脚
│   │   └── theme-toggle.tsx              # light/dark 切换
│   ├── hooks/
│   │   └── use-theme-mode.ts             # 主题模式管理
│   ├── content/
│   │   └── site-content.ts               # 文案与链接集中
│   ├── styles/
│   │   └── global.css                    # Tailwind 入口 + tokens
│   ├── app.tsx                           # 根组件
│   ├── main.tsx                          # 入口
│   └── env.d.ts                          # Vite env 类型
├── tests/
│   ├── setup.ts                          # jest-dom matchers
│   ├── components/
│   │   ├── nav-bar.test.tsx
│   │   ├── hero-section.test.tsx
│   │   ├── features-section.test.tsx
│   │   ├── screens-section.test.tsx
│   │   ├── download-section.test.tsx
│   │   ├── footer-section.test.tsx
│   │   └── theme-toggle.test.tsx
│   ├── hooks/
│   │   └── use-theme-mode.test.ts
│   └── content/
│       └── site-content.test.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── prettier.config.js
├── .gitignore
├── .npmrc                                # 强制 LF 行尾
└── README.md
.github/workflows/
└── pages.yml                             # GitHub Pages 部署
```

### 修改文件

无（独立子项目，零侵入主仓库）。

---

## 任务索引

| # | 任务 | 预计产物 |
|---|------|----------|
| 1 | 初始化 `landing-page-react/` 子项目骨架 | `package.json`、`.gitignore`、`.npmrc` |
| 2 | 配置 TypeScript | `tsconfig.json`、`tsconfig.node.json`、`env.d.ts` |
| 3 | 配置 Vite（含 `VITE_BASE_PATH` 注入） | `vite.config.ts` |
| 4 | 配置 Tailwind CSS 4 | `src/styles/global.css` |
| 5 | 配置 ESLint + Prettier | `eslint.config.js`、`prettier.config.js` |
| 6 | Vitest + jest-dom 测试基座 | `tests/setup.ts` |
| 7 | `index.html` + `main.tsx` + `app.tsx` 最小可渲染骨架 | `index.html`、`src/main.tsx`、`src/app.tsx` |
| 8 | `site-content.ts` 文案集中 + 数据完整性测试 | `src/content/site-content.ts`、`tests/content/site-content.test.ts` |
| 9 | `use-theme-mode` 钩子（TDD） | `src/hooks/use-theme-mode.ts`、`tests/hooks/use-theme-mode.test.ts` |
| 10 | `theme-toggle.tsx` 组件（TDD） | `src/components/theme-toggle.tsx`、`tests/components/theme-toggle.test.tsx` |
| 11 | `nav-bar.tsx` | `src/components/nav-bar.tsx`、`tests/components/nav-bar.test.tsx` |
| 12 | `hero-section.tsx` | `src/components/hero-section.tsx`、`tests/components/hero-section.test.tsx` |
| 13 | `features-section.tsx` | `src/components/features-section.tsx`、`tests/components/features-section.test.tsx` |
| 14 | `screens-section.tsx` | `src/components/screens-section.tsx`、`tests/components/screens-section.test.tsx` |
| 15 | `download-section.tsx` | `src/components/download-section.tsx`、`tests/components/download-section.test.tsx` |
| 16 | `footer-section.tsx` | `src/components/footer-section.tsx`、`tests/components/footer-section.test.tsx` |
| 17 | `app.tsx` 完整装配 | `src/app.tsx` |
| 18 | `public/favicon.svg` + `public/robots.txt` | 公共资源 |
| 19 | `.github/workflows/pages.yml` | 部署 workflow |
| 20 | 全链路 CI 验证（lint/typecheck/test/build） | 全部通过 |
| 21 | README + DoD 验收 | 文档与提交 |

---

## Task 1: 初始化 `landing-page-react/` 子项目骨架

**Files:**
- Create: `landing-page-react/package.json`
- Create: `landing-page-react/.gitignore`
- Create: `landing-page-react/.npmrc`

- [ ] **Step 1: 创建 `landing-page-react/.npmrc`**

```ini
# 强制 LF 行尾，与主项目风格一致
end-of-line=lf
auto-install-peers=true
```

- [ ] **Step 2: 创建 `landing-page-react/.gitignore`**

```gitignore
# 依赖
node_modules/
.pnpm-store/

# 构建产物
dist/
.vite/

# 测试与覆盖率
coverage/
*.lcov

# 日志
*.log
npm-debug.log*
pnpm-debug.log*

# 编辑器
.idea/
.vscode/
!.vscode/settings.json
!.vscode/extensions.json
.DS_Store
Thumbs.db

# 环境变量
.env
.env.local
.env.*.local
```

- [ ] **Step 3: 创建 `landing-page-react/package.json`**

```json
{
  "name": "etbsavemanager-landing",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "description": "Landing page for ETB Save Manager (React + Vite, deployed to GitHub Pages)",
  "scripts": {
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
}
```

- [ ] **Step 4: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/.npmrc landing-page-react/.gitignore landing-page-react/package.json
git commit -m "feat(landing-page-react): 初始化子项目骨架（package.json + .gitignore + .npmrc）"
```

---

## Task 2: 配置 TypeScript

**Files:**
- Create: `landing-page-react/tsconfig.json`
- Create: `landing-page-react/tsconfig.node.json`
- Create: `landing-page-react/src/env.d.ts`

- [ ] **Step 1: 创建 `landing-page-react/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 2: 创建 `landing-page-react/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vite/client", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests", "env.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 `landing-page-react/src/env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 4: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/tsconfig.json landing-page-react/tsconfig.node.json landing-page-react/src/env.d.ts
git commit -m "feat(landing-page-react): 配置 TypeScript（严格模式 + 路径别名）"
```

---

## Task 3: 配置 Vite（含 `VITE_BASE_PATH` 注入）

**Files:**
- Create: `landing-page-react/vite.config.ts`

- [ ] **Step 1: 创建 `landing-page-react/vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const basePath = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: basePath,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "esnext",
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    css: false,
  },
});
```

- [ ] **Step 2: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/vite.config.ts
git commit -m "feat(landing-page-react): 配置 Vite（含 VITE_BASE_PATH 与 Vitest 配置）"
```

---

## Task 4: 配置 Tailwind CSS 4

**Files:**
- Create: `landing-page-react/src/styles/global.css`

- [ ] **Step 1: 创建 `landing-page-react/src/styles/global.css`**

```css
@import "tailwindcss";

/* 启用 dark 模式：通过 <html class="dark"> 触发 */
@custom-variant dark (&:where(.dark, .dark *));

/* 设计 tokens */
@theme {
  --color-brand-50: oklch(0.97 0.02 250);
  --color-brand-100: oklch(0.93 0.04 250);
  --color-brand-500: oklch(0.6 0.18 250);
  --color-brand-600: oklch(0.52 0.2 250);
  --color-brand-700: oklch(0.44 0.18 250);
  --font-sans:
    ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC",
    sans-serif;
  --font-mono:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}

/* 全局基线 */
html,
body,
#root {
  height: 100%;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-slate-50);
  color: var(--color-slate-900);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html.dark body {
  background-color: var(--color-slate-950);
  color: var(--color-slate-100);
}

/* 焦点可见性 */
:where(a, button, [role="button"]):focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
  border-radius: 4px;
}
```

- [ ] **Step 2: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/styles/global.css
git commit -m "feat(landing-page-react): 配置 Tailwind CSS 4（含 dark 模式与设计 tokens）"
```

---

## Task 5: 配置 ESLint + Prettier

**Files:**
- Create: `landing-page-react/eslint.config.js`
- Create: `landing-page-react/prettier.config.js`

- [ ] **Step 1: 创建 `landing-page-react/eslint.config.js`**

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      eqeqeq: ["error", "always"],
      "no-var": "error",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
);
```

- [ ] **Step 2: 创建 `landing-page-react/prettier.config.js`**

```js
/** @type {import("prettier").Config} */
export default {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
};
```

- [ ] **Step 3: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/eslint.config.js landing-page-react/prettier.config.js
git commit -m "feat(landing-page-react): 配置 ESLint flat config + Prettier（与主项目对齐）"
```

---

## Task 6: Vitest + jest-dom 测试基座

**Files:**
- Create: `landing-page-react/tests/setup.ts`

- [ ] **Step 1: 创建 `landing-page-react/tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  // 清理 useThemeMode 在 localStorage 与 <html> 上留下的副作用
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});
```

- [ ] **Step 2: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/tests/setup.ts
git commit -m "test(landing-page-react): 配置 Vitest + jest-dom 测试基座"
```

---

## Task 7: `index.html` + `main.tsx` + `app.tsx` 最小可渲染骨架

**Files:**
- Create: `landing-page-react/index.html`
- Create: `landing-page-react/src/main.tsx`
- Create: `landing-page-react/src/app.tsx`

- [ ] **Step 1: 创建 `landing-page-react/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="A modern save management tool for Escape The Backrooms — full CRUD, 13 themes, i18n, and virtual scrolling."
    />
    <title>E.T.B. Save Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: 创建 `landing-page-react/src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import "@/styles/global.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: 创建最小可渲染的 `landing-page-react/src/app.tsx`（骨架，后续 Task 17 替换为完整装配）**

```tsx
export function App(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-semibold">E.T.B. Save Manager — landing skeleton</h1>
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/index.html landing-page-react/src/main.tsx landing-page-react/src/app.tsx
git commit -m "feat(landing-page-react): 搭建最小可渲染骨架（index.html + main.tsx + app.tsx）"
```

---

## Task 8: `site-content.ts` 文案集中 + 数据完整性测试（TDD）

**Files:**
- Create: `landing-page-react/tests/content/site-content.test.ts`
- Create: `landing-page-react/src/content/site-content.ts`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/content/site-content.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { site } from "@/content/site-content";

describe("site-content", () => {
  it("exposes non-empty name and tagline", () => {
    expect(site.name.length).toBeGreaterThan(0);
    expect(site.tagline.length).toBeGreaterThan(0);
    expect(site.description.length).toBeGreaterThan(0);
  });

  it("lists 6 features, each with id/title/description/iconKey", () => {
    expect(site.features).toHaveLength(6);
    site.features.forEach((feature) => {
      expect(feature.id.length).toBeGreaterThan(0);
      expect(feature.title.length).toBeGreaterThan(0);
      expect(feature.description.length).toBeGreaterThan(0);
      expect(feature.iconKey.length).toBeGreaterThan(0);
    });
  });

  it("lists 3 Windows download entries pointing at the GitHub releases latest", () => {
    expect(site.downloads).toHaveLength(3);
    site.downloads.forEach((download) => {
      expect(download.id.length).toBeGreaterThan(0);
      expect(download.label.length).toBeGreaterThan(0);
      expect(download.href).toBe(site.releasesUrl);
    });
  });

  it("uses HTTPS URLs for github/releases", () => {
    expect(site.githubUrl.startsWith("https://")).toBe(true);
    expect(site.releasesUrl.startsWith("https://")).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- site-content
```

Expected: FAIL（`@/content/site-content` 解析失败 / 文件不存在）

- [ ] **Step 3: 实现 `landing-page-react/src/content/site-content.ts`**

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- site-content
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/content/site-content.ts landing-page-react/tests/content/site-content.test.ts
git commit -m "feat(landing-page-react): 集中文案 site-content + 数据完整性测试"
```

---

## Task 9: `use-theme-mode` 钩子（TDD）

**Files:**
- Create: `landing-page-react/tests/hooks/use-theme-mode.test.ts`
- Create: `landing-page-react/src/hooks/use-theme-mode.ts`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/hooks/use-theme-mode.test.ts`**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useThemeMode } from "@/hooks/use-theme-mode";

const STORAGE_KEY = "etb-theme-pref";

describe("useThemeMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to system when no preference stored", () => {
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.preference).toBe("system");
    expect(result.current.isDark).toBe(false);
  });

  it("reflects dark system preference when preference is system", () => {
    window.matchMedia = (query: string) =>
      ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;

    const { result } = renderHook(() => useThemeMode());
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setPreference('dark') toggles dark class and persists", () => {
    const { result } = renderHook(() => useThemeMode());

    act(() => {
      result.current.setPreference("dark");
    });

    expect(result.current.preference).toBe("dark");
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("setPreference('light') removes dark class and persists", () => {
    const { result } = renderHook(() => useThemeMode());

    act(() => {
      result.current.setPreference("light");
    });

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("reads an existing stored preference on init", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.preference).toBe("dark");
    expect(result.current.isDark).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- use-theme-mode
```

Expected: FAIL（`@/hooks/use-theme-mode` 解析失败）

- [ ] **Step 3: 实现 `landing-page-react/src/hooks/use-theme-mode.ts`**

```ts
import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "etb-theme-pref";

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDarkClass(isDark: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

export interface UseThemeModeResult {
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (next: ThemePreference) => void;
}

export function useThemeMode(): UseThemeModeResult {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const isDark = preference === "dark" || (preference === "system" && systemDark);

  useEffect(() => {
    applyDarkClass(isDark);
  }, [isDark]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return { preference, isDark, setPreference };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- use-theme-mode
```

Expected: PASS（5 tests）

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/hooks/use-theme-mode.ts landing-page-react/tests/hooks/use-theme-mode.test.ts
git commit -m "feat(landing-page-react): useThemeMode 钩子（TDD：5 个测试覆盖）"
```

---

## Task 10: `theme-toggle.tsx` 组件（TDD）

**Files:**
- Create: `landing-page-react/tests/components/theme-toggle.test.tsx`
- Create: `landing-page-react/src/components/theme-toggle.tsx`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/components/theme-toggle.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders a button with an accessible label", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it("toggles the dark class on click and persists preference", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(["dark", "light"]).toContain(window.localStorage.getItem("etb-theme-pref"));

    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- theme-toggle
```

Expected: FAIL

- [ ] **Step 3: 实现 `landing-page-react/src/components/theme-toggle.tsx`**

```tsx
import { useThemeMode } from "@/hooks/use-theme-mode";

export function ThemeToggle(): React.JSX.Element {
  const { isDark, setPreference } = useThemeMode();

  const handleClick = (): void => {
    setPreference(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Toggle theme"
      aria-pressed={isDark}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- theme-toggle
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/components/theme-toggle.tsx landing-page-react/tests/components/theme-toggle.test.tsx
git commit -m "feat(landing-page-react): ThemeToggle 组件（TDD，含内联 SVG 图标）"
```

---

## Task 11: `nav-bar.tsx`

**Files:**
- Create: `landing-page-react/tests/components/nav-bar.test.tsx`
- Create: `landing-page-react/src/components/nav-bar.tsx`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/components/nav-bar.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavBar } from "@/components/nav-bar";
import { site } from "@/content/site-content";

describe("NavBar", () => {
  it("renders the site name as a brand link", () => {
    render(<NavBar />);
    const brand = screen.getByRole("link", { name: site.name });
    expect(brand).toBeInTheDocument();
  });

  it("exposes a GitHub link pointing at the project repository", () => {
    render(<NavBar />);
    const ghLink = screen.getByRole("link", { name: /github/i });
    expect(ghLink).toHaveAttribute("href", site.githubUrl);
  });

  it("renders the theme toggle", () => {
    render(<NavBar />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- nav-bar
```

Expected: FAIL

- [ ] **Step 3: 实现 `landing-page-react/src/components/nav-bar.tsx`**

```tsx
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/content/site-content";

export function NavBar(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a
          href="#top"
          className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          {site.name}
        </a>
        <div className="flex items-center gap-3">
          <a
            href={site.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.73.5.67 5.56.67 11.83c0 5.02 3.25 9.27 7.76 10.77.57.1.78-.25.78-.55v-2.13c-3.16.69-3.83-1.35-3.83-1.35-.52-1.31-1.27-1.66-1.27-1.66-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16.91-.25 1.89-.38 2.86-.39.97 0 1.95.13 2.86.39 2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.18 5.59.41.36.77 1.05.77 2.13v3.16c0 .31.21.66.79.55 4.5-1.5 7.75-5.75 7.75-10.77C23.33 5.56 18.27.5 12 .5z" />
            </svg>
            <span>GitHub</span>
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- nav-bar
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/components/nav-bar.tsx landing-page-react/tests/components/nav-bar.test.tsx
git commit -m "feat(landing-page-react): NavBar 组件（品牌 + GitHub 链接 + 主题切换）"
```

---

## Task 12: `hero-section.tsx`

**Files:**
- Create: `landing-page-react/tests/components/hero-section.test.tsx`
- Create: `landing-page-react/src/components/hero-section.tsx`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/components/hero-section.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/components/hero-section";
import { site } from "@/content/site-content";

describe("HeroSection", () => {
  it("renders the site name in an accessible heading", () => {
    render(<HeroSection />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(site.name);
  });

  it("renders the tagline", () => {
    render(<HeroSection />);
    expect(screen.getByText(site.tagline)).toBeInTheDocument();
  });

  it("exposes a primary Download CTA pointing at releases/latest", () => {
    render(<HeroSection />);
    const cta = screen.getByRole("link", { name: /download for windows/i });
    expect(cta).toHaveAttribute("href", site.releasesUrl);
  });

  it("exposes a secondary GitHub CTA", () => {
    render(<HeroSection />);
    const cta = screen.getByRole("link", { name: /view on github/i });
    expect(cta).toHaveAttribute("href", site.githubUrl);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- hero-section
```

Expected: FAIL

- [ ] **Step 3: 实现 `landing-page-react/src/components/hero-section.tsx`**

```tsx
import { site } from "@/content/site-content";

export function HeroSection(): React.JSX.Element {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4 py-24 dark:from-slate-950 dark:via-slate-900 dark:to-brand-700/30 sm:py-32"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-brand-600 dark:text-brand-100">
          For Windows · Tauri 2.0
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl">
          {site.name}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          {site.tagline}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={site.releasesUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Download for Windows
          </a>
          <a
            href={site.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- hero-section
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/components/hero-section.tsx landing-page-react/tests/components/hero-section.test.tsx
git commit -m "feat(landing-page-react): HeroSection 组件（双 CTA + 渐变背景）"
```

---

## Task 13: `features-section.tsx`

**Files:**
- Create: `landing-page-react/tests/components/features-section.test.tsx`
- Create: `landing-page-react/src/components/features-section.tsx`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/components/features-section.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturesSection } from "@/components/features-section";
import { site } from "@/content/site-content";

describe("FeaturesSection", () => {
  it("renders a Features heading", () => {
    render(<FeaturesSection />);
    expect(screen.getByRole("heading", { name: /features/i })).toBeInTheDocument();
  });

  it("renders one card per feature defined in site-content", () => {
    render(<FeaturesSection />);
    site.features.forEach((feature) => {
      expect(screen.getByText(feature.title)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- features-section
```

Expected: FAIL

- [ ] **Step 3: 实现 `landing-page-react/src/components/features-section.tsx`**

```tsx
import { site } from "@/content/site-content";

export function FeaturesSection(): React.JSX.Element {
  return (
    <section id="features" className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Features
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600 dark:text-slate-400">
          Everything you need to keep your Escape The Backrooms saves organized, fast, and portable.
        </p>
        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {site.features.map((feature) => (
            <li
              key={feature.id}
              className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-100">
                <FeatureIcon iconKey={feature.iconKey} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeatureIcon({ iconKey }: { iconKey: string }): React.JSX.Element {
  // 6 个内联单色 SVG，< 1KB/个。统一 24x24 viewBox，currentColor 跟随父级。
  const common = {
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (iconKey) {
    case "icon-crud":
      return (
        <svg {...common}>
          <path d="M3 7h18M3 12h18M3 17h12" />
        </svg>
      );
    case "icon-themes":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
        </svg>
      );
    case "icon-virtual":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 10h18M7 14h6" />
        </svg>
      );
    case "icon-i18n":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "icon-tutorial":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
        </svg>
      );
    case "icon-performance":
      return (
        <svg {...common}>
          <path d="M3 17l5-5 4 4 8-8" />
          <path d="M14 8h6v6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- features-section
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/components/features-section.tsx landing-page-react/tests/components/features-section.test.tsx
git commit -m "feat(landing-page-react): FeaturesSection 组件（6 卡 + 内联单色 SVG 图标）"
```

---

## Task 14: `screens-section.tsx`

**Files:**
- Create: `landing-page-react/tests/components/screens-section.test.tsx`
- Create: `landing-page-react/src/components/screens-section.tsx`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/components/screens-section.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScreensSection } from "@/components/screens-section";

describe("ScreensSection", () => {
  it("renders a Screens heading", () => {
    render(<ScreensSection />);
    expect(screen.getByRole("heading", { name: /screens/i })).toBeInTheDocument();
  });

  it("renders exactly 3 abstract UI cards", () => {
    render(<ScreensSection />);
    const cards = screen.getAllByTestId("screen-card");
    expect(cards).toHaveLength(3);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- screens-section
```

Expected: FAIL

- [ ] **Step 3: 实现 `landing-page-react/src/components/screens-section.tsx`**

```tsx
type ScreenMock = {
  id: string;
  title: string;
  description: string;
};

const screens: readonly ScreenMock[] = [
  { id: "archive-list", title: "Archive List", description: "Browse, search, and sort every save." },
  { id: "create-archive", title: "Create Archive", description: "Three-step wizard for new saves." },
  { id: "edit-archive", title: "Edit Archive", description: "Tweak inventory, sanity, and player data." },
];

export function ScreensSection(): React.JSX.Element {
  return (
    <section id="screens" className="bg-slate-50 px-4 py-20 dark:bg-slate-900/50">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          See it in action
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600 dark:text-slate-400">
          A snapshot of the three main views — all abstract, no real assets, every pixel a CSS primitive.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {screens.map((screen) => (
            <article
              key={screen.id}
              data-testid="screen-card"
              aria-label={screen.title}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <ScreenMock id={screen.id} />
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                {screen.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{screen.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenMock({ id }: { id: string }): React.JSX.Element {
  // 窗口框：标题栏 + 内容区占位条
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{id}</span>
      </div>
      <div className="space-y-2 p-3">
        {id === "archive-list" && <ListMock />}
        {id === "create-archive" && <WizardMock />}
        {id === "edit-archive" && <EditorMock />}
      </div>
    </div>
  );
}

function ListMock(): React.JSX.Element {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 flex-1 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-12 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </>
  );
}

function WizardMock(): React.JSX.Element {
  return (
    <>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 flex-1 rounded bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-16 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-6 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
    </>
  );
}

function EditorMock(): React.JSX.Element {
  return (
    <>
      <div className="flex gap-1.5">
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- screens-section
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/components/screens-section.tsx landing-page-react/tests/components/screens-section.test.tsx
git commit -m "feat(landing-page-react): ScreensSection 组件（3 个抽象界面卡，CSS 模拟）"
```

---

## Task 15: `download-section.tsx`

**Files:**
- Create: `landing-page-react/tests/components/download-section.test.tsx`
- Create: `landing-page-react/src/components/download-section.tsx`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/components/download-section.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DownloadSection } from "@/components/download-section";
import { site } from "@/content/site-content";

describe("DownloadSection", () => {
  it("renders a Download heading", () => {
    render(<DownloadSection />);
    expect(screen.getByRole("heading", { name: /download/i })).toBeInTheDocument();
  });

  it("renders one button per download entry pointing at releases/latest", () => {
    render(<DownloadSection />);
    const links = screen.getAllByRole("link");
    const downloadLinks = links.filter((link) =>
      site.downloads.some((d) => d.label === link.textContent?.trim()),
    );
    expect(downloadLinks).toHaveLength(site.downloads.length);
    downloadLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", site.releasesUrl);
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- download-section
```

Expected: FAIL

- [ ] **Step 3: 实现 `landing-page-react/src/components/download-section.tsx`**

```tsx
import { site } from "@/content/site-content";

export function DownloadSection(): React.JSX.Element {
  return (
    <section id="download" className="px-4 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Download
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
          Choose your platform — the latest release is fetched directly from GitHub Releases.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {site.downloads.map((download) => (
            <a
              key={download.id}
              href={download.href}
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500 dark:hover:bg-slate-800"
            >
              <WindowsMark />
              <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 dark:text-slate-50 dark:group-hover:text-brand-100">
                {download.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function WindowsMark(): React.JSX.Element {
  // 内联单色 Windows 风格 mark（4 块旗形），与图标库无关
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="currentColor"
      className="text-slate-500 group-hover:text-brand-600 dark:text-slate-400 dark:group-hover:text-brand-100"
      aria-hidden="true"
    >
      <path d="M3 5.5 11 4v8H3zM12 4l9-1.5V12h-9zM3 13h8v7L3 18.5zM12 13h9v8.5L12 20z" />
    </svg>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- download-section
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/components/download-section.tsx landing-page-react/tests/components/download-section.test.tsx
git commit -m "feat(landing-page-react): DownloadSection 组件（3 个 Windows 平台按钮 + 内联 SVG）"
```

---

## Task 16: `footer-section.tsx`

**Files:**
- Create: `landing-page-react/tests/components/footer-section.test.tsx`
- Create: `landing-page-react/src/components/footer-section.tsx`

- [ ] **Step 1: 先写测试 `landing-page-react/tests/components/footer-section.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterSection } from "@/components/footer-section";
import { site } from "@/content/site-content";

describe("FooterSection", () => {
  it("renders the site name", () => {
    render(<FooterSection />);
    expect(screen.getByText(site.name)).toBeInTheDocument();
  });

  it("exposes a License link pointing at the repository LICENSE file", () => {
    render(<FooterSection />);
    const link = screen.getByRole("link", { name: /license/i });
    expect(link).toHaveAttribute("href", `${site.githubUrl}/blob/main/LICENSE`);
  });

  it("exposes a Releases link", () => {
    render(<FooterSection />);
    const link = screen.getByRole("link", { name: /releases/i });
    expect(link).toHaveAttribute("href", site.releasesUrl);
  });

  it("renders a copyright line with the current year", () => {
    render(<FooterSection />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- footer-section
```

Expected: FAIL

- [ ] **Step 3: 实现 `landing-page-react/src/components/footer-section.tsx`**

```tsx
import { site } from "@/content/site-content";

export function FooterSection(): React.JSX.Element {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {year} {site.name}. Released under MIT.
        </p>
        <ul className="flex items-center gap-4 text-sm">
          <li>
            <a
              href={`${site.githubUrl}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-100"
            >
              License
            </a>
          </li>
          <li>
            <a
              href={site.releasesUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-100"
            >
              Releases
            </a>
          </li>
          <li>
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-100"
            >
              Source
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit -- footer-section
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/components/footer-section.tsx landing-page-react/tests/components/footer-section.test.tsx
git commit -m "feat(landing-page-react): FooterSection 组件（版权 + 链接）"
```

---

## Task 17: `app.tsx` 完整装配

**Files:**
- Modify: `landing-page-react/src/app.tsx`

- [ ] **Step 1: 替换 `landing-page-react/src/app.tsx`**

```tsx
import { NavBar } from "@/components/nav-bar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { ScreensSection } from "@/components/screens-section";
import { DownloadSection } from "@/components/download-section";
import { FooterSection } from "@/components/footer-section";

export function App(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ScreensSection />
        <DownloadSection />
      </main>
      <FooterSection />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/src/app.tsx
git commit -m "feat(landing-page-react): App 完整装配（Nav + 4 Section + Footer）"
```

---

## Task 18: 公共资源（`favicon.svg` + `robots.txt`）

**Files:**
- Create: `landing-page-react/public/favicon.svg`
- Create: `landing-page-react/public/robots.txt`

- [ ] **Step 1: 创建 `landing-page-react/public/favicon.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#3D5AFE"/>
  <text x="16" y="22" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">ETB</text>
</svg>
```

- [ ] **Step 2: 创建 `landing-page-react/public/robots.txt`**

```
User-agent: *
Allow: /
```

- [ ] **Step 3: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/public/favicon.svg landing-page-react/public/robots.txt
git commit -m "feat(landing-page-react): 公共资源（favicon + robots）"
```

---

## Task 19: GitHub Pages 部署 Workflow

**Files:**
- Create: `.github/workflows/pages.yml`

- [ ] **Step 1: 创建 `.github/workflows/pages.yml`**

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

- [ ] **Step 2: 提交**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add .github/workflows/pages.yml
git commit -m "ci: 新增 GitHub Pages 部署 workflow（actions/deploy-pages@v4）"
```

---

## Task 20: 全链路 CI 验证

**Files:**
- Modify（仅首次运行，会生成 `pnpm-lock.yaml`）：`landing-page-react/pnpm-lock.yaml`

- [ ] **Step 1: 安装依赖（首次生成 `pnpm-lock.yaml`）**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm install
```

Expected: 依赖全部安装，生成 `pnpm-lock.yaml`。

- [ ] **Step 2: Lint 检查**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm lint
```

Expected: 无错误（warn 可接受）。

- [ ] **Step 3: 类型检查**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm typecheck
```

Expected: 退出码 0，无 TS 错误。

- [ ] **Step 4: 单元测试**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm test:unit
```

Expected: 全部测试通过。

- [ ] **Step 5: 构建产物**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
pnpm build
```

Expected: 退出码 0，生成 `dist/index.html`、`dist/assets/*`、`dist/js/*`、`dist/css/*`。

- [ ] **Step 6: 验证 base 路径注入正确**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project/landing-page-react
node -e "const fs = require('fs'); const html = fs.readFileSync('dist/index.html', 'utf8'); if (!html.includes('/ETBSaveManager-Project/')) { console.error('base path missing'); process.exit(1); } console.log('base path ok');"
```

Expected: 输出 `base path ok`。

- [ ] **Step 7: 提交 lockfile**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/pnpm-lock.yaml
git commit -m "chore(landing-page-react): 提交首次 pnpm-lock.yaml"
```

---

## Task 21: README + DoD 验收

**Files:**
- Create: `landing-page-react/README.md`

- [ ] **Step 1: 创建 `landing-page-react/README.md`**

```markdown
# ETB Save Manager — Landing Page

独立的 React 19 + Vite 6 落地页，部署在 GitHub Pages。

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 http://localhost:5173/ 。

## 质量门禁

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
```

## 部署

`push` 到 `main` 触发 `.github/workflows/pages.yml`：

1. 安装依赖
2. lint / typecheck / test / build
3. 上传 `landing-page-react/dist/` 为 GitHub Pages 制品
4. 部署到 `https://<owner>.github.io/ETBSaveManager-Project/`

## 一次性仓库配置

- Settings → Pages → Source 选择 "GitHub Actions"
- 组织仓库可能需要 Settings → Actions → General → Workflow permissions: "Read and write permissions"

## 内容约束

- **不使用任何图片**：所有视觉元素为内联 SVG、CSS 渐变与 Tailwind 工具类
- 所有文案集中在 `src/content/site-content.ts`
```

- [ ] **Step 2: 最终验证（DoD 逐项检查）**

逐项确认 [spec 12. 完成定义](../specs/2026-06-19-landing-page-design.md#12-完成定义-definition-of-done)：

- [ ] `landing-page-react/` 所有文件按计划创建
- [ ] `pnpm lint`、`pnpm typecheck`、`pnpm test:unit`、`pnpm build` 全部通过
- [ ] 本地 `pnpm dev` 可访问，6 个 section 渲染正确，主题切换工作
- [ ] 推送到 `main` 后 GitHub Actions 成功部署到 Pages
- [ ] 部署后页面在 `https://<owner>.github.io/ETBSaveManager-Project/` 可访问

- [ ] **Step 3: 提交 README**

```bash
cd d:/Eververdants/Projects/Code/ETBSaveManager-Project
git add landing-page-react/README.md
git commit -m "docs(landing-page-react): 子项目 README（开发 + 部署说明）"
```

---

## 自检

- [x] **Spec 覆盖**：spec 的 13 个章节均已映射到具体任务（1-21）
- [x] **占位符扫描**：未使用 TBD / TODO / "implement later"；所有代码块完整
- [x] **类型一致**：`site.releasesUrl` / `site.githubUrl` / `site.features` / `site.downloads` 在 6 个组件中引用一致
- [x] **完成定义**：Task 20 验证构建产物、Task 21 验证 DoD
