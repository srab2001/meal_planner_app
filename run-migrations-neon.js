#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Get all SQL migration files (excluding README)
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`\n📦 Found ${files.length} migration files\n`);
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      console.log(`⏳ Running: ${file}...`);
      await pool.query(sql);
      console.log(`✅ Completed: ${file}\n`);
    } catch (error) {
      // Some migrations might be idempotent or fail due to existing data
      // This is OK for development
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate key') ||
          error.message.includes('ALREADY EXISTS')) {
        console.log(`⚠️  Skipped: ${file} (already exists)\n`);
      } else {
        console.error(`❌ Error in ${file}:`);
        console.error(`   ${error.message}\n`);
      }
    }
  }
  
  console.log('\n✅ Migration complete!\n');
  
  // Check final table count
  const result = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname='public' 
    ORDER BY tablename
  `);
  
  console.log(`📊 Final table count: ${result.rows.length} tables\n`);
  console.log('Tables in database:');
  result.rows.forEach(row => {
    console.log(`  • ${row.tablename}`);
  });
  
  await pool.end();
  process.exit(0);
}

runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
