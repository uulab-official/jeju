#!/usr/bin/env bash
# Verify that credentials/ios-distribution.p12 + ios-app-store.mobileprovision are valid.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [[ -z "${P12_PATH:-}" || -z "${PROFILE_PATH:-}" ]]; then
  SIGNING_PATHS="$(node - <<'NODE'
const fs = require('fs');
try {
  const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
  console.log(credentials.ios?.distributionCertificate?.path || 'credentials/ios-distribution.p12');
  console.log(credentials.ios?.provisioningProfilePath || 'credentials/ios-app-store.mobileprovision');
} catch {
  console.log('credentials/ios-distribution.p12');
  console.log('credentials/ios-app-store.mobileprovision');
}
NODE
  )"
  P12_PATH="${P12_PATH:-$(printf '%s\n' "$SIGNING_PATHS" | sed -n '1p')}"
  PROFILE_PATH="${PROFILE_PATH:-$(printf '%s\n' "$SIGNING_PATHS" | sed -n '2p')}"
fi
BUNDLE_ID="${BUNDLE_ID:-$(node -e 'const fs=require("fs"); const p=fs.existsSync("./app.base.json")?"./app.base.json":"./app.json"; console.log(require(p).expo?.ios?.bundleIdentifier || "")')}"
[[ ! -f "$P12_PATH" ]] && { echo "Missing: $P12_PATH" >&2; exit 1; }
[[ ! -f "$PROFILE_PATH" ]] && { echo "Missing: $PROFILE_PATH" >&2; exit 1; }
: "${P12_PASSWORD:?Set P12_PASSWORD in the process environment before signing verification}"
if ! openssl pkcs12 -in "$P12_PATH" -passin "pass:$P12_PASSWORD" -nokeys -clcerts -out /dev/null 2>/dev/null; then
  openssl pkcs12 -legacy -in "$P12_PATH" -passin "pass:$P12_PASSWORD" -nokeys -clcerts -out /dev/null 2>/dev/null || { echo "FAIL: .p12 invalid or wrong password" >&2; exit 2; }
fi
PLIST="$(mktemp)"
openssl smime -inform der -verify -noverify -in "$PROFILE_PATH" -out "$PLIST" >/dev/null 2>&1 || { echo "FAIL: .mobileprovision unreadable" >&2; exit 3; }
APP_ID=$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' "$PLIST" 2>/dev/null || true)
EXP=$(/usr/libexec/PlistBuddy -c 'Print :ExpirationDate' "$PLIST" 2>/dev/null || true)
rm -f "$PLIST"
echo "p12: OK"
echo "profile: $APP_ID  expires: $EXP"
[[ "${APP_ID#*.}" != "$BUNDLE_ID" ]] && { echo "WARN: profile bundle ID mismatch (profile=${APP_ID#*.} expected=$BUNDLE_ID)"; }
echo "PASS: Signing assets verified."
