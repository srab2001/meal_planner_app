#!/usr/bin/env node
/**
 * JWT Token Generator
 * 
 * Generates a test JWT token for local testing and API calls.
 * Usage: node generate-token.js [user_id] [expires_in]
 * 
 * Examples:
 *   node generate-token.js
 *   node generate-token.js test-user-123
 *   node generate-token.js admin-user 24h
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

// Get arguments
const userId = process.argv[2] || 'test-user-' + Date.now();
const expiresIn = process.argv[3] || '24h';

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET not found in .env file');
  console.error('Make sure .env file exists in fitness/backend/');
  process.exit(1);
}

// Create token
const token = jwt.sign(
  { 
    user_id: userId,
    iat: Math.floor(Date.now() / 1000),
  },
  JWT_SECRET,
  { expiresIn }
);

console.log('\n✅ JWT Token Generated Successfully!\n');
console.log('Token:');
console.log(token);
console.log('\n' + '='.repeat(80));
console.log('HOW TO USE THIS TOKEN:');
console.log('='.repeat(80));
console.log('\n1. Set as environment variable in your terminal:');
console.log(`   export JWT_TOKEN="${token}"\n`);
console.log('2. Or use directly in curl commands:');
console.log(`   curl -H "Authorization: Bearer ${token}" http://localhost:5001/api/fitness/...`);
console.log('\n' + '='.repeat(80));
console.log('TOKEN DETAILS:');
console.log('='.repeat(80));
console.log(`User ID: ${userId}`);
console.log(`Expires In: ${expiresIn}`);
console.log(`Algorithm: HS256`);

// Decode to show payload
const decoded = jwt.decode(token);
console.log('\nPayload:');
console.log(JSON.stringify(decoded, null, 2));
console.log();
