#!/usr/bin/env bash
# Usage: ./configure.sh "<APPS_SCRIPT_EXEC_URL>" "<SITE_URL_WITHOUT_TRAILING_SLASH>"
# Example: ./configure.sh "https://script.google.com/macros/s/AKfy.../exec" "https://ishaica.github.io/omer-yishai-wedding"
set -euo pipefail
cd "$(dirname "$0")"

EXEC_URL="${1:?missing Apps Script /exec URL}"
SITE_URL="${2:?missing site URL}"
SITE_URL="${SITE_URL%/}"

[[ "$EXEC_URL" == https://script.google.com/macros/s/*/exec ]] || { echo "EXEC_URL must look like https://script.google.com/macros/s/.../exec"; exit 1; }
[[ "$SITE_URL" == https://* ]] || { echo "SITE_URL must start with https://"; exit 1; }

python3 - "$EXEC_URL" "$SITE_URL" <<'EOF'
import sys
exec_url, site = sys.argv[1], sys.argv[2]
p = "main.js"; s = open(p, encoding="utf-8").read()
s = s.replace('"PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"', '"%s"' % exec_url)
open(p, "w", encoding="utf-8").write(s)
for p in ("index.html", "friends.html"):
    s = open(p, encoding="utf-8").read().replace("__SITE_URL__", site)
    open(p, "w", encoding="utf-8").write(s)
EOF

if grep -q "PASTE_YOUR_APPS_SCRIPT" main.js || grep -q "__SITE_URL__" index.html friends.html; then
  echo "Placeholders still present"; exit 1
fi
echo "Configured: SHEET_URL=$EXEC_URL  SITE_URL=$SITE_URL"
