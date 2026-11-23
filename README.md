# 🚗 Japan Self-Drive Trip Planning Hub (`kenandxx/trip-planning`)

个人日本自驾攻略、新手防选错一键 Google Maps 导航页与微信分享长图归档仓库（单仓库多行程管理，共用同一套 GitHub Pages）。

- **旅行总览目录（Trip Hub）**：https://kenandxx.github.io/trip-planning/trips/
- **跨 AI 通用规划规范（SKILL.md）**：
  - 仓库浏览：[skills/japan-self-drive-trip-planner/SKILL.md](skills/japan-self-drive-trip-planner/SKILL.md)
  - 直链 Raw（可直接喂给 ChatGPT / Claude / Gemini）：
    `https://raw.githubusercontent.com/kenandxx/trip-planning/main/skills/japan-self-drive-trip-planner/SKILL.md`

---

## 🗺️ 行程列表

| 状态 | 行程 | 目录 | 在线网址（GitHub Pages） |
|---|---|---|---|
| ✅ 已上线 | **2026-11-23 东京 → 伊豆Skyline → 修善寺＆弘法の湯** | `/`（根目录保留兼容微信旧链） | https://kenandxx.github.io/trip-planning/ |
| ✅ 已上线 | **2026-11-24 伊豆 Day 2：抢晴碧テラス → 沼津深海 → 函南避雨** | `trips/2026-11-24-izu-day2/` | https://kenandxx.github.io/trip-planning/trips/2026-11-24-izu-day2/ |
| 📝 占位 | **2027-01 冬季滑雪温泉自驾（白马 / 越后汤泽 / 苗场）** | `trips/2027-01-snow-trip/` | https://kenandxx.github.io/trip-planning/trips/2027-01-snow-trip/ |
| 📝 占位 | **2027-03 富士五湖・河口湖绝景周末自驾** | `trips/2027-03-fuji-lakes/` | https://kenandxx.github.io/trip-planning/trips/2027-03-fuji-lakes/ |
| 📝 占位 | **2027-05 轻井泽・草津高原温泉自驾** | `trips/2027-05-karuizawa-kusatsu/` | https://kenandxx.github.io/trip-planning/trips/2027-05-karuizawa-kusatsu/ |
| 🧩 模板 | **通用空白新行程脚手架（复制即用）** | `trips/template/` | https://kenandxx.github.io/trip-planning/trips/template/ |

---

## 📂 目录结构说明

```text
trip-planning/
├── index.html                                    # 2026-11-23 伊豆攻略（已发微信群，保持根目录不失效）
├── img/                                          # 2026-11-23 伊豆本地实拍图
├── og-cover.png                                  # 2026-11-23 微信分享封面
├── izu_1123_wechat_poster_0900.png               # 2026-11-23 微信一图流高清长图（09:00接人版）
├── skills/japan-self-drive-trip-planner/SKILL.md # 跨 AI 通用规范（供复制 / Raw 链接调用）
├── .agents/skills/japan-self-drive-trip-planner/ # 同款规范（本地 Agent 工具自动识别）
└── trips/
    ├── index.html                                # 旅行总览目录页（Trip Hub）
    ├── 2026-11-24-izu-day2/                      # 2026-11-24 伊豆 Day 2 全天候攻略＆高清长图
    ├── template/                                 # 空白新行程模板（brief.md + index.html + img/）
    ├── 2027-01-snow-trip/                        # 冬季滑雪占位模板
    ├── 2027-03-fuji-lakes/                       # 富士五湖占位模板
    └── 2027-05-karuizawa-kusatsu/                # 轻井泽・草津占位模板
```

---

## 🤖 如何在不同 AI 工具中调用这套规格？

### 1. Antigravity（当前平台）
已永久保存为账号级 Skill `japan-self-drive-trip-planner`。新开对话直接发：
```text
/goal 按照 japan-self-drive-trip-planner 规格，填写并生成 trips/2027-01-snow-trip/ 的完整攻略页与长图并部署：
- 日期：...
- 出发/接人：...
- 目的地＆住宿：...
- 人数＆行李：...
- 偏好：...
```

### 2. ChatGPT / Claude / Gemini 网页版
把下方 Raw 链接（或直接复制 [SKILL.md](skills/japan-self-drive-trip-planner/SKILL.md) 内容）连同 `brief.md` 一起发给任意 AI：
```text
请严格阅读并遵循这份日本自驾规划规范：
https://raw.githubusercontent.com/kenandxx/trip-planning/main/skills/japan-self-drive-trip-planner/SKILL.md

然后帮我规划下面这个行程：
（粘贴 trips/<行程目录>/brief.md 的内容）
```

### 3. 本地 Agent / IDE（Claude Code / Cursor / Codex）
本仓库已内置 `.agents/skills/japan-self-drive-trip-planner/SKILL.md`。克隆仓库后，在终端或编辑器里直接说「按 `japan-self-drive-trip-planner` 规划 `trips/<目录>/brief.md`」即可；如需全局生效，可复制一份到 `~/.claude/skills/` 或 `~/.codex/skills/`。

---

## ➕ 新建一次旅行的 3 步流程
1. 复制模板目录：`cp -r trips/template trips/YYYY-MM-你的行程名`（或直接启用现有的 3 个占位目录）。
2. 编辑里面的 `brief.md`，填好日期、接人酒店、目的地与人数偏好。
3. 交给 AI 生成完整 `index.html`、`img/`、`og-cover.png`、版本化 `poster_*.png`，并更新 `trips/index.html` 后推送到 `main`，GitHub Pages 即刻上线。