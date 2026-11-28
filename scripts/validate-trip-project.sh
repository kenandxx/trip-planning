#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
bash scripts/sync-skills.sh --check
echo "Checking shell script syntax..."
while IFS= read -r -d '' file; do bash -n "$file"; done < <(find scripts -type f -name '*.sh' -print0)
echo "Checking trip HTML, manifests, and shared JavaScript..."
python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
import json

class TolerantHTMLParser(HTMLParser):
    pass

trip_dirs = sorted(p for p in Path("trips").iterdir() if p.is_dir() and p.name != "template")
if not trip_dirs:
    raise SystemExit("No trip directories found")
for trip in trip_dirs:
    html = trip / "index.html"
    if not html.is_file():
        raise SystemExit(f"Missing trip page: {html}")
    parser = TolerantHTMLParser()
    parser.feed(html.read_text(encoding="utf-8"))
    parser.close()
    manifest = trip / "manifest.webmanifest"
    if manifest.exists():
        json.loads(manifest.read_text(encoding="utf-8"))
print(f"Validated {len(trip_dirs)} trip page(s) and all present web manifests.")
PY
if compgen -G "copilot/*.js" > /dev/null; then
  for file in copilot/*.js; do node --check "$file"; done
fi
echo "Trip Planning validation passed."
