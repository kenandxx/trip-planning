# 🚗 Japan Self-Drive Trip Planning Hub (`kenandxx/trip-planning`)

个人日本自驾攻略、新手防选错一键 Google Maps 导航页与微信分享长图归档仓库（单仓库多行程管理，共用同一套 GitHub Pages）。

- **旅行总览目录（Trip Hub）**：https://kenandxx.github.io/trip-planning/trips/
- **跨 AI 通用规划规范（SKILL.md v2.0・含行中实时护航＆晚点自动重排）**：
  - 仓库浏览：[skills/japan-self-drive-trip-planner/SKILL.md](skills/japan-self-drive-trip-planner/SKILL.md)
  - 直链 Raw（可直接喂给 ChatGPT / Claude / Gemini）：
    `https://raw.githubusercontent.com/kenandxx/trip-planning/main/skills/japan-self-drive-trip-planner/SKILL.md`

---

## 🛰️ v3.0 新特性：清爽 3 步分区卡片 UI ＆ 双模式现地打卡 ＆ Behind 自动拯救与项目取舍
针对自驾与电车实测痛点（忘关地图「避开收费站」、慢行/等位导致晚点、界面元素杂乱），控制台已重构为**边界分明、一眼看懂的 3 步闭环卡片**：
1. **💡 顶部可折叠「3步上手」使用方法提示**：打开即看清 `① 定目标死线 → ② 打卡当前位置 → ③ 看 Ahead/Behind ＆ 后续取舍`，熟手可一键收起。
2. **STEP 1 · 🎯 目标死线（几点前必须到哪）**：支持随时修改必到时刻，或直接输入日本车站 / 高速 PA・SA / 地名（内置 80+ 车站 ＋ 38+ 高速 SA/PA 离线词典与全国在线检索），下方结果即时联动。
3. **STEP 2 · 📍 位置打卡（确定我现在在哪）**：
   - **方案一（主力）**：一键点击 **`📡 取用当前位置立即打卡`**，拉取手机 GPS 坐标、反查当前街区并自动刷新身边站点距离。
   - **方案二（并行兜底）**：自动按距离列出**当前位置附近的车站 / 高速 PA・SA / 行程节点**供一键点选打卡，亦支持手动输入任意站名或 PA/SA 打卡（地下 B1 / 隧道无信号照常可用）。
4. **STEP 3 · 📊 Ahead / Behind 判定 ＆ 后续项目取舍**：
   - 打卡后立即算出 `Ahead · 余裕 X 分钟` 或 `Behind · 预计晚 X 分钟`。
   - 一旦 `Behind`，**自动启动 3 套可执行拯救方案**（自动砍减后续项目保死线 / 改乘打车最快直达 / 顺延目标死线并复制新 ETA 发微信 / 打包现地坐标问 AI 查终电）。
   - **后续计划项目独立取舍面板**：每个中途项目均标明「砍掉可抢回 XX 分」，支持一键切换 `保留` / `压至最短时长` / `✂️ 砍掉` / `✔ 已完` 并实时重算。
5. **收纳式底部工具箱**：出发防呆核查、节奏系数（`1.0× / 1.2× / 1.35×`）、手机四通道强提醒（`.ics` 系统日历双闹钟 / 常亮语音 / iPhone Bark 突破静音）与晚点模拟演练全部整齐收进底部折叠抽屉。

---

## 🗺️ 行程列表

| 状态 | 行程 | 目录 | 在线网址（GitHub Pages） |
|---|---|---|---|
| ✅ 已上线 | **2026-11-23（Day 1）东京 → 伊豆Skyline → 修善寺＆弘法の湯** | `/`（根目录保留兼容微信旧链） | https://kenandxx.github.io/trip-planning/ |
| ✅ 已上线（主推） | **2026-11-24（Day 2 新版）沼津深海避雨 / 虹之乡＆净莲瀑布（跳过修禅寺＆碧テラス）** | `trips/2026-11-24-izu-day2/` | https://kenandxx.github.io/trip-planning/trips/2026-11-24-izu-day2/ |
| 🛰️ 已实装 v2.0 护航 | **2026-11-25（Day 3・含实时护航＆13:30晚点复盘重排）湘南＋海ほたる → 新鎌ヶ谷直达成田** | `trips/2026-11-25-izu-return/` | https://kenandxx.github.io/trip-planning/trips/2026-11-25-izu-return/ |
| 🆕 明天・日帰り | **2026-11-28（周六）亀山湖红叶游船＋濃溝の滝 → 16:00 前到家** | `trips/2026-11-28-kameyama-autumn/` | https://kenandxx.github.io/trip-planning/trips/2026-11-28-kameyama-autumn/ |
| 🛰️ 今晚 | **2026-11-28（周六）池袋 ミルキーパイ→Jewels 40分×2 → 滝不動** | `trips/2026-11-28-ikebukuro-night/` | https://kenandxx.github.io/trip-planning/trips/2026-11-28-ikebukuro-night/ |
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
├── .context/                                     # 🧠 由私密总库 kenandxx/ob-life-hub 自动脱敏推送的实时生活与习惯切片
│   ├── PERSONAL_CONTEXT.md                       # Life Hub v2.0 筛选后的 PUBLIC-SAFE 领域上下文（不含日记原文）
│   └── context.json                              # 结构化元数据与内容指纹校验
├── scripts/sync-life-context.sh                  # 🔁 双向同步脚本：拉取 ob-life-hub 最新切片 / 反向回流本项目新经验
├── notes/                                        # 📍 本仓库出行专项沉淀（宝藏店铺双链卡片与自驾收费台账）
│   ├── driver-memory.md                          # 实战收费站现金坑、节奏系数与送机套路
│   └── places/                                   # 宝藏餐厅/温泉/PA 可复用卡片
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
    ├── 2026-11-28-kameyama-autumn/               # 2026-11-28 日帰り（亀山湖红叶游船＋濃溝の滝→16:00到家）
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
本仓库已内置 Skill：唯一编辑源为 `skills/japan-self-drive-trip-planner/SKILL.md`，`.agents/skills/` 为自动生成的镜像。克隆仓库后先读 `AGENTS.md`，再在终端或编辑器里直接说「按 `japan-self-drive-trip-planner` 规划 `trips/<目录>/brief.md`」即可。

---

## ➕ 新建一次旅行的 3 步流程
1. 复制模板目录：`cp -r trips/template trips/YYYY-MM-你的行程名`（或直接启用现有的 3 个占位目录）。
2. 编辑里面的 `brief.md`，填好日期、接人酒店、目的地与人数偏好。
3. 交给 AI 生成完整 `index.html`、`img/`、`og-cover.png`、版本化 `poster_*.png`，并更新 `trips/index.html` 后推送到 `main`，GitHub Pages 即刻上线。