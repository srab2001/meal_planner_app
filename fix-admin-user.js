#!/usr/bin/env node

const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function fixAdminUser() {
  try {
    console.log('\n🔧 Fixing admin user created via Google OAuth...\n');
    
    // Get all users with your email to see the situation
    const result = await pool.query(
      'SELECT id, email, google_id, role, created_at FROM users WHERE role IN ($1, $2) ORDER BY created_at DESC',
      ['admin', 'user']
    );
    
    console.log('📊 Current users:\n');
    result.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Google ID: ${user.google_id || 'NULL (manually created)'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.created_at}\n`);
    });
    
    // Find users with admin role and manually created (no google_id)
    const adminUsers = result.rows.filter(u => u.role === 'admin' && !u.google_id);
    const googleUsers = result.rows.filter(u => u.google_id);
    
    if (adminUsers.length === 0) {
      console.log('❌ No manually created admin users found\n');
      await pool.end();
      process.exit(0);
    }
    
    if (googleUsers.length === 0) {
      console.log('⚠️  No Google-authenticated users found\n');
      console.log('To fix this:');
      console.log('1. Log in via Google OAuth first');
      console.log('2. Then run this script again\n');
      await pool.end();
      process.exit(0);
    }
    
    const manualAdmin = adminUsers[0];
    const googleUser = googleUsers[0];
    
    console.log('🔍 Found:');
    console.log(`  • Manually created admin: ${manualAdmin.email} (${manualAdmin.id})`);
    console.log(`  • Google OAuth user: ${googleUser.email} (${googleUser.id})\n`);
    
    if (manualAdmin.email === googleUser.email) {
      console.log('✅ Both accounts have the same email!\n');
      console.log('Updating Google user to admin...\n');
      
      // Update the Google user to be admin
      await pool.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        ['admin', googleUser.id]
      );
      
      console.log('✅ Google user promoted to admin!\n');
      
      // Delete the duplicate manual admin
      console.log('Cleaning up duplicate manual admin user...\n');
      await pool.query(
        'DELETE FROM users WHERE id = $1',
        [manualAdmin.id]
      );
      
      console.log('✅ Duplicate removed!\n');
      
      // Show final state
      const updated = await pool.query(
        'SELECT id, email, google_id, role FROM users WHERE email = $1',
        [googleUser.email]
      );
      
      console.log('✅ FIXED! Final user state:\n');
      const user = updated.rows[0];
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Google ID: ${user.google_id ? '✅ Connected' : '❌ Not connected'}\n`);
      
      console.log('🎉 You should now see the Admin button when you log in!\n');
    } else {
      console.log('⚠️  Email mismatch between manually created and Google user\n');
      console.log(`Manual admin: ${manualAdmin.email}`);
      console.log(`Google user: ${googleUser.email}\n`);
      console.log('Please choose an option:\n');
      console.log('Option 1: Manually run this SQL:');
      console.log(`  UPDATE users SET role = 'admin' WHERE id = '${googleUser.id}';`);
      console.log(`  DELETE FROM users WHERE id = '${manualAdmin.id}';\n`);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixAdminUser();
