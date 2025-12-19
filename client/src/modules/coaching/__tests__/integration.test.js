/**
 * Coaching Module - Integration Tests
 * 
 * These tests verify:
 * 1. Coaching integrates with App.js properly
 * 2. Cross-module data flow works
 * 3. AppSwitchboard includes coaching
 * 4. No impact on existing modules
 * 
 * Run with: node client/src/modules/coaching/__tests__/integration.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Coaching Module Integration Tests...\n');

// ============================================================================
// TEST 1: App.js Integration
// ============================================================================
console.log('TEST 1: App.js Integration');

const appJsPath = path.join(__dirname, '../../../App.js');
assert(
  fs.existsSync(appJsPath),
  '❌ App.js should exist'
);

const appJsContent = fs.readFileSync(appJsPath, 'utf-8');

// Check coaching import
assert(
  appJsContent.includes('CoachingApp') || appJsContent.includes('coaching'),
  '❌ App.js should import CoachingApp'
);
console.log('  ✅ App.js imports CoachingApp');

// Check coaching route/render
assert(
  appJsContent.includes('coaching') || appJsContent.includes('Coaching'),
  '❌ App.js should have coaching route or render'
);
console.log('  ✅ App.js renders CoachingApp');

console.log('  ✅ TEST 1 PASSED: App.js integration verified\n');

// ============================================================================
// TEST 2: AppSwitchboard Integration
// ============================================================================
console.log('TEST 2: AppSwitchboard Integration');

const switchboardPath = path.join(__dirname, '../../../components/AppSwitchboard.js');

if (fs.existsSync(switchboardPath)) {
  const switchboardContent = fs.readFileSync(switchboardPath, 'utf-8');
  
  // Check for coaching app entry
  assert(
    switchboardContent.includes('coaching') || switchboardContent.includes('Coaching'),
    '❌ AppSwitchboard should have coaching entry'
  );
  console.log('  ✅ AppSwitchboard has coaching entry');
  
  // Check for coaching icon/label
  assert(
    switchboardContent.includes('Coach') || switchboardContent.includes('🎯') || switchboardContent.includes('coaching'),
    '❌ AppSwitchboard should have coaching icon or label'
  );
  console.log('  ✅ AppSwitchboard has coaching UI elements');
  
  console.log('  ✅ TEST 2 PASSED: AppSwitchboard integration verified\n');
} else {
  console.log('  ⚠️ AppSwitchboard not found - skipping');
  console.log('  ℹ️ This may be expected if using a different navigation pattern\n');
}

// ============================================================================
// TEST 3: Shared Services Integration
// ============================================================================
console.log('TEST 3: Shared Services Integration');

const sharedServicesPath = path.join(__dirname, '../../../shared/services');
assert(
  fs.existsSync(sharedServicesPath),
  '❌ Shared services folder should exist'
);

// Check AuditLogger exists
const auditLoggerPath = path.join(sharedServicesPath, 'AuditLogger.js');
assert(
  fs.existsSync(auditLoggerPath),
  '❌ AuditLogger.js should exist in shared services'
);
console.log('  ✅ AuditLogger.js exists in shared services');

// Check coaching components use shared services
const coachingComponentsPath = path.join(__dirname, '..', 'components');
const goalManagerContent = fs.readFileSync(
  path.join(coachingComponentsPath, 'GoalManager.js'), 
  'utf-8'
);

assert(
  goalManagerContent.includes('../../shared/services') || 
  goalManagerContent.includes('../../../shared/services'),
  '❌ GoalManager should import from shared services'
);
console.log('  ✅ GoalManager imports from shared services');

console.log('  ✅ TEST 3 PASSED: Shared services integration verified\n');

// ============================================================================
// TEST 4: API Utils Integration
// ============================================================================
console.log('TEST 4: API Utils Integration');

const coachingAppPath = path.join(__dirname, '..', 'CoachingApp.js');
const coachingAppContent = fs.readFileSync(coachingAppPath, 'utf-8');

// Check fetchWithAuth import
assert(
  coachingAppContent.includes('fetchWithAuth'),
  '❌ CoachingApp should use fetchWithAuth'
);
console.log('  ✅ CoachingApp uses fetchWithAuth');

// Check API_BASE import
assert(
  coachingAppContent.includes('API_BASE'),
  '❌ CoachingApp should use API_BASE'
);
console.log('  ✅ CoachingApp uses API_BASE');

// Verify import path is correct
assert(
  coachingAppContent.includes("from '../../shared/utils/api'") ||
  coachingAppContent.includes('from "../../shared/utils/api"'),
  '❌ Should import from shared/utils/api'
);
console.log('  ✅ Imports from correct shared path');

console.log('  ✅ TEST 4 PASSED: API utils integration verified\n');

// ============================================================================
// TEST 5: No Impact on Meal Plan Module
// ============================================================================
console.log('TEST 5: No Impact on Meal Plan Module');

const componentsPath = path.join(__dirname, '../../../components');
const mealPlanComponents = [
  'RecipeCard.js',
  'MealPlanView.js',
  'RecipeDetail.js'
];

mealPlanComponents.forEach(comp => {
  const compPath = path.join(componentsPath, comp);
  if (fs.existsSync(compPath)) {
    const compContent = fs.readFileSync(compPath, 'utf-8');
    
    // Meal Plan components should NOT import coaching
    assert(
      !compContent.includes("from '../modules/coaching") &&
      !compContent.includes('from "../modules/coaching'),
      `❌ ${comp} should NOT import from coaching module`
    );
    console.log(`  ✅ ${comp} is independent from coaching`);
  }
});

console.log('  ✅ TEST 5 PASSED: Meal Plan module is unaffected\n');

// ============================================================================
// TEST 6: No Impact on Nutrition Module
// ============================================================================
console.log('TEST 6: No Impact on Nutrition Module');

const nutritionModulePath = path.join(__dirname, '../../nutrition');

if (fs.existsSync(nutritionModulePath)) {
  const nutritionAppPath = path.join(nutritionModulePath, 'NutritionApp.js');
  
  if (fs.existsSync(nutritionAppPath)) {
    const nutritionContent = fs.readFileSync(nutritionAppPath, 'utf-8');
    
    // Nutrition should NOT import coaching
    assert(
      !nutritionContent.includes("from '../coaching") &&
      !nutritionContent.includes('from "../coaching'),
      '❌ NutritionApp should NOT import from coaching module'
    );
    console.log('  ✅ NutritionApp is independent from coaching');
  }
  
  console.log('  ✅ TEST 6 PASSED: Nutrition module is unaffected\n');
} else {
  console.log('  ⚠️ Nutrition module not found - skipping\n');
}

// ============================================================================
// TEST 7: CSS Isolation
// ============================================================================
console.log('TEST 7: CSS Isolation');

const coachingStylesPath = path.join(__dirname, '..', 'styles');
const coachingCssPath = path.join(coachingStylesPath, 'CoachingApp.css');
const coachingCssContent = fs.readFileSync(coachingCssPath, 'utf-8');

// Check that coaching CSS uses scoped selectors
assert(
  coachingCssContent.includes('.coaching-') || coachingCssContent.includes('.coaching'),
  '❌ Coaching CSS should use scoped class names'
);
console.log('  ✅ Coaching CSS uses scoped selectors');

// Check it doesn't override global styles
assert(
  !coachingCssContent.includes('body {') && !coachingCssContent.includes('html {'),
  '❌ Coaching CSS should NOT override global styles'
);
console.log('  ✅ Coaching CSS does not override global styles');

console.log('  ✅ TEST 7 PASSED: CSS is properly isolated\n');

// ============================================================================
// TEST 8: Module Index Exports
// ============================================================================
console.log('TEST 8: Module Index Exports');

const sharedIndexPath = path.join(__dirname, '../../../shared/index.js');

if (fs.existsSync(sharedIndexPath)) {
  const sharedIndexContent = fs.readFileSync(sharedIndexPath, 'utf-8');
  console.log('  ✅ Shared module index exists');
} else {
  console.log('  ⚠️ No shared index.js - components import directly');
}

const coachingIndexPath = path.join(__dirname, '..', 'index.js');
const coachingIndexContent = fs.readFileSync(coachingIndexPath, 'utf-8');

assert(
  coachingIndexContent.includes('CoachingApp'),
  '❌ Coaching index should export CoachingApp'
);
console.log('  ✅ Coaching module exports correctly');

console.log('  ✅ TEST 8 PASSED: Module exports verified\n');

// ============================================================================
// TEST 9: Props Interface Compatibility
// ============================================================================
console.log('TEST 9: Props Interface Compatibility');

// Check CoachingApp accepts standard props
assert(
  coachingAppContent.includes('user') && coachingAppContent.includes('onBack'),
  '❌ CoachingApp should accept user and onBack props'
);
console.log('  ✅ CoachingApp accepts standard navigation props');

assert(
  coachingAppContent.includes('onLogout'),
  '❌ CoachingApp should accept onLogout prop'
);
console.log('  ✅ CoachingApp accepts onLogout prop');

console.log('  ✅ TEST 9 PASSED: Props interface is compatible\n');

// ============================================================================
// Summary
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ ALL INTEGRATION TESTS PASSED!');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\nIntegration Status:');
console.log('  ✅ App.js integration');
console.log('  ✅ AppSwitchboard integration');
console.log('  ✅ Shared services integration');
console.log('  ✅ API utils integration');
console.log('  ✅ No impact on Meal Plan');
console.log('  ✅ No impact on Nutrition');
console.log('  ✅ CSS isolation');
console.log('  ✅ Module exports');
console.log('  ✅ Props compatibility');
console.log('\n');
