/**
 * Seed script for Workout Templates
 * Creates sample workout templates for testing the Saved Workouts feature
 *
 * Run with: node scripts/seed-workout-templates.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedWorkoutTemplates() {
  console.log('🏋️ Seeding workout templates...\n');

  // Get the first user to assign templates to (or create a test user)
  let user = await prisma.users.findFirst();

  if (!user) {
    console.log('❌ No users found. Please create a user first.');
    process.exit(1);
  }

  console.log(`📧 Using user: ${user.email}\n`);

  // Template 1: Full Body Strength
  const template1 = await prisma.workout_templates.create({
    data: {
      user_id: user.id,
      name: 'Full Body Strength',
      notes: 'Complete full body workout focusing on compound movements. Great for beginners and intermediate lifters.',
      exercises: {
        create: [
          {
            sort_order: 1,
            name: 'Barbell Squat',
            prescription_type: 'reps',
            sets: 3,
            reps: 10,
            rest_seconds: 90
          },
          {
            sort_order: 2,
            name: 'Bench Press',
            prescription_type: 'reps',
            sets: 3,
            reps: 10,
            rest_seconds: 90
          },
          {
            sort_order: 3,
            name: 'Bent Over Row',
            prescription_type: 'reps',
            sets: 3,
            reps: 10,
            rest_seconds: 60
          },
          {
            sort_order: 4,
            name: 'Plank',
            prescription_type: 'time',
            sets: 3,
            seconds: 30,
            rest_seconds: 30
          },
          {
            sort_order: 5,
            name: 'Dumbbell Lunges',
            prescription_type: 'reps',
            sets: 3,
            reps: 12,
            rest_seconds: 60
          }
        ]
      }
    },
    include: { exercises: true }
  });
  console.log(`✅ Created template: ${template1.name} (${template1.exercises.length} exercises)`);

  // Template 2: HIIT Cardio Blast
  const template2 = await prisma.workout_templates.create({
    data: {
      user_id: user.id,
      name: 'HIIT Cardio Blast',
      notes: 'High intensity interval training for maximum calorie burn. 20 seconds on, 10 seconds rest.',
      exercises: {
        create: [
          {
            sort_order: 1,
            name: 'Jumping Jacks',
            prescription_type: 'time',
            sets: 4,
            seconds: 20,
            rest_seconds: 10
          },
          {
            sort_order: 2,
            name: 'Burpees',
            prescription_type: 'time',
            sets: 4,
            seconds: 20,
            rest_seconds: 10
          },
          {
            sort_order: 3,
            name: 'Mountain Climbers',
            prescription_type: 'time',
            sets: 4,
            seconds: 20,
            rest_seconds: 10
          },
          {
            sort_order: 4,
            name: 'High Knees',
            prescription_type: 'time',
            sets: 4,
            seconds: 20,
            rest_seconds: 10
          },
          {
            sort_order: 5,
            name: 'Box Jumps',
            prescription_type: 'time',
            sets: 4,
            seconds: 20,
            rest_seconds: 10
          }
        ]
      }
    },
    include: { exercises: true }
  });
  console.log(`✅ Created template: ${template2.name} (${template2.exercises.length} exercises)`);

  // Create a sample session for Template 1
  const session = await prisma.workout_sessions.create({
    data: {
      user_id: user.id,
      workout_template_id: template1.id,
      status: 'finished',
      started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      finished_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 mins later
      completion_percent: 100,
      day_note: 'Great workout! Felt strong today.',
      exercises: {
        create: template1.exercises.map((ex, index) => ({
          workout_template_exercise_id: ex.id,
          name_snapshot: ex.name,
          sort_order_snapshot: ex.sort_order,
          prescription_snapshot: {
            prescription_type: ex.prescription_type,
            sets: ex.sets,
            reps: ex.reps,
            seconds: ex.seconds,
            rest_seconds: ex.rest_seconds
          },
          is_completed: true,
          completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + (index + 1) * 8 * 60 * 1000),
          notes: index === 0 ? 'Increased weight by 5 lbs' : null
        }))
      }
    },
    include: { exercises: true }
  });
  console.log(`✅ Created sample session for: ${template1.name} (${session.exercises.length} exercise records)`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('Summary:');
  console.log(`  - 2 workout templates created`);
  console.log(`  - 1 completed session created`);
}

seedWorkoutTemplates()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
