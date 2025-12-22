#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "[1] Preconditions"
test -f server.js || { echo "FAIL: server.js missing"; exit 1; }
test -f prisma/schema.prisma || { echo "FAIL: prisma/schema.prisma missing"; exit 1; }
test -f package.json || { echo "FAIL: package.json missing"; exit 1; }

echo "[2] Backup server.js"
cp server.js "server.js.bak.$(date +%Y%m%d_%H%M%S)"

echo "[3] Ensure Prisma deps"
npm ls @prisma/client >/dev/null 2>&1 || npm i @prisma/client
npm ls prisma >/dev/null 2>&1 || npm i -D prisma

echo "[4] Insert Prisma client into server.js"

PRISMA_IMPORT="const { PrismaClient } = require('@prisma/client');"
PRISMA_INIT="const prisma = new PrismaClient();"

grep -q "@prisma/client" server.js || \
  perl -0777 -i -pe "s|(require\\('dotenv'\\)\\.config\\(\\);)|\\1\n\n$PRISMA_IMPORT\n$PRISMA_INIT|s" server.js

echo "[5] Add Prisma shutdown handler"

grep -q 'prisma.\$disconnect' server.js || cat >> server.js <<'EOF'

process.on('SIGINT', async () => {
  try {
    await prisma.$disconnect();
  } catch (_) {}
  process.exit(0);
});
EOF

echo "[6] Add Prisma DB health route"

grep -q "/api/health/db" server.js || cat >> server.js <<'EOF'

app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});
EOF

echo "[7] Validate Prisma"
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma

echo "[8] Syntax check server.js"
node -c server.js

echo "OK: Prisma baseline applied"
