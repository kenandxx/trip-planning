#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/skills/japan-self-drive-trip-planner/SKILL.md"
MIRROR="$ROOT/.agents/skills/japan-self-drive-trip-planner/SKILL.md"
MODE="${1:-sync}"
if [[ ! -f "$SOURCE" ]]; then echo "Canonical Skill not found: $SOURCE" >&2; exit 1; fi
case "$MODE" in
  sync)
    mkdir -p "$(dirname "$MIRROR")"
    cp "$SOURCE" "$MIRROR"
    echo "Synchronized agent Skill mirror from canonical project Skill."
    ;;
  --check)
    if [[ ! -f "$MIRROR" ]] || ! cmp -s "$SOURCE" "$MIRROR"; then
      echo "Skill mirror is missing or out of sync." >&2
      echo "Run: bash scripts/sync-skills.sh" >&2
      exit 1
    fi
    echo "Canonical Skill and agent mirror are identical."
    ;;
  *) echo "Usage: bash scripts/sync-skills.sh [--check]" >&2; exit 2 ;;
esac
