# 🤖 AI Agent Context Protocol (`trip-planning`)

本项目已作为子仓库（Spoke）接入个人唯一私密 Obsidian 生活与习惯中枢 **`kenandxx/ob-life-hub`**（v2.0 `#secret` 极简模式 · 公开安全隔离版）。

1. **任务启动必读（Turn 1 强制）**：
   - 先读取仓库内的 [`.context/PERSONAL_CONTEXT.md`](.context/PERSONAL_CONTEXT.md)（公开安全级准则：晚间 22:00 回滝不動死线、`1.20×` 真实节奏缓冲、UI 3 步分区卡片审美）与 [`notes/driver-memory.md`](notes/driver-memory.md)、[`notes/places/`](notes/places/)。
   - 若环境已连接 GitHub，请在内存中隔空读取全量非 `#secret` 笔记与跨界灵感池（**严禁将私人笔记原文粘贴进本公开仓库**）：
     `gh api repos/kenandxx/ob-life-hub/contents/dist/MASTER_CONTEXT.md -H "Accept: application/vnd.github.raw"`
2. **全项目共同维护未来新项目灵感池（`05-Projects/IDEA_BACKLOG.md`）**：
   - 开发本项目过程中若冒出**适合孵化为未来新项目或给其他仓库复用的新点子**，主动运行：
     `./scripts/sync-life-context.sh push-idea "新项目或跨界点子描述"`
   - 若沉淀出可复用的新习惯或交互经验，运行：
     `./scripts/sync-life-context.sh push-insight "新总结的经验" "#it"`
