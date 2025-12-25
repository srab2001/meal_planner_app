#!/usr/bin/env node

/**
 * Debug script to test OpenAI API integration for Fitness AI Coach
 * This simulates the backend calling OpenAI with a dumbbell workout request
 */

const https = require('https');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_URL = process.env.API_URL || 'https://meal-planner-app-mve2.onrender.com';

console.log('🧪 Testing Fitness AI Coach OpenAI Integration');
console.log('=============================================\n');

// Check if API key is available
if (!OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY not found in environment');
  console.error('   Make sure .env file has OPENAI_API_KEY set');
  process.exit(1);
}

console.log('✅ OPENAI_API_KEY found');
console.log(`   Length: ${OPENAI_API_KEY.length} chars`);
console.log(`   Format: ${OPENAI_API_KEY.substring(0, 20)}...`);
console.log('');

// Test 1: Direct OpenAI API call (simulating what the backend does)
console.log('Test 1: Direct OpenAI API Call');
console.log('------------------------------');

const openaiRequest = JSON.stringify({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'You are a professional fitness coach. Create a dumbbell workout plan in JSON format with warm_up, strength, cardio, agility, recovery, closeout, and summary sections.'
    },
    {
      role: 'user',
      content: 'Create a dumbbell workout plan for someone who wants to build muscle. I have 60 minutes and intermediate fitness level.'
    }
  ],
  temperature: 0.7,
  max_tokens: 500
});

console.log('Sending request to OpenAI...');

const openaiOptions = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(openaiRequest),
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  }
};

const openaiReq = https.request(openaiOptions, (res) => {
  console.log(`✅ Response Status: ${res.statusCode}`);
  console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📨 OpenAI Response:');
    console.log('---');
    
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.error('❌ OpenAI API Error:');
        console.error(`   Code: ${response.error.code}`);
        console.error(`   Message: ${response.error.message}`);
        console.error(`   Type: ${response.error.type}`);
        process.exit(1);
      }
      
      if (response.choices && response.choices[0]) {
        const message = response.choices[0].message.content;
        console.log('✅ Received message from OpenAI:');
        console.log('');
        console.log(message.substring(0, 300) + (message.length > 300 ? '...' : ''));
        console.log('');
        
        // Try to parse workout JSON if present
        const workoutMatch = message.match(/<WORKOUT_JSON>([\s\S]*?)<\/WORKOUT_JSON>/);
        if (workoutMatch) {
          console.log('✅ Workout JSON found in response');
          try {
            const workout = JSON.parse(workoutMatch[1]);
            console.log('✅ Valid JSON structure');
            console.log(`   Sections: ${Object.keys(workout).join(', ')}`);
          } catch (e) {
            console.warn('⚠️  Workout JSON parse error:', e.message);
          }
        } else {
          console.log('ℹ️  No <WORKOUT_JSON> tags found in response');
        }
        
        console.log('\n✅ Test 1 PASSED - OpenAI integration works!');
      } else {
        console.error('❌ No choices in response');
        console.error(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.error('❌ Failed to parse OpenAI response:', e.message);
      console.error('Raw response:', data);
    }
    
    // Test 2: Test the actual endpoint
    console.log('\n\nTest 2: Actual Fitness API Endpoint');
    console.log('-----------------------------------');
    console.log('⚠️  Note: This requires authentication');
    console.log('To get a valid token:');
    console.log('1. Login to the app: https://meal-planner-gold-one.vercel.app');
    console.log('2. Open DevTools → Application → localStorage');
    console.log('3. Copy the auth_token value');
    console.log('4. Export it: export AUTH_TOKEN="<token>"');
    console.log('5. Run this script again with the token');
    console.log('');
    
    const authToken = process.env.AUTH_TOKEN;
    
    if (authToken) {
      console.log('Found AUTH_TOKEN in environment. Testing endpoint...');
      testEndpoint(authToken);
    } else {
      console.log('ℹ️  Skipping endpoint test (no AUTH_TOKEN)');
      console.log('\n✅ OpenAI API is working correctly!');
    }
  });
});

openaiReq.on('error', (error) => {
  console.error('❌ Request failed:', error);
  console.error('');
  console.error('Possible causes:');
  console.error('1. No internet connection');
  console.error('2. OpenAI API key is invalid or expired');
  console.error('3. OpenAI API is down');
  console.error('4. Firewall/proxy blocking the connection');
  process.exit(1);
});

openaiReq.write(openaiRequest);
openaiReq.end();

// Function to test the actual endpoint
function testEndpoint(token) {
  const endpointRequest = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Create a dumbbell workout for muscle building with 60 minutes and intermediate level'
      }
    ]
  });
  
  const url = new URL('/api/fitness/ai-interview', API_URL);
  const options = {
    method: 'POST',
    hostname: url.hostname,
    path: url.pathname + url.search,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(endpointRequest),
      'Authorization': `Bearer ${token}`
    }
  };
  
  if (url.protocol === 'https:') {
    const req = https.request(options, (res) => {
      console.log(`\n✅ Endpoint Response Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            console.error('❌ Endpoint Error:', response.error);
          } else {
            console.log('✅ Endpoint Success!');
            console.log(`   Message: ${response.message?.substring(0, 100)}...`);
            if (response.workoutGenerated) {
              console.log('✅ Workout was generated!');
            }
          }
        } catch (e) {
          console.error('Response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Endpoint request failed:', error.message);
    });
    
    req.write(endpointRequest);
    req.end();
  }
}
