#!/bin/bash
# Fitness Database Migration Script
# Run this during Render deployment to apply fitness migrations

set -e  # Exit on error

echo "🔧 Running fitness database migrations..."

# Navigate to fitness directory
cd fitness

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "📊 Database: $DATABASE_URL"

# Run Prisma migrations
echo "🚀 Applying migrations..."
npx prisma migrate deploy

echo "✅ Fitness migrations complete!"

# Verify exercise count
echo "🔍 Verifying exercise count..."
EXERCISE_COUNT=$(npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) as count FROM exercise_definitions;
EOF
)

echo "📊 Exercises in database: $EXERCISE_COUNT"

if echo "$EXERCISE_COUNT" | grep -q "40"; then
  echo "✅ All 40 exercises verified!"
else
  echo "⚠️  Warning: Expected 40 exercises, found different count"
fi

echo "🎉 Migration script complete!"
