#!/bin/bash

##############################################################################
# populate-openai-key.sh
# 
# Simple script to populate or update OPENAI_API_KEY in .env file
# Usage: ./populate-openai-key.sh [API_KEY]
#
# Examples:
#   Interactive: ./populate-openai-key.sh
#   Direct: ./populate-openai-key.sh sk-proj-your-key-here
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"

# Function to print colored output
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  print_error ".env file not found at: $ENV_FILE"
  echo ""
  echo "Please ensure you're running this script from the project root directory"
  echo "where the .env file is located."
  exit 1
fi

print_info "OpenAI API Key Populator"
echo "================================================"

# Check if key was provided as argument
if [ -z "$1" ]; then
  # Interactive mode
  echo ""
  echo "No API key provided as argument."
  echo ""
  echo "Options:"
  echo "  1. Enter API key interactively (recommended)"
  echo "  2. Exit"
  echo ""
  read -p "Choose option (1-2): " choice
  
  if [ "$choice" != "1" ]; then
    print_info "Exiting without changes"
    exit 0
  fi
  
  echo ""
  read -s -p "Enter your OpenAI API key: " API_KEY
  echo ""
else
  API_KEY="$1"
fi

# Validate API key format
if [ -z "$API_KEY" ]; then
  print_error "API key cannot be empty"
  exit 1
fi

# Validate key starts with sk-
if [[ ! "$API_KEY" =~ ^sk- ]]; then
  print_warning "API key doesn't start with 'sk-'"
  print_warning "OpenAI keys typically start with 'sk-proj-' (newer) or 'sk-' (older)"
  read -p "Continue anyway? (y/n): " confirm
  if [ "$confirm" != "y" ]; then
    print_info "Exiting without changes"
    exit 0
  fi
fi

echo ""
print_info "Updating .env file..."
echo ""

# Check if OPENAI_API_KEY already exists
if grep -q "^OPENAI_API_KEY=" "$ENV_FILE"; then
  # Key exists, replace it
  print_info "OPENAI_API_KEY already exists in .env"
  
  # Create backup
  BACKUP_FILE="$ENV_FILE.backup.$(date +%s)"
  cp "$ENV_FILE" "$BACKUP_FILE"
  print_success "Backup created: $(basename "$BACKUP_FILE")"
  
  # Update the key (handle both Mac and Linux sed)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$API_KEY|" "$ENV_FILE"
  else
    # Linux
    sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$API_KEY|" "$ENV_FILE"
  fi
  
  print_success "OPENAI_API_KEY updated in .env"
else
  # Key doesn't exist, add it
  print_info "OPENAI_API_KEY not found in .env"
  
  # Create backup
  BACKUP_FILE="$ENV_FILE.backup.$(date +%s)"
  cp "$ENV_FILE" "$BACKUP_FILE"
  print_success "Backup created: $(basename "$BACKUP_FILE")"
  
  # Add the key after FRONTEND_BASE or at the end
  if grep -q "^FRONTEND_BASE=" "$ENV_FILE"; then
    # Insert after FRONTEND_BASE
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "/^FRONTEND_BASE=/a\\
OPENAI_API_KEY=$API_KEY
" "$ENV_FILE"
    else
      sed -i "/^FRONTEND_BASE=/a OPENAI_API_KEY=$API_KEY" "$ENV_FILE"
    fi
  else
    # Append to end of file
    echo "OPENAI_API_KEY=$API_KEY" >> "$ENV_FILE"
  fi
  
  print_success "OPENAI_API_KEY added to .env"
fi

echo ""
print_info "Verification:"
echo ""

# Show the key (masked for security)
STORED_KEY=$(grep "^OPENAI_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)
MASKED_KEY="${STORED_KEY:0:20}...${STORED_KEY: -10}"

echo "Key stored: $MASKED_KEY"
echo "Key length: ${#STORED_KEY} characters"
echo ""

# Check syntax
if grep -q "^OPENAI_API_KEY=[a-zA-Z0-9_-]*$" "$ENV_FILE"; then
  print_success "Key format looks valid"
else
  print_warning "Key format might have issues, please verify manually"
fi

echo ""
print_success "Done!"
echo ""
echo "Next steps:"
echo "  1. The key is ready for local development"
echo "  2. For production (Render), update the Environment variable:"
echo "     https://dashboard.render.com > meal-planner-app-mve2 > Settings > Environment"
echo "  3. Test with: npm start"
echo ""
