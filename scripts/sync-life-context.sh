#!/usr/bin/env bash
# ==============================================================================
# sync-life-context.sh — 子项目仓库（Spoke）双向连接 `kenandxx/ob-life-hub` 客户端脚本
#
# 用法：
#   ./scripts/sync-life-context.sh pull
#       从私密中枢 `kenandxx/ob-life-hub` 拉取本项目最新的个人生活与偏好切片到 `.context/`
#
#   ./scripts/sync-life-context.sh push-insight "新总结的经验或习惯" [domains]
#       把在本项目开发中产生的新经验反向写回 `ob-life-hub/00-Inbox/quick-notes.md`，
#       从而自动广播给其他所有关联 Git 项目！（默认 domains 为 global,ui,dev）
# ==============================================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="${OB_PROJECT_NAME:-$(basename "${PROJECT_ROOT}")}"
HUB_REPO="${OB_HUB_REPO:-kenandxx/ob-life-hub}"
SIBLING_HUB="${PROJECT_ROOT}/../ob-life-hub"
TARGET_DIR="${PROJECT_ROOT}/.context"

ACTION="${1:-pull}"

case "${ACTION}" in
  pull)
    mkdir -p "${TARGET_DIR}"
    if [[ -d "${SIBLING_HUB}/dist/spokes/${PROJECT_NAME}" ]]; then
      echo "🔄 从同级本地中枢 ${SIBLING_HUB} 同步 [${PROJECT_NAME}] 最新个人上下文..."
      python3 "${SIBLING_HUB}/engine/compile_context.py" >/dev/null
      cp "${SIBLING_HUB}/dist/spokes/${PROJECT_NAME}/PERSONAL_CONTEXT.md" "${TARGET_DIR}/PERSONAL_CONTEXT.md"
      cp "${SIBLING_HUB}/dist/spokes/${PROJECT_NAME}/context.json" "${TARGET_DIR}/context.json"
      echo "✅ 已更新 ${TARGET_DIR}/PERSONAL_CONTEXT.md"
      exit 0
    fi

    echo "☁️ 通过 GitHub API 从私密中枢 ${HUB_REPO} 拉取 [${PROJECT_NAME}] 专属切片..."
    if gh api "repos/${HUB_REPO}/contents/dist/spokes/${PROJECT_NAME}/PERSONAL_CONTEXT.md" \
         -H "Accept: application/vnd.github.raw" > "${TARGET_DIR}/PERSONAL_CONTEXT.md.tmp" 2>/dev/null; then
      mv "${TARGET_DIR}/PERSONAL_CONTEXT.md.tmp" "${TARGET_DIR}/PERSONAL_CONTEXT.md"
      gh api "repos/${HUB_REPO}/contents/dist/spokes/${PROJECT_NAME}/context.json" \
         -H "Accept: application/vnd.github.raw" > "${TARGET_DIR}/context.json"
      echo "✅ 已从远端拉取最新 ${TARGET_DIR}/PERSONAL_CONTEXT.md"
    else
      rm -f "${TARGET_DIR}/PERSONAL_CONTEXT.md.tmp"
      echo "ℹ️ 未能直连私密中枢 API，回退拉取通用 starter-pack 切片..."
      gh api "repos/${HUB_REPO}/contents/dist/starter-pack/PERSONAL_CONTEXT.md" \
         -H "Accept: application/vnd.github.raw" > "${TARGET_DIR}/PERSONAL_CONTEXT.md"
      gh api "repos/${HUB_REPO}/contents/dist/starter-pack/context.json" \
         -H "Accept: application/vnd.github.raw" > "${TARGET_DIR}/context.json"
      echo "✅ 已拉取通用个人上下文切片。"
    fi
    ;;

  push-insight)
    INSIGHT_TEXT="${2:-}"
    DOMAINS_CSV="${3:-global,ui,dev}"
    if [[ -z "${INSIGHT_TEXT}" ]]; then
      echo "❌ 用法: $0 push-insight \"新发现的经验或习惯\" [global,travel,ui]" >&2
      exit 1
    fi

    TAGS=""
    IFS=',' read -ra DOM_ARR <<< "${DOMAINS_CSV}"
    for d in "${DOM_ARR[@]}"; do
      d_clean="$(echo "$d" | tr -d ' ')"
      [[ -n "${d_clean}" ]] && TAGS="${TAGS} #sync/${d_clean}"
    done
    TODAY="$(TZ=Asia/Tokyo date '+%Y-%m-%d')"
    ENTRY_LINE="- [${TODAY} · 来自 ${PROJECT_NAME}] ${INSIGHT_TEXT}${TAGS}"

    if [[ -d "${SIBLING_HUB}/.git" ]]; then
      echo "${ENTRY_LINE}" >> "${SIBLING_HUB}/00-Inbox/quick-notes.md"
      python3 "${SIBLING_HUB}/engine/compile_context.py"
      git -C "${SIBLING_HUB}" add 00-Inbox/quick-notes.md dist/
      git -C "${SIBLING_HUB}" commit -m "feat(inbox): insight write-back from ${PROJECT_NAME}"
      git -C "${SIBLING_HUB}" push origin main
      echo "🚀 已回流至本地+远端 ${HUB_REPO} 并重新编译全仓库切片！"
      exit 0
    fi

    # Remote GitHub Contents API append
    INBOX_JSON="$(gh api "repos/${HUB_REPO}/contents/00-Inbox/quick-notes.md")"
    FILE_SHA="$(printf '%s' "${INBOX_JSON}" | jq -r '.sha')"
    CURRENT_CONTENT="$(printf '%s' "${INBOX_JSON}" | jq -r '.content' | tr -d '\n' | base64 -d)"
    NEW_CONTENT="$(printf '%s\n%s\n' "${CURRENT_CONTENT}" "${ENTRY_LINE}")"
    NEW_B64="$(printf '%s' "${NEW_CONTENT}" | base64 | tr -d '\n')"

    gh api --method PUT "repos/${HUB_REPO}/contents/00-Inbox/quick-notes.md" \
      -f "message=feat(inbox): insight write-back from ${PROJECT_NAME}" \
      -f "content=${NEW_B64}" \
      -f "sha=${FILE_SHA}" >/dev/null
    echo "🚀 已通过 GitHub API 回流至 ${HUB_REPO}/00-Inbox/quick-notes.md，云端 Action 将自动分发给所有项目！"
    ;;

  *)
    echo "用法: $0 {pull|push-insight}" >&2
    exit 1
    ;;
esac
