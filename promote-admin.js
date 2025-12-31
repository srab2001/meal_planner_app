#!/usr/bin/env node

const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function promoteToAdmin() {
  const targetEmail = 'asrab2001@gmail.com';

  try {
    console.log(`\n🔧 Promoting ${targetEmail} to admin...\n`);

    // First, check if user exists
    const checkResult = await pool.query(
      'SELECT id, email, role, google_id FROM users WHERE email = $1',
      [targetEmail]
    );

    if (checkResult.rows.length === 0) {
      console.log(`❌ User ${targetEmail} not found in database.\n`);
      console.log('Please log in with Google first, then run this script again.\n');
      await pool.end();
      process.exit(1);
    }

    const user = checkResult.rows[0];
    console.log('📊 Current user status:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Google ID: ${user.google_id ? '✅ Connected' : '❌ Not connected'}\n`);

    if (user.role === 'admin') {
      console.log('✅ User is already an admin!\n');
      await pool.end();
      process.exit(0);
    }

    // Promote to admin
    const updateResult = await pool.query(
      `UPDATE users
       SET role = 'admin'
       WHERE email = $1
       RETURNING id, email, role`,
      [targetEmail]
    );

    if (updateResult.rows.length > 0) {
      const updated = updateResult.rows[0];
      console.log('✅ User promoted to admin!\n');
      console.log('📊 New status:');
      console.log(`   Email: ${updated.email}`);
      console.log(`   Role: ${updated.role}\n`);
      console.log('🎉 Done! Log out and log back in to see the Admin button.\n');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

promoteToAdmin();
