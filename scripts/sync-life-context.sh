#!/usr/bin/env bash
# ==============================================================================
# sync-life-context.sh (v2.0) — 子项目仓库双向连接 `kenandxx/ob-life-hub` 客户端脚本
#
# 用法：
#   ./scripts/sync-life-context.sh pull
#       从私密中枢 `kenandxx/ob-life-hub` 拉取本项目对应的最新上下文切片到 `.context/`
#
#   ./scripts/sync-life-context.sh push-idea "开发本项目时冒出的新项目或跨项目点子"
#       直接登记进 `kenandxx/ob-life-hub/05-Projects/IDEA_BACKLOG.md`（全项目共创灵感池）！
#
#   ./scripts/sync-life-context.sh push-insight "可复用的新习惯/交互经验" ["#it"]
#       写回 `kenandxx/ob-life-hub/00-Inbox/quick-notes.md`，供全项目 AI 通读吸收！
# ==============================================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="${OB_PROJECT_NAME:-$(basename "${PROJECT_ROOT}")}"
HUB_REPO="${OB_HUB_REPO:-kenandxx/ob-life-hub}"
SIBLING_HUB="${PROJECT_ROOT}/../ob-life-hub"
TARGET_DIR="${PROJECT_ROOT}/.context"

ACTION="${1:-pull}"

append_remote_file() {
  local remote_path="$1"
  local entry_line="$2"
  local commit_msg="$3"

  local file_json file_sha current_content new_content new_b64
  file_json="$(gh api "repos/${HUB_REPO}/contents/${remote_path}")"
  file_sha="$(printf '%s' "${file_json}" | jq -r '.sha')"
  current_content="$(printf '%s' "${file_json}" | jq -r '.content' | tr -d '\n' | base64 -d)"
  new_content="$(printf '%s\n%s\n' "${current_content}" "${entry_line}")"
  new_b64="$(printf '%s' "${new_content}" | base64 | tr -d '\n')"

  gh api --method PUT "repos/${HUB_REPO}/contents/${remote_path}" \
    -f "message=${commit_msg}" \
    -f "content=${new_b64}" \
    -f "sha=${file_sha}" >/dev/null
}

case "${ACTION}" in
  pull)
    mkdir -p "${TARGET_DIR}"
    if [[ -d "${SIBLING_HUB}/dist/spokes/${PROJECT_NAME}" ]]; then
      echo "🔄 从同级本地中枢 ${SIBLING_HUB} 同步 [${PROJECT_NAME}] 最新上下文..."
      python3 "${SIBLING_HUB}/engine/compile_context.py" >/dev/null
      cp "${SIBLING_HUB}/dist/spokes/${PROJECT_NAME}/PERSONAL_CONTEXT.md" "${TARGET_DIR}/PERSONAL_CONTEXT.md"
      cp "${SIBLING_HUB}/dist/spokes/${PROJECT_NAME}/context.json" "${TARGET_DIR}/context.json"
      echo "✅ 已更新 ${TARGET_DIR}/PERSONAL_CONTEXT.md"
      exit 0
    fi

    echo "☁️ 通过 GitHub API 从私密中枢 ${HUB_REPO} 拉取 [${PROJECT_NAME}] 切片..."
    if gh api "repos/${HUB_REPO}/contents/dist/spokes/${PROJECT_NAME}/PERSONAL_CONTEXT.md" \
         -H "Accept: application/vnd.github.raw" > "${TARGET_DIR}/PERSONAL_CONTEXT.md.tmp" 2>/dev/null; then
      mv "${TARGET_DIR}/PERSONAL_CONTEXT.md.tmp" "${TARGET_DIR}/PERSONAL_CONTEXT.md"
      gh api "repos/${HUB_REPO}/contents/dist/spokes/${PROJECT_NAME}/context.json" \
         -H "Accept: application/vnd.github.raw" > "${TARGET_DIR}/context.json"
      echo "✅ 已从远端拉取最新 ${TARGET_DIR}/PERSONAL_CONTEXT.md"
    else
      rm -f "${TARGET_DIR}/PERSONAL_CONTEXT.md.tmp"
      gh api "repos/${HUB_REPO}/contents/dist/starter-pack/PERSONAL_CONTEXT.md" \
         -H "Accept: application/vnd.github.raw" > "${TARGET_DIR}/PERSONAL_CONTEXT.md"
      gh api "repos/${HUB_REPO}/contents/dist/starter-pack/context.json" \
         -H "Accept: application/vnd.github.raw" > "${TARGET_DIR}/context.json"
      echo "✅ 已拉取通用公开安全切片。"
    fi
    ;;

  push-idea)
    IDEA_TEXT="${2:-}"
    if [[ -z "${IDEA_TEXT}" ]]; then
      echo "❌ 用法: $0 push-idea \"开发本项目时冒出的新项目或跨项目点子\"" >&2
      exit 1
    fi
    TODAY="$(TZ=Asia/Tokyo date '+%Y-%m-%d')"
    ENTRY_LINE="- **[${TODAY} · 源自 \`${PROJECT_NAME}\`]** ${IDEA_TEXT} #idea/new-project"

    if [[ -d "${SIBLING_HUB}/.git" ]]; then
      python3 - "${SIBLING_HUB}/05-Projects/IDEA_BACKLOG.md" "${ENTRY_LINE}" <<'PY'
import pathlib, sys
p = pathlib.Path(sys.argv[1])
line = sys.argv[2]
txt = p.read_text(encoding="utf-8")
marker = "## 🔗 二、跨项目联动与待吸收点子"
if marker in txt:
    head, tail = txt.split(marker, 1)
    p.write_text(head.rstrip() + "\n" + line + "\n\n---\n\n" + marker + tail, encoding="utf-8")
else:
    p.write_text(txt.rstrip() + "\n" + line + "\n", encoding="utf-8")
PY
      python3 "${SIBLING_HUB}/engine/compile_context.py"
      git -C "${SIBLING_HUB}" add 05-Projects/IDEA_BACKLOG.md dist/
      git -C "${SIBLING_HUB}" commit -m "feat(ideas): add new project idea from ${PROJECT_NAME}"
      git -C "${SIBLING_HUB}" push origin main
      echo "🌱 已登记进 ${HUB_REPO}/05-Projects/IDEA_BACKLOG.md 并同步全项目！"
      exit 0
    fi

    # Remote GitHub API update into 05-Projects/IDEA_BACKLOG.md
    FILE_JSON="$(gh api "repos/${HUB_REPO}/contents/05-Projects/IDEA_BACKLOG.md")"
    FILE_SHA="$(printf '%s' "${FILE_JSON}" | jq -r '.sha')"
    CUR_TXT="$(printf '%s' "${FILE_JSON}" | jq -r '.content' | tr -d '\n' | base64 -d)"
    NEW_TXT="$(python3 -c '
import sys
txt, line = sys.argv[1], sys.argv[2]
marker = "## 🔗 二、跨项目联动与待吸收点子"
if marker in txt:
    h, t = txt.split(marker, 1)
    print(h.rstrip() + "\n" + line + "\n\n---\n\n" + marker + t, end="")
else:
    print(txt.rstrip() + "\n" + line + "\n", end="")
' "${CUR_TXT}" "${ENTRY_LINE}")"
    NEW_B64="$(printf '%s' "${NEW_TXT}" | base64 | tr -d '\n')"
    gh api --method PUT "repos/${HUB_REPO}/contents/05-Projects/IDEA_BACKLOG.md" \
      -f "message=feat(ideas): add new project idea from ${PROJECT_NAME}" \
      -f "content=${NEW_B64}" \
      -f "sha=${FILE_SHA}" >/dev/null
    echo "🌱 已通过 GitHub API 登记进 ${HUB_REPO}/05-Projects/IDEA_BACKLOG.md，云端将自动同步给所有项目！"
    ;;

  push-insight)
    INSIGHT_TEXT="${2:-}"
    OPTIONAL_TAG="${3:-#it}"
    if [[ -z "${INSIGHT_TEXT}" ]]; then
      echo "❌ 用法: $0 push-insight \"新总结的习惯或经验\" [\"#it\"]" >&2
      exit 1
    fi
    [[ "${OPTIONAL_TAG}" != \#* && -n "${OPTIONAL_TAG}" ]] && OPTIONAL_TAG="#${OPTIONAL_TAG}"
    TODAY="$(TZ=Asia/Tokyo date '+%Y-%m-%d')"
    ENTRY_LINE="- [${TODAY} · 来自 ${PROJECT_NAME}] ${INSIGHT_TEXT} ${OPTIONAL_TAG}"

    if [[ -d "${SIBLING_HUB}/.git" ]]; then
      echo "${ENTRY_LINE}" >> "${SIBLING_HUB}/00-Inbox/quick-notes.md"
      python3 "${SIBLING_HUB}/engine/compile_context.py"
      git -C "${SIBLING_HUB}" add 00-Inbox/quick-notes.md dist/
      git -C "${SIBLING_HUB}" commit -m "feat(inbox): insight write-back from ${PROJECT_NAME}"
      git -C "${SIBLING_HUB}" push origin main
      echo "🚀 已回流至 ${HUB_REPO}/00-Inbox/quick-notes.md 并更新全项目上下文！"
      exit 0
    fi

    append_remote_file "00-Inbox/quick-notes.md" "${ENTRY_LINE}" "feat(inbox): insight write-back from ${PROJECT_NAME}"
    echo "🚀 已通过 GitHub API 回流至 ${HUB_REPO}/00-Inbox/quick-notes.md！"
    ;;

  *)
    echo "用法: $0 {pull|push-idea|push-insight}" >&2
    exit 1
    ;;
esac
