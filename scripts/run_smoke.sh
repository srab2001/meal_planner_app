#!/usr/bin/env bash
# run_smoke.sh - build, optional serve or deploy, then run smoke tests
# Usage: ./scripts/run_smoke.sh [--build] [--serve] [--deploy] [--url <DEPLOY_URL>] [--token <AUTH_TOKEN>]

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

BUILD=false
SERVE=false
DEPLOY=false
URL=""
TOKEN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build) BUILD=true; shift ;;
    --serve) SERVE=true; shift ;;
    --deploy) DEPLOY=true; shift ;;
    --url) URL="$2"; shift 2 ;;
    --token) TOKEN="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

if [ "$BUILD" = true ]; then
  echo "== Building client =="
  npm run build --prefix client
fi

SERVE_PID=0
if [ "$SERVE" = true ]; then
  if ! command -v serve >/dev/null 2>&1; then
    echo "Installing 'serve' (temporary) ..."
    npm install -g serve
  fi
  echo "== Serving client/build on http://localhost:5000 =="
  serve -s client/build -l 5000 &
  SERVE_PID=$!
  # give it a moment
  sleep 1
  URL="http://localhost:5000"
fi

if [ "$DEPLOY" = true ]; then
  if [ -z "${VERCEL_TOKEN:-}" ]; then
    echo "VERCEL_TOKEN not set; cannot deploy. Skipping deploy." >&2
  else
    echo "== Deploying client to Vercel =="
    # Attempt to deploy the client directory; requires vercel CLI
    if ! command -v vercel >/dev/null 2>&1; then
      echo "Installing vercel CLI..."
      npm i -g vercel
    fi
    # Deploy and capture URL
    DEPLOY_OUTPUT=$(vercel --token "$VERCEL_TOKEN" --confirm client 2>&1)
    echo "$DEPLOY_OUTPUT"
    # Try to extract the deployment URL (line containing vercel.app)
    URL_LINE=$(echo "$DEPLOY_OUTPUT" | grep -Eo "https://[^"]+vercel.app" | head -n1 || true)
    if [ -n "$URL_LINE" ]; then
      URL="$URL_LINE"
      echo "Deployed to: $URL"
    else
      echo "Could not parse Vercel URL from output; please check vercel output above" >&2
    fi
  fi
fi

if [ -z "$URL" ]; then
  echo "No URL provided or discovered. Exiting." >&2
  if [ $SERVE_PID -ne 0 ]; then kill $SERVE_PID || true; fi
  exit 2
fi

echo "== Running smoke tests against: $URL =="
if [ -n "$TOKEN" ]; then
  echo "Using Authorization token provided via --token";
  AUTH_ARG="--token $TOKEN"
else
  AUTH_ARG=""
fi

node scripts/smoke-test.js --url "$URL" $AUTH_ARG

EXIT_CODE=$?

if [ $SERVE_PID -ne 0 ]; then
  echo "Stopping local server (PID $SERVE_PID)"
  kill $SERVE_PID || true
fi

exit $EXIT_CODE
