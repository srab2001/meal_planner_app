#!/usr/bin/env node
/**
 * Test Fitness Routes - Full Integration Test
 */

require('dotenv').config();
const express = require('express');
const fitnessRoutes = require('./fitness/backend/routes/fitness');

const app = express();
app.use(express.json());

// Mock auth - each request gets a fresh user ID to test isolation
let requestCount = 0;
const { v4: uuidv4 } = require('uuid');
app.use((req, res, next) => {
  req.user = {
    id: uuidv4(),  // Use valid UUID format
    email: `test${++requestCount}@example.com`
  };
  console.log(`\n📍 Request #${requestCount}: ${req.method} ${req.path}`);
  console.log(`   User: ${req.user.email} (${req.user.id})`);
  next();
});

// Mount fitness routes
app.use('/api/fitness', fitnessRoutes);

const PORT = 5001;
const server = app.listen(PORT, () => {
  console.log(`\n✅ FITNESS ROUTES TEST SERVER STARTED`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Neon Database: neondb (fitness_app)`);
  console.log(`   Ready for testing...\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Server interrupted...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
