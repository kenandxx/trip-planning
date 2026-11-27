# 🤖 AI Agent Context Protocol (`trip-planning`)

本项目已作为子仓库（Spoke）接入个人唯一私密 Obsidian 生活与习惯中枢 **`kenandxx/ob-life-hub`**。

1. **任务启动必读**：
   - 优先读取 [`.context/PERSONAL_CONTEXT.md`](.context/PERSONAL_CONTEXT.md)（由 `ob-life-hub` 自动脱敏编译推送，包含最新的晚间 22:00 回滝不動死线、`1.20×` 真实节奏缓冲、UI 3 步分区卡片审美与近期 `#sync/travel` 实时动态）。
   - 同时参考 [`notes/places/`](notes/places/) 下的实测宝藏店卡片与 [`notes/driver-memory.md`](notes/driver-memory.md)。
   - 若环境已连接 GitHub，可随时运行 `./scripts/sync-life-context.sh pull` 拉取秒级最新动态。
2. **跨项目经验反向回流**：
   - 当在某次行程复盘或前端改版中沉淀出可复用的新习惯、避坑经验或交互偏好时，运行：
     `./scripts/sync-life-context.sh push-insight "新总结的经验" "travel,ui"`
     即可反向写回私密 OB 笔记本并自动广播给名下其他所有 Git 项目。
