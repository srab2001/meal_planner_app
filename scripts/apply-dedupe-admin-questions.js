const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  try {
    const before = await pool.query("SELECT COUNT(*) FROM admin_interview_questions WHERE is_active = true");
    console.log('Active questions before:', before.rows[0].count);

    // Show duplicates preview
    const dupPreview = await pool.query(`
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

    console.log('Duplicates to deactivate:', dupPreview.rows.length);
    if (dupPreview.rows.length > 0) {
      console.log('Sample duplicates (first 10):');
      dupPreview.rows.slice(0, 10).forEach(r => {
        console.log(r.id, '|', r.question_text, '| display_style=', r.display_style, '| order=', r.order_position, '| rn=', r.rn);
      });
    }

    // Ask for confirmation if running interactively - but we're running non-interactive here, proceed
    console.log('Applying soft-deactivation: setting is_active = false for duplicates...');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY question_text
            ORDER BY
              (CASE WHEN display_style IS NOT NULL THEN 0 ELSE 1 END),
              COALESCE(order_position, 9999),
              id
          ) AS rn
          FROM admin_interview_questions
          WHERE question_text IS NOT NULL
        )
        UPDATE admin_interview_questions
        SET is_active = false
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
      `);
      await client.query('COMMIT');
      console.log('Soft-deactivation applied.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const after = await pool.query("SELECT COUNT(*) FROM admin_interview_questions WHERE is_active = true");
    console.log('Active questions after:', after.rows[0].count);

    // List remaining active question_text and id
    const remaining = await pool.query(`
      SELECT id, question_text, question_type, display_style, options
      FROM admin_interview_questions
      WHERE is_active = true
      ORDER BY order_position, id
    `);

    console.log('Active questions list:');
    remaining.rows.forEach(r => {
      console.log(r.id, '|', r.question_text, '|', r.question_type, '|', r.display_style, '| options:', JSON.stringify(r.options));
    });

  } catch (err) {
    console.error('Apply dedupe failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
