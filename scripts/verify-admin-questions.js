const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  try {
    const res = await pool.query("SELECT id, question_text, question_type, options, option_range, display_style, order_position FROM admin_interview_questions WHERE is_active = true ORDER BY order_position LIMIT 50");
    console.log('Active questions:', res.rows.length);
    for (const r of res.rows) {
      console.log('---');
      console.log('id:', r.id);
      console.log('question_text:', r.question_text);
      console.log('question_type:', r.question_type);
      console.log('display_style:', r.display_style);
      console.log('options (type):', r.options === null ? 'null' : typeof r.options);
      console.log('options value:', JSON.stringify(r.options));
      console.log('option_range:', JSON.stringify(r.option_range));
    }
  } catch (err) {
    console.error('Error querying admin_interview_questions:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
