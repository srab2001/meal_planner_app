#!/usr/bin/env node
/**
 * Migration Runner
 * Executes all SQL migration files in the migrations directory
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const migrationsDir = path.join(__dirname, '../migrations');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Running database migrations...');

    // Get all SQL files in migrations directory
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filepath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filepath, 'utf-8');

      try {
        console.log(`  📋 Running ${file}...`);
        await pool.query(sql);
        console.log(`  ✅ ${file} completed`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ℹ️  ${file} already exists, skipping`);
        } else {
          console.error(`  ❌ Error in ${file}:`, error.message);
          throw error;
        }
      }
    }

    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
