#!/usr/bin/env node
/**
 * Seed default fitness interview questions and basic options
 * Run with: node scripts/seed-fitness-interview.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

async function upsertQuestion(q) {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT id FROM fitness_interview_questions WHERE key = $1`, [q.key]);
    if (res.rows.length > 0) {
      // update label/help_text/input_type/sort_order/is_enabled
      await client.query(`UPDATE fitness_interview_questions SET label = $1, help_text = $2, input_type = $3, sort_order = $4, is_enabled = $5 WHERE key = $6`, [q.label, q.help_text, q.input_type, q.sort_order || 0, q.is_enabled === false ? false : true, q.key]);
      return (await client.query(`SELECT id FROM fitness_interview_questions WHERE key = $1`, [q.key])).rows[0].id;
    }
    const insert = await client.query(`INSERT INTO fitness_interview_questions (key, label, help_text, input_type, is_required, sort_order, is_enabled) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [q.key, q.label, q.help_text || null, q.input_type, q.is_required === false ? false : true, q.sort_order || 0, q.is_enabled === false ? false : true]);
    return insert.rows[0].id;
  } finally {
    client.release();
  }
}

async function upsertOption(questionKey, opt) {
  const client = await pool.connect();
  try {
    const q = await client.query(`SELECT id FROM fitness_interview_questions WHERE key = $1`, [questionKey]);
    if (q.rows.length === 0) throw new Error(`Question with key ${questionKey} not found`);
    const qid = q.rows[0].id;

    // Try to find existing option by question_id and value
    const existing = await client.query(`SELECT id FROM fitness_interview_options WHERE question_id = $1 AND value = $2`, [qid, opt.value]);
    if (existing.rows.length > 0) {
      await client.query(`UPDATE fitness_interview_options SET label = $1, sort_order = $2, is_enabled = $3 WHERE id = $4`, [opt.label, opt.sort_order || 0, opt.is_enabled === false ? false : true, existing.rows[0].id]);
      return existing.rows[0].id;
    }
    const insert = await client.query(`INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [qid, opt.value, opt.label, opt.sort_order || 0, opt.is_enabled === false ? false : true]);
    return insert.rows[0].id;
  } finally {
    client.release();
  }
}

async function seed() {
  console.log('Seeding fitness interview questions...');
  try {
    // Questions in exact order
    const questions = [
      { key: 'main_goal', label: 'Main goal', input_type: 'single_select', help_text: 'Primary goal for your training', sort_order: 1 },
      { key: 'primary_objectives', label: 'Primary objectives', input_type: 'multi_select', help_text: 'Choose all that apply', sort_order: 2 },
      { key: 'fitness_level', label: 'Fitness level', input_type: 'single_select', help_text: 'How would you rate your current fitness?', sort_order: 3 },
      { key: 'days_per_week', label: 'Days per week', input_type: 'number', help_text: 'How many days can you train per week?', sort_order: 4 },
      { key: 'location', label: 'Training location', input_type: 'single_select', help_text: 'Where will you primarily train?', sort_order: 5 },
      { key: 'session_length', label: 'Session length (minutes)', input_type: 'single_select', help_text: 'How long is a typical training session?', sort_order: 6 },
      { key: 'injuries', label: 'Injuries or limitations', input_type: 'text', help_text: 'List any injuries or physical limitations', sort_order: 7, is_required: false },
      { key: 'training_style', label: 'Training style', input_type: 'single_select', help_text: 'Preferred training style', sort_order: 8 }
    ];

    for (const q of questions) {
      const id = await upsertQuestion(q);
      console.log(`Upserted question ${q.key} => ${id}`);
    }

    // Main goal options
    const mainGoalOptions = [
      { value: 'lose_weight', label: 'Lose weight', sort_order: 0 },
      { value: 'gain_muscle', label: 'Gain muscle', sort_order: 1 },
      { value: 'improve_fitness', label: 'Improve overall fitness', sort_order: 2 },
      { value: 'sports_performance', label: 'Improve sports performance', sort_order: 3 },
      { value: 'maintain_health', label: 'Maintain current health', sort_order: 4 },
      { value: 'increase_strength', label: 'Increase strength', sort_order: 5 }
    ];
    for (const opt of mainGoalOptions) {
      await upsertOption('main_goal', opt);
    }
    console.log('Seeded main_goal options');

    // Primary objectives options (multi-select)
    const objectivesOptions = [
      { value: 'cardio', label: 'Cardiovascular endurance', sort_order: 0 },
      { value: 'strength', label: 'Strength training', sort_order: 1 },
      { value: 'flexibility', label: 'Flexibility & mobility', sort_order: 2 },
      { value: 'balance', label: 'Balance & coordination', sort_order: 3 },
      { value: 'core', label: 'Core stability', sort_order: 4 },
      { value: 'power', label: 'Power & explosiveness', sort_order: 5 },
      { value: 'endurance', label: 'Muscular endurance', sort_order: 6 }
    ];
    for (const opt of objectivesOptions) {
      await upsertOption('primary_objectives', opt);
    }
    console.log('Seeded primary_objectives options');

    // Fitness level options
    const fitnessLevelOptions = [
      { value: 'beginner', label: 'Beginner (little to no training experience)', sort_order: 0 },
      { value: 'intermediate', label: 'Intermediate (training 1-2 years)', sort_order: 1 },
      { value: 'advanced', label: 'Advanced (training 3+ years)', sort_order: 2 },
      { value: 'professional', label: 'Professional/Competitive', sort_order: 3 }
    ];
    for (const opt of fitnessLevelOptions) {
      await upsertOption('fitness_level', opt);
    }
    console.log('Seeded fitness_level options');

    // Days per week options (we store as values '1'..'7')
    const daysOptions = [1,2,3,4,5,6,7].map((n,i)=>({ value: String(n), label: `${n} day${n>1?'s':''}`, sort_order: i }));
    for (const opt of daysOptions) {
      await upsertOption('days_per_week', opt);
    }
    console.log('Seeded days_per_week options');

    // Training location options
    const locationOptions = [
      { value: 'gym', label: 'Gym (with equipment)', sort_order: 0 },
      { value: 'home', label: 'Home (minimal equipment)', sort_order: 1 },
      { value: 'outdoors', label: 'Outdoors', sort_order: 2 },
      { value: 'pool', label: 'Pool', sort_order: 3 },
      { value: 'mixed', label: 'Mixed locations', sort_order: 4 }
    ];
    for (const opt of locationOptions) {
      await upsertOption('location', opt);
    }
    console.log('Seeded location options');

    // Session length options
    const sessionOptions = [
      { value: '15', label: '15 minutes', sort_order: 0 },
      { value: '30', label: '30 minutes', sort_order: 1 },
      { value: '45', label: '45 minutes', sort_order: 2 },
      { value: '60', label: '60 minutes', sort_order: 3 },
      { value: '90', label: '90 minutes', sort_order: 4 }
    ];
    for (const opt of sessionOptions) {
      await upsertOption('session_length', opt);
    }
    console.log('Seeded session_length options');

    // Training style options
    const trainingStyleOptions = [
      { value: 'strength', label: 'Strength-focused (weights, powerlifting)', sort_order: 0 },
      { value: 'cardio', label: 'Cardio-focused (running, cycling, HIIT)', sort_order: 1 },
      { value: 'functional', label: 'Functional fitness (CrossFit-style)', sort_order: 2 },
      { value: 'yogapilates', label: 'Yoga/Pilates', sort_order: 3 },
      { value: 'sports', label: 'Sports-specific training', sort_order: 4 },
      { value: 'hiit', label: 'High-Intensity Interval Training (HIIT)', sort_order: 5 },
      { value: 'circuit', label: 'Circuit training', sort_order: 6 },
      { value: 'mixed', label: 'Mixed modalities', sort_order: 7 }
    ];
    for (const opt of trainingStyleOptions) {
      await upsertOption('training_style', opt);
    }
    console.log('Seeded training_style options');

    console.log('Fitness interview seed complete');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await pool.end();
  }
}

seed();
