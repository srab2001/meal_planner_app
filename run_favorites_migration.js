// Migration script for favorites table
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://meal_planner_user:VJaFF2BeiisVJm7Fip4IHwL4q5gObQ40@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com/meal_planner_vo27',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runFavoritesMigration() {
  try {
    console.log('📡 Connecting to database...');

    const sql = fs.readFileSync('./migrations/007_favorites.sql', 'utf8');

    console.log('🚀 Running favorites table migration...');
    await pool.query(sql);

    console.log('✅ Favorites migration completed successfully!');

    // Verify table was created
    const result = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'favorites'
      ORDER BY ordinal_position
    `);

    if (result.rows.length > 0) {
      console.log('\n📋 Favorites table structure:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('⚠️  Warning: Favorites table not found after migration');
    }

    await pool.end();
    console.log('\n✅ Migration complete and connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    await pool.end();
    process.exit(1);
  }
}

runFavoritesMigration();
