#!/usr/bin/env node
/**
 * Setup fitness interview tables in Neon (FITNESS_DATABASE_URL)
 * Run from Render Shell: node scripts/setup-neon-fitness.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Use FITNESS_DATABASE_URL for Neon
const dbUrl = process.env.FITNESS_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: FITNESS_DATABASE_URL or DATABASE_URL not set');
  process.exit(1);
}

console.log('Connecting to:', dbUrl.replace(/:[^:@]+@/, ':***@'));

const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log('\n1. Creating fitness_interview_questions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness_interview_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) UNIQUE NOT NULL,
        label VARCHAR(255) NOT NULL,
        help_text TEXT,
        input_type VARCHAR(50) NOT NULL,
        is_required BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        is_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fiq_sort_order ON fitness_interview_questions(sort_order)`);
    console.log('   ✅ fitness_interview_questions created');

    console.log('\n2. Creating fitness_interview_options table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness_interview_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES fitness_interview_questions(id) ON DELETE CASCADE,
        value VARCHAR(255) NOT NULL,
        label VARCHAR(255) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fio_question_order ON fitness_interview_options(question_id, sort_order)`);
    console.log('   ✅ fitness_interview_options created');

    console.log('\n3. Creating fitness_interview_responses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness_interview_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        response_json JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fir_user_submitted ON fitness_interview_responses(user_id, submitted_at DESC)`);
    console.log('   ✅ fitness_interview_responses created');

    console.log('\n4. Creating workout_plans table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        created_from_response_id UUID REFERENCES fitness_interview_responses(id) ON DELETE SET NULL,
        plan_json JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_wp_user_created ON workout_plans(user_id, created_at DESC)`);
    console.log('   ✅ workout_plans created');

    console.log('\n5. Seeding interview questions...');
    const questions = [
      { key: 'main_goal', label: 'Main goal', input_type: 'single_select', help_text: 'Primary goal for your training', sort_order: 1 },
      { key: 'primary_objectives', label: 'Primary objectives', input_type: 'multi_select', help_text: 'Choose all that apply', sort_order: 2 },
      { key: 'fitness_level', label: 'Fitness level', input_type: 'single_select', help_text: 'How would you rate your current fitness?', sort_order: 3 },
      { key: 'days_per_week', label: 'Days per week', input_type: 'single_select', help_text: 'How many days can you train per week?', sort_order: 4 },
      { key: 'location', label: 'Training location', input_type: 'single_select', help_text: 'Where will you primarily train?', sort_order: 5 },
      { key: 'session_length', label: 'Session length (minutes)', input_type: 'single_select', help_text: 'How long is a typical training session?', sort_order: 6 },
      { key: 'injuries', label: 'Injuries or limitations', input_type: 'text', help_text: 'List any injuries or physical limitations', sort_order: 7, is_required: false },
      { key: 'training_style', label: 'Training style', input_type: 'single_select', help_text: 'Preferred training style', sort_order: 8 }
    ];

    for (const q of questions) {
      await client.query(`
        INSERT INTO fitness_interview_questions (key, label, help_text, input_type, is_required, sort_order, is_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (key) DO UPDATE SET label = $2, help_text = $3, input_type = $4, is_required = $5, sort_order = $6
      `, [q.key, q.label, q.help_text || null, q.input_type, q.is_required !== false, q.sort_order || 0]);
    }
    console.log('   ✅ 8 questions seeded');

    console.log('\n6. Seeding options for each question...');

    // Helper to add options
    async function addOptions(questionKey, options) {
      const qRes = await client.query(`SELECT id FROM fitness_interview_questions WHERE key = $1`, [questionKey]);
      if (qRes.rows.length === 0) throw new Error(`Question ${questionKey} not found`);
      const qid = qRes.rows[0].id;

      for (const opt of options) {
        await client.query(`
          INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT DO NOTHING
        `, [qid, opt.value, opt.label, opt.sort_order || 0]);
      }
    }

    // Main goal options
    await addOptions('main_goal', [
      { value: 'lose_weight', label: 'Lose weight', sort_order: 0 },
      { value: 'gain_muscle', label: 'Gain muscle', sort_order: 1 },
      { value: 'improve_fitness', label: 'Improve overall fitness', sort_order: 2 },
      { value: 'sports_performance', label: 'Improve sports performance', sort_order: 3 },
      { value: 'maintain_health', label: 'Maintain current health', sort_order: 4 },
      { value: 'increase_strength', label: 'Increase strength', sort_order: 5 }
    ]);

    // Primary objectives
    await addOptions('primary_objectives', [
      { value: 'cardio', label: 'Cardiovascular endurance', sort_order: 0 },
      { value: 'strength', label: 'Strength training', sort_order: 1 },
      { value: 'flexibility', label: 'Flexibility & mobility', sort_order: 2 },
      { value: 'balance', label: 'Balance & coordination', sort_order: 3 },
      { value: 'core', label: 'Core stability', sort_order: 4 },
      { value: 'power', label: 'Power & explosiveness', sort_order: 5 },
      { value: 'endurance', label: 'Muscular endurance', sort_order: 6 }
    ]);

    // Fitness level
    await addOptions('fitness_level', [
      { value: 'beginner', label: 'Beginner (little to no training experience)', sort_order: 0 },
      { value: 'intermediate', label: 'Intermediate (training 1-2 years)', sort_order: 1 },
      { value: 'advanced', label: 'Advanced (training 3+ years)', sort_order: 2 },
      { value: 'professional', label: 'Professional/Competitive', sort_order: 3 }
    ]);

    // Days per week
    await addOptions('days_per_week', [1,2,3,4,5,6,7].map((n,i) => ({ value: String(n), label: `${n} day${n>1?'s':''}`, sort_order: i })));

    // Location
    await addOptions('location', [
      { value: 'gym', label: 'Gym (with equipment)', sort_order: 0 },
      { value: 'home', label: 'Home (minimal equipment)', sort_order: 1 },
      { value: 'outdoors', label: 'Outdoors', sort_order: 2 },
      { value: 'pool', label: 'Pool', sort_order: 3 },
      { value: 'mixed', label: 'Mixed locations', sort_order: 4 }
    ]);

    // Session length
    await addOptions('session_length', [
      { value: '15', label: '15 minutes', sort_order: 0 },
      { value: '30', label: '30 minutes', sort_order: 1 },
      { value: '45', label: '45 minutes', sort_order: 2 },
      { value: '60', label: '60 minutes', sort_order: 3 },
      { value: '90', label: '90 minutes', sort_order: 4 }
    ]);

    // Training style
    await addOptions('training_style', [
      { value: 'strength', label: 'Strength-focused (weights, powerlifting)', sort_order: 0 },
      { value: 'cardio', label: 'Cardio-focused (running, cycling, HIIT)', sort_order: 1 },
      { value: 'functional', label: 'Functional fitness (CrossFit-style)', sort_order: 2 },
      { value: 'yogapilates', label: 'Yoga/Pilates', sort_order: 3 },
      { value: 'sports', label: 'Sports-specific training', sort_order: 4 },
      { value: 'hiit', label: 'High-Intensity Interval Training (HIIT)', sort_order: 5 },
      { value: 'circuit', label: 'Circuit training', sort_order: 6 },
      { value: 'mixed', label: 'Mixed modalities', sort_order: 7 }
    ]);

    console.log('   ✅ All options seeded');

    // Verify
    const countQ = await client.query(`SELECT COUNT(*) FROM fitness_interview_questions WHERE is_enabled = true`);
    const countO = await client.query(`SELECT COUNT(*) FROM fitness_interview_options WHERE is_enabled = true`);
    console.log(`\n✅ Setup complete!`);
    console.log(`   Questions: ${countQ.rows[0].count}`);
    console.log(`   Options: ${countO.rows[0].count}`);

  } catch (err) {
    console.error('ERROR:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
