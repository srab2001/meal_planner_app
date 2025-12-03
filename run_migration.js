// Quick migration script
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://meal_planner_user:VJaFF2BeiisVJm7Fip4IHwL4q5gObQ40@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com/meal_planner_vo27',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('📡 Connecting to Render PostgreSQL database...');

    const sql = fs.readFileSync('./migrations/001_initial_schema.sql', 'utf8');

    console.log('🚀 Running migration...');
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 Tables created:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
