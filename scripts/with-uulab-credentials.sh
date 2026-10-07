#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UULAB_CREDENTIALS_DIR="${UULAB_CREDENTIALS_DIR:-${HOME}/Documents/workspace/uulab/.credentials}"

# Treat env files as data. Preserve process-local overrides and never evaluate
# command substitutions, or print a value when a malformed line is encountered.
load_env_file() {
  local file="$1" line key value
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    line="${line#${line%%[![:space:]]*}}"
    [[ -z "$line" || "${line:0:1}" == '#' ]] && continue
    line="${line#export }"
    [[ "$line" == *=* ]] || { echo 'Invalid credential env entry.' >&2; return 1; }
    key="${line%%=*}"
    key="${key%${key##*[![:space:]]}}"
    [[ "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || { echo 'Invalid credential env name.' >&2; return 1; }
    value="${line#*=}"
    if [[ "$value" == \"*\" || "$value" == \'*\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    if [[ -z "${!key+x}" ]]; then export "$key=$value"; fi
  done < "$file"
}

load_env_file "${APP_DIR}/.env"
load_env_file "${APP_DIR}/.env.local"
load_env_file "${UULAB_CREDENTIALS_DIR}/uulab-secrets.env"
load_env_file "${UULAB_CREDENTIALS_DIR}/expo/jeju.env"

exec "$@"
