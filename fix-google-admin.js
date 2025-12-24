#!/usr/bin/env node

const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function fixAdminGoogle() {
  try {
    console.log('\n✅ Promoting your Google OAuth user to admin...\n');
    
    // Update the admin@mealplanner.com user (your Google OAuth user) to be admin
    const result = await pool.query(
      `UPDATE users 
       SET role = 'admin' 
       WHERE email = $1 AND google_id IS NOT NULL
       RETURNING id, email, google_id, role`,
      ['admin@mealplanner.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No Google OAuth user found with email admin@mealplanner.com\n');
    } else {
      const user = result.rows[0];
      console.log('✅ User promoted to admin!\n');
      console.log('Details:');
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Google Connected: ✅ Yes\n`);
    }
    
    // Now delete the manually created one (which is not used)
    const deleted = await pool.query(
      'DELETE FROM users WHERE email = $1 AND google_id IS NULL RETURNING email',
      ['asrab2001@gmail.com']
    );
    
    if (deleted.rows.length > 0) {
      console.log('🧹 Cleaned up duplicate manually created user\n');
    }
    
    // Show final admin users
    const allAdmins = await pool.query(
      `SELECT email, google_id, role FROM users 
       WHERE role = 'admin' 
       ORDER BY created_at DESC`
    );
    
    console.log('📊 Admin users now:\n');
    allAdmins.rows.forEach(user => {
      console.log(`  ✅ ${user.email} (Google: ${user.google_id ? 'Yes' : 'No'})`);
    });
    
    console.log('\n🎉 Ready to go! Log in with: admin@mealplanner.com\n');
    console.log('The Admin button should now appear when you log in!\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixAdminGoogle();
