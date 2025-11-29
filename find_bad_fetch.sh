#!/usr/bin/env bash

# Pattern for hardcoded localhost backend
PATTERN="http://localhost:5000"

echo "Searching for $PATTERN in source files..."

grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.ts" \
  --include="*.tsx" \
  "$PATTERN" .