#!/usr/bin/env node

/**
 * Seed interview questions for AI Coach
 * Run this after deploying to Render
 * 
 * Usage: DATABASE_URL=<your_db_url> node seed-interview-questions.js
 */

const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('🌱 Seeding admin_interview_questions table...\n');

  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_interview_questions'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table admin_interview_questions does not exist');
      console.log('   Migrations may not have been applied yet.');
      console.log('   The table will be created automatically when the migrations run.');
      process.exit(0);
    }

    // Check current count
    const countResult = await pool.query('SELECT COUNT(*) FROM admin_interview_questions');
    const count = parseInt(countResult.rows[0].count);

    console.log(`✅ Table exists with ${count} questions`);

    if (count > 0) {
      console.log('   Skipping seed (questions already exist)');
      process.exit(0);
    }

    // Seed default questions
    console.log('\n📝 Inserting 5 default questions...\n');

    const defaultQuestions = [
      {
        question_text: 'What type of workout are you interested in?',
        question_type: 'text',
        options: null,
        order_position: 1,
      },
      {
        question_text: 'How many days per week can you exercise?',
        question_type: 'multiple_choice',
        options: JSON.stringify(['1-2 days', '3-4 days', '5-6 days', '7 days']),
        order_position: 2,
      },
      {
        question_text: 'What is your current fitness level?',
        question_type: 'multiple_choice',
        options: JSON.stringify(['Beginner', 'Intermediate', 'Advanced', 'Elite']),
        order_position: 3,
      },
      {
        question_text: 'Do you have access to gym equipment?',
        question_type: 'yes_no',
        options: null,
        order_position: 4,
      },
      {
        question_text: 'How much time can you dedicate per workout (in minutes)?',
        question_type: 'range',
        options: JSON.stringify({ min: 15, max: 120 }),
        order_position: 5,
      },
    ];

    for (const q of defaultQuestions) {
      await pool.query(
        `INSERT INTO admin_interview_questions (question_text, question_type, options, order_position, is_active)
         VALUES ($1, $2, $3::JSONB, $4, true)`,
        [q.question_text, q.question_type, q.options, q.order_position]
      );
      console.log(`  ✅ ${q.question_text}`);
    }

    console.log(`\n✨ Successfully seeded ${defaultQuestions.length} questions!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
