# Contributing Guide / 贡献指南

Thank you for your interest in ETB Save Manager. This guide explains how to report issues and contribute code.  
感谢你对 ETB Save Manager 的关注。本指南用于说明问题反馈与代码贡献方式。

---

## What You Can Do / 你可以做什么

- Report bugs / 报告 Bug  
- Propose features / 提出功能建议  
- Improve docs or translations / 改进文档或翻译  
- Fix issues or implement features / 修复问题或实现功能  

---

## Issue Reports / 提交问题或建议

Before opening a new issue, search for existing ones.  
提交前请先搜索是否已有相同问题。

Please include:  
请尽量包含以下信息：

- Expected behavior and actual result / 预期行为与实际结果  
- Steps to reproduce / 复现步骤  
- Screenshots or logs if possible / 截图或日志（如有）  
- System info (Windows version, app version) / 系统信息（Windows 版本、应用版本）  

---

## Local Development / 本地开发

**Prerequisites / 环境要求**

- Node.js 18+  
- Rust toolchain  
- pnpm  
- Tauri prerequisites (see official docs) / Tauri 环境依赖（参考官方文档）  

**Run in dev / 开发运行**

```bash
pnpm install
pnpm tauri dev
```

**Build release / 构建发布版**

```bash
pnpm tauri build
```

---

## Code Style & PR Tips / 代码规范与提交建议

- Keep changes focused and small / 改动尽量小且集中  
- Avoid unrelated formatting changes / 避免无关格式化  
- UI changes should include screenshots / UI 改动建议附截图  
- If changing version, run `pnpm sync-version` / 修改版本号请执行 `pnpm sync-version`  

---

## Docs & i18n / 文档与多语言

- For text changes, update all locale files / 文案变更请同步更新各语言文件  
- Docs changes should update all README files / 文档改动请同步更新三份 README  

---

## PR Workflow / 提交 PR 流程

1. Fork the repo and create a branch / Fork 仓库并创建分支  
2. Make changes and test locally / 完成修改并自测  
3. Open a PR with clear description / 提交 PR 并说明改动  
4. Wait for review / 等待维护者反馈  

---

## Privacy & Security / 隐私与安全

Do not include secrets or personal data in issues or PRs.  
请勿在 Issue 或 PR 中提交敏感信息（账号、密钥、个人数据等）。

---

Thanks for your help! / 感谢你的贡献！
