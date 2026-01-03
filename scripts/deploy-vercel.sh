#!/usr/bin/env bash
# Non-interactive Vercel deploy script
# Usage:
#   VERCEL_TOKEN=xyz ./scripts/deploy-vercel.sh [--prod] [--scope <scope>] [--confirm]
# By default it deploys the `client` directory (suitable for this repo layout).

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PROD=false
SCOPE=""
CONFIRM_FLAG="--confirm"
TARGET_DIR="client"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod) PROD=true; shift ;;
    --scope) SCOPE="$2"; shift 2 ;;
    --no-confirm) CONFIRM_FLAG=""; shift ;;
    --target) TARGET_DIR="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "ERROR: VERCEL_TOKEN environment variable not set. Create one at https://vercel.com/account/tokens" >&2
  exit 2
fi

# Ensure vercel CLI is available
if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI not found; installing temporarily..."
  npm i -g vercel
fi

DEPLOY_CMD=(vercel --token "$VERCEL_TOKEN")
if [ -n "$SCOPE" ]; then
  DEPLOY_CMD+=(--scope "$SCOPE")
fi
if [ "$PROD" = true ]; then
  DEPLOY_CMD+=(--prod)
fi
if [ -n "$CONFIRM_FLAG" ]; then
  DEPLOY_CMD+=(--confirm)
fi
DEPLOY_CMD+=("$TARGET_DIR")

echo "Running: ${DEPLOY_CMD[*]}"
# Run deploy and capture output (do not echo the token)
echo "Running vercel deploy (token hidden)..."
OUTPUT="$("${DEPLOY_CMD[@]}" 2>&1)" || ( echo "Deploy failed:"; echo "$OUTPUT"; exit 3 )

# Try to extract deployment URL (vercel usually prints a url like https://project-hash.vercel.app)
URL=$(echo "$OUTPUT" | grep -Eo "https?://[a-zA-Z0-9.-]+\.vercel\.app" | head -n1 || true)
if [ -z "$URL" ]; then
  # Also check for vercel.co or alias
  URL=$(echo "$OUTPUT" | grep -Eo "https?://[a-zA-Z0-9.-]+\.(vercel\.app|vercel\.co)" | head -n1 || true)
fi

echo
if [ -n "$URL" ]; then
  echo "Deploy succeeded: $URL"
  echo "$OUTPUT"
  exit 0
else
  echo "Deploy finished but could not parse URL from output. Full output below:" >&2
  echo "$OUTPUT"
  exit 0
fi
