#!/usr/bin/env bash
# ===============================
# Fitness Environment Sync Script
# ===============================
# Purpose: Synchronize master.env to all derived .env files
# Usage: ./env-sync.sh
# 
# This script:
# 1. Reads fitness/master.env
# 2. Copies all variables to fitness/server/.env
# 3. Copies REACT_APP_* variables to fitness/client/.env
# 4. Validates that critical variables are set
# 5. Reports what was synced

set -euo pipefail

# Get the directory where this script lives
ROOT="$(cd "$(dirname "$0")" && pwd)"
MASTER="$ROOT/master.env"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ===============================
# Step 1: Validate master.env exists
# ===============================
if [ ! -f "$MASTER" ]; then
  echo -e "${RED}❌ ERROR: Missing $MASTER${NC}"
  echo "Please create the master.env file first."
  exit 1
fi

echo -e "${GREEN}✓ Found master.env${NC}"

# ===============================
# Step 2: Check for critical variables
# ===============================
echo ""
echo "Validating critical variables..."

CRITICAL_VARS=("NODE_ENV" "DATABASE_URL" "SESSION_SECRET" "JWT_SECRET")
MISSING=()

for var in "${CRITICAL_VARS[@]}"; do
  if grep -q "^${var}=" "$MASTER"; then
    echo -e "${GREEN}✓ $var defined${NC}"
  else
    echo -e "${YELLOW}⚠ $var not found${NC}"
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo -e "${YELLOW}Warning: Missing critical variables: ${MISSING[*]}${NC}"
fi

# ===============================
# Step 3: Sync to backend/.env
# ===============================
echo ""
echo "Syncing to backend/.env..."

SERVER_ENV="$ROOT/backend/.env"
mkdir -p "$(dirname "$SERVER_ENV")"
cp "$MASTER" "$SERVER_ENV"
echo -e "${GREEN}✓ Copied master.env → backend/.env${NC}"

# ===============================
# Step 4: Sync REACT_APP_* to frontend/.env
# ===============================
echo ""
echo "Syncing REACT_APP_* variables to frontend/.env..."

CLIENT_ENV="$ROOT/frontend/.env"
mkdir -p "$(dirname "$CLIENT_ENV")"

# Extract REACT_APP_ variables and write to client/.env
if grep -q '^REACT_APP_' "$MASTER"; then
  grep '^REACT_APP_' "$MASTER" > "$CLIENT_ENV"
  echo -e "${GREEN}✓ Synced REACT_APP_* variables to client/.env${NC}"
  
  # Show what was synced
  echo ""
  echo "Client environment variables:"
  grep '^REACT_APP_' "$MASTER" | sed 's/^/  /' || true
else
  # Create empty client/.env if no REACT_APP_ vars
  > "$CLIENT_ENV"
  echo -e "${YELLOW}⚠ No REACT_APP_* variables found in master.env${NC}"
fi

# ===============================
# Step 5: Summary Report
# ===============================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Fitness Environment Sync Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Files synchronized:"
echo "  ✓ backend/.env (all variables)"
echo "  ✓ frontend/.env (REACT_APP_* only)"
echo ""
echo "Next steps:"
echo "  1. Verify the generated .env files"
echo "  2. Start the fitness backend: npm start (in backend/)"
echo "  3. Start the fitness frontend: npm start (in frontend/)"
echo ""
echo "Reminder:"
echo "  - Never commit: master.env, backend/.env, frontend/.env"
echo "  - Always run ./env-sync.sh after updating master.env"
echo "  - Update secrets before deploying to production"
echo ""
