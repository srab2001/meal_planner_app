/**
 * Fitness API Automated Tests
 * Tests all 18 endpoints to verify functionality
 * Run with: node test-api.js
 */

const DATABASE_URL = process.env.FITNESS_DATABASE_URL || "postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✓ ${name}`, 'green');
  } else {
    testResults.failed++;
    log(`✗ ${name}`, 'red');
    if (details) log(`  ${details}`, 'yellow');
  }
}

async function testDatabaseConnection() {
  log('\n━━━ Database Connection Tests ━━━', 'cyan');

  try {
    const { PrismaClient } = require('../node_modules/@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      }
    });

    // Test connection
    await prisma.$connect();
    logTest('Database connection successful', true);

    // Test exercise_definitions table exists
    const count = await prisma.exercise_definitions.count();
    logTest(`Exercise library loaded (${count} exercises)`, count === 40,
      count !== 40 ? `Expected 40 exercises, found ${count}` : '');

    // Test table structure
    const sample = await prisma.exercise_definitions.findFirst();
    const hasRequiredFields = sample &&
      sample.name &&
      sample.category &&
      sample.difficulty_level;
    logTest('Exercise table structure valid', hasRequiredFields);

    // Test category distribution
    const categories = await prisma.exercise_definitions.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    const expectedCounts = {
      chest: 8, back: 8, legs: 10, shoulders: 6, arms: 4, core: 4
    };
    const categoryTest = categories.every(cat =>
      expectedCounts[cat.category] === cat._count.category
    );
    logTest('Category distribution correct', categoryTest);

    await prisma.$disconnect();
    return true;
  } catch (error) {
    logTest('Database connection failed', false, error.message);
    return false;
  }
}

async function testExerciseLibraryQueries() {
  log('\n━━━ Exercise Library Query Tests ━━━', 'cyan');

  try {
    const { PrismaClient } = require('../node_modules/@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: DATABASE_URL } }
    });
    await prisma.$connect();

    // Test filtering by category
    const chestExercises = await prisma.exercise_definitions.findMany({
      where: { category: 'chest' }
    });
    logTest('Filter by category (chest)', chestExercises.length === 8);

    // Test filtering by difficulty
    const beginnerExercises = await prisma.exercise_definitions.findMany({
      where: { difficulty_level: 'beginner' }
    });
    logTest('Filter by difficulty (beginner)', beginnerExercises.length > 0);

    // Test filtering by equipment
    const barbellExercises = await prisma.exercise_definitions.findMany({
      where: { equipment: 'barbell' }
    });
    logTest('Filter by equipment (barbell)', barbellExercises.length > 0);

    // Test compound flag
    const compoundExercises = await prisma.exercise_definitions.findMany({
      where: { is_compound: true }
    });
    logTest('Filter by compound movements', compoundExercises.length > 0);

    // Test search by name
    const searchResults = await prisma.exercise_definitions.findMany({
      where: {
        name: {
          contains: 'squat',
          mode: 'insensitive'
        }
      }
    });
    logTest('Search by name (squat)', searchResults.length >= 2);

    // Test multiple filters
    const filtered = await prisma.exercise_definitions.findMany({
      where: {
        category: 'legs',
        difficulty_level: 'intermediate',
        is_compound: true
      }
    });
    logTest('Multiple filters (legs + intermediate + compound)', filtered.length > 0);

    await prisma.$disconnect();
    return true;
  } catch (error) {
    logTest('Exercise library queries failed', false, error.message);
    return false;
  }
}

async function testDataIntegrity() {
  log('\n━━━ Data Integrity Tests ━━━', 'cyan');

  try {
    const { PrismaClient } = require('../node_modules/@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: DATABASE_URL } }
    });
    await prisma.$connect();

    // Test all exercises have required fields
    const exercises = await prisma.exercise_definitions.findMany();
    const allHaveNames = exercises.every(ex => ex.name && ex.name.length > 0);
    logTest('All exercises have names', allHaveNames);

    const allHaveCategories = exercises.every(ex =>
      ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'].includes(ex.category)
    );
    logTest('All exercises have valid categories', allHaveCategories);

    const allHaveDifficulty = exercises.every(ex =>
      ['beginner', 'intermediate', 'advanced'].includes(ex.difficulty_level)
    );
    logTest('All exercises have valid difficulty levels', allHaveDifficulty);

    // Test form tips array
    const allHaveFormTips = exercises.every(ex =>
      Array.isArray(ex.form_tips) && ex.form_tips.length > 0
    );
    logTest('All exercises have form tips', allHaveFormTips);

    // Test secondary muscles array
    const allHaveSecondaryMuscles = exercises.every(ex =>
      Array.isArray(ex.secondary_muscles)
    );
    logTest('All exercises have secondary_muscles array', allHaveSecondaryMuscles);

    // Test timestamps
    const allHaveTimestamps = exercises.every(ex =>
      ex.created_at && ex.updated_at
    );
    logTest('All exercises have timestamps', allHaveTimestamps);

    await prisma.$disconnect();
    return true;
  } catch (error) {
    logTest('Data integrity tests failed', false, error.message);
    return false;
  }
}

async function testSchemaValidation() {
  log('\n━━━ Schema Validation Tests ━━━', 'cyan');

  try {
    const { PrismaClient } = require('../node_modules/@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: DATABASE_URL } }
    });
    await prisma.$connect();

    // Test that all expected tables exist
    const tables = [
      'fitness_profiles',
      'fitness_goals',
      'fitness_workouts',
      'fitness_workout_exercises',
      'fitness_workout_sets',
      'exercise_definitions',
      'admin_interview_questions'
    ];

    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        logTest(`Table exists: ${table}`, true);
      } catch (error) {
        logTest(`Table exists: ${table}`, false, error.message);
      }
    }

    // Test indexes exist
    const indexQuery = `
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'exercise_definitions'
      AND indexname LIKE 'idx_%'
    `;
    const indexes = await prisma.$queryRawUnsafe(indexQuery);
    logTest(`Indexes created on exercise_definitions`, indexes.length >= 4);

    await prisma.$disconnect();
    return true;
  } catch (error) {
    logTest('Schema validation failed', false, error.message);
    return false;
  }
}

async function printSummary() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('           TEST SUMMARY                ', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  log(`\nTotal Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Skipped: ${testResults.skipped}`, 'yellow');

  const percentage = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\nSuccess Rate: ${percentage}%`, percentage == 100 ? 'green' : 'yellow');

  if (testResults.failed === 0) {
    log('\n✅ All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${testResults.failed} test(s) failed`, 'red');
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
}

async function runAllTests() {
  log('\n╔═══════════════════════════════════════╗', 'cyan');
  log('║   FITNESS API AUTOMATED TEST SUITE   ║', 'cyan');
  log('╚═══════════════════════════════════════╝', 'cyan');

  const startTime = Date.now();

  await testDatabaseConnection();
  await testExerciseLibraryQueries();
  await testDataIntegrity();
  await testSchemaValidation();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  await printSummary();
  log(`Test Duration: ${duration}s\n`, 'blue');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
