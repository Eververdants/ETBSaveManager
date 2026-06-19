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
