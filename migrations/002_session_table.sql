-- Session Storage Table for connect-pg-simple
-- This allows sessions to persist across server restarts and work with multiple instances

-- Drop and recreate to ensure clean schema
DROP TABLE IF EXISTS "session" CASCADE;

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
)
WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Cleanup old sessions (optional but recommended)
-- This will be handled automatically by connect-pg-simple's pruneSessionInterval option
