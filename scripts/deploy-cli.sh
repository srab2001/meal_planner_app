#!/bin/bash
#
# Meal Planner App - Deployment CLI
# Usage: ./scripts/deploy-cli.sh [command]
#
# Commands:
#   git-status    - Show git status and recent commits
#   git-push      - Add, commit, and push changes
#   db-migrate    - Run database migrations
#   db-seed       - Seed interview questions
#   db-status     - Check database connection
#   env-check     - Verify environment variables
#   deploy-all    - Full deployment (git + migrations + seed)
#   help          - Show this help message
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if exists
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

# Helper functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Commands
cmd_help() {
    cat << 'EOF'
Meal Planner App - Deployment CLI

Usage: ./scripts/deploy-cli.sh [command] [options]

Commands:
  git-status          Show git status, branch, and recent commits
  git-push [message]  Add all changes, commit with message, and push
  git-sync            Pull latest changes and push local commits

  db-migrate          Run all pending database migrations
  db-seed             Seed fitness interview questions
  db-status           Check database connection and table counts
  db-reset-questions  Reset and re-seed interview questions

  env-check           Verify all required environment variables
  env-show            Show current environment configuration (masked)

  deploy-all          Full deployment: git push + migrations + seed

  urls                Show all deployment URLs
  health              Check health of all endpoints

Options:
  -h, --help          Show this help message
  -v, --verbose       Verbose output
  -y, --yes           Skip confirmation prompts

Examples:
  ./scripts/deploy-cli.sh git-push "fix: update interview questions"
  ./scripts/deploy-cli.sh db-migrate
  ./scripts/deploy-cli.sh deploy-all

EOF
}

cmd_git_status() {
    print_header "Git Status"

    echo -e "${YELLOW}Branch:${NC}"
    git -C "$PROJECT_DIR" branch -v
    echo ""

    echo -e "${YELLOW}Status:${NC}"
    git -C "$PROJECT_DIR" status -s
    echo ""

    echo -e "${YELLOW}Recent Commits:${NC}"
    git -C "$PROJECT_DIR" log --oneline -5
    echo ""

    echo -e "${YELLOW}Remote Tracking:${NC}"
    git -C "$PROJECT_DIR" branch -vv | grep "^\*"
}

cmd_git_push() {
    print_header "Git Push"

    local message="${1:-Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')}"

    # Check for changes
    if git -C "$PROJECT_DIR" diff --quiet && git -C "$PROJECT_DIR" diff --cached --quiet; then
        if [ -z "$(git -C "$PROJECT_DIR" ls-files --others --exclude-standard)" ]; then
            print_warning "No changes to commit"
            return 0
        fi
    fi

    echo -e "${YELLOW}Changes to be committed:${NC}"
    git -C "$PROJECT_DIR" status -s
    echo ""

    # Confirm
    if [ "$SKIP_CONFIRM" != "true" ]; then
        read -p "Commit with message: \"$message\"? [y/N] " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            print_warning "Aborted"
            return 1
        fi
    fi

    # Add, commit, push
    git -C "$PROJECT_DIR" add -A
    git -C "$PROJECT_DIR" commit -m "$message"

    local branch=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD)
    git -C "$PROJECT_DIR" push -u origin "$branch"

    print_success "Pushed to origin/$branch"
}

cmd_git_sync() {
    print_header "Git Sync"

    local branch=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD)

    print_info "Fetching from origin..."
    git -C "$PROJECT_DIR" fetch origin

    print_info "Pulling latest changes..."
    git -C "$PROJECT_DIR" pull origin "$branch" --rebase || true

    print_info "Pushing local commits..."
    git -C "$PROJECT_DIR" push -u origin "$branch"

    print_success "Synced with origin/$branch"
}

cmd_db_status() {
    print_header "Database Status"

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        echo "Set it with: export DATABASE_URL=postgres://..."
        return 1
    fi

    print_info "Checking connection..."

    # Test connection and get table counts
    psql "$DATABASE_URL" -c "
        SELECT 'Connection' as check, 'OK' as status
        UNION ALL
        SELECT 'Users', COUNT(*)::text FROM users
        UNION ALL
        SELECT 'Fitness Questions', COUNT(*)::text FROM fitness_interview_questions
        UNION ALL
        SELECT 'Fitness Options', COUNT(*)::text FROM fitness_interview_options
        UNION ALL
        SELECT 'Fitness Responses', COUNT(*)::text FROM fitness_interview_responses
        UNION ALL
        SELECT 'Workout Plans', COUNT(*)::text FROM workout_plans
    " 2>/dev/null && print_success "Database connected" || print_error "Database connection failed"
}

cmd_db_migrate() {
    print_header "Database Migrations"

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        return 1
    fi

    local migrations_dir="$PROJECT_DIR/migrations"

    if [ ! -d "$migrations_dir" ]; then
        print_error "Migrations directory not found: $migrations_dir"
        return 1
    fi

    print_info "Running migrations..."

    for migration in $(ls "$migrations_dir"/*.sql 2>/dev/null | sort); do
        local name=$(basename "$migration")
        echo -n "  Running $name... "
        if psql "$DATABASE_URL" -f "$migration" > /dev/null 2>&1; then
            echo -e "${GREEN}OK${NC}"
        else
            echo -e "${YELLOW}SKIP/ERROR${NC}"
        fi
    done

    print_success "Migrations complete"
}

cmd_db_seed() {
    print_header "Seed Interview Questions"

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        return 1
    fi

    local seed_script="$PROJECT_DIR/scripts/seed-fitness-interview.js"

    if [ ! -f "$seed_script" ]; then
        print_error "Seed script not found: $seed_script"
        return 1
    fi

    print_info "Running seed script..."
    cd "$PROJECT_DIR" && node "$seed_script"

    print_success "Seeding complete"
}

cmd_db_reset_questions() {
    print_header "Reset Interview Questions"

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        return 1
    fi

    if [ "$SKIP_CONFIRM" != "true" ]; then
        read -p "This will DELETE all interview questions and re-seed. Continue? [y/N] " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            print_warning "Aborted"
            return 1
        fi
    fi

    print_info "Deleting existing questions..."
    psql "$DATABASE_URL" -c "DELETE FROM fitness_interview_options; DELETE FROM fitness_interview_questions;" 2>/dev/null

    cmd_db_seed
}

cmd_env_check() {
    print_header "Environment Check"

    local required_vars=(
        "DATABASE_URL"
        "OPENAI_API_KEY"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "JWT_SECRET"
    )

    local optional_vars=(
        "FRONTEND_BASE"
        "FITNESS_FRONTEND_URL"
        "NODE_ENV"
        "PORT"
    )

    echo -e "${YELLOW}Required Variables:${NC}"
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            print_success "$var is set"
        else
            print_error "$var is NOT set"
        fi
    done

    echo ""
    echo -e "${YELLOW}Optional Variables:${NC}"
    for var in "${optional_vars[@]}"; do
        if [ -n "${!var}" ]; then
            print_success "$var = ${!var:0:30}..."
        else
            print_warning "$var is not set"
        fi
    done
}

cmd_env_show() {
    print_header "Environment Configuration"

    echo -e "${YELLOW}Database:${NC}"
    if [ -n "$DATABASE_URL" ]; then
        echo "  DATABASE_URL = postgres://****:****@${DATABASE_URL#*@}"
    else
        echo "  DATABASE_URL = (not set)"
    fi

    echo ""
    echo -e "${YELLOW}Frontend:${NC}"
    echo "  FRONTEND_BASE = ${FRONTEND_BASE:-"(not set)"}"
    echo "  FITNESS_FRONTEND_URL = ${FITNESS_FRONTEND_URL:-"(not set)"}"

    echo ""
    echo -e "${YELLOW}API Keys:${NC}"
    if [ -n "$OPENAI_API_KEY" ]; then
        echo "  OPENAI_API_KEY = sk-****${OPENAI_API_KEY: -4}"
    else
        echo "  OPENAI_API_KEY = (not set)"
    fi

    if [ -n "$GOOGLE_CLIENT_ID" ]; then
        echo "  GOOGLE_CLIENT_ID = ${GOOGLE_CLIENT_ID:0:20}..."
    else
        echo "  GOOGLE_CLIENT_ID = (not set)"
    fi
}

cmd_urls() {
    print_header "Deployment URLs"

    echo -e "${YELLOW}Main App:${NC}"
    echo "  Frontend: https://meal-planner-gold-one.vercel.app"
    echo "  Backend:  https://meal-planner-app-mve2.onrender.com"

    echo ""
    echo -e "${YELLOW}Fitness App:${NC}"
    echo "  Frontend: https://frontend-hbmyufqu1-stus-projects-458dd35a.vercel.app"
    echo "  API:      https://meal-planner-app-mve2.onrender.com/api/fitness-interview"

    echo ""
    echo -e "${YELLOW}Admin:${NC}"
    echo "  Questions API: https://meal-planner-app-mve2.onrender.com/api/admin/fitness-interview/questions"
}

cmd_health() {
    print_header "Health Check"

    local endpoints=(
        "https://meal-planner-app-mve2.onrender.com/health"
        "https://meal-planner-gold-one.vercel.app"
    )

    for url in "${endpoints[@]}"; do
        echo -n "  Checking $url... "
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            echo -e "${GREEN}OK${NC}"
        else
            echo -e "${RED}FAIL${NC}"
        fi
    done
}

cmd_deploy_all() {
    print_header "Full Deployment"

    print_info "Step 1: Git Push"
    cmd_git_push "${1:-deploy: full deployment $(date '+%Y-%m-%d')}"

    print_info "Step 2: Database Migrations"
    cmd_db_migrate

    print_info "Step 3: Seed Questions"
    cmd_db_seed

    print_success "Deployment complete!"
    echo ""
    cmd_urls
}

# Parse arguments
SKIP_CONFIRM=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            cmd_help
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Main command dispatch
COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
    git-status)
        cmd_git_status
        ;;
    git-push)
        cmd_git_push "$@"
        ;;
    git-sync)
        cmd_git_sync
        ;;
    db-status)
        cmd_db_status
        ;;
    db-migrate)
        cmd_db_migrate
        ;;
    db-seed)
        cmd_db_seed
        ;;
    db-reset-questions)
        cmd_db_reset_questions
        ;;
    env-check)
        cmd_env_check
        ;;
    env-show)
        cmd_env_show
        ;;
    urls)
        cmd_urls
        ;;
    health)
        cmd_health
        ;;
    deploy-all)
        cmd_deploy_all "$@"
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo "Run './scripts/deploy-cli.sh help' for usage"
        exit 1
        ;;
esac
