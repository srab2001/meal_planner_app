/**
 * Coaching Module - Sanity Tests
 * 
 * These tests verify:
 * 1. Coaching module is isolated from Meal Plan App
 * 2. Coaching only has READ-ONLY access to meal plan and nutrition data
 * 3. Coaching owns its own data (goals, habits, programs)
 * 4. No cross-contamination of state or logic
 * 
 * Run with: node client/src/modules/coaching/__tests__/sanity.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Coaching Module Sanity Tests...\n');

// ============================================================================
// TEST 1: Module Isolation - File Structure
// ============================================================================
console.log('TEST 1: Module Isolation - File Structure');

const coachingModulePath = path.join(__dirname, '..');
const mealPlanComponentsPath = path.join(__dirname, '../../../components');

// Verify Coaching module exists in its own folder
assert(
  fs.existsSync(coachingModulePath),
  '❌ Coaching module folder should exist'
);
console.log('  ✅ Coaching module has its own folder');

// Verify Coaching has its components subfolder
const coachingComponentsPath = path.join(coachingModulePath, 'components');
assert(
  fs.existsSync(coachingComponentsPath),
  '❌ Coaching should have its own components subfolder'
);
console.log('  ✅ Coaching has its own components subfolder');

// Verify Coaching components don't exist in main components folder
const mainComponents = fs.readdirSync(mealPlanComponentsPath);
const coachingInMainComponents = mainComponents.filter(f => 
  f.toLowerCase().includes('coaching') && !f.includes('test')
);
assert(
  coachingInMainComponents.length === 0,
  `❌ Coaching components should NOT be in main components folder. Found: ${coachingInMainComponents.join(', ')}`
);
console.log('  ✅ No Coaching components in main components folder');

// Verify Coaching has styles subfolder
const coachingStylesPath = path.join(coachingModulePath, 'styles');
assert(
  fs.existsSync(coachingStylesPath),
  '❌ Coaching should have its own styles subfolder'
);
console.log('  ✅ Coaching has its own styles subfolder');

console.log('  ✅ TEST 1 PASSED: Module is properly isolated\n');

// ============================================================================
// TEST 2: Required Components Exist
// ============================================================================
console.log('TEST 2: Required Components Exist');

const requiredComponents = [
  'CoachingDashboard.js',
  'CoachingChat.js',
  'Programs.js',
  'GoalManager.js',
  'HabitTracker.js'
];

const componentFiles = fs.readdirSync(coachingComponentsPath);

requiredComponents.forEach(component => {
  assert(
    componentFiles.includes(component),
    `❌ Missing required component: ${component}`
  );
  console.log(`  ✅ ${component} exists`);
});

// Verify CSS files exist for each component
const requiredStyles = [
  'CoachingDashboard.css',
  'CoachingChat.css',
  'Programs.css',
  'GoalManager.css',
  'HabitTracker.css'
];

requiredStyles.forEach(style => {
  assert(
    componentFiles.includes(style),
    `❌ Missing required style: ${style}`
  );
  console.log(`  ✅ ${style} exists`);
});

console.log('  ✅ TEST 2 PASSED: All required components exist\n');

// ============================================================================
// TEST 3: Main CoachingApp.js Structure
// ============================================================================
console.log('TEST 3: Main CoachingApp.js Structure');

const coachingAppPath = path.join(coachingModulePath, 'CoachingApp.js');
assert(
  fs.existsSync(coachingAppPath),
  '❌ CoachingApp.js should exist'
);

const coachingAppContent = fs.readFileSync(coachingAppPath, 'utf-8');

// Check for required imports
assert(
  coachingAppContent.includes("import CoachingDashboard from"),
  '❌ Should import CoachingDashboard'
);
console.log('  ✅ Imports CoachingDashboard');

assert(
  coachingAppContent.includes("import CoachingChat from"),
  '❌ Should import CoachingChat'
);
console.log('  ✅ Imports CoachingChat');

assert(
  coachingAppContent.includes("import Programs from"),
  '❌ Should import Programs'
);
console.log('  ✅ Imports Programs');

assert(
  coachingAppContent.includes("import GoalManager from"),
  '❌ Should import GoalManager'
);
console.log('  ✅ Imports GoalManager');

assert(
  coachingAppContent.includes("import HabitTracker from"),
  '❌ Should import HabitTracker'
);
console.log('  ✅ Imports HabitTracker');

// Check for audit logging import
assert(
  coachingAppContent.includes("import auditLogger from"),
  '❌ Should import AuditLogger'
);
console.log('  ✅ Imports AuditLogger for audit logging');

console.log('  ✅ TEST 3 PASSED: CoachingApp.js has correct structure\n');

// ============================================================================
// TEST 4: Module Exports
// ============================================================================
console.log('TEST 4: Module Exports');

const indexPath = path.join(coachingModulePath, 'index.js');
assert(
  fs.existsSync(indexPath),
  '❌ index.js should exist for module exports'
);

const indexContent = fs.readFileSync(indexPath, 'utf-8');

assert(
  indexContent.includes("export { default as CoachingApp }") || 
  indexContent.includes("export default") ||
  indexContent.includes("module.exports"),
  '❌ Should export CoachingApp'
);
console.log('  ✅ Module properly exports CoachingApp');

console.log('  ✅ TEST 4 PASSED: Module exports correctly\n');

// ============================================================================
// TEST 5: Read-Only Access to Other Modules
// ============================================================================
console.log('TEST 5: Read-Only Access to Other Modules');

// Check CoachingApp doesn't directly modify meal plan or nutrition state
const writeMethods = [
  'updateMealPlan',
  'saveMealPlan',
  'deleteMealPlan',
  'updateNutrition',
  'saveNutritionEntry',
  'deleteNutritionEntry'
];

writeMethods.forEach(method => {
  assert(
    !coachingAppContent.includes(method),
    `❌ Coaching should not call ${method} - violates read-only access`
  );
});
console.log('  ✅ Coaching does not have write methods for Meal Plan');
console.log('  ✅ Coaching does not have write methods for Nutrition');

// Verify coaching only reads via API
assert(
  coachingAppContent.includes("fetchWithAuth") && coachingAppContent.includes("GET"),
  '❌ Should use fetchWithAuth for read operations'
);
console.log('  ✅ Uses fetchWithAuth for API access');

console.log('  ✅ TEST 5 PASSED: Read-only access is enforced\n');

// ============================================================================
// TEST 6: Coaching Owns Its Own Data
// ============================================================================
console.log('TEST 6: Coaching Owns Its Own Data');

// Check that coaching manages goals, habits, programs locally
assert(
  coachingAppContent.includes("setGoals") || coachingAppContent.includes("goals"),
  '❌ Coaching should manage goals state'
);
console.log('  ✅ Coaching manages goals');

assert(
  coachingAppContent.includes("setHabits") || coachingAppContent.includes("habits"),
  '❌ Coaching should manage habits state'
);
console.log('  ✅ Coaching manages habits');

assert(
  coachingAppContent.includes("setPrograms") || coachingAppContent.includes("programs"),
  '❌ Coaching should manage programs state'
);
console.log('  ✅ Coaching manages programs');

console.log('  ✅ TEST 6 PASSED: Coaching owns its data\n');

// ============================================================================
// TEST 7: Audit Logging Integration
// ============================================================================
console.log('TEST 7: Audit Logging Integration');

// Check GoalManager has audit logging
const goalManagerPath = path.join(coachingComponentsPath, 'GoalManager.js');
const goalManagerContent = fs.readFileSync(goalManagerPath, 'utf-8');

assert(
  goalManagerContent.includes("import auditLogger from"),
  '❌ GoalManager should import AuditLogger'
);
console.log('  ✅ GoalManager imports AuditLogger');

assert(
  goalManagerContent.includes("auditLogger.log"),
  '❌ GoalManager should use audit logging'
);
console.log('  ✅ GoalManager uses audit logging');

// Check HabitTracker has audit logging
const habitTrackerPath = path.join(coachingComponentsPath, 'HabitTracker.js');
const habitTrackerContent = fs.readFileSync(habitTrackerPath, 'utf-8');

assert(
  habitTrackerContent.includes("import auditLogger from"),
  '❌ HabitTracker should import AuditLogger'
);
console.log('  ✅ HabitTracker imports AuditLogger');

assert(
  habitTrackerContent.includes("auditLogger.log"),
  '❌ HabitTracker should use audit logging'
);
console.log('  ✅ HabitTracker uses audit logging');

// Check Programs has audit logging
const programsPath = path.join(coachingComponentsPath, 'Programs.js');
const programsContent = fs.readFileSync(programsPath, 'utf-8');

assert(
  programsContent.includes("import auditLogger from"),
  '❌ Programs should import AuditLogger'
);
console.log('  ✅ Programs imports AuditLogger');

assert(
  programsContent.includes("auditLogger.log"),
  '❌ Programs should use audit logging'
);
console.log('  ✅ Programs uses audit logging');

// Check CoachingChat has audit logging
const coachingChatPath = path.join(coachingComponentsPath, 'CoachingChat.js');
const coachingChatContent = fs.readFileSync(coachingChatPath, 'utf-8');

assert(
  coachingChatContent.includes("import auditLogger from"),
  '❌ CoachingChat should import AuditLogger'
);
console.log('  ✅ CoachingChat imports AuditLogger');

assert(
  coachingChatContent.includes("auditLogger.log"),
  '❌ CoachingChat should use audit logging'
);
console.log('  ✅ CoachingChat uses audit logging');

console.log('  ✅ TEST 7 PASSED: Audit logging is integrated\n');

// ============================================================================
// TEST 8: ASR Theme Usage
// ============================================================================
console.log('TEST 8: ASR Theme Usage');

const mainStylePath = path.join(coachingModulePath, 'styles', 'CoachingApp.css');
assert(
  fs.existsSync(mainStylePath),
  '❌ CoachingApp.css should exist'
);

const mainStyleContent = fs.readFileSync(mainStylePath, 'utf-8');

assert(
  mainStyleContent.includes('--asr-purple') || mainStyleContent.includes('var(--asr-'),
  '❌ Should use ASR theme CSS variables'
);
console.log('  ✅ Uses ASR theme CSS variables');

// Check component styles use ASR theme
const dashboardStylePath = path.join(coachingComponentsPath, 'CoachingDashboard.css');
const dashboardStyleContent = fs.readFileSync(dashboardStylePath, 'utf-8');

assert(
  dashboardStyleContent.includes('--asr-') || dashboardStyleContent.includes('var(--asr-'),
  '❌ CoachingDashboard should use ASR theme'
);
console.log('  ✅ CoachingDashboard.css uses ASR theme');

console.log('  ✅ TEST 8 PASSED: ASR theme is properly used\n');

// ============================================================================
// Summary
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ ALL SANITY TESTS PASSED!');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\nCoaching Module Status:');
console.log('  ✅ Module isolation verified');
console.log('  ✅ All components exist');
console.log('  ✅ Read-only cross-module access');
console.log('  ✅ Audit logging integrated');
console.log('  ✅ ASR theme applied');
console.log('\n');
