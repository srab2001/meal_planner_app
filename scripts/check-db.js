const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Database connected at:', res.rows[0].now);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    await pool.end();
    process.exit(1);
  }
})();
