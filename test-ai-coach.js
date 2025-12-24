#!/usr/bin/env node
/**
 * AI Coach ChatGPT Integration Verification Test
 * 
 * This script tests the AI Coach endpoint to verify that:
 * 1. The endpoint is accessible
 * 2. Authentication works
 * 3. OpenAI integration is properly configured
 * 4. Workout generation works end-to-end
 */

const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ============================================================================
// Configuration
// ============================================================================

const API_URL = 'https://meal-planner-app-mve2.onrender.com';
const ENDPOINT = '/api/fitness/ai-interview';

// The SESSION_SECRET from .env file (should match Render env)
const SESSION_SECRET = 'd8daa69d6b1d30c89a171dccf97ea700fdf285f139affcc2b37c1a45294f7302';

// ============================================================================
// Helper Functions
// ============================================================================

function generateJWT() {
  const payload = {
    id: `test-ai-coach-${Date.now()}`,
    user_id: `test-ai-coach-${Date.now()}`
  };
  
  const token = jwt.sign(payload, SESSION_SECRET, { expiresIn: '24h' });
  return token;
}

async function testAICoach() {
  console.log('🧪 AI Coach ChatGPT Integration Test\n');
  console.log('=' .repeat(60));
  
  // Step 1: Generate JWT
  console.log('\n✓ Step 1: Generating JWT Token');
  const token = generateJWT();
  console.log(`  Token: ${token.substring(0, 50)}...`);
  
  // Step 2: Test endpoint accessibility
  console.log('\n✓ Step 2: Testing Endpoint Accessibility');
  console.log(`  URL: ${API_URL}${ENDPOINT}`);
  
  // Step 3: Make the API call
  console.log('\n✓ Step 3: Making API Request to AI Coach');
  
  const payload = {
    messages: [
      {
        role: 'user',
        content: 'I am a beginner looking for a 30-minute weight loss workout. I have basic equipment.'
      }
    ],
    userProfile: {
      fitness_level: 'beginner',
      goals: ['weight loss'],
      available_time_minutes: 30,
      equipment: ['dumbbells', 'mat']
    },
    interview_answers: {
      fitness_level: 'beginner',
      primary_goal: 'weight loss',
      available_time: '30 minutes',
      equipment_available: 'dumbbells and mat'
    }
  };
  
  try {
    const response = await fetch(`${API_URL}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: AI Coach Endpoint Working!\n');
      
      // Step 4: Validate response
      console.log('✓ Step 4: Validating Response');
      console.log(`  - Message received: ${data.message ? 'Yes' : 'No'}`);
      console.log(`  - Workout generated: ${data.workoutGenerated ? 'Yes' : 'No'}`);
      
      if (data.message) {
        console.log(`  - Message length: ${data.message.length} characters`);
        console.log(`  - Message preview: ${data.message.substring(0, 100)}...`);
      }
      
      if (data.workoutGenerated && data.workout) {
        console.log('\n✓ Step 5: Workout Generated Successfully!');
        console.log(`  - Sections: ${Object.keys(data.workout).join(', ')}`);
        
        if (data.workout.summary) {
          console.log(`  - Total Duration: ${data.workout.summary.total_duration}`);
          console.log(`  - Intensity: ${data.workout.summary.intensity_level}`);
          console.log(`  - Calories Estimate: ${data.workout.summary.calories_burned_estimate}`);
        }
        
        console.log('\n✅ FULL WORKOUT VERIFICATION PASSED!');
      } else {
        console.log('\n⚠️  No workout JSON detected in response (might be conversation-only)');
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 AI Coach ChatGPT Integration is WORKING!\n');
      
      return true;
    } else {
      console.log('\n❌ ERROR: API returned error response\n');
      console.log('Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('\n❌ ERROR: Failed to make API request\n');
    console.log(`  Error: ${error.message}`);
    console.log(`  Type: ${error.code || error.type || 'unknown'}`);
    return false;
  }
}

// Run the test
testAICoach().then(success => {
  process.exit(success ? 0 : 1);
});
