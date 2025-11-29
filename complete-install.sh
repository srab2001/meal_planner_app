#!/bin/bash

# ============================================
# MASTER INSTALLATION SCRIPT
# Runs from ~/Downloads folder
# Installs everything to your mealsapp project
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }
print_step() { echo -e "${BLUE}▶ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

echo "=============================================="
echo "   AI Meal Planner - Complete Installation"
echo "   Phases 1-3 Implementation"
echo "=============================================="
echo ""

# Default to the path you showed me
DEFAULT_PATH="/Users/stuartrabinowitz/Library/Mobile Documents/com~apple~CloudDocs/mealsapp"

if [ -z "$1" ]; then
    print_info "No path provided, using default path"
    PROJECT_DIR="$DEFAULT_PATH"
    echo ""
    read -p "Is this correct? (Y/n): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        echo ""
        echo "Please provide the path to your mealsapp directory:"
        read -p "Path: " PROJECT_DIR
    fi
else
    PROJECT_DIR="$1"
fi

echo ""
print_info "Project directory: $PROJECT_DIR"

# Check if project exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Directory not found: $PROJECT_DIR"
    echo ""
    echo "Please enter the correct path to your mealsapp project"
    exit 1
fi

if [ ! -f "$PROJECT_DIR/server.js" ]; then
    print_error "server.js not found in: $PROJECT_DIR"
    echo ""
    echo "Are you sure this is your mealsapp directory?"
    exit 1
fi

print_success "Found mealsapp project"
echo ""

# Get the directory where THIS script is located (should be ~/Downloads)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
print_info "Running from: $SCRIPT_DIR"
echo ""

# Check if other scripts exist
if [ ! -f "$SCRIPT_DIR/create-backend-files.sh" ]; then
    print_error "create-backend-files.sh not found in: $SCRIPT_DIR"
    echo ""
    echo "Please make sure all scripts are in the same folder:"
    echo "  • complete-install.sh"
    echo "  • create-backend-files.sh"
    echo "  • create-frontend-files.sh"
    echo "  • update-server.sh"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/create-frontend-files.sh" ]; then
    print_error "create-frontend-files.sh not found in: $SCRIPT_DIR"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/update-server.sh" ]; then
    print_error "update-server.sh not found in: $SCRIPT_DIR"
    exit 1
fi

print_success "All installation scripts found"
echo ""

# Make sure scripts are executable
chmod +x "$SCRIPT_DIR/create-backend-files.sh"
chmod +x "$SCRIPT_DIR/create-frontend-files.sh"
chmod +x "$SCRIPT_DIR/update-server.sh"

print_info "Ready to install!"
echo ""
echo "This will:"
echo "  1. Create backend scraper files"
echo "  2. Update server.js with new endpoints"
echo "  3. Create frontend React components"
echo "  4. Backup your existing files"
echo ""
read -p "Continue? (Y/n): " continue_install

if [[ "$continue_install" =~ ^[Nn]$ ]]; then
    echo "Installation cancelled"
    exit 0
fi

# ============================================
# STEP 1: Create backend files
# ============================================
echo ""
echo "=============================================="
print_step "STEP 1/3: Creating backend files..."
echo "=============================================="
echo ""

"$SCRIPT_DIR/create-backend-files.sh" "$PROJECT_DIR"

if [ $? -eq 0 ]; then
    print_success "Backend files created"
else
    print_error "Failed to create backend files"
    exit 1
fi

# ============================================
# STEP 2: Update server.js
# ============================================
echo ""
echo "=============================================="
print_step "STEP 2/3: Updating server.js..."
echo "=============================================="
echo ""

"$SCRIPT_DIR/update-server.sh" "$PROJECT_DIR"

if [ $? -eq 0 ]; then
    print_success "server.js updated"
else
    print_error "Failed to update server.js"
    exit 1
fi

# ============================================
# STEP 3: Create frontend files
# ============================================
echo ""
echo "=============================================="
print_step "STEP 3/3: Creating frontend components..."
echo "=============================================="
echo ""

"$SCRIPT_DIR/create-frontend-files.sh" "$PROJECT_DIR"

if [ $? -eq 0 ]; then
    print_success "Frontend components created"
else
    print_error "Failed to create frontend components"
    exit 1
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "=============================================="
echo "=============================================="
print_success "✨ INSTALLATION COMPLETE!"
echo "=============================================="
echo "=============================================="
echo ""

echo "📦 What was installed:"
echo "  ✓ Backend scraper files (4 files in scrapers/)"
echo "  ✓ Updated server.js with new endpoints"
echo "  ✓ Frontend ZIP code component"
echo "  ✓ Frontend store selection component"
echo ""

echo "📂 Files created:"
echo "  Backend:"
echo "    • scrapers/price-cache.js"
echo "    • scrapers/base-scraper.js"
echo "    • scrapers/harris-teeter-scraper.js"
echo "    • scrapers/pdf-parser.js"
echo ""
echo "  Frontend:"
echo "    • client/src/components/ZIPCodeInput.js"
echo "    • client/src/components/ZIPCodeInput.css"
echo "    • client/src/components/StoreSelection.js"
echo "    • client/src/components/StoreSelection.css"
echo ""
echo "  Updated:"
echo "    • server.js (added endpoints)"
echo ""

echo "💾 Backups created in:"
ls -d "$PROJECT_DIR"/backup_* 2>/dev/null | tail -1 || echo "  (no previous backups)"
echo ""

echo "=============================================="
print_info "⚠️  ONE MANUAL STEP REQUIRED"
echo "=============================================="
echo ""
echo "You need to update App.js to add the new flow."
echo ""
echo "📖 Complete guide available at:"
echo "   $SCRIPT_DIR/UPDATE_APP_JS_GUIDE.md"
echo ""
echo "Or open it now:"
echo "   open $SCRIPT_DIR/UPDATE_APP_JS_GUIDE.md"
echo ""

echo "Quick summary of App.js changes:"
echo "  1. Add 2 imports (ZIPCodeInput, StoreSelection)"
echo "  2. Add 3 state variables (zipCode, stores, selectedStore)"
echo "  3. Add 3 handler functions"
echo "  4. Add 2 new JSX sections"
echo "  5. Update existing functions"
echo ""

echo "=============================================="
print_info "🧪 TESTING"
echo "=============================================="
echo ""
echo "After updating App.js, test with:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd \"$PROJECT_DIR\""
echo "  npm start"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd \"$PROJECT_DIR/client\""
echo "  npm start"
echo ""

echo "Expected flow:"
echo "  1. Login page"
echo "  2. ZIP code page (NEW!)"
echo "  3. Store selection page (NEW!)"
echo "  4. Questionnaire"
echo "  5. Meal plan generation"
echo ""

echo "=============================================="
print_info "📚 DOCUMENTATION"
echo "=============================================="
echo ""
echo "Available in $SCRIPT_DIR:"
echo "  • UPDATE_APP_JS_GUIDE.md - App.js update instructions"
echo "  • PHASE_1_IMPLEMENTATION.md - Detailed implementation"
echo "  • COMPLETE_INSTALLATION_README.md - Full reference"
echo ""

echo "=============================================="
print_success "✨ Installation successful!"
echo "=============================================="
echo ""
echo "Next step: Update App.js using UPDATE_APP_JS_GUIDE.md"
echo ""
