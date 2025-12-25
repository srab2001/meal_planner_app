#!/bin/bash

# Environment Variables Verification Script
# For Fitness App v2.0.0 Deployment

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔐 Environment Variables Verification${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ========================================
# LOCAL ENVIRONMENT CHECK
# ========================================

echo -e "${CYAN}📍 LOCAL ENVIRONMENT:${NC}"
echo ""

# Check for .env file
if [[ -f ".env" ]]; then
  echo -e "  ${GREEN}✓${NC} .env file exists"

  # Check for specific variables (without showing values)
  if grep -q "DATABASE_URL" .env 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} DATABASE_URL is set"
  else
    echo -e "  ${RED}✗${NC} DATABASE_URL is NOT set"
  fi

  if grep -q "FITNESS_DATABASE_URL" .env 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} FITNESS_DATABASE_URL is set"
  else
    echo -e "  ${RED}✗${NC} FITNESS_DATABASE_URL is NOT set"
  fi

  if grep -q "OPENAI_API_KEY" .env 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} OPENAI_API_KEY is set"
  else
    echo -e "  ${RED}✗${NC} OPENAI_API_KEY is NOT set"
  fi
else
  echo -e "  ${YELLOW}⚠${NC}  .env file not found (expected for deployment)"
fi

echo ""

# ========================================
# RENDER BACKEND VARIABLES
# ========================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📌 RENDER (Backend) Environment Variables${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'
Service: meal-planner-app-mve2.onrender.com
Location: https://dashboard.render.com → Select Service → Environment

REQUIRED VARIABLES:

1. FITNESS_DATABASE_URL
   Value: postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   Purpose: Neon PostgreSQL database connection

2. OPENAI_API_KEY
   Value: [Use your OpenAI API key from Render environment variables]
   Purpose: OpenAI API for AI Coach workout generation

3. SESSION_SECRET
   Value: d8daa69d6b1d30c89a171dccf97ea700fdf285f139affcc2b37c1a45294f7302
   Purpose: Session signing secret

4. NODE_ENV
   Value: production
   Purpose: Set Node.js to production mode

EOF

read -p "Have you verified all 4 Render variables are set? (y/n): " RENDER_OK

if [[ "$RENDER_OK" == "y" || "$RENDER_OK" == "yes" ]]; then
  echo -e "${GREEN}✅ Render variables confirmed${NC}"
else
  echo -e "${RED}❌ Please set Render variables before deploying${NC}"
  exit 1
fi

echo ""

# ========================================
# VERCEL FRONTEND VARIABLES
# ========================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📌 VERCEL (Frontend) Environment Variables${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'
Project: meal-planner-gold-one.vercel.app
Location: https://vercel.com/dashboard → Select Project → Settings → Environment Variables

REQUIRED VARIABLES:

1. REACT_APP_FITNESS_API_URL
   Value: https://meal-planner-app-mve2.onrender.com
   Purpose: Backend API base URL
   Environment: Production, Preview, Development

2. REACT_APP_GOOGLE_CLIENT_ID
   Value: 772766863605-p5uqeeh3jlemcml92k1k72duh9bpgtl6.apps.googleusercontent.com
   Purpose: Google OAuth authentication
   Environment: Production, Preview, Development

IMPORTANT: Ensure both variables are set for ALL environments (Production, Preview, Development)

EOF

read -p "Have you verified all 2 Vercel variables are set? (y/n): " VERCEL_OK

if [[ "$VERCEL_OK" == "y" || "$VERCEL_OK" == "yes" ]]; then
  echo -e "${GREEN}✅ Vercel variables confirmed${NC}"
else
  echo -e "${RED}❌ Please set Vercel variables before deploying${NC}"
  exit 1
fi

echo ""

# ========================================
# VERCEL BUILD SETTINGS
# ========================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📦 VERCEL Build Settings${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'
Location: https://vercel.com/dashboard → Select Project → Settings → General

BUILD SETTINGS:

Framework Preset: Create React App (or Vite if detected)

Build Command:
  cd fitness/frontend && npm run build

Output Directory:
  fitness/frontend/build
  (or fitness/frontend/dist if using Vite)

Install Command:
  cd fitness/frontend && npm install

Root Directory:
  . (leave as repository root, NOT fitness/frontend)

Node.js Version: 18.x or 20.x

EOF

read -p "Have you verified Vercel build settings? (y/n): " BUILD_OK

if [[ "$BUILD_OK" == "y" || "$BUILD_OK" == "yes" ]]; then
  echo -e "${GREEN}✅ Vercel build settings confirmed${NC}"
else
  echo -e "${YELLOW}⚠️  Please verify Vercel build settings${NC}"
fi

echo ""

# ========================================
# SUMMARY
# ========================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Environment Variables Verification Complete${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}Summary:${NC}"
echo -e "  ✓ Render: 4 variables confirmed"
echo -e "  ✓ Vercel: 2 variables confirmed"
echo -e "  ✓ Vercel: Build settings confirmed"
echo ""

echo -e "${CYAN}Next Step:${NC}"
echo -e "  Run: ${YELLOW}./deploy.sh${NC}"
echo ""

exit 0
