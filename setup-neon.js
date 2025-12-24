#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function setupNeon() {
  try {
    console.log('\n🔧 Setting up Neon database with users table...\n');
    
    const sql = fs.readFileSync('./neon-setup.sql', 'utf8');
    
    // Split by semicolons and run each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
        const tableName = statement.match(/CREATE TABLE.*?(\w+)/i)?.[1] || 'unnamed';
        console.log(`✅ ${tableName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          const tableName = statement.match(/CREATE TABLE.*?(\w+)/i)?.[1] || 'unnamed';
          console.log(`⚠️  ${tableName} (already exists)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Database setup complete!\n');
    
    // Verify tables
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname='public' 
      ORDER BY tablename
    `);
    
    console.log(`📊 Tables in database (${result.rows.length}):\n`);
    result.rows.forEach(row => {
      console.log(`  • ${row.tablename}`);
    });
    
    // Check specifically for users table
    const usersCheck = await pool.query(`
      SELECT EXISTS(
        SELECT FROM information_schema.tables 
        WHERE table_name='users'
      );
    `);
    
    if (usersCheck.rows[0].exists) {
      console.log('\n✅ Users table is ready!\n');
      
      // Show users table structure
      const structure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name='users'
        ORDER BY ordinal_position
      `);
      
      console.log('Users table columns:');
      structure.rows.forEach(col => {
        console.log(`  • ${col.column_name}: ${col.data_type}`);
      });
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setupNeon();
