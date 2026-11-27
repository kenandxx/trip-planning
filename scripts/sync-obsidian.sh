#!/usr/bin/env bash
# ==============================================================================
# sync-obsidian.sh — 零付费打通「iPhone Obsidian (iCloud) ↔ Mac ↔ Git 仓库」桥接脚本
#
# 原理：
#   1. iPhone 与 Mac 之间通过苹果自带免费的 iCloud Drive 实时同步纯 Markdown 笔记库
#      （只同步 notes/ 与 trips/*/brief.md，总大小 <100KB，不含任何 HTML/海报大图/.git，
#       彻底规避「把 .git 放进 iCloud 导致仓库损坏」的经典大坑！）
#   2. 在 Mac 上运行本脚本，即可双向增量同步「较新的修改」，并可一键 git push 到 GitHub，
#      让 Antigravity / Claude Code 等 AI 立即读到你在 iPhone 上随手写的草稿与复盘。
#
# 用法（在 Mac 终端仓库根目录下执行）：
#   ./scripts/sync-obsidian.sh init        # 首次初始化：把笔记与配置灌入 Mac iCloud Obsidian 目录
#   ./scripts/sync-obsidian.sh             # 日常双向同步（哪边文件更新就同步哪边，不删文件）
#   ./scripts/sync-obsidian.sh --dry-run   # 仅预览将要同步的文件，不实际修改
#   ./scripts/sync-obsidian.sh push-git    # 双向同步后，自动 git commit & push 笔记变更到 GitHub
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT_NAME="${OBSIDIAN_VAULT_NAME:-TripPlanning}"
ICLOUD_OBSIDIAN_BASE="${HOME}/Library/Mobile Documents/iCloud~md~obsidian/Documents"
VAULT_DIR="${OBSIDIAN_ICLOUD_VAULT:-${ICLOUD_OBSIDIAN_BASE}/${VAULT_NAME}}"

MODE="sync"
DRY_RUN_FLAG=()

for arg in "$@"; do
  case "$arg" in
    init|sync|push-git)
      MODE="$arg"
      ;;
    -n|--dry-run)
      DRY_RUN_FLAG=("-n")
      ;;
    -h|--help)
      sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "❌ 未知参数: $arg（支持: init | sync | push-git | --dry-run）" >&2
      exit 1
      ;;
  esac
done

check_icloud_container() {
  # 如果用户显式指定了 OBSIDIAN_ICLOUD_VAULT 测试路径，直接放行
  if [[ -n "${OBSIDIAN_ICLOUD_VAULT:-}" ]]; then
    return 0
  fi
  if [[ ! -d "${ICLOUD_OBSIDIAN_BASE}" ]]; then
    echo "⚠️  未检测到 macOS 上的 Obsidian iCloud 容器目录："
    echo "    ${ICLOUD_OBSIDIAN_BASE}"
    echo ""
    echo "👉 只需做一次（免费，无需 Obsidian Sync 会员）："
    echo "   1. 确保 iPhone 和 Mac 登录同一个 Apple ID，且系统设置 → iCloud → iCloud 云盘已开启「Obsidian」"
    echo "   2. 打开 iPhone（或 Mac）上的 Obsidian → Create new vault（新建仓库）"
    echo "   3. Vault name 填「${VAULT_NAME}」，打开「Store in iCloud（存储在 iCloud）」开关并创建"
    echo "   4. 等几秒钟让 iCloud 同步出文件夹后，再重新运行 ./scripts/sync-obsidian.sh init"
    exit 1
  fi
}

sync_repo_to_vault() {
  mkdir -p "${VAULT_DIR}/.obsidian" "${VAULT_DIR}/notes" "${VAULT_DIR}/trips"

  # 同步核心干净配置（不覆盖用户本地 workspace 窗口状态）
  rsync -avu "${DRY_RUN_FLAG[@]}" \
    "${REPO_ROOT}/.obsidian/app.json" \
    "${REPO_ROOT}/.obsidian/templates.json" \
    "${VAULT_DIR}/.obsidian/"

  # 同步 notes/ 知识库与收件箱
  rsync -avu "${DRY_RUN_FLAG[@]}" \
    --exclude='.DS_Store' \
    --exclude='*.icloud' \
    "${REPO_ROOT}/notes/" \
    "${VAULT_DIR}/notes/"

  # 仅同步 trips/<slug>/brief.md（绝不把几十MB的海报PNG和HTML塞进iCloud，也不创建空的 img/ 目录！）
  rsync -avu "${DRY_RUN_FLAG[@]}" \
    --exclude='img/' \
    --include='*/' \
    --include='brief.md' \
    --exclude='*' \
    "${REPO_ROOT}/trips/" \
    "${VAULT_DIR}/trips/"
}

sync_vault_to_repo() {
  if [[ ! -d "${VAULT_DIR}" ]]; then
    echo "❌ 找不到 Obsidian iCloud 仓库目录: ${VAULT_DIR}"
    echo "   请先运行: ./scripts/sync-obsidian.sh init"
    exit 1
  fi

  if [[ -d "${VAULT_DIR}/notes" ]]; then
    rsync -avu "${DRY_RUN_FLAG[@]}" \
      --exclude='.DS_Store' \
      --exclude='*.icloud' \
      "${VAULT_DIR}/notes/" \
      "${REPO_ROOT}/notes/"
  fi

  if [[ -d "${VAULT_DIR}/trips" ]]; then
    rsync -avu "${DRY_RUN_FLAG[@]}" \
      --exclude='img/' \
      --include='*/' \
      --include='brief.md' \
      --exclude='*' \
      "${VAULT_DIR}/trips/" \
      "${REPO_ROOT}/trips/"
  fi
}

check_icloud_container

case "${MODE}" in
  init)
    echo "🚀 正在初始化 iCloud Obsidian 仓库：${VAULT_DIR}"
    sync_repo_to_vault
    echo ""
    echo "✅ 初始化完成！现在拿起 iPhone 打开 Obsidian，即可在 iCloud 列表中直接看到「${VAULT_NAME}」！"
    ;;
  sync)
    echo "🔄 [1/2] 从 iPhone/iCloud (${VAULT_DIR}) 拉取最新笔记到 Git 仓库..."
    sync_vault_to_repo
    echo "🔄 [2/2] 将 Git 仓库新增笔记与模板回推至 iCloud..."
    sync_repo_to_vault
    echo ""
    echo "📊 当前 Git 仓库笔记变更状态："
    git -C "${REPO_ROOT}" status -s notes/ trips/
    ;;
  push-git)
    echo "🔄 正在双向同步 iCloud Obsidian ↔ Git 仓库..."
    sync_vault_to_repo
    sync_repo_to_vault
    if [[ ${#DRY_RUN_FLAG[@]} -gt 0 ]]; then
      echo "ℹ️  --dry-run 模式：跳过 git commit / push"
      exit 0
    fi
    git -C "${REPO_ROOT}" add notes/ trips/*/brief.md
    if git -C "${REPO_ROOT}" diff --cached --quiet; then
      echo "✨ 没有新的笔记或 brief.md 变更需要提交。"
    else
      TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"
      git -C "${REPO_ROOT}" commit -m "docs(notes): sync Obsidian notes & trip briefs (${TIMESTAMP})"
      git -C "${REPO_ROOT}" push origin main
      echo "🚀 已成功推送到 GitHub (origin/main)！现在可以让 Antigravity 直接读取最新笔记了。"
    fi
    ;;
esac
