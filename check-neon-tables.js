#!/usr/bin/env node

const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

(async () => {
  try {
    console.log('Connecting to Neon database...\n');
    
    // Get all tables
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname='public' 
      ORDER BY tablename
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ NO TABLES FOUND in public schema\n');
    } else {
      console.log('✅ Tables found in Neon database:\n');
      result.rows.forEach(row => {
        console.log(`  • ${row.tablename}`);
      });
    }
    
    // Check if users table exists
    const usersCheck = await pool.query(`
      SELECT EXISTS(
        SELECT FROM information_schema.tables 
        WHERE table_schema='public' 
        AND table_name='users'
      );
    `);
    
    const usersTableExists = usersCheck.rows[0].exists;
    console.log(`\n🔍 Users table exists: ${usersTableExists ? '✅ YES' : '❌ NO'}`);
    
    if (usersTableExists) {
      // Show users table structure
      const structure = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable 
        FROM information_schema.columns 
        WHERE table_name='users'
        ORDER BY ordinal_position
      `);
      
      console.log('\nUsers table structure:');
      structure.rows.forEach(col => {
        console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
