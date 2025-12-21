#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MASTER="$ROOT/.env.master"

if [ ! -f "$MASTER" ]; then
  echo "Missing $MASTER"
  exit 1
fi

# Backend .env (root)
cp "$MASTER" "$ROOT/.env"

# Client .env (only REACT_APP_ vars)
grep -E '^(REACT_APP_)' "$MASTER" > "$ROOT/client/.env" || true

echo "Wrote:"
echo " - $ROOT/.env"
echo " - $ROOT/client/.env"
