#!/usr/bin/env bash
set -euo pipefail

UULAB_CREDENTIALS_DIR="${UULAB_CREDENTIALS_DIR:-/Users/bonjin/Documents/workspace/uulab/.credentials}"
if [[ -f "${UULAB_CREDENTIALS_DIR}/uulab-secrets.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${UULAB_CREDENTIALS_DIR}/uulab-secrets.env"
  set +a
fi

exec "$@"
