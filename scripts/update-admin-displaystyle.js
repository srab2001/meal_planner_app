const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  try {
    console.log('Updating display_style and options for admin_interview_questions...');

    // Set dropdown for days-per-week questions and populate options if empty
    await pool.query(`
      UPDATE admin_interview_questions
      SET display_style = 'dropdown',
          options = CASE
            WHEN options IS NULL THEN '["1","2","3","4","5","6","7"]'::jsonb
            WHEN jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 0 THEN '["1","2","3","4","5","6","7"]'::jsonb
            ELSE options
          END
      WHERE question_text ILIKE 'How many days per week can you exercise?%'
    `);

    // Set range display for time-per-workout questions and ensure options include min/max if present
    await pool.query(`
      UPDATE admin_interview_questions
      SET display_style = 'range', options = COALESCE(options, '{"min":10,"max":120}'::jsonb)
      WHERE question_text ILIKE 'How much time can you dedicate per workout%'
    `);

    // Set yes_no display as toggle for yes_no questions
    await pool.query(`
      UPDATE admin_interview_questions
      SET display_style = 'toggle'
      WHERE question_type = 'yes_no'
    `);

    console.log('Updates applied.');
  } catch (err) {
    console.error('Update failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
