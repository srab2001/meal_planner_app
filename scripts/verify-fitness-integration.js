#!/usr/bin/env node

/**
 * Fitness App Integration Verification Script
 *
 * Checks that the switchboard is properly configured to connect
 * to the new Fitness Coach app.
 *
 * Run: node scripts/verify-fitness-integration.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const EXPECTED_FITNESS_URL = 'https://frontend-j7rsl34t3-stus-projects-458dd35a.vercel.app';
const SWITCHBOARD_PATH = path.join(__dirname, '../client/src/components/AppSwitchboard.js');
const APP_JS_PATH = path.join(__dirname, '../client/src/App.js');
const FITNESS_QUESTIONNAIRE_PATH = path.join(__dirname, '../fitness/frontend/src/components/AICoachQuestionnaire.jsx');
const FITNESS_CREATE_GOAL_PATH = path.join(__dirname, '../fitness/frontend/src/components/CreateGoal.jsx');
const FITNESS_WORKOUT_RESULT_PATH = path.join(__dirname, '../fitness/frontend/src/components/WorkoutPlanResult.jsx');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(status, message) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'warn' ? '⚠️' : 'ℹ️';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : status === 'warn' ? colors.yellow : colors.blue;
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

function header(title) {
  console.log(`\n${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// Check if file exists
function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch {
    return false;
  }
}

// Read file contents
function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    return null;
  }
}

// Check URL is accessible
function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    req.on('error', (err) => {
      resolve({ status: 0, ok: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ok: false, error: 'Timeout' });
    });
  });
}

async function runChecks() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  header('FITNESS APP INTEGRATION VERIFICATION');
  console.log(`Verifying fitness app integration settings...\n`);

  // ============================================
  // 1. Check Switchboard Configuration
  // ============================================
  header('1. SWITCHBOARD CONFIGURATION');

  // Check AppSwitchboard.js exists
  if (fileExists(SWITCHBOARD_PATH)) {
    log('pass', 'AppSwitchboard.js exists');
    results.passed++;

    const switchboardContent = readFile(SWITCHBOARD_PATH);

    // Check for externalUrl property
    if (switchboardContent.includes('externalUrl:')) {
      log('pass', 'Fitness app configured with externalUrl');
      results.passed++;
    } else {
      log('fail', 'Missing externalUrl property for fitness app');
      results.failed++;
    }

    // Check for correct URL
    if (switchboardContent.includes(EXPECTED_FITNESS_URL)) {
      log('pass', `Correct fitness URL: ${EXPECTED_FITNESS_URL}`);
      results.passed++;
    } else {
      log('fail', `Expected fitness URL not found: ${EXPECTED_FITNESS_URL}`);
      results.failed++;

      // Try to find what URL is configured
      const urlMatch = switchboardContent.match(/externalUrl:\s*['"]([^'"]+)['"]/);
      if (urlMatch) {
        log('warn', `Found different URL: ${urlMatch[1]}`);
        results.warnings++;
      }
    }

    // Check for Demo Login handler
    if (switchboardContent.includes('handleDemoLogin')) {
      log('pass', 'Demo login handler exists');
      results.passed++;
    } else {
      log('fail', 'Missing demo login handler');
      results.failed++;
    }

    // Check for Google Login handler
    if (switchboardContent.includes('handleGoogleLogin')) {
      log('pass', 'Google login handler exists');
      results.passed++;
    } else {
      log('fail', 'Missing Google login handler');
      results.failed++;
    }

    // Check for onLogin prop
    if (switchboardContent.includes('onLogin')) {
      log('pass', 'onLogin prop is used');
      results.passed++;
    } else {
      log('warn', 'onLogin prop not found');
      results.warnings++;
    }

  } else {
    log('fail', `AppSwitchboard.js not found at ${SWITCHBOARD_PATH}`);
    results.failed++;
  }

  // ============================================
  // 2. Check App.js Configuration
  // ============================================
  header('2. APP.JS CONFIGURATION');

  if (fileExists(APP_JS_PATH)) {
    log('pass', 'App.js exists');
    results.passed++;

    const appContent = readFile(APP_JS_PATH);

    // Check for onLogin prop passed to AppSwitchboard
    if (appContent.includes('onLogin={handleLogin}') && appContent.includes('AppSwitchboard')) {
      log('pass', 'onLogin prop passed to AppSwitchboard');
      results.passed++;
    } else {
      log('fail', 'onLogin prop not passed to AppSwitchboard');
      results.failed++;
    }

  } else {
    log('fail', `App.js not found at ${APP_JS_PATH}`);
    results.failed++;
  }

  // ============================================
  // 3. Check Fitness App Components
  // ============================================
  header('3. FITNESS APP COMPONENTS');

  // AICoachQuestionnaire.jsx
  if (fileExists(FITNESS_QUESTIONNAIRE_PATH)) {
    log('pass', 'AICoachQuestionnaire.jsx exists');
    results.passed++;

    const questionnaireContent = readFile(FITNESS_QUESTIONNAIRE_PATH);

    // Check for demo user handling
    if (questionnaireContent.includes('isDemoUser') && questionnaireContent.includes('demo-token-')) {
      log('pass', 'Demo user handling in questionnaire');
      results.passed++;
    } else {
      log('fail', 'Missing demo user handling in questionnaire');
      results.failed++;
    }

    // Check for smart workout generation
    if (questionnaireContent.includes('intensityAnswer') && questionnaireContent.includes('focusType')) {
      log('pass', 'Smart workout generation based on user answers');
      results.passed++;
    } else {
      log('warn', 'Basic workout generation (not personalized)');
      results.warnings++;
    }

    // Check for pool/gym support
    if (questionnaireContent.includes('includePool') && questionnaireContent.includes('includeGym')) {
      log('pass', 'Pool and gym location support');
      results.passed++;
    } else {
      log('warn', 'Limited location support');
      results.warnings++;
    }

  } else {
    log('fail', `AICoachQuestionnaire.jsx not found`);
    results.failed++;
  }

  // CreateGoal.jsx
  if (fileExists(FITNESS_CREATE_GOAL_PATH)) {
    log('pass', 'CreateGoal.jsx exists');
    results.passed++;

    const createGoalContent = readFile(FITNESS_CREATE_GOAL_PATH);

    if (createGoalContent.includes('isDemoUser')) {
      log('pass', 'Demo user bypass in CreateGoal');
      results.passed++;
    } else {
      log('fail', 'Missing demo user handling in CreateGoal');
      results.failed++;
    }

  } else {
    log('fail', `CreateGoal.jsx not found`);
    results.failed++;
  }

  // WorkoutPlanResult.jsx
  if (fileExists(FITNESS_WORKOUT_RESULT_PATH)) {
    log('pass', 'WorkoutPlanResult.jsx exists');
    results.passed++;

    const workoutContent = readFile(FITNESS_WORKOUT_RESULT_PATH);

    if (workoutContent.includes('isDemoUser') && workoutContent.includes('demoWorkouts')) {
      log('pass', 'Demo user local save in WorkoutPlanResult');
      results.passed++;
    } else {
      log('warn', 'Demo save to localStorage may not be configured');
      results.warnings++;
    }

  } else {
    log('fail', `WorkoutPlanResult.jsx not found`);
    results.failed++;
  }

  // ============================================
  // 4. Check URL Accessibility
  // ============================================
  header('4. URL ACCESSIBILITY');

  console.log(`Checking ${EXPECTED_FITNESS_URL}...`);
  const urlCheck = await checkUrl(EXPECTED_FITNESS_URL);

  if (urlCheck.ok) {
    log('pass', `Fitness app URL is accessible (HTTP ${urlCheck.status})`);
    results.passed++;
  } else {
    log('fail', `Fitness app URL not accessible: ${urlCheck.error || `HTTP ${urlCheck.status}`}`);
    results.failed++;
  }

  // ============================================
  // 5. Summary
  // ============================================
  header('VERIFICATION SUMMARY');

  console.log(`${colors.green}Passed:   ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:   ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log('');

  if (results.failed === 0) {
    log('pass', 'All critical checks passed! Fitness app integration is ready.');
  } else {
    log('fail', `${results.failed} check(s) failed. Please fix the issues above.`);
  }

  // ============================================
  // 6. Deployment Reminder
  // ============================================
  header('DEPLOYMENT CHECKLIST');

  console.log(`To deploy the updated switchboard to meal-planner-gold-one.vercel.app:`);
  console.log('');
  console.log(`  1. Navigate to meal planner root:`);
  console.log(`     ${colors.blue}cd /path/to/meal_planner_app${colors.reset}`);
  console.log('');
  console.log(`  2. Pull latest changes:`);
  console.log(`     ${colors.blue}git pull origin claude/review-app-documents-gyEij${colors.reset}`);
  console.log('');
  console.log(`  3. Deploy client to Vercel:`);
  console.log(`     ${colors.blue}cd client && vercel --prod${colors.reset}`);
  console.log('');
  console.log(`After deployment, clicking "Fitness Coach" on the switchboard will`);
  console.log(`open the new fitness app at: ${EXPECTED_FITNESS_URL}`);
  console.log('');

  return results.failed === 0 ? 0 : 1;
}

// Run
runChecks()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    console.error('Error running verification:', err);
    process.exit(1);
  });
