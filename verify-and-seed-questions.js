#!/usr/bin/env node

/**
 * Verify and seed admin_interview_questions table using raw PostgreSQL
 * This approach doesn't rely on Prisma schema and works with any database
 */

require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('🔍 Verifying admin_interview_questions table...\n');

  try {
    // Step 1: Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_interview_questions'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      console.log('❌ Table does not exist: admin_interview_questions');
      console.log('   Creating table...\n');
      
      // Create the table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_interview_questions (
          id SERIAL PRIMARY KEY,
          question_text TEXT NOT NULL,
          question_type VARCHAR(50) DEFAULT 'text',
          options JSONB,
          option_range INT,
          order_position INT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ Created table: admin_interview_questions\n');
    } else {
      console.log('✅ Table exists: admin_interview_questions\n');
    }

    // Step 2: Check current record count
    const countResult = await pool.query('SELECT COUNT(*) FROM admin_interview_questions');
    const count = parseInt(countResult.rows[0].count);
    console.log(`📊 Current records: ${count}\n`);

    // Step 3: Insert seed data if empty
    if (count === 0) {
      console.log('📝 No questions found - inserting seed data...\n');
      
      const defaultQuestions = [
        ['What type of workout are you interested in?', 'text', null, 1],
        ['How many days per week can you exercise?', 'multiple_choice', JSON.stringify(['1-2 days', '3-4 days', '5-6 days', '7 days']), 2],
        ['What is your current fitness level?', 'multiple_choice', JSON.stringify(['Beginner', 'Intermediate', 'Advanced', 'Elite']), 3],
        ['Do you have access to gym equipment?', 'yes_no', null, 4],
        ['How much time can you dedicate per workout (in minutes)?', 'range', JSON.stringify({ min: 15, max: 120 }), 5],
      ];

      for (const [text, type, options, order] of defaultQuestions) {
        await pool.query(
          'INSERT INTO admin_interview_questions (question_text, question_type, options, order_position, is_active) VALUES ($1, $2, $3::JSONB, $4, true)',
          [text, type, options, order]
        );
        console.log(`  ✅ Created: "${text}"`);
      }

      console.log(`\n✨ Seeded ${defaultQuestions.length} default questions\n`);
    }

    // Step 4: Fetch and display all active questions
    console.log('📋 Current active interview questions:\n');
    const result = await pool.query(`
      SELECT id, question_text, question_type, options, order_position, is_active, created_at, updated_at
      FROM admin_interview_questions
      WHERE is_active = true
      ORDER BY order_position ASC
    `);

    const questions = result.rows;

    if (questions.length === 0) {
      console.log('⚠️  No active questions found!');
    } else {
      questions.forEach((q, idx) => {
        console.log(`${idx + 1}. ${q.question_text}`);
        console.log(`   ID: ${q.id}, Type: ${q.question_type}`);
        if (q.options) {
          console.log(`   Options: ${JSON.stringify(q.options)}`);
        }
        console.log('');
      });
    }

    // Step 5: Show API response format
    console.log('✅ API response format (GET /api/fitness/admin/interview-questions):\n');
    const apiResponse = {
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        order_position: q.order_position,
        is_active: q.is_active,
        created_at: q.created_at,
        updated_at: q.updated_at,
      })),
    };
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n✨ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   → Could not connect to database. Check DATABASE_URL');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
