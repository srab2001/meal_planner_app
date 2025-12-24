#!/usr/bin/env node
/**
 * AI Coach Live Testing Script
 * 
 * This script provides tools for testing the AI Coach ChatGPT integration.
 * 
 * Usage:
 *   node test-ai-coach-advanced.js <command> [options]
 * 
 * Commands:
 *   generate-token <secret>     - Generate a JWT token with given secret
 *   test-endpoint <token>       - Test AI Coach endpoint with token
 *   test-full <secret>          - Full end-to-end test with secret
 *   help                        - Show this help message
 */

const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'https://meal-planner-app-mve2.onrender.com';
const ENDPOINT = '/api/fitness/ai-interview';

// ============================================================================
// Commands
// ============================================================================

async function generateToken(secret) {
  console.log('🔐 Generating JWT Token\n');
  
  const payload = {
    id: `test-ai-coach-${Date.now()}`,
    user_id: `test-ai-coach-${Date.now()}`
  };
  
  try {
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });
    
    console.log('✅ Token Generated Successfully\n');
    console.log('Token (full):');
    console.log(token);
    console.log('\nToken (base64 header + payload):');
    console.log(token.split('.').slice(0, 2).join('.'));
    
    return token;
  } catch (error) {
    console.error('❌ Error generating token:', error.message);
    return null;
  }
}

async function testEndpoint(token) {
  console.log('\n🧪 Testing AI Coach Endpoint\n');
  console.log('=' .repeat(70));
  
  const payload = {
    messages: [
      {
        role: 'user',
        content: 'I am a beginner looking for a 30-minute weight loss workout. I can do exercises at home.'
      }
    ],
    userProfile: {
      fitness_level: 'beginner',
      goals: ['weight loss'],
      available_time_minutes: 30,
      equipment: ['none - bodyweight only']
    },
    interview_answers: {
      fitness_level: 'beginner',
      primary_goal: 'weight loss',
      available_time: '30 minutes',
      equipment: 'No equipment (bodyweight only)',
      location: 'home',
      injury_concerns: 'none'
    }
  };
  
  try {
    console.log('\nMaking request to:', `${API_URL}${ENDPOINT}`);
    console.log('Method: POST');
    console.log('Auth: Bearer token (JWT)');
    console.log('Body: Interview data with fitness profile\n');
    
    const response = await fetch(`${API_URL}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response Status:', response.status, response.statusText);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ REQUEST SUCCESSFUL!\n');
      
      console.log('📝 AI Response:');
      console.log(data.message || '(no message)');
      
      if (data.workoutGenerated && data.workout) {
        console.log('\n💪 Workout Generated:');
        console.log(JSON.stringify(data.workout, null, 2));
        
        console.log('\n✅ FULL END-TO-END TEST PASSED!');
        console.log('   - ChatGPT API called successfully');
        console.log('   - Workout JSON generated');
        console.log('   - Response structure correct');
      } else {
        console.log('\n⚠️  Conversation-mode response (no workout JSON generated)');
      }
    } else {
      console.log('\n❌ ERROR Response:\n');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.error === 'invalid_token') {
        console.log('\n💡 Hint: Token verification failed. Possible causes:');
        console.log('   1. Secret key does not match Render server\'s SESSION_SECRET');
        console.log('   2. Token has expired');
        console.log('   3. Token format is invalid');
      }
    }
    
  } catch (error) {
    console.log('\n❌ REQUEST FAILED:\n');
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code || 'unknown'}`);
  }
  
  console.log('\n' + '='.repeat(70));
}

async function testFull(secret) {
  console.log('🚀 Full End-to-End AI Coach Test\n');
  
  const token = await generateToken(secret);
  if (!token) {
    console.log('❌ Token generation failed');
    return;
  }
  
  await testEndpoint(token);
}

// ============================================================================
// Help & CLI
// ============================================================================

function showHelp() {
  console.log(`
AI Coach Live Testing Script
=============================

Usage: node test-ai-coach-advanced.js <command> [options]

Commands:

  generate-token <secret>
    Generate a JWT token using the provided secret
    Example: node test-ai-coach-advanced.js generate-token "my-secret-key"

  test-endpoint <token>
    Test the AI Coach endpoint with a provided JWT token
    Example: node test-ai-coach-advanced.js test-endpoint "eyJhbGc..."

  test-full <secret>
    Run full end-to-end test: generate token, then test endpoint
    Example: node test-ai-coach-advanced.js test-full "my-secret-key"

  help
    Show this help message

Examples:

  # If you know the Render server's SESSION_SECRET:
  node test-ai-coach-advanced.js test-full "d8daa69d6b1d30c89a171dccf97ea700fdf285f139affcc2b37c1a45294f7302"

  # If you have a valid token from another test/user:
  node test-ai-coach-advanced.js test-endpoint "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  # To generate a token and copy it for manual testing:
  node test-ai-coach-advanced.js generate-token "your-secret-here"

Note: The Render production server likely has a different SESSION_SECRET than
what's committed to git for security reasons. To test in production, you'll need:
1. A valid authentication token from an actual user login
2. The actual SESSION_SECRET value set in Render environment variables
3. Or test through the frontend UI after logging in

  `);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'generate-token':
      if (!args[1]) {
        console.error('❌ Error: secret required\n');
        console.log('Usage: generate-token <secret>\n');
        process.exit(1);
      }
      await generateToken(args[1]);
      break;
      
    case 'test-endpoint':
      if (!args[1]) {
        console.error('❌ Error: token required\n');
        console.log('Usage: test-endpoint <token>\n');
        process.exit(1);
      }
      await testEndpoint(args[1]);
      break;
      
    case 'test-full':
      if (!args[1]) {
        console.error('❌ Error: secret required\n');
        console.log('Usage: test-full <secret>\n');
        process.exit(1);
      }
      await testFull(args[1]);
      break;
      
    case 'help':
    case '-h':
    case '--help':
      showHelp();
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
  }
}

main().catch(console.error);
