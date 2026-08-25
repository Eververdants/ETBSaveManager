# Development Rules

## Quick Reference

1. **先搜索，再创建** — 确认无同款才新增
2. **同一能力只有一个权威实现** — 禁止重复
3. **页面只负责 UI 编排** — 业务逻辑下沉到 service/store
4. **不提前抽象** — 没有第二个真实需求就不造框架
5. **修改公共组件先查全局影响**

## Code Size Thresholds

| 类型 | 阈值 |
|------|------|
| React Component | > 300 行触发审核 |
| Composable / Hook | > 200 行触发审核 |
| Service | > 300 行触发审核 |
| Function | > 80 行触发审核 |
| 单文件 | > 500 行触发审核 |

## Checklist (per PR)

- [ ] 无重复功能
- [ ] 无模块边界违规
- [ ] 页面不含业务逻辑
- [ ] 复用 Design System
- [ ] 无 `any` 类型
- [ ] 无死代码
- [ ] 无不必要依赖
