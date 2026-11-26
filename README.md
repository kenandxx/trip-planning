# 🚗 Japan Self-Drive Trip Planning Hub (`kenandxx/trip-planning`)

个人日本自驾攻略、新手防选错一键 Google Maps 导航页与微信分享长图归档仓库（单仓库多行程管理，共用同一套 GitHub Pages）。

- **旅行总览目录（Trip Hub）**：https://kenandxx.github.io/trip-planning/trips/
- **跨 AI 通用规划规范（SKILL.md v2.0・含行中实时护航＆晚点自动重排）**：
  - 仓库浏览：[skills/japan-self-drive-trip-planner/SKILL.md](skills/japan-self-drive-trip-planner/SKILL.md)
  - 直链 Raw（可直接喂给 ChatGPT / Claude / Gemini）：
    `https://raw.githubusercontent.com/kenandxx/trip-planning/main/skills/japan-self-drive-trip-planner/SKILL.md`

---

## 🛰️ v2.0 新特性：行中实时进度护航 ＆ 四通道强提醒 ＆ 晚点自动重排
针对真实自驾痛点（忘关地图「避开收费站」误入山路、低于限速慢行、临时停休/走错路导致严重晚点），全套架构已升级支持：
1. **🧭 此刻导航卡（页首）＝ ⏰ 死线标签 ＋ 实时倒推**：在卡片上设「几点前必须到哪」（可加多个，地点可选计划里的站点或「我现在的位置」；默认是计划自带的末班/红线）。以「当前 GPS 位置（或最后打卡地点）＋现在时间」为起点，向最近的死线倒推，显示「余裕 / 落后 N 分钟」和「最晚几点出发」，并给出实时建议：出发倒计时（15/5/0 分钟时响铃＋震动＋通知）、能赶哪班车、时间多时可加回哪一站、正在远离目的地、GPS 中断等。落后时自动搜索剩余站点的所有组合，给出「稳妥版（余裕≥5 分）」「压哨版」和花钱方案，一键启动。各站可点选「要去／📍在这／✔已去／不去」，GPS 走进任意一站会自动打卡。
1. **发车前 2 项防呆锁扣＋真实车速折算系数（1.0× / 1.2× / 1.35×）**：强制核验 Google Maps「避开收费公路=关闭（蓝线带『有料』标）」与车载 ETC 绿灯，把慢速与休息缓冲提前算入排期。
2. **GPS 自动围栏监测 ＋ 副驾 1 秒打卡**：进站 600m 自动打卡、实时侦测高速段低速偏航风险，GPS 栏用一个状态胶囊显示「🟢 定位中 ／ 🟡 信号弱（误差>100m）／ ⚪ 信号中断（30 秒无新定位）」，点开可看最后更新时间与误差；中断期间的旧定位不再计入晚点判定；也支持随时一键点按「刚到这 / 临时休息+15m / 走错路+15m / 堵车+20m」。
3. **餐厅 `L.O.` 排雷 ＋ 毫秒级 3 套重排方案 ＋ AI 急救台**：一旦晚点 ≥20 分钟（如 11/25 实况 `13:30` 才抵湘南餐厅），离线秒算 **① 稳救黄金死线版 / ② 保核心体验速刷版 / ③ 终极直达兜底版**，并支持一键打包实时 GPS 与死线唤起 AI 深度改道。
4. **手机四通道强提醒**：系统日历 `.ics` 双闹钟（锁屏/CarPlay 100% 弹窗）＋ 网页常亮语音护航（WakeLock + 双音警报 + 中文 TTS）＋ iPhone **Bark** 突破静音强推送（及 `ntfy.sh` 同车广播）＋ 主屏幕 PWA 原生通知与隧道离线缓存。

---

## 🗺️ 行程列表

| 状态 | 行程 | 目录 | 在线网址（GitHub Pages） |
|---|---|---|---|
| ✅ 已上线 | **2026-11-23（Day 1）东京 → 伊豆Skyline → 修善寺＆弘法の湯** | `/`（根目录保留兼容微信旧链） | https://kenandxx.github.io/trip-planning/ |
| ✅ 已上线（主推） | **2026-11-24（Day 2 新版）沼津深海避雨 / 虹之乡＆净莲瀑布（跳过修禅寺＆碧テラス）** | `trips/2026-11-24-izu-day2/` | https://kenandxx.github.io/trip-planning/trips/2026-11-24-izu-day2/ |
| 🛰️ 已实装 v2.0 护航 | **2026-11-25（Day 3・含实时护航＆13:30晚点复盘重排）湘南＋海ほたる → 新鎌ヶ谷直达成田** | `trips/2026-11-25-izu-return/` | https://kenandxx.github.io/trip-planning/trips/2026-11-25-izu-return/ |
| 🧪 v2.0 电车压测 | **2026-11-26（今晚实测・电车＋40分×2防加钟护航）池袋西口2轩连刷 → 22:00前抵滝不動** | `trips/2026-11-26-ikebukuro-night/` | https://kenandxx.github.io/trip-planning/trips/2026-11-26-ikebukuro-night/ |
| 📁 旧版归档 | **2026-11-24（Day 2 备查旧版・含修善寺）** | `trips/2026-11-24-nishi-izu/` | https://kenandxx.github.io/trip-planning/trips/2026-11-24-nishi-izu/ |
| 📝 占位 | **2027-01 冬季滑雪温泉自驾（白马 / 越后汤泽 / 苗场）** | `trips/2027-01-snow-trip/` | https://kenandxx.github.io/trip-planning/trips/2027-01-snow-trip/ |
| 📝 占位 | **2027-03 富士五湖・河口湖绝景周末自驾** | `trips/2027-03-fuji-lakes/` | https://kenandxx.github.io/trip-planning/trips/2027-03-fuji-lakes/ |
| 📝 占位 | **2027-05 轻井泽・草津高原温泉自驾** | `trips/2027-05-karuizawa-kusatsu/` | https://kenandxx.github.io/trip-planning/trips/2027-05-karuizawa-kusatsu/ |
| 🧩 v2.0 模板 | **通用空白新行程脚手架（内置实时护航＆强提醒演示）** | `trips/template/` | https://kenandxx.github.io/trip-planning/trips/template/ |

---

## 📂 目录结构说明

```text
trip-planning/
├── copilot/                                      # 🛰️ v2.0 通用行中实时护航＆强提醒＆自动重排引擎 (CSS + JS + PWA Icons)
├── sw.js                                         # 根作用域 Service Worker（海底隧道离线缓存＋PWA原生系统通知）
├── index.html                                    # 2026-11-23 Day 1 伊豆攻略（已发微信群，保持根目录不失效）
├── img/                                          # 2026-11-23 Day 1 伊豆本地实拍图
├── og-cover.png                                  # 2026-11-23 Day 1 微信分享封面
├── izu_1123_wechat_poster_0900.png               # 2026-11-23 Day 1 微信一图流高清长图（09:00接人版）
├── skills/japan-self-drive-trip-planner/SKILL.md # 跨 AI 通用规范 v2.0（供复制 / Raw 链接调用）
├── .agents/skills/japan-self-drive-trip-planner/ # 同款规范 v2.0（本地 Agent 工具自动识别）
└── trips/
    ├── index.html                                # 旅行总览目录页（Trip Hub）
    ├── 2026-11-24-izu-day2/                      # 2026-11-24 Day 2 新版全天候攻略（跳过修禅寺＆碧テラス）
    ├── 2026-11-25-izu-return/                    # 2026-11-25 Day 3（已实装 v2.0 实时护航＋13:30晚点自动重排复盘）
    ├── 2026-11-26-ikebukuro-night/               # 2026-11-26 今晚实测（电车＋池袋40分×2防加钟护航→22:00滝不動）
    ├── 2026-11-24-nishi-izu/                     # 2026-11-24 Day 2 历史备选归档
    ├── template/                                 # v2.0 空白新行程模板（brief.md + index.html + manifest + 护航演示）
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