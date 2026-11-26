# 🚗 Japan Self-Drive Trip Planning Hub (`kenandxx/trip-planning`)

个人日本自驾攻略、新手防选错一键 Google Maps 导航页与微信分享长图归档仓库（单仓库多行程管理，共用同一套 GitHub Pages）。

- **旅行总览目录（Trip Hub）**：https://kenandxx.github.io/trip-planning/trips/
- **跨 AI 通用规划规范（SKILL.md v2.0・含行中实时护航＆晚点自动重排）**：
  - 仓库浏览：[skills/japan-self-drive-trip-planner/SKILL.md](skills/japan-self-drive-trip-planner/SKILL.md)
  - 直链 Raw（可直接喂给 ChatGPT / Claude / Gemini）：
    `https://raw.githubusercontent.com/kenandxx/trip-planning/main/skills/japan-self-drive-trip-planner/SKILL.md`

---

## 🛰️ v2.9 新特性：车站名直输检索 ＆ 实时死线倒推联动 ＆ Behind 三阶急救重算
针对自驾与电车卡点实测痛点（忘关地图「避开收费站」、慢行/等位/自动加钟导致晚点、地下或室内不确定 GPS 是否正常稼働、临时更改目标车站或严重晚点无从下手），全套架构已升级支持：
1. **🟢 置顶「一眼核验」GPS 稼働状态栏 ＋ 一键立即测位**：控制台最顶部与底部常驻栏同步显示脉冲状态灯、**每秒跳动的刷新秒数（`N秒前刷新 · 更新#次数 · 精度±米数 · 邻近站点距离`）**，支持一键点击 **`🔄 立即测位`**（强制拉取最新卫星坐标弹窗验证）与 **`🗺️ 地图核对`**；超过 30 秒无新信号（如进入地下 B1/地铁）自动提示「信号暂中断」并暂停将旧坐标计入晚点。
2. **🚉 自由死线倒推（支持直接输入车站名 ＆ 结果卡片秒级联动）**：
   - **直接输入车站名检索**：内置 80+ 首都圈/千叶/东京/神奈川/伊豆核心车站离线词典（兼容中文简体如 `船桥`/`松户`/`泷不动`、日文汉字与罗马音秒级联想）＋ 日本全国车站/地点在线检索，另提供常用车站一键胶囊与地图链接/坐标粘贴。
   - **全界面实时联动**：切换目标车站或修改死线时间时，下方推演结果卡片（`Ahead・余裕 / Behind・会晚`、步行/电车/打车耗时表、最晚出发红线）、`🧭 此刻护航` 总览与底部状态栏**即时同步更新**，并自动清除旧目的地的预设班次备注。
3. **🧭 Behind 晚点一键重算 ＋ 全场景 3 套可执行救援提案**：
   - 处于 `Behind` 状态时，卡片显眼位置提供 **`🔄 按当前位置＆现在时间重算提案`** 按钮，一键同步真实时钟与最新 GPS 位置重排。
   - 无论轻度滞后（可砍站救回）还是严重晚点（连打车也晚于原定死线），始终生成 **3 套可一键启动的提案**（如：① 放弃中途站最快直奔终点止损 / ② 一键顺延死线至可行时刻重排并复制新 ETA 发微信 / ③ 自动打包实时坐标与目标车站唤起 ChatGPT/Claude 查终电与打车估价）。
4. **发车/开场前 2 项防呆锁扣（勾选后自动折叠）＋ 真实节奏系数（1.0× / 1.2× / 1.35×）＋ 餐厅 `L.O.` 排雷**。
5. **手机四通道强提醒**：系统日历 `.ics` 双闹钟（地下无信号照样锁屏弹窗）＋ 网页常亮语音护航（WakeLock + 双音警报 + 中文 TTS）＋ iPhone **Bark** 突破静音强推送（及 `ntfy.sh` 广播）＋ 主屏幕 PWA 原生通知与离线缓存。

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