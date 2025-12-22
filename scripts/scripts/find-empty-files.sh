#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"

echo "[SCAN] Empty files under: $ROOT"
echo

find "$ROOT" -type f -size 0 \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/coverage/*" \
  -not -path "*/.vercel/*" \
  -not -path "*/prisma/migrations/*"
