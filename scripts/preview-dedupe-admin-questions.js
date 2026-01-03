const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  try {
    console.log('Previewing duplicates in admin_interview_questions...');

    const res = await pool.query(`
      WITH ranked AS (
        SELECT id, question_text, display_style, order_position,
               ROW_NUMBER() OVER (
                 PARTITION BY question_text
                 ORDER BY
                   (CASE WHEN display_style IS NOT NULL THEN 0 ELSE 1 END),
                   COALESCE(order_position, 9999),
                   id
               ) AS rn
        FROM admin_interview_questions
        WHERE question_text IS NOT NULL
      )
      SELECT * FROM ranked WHERE rn > 1 ORDER BY question_text, rn;
    `);

    if (res.rows.length === 0) {
      console.log('No duplicate question_text values found.');
    } else {
      console.log(`Found ${res.rows.length} duplicate rows that would be deactivated:`);
      for (const r of res.rows) {
        console.log('---');
        console.log('id:', r.id);
        console.log('question_text:', r.question_text);
        console.log('display_style:', r.display_style);
        console.log('order_position:', r.order_position);
        console.log('rank:', r.rn);
      }
    }
  } catch (err) {
    console.error('Preview failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
