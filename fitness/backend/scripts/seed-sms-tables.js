/**
 * Seed Script for SMS Feature Tables
 *
 * Creates test data for:
 * - user_phones
 * - workout_items
 * - workout_share_tokens
 * - sms_log
 *
 * Usage: DATABASE_URL="..." node scripts/seed-sms-tables.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Test user ID (replace with actual user from your DB)
const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🌱 Seeding SMS feature tables...\n');

  // 1. First, check if we have any existing workouts to attach items to
  let workout = await prisma.fitness_workouts.findFirst({
    where: { user_id: TEST_USER_ID }
  });

  // If no workout exists, create a test workout
  if (!workout) {
    console.log('Creating test workout...');
    workout = await prisma.fitness_workouts.create({
      data: {
        user_id: TEST_USER_ID,
        workout_date: new Date(),
        workout_type: 'strength',
        duration_minutes: 45,
        intensity: 'medium',
        notes: 'Test workout for SMS feature',
        workout_data: {
          title: 'Full Body Strength',
          sections: {
            'warm up': [
              { name: 'Jumping Jacks', sets: 1, reps: '30 seconds' },
              { name: 'Arm Circles', sets: 1, reps: '20 each direction' }
            ],
            'main': [
              { name: 'Squats', sets: 3, reps: '12' },
              { name: 'Push-ups', sets: 3, reps: '10' },
              { name: 'Lunges', sets: 3, reps: '10 each leg' },
              { name: 'Plank', sets: 3, reps: '30 seconds' }
            ],
            'cool down': [
              { name: 'Hamstring Stretch', sets: 1, reps: '30 seconds each' },
              { name: 'Quad Stretch', sets: 1, reps: '30 seconds each' }
            ]
          }
        }
      }
    });
    console.log(`✅ Created workout: ${workout.id}\n`);
  } else {
    console.log(`Using existing workout: ${workout.id}\n`);
  }

  // 2. Create user phone
  console.log('Creating test user phone...');
  const userPhone = await prisma.user_phones.upsert({
    where: { user_id: TEST_USER_ID },
    update: {
      phone_number: '+15551234567',
      is_verified: true,
      verified_at: new Date()
    },
    create: {
      user_id: TEST_USER_ID,
      phone_number: '+15551234567',
      is_verified: true,
      verified_at: new Date()
    }
  });
  console.log(`✅ User phone: ${userPhone.phone_number}\n`);

  // 3. Create workout items
  console.log('Creating workout items...');

  // Clear existing items for this workout
  await prisma.workout_items.deleteMany({
    where: { workout_id: workout.id }
  });

  const items = [
    // Warm up
    { section: 'warm_up', exercise_name: 'Jumping Jacks', sets: 1, reps: '30 seconds', item_order: 1 },
    { section: 'warm_up', exercise_name: 'Arm Circles', sets: 1, reps: '20 each direction', item_order: 2 },
    { section: 'warm_up', exercise_name: 'High Knees', sets: 1, reps: '30 seconds', item_order: 3 },
    // Main workout
    { section: 'main', exercise_name: 'Squats', sets: 3, reps: '12', weight: 'bodyweight', item_order: 4 },
    { section: 'main', exercise_name: 'Push-ups', sets: 3, reps: '10', weight: 'bodyweight', item_order: 5 },
    { section: 'main', exercise_name: 'Lunges', sets: 3, reps: '10 each leg', weight: 'bodyweight', item_order: 6 },
    { section: 'main', exercise_name: 'Plank', sets: 3, reps: '30 seconds', item_order: 7 },
    { section: 'main', exercise_name: 'Dumbbell Rows', sets: 3, reps: '12', weight: '20 lbs', item_order: 8 },
    // Cool down
    { section: 'cool_down', exercise_name: 'Hamstring Stretch', sets: 1, reps: '30 seconds each', item_order: 9 },
    { section: 'cool_down', exercise_name: 'Quad Stretch', sets: 1, reps: '30 seconds each', item_order: 10 },
    { section: 'cool_down', exercise_name: 'Deep Breathing', sets: 1, reps: '1 minute', item_order: 11 }
  ];

  for (const item of items) {
    await prisma.workout_items.create({
      data: {
        workout_id: workout.id,
        ...item,
        is_completed: false
      }
    });
  }
  console.log(`✅ Created ${items.length} workout items\n`);

  // 4. Create a share token (valid for 24 hours)
  console.log('Creating share token...');

  // Clear old tokens for this workout
  await prisma.workout_share_tokens.deleteMany({
    where: { workout_id: workout.id }
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const shareToken = await prisma.workout_share_tokens.create({
    data: {
      workout_id: workout.id,
      user_id: TEST_USER_ID,
      token,
      expires_at: expiresAt
    }
  });
  console.log(`✅ Share token created (expires: ${expiresAt.toISOString()})`);
  console.log(`   Token: ${token}\n`);

  // 5. Create sample SMS log entries
  console.log('Creating SMS log entries...');

  await prisma.sms_log.createMany({
    data: [
      {
        user_id: TEST_USER_ID,
        phone_number: '+15551234567',
        message_type: 'workout_link',
        status: 'sent',
        twilio_sid: 'SM_TEST_' + crypto.randomBytes(16).toString('hex')
      },
      {
        user_id: TEST_USER_ID,
        phone_number: '+15551234567',
        message_type: 'workout_link',
        status: 'delivered',
        twilio_sid: 'SM_TEST_' + crypto.randomBytes(16).toString('hex')
      }
    ]
  });
  console.log('✅ Created 2 SMS log entries\n');

  // Summary
  console.log('━'.repeat(50));
  console.log('📋 SEED SUMMARY');
  console.log('━'.repeat(50));
  console.log(`Workout ID:    ${workout.id}`);
  console.log(`User ID:       ${TEST_USER_ID}`);
  console.log(`Phone:         +15551234567`);
  console.log(`Items:         ${items.length}`);
  console.log(`Share Token:   ${token}`);
  console.log(`Expires:       ${expiresAt.toISOString()}`);
  console.log('━'.repeat(50));
  console.log('\n🔗 Test URL:');
  console.log(`   http://localhost:3000/workout/check-off/${token}`);
  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
