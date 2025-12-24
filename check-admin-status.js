#!/usr/bin/env node

const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function checkAdminStatus() {
  try {
    console.log('\n🔍 Checking admin user status...\n');
    
    // Get all users
    const result = await pool.query(
      `SELECT id, email, google_id, role, status, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    
    console.log(`📊 Total users: ${result.rows.length}\n`);
    console.log('Users in database:\n');
    
    result.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role} ${user.role === 'admin' ? '✅ ADMIN' : ''}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Google Connected: ${user.google_id ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.created_at}\n`);
    });
    
    // Count admins
    const admins = result.rows.filter(u => u.role === 'admin');
    console.log(`Admin users: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`  • ${admin.email} (${admin.status})`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAdminStatus();
