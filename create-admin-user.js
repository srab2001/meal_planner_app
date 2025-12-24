#!/usr/bin/env node

const { Pool } = require('pg');
const crypto = require('crypto');

const connectionString = 'postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function createAdminUser() {
  try {
    console.log('\n👤 Creating admin user in Neon database...\n');
    
    const email = 'admin@mealplanner.com';
    const displayName = 'Admin User';
    const googleId = 'admin-' + crypto.randomBytes(8).toString('hex');
    
    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      console.log(`⚠️  User with email ${email} already exists\n`);
      console.log(`ID: ${existing.rows[0].id}\n`);
      await pool.end();
      process.exit(0);
    }
    
    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (email, display_name, google_id, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, status, created_at`,
      [email, displayName, googleId, 'admin', 'active']
    );
    
    const user = result.rows[0];
    
    console.log('✅ Admin user created successfully!\n');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Display Name: ${displayName}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Status: ${user.status}`);
    console.log(`  Created: ${user.created_at}\n`);
    
    console.log('📝 Next Steps:');
    console.log(`  1. Use this email to log in: ${email}`);
    console.log(`  2. Go to: https://meal-planner-gold-one.vercel.app`);
    console.log(`  3. Log in via Google (use this email)`);
    console.log(`  4. You should see an "Admin" button in the app switcher\n`);
    
    // Show other admin users
    const allAdmins = await pool.query(
      'SELECT id, email, display_name, role FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['admin']
    );
    
    console.log(`📊 Total admin users: ${allAdmins.rows.length}\n`);
    if (allAdmins.rows.length > 0) {
      console.log('Admin users:');
      allAdmins.rows.forEach(admin => {
        console.log(`  • ${admin.email} (${admin.display_name})`);
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

createAdminUser();
