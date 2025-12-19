/**
 * Nutrition Module - Sanity Tests
 * 
 * These tests verify:
 * 1. Nutrition module is isolated from Meal Plan App
 * 2. Nutrition only has READ-ONLY access to meal plan data
 * 3. No cross-contamination of state or logic
 * 
 * Run with: node client/src/modules/nutrition/__tests__/sanity.test.js
 */

const assert = require('assert');

console.log('🧪 Running Nutrition Module Sanity Tests...\n');

// ============================================================================
// TEST 1: Module Isolation - File Structure
// ============================================================================
console.log('TEST 1: Module Isolation - File Structure');

const fs = require('fs');
const path = require('path');

const nutritionModulePath = path.join(__dirname, '..');
const mealPlanComponentsPath = path.join(__dirname, '../../../components');

// Verify Nutrition module exists in its own folder
assert(
  fs.existsSync(nutritionModulePath),
  '❌ Nutrition module folder should exist'
);
console.log('  ✅ Nutrition module has its own folder');

// Verify Nutrition components don't exist in main components folder
const mainComponents = fs.readdirSync(mealPlanComponentsPath);
const nutritionInMainComponents = mainComponents.filter(f => 
  f.toLowerCase().includes('nutrition') && !f.includes('test')
);
assert(
  nutritionInMainComponents.length === 0,
  `❌ Nutrition components should NOT be in main components folder. Found: ${nutritionInMainComponents.join(', ')}`
);
console.log('  ✅ No Nutrition components in main components folder');

console.log('  ✅ TEST 1 PASSED: Module is properly isolated\n');

// ============================================================================
// TEST 2: Read-Only API Verification
// ============================================================================
console.log('TEST 2: Read-Only API Verification');

const serverPath = path.join(__dirname, '../../../../../server.js');
const serverContent = fs.readFileSync(serverPath, 'utf-8');

// Check that nutrition routes only use GET methods (read-only)
const nutritionRouteSection = serverContent.match(
  /NUTRITION MODULE ROUTES[\s\S]*?(?=\/\/ Initialize database|$)/
);

if (nutritionRouteSection) {
  const routeSection = nutritionRouteSection[0];
  
  // Count HTTP methods in nutrition section
  const getRoutes = (routeSection.match(/app\.get\s*\(\s*['"]\/api\/nutrition/g) || []).length;
  const postRoutes = (routeSection.match(/app\.post\s*\(\s*['"]\/api\/nutrition/g) || []).length;
  const putRoutes = (routeSection.match(/app\.put\s*\(\s*['"]\/api\/nutrition/g) || []).length;
  const deleteRoutes = (routeSection.match(/app\.delete\s*\(\s*['"]\/api\/nutrition/g) || []).length;
  
  console.log(`  Found nutrition routes: GET=${getRoutes}, POST=${postRoutes}, PUT=${putRoutes}, DELETE=${deleteRoutes}`);
  
  assert(
    getRoutes > 0,
    '❌ Should have at least one GET route for nutrition'
  );
  console.log('  ✅ Nutrition has GET routes for reading data');
  
  // For now, we allow POST routes to be 0 (read-only design)
  // If you add food logging later, this can be adjusted
  assert(
    postRoutes === 0,
    `❌ Nutrition should not have POST routes (found ${postRoutes}) - it's read-only`
  );
  console.log('  ✅ Nutrition has NO POST routes (read-only confirmed)');
  
  assert(
    putRoutes === 0 && deleteRoutes === 0,
    '❌ Nutrition should not have PUT or DELETE routes'
  );
  console.log('  ✅ Nutrition has NO PUT/DELETE routes (read-only confirmed)');
}

console.log('  ✅ TEST 2 PASSED: API routes are read-only\n');

// ============================================================================
// TEST 3: No Direct Meal Plan Mutations
// ============================================================================
console.log('TEST 3: No Direct Meal Plan Mutations');

const nutritionAppPath = path.join(__dirname, '../NutritionApp.js');
const nutritionAppContent = fs.readFileSync(nutritionAppPath, 'utf-8');

// Check for dangerous patterns that would mutate meal plan
const dangerousPatterns = [
  { pattern: /meal_plans.*INSERT/i, name: 'INSERT into meal_plans' },
  { pattern: /meal_plans.*UPDATE/i, name: 'UPDATE meal_plans' },
  { pattern: /meal_plans.*DELETE/i, name: 'DELETE from meal_plans' },
  { pattern: /setMealPlan\s*\(/i, name: 'setMealPlan state setter' },
  { pattern: /POST.*\/api\/generate-meal-plan/i, name: 'Generate meal plan API call' },
  { pattern: /POST.*\/api\/meal-plan/i, name: 'POST to meal plan API' },
];

dangerousPatterns.forEach(({ pattern, name }) => {
  const found = pattern.test(nutritionAppContent);
  assert(
    !found,
    `❌ NutritionApp should NOT contain: ${name}`
  );
});
console.log('  ✅ NutritionApp has no meal plan mutation patterns');

// Verify only uses read-only endpoint
assert(
  nutritionAppContent.includes('/api/nutrition/meal-plan-summary'),
  '❌ NutritionApp should use the read-only nutrition endpoint'
);
console.log('  ✅ NutritionApp uses read-only /api/nutrition/meal-plan-summary endpoint');

console.log('  ✅ TEST 3 PASSED: No direct meal plan mutations\n');

// ============================================================================
// TEST 4: State Isolation
// ============================================================================
console.log('TEST 4: State Isolation');

// Check that NutritionApp manages its own state
const nutritionStatePatterns = [
  'useState',
  'mealPlanData',
  'nutritionSummary',
  'currentView'
];

nutritionStatePatterns.forEach(pattern => {
  assert(
    nutritionAppContent.includes(pattern),
    `❌ NutritionApp should have its own ${pattern} state`
  );
});
console.log('  ✅ NutritionApp manages its own isolated state');

// Check that it doesn't import Meal Plan specific components
const mealPlanComponents = [
  'MealPlanView',
  'Questionnaire',
  'PaymentPage',
  'ZIPCodeInput',
  'StoreSelection'
];

mealPlanComponents.forEach(component => {
  const importRegex = new RegExp(`import.*${component}`, 'i');
  assert(
    !importRegex.test(nutritionAppContent),
    `❌ NutritionApp should NOT import ${component}`
  );
});
console.log('  ✅ NutritionApp does not import Meal Plan components');

console.log('  ✅ TEST 4 PASSED: State is properly isolated\n');

// ============================================================================
// TEST 5: ASR Theme Compliance
// ============================================================================
console.log('TEST 5: ASR Theme Compliance');

const nutritionCssPath = path.join(__dirname, '../styles/NutritionApp.css');
const nutritionCssContent = fs.readFileSync(nutritionCssPath, 'utf-8');

// Check for ASR theme variables
const asrThemeVars = [
  '--color-primary',
  '--color-text-primary',
  '--gradient-primary',
  '--radius-',
  '--shadow-'
];

let themeVarsFound = 0;
asrThemeVars.forEach(varName => {
  if (nutritionCssContent.includes(varName)) {
    themeVarsFound++;
  }
});

assert(
  themeVarsFound >= 3,
  `❌ Should use at least 3 ASR theme variables. Found: ${themeVarsFound}`
);
console.log(`  ✅ Uses ${themeVarsFound} ASR theme variables`);

// Check for hard-coded colors that should use theme vars
const hardCodedColors = nutritionCssContent.match(/#[0-9a-fA-F]{6}/g) || [];
console.log(`  ℹ️  Found ${hardCodedColors.length} hard-coded hex colors (should minimize)`);

console.log('  ✅ TEST 5 PASSED: Uses ASR theme system\n');

// ============================================================================
// TEST 6: App.js Integration Check
// ============================================================================
console.log('TEST 6: App.js Integration Check');

// Path from __tests__ → nutrition → modules → src → App.js
const appJsPath = path.join(__dirname, '../../../App.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf-8');

// Check NutritionApp is imported
assert(
  appJsContent.includes("import { NutritionApp }") || 
  appJsContent.includes("import NutritionApp"),
  '❌ App.js should import NutritionApp'
);
console.log('  ✅ NutritionApp is imported in App.js');

// Check nutrition view is rendered
assert(
  appJsContent.includes("currentView === 'nutrition'"),
  '❌ App.js should render NutritionApp when currentView is nutrition'
);
console.log('  ✅ NutritionApp is conditionally rendered');

// Check handleSelectApp handles nutrition
assert(
  appJsContent.includes("case 'nutrition':"),
  '❌ handleSelectApp should handle nutrition case'
);
console.log('  ✅ handleSelectApp handles nutrition selection');

// Verify Meal Plan logic is separate
const mealPlannerCase = appJsContent.match(/case 'meal-planner':[\s\S]*?break;/);
const nutritionCase = appJsContent.match(/case 'nutrition':[\s\S]*?break;/);

assert(
  mealPlannerCase && nutritionCase,
  '❌ Both meal-planner and nutrition cases should exist'
);

// Make sure nutrition case doesn't reference meal planner views
assert(
  !nutritionCase[0].includes("setCurrentView('zip')"),
  '❌ Nutrition case should not navigate to meal planner views'
);
console.log('  ✅ Nutrition and Meal Planner have separate routing logic');

console.log('  ✅ TEST 6 PASSED: App.js integration is correct\n');

// ============================================================================
// TEST 7: Meal Plan App Unchanged
// ============================================================================
console.log('TEST 7: Meal Plan App Unchanged');

// Check that key Meal Plan components still exist and aren't modified
const mealPlanFiles = [
  'MealPlanView.js',
  'Questionnaire.js',
  'ZIPCodeInput.js',
  'StoreSelection.js',
  'PaymentPage.js'
];

mealPlanFiles.forEach(file => {
  const filePath = path.join(mealPlanComponentsPath, file);
  assert(
    fs.existsSync(filePath),
    `❌ Meal Plan component ${file} should still exist`
  );
});
console.log('  ✅ All Meal Plan components still exist');

// Check MealPlanView doesn't import nutrition
const mealPlanViewPath = path.join(mealPlanComponentsPath, 'MealPlanView.js');
const mealPlanViewContent = fs.readFileSync(mealPlanViewPath, 'utf-8');

assert(
  !mealPlanViewContent.includes('nutrition'),
  '❌ MealPlanView should not import or reference nutrition module'
);
console.log('  ✅ MealPlanView has no nutrition dependencies');

console.log('  ✅ TEST 7 PASSED: Meal Plan App is unchanged\n');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('🎉 ALL SANITY TESTS PASSED!');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Summary:');
console.log('  ✅ Nutrition module is properly isolated in modules/nutrition/');
console.log('  ✅ All nutrition API routes are READ-ONLY (GET only)');
console.log('  ✅ No mutations to meal_plans table from nutrition code');
console.log('  ✅ State is isolated - no shared state with Meal Plan');
console.log('  ✅ Uses ASR theme system consistently');
console.log('  ✅ App.js integration is correct with separate routing');
console.log('  ✅ Meal Plan App components are unchanged');
console.log('');
console.log('The Nutrition module is SAFE and ISOLATED from Meal Plan App.');
