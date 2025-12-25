#!/usr/bin/env node

/**
 * Verify and seed admin_interview_questions table
 * Uses dotenv to load environment variables from .env file
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying admin_interview_questions table...\n');

  try {
    // Step 1: Check if table exists and has data
    const count = await prisma.admin_interview_questions.count();
    console.log(`✅ Table exists: admin_interview_questions`);
    console.log(`📊 Current records: ${count}\n`);

    if (count === 0) {
      console.log('📝 No questions found - inserting seed data...\n');
      
      const defaultQuestions = [
        {
          question_text: 'What type of workout are you interested in?',
          question_type: 'text',
          order_position: 1,
          is_active: true,
        },
        {
          question_text: 'How many days per week can you exercise?',
          question_type: 'multiple_choice',
          options: ['1-2 days', '3-4 days', '5-6 days', '7 days'],
          order_position: 2,
          is_active: true,
        },
        {
          question_text: 'What is your current fitness level?',
          question_type: 'multiple_choice',
          options: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
          order_position: 3,
          is_active: true,
        },
        {
          question_text: 'Do you have access to gym equipment?',
          question_type: 'yes_no',
          order_position: 4,
          is_active: true,
        },
        {
          question_text: 'How much time can you dedicate per workout (in minutes)?',
          question_type: 'range',
          options: { min: 15, max: 120 },
          order_position: 5,
          is_active: true,
        },
      ];

      // Insert all questions
      for (const q of defaultQuestions) {
        const created = await prisma.admin_interview_questions.create({
          data: q,
        });
        console.log(`  ✅ Created: "${created.question_text}" (ID: ${created.id})`);
      }

      console.log(`\n✨ Seeded ${defaultQuestions.length} default questions\n`);
    }

    // Step 2: Fetch and display all active questions
    console.log('📋 Current interview questions:\n');
    const questions = await prisma.admin_interview_questions.findMany({
      where: { is_active: true },
      orderBy: { order_position: 'asc' },
    });

    if (questions.length === 0) {
      console.log('⚠️  No active questions found!');
    } else {
      questions.forEach((q, idx) => {
        console.log(`${idx + 1}. ${q.question_text}`);
        console.log(`   Type: ${q.question_type}`);
        if (q.options) {
          console.log(`   Options: ${JSON.stringify(q.options)}`);
        }
        console.log(`   Active: ${q.is_active}`);
        console.log('');
      });
    }

    // Step 3: Test response format
    console.log('✅ Response format that will be sent to frontend:');
    console.log(JSON.stringify({
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
    }, null, 2));

    console.log('\n✨ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P1010') {
      console.error('   → Database connection failed. Check DATABASE_URL environment variable');
    } else if (error.message.includes('does not exist')) {
      console.error('   → Table does not exist. Run migrations first:');
      console.error('     npx prisma migrate deploy');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
