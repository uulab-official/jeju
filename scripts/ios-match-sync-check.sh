#!/usr/bin/env bash
# Verify that match can access the certificates repo (readonly check, no file copy).
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
MATCH_GIT_URL="${MATCH_GIT_URL:-https://github.com/uulab-official/certificates.git}"
BUNDLE_ID="${BUNDLE_ID:-$(node -e 'const fs=require("fs"); const p=fs.existsSync("./app.base.json")?"./app.base.json":"./app.json"; console.log(require(p).expo?.ios?.bundleIdentifier || "")')}"
if [[ -z "${MATCH_PASSWORD:-}" ]]; then read -r -s -p "Enter MATCH_PASSWORD: " MATCH_PASSWORD; echo ""; fi
MATCH_PASSWORD="$MATCH_PASSWORD" fastlane match appstore --readonly --git_url "$MATCH_GIT_URL" --app_identifier "$BUNDLE_ID" --clone_branch_directly true
echo "PASS: Match check OK for $BUNDLE_ID"
