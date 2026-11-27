# 📱💻 零付费打通「iPhone Obsidian ↔ Mac ↔ Git 开发/AI」最佳实践指南

不需要购买 Obsidian Sync（$4/月），利用苹果自带的免费 **iCloud 云盘** ＋ 仓库内置的 **[sync-obsidian.sh](../scripts/sync-obsidian.sh)**，就能既享受 iPhone 秒开记笔记，又彻底避开「把 `.git` 塞进 iCloud 导致 Git 损坏」的巨坑。

---

## 为什么你之前觉得「只能在 iPhone 写、不能同步到 Mac」？
首次在 iPhone 安装 Obsidian 新建仓库时，如果没有勾选 **「Store in iCloud（存储在 iCloud）」**（或者系统设置里没给 Obsidian 开 iCloud 权限），仓库会默认建在手机本地沙盒 `我的 iPhone / Obsidian` 下，所以 Mac 看不到。

**解决办法（100% 免费）**：使用 iCloud 云盘同步纯文本笔记（几百 KB，免费 5GB iCloud 绰绰有余），再在 Mac 上用脚本桥接到你的本地 Git 仓库。

---

## 🛠️ 一次性 3 步配置（5 分钟搞定）

### 第 1 步：开启苹果免费 iCloud 同步通道
1. **iPhone 端**：打开「设置 → 点击顶部 Apple ID → iCloud → iCloud 云盘（同步此 iPhone）」，往下滑确认 **Obsidian** 开关是开启状态。
2. **Mac 端**：打开「系统设置 → Apple ID → iCloud → iCloud 云盘」，同样确认开启。
3. 打开 **iPhone 上的 Obsidian** → 点击顶部切换仓库 → **Create new vault（新建仓库）**：
   - **Vault name**：填 `TripPlanning`
   - **Store in iCloud**：**务必打开开关 ✅**，点击 Create。
   *(如果你以前在「我的 iPhone」里写过旧笔记，打开 iPhone 自带「文件」App，把旧文件拖进 `iCloud 云盘 → Obsidian → TripPlanning` 即可。)*

### 第 2 步：在 Mac 本地把 Git 仓库的笔记灌入 iCloud
在你的 Mac 终端进入本地克隆的 `trip-planning` 仓库目录，执行一次：

```bash
git pull origin main
./scripts/sync-obsidian.sh init
```

等几秒钟 iCloud 同步完，拿起 iPhone 打开 Obsidian 的 `TripPlanning` 库，你会发现：
- `notes/inbox.md`（随手速记收件箱）
- `notes/driver-memory.md`（你的伊豆实战收费站＆路线记忆库）
- `notes/places/`（宝藏店卡片）
- `trips/*/brief.md`（所有行程需求单）
全部整整齐齐出现在 iPhone 上了！而且**没有任何 `.html` 代码和几兆大的 `.png` 海报污染手机空间**。

---

## 🔄 日常闭环怎么流转？（iPhone → Mac → Git → AI）

```text
[在外面用 iPhone Obsidian]
   随手往 inbox.md 丢小红书/Tabelog链接，或点开 brief.md 改出发时间/写复盘
         │
         ▼ （苹果 iCloud 自动免费秒级同步，无需任何操作）
[Mac 上的 iCloud 容器目录]
         │
         ▼ （坐在 Mac 前准备规划行程时，跑一条命令：）
   ./scripts/sync-obsidian.sh push-git
         │
         ▼ （自动双向增量同步 .md 文件 + git commit + git push origin main）
[GitHub 远端仓库 kenandxx/trip-planning]
         │
         ▼ （打开 Antigravity / Claude Code 直接发指令）
[AI 读取最新 brief.md + driver-memory.md → 生成网页/长图并发布 GitHub Pages]
```

### 常用命令速查（在 Mac 本地仓库执行）
- **仅预览哪些笔记变了（不改文件）**：`./scripts/sync-obsidian.sh --dry-run`
- **仅同步到本地 Git 工作区（不自动 push）**：`./scripts/sync-obsidian.sh`
- **一键同步并推送到 GitHub 喂给云端 AI**：`./scripts/sync-obsidian.sh push-git`
