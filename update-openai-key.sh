#!/bin/bash

# ============================================================
# OpenAI API Key Update Script
# ============================================================
#
# This script updates your OpenAI API key in all necessary files
#
# USAGE:
#   chmod +x update-openai-key.sh
#   ./update-openai-key.sh sk-proj-your-actual-key-here
#
# ============================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# Get the API key from command line argument
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ ERROR: No OpenAI API key provided${NC}"
    echo ""
    echo "Usage:"
    echo "  ./update-openai-key.sh <your-openai-api-key>"
    echo ""
    echo "Example:"
    echo "  ./update-openai-key.sh sk-proj-xyz123..."
    echo ""
    echo "Get your key from: https://platform.openai.com/api-keys"
    exit 1
fi

NEW_KEY="$1"

# Validate key format
if [[ ! "$NEW_KEY" =~ ^sk-proj- ]]; then
    echo -e "${YELLOW}⚠️  WARNING: API key doesn't start with 'sk-proj-'${NC}"
    echo "OpenAI keys typically start with 'sk-proj-' (newer) or 'sk-' (older)"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 1
    fi
fi

echo -e "${BLUE}🔑 OpenAI API Key Update Script${NC}"
echo "════════════════════════════════════════════════════"
echo ""

# Determine the script directory (where this script is located)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Files to update
ENV_FILE="$SCRIPT_DIR/.env"
FITNESS_ENV_FILE="$SCRIPT_DIR/fitness/.env"
RENDER_CONFIG="$SCRIPT_DIR/render.yaml"

# Counter for updated files
UPDATED_COUNT=0

# Function to update a file
update_file() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⊘ SKIPPED: $description${NC}"
        echo "  File not found: $file"
        echo ""
        return
    fi
    
    # Create backup
    BACKUP_FILE="${file}.backup.$(date +%s)"
    cp "$file" "$BACKUP_FILE"
    echo -e "${BLUE}📦 Backup created:${NC} $(basename "$BACKUP_FILE")"
    
    # Update the file
    if grep -q "OPENAI_API_KEY" "$file"; then
        # Replace existing key or placeholder
        if [[ "$file" == *".yaml" ]]; then
            # For YAML files
            sed -i.tmp "s|OPENAI_API_KEY: .*|OPENAI_API_KEY: ${NEW_KEY}|g" "$file"
            rm -f "${file}.tmp"
        else
            # For .env files
            sed -i.tmp "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=${NEW_KEY}|g" "$file"
            rm -f "${file}.tmp"
        fi
        
        echo -e "${GREEN}✅ UPDATED: $description${NC}"
        echo "  File: $(basename "$file")"
        UPDATED_COUNT=$((UPDATED_COUNT + 1))
    else
        echo -e "${YELLOW}⊘ SKIPPED: $description${NC}"
        echo "  OPENAI_API_KEY not found in file"
    fi
    echo ""
}

# Update main .env file
echo -e "${BLUE}1. Main Environment File${NC}"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  $ENV_FILE not found - creating from template...${NC}"
    if [ -f "$SCRIPT_DIR/env-template.txt" ]; then
        cp "$SCRIPT_DIR/env-template.txt" "$ENV_FILE"
        echo -e "${GREEN}✅ Created .env file from template${NC}"
    else
        echo -e "${RED}❌ ERROR: env-template.txt not found${NC}"
        exit 1
    fi
fi
update_file "$ENV_FILE" "Main .env file (meal planner)"

# Update fitness .env file
echo -e "${BLUE}2. Fitness Backend Environment File${NC}"
update_file "$FITNESS_ENV_FILE" "Fitness backend .env file"

# Update render.yaml
echo -e "${BLUE}3. Render Configuration File${NC}"
update_file "$RENDER_CONFIG" "Render deployment config (render.yaml)"

# Summary
echo "════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✨ Update Complete!${NC}"
echo ""
echo "Files updated: $UPDATED_COUNT"
echo ""

if [ $UPDATED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ OpenAI API key successfully updated${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your server: npm start"
    echo "  2. Test the API: curl http://localhost:5000/api/health"
    echo ""
    echo "Backups created for all updated files:"
    echo "  (filename.backup.TIMESTAMP)"
    echo ""
    echo "To restore from backup:"
    echo "  mv filename.backup.TIMESTAMP filename"
else
    echo -e "${YELLOW}⚠️  No files were updated${NC}"
    echo "Possible reasons:"
    echo "  • Required environment files don't exist yet"
    echo "  • OPENAI_API_KEY not found in files"
    echo ""
    echo "You can manually update:"
    echo "  • $ENV_FILE"
    echo "  • $FITNESS_ENV_FILE (if it exists)"
    echo "  • $RENDER_CONFIG (if needed for deployment)"
fi

echo ""
echo "Need help?"
echo "  • View your keys: https://platform.openai.com/api-keys"
echo "  • API status: https://status.openai.com"
echo ""
